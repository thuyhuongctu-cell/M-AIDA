# La recherche, c'est ma passion

**Tác giả lời:** Đỗ Thùy Hương
**Ngôn ngữ:** tiếng Anh, xen tiếng Pháp (khối bridge và pre-chorus)
**Bản ghi trong kho nhạc:**

| Bản | Tệp | Thời lượng | Bitrate |
|---|---|--:|--:|
| Remix 1 | `assets/maida_song_la_recherche_remix1.mp3` | 4:49 | 183 kbps |
| Remix 2 | `assets/maida_song_la_recherche_remix2.mp3` | 4:49 | 186 kbps |
| Remix 3 | `assets/maida_song_la_recherche_remix3.mp3` | 4:49 | 183 kbps |

Ba bản ghi có cùng độ dài đến từng mili giây (289,728 s, cùng 12.073 khung MPEG-1
Layer III ở 48 kHz) nhưng khác dữ liệu, tức là ba lần kết xuất của cùng một bản
phối chứ không phải ba bản dựng khác nhau. Vì vậy chúng được xếp là "remix 1",
"remix 2" và "remix 3" thay vì "bản gốc" và các bản phối: kho nhạc hiện chưa có
bản gốc của bài này.

Remix 3 nhận ngày 22/08/2026, thẻ ID3 ghi tiêu đề *La recherche c'est ma passion
(Remix) (Remix)* và dấu thời gian tạo 01/08/2026. Bản này trùng bitrate với
remix 1 nhưng khác nội dung tệp (md5 `7cf2d79a7a15…` so với `2466ea4ceb9d…`),
nên là một lần kết xuất riêng chứ không phải bản chép lại.

## Cấu trúc

Intro (nhịp tim 76 bpm, synth pad điện tử thưa) · Verse 1 (120 bpm) ·
Pre-Chorus (tiếng Pháp) · Chorus (electro-pop anthem) ·
Verse 2 (219 bpm, glitch pop, tiếng cảnh báo y tế) ·
Extended Verse (128 bpm) · Industrial Tech-Break ·
Bridge (hai giây im lặng, rồi spoken-word tiếng Pháp) ·
Final Chorus (mật độ âm thanh tối đa, bè hợp xướng) ·
Outro (chậm về 76 bpm, nhịp tim mờ dần).

Bài hát kể lại tuyến thời gian của chương trình nghiên cứu, thạc sĩ 2021,
meta-analysis trên dữ liệu WBES, giai đoạn tại Trường Kinh tế Đại học Cần Thơ,
đến khi M-AIDA thành hình năm 2026, và giữ nguyên luận điểm trung tâm của
dự án: mô hình đề xuất, con người quyết định.

## Trạng thái phần lời trên trang

`songs.html` chạy khối lời đồng bộ (`.lblk`) cho bản được đánh dấu `lyr:true`
trong mảng `TRACKS`; hiện chỉ tác phẩm chính mang cờ này. Muốn hiện lời cho bài
này thì phải tách phần lời thành từng bộ theo bài rồi chọn bộ theo bản đang
phát, chứ không chỉ thêm khối mới vào trang. Đây là việc UI riêng, chưa làm
trong lần cập nhật này; ba bản ghi đã phát được bình thường trong danh sách và
tự chuyển sang bài kế tiếp khi kết thúc.

## Bản được làm nổi bật trên trang

Remix 3 mang cờ `feat:true` trong mảng `TRACKS` của `songs.html`. Cờ đó chi phối
hai chỗ hiển thị, cả hai đều dựng bằng script từ đúng bản ghi ấy nên không có
chuỗi nào bị chép hai nơi: thẻ "Bản mới nhất" đặt trên đầu danh sách bản thu, và
nhãn "mới" kèm viền vàng trên dòng tương ứng trong danh sách. Muốn chuyển sang
làm nổi bật bản khác thì dời cờ `feat` (và `cover`, nếu muốn đổi ảnh) sang bản
đó; bỏ cờ khỏi mọi bản thì thẻ nổi bật tự biến mất, trang vẫn chạy như cũ.

Tác phẩm chính của trang vẫn là *The Heartbeat of M-AIDA*: khối lời đồng bộ, đĩa
xoay và nút "Nghe tác phẩm chính" ở đầu trang không bị đụng tới.

## Ghi chú bản quyền

Phần lời và ba bản ghi thuộc quyền tác giả của Đỗ Thùy Hương, phát hành cùng dự
án M-AIDA. Xem `LICENSE` và `COMMERCIAL-LICENSE.md` cho điều kiện sử dụng lại.
