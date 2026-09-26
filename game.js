// Luật chơi QuestLog — JS thuần, dùng chung cho main process (Node) và giao diện (browser).
(function () {
const MIN = 6e4, HOUR = 36e5, DAY = 864e5;
// Từ vựng tiếng Trung (data/vocab-zh.js): Node require, trình duyệt nạp <script> trước game.js (quick.html không cần).
const VOCAB = typeof module !== 'undefined' ? require('./data/vocab-zh.js') : (window.VOCAB_ZH || []);
// Gợi ý luyện tiếng Anh B1, mỗi ngày một mục (xoay vòng).
const EN_TIPS = [
  'Nghe 1 bài Listening B1 (15 phút), ghi lại từ mới', 'Học 10 từ vựng B1 theo chủ đề (gia đình, công việc, du lịch…)',
  'Viết 1 email ngắn 100–120 từ (mời / cảm ơn / xin lỗi)', 'Làm 1 bài Reading, gạch chân từ khóa trước khi chọn đáp án',
  'Nói 2 phút về một chủ đề quen thuộc, tự ghi âm rồi nghe lại', 'Ôn 1 điểm ngữ pháp: hiện tại hoàn thành / câu điều kiện loại 1–2',
  'Làm 1 phần đề thi thử B1, bấm giờ như thi thật', 'Xem 1 video tiếng Anh 10 phút với phụ đề tiếng Anh',
  'Học 5 cụm động từ (phrasal verbs) thông dụng và đặt câu', 'Viết 1 đoạn 120 từ kể về một trải nghiệm đáng nhớ',
];
// Giờ bắt đầu tiết 1…16 (HUIT: tiết 50 phút, ca 6h30 · 9h30 · 12h30 · 15h30 · 18h30 theo báo 2025) — sửa được trong tab Lịch học.
const PERIODS = ['06:30', '07:20', '08:10', '09:30', '10:20', '11:10', '12:30', '13:20', '14:10', '15:30', '16:20', '17:10', '18:30', '19:20', '20:10', '21:00'];
const IT_TIPS = [
  'Nhớ ôn & đăng ký thi chứng chỉ tin học cơ bản (Ứng dụng CNTT cơ bản) nha!',
  'Chứng chỉ tin học cơ bản: ôn Word, Excel, PowerPoint, Internet — đã xem lịch thi của trường chưa?',
  'Tranh thủ luyện Excel (SUM, IF, VLOOKUP…) cho kỳ thi tin học cơ bản nhé!',
];

const CATS = {
  int: { name: 'Trí tuệ', icon: '📘', color: '#5aa9ff', perk: '+5% EXP mọi nguồn / bậc' },
  str: { name: 'Thể chất', icon: '💪', color: '#ff6b5a', perk: '+10 HP tối đa / bậc' },
  cre: { name: 'Sáng tạo', icon: '🎨', color: '#c77dff', perk: '+5% vàng / bậc' },
  spi: { name: 'Tinh thần', icon: '🧘', color: '#5ee6a8', perk: '−10% sát thương phạt / bậc' },
};
const DIFF = [null,
  { name: 'Dễ', exp: 10, gold: 5, dmg: 1 },
  { name: 'Vừa', exp: 25, gold: 12, dmg: 2 },
  { name: 'Khó', exp: 50, gold: 25, dmg: 4 }];
const TIERS = [5, 15, 30, 60, 100];
const NODES = {
  int: ['Tò Mò', 'Ham Học', 'Uyên Bác', 'Thông Thái', 'Toàn Tri'],
  str: ['Khởi Động', 'Bền Bỉ', 'Cường Tráng', 'Thép Nguội', 'Bất Hoại'],
  cre: ['Phác Thảo', 'Ý Tưởng', 'Đột Phá', 'Kiệt Tác', 'Sáng Thế'],
  spi: ['Tĩnh Tâm', 'Kỷ Luật', 'Kiên Định', 'Minh Triết', 'Giác Ngộ'],
};
const CLASSES = {
  int: ['Học Đồ', 'Pháp Sư', 'Đại Pháp Sư', 'Hiền Triết'],
  str: ['Tân Binh', 'Chiến Binh', 'Hiệp Sĩ', 'Chiến Thần'],
  cre: ['Thợ Học Việc', 'Nghệ Nhân', 'Thi Sĩ', 'Đại Tạo Hóa'],
  spi: ['Sơ Tâm', 'Tu Sĩ', 'Thiền Sư', 'Giác Giả'],
};
const SHOP = [
  { id: 'potion', kind: 'use', icon: '🧪', name: 'Bình Máu', price: 80, desc: 'Hồi 50 HP' },
  { id: 'freeze', kind: 'use', icon: '🧊', name: 'Băng Giá', price: 300, desc: 'Đóng băng 24h: dời mọi deadline +24h, giữ streak, không mất máu' },
  { id: 'chest', kind: 'use', icon: '📦', name: 'Rương Gỗ', price: 150, desc: '50–200 vàng, có cơ hội ra Bình Máu / Băng Giá' },
  { id: 'relic', kind: 'use', icon: '👑', name: 'Rương Hoàng Kim', price: 0, desc: 'Chỉ rớt từ Boss tuần. Vàng lớn + đồ hiếm' },
  { id: 'meat', kind: 'use', icon: '🍖', name: 'Thịt Nướng', price: 40, desc: 'Pet no +35 · thân thiết +2' },
  { id: 'cake', kind: 'use', icon: '🍰', name: 'Bánh Kem', price: 120, desc: 'Pet no +70 · thân thiết +6' },
  { id: 'skin_default', kind: 'skin', icon: '🔵', name: 'Slime Băng Lam', price: 0, color: '#7dd3fc' },
  { id: 'skin_mint', kind: 'skin', icon: '🟢', name: 'Slime Bạc Hà', price: 200, color: '#6ee7b7' },
  { id: 'skin_sakura', kind: 'skin', icon: '🌸', name: 'Slime Anh Đào', price: 250, color: '#f9a8d4' },
  { id: 'skin_ember', kind: 'skin', icon: '🔥', name: 'Slime Hỏa Diệm', price: 450, color: '#fb923c' },
  { id: 'skin_void', kind: 'skin', icon: '🌌', name: 'Slime Hư Không', price: 900, color: '#8b5cf6', rare: true },
  { id: 'skin_gold', kind: 'skin', icon: '✨', name: 'Slime Hoàng Kim', price: 1800, color: '#facc15', rare: true },
  { id: 'skin_choco', kind: 'skin', icon: '🍫', name: 'Sô-cô-la', price: 300, color: '#b07d4f' },
  { id: 'skin_lime', kind: 'skin', icon: '🍈', name: 'Chanh Xanh', price: 300, color: '#bef264' },
  { id: 'skin_snow', kind: 'skin', icon: '❄️', name: 'Tuyết Trắng', price: 500, color: '#f1f5f9' },
  { id: 'skin_night', kind: 'skin', icon: '🌙', name: 'Đêm Trăng', price: 700, color: '#64748b' },
  { id: 'skin_rainbow', kind: 'skin', icon: '🌈', name: 'Cầu Vồng', price: 2800, color: '#f472b6', rare: true, anim: 'rainbow' },
  // short: tên ghép khi tiến hóa ("Mèo Sấm") · evo: 2 hệ được chọn ở Lv 5 (xem ELEMENTS)
  { id: 'pet_slime', kind: 'pet', icon: '💧', name: 'Slime', short: 'Slime', evo: ['fire', 'water'], price: 0, desc: 'Bạn đồng hành đầu tiên' },
  { id: 'pet_cat', kind: 'pet', icon: '🐱', name: 'Mèo Tò Mò', short: 'Mèo', evo: ['bolt', 'moon'], price: 600, desc: '+5% vàng' },
  { id: 'pet_hamster', kind: 'pet', icon: '🐹', name: 'Hamster Cà Chua', short: 'Hamster', evo: ['fire', 'leaf'], price: 700, desc: 'Bỏ dở tập trung lần đầu mỗi ngày không bị phạt' },
  { id: 'pet_bunny', kind: 'pet', icon: '🐰', name: 'Thỏ Bông', short: 'Thỏ', evo: ['leaf', 'moon'], price: 800, desc: '+15 HP tối đa' },
  { id: 'pet_trashbot', kind: 'pet', icon: '🤖', name: 'Robo Nhai File', short: 'Robo', evo: ['bolt', 'fire'], price: 800, desc: 'Mỗi file cho ăn +2 vàng (tối đa 20/ngày)' },
  { id: 'pet_frog', kind: 'pet', icon: '🐸', name: 'Ếch Lá Sen', short: 'Ếch', evo: ['water', 'leaf'], price: 900, desc: 'Nhiệm vụ ẩn thưởng thêm 20 vàng' },
  { id: 'pet_turtle', kind: 'pet', icon: '🐢', name: 'Rùa Đồng Hồ', short: 'Rùa', evo: ['water', 'leaf'], price: 1000, desc: 'Băng Giá rẻ hơn 30%' },
  { id: 'pet_owl', kind: 'pet', icon: '🦉', name: 'Cú Thông Thái', short: 'Cú', evo: ['moon', 'bolt'], price: 1200, desc: '+5% EXP mọi nguồn' },
  { id: 'pet_panda', kind: 'pet', icon: '🐼', name: 'Gấu Trúc Thư Pháp', short: 'Gấu Trúc', evo: ['leaf', 'moon'], price: 1400, desc: '+20% EXP khi học từ vựng / B1' },
  { id: 'pet_ghost', kind: 'pet', icon: '👻', name: 'Ma Nhí', short: 'Ma', evo: ['moon', 'fire'], price: 1600, desc: '−15% sát thương phạt', rare: true },
  { id: 'pet_octo', kind: 'pet', icon: '🐙', name: 'Bạch Tuộc Đa Nhiệm', short: 'Mực', evo: ['water', 'moon'], price: 1800, desc: '+15% vàng nhiệm vụ vào ngày có ca làm', rare: true },
  { id: 'pet_carp', kind: 'pet', icon: '🎏', name: 'Cá Chép Vượt Vũ Môn', short: 'Chép', evo: ['water', 'bolt'], price: 2400, desc: '+1% EXP mỗi ngày chuỗi (tối đa +10%)', rare: true },
  { id: 'pet_dragon', kind: 'pet', icon: '🐲', name: 'Rồng Con', short: 'Rồng', evo: ['fire', 'bolt'], price: 3000, desc: '+10% EXP khi tập trung', rare: true },
  { id: 'acc_bow', kind: 'acc', icon: '🎀', name: 'Nơ Hồng', price: 150, slot: 'head' },
  { id: 'acc_flower', kind: 'acc', icon: '🌸', name: 'Hoa Cài', price: 180, slot: 'head' },
  { id: 'acc_glasses', kind: 'acc', icon: '🕶️', name: 'Kính Ngầu', price: 300, slot: 'face' },
  { id: 'acc_tophat', kind: 'acc', icon: '🎩', name: 'Mũ Quý Ông', price: 450, slot: 'head' },
  { id: 'acc_phones', kind: 'acc', icon: '🎧', name: 'Tai Nghe', price: 500, slot: 'head' },
  { id: 'acc_crown', kind: 'acc', icon: '👑', name: 'Vương Miện', price: 2000, slot: 'head', rare: true },
  { id: 'acc_sprout', kind: 'acc', icon: '🌱', name: 'Mầm Non', price: 120, slot: 'head' },
  { id: 'acc_star', kind: 'acc', icon: '⭐', name: 'Kẹp Sao', price: 160, slot: 'head' },
  { id: 'acc_catears', kind: 'acc', icon: '😺', name: 'Bờm Tai Mèo', price: 260, slot: 'head' },
  { id: 'acc_cap', kind: 'acc', icon: '🧢', name: 'Mũ Lưỡi Trai', price: 280, slot: 'head' },
  { id: 'acc_beanie', kind: 'acc', icon: '🧶', name: 'Mũ Len', price: 320, slot: 'head' },
  { id: 'acc_nonla', kind: 'acc', icon: '👒', name: 'Nón Lá', price: 380, slot: 'head' },
  { id: 'acc_round', kind: 'acc', icon: '👓', name: 'Kính Mọt Sách', price: 220, slot: 'face' },
  { id: 'acc_heart', kind: 'acc', icon: '💗', name: 'Kính Tim', price: 340, slot: 'face' },
  { id: 'acc_bowtie', kind: 'acc', icon: '🦋', name: 'Nơ Cổ', price: 180, slot: 'neck' },
  { id: 'acc_bell', kind: 'acc', icon: '🔔', name: 'Chuông Mèo', price: 200, slot: 'neck' },
  { id: 'acc_scarf', kind: 'acc', icon: '🧣', name: 'Khăn Quàng', price: 300, slot: 'neck' },
  { id: 'acc_medal', kind: 'acc', icon: '🏅', name: 'Huy Chương', price: 900, slot: 'neck', rare: true },
  { id: 'wpn_sword', kind: 'weapon', icon: '🗡️', name: 'Kiếm Gỗ', price: 150, bonus: 0.05 },
  { id: 'wpn_staff', kind: 'weapon', icon: '🪄', name: 'Trượng Phép', price: 350, bonus: 0.10 },
  { id: 'wpn_axe', kind: 'weapon', icon: '🪓', name: 'Rìu Chiến', price: 550, bonus: 0.15 },
  { id: 'wpn_bow', kind: 'weapon', icon: '🏹', name: 'Cung Tiên', price: 800, bonus: 0.20 },
  { id: 'wpn_trident', kind: 'weapon', icon: '🔱', name: 'Đinh Ba Thần', price: 2200, bonus: 0.30, rare: true },
];
const BOSSES = [
  { name: 'Quỷ Trì Hoãn', icon: '👹' }, { name: 'Rồng Lười Biếng', icon: '🐉' },
  { name: 'Hydra Deadline', icon: '🐍' }, { name: 'Lich Xao Nhãng', icon: '💀' },
  { name: 'Golem Mệt Mỏi', icon: '🗿' }, { name: 'Kraken Mạng Xã Hội', icon: '🦑' },
];
// Nhiệm vụ ẩn khi chưa chọn trạng thái: chỉ việc làm được ngay tại chỗ ngồi.
const HIDDEN = ['Hít thở sâu 5 lần 🌬️', 'Nhìn xa 20 giây cho mắt nghỉ 👀', 'Uống 1 ngụm nước 💧', 'Thả lỏng vai & cổ 10 giây 🙆', 'Ngồi thẳng lưng lại nào 🪑'];
// Trạng thái hiện tại của người dùng → nhiệm vụ ẩn (hidden), gợi ý nhiệm vụ [tiêu đề, nhánh, độ khó] (suggest), câu Pet nói (talk).
const STATUSES = {
  study: { icon: '📚', name: 'Đang học',
    hidden: ['Nhìn xa 20 giây cho mắt nghỉ 👀', 'Uống 1 ngụm nước 💧', 'Ghi lại 1 ý chính vừa học ✍️', 'Tự hỏi 1 câu về bài vừa đọc ❓', 'Xoay cổ tay 10 vòng ✋', 'Úp điện thoại xuống 📵'],
    suggest: [['Tập trung học 25 phút', 'int', 2], ['Làm 10 bài tập', 'int', 3], ['Tóm tắt bài vừa học', 'int', 2], ['Ôn lại 20 từ vựng', 'int', 1], ['Chuẩn bị bài cho buổi sau', 'int', 2]],
    talk: ['Học giỏi quá!', 'Nghỉ mắt xíu nha', 'Mình ngồi học cùng nè 📚'] },
  work: { icon: '💼', name: 'Đang làm việc',
    hidden: ['Đóng bớt 3 tab không cần 🗂️', 'Uống 1 ngụm nước 💧', 'Ghi 1 việc cần làm tiếp 📝', 'Thả lỏng vai & cổ 10 giây 🙆', 'Tắt thông báo không cần 🔕'],
    suggest: [['Hoàn thành 1 đầu việc quan trọng', 'int', 3], ['Trả lời email / tin nhắn tồn', 'int', 1], ['Lên danh sách việc ngày mai', 'spi', 1], ['Làm 1 phiên tập trung 50 phút', 'int', 3], ['Dọn hộp thư', 'spi', 1]],
    talk: ['Làm việc hăng say ghê!', 'Nhớ nghỉ giải lao nha'] },
  online: { icon: '🌐', name: 'Đang online',
    hidden: ['Đứng dậy vươn vai 🙆', 'Nhìn xa 20 giây 👀', 'Tắt 1 app mạng xã hội 📵', 'Uống 1 cốc nước 💧', 'Đi rửa mặt cho tỉnh 🚿', 'Đi bộ quanh phòng 1 phút 🚶'],
    suggest: [['Xem 1 video học được điều mới', 'int', 1], ['Giới hạn mạng xã hội 30 phút', 'spi', 2], ['Viết 1 đoạn nhật ký', 'cre', 1], ['Dọn file trong Downloads', 'spi', 1], ['Học 1 kỹ năng mới 15 phút', 'int', 2]],
    talk: ['Lướt vừa thôi nha 👀', 'Có gì hay kể mình nghe với!'] },
  out: { icon: '🚶', name: 'Đang đi chơi',
    hidden: ['Chụp 1 tấm ảnh đẹp 📸', 'Uống nước nào 💧', 'Nhắn hỏi thăm 1 người bạn 💌', 'Đi bộ thêm 5 phút 🚶', 'Để ý 3 điều vui quanh bạn 🌈'],
    suggest: [['Đi bộ 3.000 bước', 'str', 2], ['Chụp 5 tấm ảnh kỷ niệm', 'cre', 1], ['Về nhà đúng giờ hẹn', 'spi', 1], ['Không tiêu quá ngân sách', 'spi', 2], ['Uống đủ 2 chai nước', 'str', 1]],
    talk: ['Đi chơi vui nha!', 'Về sớm làm nhiệm vụ nha~'] },
  exercise: { icon: '🏃', name: 'Đang tập thể dục',
    hidden: ['Làm 10 cái squat 🦵', 'Uống nước bù 💧', 'Giãn cơ 1 phút 🤸', 'Hít thở sâu 5 lần 🌬️', '10 cái chống đẩy 💪'],
    suggest: [['Chạy / đạp xe 20 phút', 'str', 3], ['Giãn cơ 10 phút', 'str', 1], ['30 cái squat', 'str', 2], ['Plank 1 phút', 'str', 2], ['Uống đủ nước sau tập', 'str', 1]],
    talk: ['Cố lên! 💪', 'Đổ mồ hôi là khỏe!'] },
  game: { icon: '🎮', name: 'Đang chơi game',
    hidden: ['Nghỉ mắt 20 giây giữa trận 👀', 'Uống 1 ngụm nước 💧', 'Duỗi cổ tay & ngón tay 🙆', 'Ngồi thẳng lưng lại 🪑', 'Chớp mắt chậm 10 lần 😌'],
    suggest: [['Chơi tối đa 60 phút rồi nghỉ', 'spi', 2], ['Làm 1 nhiệm vụ trước khi chơi tiếp', 'int', 1], ['Nghỉ mắt 5 phút sau mỗi trận', 'spi', 1], ['Dọn bàn trước khi chơi trận mới', 'str', 1]],
    talk: ['Chơi vui nhưng đừng quá 1 tiếng nha 🎮', 'Thắng trận nhớ kể mình nghe!', 'Nhớ nghỉ mắt giữa trận nha 👀'] },
  relax: { icon: '🏠', name: 'Đang nghỉ ngơi',
    hidden: ['Dọn gọn bàn 🧹', 'Đi bộ quanh phòng 1 phút 🚶', 'Mở cửa sổ hít khí trời 🪴', 'Vươn vai 10 lần 🙆', 'Nghe 1 bài hát yêu thích 🎵', 'Rửa mặt cho tỉnh táo 🚿'],
    suggest: [['Đọc 10 trang sách', 'int', 1], ['Dọn phòng 15 phút', 'str', 1], ['Thiền 5 phút', 'spi', 1], ['Nấu 1 món ăn', 'cre', 2], ['Gọi điện cho gia đình', 'spi', 1]],
    talk: ['Nghỉ ngơi xíu cũng tốt', 'Thư giãn nhưng đừng quên nhiệm vụ nha'] },
};
const item = id => SHOP.find(i => i.id === id);
const ACC_SLOTS = { head: 'Đội đầu', face: 'Mặt', neck: 'Đeo cổ' };

// ---------- Pet lên cấp & tiến hóa (kiểu Pokémon) ----------
// Pet đang dẫn theo nhận XP = EXP người chơi kiếm được. Lv 5: chọn 1 trong 2 hệ của loài (Dạng II, không đổi lại được)
// → Lv 15: Dạng III (tự động) → Lv 30: Thức Tỉnh ★ (kỹ năng ×1.5). Mỗi loài nuôi riêng: s.pets[id] = {lv, xp, el}.
const ELEMENTS = {
  fire: { icon: '🔥', name: 'Hỏa', color: '#fb923c', titles: ['Lửa', 'Viêm Vương'], skill: 'focus', vals: [8, 15], txt: v => `+${v}% EXP khi tập trung` },
  water: { icon: '💧', name: 'Thủy', color: '#38bdf8', titles: ['Sóng', 'Hải Thần'], skill: 'guard', vals: [10, 20], txt: v => `−${v}% sát thương phạt` },
  leaf: { icon: '🌿', name: 'Mộc', color: '#4ade80', titles: ['Lá', 'Cổ Thụ'], skill: 'gold', vals: [8, 15], txt: v => `+${v}% vàng` },
  bolt: { icon: '⚡', name: 'Lôi', color: '#facc15', titles: ['Sấm', 'Lôi Đế'], skill: 'crit', vals: [6, 12], txt: v => `+${v}% tỉ lệ chí mạng` },
  moon: { icon: '🌙', name: 'Nguyệt', color: '#a78bfa', titles: ['Trăng', 'Nguyệt Ảnh'], skill: 'exp', vals: [5, 10], txt: v => `+${v}% EXP mọi nguồn` },
};
const PET_EVO = [5, 15, 30], PET_MAX = 30, STAGES = ['Dạng I', 'Dạng II', 'Dạng III', 'Thức Tỉnh ★'];
const petNeed = lv => 30 + 15 * lv;
const petGet = (s, id = s.petKind) => (s.pets && s.pets[id]) || { lv: 1, xp: 0, el: null };
const petStage = p => (!p.el || p.lv < PET_EVO[0] ? 0 : p.lv >= PET_EVO[2] ? 3 : p.lv >= PET_EVO[1] ? 2 : 1);
const elValue = (el, st) => ELEMENTS[el].vals[st >= 2 ? 1 : 0] * (st === 3 ? 1.5 : 1);
const elSkillTxt = (el, st) => ELEMENTS[el].txt(elValue(el, st));
function petName(s, id = s.petKind) {
  const it = item(id), p = petGet(s, id), st = petStage(p);
  return st ? `${it.short} ${ELEMENTS[p.el].titles[st >= 2 ? 1 : 0]}${st === 3 ? ' ★' : ''}` : it.name;
}
function petSkill(s, key) { // kỹ năng hệ của pet đang dẫn theo (tỉ lệ 0..1)
  const p = petGet(s), st = petStage(p);
  return st && ELEMENTS[p.el].skill === key ? elValue(p.el, st) / 100 : 0;
}
const petEvoReady = (s, id = s.petKind) => { const p = petGet(s, id); return !p.el && p.lv >= PET_EVO[0]; };
const priceOf = (s, it) => (it.id === 'freeze' && s.petKind === 'pet_turtle' ? Math.round(it.price * 0.7) : it.price);
function gainPetXp(s, n, out) {
  const id = s.petKind, p = s.pets[id] || (s.pets[id] = { lv: 1, xp: 0, el: null });
  if (p.lv >= PET_MAX || n <= 0) return;
  const st0 = petStage(p);
  p.xp += n;
  while (p.lv < PET_MAX && p.xp >= petNeed(p.lv)) {
    p.xp -= petNeed(p.lv); p.lv++;
    if (p.lv === PET_EVO[0] && !p.el) out.push({ kind: 'evoready', msg: `🥚 ${item(id).name} đạt Lv ${p.lv}: sẵn sàng tiến hóa! Vào tab Pet chọn hệ`, pet: id, notify: true });
    else out.push({ kind: 'petlv', msg: `🐾 ${petName(s, id)} lên Lv ${p.lv}`, pet: id });
  }
  if (p.lv >= PET_MAX) p.xp = 0;
  const st1 = petStage(p);
  if (st1 > st0) out.push({ kind: 'evolve', msg: st1 === 3 ? `🌟 ${petName(s, id)} THỨC TỈNH! ${elSkillTxt(p.el, 3)}` : `✨ Tiến hóa! ${petName(s, id)} · ${elSkillTxt(p.el, st1)}`, pet: id, notify: true });
}
const BOND = [0, 15, 50, 120, 250, 500];
const BOND_NAMES = ['Xa Lạ', 'Quen Biết', 'Bạn Bè', 'Thân Thiết', 'Tri Kỷ', 'Song Sinh'];
const LOGIN = [{ gold: 50 }, { meat: 2 }, { gold: 100 }, { chest: 1 }, { gold: 150, cake: 1 }, { potion: 1, meat: 2 }, { gold: 300, chest: 2 }];
const BOUNTIES = [
  { k: 'tasks', need: 3, text: 'Hoàn thành 3 nhiệm vụ', gold: 60 },
  { k: 'focus', need: 50, text: 'Tập trung tổng 50 phút', gold: 70 },
  { k: 'cat', need: 1, text: 'Hoàn thành 1 nhiệm vụ ', gold: 40 },
  { k: 'hard', need: 1, text: 'Hạ gục 1 nhiệm vụ ★★★', gold: 70 },
  { k: 'pat', need: 5, text: 'Vuốt ve Pet 5 lần', gold: 30 },
  { k: 'feed', need: 1, text: 'Cho Pet ăn 1 lần', gold: 30 },
  { k: 'hidden', need: 1, text: 'Hoàn thành 1 nhiệm vụ ẩn', gold: 50 },
  { k: 'plan', need: 2, text: 'Khai báo 2 nhiệm vụ cho tuần sau', gold: 40 },
];
const ACH = [
  ['task1', '⚔️', 'Chiến Công Đầu', 'Hoàn thành 1 nhiệm vụ', 50, s => s.stats.tasks >= 1],
  ['task25', '🗡️', 'Thợ Săn', 'Hoàn thành 25 nhiệm vụ', 200, s => s.stats.tasks >= 25],
  ['task100', '⚜️', 'Dũng Sĩ', 'Hoàn thành 100 nhiệm vụ', 600, s => s.stats.tasks >= 100],
  ['task500', '🏰', 'Huyền Thoại', 'Hoàn thành 500 nhiệm vụ', 2000, s => s.stats.tasks >= 500],
  ['focus60', '⏳', 'Nhập Định', 'Tập trung tổng 1 giờ', 80, s => s.stats.focus >= 60],
  ['focus600', '🧠', 'Tâm Như Thép', 'Tập trung tổng 10 giờ', 400, s => s.stats.focus >= 600],
  ['focus3000', '🌌', 'Siêu Tập Trung', 'Tập trung tổng 50 giờ', 1500, s => s.stats.focus >= 3000],
  ['boss1', '👹', 'Diệt Boss', 'Hạ 1 Boss tuần', 250, s => s.stats.bosses >= 1],
  ['boss5', '🐉', 'Đồ Long', 'Hạ 5 Boss tuần', 1000, s => s.stats.bosses >= 5],
  ['streak7', '🔥', 'Lửa Bền', 'Chuỗi điểm danh 7 ngày', 300, s => s.hero.best >= 7],
  ['streak30', '☄️', 'Bất Diệt', 'Chuỗi điểm danh 30 ngày', 1200, s => s.hero.best >= 30],
  ['lv5', '⭐', 'Tân Anh Hùng', 'Đạt cấp 5', 150, s => s.hero.level >= 5],
  ['lv10', '🌟', 'Anh Hùng', 'Đạt cấp 10', 500, s => s.hero.level >= 10],
  ['lv20', '💫', 'Truyền Kỳ', 'Đạt cấp 20', 1500, s => s.hero.level >= 20],
  ['bond3', '💞', 'Thân Thiết', 'Độ thân với Pet đạt bậc 3', 300, s => bond(s) >= 3],
  ['bond5', '💖', 'Song Sinh', 'Độ thân với Pet đạt tối đa', 1000, s => bond(s) >= 5],
  ['pets3', '🐾', 'Nhà Sưu Tầm', 'Sở hữu 3 loài Pet', 400, s => s.owned.filter(i => i.startsWith('pet_')).length >= 3],
  ['hidden10', '❓', 'Kẻ Tìm Bí Mật', 'Làm 10 nhiệm vụ ẩn', 250, s => s.stats.hidden >= 10],
  ['login30', '📅', 'Chuyên Cần', 'Nhận quà đăng nhập 30 ngày', 800, s => s.stats.logins >= 30],
  ['words100', '📖', 'Chăm Chữ Hán', 'Học 100 từ tiếng Trung', 300, s => s.stats.words >= 100],
  ['words390', '🀄', 'Bác Học Hán Ngữ', 'Học hết 390 từ tiếng Trung', 1200, s => s.stats.words >= 390],
  ['en30', '🔤', 'Luyện B1 Bền Bỉ', 'Học tiếng Anh 30 ngày', 600, s => s.stats.enDays >= 30],
].map(([id, icon, name, desc, gold, test]) => ({ id, icon, name, desc, gold, test }));

// ---------- thời gian (giờ địa phương) ----------
const pad = n => String(n).padStart(2, '0');
const dayKey = t => { const d = new Date(t); return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`; };
const startOfDay = t => { const d = new Date(t); d.setHours(0, 0, 0, 0); return +d; };
const endOfDay = t => startOfDay(t) + DAY - 1;
const weekKey = t => { const d = new Date(startOfDay(t)); d.setDate(d.getDate() - (d.getDay() + 6) % 7); return dayKey(d); };
const weekEnd = key => { const d = new Date(key + 'T00:00:00'); d.setDate(d.getDate() + 7); return +d - 1; };
const clock = t => { const d = new Date(t); return `${pad(d.getHours())}:${pad(d.getMinutes())}`; };
const hmMin = hhmm => { const [h, m] = String(hhmm).split(':').map(Number); return h * 60 + (m || 0); };
const atTime = (now, hhmm) => startOfDay(now) + hmMin(hhmm) * MIN;
const okHM = t => /^([01]?\d|2[0-3]):[0-5]\d$/.test(t);
const bossOf = key => BOSSES[Math.floor(+new Date(key + 'T00:00:00') / (7 * DAY)) % BOSSES.length];

// ---------- chỉ số ----------
const tier = (s, cat) => TIERS.filter(x => s.skills[cat] >= x).length;
const hasPet = (s, id) => s.petKind === id;
const petFood = (s, now) => Math.max(0, Math.min(100, s.pet.food - Math.max(0, now - s.pet.at) / HOUR * 4)); // đói dần 4%/giờ
const bond = s => BOND.filter(x => s.pet.love >= x).length - 1;
const maxHp = s => 100 + 5 * (s.hero.level - 1) + 10 * tier(s, 'str') + (hasPet(s, 'pet_bunny') ? 15 : 0);
const expNeed = lv => Math.round(80 * Math.pow(lv, 1.5));
const frozen = (s, now) => s.frozenUntil > now;
const deadline = t => t.due || (t.week ? weekEnd(t.week) : null);
const expMult = (s, now) => s.buffs.filter(b => b.until > now).reduce((m, b) => m * b.mult, 1)
  * (1 + 0.05 * tier(s, 'int') + (hasPet(s, 'pet_owl') ? 0.05 : 0) + (petFood(s, now) >= 25 ? 0.03 * bond(s) : 0)
    + petSkill(s, 'exp') + (hasPet(s, 'pet_carp') ? 0.01 * Math.min(10, s.hero.streak) : 0));
function heroTitle(s) {
  const top = Object.keys(CATS).sort((a, b) => s.skills[b] - s.skills[a])[0];
  const p = s.skills[top];
  if (!p) return { cls: null, title: 'Lữ Khách', rank: 0 };
  const rank = p < 15 ? 0 : p < 60 ? 1 : p < 150 ? 2 : 3;
  return { cls: top, title: CLASSES[top][rank], rank };
}
const doneOn = (s, key) => s.tasks.filter(t => t.status === 'done' && dayKey(t.doneAt) === key).length;
const weekTasks = (s, key) => s.tasks.filter(t => t.week === key);
const loginReady = s => s.login.last !== s.day;
const lastDone = s => s.tasks.reduce((m, t) => t.status === 'done' ? Math.max(m, t.doneAt) : m, 0);
const bountyReady = s => s.bounty.list.filter(b => b.done && !b.got).length;
const achReady = s => ACH.filter(a => !s.ach.includes(a.id) && a.test(s)).length;
// Gợi ý nhiệm vụ cho trạng thái hiện tại, bỏ những việc đã có trong danh sách; seed để "đổi gợi ý".
function suggestions(s, seed = 0, n = 3) {
  const st = STATUSES[s.status];
  if (!st) return [];
  const have = new Set(s.tasks.filter(t => t.status === 'todo').map(t => t.title));
  const pool = st.suggest.filter(x => !have.has(x[0]));
  return pool.length ? Array.from({ length: Math.min(n, pool.length) }, (_, i) => pool[(seed + i) % pool.length]) : [];
}
// Từ tiếng Trung của hôm nay: zhCount từ bắt đầu từ vị trí zhFrom (chốt lúc qua ngày).
const zhToday = s => VOCAB.length ? Array.from({ length: s.learn.zhCount }, (_, i) => VOCAB[(s.learn.zhFrom + i) % VOCAB.length]) : [];
const enTip = now => EN_TIPS[Math.floor(startOfDay(now) / DAY) % EN_TIPS.length];

// ---------- thời tiết (dữ liệu Open-Meteo do main tải về) ----------
const WMO = [[0, '☀️', 'Trời quang'], [1, '🌤️', 'Ít mây'], [2, '⛅', 'Có mây'], [3, '☁️', 'Nhiều mây'], [45, '🌫️', 'Sương mù'],
  [51, '🌦️', 'Mưa phùn'], [61, '🌧️', 'Mưa nhỏ'], [63, '🌧️', 'Mưa vừa'], [65, '🌧️', 'Mưa to'], [71, '🌨️', 'Tuyết'],
  [80, '🌦️', 'Mưa rào'], [82, '⛈️', 'Mưa rào lớn'], [95, '⛈️', 'Giông']];
const wxInfo = code => { let m = WMO[0]; for (const x of WMO) if (code >= x[0]) m = x; return { icon: m[1], name: m[2] }; };
const rainy = c => (c >= 51 && c <= 67) || (c >= 80 && c <= 82) || c >= 95;
// JSON forecast (current + hourly precipitation_probability, weather_code + daily) → số liệu gọn. Ném lỗi nếu thiếu dữ liệu.
function parseWeather(j, place, now) {
  const c = j && j.current, h = j && j.hourly, d = j && j.daily;
  if (!c || !h || !d || !Number.isFinite(c.temperature_2m) || !Array.isArray(d.time)) throw new Error('dữ liệu thời tiết không hợp lệ');
  const T = t => Date.parse(t + 'Z') - (j.utc_offset_seconds || 0) * 1000; // giờ địa phương của nơi đó → ms
  const next = h.time.map((t, i) => [T(t), i]).filter(([t]) => t >= now - HOUR && t <= now + 3 * HOUR).map(([, i]) => i);
  const di = Math.max(0, d.time.findIndex(t => T(t + 'T00:00') <= now && now < T(t + 'T00:00') + DAY));
  const num = (x, def = 0) => (Number.isFinite(x) ? x : def), rd = x => Math.round(num(x));
  return { at: now, place: String(place || '').slice(0, 60),
    temp: rd(c.temperature_2m), feels: rd(c.apparent_temperature), humid: rd(c.relative_humidity_2m), precip: num(c.precipitation),
    code: num(c.weather_code), wind: rd(c.wind_speed_10m), uv: num(c.uv_index),
    max: rd(d.temperature_2m_max[di]), min: rd(d.temperature_2m_min[di]), rainProb: rd(d.precipitation_probability_max[di]),
    uvMax: Math.floor(num(d.uv_index_max[di]) * 10) / 10, codeDay: num(d.weather_code[di]),
    rain3h: Math.max(0, ...next.map(i => num(h.precipitation_probability[i]))), code3h: Math.max(0, ...next.map(i => num((h.weather_code || [])[i]))) };
}
// Lời nhắc giữ sức khỏe theo thời tiết: [{id, icon, text}] (id để mỗi loại chỉ nhắc 1 lần/ngày).
function weatherTips(w, hour = 12) {
  if (!w) return [];
  const t = [];
  if (w.code >= 95 || w.code3h >= 95) t.push(['storm', '⛈️', 'Sắp có giông sét — hạn chế ra ngoài, không trú dưới cây to']);
  if (rainy(w.code) || w.precip > 0) t.push(['rainNow', '🌧️', 'Đang mưa — mặc áo mưa, đi chậm, về nhà lau khô người và uống nước ấm']);
  else if (w.rain3h >= 40 || w.rainProb >= 60) t.push(['rain', '☔', `Khả năng mưa ${Math.max(w.rain3h, w.rainProb)}% — nhớ mang áo mưa / dù`]);
  const day = hour < 16; // nắng / UV chỉ nhắc ban ngày
  if (day && (w.feels >= 38 || w.max >= 35)) t.push(['hot', '🥵', `Nắng nóng (${w.max}°C, cảm giác ${w.feels}°C) — uống nhiều nước, tránh nắng 11h–15h, đội nón`]);
  if (day && w.uvMax >= 8) t.push(['uv', '🧴', `UV rất cao (${w.uvMax}) — bôi kem chống nắng, mặc áo khoác chống nắng khi ra đường`]);
  if (w.min <= 18) t.push(['cold', '🧣', `Trời lạnh (${w.min}°C) — mặc áo ấm, quàng khăn, uống nước ấm`]);
  else if (w.min <= 22 || w.temp <= 23) t.push(['cool', '🧥', `Trời se lạnh (${w.min}°C) — mang áo khoác mỏng, uống nước ấm`]);
  if (w.humid >= 85 && w.temp >= 28) t.push(['humid', '💦', 'Trời oi ẩm — mặc đồ thoáng mát, uống đủ nước']);
  if (w.max - w.min >= 9) t.push(['swing', '🌡️', `Nhiệt độ chênh ${w.min}–${w.max}°C — giữ ấm cổ họng, hạn chế đồ uống đá`]);
  if (w.wind >= 40) t.push(['wind', '💨', `Gió mạnh ${w.wind} km/h — cẩn thận khi đi xe máy`]);
  return t.map(([id, icon, text]) => ({ id, icon, text }));
}
// Gọi sau mỗi tick: lời nhắc mới trong ngày (6h–22h, dữ liệu ≤ 3 giờ tuổi, người dùng bật weatherTips) → 1 event.
function weatherCheck(s, w, now) {
  const h = new Date(now).getHours();
  if (!s.settings.weatherTips || !w || now - w.at > 3 * HOUR || h < 6 || h >= 22) return [];
  if (s.wx.day !== dayKey(now)) s.wx = { day: dayKey(now), told: [] };
  const fresh = weatherTips(w, h).filter(x => !s.wx.told.includes(x.id));
  if (!fresh.length) return [];
  s.wx.told.push(...fresh.map(x => x.id));
  return [{ kind: 'weather', msg: `${wxInfo(w.code).icon} ${w.temp}°C · ${fresh.map(x => `${x.icon} ${x.text}`).join(' · ')}`, tips: fresh, notify: true }];
}

// ---------- tự nhận biết trạng thái theo phần mềm đang ở cửa sổ trên cùng (appwatch.js gửi mẫu 5 giây/lần) ----------
// Tên tiến trình (chữ thường, bỏ .exe) → trạng thái. Trình duyệt thì xét tiêu đề trang (TITLE_STATUS).
const APP_STATUS = {
  work: ['winword', 'powerpnt', 'excel', 'onenote', 'outlook', 'olk', 'msaccess', 'mspub', 'visio', 'wps', 'wpp', 'et', 'soffice', 'soffice.bin', 'acrobat', 'acrord32', 'foxitpdfreader',
    'code', 'cursor', 'devenv', 'idea64', 'pycharm64', 'webstorm64', 'clion64', 'rider64', 'datagrip64', 'studio64', 'sublime_text', 'notepad++', 'notepad', 'windowsterminal', 'cmd', 'powershell', 'pwsh',
    'matlab', 'rstudio', 'obsidian', 'notion', 'figma', 'photoshop', 'illustrator', 'afterfx', 'adobe premiere pro', 'blender', 'unity', 'godot', 'claude', 'postman', 'dbeaver', 'ssms', 'xmind', 'canva'],
  study: ['zoom', 'ms-teams', 'teams', 'anki', 'duolingo', 'geogebra'],
  game: ['steam', 'epicgameslauncher', 'riotclientservices', 'leagueclient', 'league of legends', 'valorant', 'cs2', 'csgo', 'dota2', 'genshinimpact', 'yuanshen', 'starrail', 'zenlesszonezero',
    'robloxplayerbeta', 'minecraft', 'minecraftlauncher', 'r5apex', 'tslgame', 'overwatch', 'gta5', 'eldenring', 'battle.net', 'fc24', 'fc25', 'rocketleague', 'among us', 'terraria', 'stardew valley', 'osu!', 'garena', 'wuthering waves'],
  online: ['zalo', 'discord', 'telegram', 'messenger', 'whatsapp', 'facebook', 'tiktok', 'skype'],
  relax: ['spotify', 'vlc', 'potplayer', 'potplayermini64', 'netflix', 'mpc-hc64', 'wmplayer', 'music.ui', 'video.ui'],
};
const BROWSERS = ['chrome', 'msedge', 'firefox', 'opera', 'brave', 'browser', 'coccoc', 'vivaldi', 'arc'];
const TITLE_STATUS = [ // tiêu đề trang đã bỏ dấu → trạng thái (mẫu đầu tiên khớp thắng)
  [/classroom|lms|elearning|moodle|coursera|udemy|khan academy|duolingo|quizlet|google meet|\bmeet\b|zoom|hoc truc tuyen|dang ky hoc phan|huit/, 'study'],
  [/google docs|google sheets|google slides|tai lieu|trang tinh|trang trinh bay|notion|github|gitlab|stack overflow|jira|trello|figma|canva|outlook|gmail|drive|onedrive|chatgpt|claude|gemini|w3schools|mdn|localhost|overleaf|word|excel|powerpoint/, 'work'],
  [/youtube|facebook|tiktok|instagram|netflix|shopee|lazada|twitter|\bx\.com|reddit|zing mp3|spotify|twitch|9gag|threads/, 'online'],
  [/poki|y8|friv|chess\.com|lichess|\bgame\b/, 'game'],
];
function appStatus(name, title = '', path = '') {
  const n = String(name || '').toLowerCase().replace(/\.exe$/, '');
  if (!n) return null;
  if (/[\\/](steamapps|epic games|riot games|xboxgames|garena)[\\/]/i.test(path) || /-win64-shipping$/.test(n)) return 'game';
  if (BROWSERS.includes(n)) { const t = unaccent(String(title || '')); for (const [re, st] of TITLE_STATUS) if (re.test(t)) return st; return 'online'; }
  for (const [st, list] of Object.entries(APP_STATUS)) if (list.includes(n)) return st;
  return null; // không rõ (Explorer, QuestLog, màn hình desktop…) → giữ trạng thái hiện tại
}
// Mẫu [{st, at}] trong 60 giây gần nhất: ≥6 mẫu và ≥2/3 cùng một loại → trạng thái ổn định (lướt alt-tab qua app khác không đổi).
function stableStatus(samples, now) {
  const recent = samples.filter(x => now - x.at <= 60000);
  if (recent.length < 6) return null;
  const count = {};
  for (const x of recent) if (x.st) count[x.st] = (count[x.st] || 0) + 1;
  const top = Object.entries(count).sort((a, b) => b[1] - a[1])[0];
  return top && top[1] >= Math.ceil(recent.length * 2 / 3) ? top[0] : null;
}

// Buổi học {date, from, to (tiết)} → {start, end} (ms) theo khung giờ tiết của người dùng; lịch làm {at: ['06:30', '14:30']} theo giờ.
const isWork = c => c.kind === 'work';
const schedIcon = c => (isWork(c) ? '💼' : '🏫');
function classTime(s, c) {
  const base = +new Date(c.date + 'T12:00:00'), P = s.periods;
  if (c.at) return { start: atTime(base, c.at[0]), end: atTime(base, c.at[1]) + (hmMin(c.at[1]) <= hmMin(c.at[0]) ? DAY : 0) };
  return { start: atTime(base, P.start[c.from - 1] || '00:00'), end: atTime(base, P.start[c.to - 1] || '00:00') + P.len * MIN };
}

// Thời khóa biểu dự kiến trong [from, to): lịch học/làm + nhiệm vụ chưa xong có giờ/hạn + nhiệm vụ lặp lại (chiếu tới các ngày sau)
// → [{start, end, kind: class|work|event|routine|due, icon, title, room, online, off}] (due: start = end = hạn chót); nhiệm vụ lặp lại chỉ chiếu từ ngày của now
function agenda(s, from, to, now = from) {
  const out = [];
  for (const c of s.classes) {
    const { start, end } = classTime(s, c);
    if (end > from && start < to) out.push({ start, end, kind: isWork(c) ? 'work' : 'class', icon: schedIcon(c), title: c.subject, room: c.room, online: c.online, off: c.off });
  }
  for (const t of s.tasks) {
    if (t.status !== 'todo' || t.soft || !t.due || t.due < from || (t.start || t.due) >= to) continue;
    out.push({ start: t.start || t.due, end: t.due, kind: t.start ? 'event' : 'due', icon: t.routine ? '🔁' : t.start ? '📌' : '⏰', title: t.title });
  }
  for (let d = startOfDay(Math.max(from, now)); d < to; d = startOfDay(d + DAY + 2 * HOUR)) {
    for (const r of s.routines) {
      const start = atTime(d, r.from), end = atTime(d, r.to);
      if (!r.days.includes(new Date(d).getDay()) || end <= from || start >= to) continue;
      if (s.tasks.some(t => t.routine === r.id && startOfDay(t.start) === d)) continue; // hôm nay đã tạo nhiệm vụ → dùng nhiệm vụ đó
      out.push({ start, end, kind: 'routine', icon: '🔁', title: r.title });
    }
  }
  return out.sort((a, b) => a.start - b.start);
}
// Khoảng trống ≥ minMin phút trong khung [from, to] của ngày (bỏ qua hạn chót và lịch tạm ngưng) → [[start, end]]
// ponytail: khung thức 06:00–23:00 cố định; thêm cài đặt riêng khi có người ngủ/dậy khác giờ.
function freeSlots(items, day, from = '06:00', to = '23:00', minMin = 60) {
  const end = atTime(day, to), out = [];
  let cur = atTime(day, from);
  for (const x of items.filter(x => !x.off && x.kind !== 'due').sort((a, b) => a.start - b.start)) {
    if (Math.min(x.start, end) - cur >= minMin * MIN) out.push([cur, Math.min(x.start, end)]);
    cur = Math.max(cur, x.end);
    if (cur >= end) return out;
  }
  if (end - cur >= minMin * MIN) out.push([cur, end]);
  return out;
}

// Nhiệm vụ ngẫu nhiên theo lịch hôm nay: trước/sau buổi học, trước/sau ca làm, khoảng trống ≥1h giữa các lịch.
// {s} = môn/ca, {r} = phòng/Zoom (khung giờ hiện ở dòng dưới tên nhiệm vụ). Chọn ngẫu nhiên tối đa n việc chưa quá hạn.
const SCHED_Q = {
  classBefore: [['Chuẩn bị tài liệu, laptop cho môn {s}', 'int', 1], ['Xem lại bài cũ môn {s} 10 phút trước giờ học', 'int', 1]],
  onlineBefore: [['Kiểm tra link {r}, tai nghe, mic trước giờ học {s}', 'int', 1]],
  classAfter: [['Ôn lại bài {s} 15 phút', 'int', 2], ['Ghi 3 ý chính học được hôm nay môn {s}', 'int', 1], ['Làm bài tập / đọc thêm môn {s} 25 phút', 'int', 2]],
  workBefore: [['Chuẩn bị đồ trước khi vào {s} (nước, đồ ăn, sạc)', 'spi', 1], ['Ăn nhẹ lót dạ trước {s}', 'str', 1]],
  workAfter: [['Giãn cơ vai, lưng 5 phút sau {s}', 'str', 1], ['Nghỉ ngơi 20 phút không điện thoại sau {s}', 'spi', 1], ['Uống 1 cốc nước lớn sau {s}', 'str', 1]],
  free: [['Giờ trống: tập trung 25 phút cho việc quan trọng nhất', 'int', 2], ['Giờ trống: đọc 10 trang sách', 'int', 1], ['Giờ trống: dọn góc học tập 10 phút', 'str', 1],
    ['Giờ trống: đi bộ / tập thể dục 20 phút', 'str', 2], ['Giờ trống: lên kế hoạch cho ngày mai', 'spi', 1]],
  freeSubject: [['Giờ trống: làm bài môn {s} 25 phút', 'int', 2]],
};
const pick = list => list[rnd(0, list.length - 1)];
function schedQuests(s, now, n = 3) {
  const day = startOfDay(now), end = day + DAY - MIN;
  const items = agenda(s, day, day + DAY, now).filter(x => (x.kind === 'class' || x.kind === 'work') && !x.off);
  if (!items.length) return [];
  const subjects = [...new Set(s.classes.filter(c => !isWork(c) && !c.off && classTime(s, c).start > now).map(c => c.subject))];
  const cand = []; // [mẫu, lịch, bắt đầu, hạn]
  for (const x of items) {
    const w = x.kind === 'work';
    cand.push([pick(w ? SCHED_Q.workBefore : x.online ? SCHED_Q.classBefore.concat(SCHED_Q.onlineBefore) : SCHED_Q.classBefore), x, x.start - HOUR, x.start]);
    cand.push([pick(w ? SCHED_Q.workAfter : SCHED_Q.classAfter), x, x.end, Math.min(x.end + 3 * HOUR, end)]);
  }
  for (const [a, b] of freeSlots(items, day)) {
    const sub = subjects.length && Math.random() < 0.5;
    cand.push([pick(sub ? SCHED_Q.freeSubject : SCHED_Q.free), { title: sub ? pick(subjects) : '' }, a, b]);
  }
  const open = cand.filter(c => c[3] > now), out = [];
  while (out.length < n && open.length) {
    const [[title, cat, diff], x, start, due] = open.splice(rnd(0, open.length - 1), 1)[0];
    out.push({ title: '🎲 ' + title.replace('{s}', x.title).replace('{r}', x.room || 'Zoom'), cat, diff, start: Math.max(start, now), due });
  }
  return out.sort((a, b) => a.start - b.start);
}

// ---------- trợ lý "Hỏi Pet": tóm tắt tình hình + trả lời không cần mạng ----------
// summary(): vài dòng tiếng Việt mô tả state — dùng làm ngữ cảnh gửi Claude (main.js) và cho answer() bên dưới.
// Lưu ý riêng tư: chuỗi này chứa tên, nhiệm vụ và lịch của người dùng; chỉ gửi đi khi họ tự điền khóa API.
const DOW = ['Chủ nhật', 'Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy'];
const dueToday = (s, now) => s.tasks.filter(t => t.status === 'todo' && deadline(t) && deadline(t) <= endOfDay(now)).sort((a, b) => deadline(a) - deadline(b));
const restOfDay = (s, now) => agenda(s, now, startOfDay(now) + DAY, now);
function summary(s, now, w) {
  const h = s.hero, p = petGet(s), st = STATUSES[s.status], todo = dueToday(s, now), sched = restOfDay(s, now);
  const zh = s.learn.zhDone ? [] : zhToday(s);
  const L = [
    `Bây giờ: ${clock(now)} ${DOW[new Date(now).getDay()]} ${dayKey(now)}`,
    `Nhân vật: ${h.name} · ${heroTitle(s).title} Lv ${h.level} · HP ${h.hp}/${maxHp(s)} · ${h.gold} vàng · chuỗi ${h.streak} ngày · hôm nay xong ${doneOn(s, s.day)}/${s.settings.dailyGoal} nhiệm vụ`,
    `Pet: ${petName(s)} Lv ${p.lv}, no ${Math.round(petFood(s, now))}%, thân thiết ${BOND_NAMES[bond(s)]}`,
    `Trạng thái: ${st ? st.name : 'chưa đặt'}${s.focus ? ` · đang tập trung, còn ${Math.max(0, Math.round((s.focus.start + s.focus.min * MIN - now) / MIN))} phút` : ''}`,
    `Việc cần xong hôm nay: ${todo.map(t => `${t.title} (hạn ${clock(deadline(t))})`).join('; ') || 'không còn việc nào'}`,
    `Lịch còn lại hôm nay: ${sched.map(x => `${clock(x.start)} ${x.title}${x.room ? ' ' + x.room : ''}`).join('; ') || 'trống'}`,
  ];
  if (zh.length) L.push(`Chưa học ${zh.length} từ tiếng Trung hôm nay: ${zh.map(x => `${x.hz} (${x.py}) = ${x.vi}`).join('; ')}`);
  if (s.settings.enDaily && !s.learn.enDone) L.push(`Chưa luyện tiếng Anh B1 hôm nay. Gợi ý: ${enTip(now)}`);
  if (s.water.day === s.day && s.water.cups) L.push(`Đã uống ${s.water.cups} cốc nước hôm nay`);
  if (w) L.push(`Thời tiết ${w.place}: ${wxInfo(w.code).name} ${w.temp}°C (${w.min}–${w.max}°C), khả năng mưa ${Math.max(w.rain3h, w.rainProb)}%${weatherTips(w, new Date(now).getHours()).map(x => ` · ${x.text}`).join('')}`);
  return L.join('\n');
}
// Trả lời ngoại tuyến: khớp từ khóa (đã bỏ dấu) rồi lấy thẳng số liệu từ state.
// Dùng khi chưa điền khóa API hoặc gọi Claude lỗi — không bao giờ để người dùng hỏi mà không có câu trả lời.
// Khớp theo ranh giới từ: so chuỗi con làm giới từ cũng dính ("mục lục TRONG Word" → giờ trống,
// "thời TIẾT" → lịch, "thƯƠNG" → uống nước). Từ khóa phải là từ trọn vẹn trong câu đã bỏ dấu.
const kw = list => new RegExp('(^|[^a-z0-9])(?:' + list + ')($|[^a-z0-9])');
const REPLY = [
  [kw('nhiem vu|viec gi|viec nao|con viec|con gi|viec hom nay|todo|deadline|han chot|lam gi truoc'), (s, now) => {
    const t = dueToday(s, now);
    if (!t.length) return 'Hôm nay hết việc gấp rồi, giỏi quá! ✨';
    return `Hôm nay còn ${t.length} việc: ${t.slice(0, 5).map(x => `${x.title} (${clock(deadline(x))})`).join(' · ')}${t.length > 5 ? ` · …và ${t.length - 5} việc nữa` : ''}`;
  }],
  [kw('tu vung|tu moi|tieng trung|tieng hoa|han tu|hoc tu'), s => {
    const zh = zhToday(s);
    if (!zh.length) return 'Bạn đang tắt học từ tiếng Trung — bật lại trong Cài đặt nha.';
    return `${s.learn.zhDone ? 'Hôm nay học xong rồi' : `Còn ${zh.length} từ chưa thuộc`}: ${zh.map(x => `${x.hz} (${x.py}) = ${x.vi}`).join(' · ')}`;
  }],
  [kw('tieng anh|english|b1'), (s, now) => (s.settings.enDaily
    ? `${s.learn.enDone ? 'Hôm nay luyện rồi nè! ' : 'Chưa luyện hôm nay đó. '}Gợi ý: ${enTip(now)}`
    : 'Bạn đang tắt nhắc tiếng Anh B1 — bật trong Cài đặt nếu muốn nha.')],
  [kw('thoi tiet|troi mua|troi nang|nhiet do|co mua khong|nong khong|lanh khong'), (s, now, w) => (w
    ? `${wxInfo(w.code).icon} ${w.place}: ${wxInfo(w.code).name}, ${w.temp}°C (${w.min}–${w.max}°C), mưa ${Math.max(w.rain3h, w.rainProb)}%${weatherTips(w, new Date(now).getHours()).slice(0, 2).map(x => ` · ${x.icon} ${x.text}`).join('')}`
    : 'Mình chưa tải được thời tiết — kiểm tra mạng giúp mình nha.')],
  [kw('lich|lich hoc|lich lam|di hoc|ca lam|buoi hoc|mon hoc|tiet may|may gio hoc|hom nay co gi'), (s, now) => {
    const a = restOfDay(s, now);
    return a.length ? `Còn lại hôm nay: ${a.map(x => `${x.icon} ${clock(x.start)} ${x.title}`).join(' · ')}` : 'Hôm nay không còn lịch học hay ca làm nào nữa 🎉';
  }],
  [kw('gio trong|khoang trong|ranh|dang ranh|khi nao ranh|luc nao ranh'), (s, now) => {
    const f = freeSlots(restOfDay(s, now), now).filter(x => x[1] > now);
    return f.length ? `Khoảng trống hôm nay: ${f.map(([a, b]) => `${clock(Math.max(a, now))}–${clock(b)}`).join(' · ')}` : 'Hôm nay kín lịch rồi, ráng lên nha 💪';
  }],
  [kw('level|len cap|cap may|exp|hp|het mau|con mau|bao nhieu vang|gold|chuoi ngay|streak|chi so|nhan vat'), (s, now) =>
    `${s.hero.name} đang Lv ${s.hero.level} (${heroTitle(s).title}) · ❤ ${s.hero.hp}/${maxHp(s)} · 💰 ${s.hero.gold} · 🔥 ${s.hero.streak} ngày · EXP x${expMult(s, now).toFixed(2)}`],
  [kw('pet|thu cung|doi chua|doi khong|no chua|than thiet'), (s, now) =>
    `${petName(s)} Lv ${petGet(s).lv} · no ${Math.round(petFood(s, now))}% · thân thiết ${BOND_NAMES[bond(s)]}${petFood(s, now) < 30 ? ' — đói rồi, cho ăn đi 🍖' : ' — ổn lắm!'}`],
  [kw('uong nuoc|uong chua|coc nuoc|may coc'), s => `Hôm nay uống ${s.water.day === s.day ? s.water.cups : 0} cốc rồi${(s.water.day === s.day ? s.water.cups : 0) >= 8 ? ' — đủ rồi đó! 💧' : ' — uống thêm cốc nữa nha 💧'}`],
];
function answer(s, text, now, w) {
  const q = unaccent(String(text || ''));
  for (const [re, fn] of REPLY) if (re.test(q)) return fn(s, now, w);
  const t = dueToday(s, now);
  return `Câu này mình chưa trả lời được — khi chưa bật AI mình chỉ biết chuyện trong app (nhiệm vụ, lịch, giờ trống, từ vựng, chỉ số, pet, thời tiết, nước).
Muốn hỏi đủ thứ (Word, Excel, sức khỏe, đời sống…) thì dán khóa API vào Cài đặt → Pet & trạng thái nha. ${t.length ? `Còn giờ thì cứ làm "${t[0].title}" đi! 💪` : 'Hay là tập trung 25 phút đi? ⏱'}`;
}

// Người đang dùng không bị đổi theo lịch khi: đang tập trung, hoặc có nhiệm vụ "giữ máy" (keep) đang trong khung giờ.
const holds = (s, now) => !!s.focus || s.tasks.some(t => t.keep && t.status === 'todo' && t.start && now >= t.start - 30 * MIN && now < deadline(t));
const rewardTxt = r => Object.entries(r).map(([k, v]) => k === 'gold' ? `${v}💰` : `${item(k).icon}×${v}`).join(' ');

function newState(now) {
  return {
    v: 1,
    hero: { name: 'Lữ Khách', level: 1, exp: 0, hp: 100, gold: 100, streak: 0, best: 0 },
    skills: { int: 0, str: 0, cre: 0, spi: 0 },
    tasks: [], focus: null, combo: 0, buffs: [],
    hidden: null, nextHidden: now + 30 * MIN, nextNag: now + 30 * MIN, nextWater: 0,
    status: null, statusAt: 0, statusAuto: false, statusApp: '', statusHold: 0, gameWarned: false, routines: [], water: { day: '', cups: 0, ask: 0 },
    classes: [], classDay: '', schedQDay: '', periods: { start: PERIODS.slice(), len: 50 },
    learn: { day: '', zhFrom: 0, zhCount: 0, zhDone: false, enDone: false, next: 0, itNext: 0 }, wx: { day: '', told: [] },
    inv: { potion: 1, freeze: 0, chest: 1, relic: 0, meat: 2, cake: 0 },
    owned: ['skin_default', 'pet_slime'], skin: 'skin_default', weapon: null, petKind: 'pet_slime', accs: { head: null, face: null, neck: null },
    pets: { pet_slime: { lv: 1, xp: 0, el: null } }, hamsterDay: '', botGold: { day: '', n: 0 },
    pet: { food: 80, at: now, love: 0, pats: 0, patDay: '', warned: false },
    stats: { tasks: 0, focus: 0, bosses: 0, pats: 0, feeds: 0, hidden: 0, logins: 0, eaten: 0, words: 0, enDays: 0 },
    login: { last: '', n: 0 }, ach: [], achSeen: [],
    chatNotes: [], // quan sát về cách người này trò chuyện (xem docs mục 8.4) — DỮ LIỆU, không phải mệnh lệnh
    bounty: rollBounty(now),
    frozenUntil: 0,
    rewards: [
      { id: 'r1', icon: '🎬', name: '1 giờ xem phim', cost: 2000 },
      { id: 'r2', icon: '🧋', name: '1 ly trà sữa', cost: 800 },
      { id: 'r3', icon: '🎮', name: '30 phút chơi game', cost: 1000 },
    ],
    boss: { week: weekKey(now), defeated: false },
    day: dayKey(now), claimed: false,
    log: [], // {t, k:'task'|'focus'|'fail'|'cancel'|'redeem', cat, n}
    settings: {
      opacity: 0.95, clickThrough: false, autostart: true, onTop: true, dailyGoal: 3, petTalk: true, eatFiles: true, waterEvery: 0, autoStatus: true, schedQuests: true,
      zhPerDay: 0, enDaily: false, itRemind: false, weatherTips: false, aiKey: '',
      hkQuick: 'CommandOrControl+Shift+T', hkGhost: 'CommandOrControl+Shift+G', hkWidget: 'CommandOrControl+Shift+H',
    },
  };
}
// Bổ sung khóa mới cho file save cũ.
function hydrate(raw, now) {
  const d = newState(now);
  const s = { ...d, ...raw, hero: { ...d.hero, ...raw.hero }, skills: { ...d.skills, ...raw.skills },
    inv: { ...d.inv, ...raw.inv }, settings: { ...d.settings, ...raw.settings },
    pet: { ...d.pet, ...raw.pet }, stats: { ...d.stats, ...raw.stats }, login: { ...d.login, ...raw.login }, water: { ...d.water, ...raw.water }, learn: { ...d.learn, ...raw.learn }, periods: { ...d.periods, ...raw.periods } };
  if (!s.owned.includes('pet_slime')) s.owned.push('pet_slime');
  s.accs = { ...d.accs, ...raw.accs };
  if (raw.acc && item(raw.acc) && !s.accs[item(raw.acc).slot]) s.accs[item(raw.acc).slot] = raw.acc; // save cũ: 1 phụ kiện
  delete s.acc;
  s.pets = { ...raw.pets };
  for (const id of s.owned) if (id.startsWith('pet_') && !s.pets[id]) s.pets[id] = { lv: 1, xp: 0, el: null };
  return s;
}

// ---------- hiệu ứng cơ bản ----------
const rnd = (a, b) => a + Math.floor(Math.random() * (b - a + 1));
const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 6);

function gainExp(s, n, now, out) {
  n = Math.round(n * expMult(s, now));
  s.hero.exp += n;
  gainPetXp(s, n, out);
  while (s.hero.exp >= expNeed(s.hero.level)) {
    s.hero.exp -= expNeed(s.hero.level);
    s.hero.level++;
    s.hero.hp = maxHp(s);
    out.push({ kind: 'level', msg: `⭐ LÊN CẤP ${s.hero.level}! Hồi đầy máu`, notify: true });
  }
  return n;
}
function gainGold(s, n) { n = Math.round(n * (1 + 0.05 * tier(s, 'cre') + (hasPet(s, 'pet_cat') ? 0.05 : 0) + petSkill(s, 'gold'))); s.hero.gold += n; return n; }
function addLove(s, n, out) {
  const b = bond(s);
  s.pet.love += n;
  if (bond(s) > b) out.push({ kind: 'ach', msg: `💞 Độ thân với Pet lên "${BOND_NAMES[bond(s)]}"! +3% EXP`, notify: true });
}
function rollBounty(now) {
  const pool = [...BOUNTIES], list = [];
  while (list.length < 3) {
    const b = { ...pool.splice(rnd(0, pool.length - 1), 1)[0], prog: 0, done: false, got: false };
    if (b.k === 'cat') { const c = Object.keys(CATS)[rnd(0, 3)]; b.k = `cat_${c}`; b.text += CATS[c].name; }
    list.push(b);
  }
  return { day: dayKey(now), list, bonus: false };
}
function bump(s, k, n, out) {
  for (const b of s.bounty.list) {
    if (b.k !== k || b.done) continue;
    b.prog = Math.min(b.need, b.prog + n);
    if (b.prog >= b.need) { b.done = true; out.push({ kind: 'bounty', msg: `📜 Xong nhiệm vụ ngày: ${b.text} — vào nhận thưởng!` }); }
  }
}
function hurt(s, n, why, now, out) {
  if (frozen(s, now)) return 0;
  n = Math.round(n * Math.max(0.2, 1 - 0.1 * tier(s, 'spi') - (hasPet(s, 'pet_ghost') ? 0.15 : 0) - petSkill(s, 'guard')));
  s.hero.hp -= n;
  out.push({ kind: 'hurt', msg: `💔 ${why} −${n} HP`, notify: true });
  if (s.hero.hp <= 0) {
    if (s.hero.streak > 0) {
      out.push({ kind: 'dead', msg: `💀 Gục ngã! Mất chuỗi ${s.hero.streak} ngày`, notify: true });
      s.hero.streak = 0;
    } else {
      const lost = Math.floor(s.hero.exp * 0.3);
      s.hero.exp -= lost;
      out.push({ kind: 'dead', msg: `💀 Gục ngã! Mất ${lost} EXP`, notify: true });
    }
    s.hero.hp = Math.round(maxHp(s) / 2);
  }
  return n;
}
function openChest(s, rare, out) {
  const g = gainGold(s, rare ? rnd(300, 600) : rnd(50, 200));
  let extra = '';
  if (rare) {
    const pool = SHOP.filter(i => i.rare && !s.owned.includes(i.id));
    if (pool.length) { const it = pool[rnd(0, pool.length - 1)]; s.owned.push(it.id); extra = ` + ${it.icon} ${it.name}`; }
    else { s.inv.freeze += 2; extra = ' + 🧊×2'; }
  } else if (Math.random() < 0.08) { s.inv.freeze++; extra = ' + 🧊 Băng Giá'; }
  else if (Math.random() < 0.25) { s.inv.potion++; extra = ' + 🧪 Bình Máu'; }
  out.push({ kind: 'loot', msg: `${rare ? '👑' : '📦'} Mở rương: +${g} vàng${extra}` });
}
const rollDrop = (s, out) => {
  const r = Math.random();
  if (r < 0.05) { s.inv.freeze++; out.push({ kind: 'loot', msg: '🎁 Rớt đồ: 🧊 Băng Giá' }); }
  else if (r < 0.25) { s.inv.chest++; out.push({ kind: 'loot', msg: '🎁 Rớt đồ: 📦 Rương Gỗ' }); }
};

// ---------- hành động của người chơi ----------
const ACTIONS = {
  addTask(s, p, now, out) {
    const title = String(p.title || '').trim().slice(0, 200);
    if (!title) return;
    const when = p.when || 'inbox';
    const t = { id: uid(), title, cat: CATS[p.cat] ? p.cat : 'int', diff: Math.min(3, Math.max(1, +p.diff || 2)),
      due: +p.due || null, week: null, status: 'todo', createdAt: now };
    if (when === 'today' && !t.due) t.due = endOfDay(now);
    if (when === 'week') t.week = weekKey(now);
    if (when === 'next') t.week = weekKey(now + 7 * DAY);
    s.tasks.push(t);
    if (when === 'next') bump(s, 'plan', 1, out);
    out.push({ kind: 'info', msg: `📜 Nhận nhiệm vụ: ${title}` });
  },
  updateTask(s, p, now) {
    const t = s.tasks.find(x => x.id === p.id);
    if (!t || t.status !== 'todo') return;
    if ('title' in p) t.title = String(p.title).trim().slice(0, 200) || t.title;
    if (CATS[p.cat]) t.cat = p.cat;
    if (p.diff) t.diff = Math.min(3, Math.max(1, +p.diff));
    if ('due' in p) { t.due = +p.due || null; t.alerted = false; t.penalized = false; }
    if (p.when) {
      t.week = p.when === 'week' ? weekKey(now) : p.when === 'next' ? weekKey(now + 7 * DAY) : null;
      if (p.when === 'today') t.due = t.due || endOfDay(now);
      if (p.when === 'inbox') t.due = null;
      t.penalized = false;
    }
  },
  deleteTask(s, p) { s.tasks = s.tasks.filter(t => t.id !== p.id); },
  completeTask(s, p, now, out) {
    const t = s.tasks.find(x => x.id === p.id);
    if (!t || t.status !== 'todo') return;
    t.status = 'done'; t.doneAt = now;
    const d = DIFF[t.diff], late = t.penalized ? 0.5 : 1;
    const crit = Math.random() < 0.12 + petSkill(s, 'crit');
    const octo = hasPet(s, 'pet_octo') && s.classes.some(c => c.kind === 'work' && !c.off && c.date === dayKey(now)) ? 1.15 : 1;
    const e = gainExp(s, d.exp * late, now, out), g = gainGold(s, d.gold * late * (crit ? 2 : 1) * octo);
    if (crit) out.push({ kind: 'crit', msg: '💥 CHÍ MẠNG! Vàng x2' });
    s.skills[t.cat] += t.diff;
    addLove(s, 1, out);
    s.log.push({ t: now, k: 'task', cat: t.cat, n: t.diff });
    s.stats.tasks++;
    bump(s, 'tasks', 1, out); bump(s, `cat_${t.cat}`, 1, out);
    if (t.diff === 3) bump(s, 'hard', 1, out);
    out.push({ kind: 'reward', msg: `⚔️ Hạ gục "${t.title}" +${e} EXP +${g} vàng +${t.diff} ${CATS[t.cat].name}` });
    if (t.week === s.boss.week && !s.boss.defeated) {
      const list = weekTasks(s, s.boss.week), boss = bossOf(s.boss.week);
      if (list.every(x => x.status === 'done')) {
        s.boss.defeated = true; s.inv.relic++; s.stats.bosses++;
        gainExp(s, 150, now, out);
        out.push({ kind: 'boss', msg: `🏆 ${boss.name} đã bị tiêu diệt! Rớt 👑 Rương Hoàng Kim +150 EXP`, notify: true });
      } else out.push({ kind: 'hit', msg: `${boss.icon} ${boss.name} trúng đòn −${d.dmg * 10} HP` });
    }
  },
  startFocus(s, p, now, out) {
    if (s.focus) return;
    const min = Math.min(180, Math.max(1, +p.min || 25));
    const task = s.tasks.find(x => x.id === p.taskId);
    s.focus = { start: now, min, taskId: task ? task.id : null, cat: task ? task.cat : 'spi' };
    out.push({ kind: 'info', msg: `⏳ Bắt đầu tập trung ${min} phút — nhân vật lên đường săn quái!` });
  },
  cancelFocus(s, p, now, out) {
    if (!s.focus) return;
    s.focus = null;
    s.log.push({ t: now, k: 'cancel' });
    if (hasPet(s, 'pet_hamster') && s.hamsterDay !== s.day) {
      s.hamsterDay = s.day;
      return out.push({ kind: 'info', msg: '🐹 Hamster che cho bạn: lần bỏ dở đầu tiên hôm nay không bị phạt' });
    }
    if (s.combo) out.push({ kind: 'hurt', msg: `💢 Rớt combo x${s.combo}` });
    s.combo = 0;
    hurt(s, 10, 'Bỏ dở tập trung', now, out);
  },
  claimDaily(s, p, now, out) {
    if (s.claimed || doneOn(s, s.day) < s.settings.dailyGoal) return;
    s.claimed = true;
    s.hero.streak++; s.hero.best = Math.max(s.hero.best, s.hero.streak);
    const g = gainGold(s, 50 + 10 * Math.min(s.hero.streak, 10)), e = gainExp(s, 20, now, out);
    out.push({ kind: 'reward', msg: `🔥 Điểm danh ngày ${s.hero.streak}: +${g} vàng +${e} EXP` });
    if (s.hero.streak % 7 === 0) { s.inv.chest++; out.push({ kind: 'loot', msg: '🎁 Chuỗi 7 ngày: +📦 Rương Gỗ' }); }
  },
  buy(s, p, now, out) {
    const it = item(p.id), price = it && priceOf(s, it);
    if (!it || !price || s.hero.gold < price) return;
    if (it.kind !== 'use' && s.owned.includes(it.id)) return;
    s.hero.gold -= price;
    if (it.kind === 'use') s.inv[it.id]++; else s.owned.push(it.id);
    if (it.kind === 'pet') s.pets[it.id] = s.pets[it.id] || { lv: 1, xp: 0, el: null };
    out.push({ kind: 'info', msg: `🛒 Đã mua ${it.icon} ${it.name}` });
  },
  equip(s, p) {
    const it = item(p.id);
    if (!it || !s.owned.includes(it.id)) return;
    if (it.kind === 'skin') s.skin = it.id;
    if (it.kind === 'weapon') s.weapon = s.weapon === it.id ? null : it.id;
    if (it.kind === 'pet') s.petKind = it.id;
    if (it.kind === 'acc') s.accs[it.slot] = s.accs[it.slot] === it.id ? null : it.id;
  },
  evolvePet(s, p, now, out) { // chọn hệ ở Lv 5 cho pet đang dẫn theo — vĩnh viễn
    const it = item(s.petKind), r = s.pets[s.petKind];
    if (!r || r.el || r.lv < PET_EVO[0] || !it.evo.includes(p.el)) return;
    r.el = p.el;
    addLove(s, 5, out);
    out.push({ kind: 'evolve', msg: `✨ Tiến hóa! ${it.name} → ${petName(s)} · ${ELEMENTS[p.el].icon} ${elSkillTxt(p.el, petStage(r))}`, pet: s.petKind, notify: true });
  },
  use(s, p, now, out) {
    if (!s.inv[p.id]) return;
    if (p.id === 'potion') {
      if (s.hero.hp >= maxHp(s)) return;
      s.hero.hp = Math.min(maxHp(s), s.hero.hp + 50);
      out.push({ kind: 'info', msg: '🧪 Hồi 50 HP' });
    } else if (p.id === 'freeze') {
      s.frozenUntil = Math.max(now, s.frozenUntil) + DAY;
      for (const t of s.tasks) {
        const d = deadline(t);
        if (t.status === 'todo' && d && !t.penalized) { t.due = d + DAY; t.alerted = false; }
      }
      out.push({ kind: 'info', msg: '🧊 Băng Giá! Mọi deadline dời 24h, streak được bảo toàn' });
    } else if (p.id === 'meat' || p.id === 'cake') {
      const f = petFood(s, now), cake = p.id === 'cake';
      if (f >= 100) return;
      s.pet.food = Math.min(100, f + (cake ? 70 : 35)); s.pet.at = now; s.pet.warned = false;
      s.stats.feeds++;
      out.push({ kind: 'pet', msg: `${cake ? '🍰' : '🍖'} Pet ăn ngon lành! No ${Math.round(s.pet.food)}% · thân thiết +${cake ? 6 : 2}` });
      addLove(s, cake ? 6 : 2, out);
      bump(s, 'feed', 1, out);
    } else if (p.id === 'chest' || p.id === 'relic') openChest(s, p.id === 'relic', out);
    else return;
    s.inv[p.id]--;
  },
  completeHidden(s, p, now, out) {
    if (!s.hidden || now > s.hidden.until) return;
    s.hidden = null;
    s.stats.hidden++;
    bump(s, 'hidden', 1, out);
    s.buffs.push({ mult: 1.5, until: now + HOUR });
    const g = gainGold(s, hasPet(s, 'pet_frog') ? 30 : 10);
    out.push({ kind: 'reward', msg: `✨ Nhiệm vụ ẩn hoàn thành! Buff x1.5 EXP trong 1 giờ +${g} vàng` });
  },
  dismissHidden(s) { s.hidden = null; },
  addReward(s, p) {
    const name = String(p.name || '').trim().slice(0, 80), cost = Math.round(+p.cost);
    if (name && cost > 0) s.rewards.push({ id: uid(), icon: String(p.icon || '🎁').slice(0, 4), name, cost });
  },
  delReward(s, p) { s.rewards = s.rewards.filter(r => r.id !== p.id); },
  redeem(s, p, now, out) {
    const r = s.rewards.find(x => x.id === p.id);
    if (!r || s.hero.gold < r.cost) return;
    s.hero.gold -= r.cost;
    s.log.push({ t: now, k: 'redeem', n: r.cost });
    out.push({ kind: 'reward', msg: `${r.icon} Đổi thưởng: ${r.name} — tận hưởng đi, bạn xứng đáng!`, notify: true });
  },
  ateFiles(s, p, now, out) {
    const names = [].concat(p.names || []).map(String), n = names.length;
    if (n) {
      s.stats.eaten += n;
      s.pet.food = Math.min(100, petFood(s, now) + 3 * Math.min(n, 5)); s.pet.at = now; s.pet.warned = false;
      let bot = '';
      if (hasPet(s, 'pet_trashbot')) {
        if (s.botGold.day !== s.day) s.botGold = { day: s.day, n: 0 };
        const g = Math.min(2 * n, 20 - s.botGold.n);
        if (g > 0) { s.botGold.n += g; s.hero.gold += g; bot = ` · 🤖 +${g} vàng`; }
      }
      out.push({ kind: 'eat', msg: `😋 Pet đã ăn ${n > 1 ? n + ' mục' : `"${names[0].slice(0, 40)}"`} — nằm trong Thùng rác nếu cần lấy lại${bot}` });
    }
    if (p.fail) out.push({ kind: 'eatfail', msg: `🤢 Pet không nuốt nổi ${p.fail} mục (ổ không có Thùng rác, thư mục hệ thống, file đang mở hoặc không tồn tại)` });
  },
  patPet(s, p, now, out) {
    if (s.pet.patDay !== s.day) { s.pet.patDay = s.day; s.pet.pats = 0; }
    s.stats.pats++;
    bump(s, 'pat', 1, out);
    if (s.pet.pats++ < 15) addLove(s, 1, out); // vuốt ve cho tối đa 15 điểm thân thiết/ngày
  },
  claimBounty(s, p, now, out) {
    const b = s.bounty.list[+p.i];
    if (!b || !b.done || b.got) return;
    b.got = true;
    const g = gainGold(s, b.gold), e = gainExp(s, 30, now, out);
    out.push({ kind: 'reward', msg: `📜 ${b.text}: +${g} vàng +${e} EXP` });
    if (!s.bounty.bonus && s.bounty.list.every(x => x.got)) {
      s.bounty.bonus = true; s.inv.chest++;
      out.push({ kind: 'loot', msg: `🎉 Xong cả 3 nhiệm vụ ngày: +📦 Rương Gỗ +${gainGold(s, 100)} vàng` });
    }
  },
  claimLogin(s, p, now, out) {
    if (!loginReady(s)) return;
    const r = LOGIN[s.login.n % 7];
    for (const [k, v] of Object.entries(r)) if (k === 'gold') s.hero.gold += v; else s.inv[k] += v;
    s.login.last = s.day; s.login.n++; s.stats.logins++;
    out.push({ kind: 'loot', msg: `📅 Quà đăng nhập ngày ${(s.login.n - 1) % 7 + 1}: ${rewardTxt(r)}` });
  },
  claimAch(s, p, now, out) {
    const a = ACH.find(x => x.id === p.id);
    if (!a || s.ach.includes(a.id) || !a.test(s)) return;
    s.ach.push(a.id);
    out.push({ kind: 'ach', msg: `🏅 Thành tựu "${a.name}": +${gainGold(s, a.gold)} vàng`, notify: true });
  },
  setStatus(s, p, now, out) {
    const st = STATUSES[p.id];
    s.status = st ? p.id : null; s.statusAt = now;
    Object.assign(s, { statusAuto: false, statusApp: '', statusHold: now + HOUR, gameWarned: false }); // chọn tay: 1 giờ không tự đổi
    if (!st) return;
    s.nextHidden = Math.min(s.nextHidden, now + 10 * MIN);
    out.push({ kind: 'status', msg: `${st.icon} ${st.name} — nhiệm vụ ẩn & gợi ý đã đổi theo trạng thái`, status: p.id });
  },
  autoStatus(s, p, now, out) { // main gọi khi phần mềm đang dùng ổn định ≥ 1 phút
    const st = STATUSES[p.id];
    if (!s.settings.autoStatus || !st || s.status === p.id || now < s.statusHold) return;
    Object.assign(s, { status: p.id, statusAt: now, statusAuto: true, statusApp: String(p.app || '').slice(0, 40), gameWarned: false });
    s.nextHidden = Math.min(s.nextHidden, now + 10 * MIN);
    out.push({ kind: 'status', msg: `🤖 ${st.icon} ${st.name}${s.statusApp ? ` — thấy bạn đang dùng ${s.statusApp}` : ''}`, status: p.id, auto: true });
  },
  resumeAuto(s) { s.statusHold = 0; },
  drinkWater(s, p, now, out) {
    if (s.water.day !== s.day) s.water = { day: s.day, cups: 0, ask: 0 };
    s.water.cups++; s.water.ask = 0;
    if (s.water.cups > 8) return out.push({ kind: 'drink', msg: `💧 Cốc thứ ${s.water.cups} — hôm nay uống đủ rồi đó!` });
    const g = gainGold(s, 5);
    addLove(s, 1, out);
    out.push({ kind: 'drink', msg: `💧 Cốc nước thứ ${s.water.cups} hôm nay · +${g} vàng` });
  },
  learnZh(s, p, now, out) {
    const L = s.learn, n = zhToday(s).length;
    if (!n || L.zhDone) return;
    L.zhDone = true; s.stats.words += n; s.skills.int += 1;
    const e = gainExp(s, 3 * n * (hasPet(s, 'pet_panda') ? 1.2 : 1), now, out);
    out.push({ kind: 'reward', msg: `📖 Đã học ${n} từ tiếng Trung · +${e} EXP · tổng ${s.stats.words} từ` });
  },
  learnEn(s, p, now, out) {
    if (!s.settings.enDaily || s.learn.enDone) return;
    s.learn.enDone = true; s.stats.enDays++; s.skills.int += 1;
    const e = gainExp(s, 20 * (hasPet(s, 'pet_panda') ? 1.2 : 1), now, out);
    out.push({ kind: 'reward', msg: `🔤 Đã luyện tiếng Anh B1 hôm nay · +${e} EXP · ${s.stats.enDays} ngày` });
  },
  // Lịch học & làm: 1 buổi = {id, date 'YYYY-MM-DD', subject, from, to (tiết 1–16), room, teacher, online, off (tạm ngưng)}
  //   lịch theo giờ (ca làm, trợ giảng…): at ['HH:MM', 'HH:MM'] (from = to = 0), kind 'work'
  addClass(s, p, now, out) {
    const at = [].concat(p.at || []).map(String), timed = at.length === 2 && at.every(okHM);
    const from = timed ? 0 : Math.round(+p.from), to = timed ? 0 : Math.round(+p.to);
    const c = { id: uid(), date: String(p.date || ''), subject: String(p.subject || '').trim().slice(0, 120), from, to,
      room: String(p.room || '').trim().slice(0, 120), teacher: String(p.teacher || '').trim().slice(0, 80), online: p.online === true || p.online === 'true', off: false };
    if (timed) c.at = at;
    if (p.kind === 'work') c.kind = 'work';
    if (!/^\d{4}-\d{2}-\d{2}$/.test(c.date) || isNaN(+new Date(c.date)) || !c.subject || !(timed || (from >= 1 && from <= to && to <= 16))) return;
    s.classes.push(c);
    s.classes.sort((a, b) => a.date.localeCompare(b.date) || classTime(s, a).start - classTime(s, b).start);
    out.push({ kind: 'info', msg: `${schedIcon(c)} Đã thêm ${isWork(c) ? 'lịch làm' : 'buổi học'} ${c.subject} ngày ${c.date.split('-').reverse().join('/')}` });
  },
  delClass(s, p) {
    s.classes = s.classes.filter(c => c.id !== p.id);
    s.tasks = s.tasks.filter(t => !(t.classId === p.id && t.status === 'todo'));
  },
  toggleClass(s, p) { // tạm ngưng ↔ học lại
    const c = s.classes.find(x => x.id === p.id);
    if (!c) return;
    c.off = !c.off; c.task = null;
    s.tasks = s.tasks.filter(t => !(t.classId === c.id && t.status === 'todo'));
  },
  setPeriods(s, p) {
    const start = [].concat(p.start || []).map(String);
    const len = Math.round(+p.len);
    if (start.length !== 16 || !start.every(okHM) || !(len >= 30 && len <= 90)) return;
    s.periods = { start, len };
  },
  // Nhiệm vụ lặp lại: tạo 1 nhiệm vụ mỗi ngày trong 'days' (0=CN…6=T7), khung from–to; keep = giữ máy cho người này tới khi xong.
  addRoutine(s, p) {
    const title = String(p.title || '').trim().slice(0, 200);
    const days = [...new Set([].concat(p.days ?? []).map(Number))].filter(d => d >= 0 && d <= 6).sort();
    if (!title || !days.length || !okHM(p.from) || !okHM(p.to) || hmMin(p.from) >= hmMin(p.to)) return;
    s.routines.push({ id: uid(), title, cat: CATS[p.cat] ? p.cat : 'spi', diff: Math.min(3, Math.max(1, +p.diff || 1)),
      days, from: p.from, to: p.to, keep: p.keep === true || p.keep === 'true', last: '' });
  },
  delRoutine(s, p) { s.routines = s.routines.filter(x => x.id !== p.id); },
  rename(s, p) { const n = String(p.name || '').trim().slice(0, 24); if (n) s.hero.name = n; },
  // Ghi nhớ trò chuyện: main gọi sau khi học từ vài lượt gần nhất. Chỉ lưu quan sát ngắn, không lưu nguyên văn hội thoại.
  setChatNotes(s, p) {
    s.chatNotes = [].concat(p.notes || []).map(x => String(x).replace(/\s+/g, ' ').trim().slice(0, 120)).filter(Boolean).slice(0, 10);
  },
  clearChatNotes(s, p, now, out) {
    s.chatNotes = [];
    out.push({ kind: 'info', msg: '🧠 Đã xóa ghi nhớ thói quen trò chuyện' });
  },
  setSettings(s, p, now) {
    for (const k of Object.keys(p)) if (k in s.settings) s.settings[k] = p[k];
    s.settings.waterEvery = Math.min(240, Math.max(0, Math.round(+s.settings.waterEvery) || 0));
    if ('waterEvery' in p) s.nextWater = now + s.settings.waterEvery * MIN;
    s.settings.zhPerDay = Math.min(10, Math.max(0, Math.round(+s.settings.zhPerDay) || 0));
    if ('zhPerDay' in p && !s.learn.zhDone) s.learn.zhCount = s.settings.zhPerDay;
    s.settings.opacity = Math.min(1, Math.max(0.2, +s.settings.opacity));
    s.settings.dailyGoal = Math.min(20, Math.max(1, Math.round(+s.settings.dailyGoal) || 3));
    s.settings.aiKey = String(s.settings.aiKey || '').trim().slice(0, 200);
  },
};

function act(s, type, p, now) {
  const out = [];
  if (Object.hasOwn(ACTIONS, type)) ACTIONS[type](s, p || {}, now, out);
  s.hero.hp = Math.min(s.hero.hp, maxHp(s));
  return out;
}

// ---------- vòng lặp thời gian (gọi mỗi vài giây) ----------
function tick(s, now) {
  const out = [];
  s.buffs = s.buffs.filter(b => b.until > now);

  const f = s.focus;
  if (f && now >= f.start + f.min * MIN) {
    s.focus = null;
    const w = item(s.weapon), mult = (1 + 0.1 * Math.min(s.combo, 10)) * (1 + (w ? w.bonus : 0) + (hasPet(s, 'pet_dragon') ? 0.1 : 0) + petSkill(s, 'focus'));
    const e = gainExp(s, f.min * 2 * mult, now, out), g = gainGold(s, f.min);
    const sp = Math.max(1, Math.round(f.min / 25));
    s.skills[f.cat] += sp; s.combo++;
    s.log.push({ t: now, k: 'focus', cat: f.cat, n: f.min });
    s.stats.focus += f.min;
    bump(s, 'focus', f.min, out);
    addLove(s, 2, out);
    out.push({ kind: 'reward', msg: `🏁 Tập trung ${f.min} phút xong! Combo x${s.combo} · +${e} EXP +${g} vàng +${sp} ${CATS[f.cat].name}`, notify: true });
    if (f.min >= 20) rollDrop(s, out);
  }

  const today = dayKey(now);
  if (today !== s.day) {
    if (!s.claimed && s.hero.streak > 0 && s.frozenUntil < startOfDay(now)) {
      out.push({ kind: 'hurt', msg: `🥶 Hôm qua chưa điểm danh — mất chuỗi ${s.hero.streak} ngày` });
      s.hero.streak = 0;
    }
    s.day = today; s.claimed = false; s.status = null; s.statusHold = 0;
    s.tasks = s.tasks.filter(t => !(t.soft && t.status === 'todo' && deadline(t) < startOfDay(now))); // bỏ nhiệm vụ đi học cũ chưa tick
  }
  // Lịch học & làm hôm nay: tóm tắt từ 5h sáng, nhiệm vụ "🏫 môn" / "💼 ca" (không phạt), nhắc trước 60 phút, vào giờ thì trạng thái = Đang học / Đang làm việc
  const classes = s.classes.filter(c => c.date === today);
  if (classes.length && s.classDay !== today && new Date(now).getHours() >= 5) {
    s.classDay = today;
    const on = classes.filter(c => !c.off), nS = on.filter(c => !isWork(c)).length, nW = on.length - nS;
    const head = [nS && `${nS} buổi học`, nW && `${nW} lịch làm`].filter(Boolean).join(' · ') || '0 buổi học';
    out.push({ kind: 'class', msg: `${nS || !nW ? '🏫' : '💼'} Hôm nay có ${head}: ${classes.map(c => c.off ? `${c.subject} (tạm ngưng)` : `${clock(classTime(s, c).start)} ${nS && nW ? schedIcon(c) + ' ' : ''}${c.subject}`).join(' · ')}`, notify: true });
  }
  for (const c of classes) {
    if (c.off) continue;
    const { start, end } = classTime(s, c);
    if (!c.task && now < end) {
      c.task = uid();
      s.tasks.push({ id: c.task, title: `${schedIcon(c)} ${c.subject}`, cat: isWork(c) ? 'spi' : 'int', diff: 2, start, due: end, week: null, status: 'todo', createdAt: now, soft: true, classId: c.id });
    }
    if (!c.warned && now >= start - HOUR && now < start) {
      c.warned = true;
      out.push({ kind: 'class', msg: `${schedIcon(c)} ${Math.round((start - now) / MIN)} phút nữa ${isWork(c) ? 'vào' : 'học'} ${c.subject} · ${clock(start)}–${clock(end)}${c.room ? ` · ${c.online ? '💻' : '📍'} ${c.room}` : ''}`, subject: c.subject, room: c.room, online: c.online, work: isWork(c), notify: true });
    }
    if (!s.status && now >= start && now < end) { s.status = isWork(c) ? 'work' : 'study'; s.statusAt = now; }
  }
  // 🎲 Nhiệm vụ ngẫu nhiên theo lịch: 1 lần/ngày từ 5h (không phạt, qua ngày tự dọn như nhiệm vụ đi học)
  if (s.settings.schedQuests && s.schedQDay !== today && new Date(now).getHours() >= 5) {
    const qs = schedQuests(s, now);
    if (qs.length) s.schedQDay = today; // chưa có lịch → thử lại ở tick sau (thêm lịch trong ngày vẫn có nhiệm vụ)
    for (const q of qs) s.tasks.push({ id: uid(), ...q, week: null, status: 'todo', createdAt: now, soft: true, gen: 'sched', startAlerted: q.start <= now + 10 * MIN }); // đã báo trong tin tóm tắt
    if (qs.length) out.push({ kind: 'info', msg: `🎲 ${qs.length} nhiệm vụ theo lịch hôm nay: ${qs.map(q => `${clock(q.start)} ${q.title.slice(3)}`).join(' · ')}` });
  }
  if (s.water.day !== today) s.water = { day: today, cups: 0, ask: 0 };
  if (s.status === 'game' && !s.gameWarned && now - s.statusAt >= HOUR) {
    s.gameWarned = true;
    out.push({ kind: 'nag', msg: '🎮 Chơi game 1 tiếng rồi — nghỉ mắt, uống nước, làm 1 nhiệm vụ nhỏ nha!', task: 'nghỉ mắt 5 phút', notify: true });
  }
  const L = s.learn, st = s.settings, awake = new Date(now).getHours() >= 7 && new Date(now).getHours() < 22 && !s.focus;
  if (L.day !== today) { // từ mới chỉ khi hôm qua đã học xong; chưa xong thì học lại bộ cũ
    if (L.zhDone) L.zhFrom += L.zhCount;
    Object.assign(L, { day: today, zhCount: st.zhPerDay, zhDone: false, enDone: false, next: now + 5 * MIN });
  }
  if (L.next && now >= L.next && awake) {
    L.next = now + 90 * MIN;
    const words = zhToday(s), parts = [];
    if (words.length && !L.zhDone) parts.push(`📖 ${words.length} từ tiếng Trung hôm nay: ${words.slice(0, 3).map(w => `${w.hz} (${w.vi})`).join(', ')}…`);
    if (st.enDaily && !L.enDone) parts.push(`🔤 Tiếng Anh B1: ${enTip(now)}`);
    if (parts.length) out.push({ kind: 'study', msg: parts.join('\n'), word: words[0] || null, notify: true });
  }
  if (st.itRemind && !L.itNext) L.itNext = now + rnd(3, 7) * DAY; // hiếm: 1 lần mỗi 1–2 tuần
  if (st.itRemind && now >= L.itNext && awake) {
    L.itNext = now + rnd(7, 14) * DAY;
    out.push({ kind: 'study', msg: `💻 ${IT_TIPS[rnd(0, IT_TIPS.length - 1)]}`, it: true, notify: true });
  }
  const dow = new Date(now).getDay();
  for (const rt of s.routines) {
    if (rt.last === today || !rt.days.includes(dow)) continue;
    rt.last = today;
    const due = atTime(now, rt.to);
    if (now < due) s.tasks.push({ id: uid(), title: rt.title, cat: rt.cat, diff: rt.diff, due, start: atTime(now, rt.from),
      week: null, status: 'todo', createdAt: now, routine: rt.id, keep: rt.keep });
  }
  if (s.bounty.day !== today) s.bounty = rollBounty(now);

  for (const t of s.tasks) {
    if (t.status !== 'todo') continue;
    const d = deadline(t);
    if (d && now > d && !t.penalized && !t.soft && !frozen(s, now)) {
      t.penalized = true;
      s.log.push({ t: now, k: 'fail', cat: t.cat });
      hurt(s, 5 * t.diff, `Trễ hạn "${t.title}"`, now, out);
    }
    if (t.start && !t.startAlerted && now >= t.start - 10 * MIN && now < t.start + 30 * MIN) {
      t.startAlerted = true;
      out.push({ kind: 'alert', msg: `⏰ ${now < t.start ? '10 phút nữa' : 'Tới giờ'}: ${t.title} (${clock(t.start)}–${clock(t.due)})`, task: t.title, notify: true });
    }
    if (t.due && !t.alerted && !t.soft && t.due > now && t.due - now <= 10 * MIN) {
      t.alerted = true;
      out.push({ kind: 'alert', msg: `⏰ Sắp tới hạn: ${t.title}`, task: t.title, notify: true });
    }
  }

  const wk = weekKey(now);
  if (wk !== s.boss.week) {
    const left = s.tasks.filter(t => t.week === s.boss.week && t.status === 'todo');
    if (left.length) {
      hurt(s, 15, `${bossOf(s.boss.week).name} bỏ trốn cùng ${left.length} nhiệm vụ`, now, out);
      for (const t of left) t.week = wk; // nhiệm vụ tồn đọng dồn sang Boss tuần mới
    }
    s.boss = { week: wk, defeated: false };
  }

  if (s.hidden && now > s.hidden.until) {
    s.hidden = null;
    out.push({ kind: 'info', msg: '🌫️ Nhiệm vụ ẩn đã biến mất...' });
  }
  if (!s.hidden && now >= s.nextHidden) {
    const h = new Date(now).getHours();
    if (h >= 8 && h < 23 && !s.focus && !frozen(s, now)) {
      const pool = STATUSES[s.status] ? STATUSES[s.status].hidden : HIDDEN;
      s.hidden = { title: pool[rnd(0, pool.length - 1)], until: now + 5 * MIN };
      s.nextHidden = now + rnd(45, 120) * MIN;
      out.push({ kind: 'hidden', msg: `❓ Nhiệm vụ ẩn: ${s.hidden.title} (5 phút)`, notify: true });
    } else s.nextHidden = now + 20 * MIN;
  }

  if (now >= s.nextNag) {
    s.nextNag = now + 90 * MIN;
    const h = new Date(now).getHours(), eod = endOfDay(now);
    const due = s.tasks.filter(t => t.status === 'todo' && deadline(t) && deadline(t) <= eod).sort((a, b) => deadline(a) - deadline(b));
    if (due.length && h >= 8 && h < 23 && !s.focus && !frozen(s, now))
      out.push({ kind: 'nag', msg: `📌 Còn ${due.length} nhiệm vụ hôm nay — gần nhất: "${due[0].title}"`, task: due[0].title, notify: true });
  }

  const every = s.settings.waterEvery;
  if (every > 0 && now >= s.nextWater) {
    s.nextWater = now + every * MIN;
    const h = new Date(now).getHours();
    if (h >= 7 && h < 23 && !frozen(s, now)) { s.water.ask = now + 15 * MIN; out.push({ kind: 'water', msg: '💧 Tới giờ uống nước rồi!', notify: true }); }
  }
  if (s.water.ask && now > s.water.ask) s.water.ask = 0;

  const food = petFood(s, now);
  if (food < 25 && !s.pet.warned) {
    s.pet.warned = true;
    out.push({ kind: 'pet', msg: '🥺 Pet đói bụng rồi… cho ăn để giữ buff thân thiết nhé', notify: true });
  }
  for (const a of ACH) if (!s.achSeen.includes(a.id) && !s.ach.includes(a.id) && a.test(s)) {
    s.achSeen.push(a.id);
    out.push({ kind: 'ach', msg: `🏅 Mở khóa thành tựu "${a.name}" — vào nhận ${a.gold} vàng!`, notify: true });
  }

  s.hero.hp = Math.min(s.hero.hp, maxHp(s));
  if (s.log.length > 5000) s.log = s.log.slice(-4000);
  return out;
}

// ---------- hiểu câu tiếng Việt → nhiệm vụ (chạy tại máy, không cần mạng) ----------
// Bỏ dấu, giữ nguyên độ dài chuỗi (chuỗi NFC tiếng Việt: mỗi ký tự → 1 ký tự) để vị trí khớp dùng lại được trên câu gốc.
const unaccent = t => t.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/đ/g, 'd').replace(/Đ/g, 'D').toLowerCase();
const tokens = t => [...t.matchAll(/[\p{L}\p{N}]+/gu)].map(m => ({ w: unaccent(m[0]), i: m.index, j: m.index + m[0].length }));
function lev(a, b) {
  const d = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    let prev = d[0]; d[0] = i;
    for (let j = 1; j <= b.length; j++) { const t = d[j]; d[j] = Math.min(d[j] + 1, d[j - 1] + 1, prev + (a[i - 1] === b[j - 1] ? 0 : 1)); prev = t; }
  }
  return d[b.length];
}
const fuzzy = (a, b) => a === b || (a.length >= 4 && b.length >= 4 && a[0] === b[0] && lev(a, b) <= (Math.min(a.length, b.length) >= 6 ? 2 : 1));
const WEAK = new Set(['mon', 'hoc', 'bai', 'va', 'cua', 'cho', 'lam', 'phan', 'nang', 'cao', 'tien']);
// Môn học trong câu: viết tắt (nckh, cnpm) hoặc chuỗi ≥2 từ liên tiếp giống tên môn (chịu gõ sai); môn 1–2 từ thì 1 từ riêng (triết) cũng được.
function matchSubject(ws, subjects) {
  let best = null;
  const take = (name, score, i, j) => { if (!best || score > best.score) best = { name, score, i, j }; };
  for (const name of subjects) {
    const sw = tokens(name).map(x => x.w), acr = sw.map(x => x[0]).join('');
    for (const t of ws) if (acr.length >= 3 && t.w.length >= 3 && (acr.startsWith(t.w) || acr.endsWith(t.w))) take(name, 10 + t.w.length, t.i, t.j);
    for (let a = 0; a < ws.length; a++) for (let b = 0; b < sw.length; b++) {
      let k = 0;
      while (a + k < ws.length && b + k < sw.length && fuzzy(ws[a + k].w, sw[b + k])) k++;
      const strong = ws.slice(a, a + k).filter(x => !WEAK.has(x.w)).length;
      if ((k >= 2 && strong) || (k === 1 && sw.length <= 2 && strong && ws[a].w.length >= 5)) take(name, 2 * k + strong, ws[a].i, ws[a + k - 1].j);
    }
  }
  return best;
}
// [mẫu trên câu đã bỏ dấu, nhánh, độ khó] — mẫu đầu tiên khớp thắng
const KINDS = [
  [/\b(do an|du an|project|bai tap lon|tieu luan|luan van|khoa luan)\b/, 'int', 3],
  [/\b(di thi|lich thi|on thi|thi cuoi|thi giua|thi thu|bai thi|kiem tra|quiz|midterm)\b/, 'int', 3],
  [/\b(code|lap trinh|chuong trinh|thuat toan|coding|debug|app|web)\b/, 'int', 2],
  [/\b(bao cao|viet bai|essay|bai dich|dich bai)\b/, 'int', 2],
  [/\b(bai tap|btvn|homework|lam bai|giai bai)\b/, 'int', 2],
  [/\b(thuyet trinh|slide|powerpoint|trinh bay|present)\b/, 'cre', 2],
  [/\b(ve tranh|ve hinh|thiet ke|design|dung video|edit video|chup anh)\b/, 'cre', 2],
  [/\b(on tap|on bai|hoc bai|doc|xem lai|tim hieu|tu vung|hoc thuoc)\b/, 'int', 1],
  [/\b(chay bo|tap gym|gym|the duc|di boi|da bong|yoga|tap luyen|di bo)\b/, 'str', 2],
  [/\b(don dep|don phong|giat do|nau an|thien|goi dien|di cho)\b/, 'spi', 1],
];
const CTX = '(?:(?:nop bai|nop|han chot|han nop|han|deadline|truoc|den|toi|cho den|xong|trong|vao|luc|ngay|la)\\s+)*';
const WD_NUM = { 2: 1, 3: 2, 4: 3, 5: 4, 6: 5, 7: 6, hai: 1, ba: 2, tu: 3, nam: 4, sau: 5, bay: 6 };
const WD_NAME = ['Chủ nhật', 'thứ 2', 'thứ 3', 'thứ 4', 'thứ 5', 'thứ 6', 'thứ 7'];
// Hạn chót trong câu → {day (ms 0h), time [h, m] | null, when 'next' | null, nextClass, why, spans [[i, j]] để xóa khỏi tên}
function findDue(n, line, now) {
  const r = { day: null, time: null, when: null, nextClass: false, why: '', spans: [] }, today = startOfDay(now), dow = new Date(now).getDay();
  const hit = (re, fn) => { const m = re.exec(n); if (m && fn(m) !== false) r.spans.push([m.index, m.index + m[0].length]); return m; };
  const tuanSau = /\btuan (sau|toi)\b/.test(n);
  hit(new RegExp(`${CTX}\\b(\\d{1,2})[/.-](\\d{1,2})(?:[/.-](\\d{2,4}))?\\b`), m => {
    const y0 = new Date(now).getFullYear(), y = m[3] ? (+m[3] < 100 ? 2000 + +m[3] : +m[3]) : y0, dt = new Date(y, m[2] - 1, +m[1]);
    if (dt.getMonth() !== m[2] - 1 || dt.getDate() !== +m[1]) return false;
    r.day = !m[3] && +dt < today - 30 * DAY ? +new Date(y + 1, m[2] - 1, +m[1]) : +dt;
    r.why = `hạn ${pad(+m[1])}/${pad(+m[2])}`;
  });
  if (r.day === null) hit(new RegExp(`${CTX}\\b(?:thu\\s*(2|3|4|5|6|7|hai|ba|tu|nam|sau|bay)|chu nhat)\\b|(?:(?:nop|han|truoc|den|toi|vao)\\s+)+(?:t([2-7])|cn)\\b`), m => {
    const w = m[1] || m[2] ? WD_NUM[m[1] || m[2]] : 0, monday = today - ((dow + 6) % 7) * DAY;
    let day = monday + ((w + 6) % 7) * DAY;
    if (tuanSau) day += 7 * DAY; else if (day <= today) day += 7 * DAY;
    r.day = day; r.why = `hạn ${WD_NAME[w]}${tuanSau ? ' tuần sau' : ''}`;
  });
  if (r.day === null) hit(new RegExp(`${CTX}\\b(ngay mai|mai)\\b`), m => {
    const at = m.index + m[0].length - 3; // "mai" viết hoa giữa câu = tên người (VD: Mai Phú Hợp)
    if (line[at] === 'M' && at > 0) return false;
    r.day = today + DAY; r.why = 'hạn ngày mai';
  });
  if (r.day === null && /ngày\s+(?:kia|mốt)|(?<![\p{L}])mốt(?![\p{L}])/u.test(line)) // "mốt" bỏ dấu trùng "một" → xét trên câu gốc
    hit(new RegExp(`${CTX}\\b(ngay kia|ngay mot|mot)\\b`), () => { r.day = today + 2 * DAY; r.why = 'hạn ngày kia'; });
  if (r.day === null) hit(new RegExp(`${CTX}\\b(hom nay|toi nay|chieu nay|trong ngay)\\b`), m => {
    if (m.index < 12 && m[0].startsWith('hom nay')) return false; // "hôm nay thầy giao…" = ngày giao, không phải hạn
    r.day = today; r.why = 'hạn hôm nay';
  });
  if (r.day === null) hit(new RegExp(`${CTX}\\b(?:trong\\s+(\\d{1,2})\\s+(ngay|tuan)|(\\d{1,2})\\s+(ngay|tuan)\\s+(?:nua|toi))\\b`), m => {
    const k = +(m[1] || m[3]), unit = (m[2] || m[4]) === 'tuan' ? 7 : 1;
    r.day = today + k * unit * DAY; r.why = `hạn ${k} ${unit === 7 ? 'tuần' : 'ngày'} nữa`;
  });
  if (r.day === null) hit(new RegExp(`${CTX}\\bcuoi tuan(?: nay)?\\b`), () => { r.day = today + ((7 - dow) % 7) * DAY; r.why = 'hạn cuối tuần'; });
  hit(new RegExp(`${CTX}\\b(?:buoi|tiet|lan hoc|lop)\\s+(?:sau|toi|ke tiep|tiep theo)\\b`), () => { r.nextClass = true; });
  hit(new RegExp(`(?:(?:luc|truoc|den|vao|han)\\s+)+(\\d{1,2})\\s*(?:h|g|gio)\\s*(\\d{2})?\\b|\\b(\\d{1,2})\\s*(?:h|g)\\s*(\\d{2})\\b|\\b(\\d{1,2}):(\\d{2})\\b`), m => {
    const h = +(m[1] ?? m[3] ?? m[5]), mi = +(m[2] ?? m[4] ?? m[6] ?? 0);
    if (h > 23 || mi > 59) return false;
    r.time = [h, mi];
  });
  if (r.day === null && tuanSau && !r.nextClass) r.when = 'next';
  if (tuanSau) hit(new RegExp(`${CTX}\\btuan (?:sau|toi)\\b`), () => { if (r.when === 'next') r.why = 'tuần sau'; }); // bỏ "tuần sau" khỏi tên
  return r;
}
const FILLER = [
  /^(?:sang |chieu |toi |ban )?(?:hom )?nay\s+/,
  /^(?:thay|co|giang vien|gv|sep|truong nhom|nhom)(?:\s+(?:toi|minh|em|tui|chung em|chung toi))?\s+(?:giao|cho|bao|dan|yeu cau|ra|nhac)(?:\s+(?:lam|them|ve))?\s+/,
  /^(?:toi|minh|em|tui)\s+(?:phai|can|se|duoc giao|co)\s+/,
  /^(?:can|phai|nho|nho la|nhac)\s+/,
];
// Văn bản (nhiều dòng / file .txt) → [{title, cat, diff, due, when, why[], subject}]; fallback = danh sách khi không đọc được hạn.
function parseTasks(text, s, now, fallback = 'week') {
  const subjects = [...new Set((s.classes || []).filter(c => !isWork(c)).map(c => c.subject))];
  const lines = String(text || '').normalize('NFC').split(/\r?\n|;|•/).map(l => l.replace(/^\s*(?:[-*+]|\d{1,2}[.)])\s+/, '').trim()).filter(l => l.length >= 3);
  return lines.slice(0, 30).map(line => {
    const n = unaccent(line), why = [];
    let cat = null, diff = 2;
    for (const [re, c, d] of KINDS) if (re.test(n)) { cat = c; diff = d; break; }
    if (/(?<![\p{L}])(khó|nhiều|dài|quan trọng)(?![\p{L}])/iu.test(line)) diff = Math.min(3, diff + 1);
    if (/(?<![\p{L}])(nhỏ|nhẹ|ngắn|dễ|nhanh)(?![\p{L}])/iu.test(line)) diff = 1;
    const sub = matchSubject(tokens(line), subjects);
    if (sub) why.push(`môn ${sub.name}`);
    const d = findDue(n, line, now);
    let due = d.day === null ? null : d.day + (d.time ? (d.time[0] * 60 + d.time[1]) * MIN : DAY - MIN);
    let when = d.when;
    if (d.why) why.push(d.why);
    if (due === null && !when && sub) {
      const next = s.classes.filter(c => c.subject === sub.name && !c.off && !isWork(c)).map(c => classTime(s, c).start).filter(t => t > now).sort((a, b) => a - b)[0];
      if (next) { due = next; why.push('hạn: trước buổi học tới'); }
    }
    if (due === null && d.time) { due = startOfDay(now) + (d.time[0] * 60 + d.time[1]) * MIN; if (due <= now) due += DAY; why.push('hạn giờ ghi trong câu'); }
    if (due === null && !when) { when = fallback; why.push('chưa có hạn'); }
    // Tên: bỏ cụm hạn, thay tên môn gõ tắt/sai bằng tên chuẩn, bỏ "nay / thầy giao / tôi phải…"
    let title = line, last = Infinity;
    const edits = [...d.spans.map(([i, j]) => [i, j, '']), ...(sub ? [[sub.i, sub.j, sub.name]] : [])].sort((a, b) => b[0] - a[0]);
    for (const [i, j, rep] of edits) { if (j > last) continue; title = title.slice(0, i) + rep + title.slice(j); last = i; }
    for (let k = 0; k < 3; k++) for (const re of FILLER) { const m = re.exec(unaccent(title)); if (m) title = title.slice(m[0].length); }
    title = title.replace(/\s+/g, ' ').replace(/^[\s,.:;–-]+|[\s,.:;–-]+$/g, '');
    title = (title ? title[0].toUpperCase() + title.slice(1) : line).slice(0, 200);
    return { title, cat: cat || 'int', diff, due, when: due === null ? when : 'inbox', why, subject: sub ? sub.name : null };
  });
}

// ---------- nhiều người dùng (DB = cả file save) ----------
// DB = { v:2, active, override:{id, from, until}|null, profiles:[{id, name, default, sweet, schedule:[{days, from, to}]}], states:{id: state} }
const cleanSlot = x => {
  const days = [...new Set([].concat((x && x.days) || []).map(Number))].filter(d => d >= 0 && d <= 6).sort();
  return days.length && okHM(x.from) && okHM(x.to) && hmMin(x.from) < hmMin(x.to) ? { days, from: x.from, to: x.to } : null;
};
function hydrateDB(raw, now) {
  if (!raw || !raw.states) { // save v1 (một người) → hồ sơ 'main'
    const st = hydrate(raw || {}, now);
    return { v: 2, active: 'main', override: null, profiles: [{ id: 'main', name: st.hero.name, default: true, sweet: false, schedule: [] }], states: { main: st } };
  }
  const db = { v: 2, override: null, ...raw, states: {} };
  for (const p of db.profiles) db.states[p.id] = hydrate(raw.states[p.id] || {}, now);
  if (!db.states[db.active]) db.active = db.profiles[0].id;
  return db;
}
const newDB = now => hydrateDB(null, now);
// Hồ sơ theo lịch lúc now; không khớp lịch nào → hồ sơ default.
function scheduled(db, now) {
  const d = new Date(now), dow = d.getDay(), m = d.getHours() * 60 + d.getMinutes();
  const p = db.profiles.find(x => (x.schedule || []).some(r => r.days.includes(dow) && m >= hmMin(r.from) && m < hmMin(r.to)));
  return (p || db.profiles.find(x => x.default) || db.profiles[0]).id;
}
// Ai nên đang dùng: đổi tay (override, hết hạn khi lịch đổi người hoặc sau 6 giờ) › giữ phiên (holds) › lịch.
function resolveProfile(db, now) {
  const sched = scheduled(db, now), o = db.override;
  if (o && (o.from !== sched || now > o.until || !db.states[o.id])) db.override = null;
  if (db.override) return db.override.id;
  const cur = db.states[db.active];
  return sched !== db.active && cur && holds(cur, now) ? db.active : sched;
}
function switchProfile(db, id, now) {
  if (id === db.active || !db.states[id]) return [];
  const old = db.states[db.active];
  if (old) { old.pet.food = petFood(old, now); old.pet.at = now; } // Pet của người vắng mặt không đói
  db.active = id;
  const s = db.states[id], p = db.profiles.find(x => x.id === id);
  s.pet.at = now; s.status = null; s.statusHold = 0;
  s.nextNag = now + 30 * MIN; s.nextHidden = Math.max(s.nextHidden, now + 15 * MIN);
  if (s.settings.waterEvery) s.nextWater = now + s.settings.waterEvery * MIN;
  if (s.learn.day === dayKey(now)) s.learn.next = now + 3 * MIN;
  return [{ kind: 'switch', msg: `👤 ${p.name} đang dùng máy`, name: p.name, sweet: !!p.sweet, notify: true }];
}
const syncProfile = (db, now) => switchProfile(db, resolveProfile(db, now), now);
const DB_ACTIONS = {
  switchTo(db, p, now) {
    if (!db.states[p.id]) return;
    const sched = scheduled(db, now);
    // Chọn đúng người theo lịch → bỏ đổi tay; nhưng nếu người đang dùng đang "giữ máy" thì vẫn phải ghi đè, không thì giữ máy thắng.
    const plain = p.id === sched && !(p.id !== db.active && holds(db.states[db.active], now));
    db.override = plain ? null : { id: p.id, from: sched, until: now + 6 * HOUR };
  },
  setProfile(db, p) {
    const x = db.profiles.find(q => q.id === p.id);
    if (!x) return;
    if ('sweet' in p) x.sweet = p.sweet === true || p.sweet === 'true';
    if (p.name) x.name = String(p.name).trim().slice(0, 24) || x.name;
    if (Array.isArray(p.schedule)) x.schedule = p.schedule.map(cleanSlot).filter(Boolean).slice(0, 7);
  },
};
function dbAct(db, type, p, now) {
  if (Object.hasOwn(DB_ACTIONS, type)) DB_ACTIONS[type](db, p || {}, now);
  return syncProfile(db, now);
}

const G = { MIN, HOUR, DAY, CATS, DIFF, TIERS, NODES, CLASSES, SHOP, BOSSES, item,
  dayKey, startOfDay, endOfDay, weekKey, weekEnd, bossOf, tier, maxHp, expNeed, frozen, deadline,
  expMult, heroTitle, doneOn, weekTasks, newState, hydrate, act, tick,
  BOND, BOND_NAMES, LOGIN, ACH, hasPet, ELEMENTS, PET_EVO, PET_MAX, STAGES, ACC_SLOTS, petNeed, petGet, petStage, petName, petSkill, elSkillTxt, petEvoReady, priceOf, petFood, bond, loginReady, bountyReady, achReady, rewardTxt, lastDone,
  STATUSES, suggestions, holds, clock, PERIODS, classTime, schedIcon, agenda, freeSlots, schedQuests, appStatus, stableStatus, parseTasks, unaccent, summary, answer, VOCAB, EN_TIPS, IT_TIPS, zhToday, enTip, wxInfo, parseWeather, weatherTips, weatherCheck, hydrateDB, newDB, scheduled, resolveProfile, syncProfile, dbAct };
if (typeof module !== 'undefined') module.exports = G; else window.G = G;
})();
