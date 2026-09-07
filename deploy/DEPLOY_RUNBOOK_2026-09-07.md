# M-AIDA — Runbook triển khai production (07/09/2026)

Bộ kit này đi kèm bộ vá bảo mật 07/09. Sau khi vá, **`MAIDA_API_KEY` là bắt buộc** —
không đặt thì các route ghi trả 503. Topology: chỉ **Caddy** ra internet (80/443, TLS +
Basic auth); frontend và backend nằm mạng nội bộ. Đã kiểm `docker compose config` hợp lệ:
chỉ Caddy có cổng public.

## ⛔ Trước khi deploy — hai cổng chặn (đọc trước)
1. **Cổng chất lượng Phase 5 của chị:** κ ≥ 0.70 trên B3 ICR (mốc B3: 21/09, 28/09). Chưa đạt thì chưa deploy production.
2. **Cây mã:** xác nhận đã gộp Phase 1 (A1/A2/A3) và bộ vá bảo mật 07/09 vào nhánh sẽ deploy. Cây 25/08 chưa có Phase 1.

## Yêu cầu
- Một host Linux có Docker + Docker Compose.
- Một tên miền trỏ về host (để Caddy tự lấy chứng chỉ TLS).

## Các bước (mỗi bước xác nhận rồi mới sang bước sau)

### 1. Lấy mã
```bash
git clone https://github.com/thuyhuongctu/M-AIDA.git && cd M-AIDA
# (hoặc git pull nếu đã có)
```

### 2. Secrets — `backend/.env`
```bash
cp backend/.env.production.example backend/.env
```
Đặt trong `backend/.env`:
- `MAIDA_API_KEY=` → dùng khoá đã sinh sẵn (gửi riêng), hoặc tự sinh:
  `python -c "import secrets; print(secrets.token_urlsafe(36))"`
- `LLM_API_KEY=` và `LLM_MODEL=` → khoá + model của chị (cần cho trích xuất; thiếu thì /api/extract trả 503, phần khác vẫn chạy).
> ⚠️ Tự tay đặt khoá — đừng để tôi (Claude) nhập giúp; đây là ranh giới an toàn.

### 3. `deploy/Caddyfile` — tên miền + mật khẩu
```bash
caddy hash-password --plaintext 'MAT-KHAU-MANH-CUA-BAN'   # copy chuỗi hash
```
Sửa hai chỗ trong `deploy/Caddyfile`: đổi `maida.example.com` thành tên miền thật; dán hash vào chỗ `REPLACE_WITH_HASH`.

### 4. Preflight (không đổi gì, chỉ kiểm)
```bash
bash deploy/preflight.sh
```
Phải thấy: `.env OK` → `Caddyfile OK` → `tests OK` (63) → `compose OK` → PREFLIGHT PASSED.

### 5. Chạy
```bash
docker compose -f docker-compose.prod.caddy.yml up -d --build
```

### 6. Kiểm sau khi lên
```bash
curl -u pi:MAT-KHAU https://TEN-MIEN/api/health          # -> {"status":"ok",...}
# thử cổng ghi bị khoá đúng cách:
curl -s -o /dev/null -w "%{http_code}\n" -X POST https://TEN-MIEN/api/studies/x/lock -u pi:MAT-KHAU
#   -> 401 nếu thiếu X-MAIDA-Key; -> 404 nếu có khoá đúng (qua cổng, study không có)
```

## Cập nhật / rollback
```bash
git pull && docker compose -f docker-compose.prod.caddy.yml up -d --build   # cập nhật
docker compose -f docker-compose.prod.caddy.yml down                        # dừng
```

## Việc của chị, không phải của tôi
- Nhập `MAIDA_API_KEY` / `LLM_API_KEY` vào `.env` và Caddyfile.
- `git push` / gắn tag release.
- Bấm lệnh `up` để deploy thật.
Tôi chuẩn bị và kiểm tới mức deploy chỉ còn một lệnh; cú bấm là của chị.
