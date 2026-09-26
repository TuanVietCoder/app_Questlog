# ⚔️ QuestLog — Nhật ký mạo hiểm

App quản lý thời gian kiểu RPG cho Windows (Electron). Widget Pet ghim trên màn hình + bảng điều khiển.

## Cài đặt / chạy
- Cài: chạy `dist\QuestLog-Setup-1.0.0.exe` (cài cho user hiện tại, tạo shortcut Desktop + Start Menu). Chạy thử từ mã nguồn: `npm start`.
- Build lại bộ cài: `npm run dist`. Nếu lỗi "Cannot create symbolic link" ở winCodeSign: giải nén tay file `.7z` trong `%LOCALAPPDATA%\electron-builder\Cache\winCodeSign\` vào thư mục `winCodeSign-2.6.0` cạnh đó (bỏ qua 2 lỗi symlink darwin) rồi build lại.
- Máy đang dùng Node 18 nên ghim Electron 38 + electron-builder 25.1.8 (bản mới hơn cần Node 22).
- Lần chạy đầu app tự đăng ký **khởi động cùng Windows** (tắt trong Cài đặt hoặc khay hệ thống).
- Đóng bảng điều khiển thì app vẫn chạy nền ở khay hệ thống (icon slime). Thoát hẳn: chuột phải icon → Thoát.

## Phím tắt (đổi được trong Cài đặt)
| Phím | Tác dụng |
|---|---|
| `Ctrl+Shift+T` | Ô thêm nhanh giữa màn hình → vào Danh sách chờ |
| `Ctrl+Shift+G` | Bật/tắt xuyên chuột cho widget |
| `Ctrl+Shift+H` | Ẩn/hiện widget |

Cú pháp ô thêm nhanh: `Viết báo cáo #tt !3 @17:30`
`#tt/#tc/#st/#tn` = Trí tuệ/Thể chất/Sáng tạo/Tinh thần · `!1..!3` độ khó · `@nay` `@tuan` `@tuansau` · `@HH:MM` hạn giờ.

## Luật chính
- Nhiệm vụ ★/★★/★★★: +10/25/50 EXP, +5/12/25 vàng, +1/2/3 điểm kỹ năng. Trễ hạn: −5 HP × độ khó, thưởng còn 50%.
- Tập trung: EXP = phút × 2 × combo (tối đa x2) × vũ khí. Bỏ dở: −10 HP, mất combo.
- Boss tuần = tổng nhiệm vụ gắn vào tuần. Dọn sạch trước 23:59 CN → 👑 Rương Hoàng Kim. Không kịp: −15 HP, việc tồn dồn sang tuần sau.
- Điểm danh khi đủ số nhiệm vụ/ngày → giữ chuỗi 🔥. HP về 0: mất chuỗi (không có chuỗi thì mất 30% EXP).
- Nhiệm vụ ẩn xuất hiện ngẫu nhiên 8h–23h, làm trong 5 phút → buff x1.5 EXP 1 giờ.
- 🧊 Băng Giá: dời mọi deadline 24h, chặn phạt, giữ chuỗi.

## Pet & hằng ngày (v1.1)
- 6 loài Pet (Slime, Mèo, Thỏ, Cú, Ma Nhí, Rồng Con), mỗi loài một nội tại; 11 skin; 6 phụ kiện. Tab 🐾 Pet: rê chuột lên đồ để thử trước.
- Pet liếc theo chuột, tò mò khi chuột lại gần, vui khi rê lên, ngủ gật khi máy không có thao tác 90 giây, bấm để vuốt ve (chọc liên tục sẽ bực), tự nói chuyện và phản ứng khi xong nhiệm vụ / bị phạt / lên cấp.
- Pet đói 4%/giờ; độ no ≥25% thì mỗi bậc thân thiết +3% EXP. Thân thiết tăng khi vuốt ve (tối đa 15/ngày), cho ăn, xong nhiệm vụ, tập trung.
- Tab 🎁 Hằng ngày: quà đăng nhập vòng 7 ngày, 3 nhiệm vụ ngày ngẫu nhiên (xong cả 3 thưởng thêm rương), 19 thành tựu. Nhiệm vụ có 12% chí mạng x2 vàng.

## Tương tác & nhắc nhở (v1.2)
- Kéo file/thư mục thả vào Pet (widget, thẻ nhân vật, phòng Pet) → Pet ăn → file vào **Thùng rác** (lấy lại được). Từ chối ổ không có Thùng rác (USB, ổ mạng), thư mục hệ thống, thư mục của app. Tắt trong Cài đặt → Pet.
- Nhấp đúp Pet: nhào lộn · rê chuột qua lại: cù lét · đứng chuột lâu: Pet ngại · chọc lúc Pet ngủ: Pet cáu.
- Pet tự nhắc việc thật (trễ hạn, sắp tới hạn, quà chưa nhận, boss…), than chán khi lâu không làm gì. Nhắc hệ thống mỗi 90 phút khi còn việc hôm nay. Tắt bắt chuyện trong Cài đặt → Pet.

## Nhiều người dùng & trạng thái (v1.3)
- Mỗi người một hồ sơ riêng (nhân vật, Pet, nhiệm vụ, cài đặt). App tự đổi người theo lịch; đổi tay bằng nút 👤 trên widget, menu khay hệ thống (chuột phải icon → 👤 Người dùng), ô chọn ở thẻ nhân vật hoặc Cài đặt → Người dùng.
- Chọn **trạng thái** (📚 học · 💼 làm việc · 🌐 online · 🚶 đi chơi · 🏃 tập · 🏠 nghỉ) ở widget (nút ❔) hoặc tab Nhiệm vụ → nhiệm vụ ẩn và gợi ý nhiệm vụ đổi cho hợp.
- **Nhiệm vụ lặp lại** theo ngày trong tuần + khung giờ (tab Nhiệm vụ, cuối trang); 🔒 giữ máy cho người đó tới khi xong.
- **Nhắc uống nước** mỗi N phút (Cài đặt → Mục tiêu), bấm "Đã uống" nhận thưởng.

## Học tập & thời tiết (v1.4)
- **Tiếng Trung**: 390 từ HSK 4–5 (13 chủ đề) trong `data/vocab-zh.js`; mỗi ngày N từ (Cài đặt → Học tập), xem ở tab 🎁 Hằng ngày (có nút che nghĩa để tự kiểm tra), bấm "Đã thuộc" nhận EXP, chưa thuộc thì hôm sau học lại. Pet đọc từ hôm nay, đố lại khi đã học.
- **Tiếng Anh B1**: mỗi ngày một gợi ý luyện + nút "Đã luyện". **Tin học cơ bản**: nhắc hiếm (1–2 tuần/lần).
- **Thời tiết** (Open-Meteo, mặc định TP. Hồ Chí Minh, đổi trong Cài đặt): hiện ở HUD / widget / tab Hằng ngày; nhắc áo mưa, nước ấm, chống nắng, áo ấm… mỗi loại 1 lần/ngày.

## Giao diện gọn (v1.5)
- Thanh bên gộp 3 nhóm bấm để mở: 🗡️ Hôm nay · 🐱 Pet & nhân vật · 🏆 Tiến độ, cộng ⚙️ Cài đặt.
- Tab Nhiệm vụ: 1 ô thêm nhanh (⚙ để chọn nhánh/độ khó/hạn), chọn danh sách Hôm nay / Tuần này / Tuần sau / Chờ / Xong, bấm vòng tròn để hoàn thành, ⋯ để chuyển/xóa/tập trung.
- Widget đang xuyên chuột vẫn bấm được nút 👻 để tắt.
- Hồ sơ bật chế độ khen (`sweet`): Pet hỏi han có nút trả lời, khen và phản ứng nhiều hơn.

## Lịch học (v1.6)
- Tab 📅 Lịch học (nhóm Hôm nay): buổi học theo ngày (tiết, giờ, phòng/Zoom, giảng viên), đánh dấu tạm ngưng, thêm buổi, chỉnh giờ các tiết.
- Ngày có tiết: tóm tắt buổi sáng, nhắc trước 60 & 10 phút, tự tạo nhiệm vụ 🏫 (tick để nhận EXP, quên tick không bị phạt), widget hiện giờ học kế tiếp.

## Giao việc bằng câu chữ (v1.7)
- Ô "Thêm nhiệm vụ" hiểu câu tự nhiên, hiện ngay kết quả dự đoán dưới ô: VD "nay thầy giao bài tập code môn nguyên cứu khoa học" → **Bài tập code môn Phương pháp nghiên cứu khoa học** · Trí tuệ ★★ · hạn = buổi học tới của môn. Muốn chọn tay thì chỉnh trong ⚙.
- Khung ✨ Giao nhiều việc: dán đoạn văn (mỗi dòng một việc), mở hoặc kéo thả file .txt → xem trước, sửa tên, bỏ chọn → Nhận hết.
- Hiểu được: tên môn (gõ sai / viết tắt NCKH, CNPM), loại việc (bài tập, code, báo cáo, thi, thuyết trình, đọc, thể dục…), hạn (25/9, thứ 6, mai, ngày kia, cuối tuần, trong 3 ngày, tuần sau, lúc 7h30…).

## Tự nhận trạng thái (v1.8)
- App tự xem phần mềm đang ở cửa sổ trên cùng (5 giây/lần) và đổi trạng thái sau khoảng 1 phút dùng ổn định: Word, PowerPoint, Excel, VS Code… → 💼 Đang làm việc; Zoom, Teams, trang học (LMS, Classroom…) → 📚 Đang học; Steam, Liên Minh, Valorant, game trong thư mục Steam/Epic/Riot… → 🎮 Đang chơi game (chơi 1 tiếng Pet nhắc nghỉ); Facebook, YouTube, Zalo… → 🌐 Đang online; Spotify, VLC → 🏠 Nghỉ ngơi.
- Trạng thái tự nhận có dấu 🤖 và tên phần mềm. Bấm chọn tay → app nghỉ tự nhận 1 giờ (nút "🤖 Để app tự nhận" để bật lại ngay).
- Tắt trong Cài đặt › Pet & trạng thái. App không lưu tiêu đề cửa sổ, chỉ lưu tên phần mềm.

## Lịch làm (v1.9)
- Tab 📅 Lịch học & làm hiện cả ca làm / trợ giảng (thẻ vàng 💼, theo giờ). Thêm tay: điền "hoặc giờ" và tick "💼 Lịch làm".
- Ngày có ca: tóm tắt buổi sáng, nhắc trước 60 phút "N phút nữa vào Ca 1", nhiệm vụ 💼 (không phạt), vào ca → trạng thái Đang làm việc.

## Thời khóa biểu tuần / tháng (v1.10)
- Tab 📅 Lịch học & làm › **🗓️ Tuần** / **📆 Tháng**: gộp lịch học, ca làm, trợ giảng, nhiệm vụ lặp lại, việc có giờ và hạn chót vào một bảng.
- Khoảng trống ≥ 1 giờ (06:00–23:00) tô viền xanh và ghi giờ; mỗi ngày ghi tổng giờ trống ("kín lịch" nếu hết chỗ). Nút ‹ Hôm nay › để chuyển tuần/tháng; bấm một ngày trong Tháng để xem tuần đó. Rê chuột lên mục để xem chi tiết.

## Nhiệm vụ ngẫu nhiên theo lịch (v1.11)
- Mỗi ngày có lịch học / làm, app tự giao 3 nhiệm vụ 🎲 quanh lịch: chuẩn bị trước giờ học hoặc vào ca, ôn bài / giãn cơ sau đó, tận dụng giờ trống (có khi là làm bài môn sắp học). Không bị phạt nếu quên, qua ngày tự dọn. Tắt ở Cài đặt › Học tập.
- Sửa hào quang sau Pet: là quầng sáng mờ, không còn hình tròn màu đặc.

## Pet tiến hóa & giao diện mới (v1.12)
- 13 loài Pet (thêm Hamster Cà Chua, Robo Nhai File, Ếch Lá Sen, Rùa Đồng Hồ, Gấu Trúc Thư Pháp, Bạch Tuộc Đa Nhiệm, Cá Chép Vượt Vũ Môn), mỗi loài có nội tại riêng.
- Pet lên cấp theo EXP bạn kiếm được. Lv 5 chọn 1 trong 2 hệ (🔥 Hỏa, 💧 Thủy, 🌿 Mộc, ⚡ Lôi, 🌙 Nguyệt) → hình dạng + kỹ năng mới; Lv 15 tiến hóa lần 2; Lv 30 Thức Tỉnh ★ (kỹ năng ×1.5). Mỗi loài nuôi cấp riêng. Xem cây tiến hóa ở tab Pet.
- 12 phụ kiện mới vẽ tay, đeo cùng lúc 3 chỗ: đầu (nón lá, mũ len, mũ lưỡi trai, bờm tai mèo, mầm non, kẹp sao) · mặt (kính mọt sách, kính tim) · cổ (nơ, chuông, khăn quàng, huy chương).
- Giao diện gọn, phẳng, bo tròn, màu tươi; nút bấm kiểu game mobile.

## Tác giả
Tuấn Việt · wannacry74123@gmail.com (báo lỗi, góp ý). Trong app: Cài đặt › Giới thiệu; menu khay hiện phiên bản & tác giả.

## Dữ liệu
`%APPDATA%\questlog\save.json` (ghi an toàn qua file tạm; file hỏng được giữ lại dạng `save.json.hong-*`).

## Kiểm tra luật chơi
`node game.test.js`
