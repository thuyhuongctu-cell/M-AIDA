# The Scholar's Final Say

**Tác giả lời:** Đỗ Thùy Hương
**Ngôn ngữ:** tiếng Anh
**Bản ghi trong kho nhạc:**

| Bản | Tệp | Thời lượng | Bitrate |
|---|---|--:|--:|
| Bản gốc | `assets/maida_song_scholars_final_say.mp3` | 3:20 | 181 kbps |
| Remix | `assets/maida_song_scholars_final_say_remix.mp3` | 3:26 | 180 kbps |
| Bản 6 | `assets/maida_song_scholars_final_say_v6.mp3` | 3:26 | 180 kbps |
| Bản 7 | `assets/maida_song_scholars_final_say_v7.mp3` | 3:20 | 181 kbps |

Bản 6 và bản 7 nhận ngày 22/08/2026, giữ đúng cách đánh số của tác giả trong tên
tệp gốc (`The_Scholars_Final_Say_6`, `_7`) thay vì đặt tên mới, để lần sau đối
chiếu với kho tệp cá nhân không phải đoán.

## Bốn bản ghi nhưng chỉ hai bản phối

Đọc khung MPEG cho thấy bốn tệp chia thành hai cặp trùng nhau đến từng mili giây:

| Cặp | Thời lượng | Các bản |
|---|--:|---|
| Bản phối ngắn | 200,328 s | bản gốc, bản 7 |
| Bản phối dài | 206,232 s | remix, bản 6 |

Trong mỗi cặp, hai tệp trùng cả thời lượng lẫn bitrate nhưng **khác dữ liệu**
(md5 khác nhau, dung lượng khác nhau), tức là hai lần kết xuất của cùng một bản
phối chứ không phải hai bản dựng khác nhau. Đây đúng kiểu đã gặp ở
`la-recherche-lyrics.md`.

Hệ quả cần biết khi trích dẫn: kho nhạc hiện có **bốn tệp** của bài này nhưng chỉ
**hai bản phối**. Đừng đếm bốn tệp thành bốn tác phẩm.

| Bản | md5 (12 ký tự đầu) | Dung lượng |
|---|---|--:|
| Bản gốc | `78d80923c60b` | 4.534.680 B |
| Bản 7 | `93b548d0f4d8` | 4.568.244 B |
| Remix | `b699c131b1f9` | 4.647.216 B |
| Bản 6 | `94e92abb4607` | 4.677.971 B |

## Về việc làm nổi bật trên trang

Bản 6 mang cờ `feat:true` trong mảng `TRACKS` của `songs.html`. Cờ đó chi phối
hai chỗ hiển thị, cả hai đều dựng bằng script từ đúng bản ghi ấy nên không có
chuỗi nào bị chép hai nơi rồi lệch nhau về sau:

- thẻ "Bản mới nhất" đặt trên đầu danh sách bản thu, có ảnh bìa riêng lấy từ
  trường `cover`, nút phát đổi biểu tượng theo trạng thái và dùng chung
  `marktracks()` với danh sách;
- nhãn "mới" kèm viền vàng trên dòng tương ứng trong danh sách.

Trang chỉ có một chỗ nổi bật: script lấy bản **đầu tiên** mang cờ. Muốn chuyển
sang bản khác thì dời cờ `feat` (và `cover`, nếu muốn đổi ảnh) sang bản đó; bỏ cờ
khỏi mọi bản thì thẻ nổi bật tự biến mất và trang chạy như cũ.

Tác phẩm chính của trang vẫn là *The Heartbeat of M-AIDA*: khối lời đồng bộ, đĩa
xoay và nút "Nghe tác phẩm chính" ở đầu trang không bị đụng tới.

## Trạng thái phần lời trên trang

`songs.html` chạy khối lời đồng bộ (`.lblk`) cho bản được đánh dấu `lyr:true`
trong mảng `TRACKS`; hiện chỉ tác phẩm chính mang cờ này. Muốn hiện lời cho bài
này thì phải tách phần lời thành từng bộ theo bài rồi chọn bộ theo bản đang phát,
chứ không chỉ thêm khối mới vào trang. Đây là việc UI riêng, chưa làm trong lần
cập nhật này; bốn bản ghi đã phát được bình thường trong danh sách và tự chuyển
sang bài kế tiếp khi kết thúc.

## Ghi chú bản quyền

Phần lời và bốn bản ghi thuộc quyền tác giả của Đỗ Thùy Hương, phát hành cùng dự
án M-AIDA. Xem `LICENSE` và `COMMERCIAL-LICENSE.md` cho điều kiện sử dụng lại.
