# Dấu bản đồ Việt Nam (vnmark) — nguồn gốc từng thành phần

Tài liệu này ghi lại thành phần nào của hình do ai tạo ra và tạo bằng cách nào.
Viết ra vì trước đó **không có bất kỳ ghi chép nào** về nguồn gốc phần hình ảnh:
`IP_REGISTER.md` chỉ đăng ký phần mềm, còn `AI_USE_DISCLOSURE.md` chỉ nói về mô
hình ngôn ngữ trong quy trình trích xuất dữ liệu.

**Đọc mục "Điểm cần làm rõ trước khi nộp hồ sơ" ở cuối trước khi dùng hình này
cho bất kỳ đơn đăng ký nào.**

## Tệp trong thư mục

| Tệp | Nội dung | Ghi chú |
|---|---|---|
| `vnmark.svg` | Toàn bộ tác phẩm, tự chứa đủ | Hai nhân vật nhúng base64 |
| `figure-huong.webp` | Nhân vật nữ, 413×615, RGBA | Tách ra để xem riêng |
| `figure-advisor.webp` | Nhân vật nam, 40×120, RGBA | Tách ra để xem riêng |

`vnmark.svg` giữ hai nhân vật ở dạng base64 chứ không trỏ sang hai tệp `.webp`
bên cạnh. Lý do: khi một SVG được mở qua thẻ `<img>`, trình duyệt chặn mọi tham
chiếu ra ngoài, nên bản dùng tham chiếu sẽ hiện bản đồ mà **mất cả hai nhân
vật** — không dùng làm ảnh nộp kèm hồ sơ được. Đã kiểm cả hai cách trên
Chromium. Hai tệp `.webp` để xem và đối chiếu riêng, không phải để `vnmark.svg`
gọi tới.

## Thành phần và nguồn gốc

### 1. Hình học bản đồ — SVG viết tay

Đường bờ (1 `polygon`), hai cụm quần đảo (28 `circle`), các dấu mốc (6 `path`,
5 `rect`, 1 `ellipse`), ngôi sao vàng. Tổng 60 phần tử.

Đây là toạ độ viết thẳng trong mã nguồn, không phải xuất từ phần mềm bản đồ hay
tô lại từ ảnh có sẵn. Phần này là kết quả lao động tạo hình trực tiếp trong dự
án.

### 2. Hai hình nhân vật 3D — **do AI tạo**

Đây là điểm quan trọng nhất của tài liệu này.

Lịch sử kho ghi rõ hai hình này là ảnh dựng bằng AI, không phải hình vẽ tay:

| Commit | Ngày | Thông điệp |
|---|---|---|
| `cc6606d` | 2026-07-20 | *"feat(web): **AI 3D renders** on personal page (huong.html)"* |
| `bea5d7c` | 2026-07-20 | *"feat(web): high-quality **3D Huong renders** for hero, guide and demo"* — thân commit ghi *"Pixar-style 3D renders of the author"*, *"Cutouts produced from the author's supplied renders"* |
| `6996617` | 2026-07-19 | *"fix(web): remove residual Vietnam flag from remaining cartoon figures"* — *"Cleanly inpaint the small flag badge"* |

Từ đó rút ra ba việc đã diễn ra: **(a)** ảnh gốc do một công cụ sinh ảnh AI tạo
ra từ hình mẫu của tác giả; **(b)** ảnh được tách nền thủ công thành PNG trong
suốt; **(c)** một chi tiết lá cờ được xoá bằng inpaint.

Điều mà lịch sử kho **không** ghi lại: dùng công cụ sinh ảnh nào, phiên bản nào,
ngày nào, và điều khoản dịch vụ của công cụ đó nói gì về quyền với ảnh đầu ra.
Không suy đoán thay ở đây — cần tác giả tự xác nhận.

### 3. Bố cục

Vị trí đặt hai nhân vật trên bản đồ, kích thước tương đối, vị trí ngôi sao và
các dấu mốc, bảng màu. Phần này là lựa chọn tạo hình trong dự án.

## Ba bản khác nhau đang tồn tại

Không có "một bản gốc duy nhất" trong kho — ba trang mang ba biến thể:

| Trang | `viewBox` | Có nhân vật? |
|---|---|---|
| `index.html` | `-12 -46 604 650` | có, hai hình |
| `commercial.html` | `0 0 432 588` | không |
| `data_melody.html` | — | không |

`vnmark.svg` tách ra từ bản của `index.html` vì đó là bản đầy đủ nhất.

Trên trang, hình được đặt độ mờ thấp và tô theo `currentColor` nên trông nhạt;
tệp tách ra giữ nguyên màu thật của tác phẩm, vì vậy lá cờ hiện màu đỏ đậm hơn
so với khi xem trên web. Cùng một tác phẩm, khác cách hiển thị.

## Điểm cần làm rõ trước khi nộp hồ sơ

Đơn đăng ký quyền tác giả buộc phải khai ai là tác giả. Bốn việc dưới đây cần
tác giả tự xác định, không ai xác định thay được:

1. **Hai nhân vật do công cụ AI nào tạo, ngày nào.** Điều khoản của công cụ nói
   gì về quyền đối với ảnh đầu ra, và có cho dùng thương mại không.
2. **Phần đóng góp của con người vào hai hình đó** có đủ để cấu thành sáng tạo
   hay không — tách nền và inpaint là xử lý kỹ thuật, thường không được coi là
   sáng tạo tạo hình.
3. **Cân nhắc nộp phần chắc chắn.** Hình học bản đồ và bố cục là lao động tạo
   hình trong dự án. Nếu phần nhân vật còn vướng, có thể nộp bản **không có
   nhân vật** — `commercial.html` đã sẵn một bản như vậy.
4. **Thể hiện lãnh thổ.** Bản đồ có hai cụm quần đảo; việc thể hiện chủ quyền
   trên bản đồ chịu quy định riêng, nên rà lại cho chuẩn trước khi nộp.

## Không phải tư vấn pháp lý

Tài liệu này chỉ ghi lại sự thật kiểm chứng được từ kho mã và từ chính các tệp.
Việc hình này có được bảo hộ như tác phẩm mỹ thuật ứng dụng hay không, và nên
đăng ký theo hình thức nào, cần hỏi người hành nghề luật sở hữu trí tuệ.
