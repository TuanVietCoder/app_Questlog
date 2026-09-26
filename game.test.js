// Tự kiểm tra luật chơi: node game.test.js
const assert = require('assert');
const G = require('./game');
const T0 = +new Date('2026-09-14T09:00:00'); // Thứ Hai

let s = G.newState(T0);
G.act(s, 'addTask', { title: 'Code', cat: 'int', diff: 3, when: 'week' }, T0);
G.act(s, 'addTask', { title: 'Gym', cat: 'str', diff: 1, when: 'week' }, T0);
const [code, gym] = s.tasks;
assert.strictEqual(code.week, '2026-09-14');

let out = G.act(s, 'completeTask', { id: code.id }, T0);
assert.strictEqual(s.hero.exp, 50);
assert.strictEqual(s.skills.int, 3);
assert.ok(!s.boss.defeated && out.some(o => o.kind === 'hit'));
out = G.act(s, 'completeTask', { id: gym.id }, T0);
assert.ok(s.boss.defeated && s.inv.relic === 1, 'hết task tuần → hạ Boss');
assert.ok(s.hero.level >= 2, 'boss +150 EXP → lên cấp');

// Trễ hạn → mất máu đúng một lần
s = G.newState(T0);
G.act(s, 'addTask', { title: 'Báo cáo', diff: 2, due: T0 + G.HOUR }, T0);
G.tick(s, T0 + 2 * G.HOUR); G.tick(s, T0 + 3 * G.HOUR);
assert.strictEqual(s.hero.hp, 90);

// Nhắc trước 10 phút
s = G.newState(T0);
G.act(s, 'addTask', { title: 'Họp', due: T0 + 8 * G.MIN }, T0);
assert.ok(G.tick(s, T0).some(o => o.kind === 'alert'));

// Băng Giá: dời deadline, không mất máu
s = G.newState(T0); s.inv.freeze = 1;
G.act(s, 'addTask', { title: 'X', diff: 3, due: T0 + G.HOUR }, T0);
G.act(s, 'use', { id: 'freeze' }, T0);
G.tick(s, T0 + 2 * G.HOUR);
assert.strictEqual(s.hero.hp, 100);
assert.strictEqual(s.tasks[0].due, T0 + G.HOUR + G.DAY);

// HP về 0: mất streak trước, rồi mới mất EXP
s = G.newState(T0); s.hero.streak = 5; s.hero.hp = 5;
G.act(s, 'startFocus', { min: 25 }, T0);
G.act(s, 'cancelFocus', {}, T0);
assert.strictEqual(s.hero.streak, 0);
assert.strictEqual(s.hero.hp, 50);

// Focus xong → EXP, combo
s = G.newState(T0);
G.act(s, 'startFocus', { min: 25 }, T0);
G.tick(s, T0 + 24 * G.MIN); assert.ok(s.focus);
G.tick(s, T0 + 25 * G.MIN);
assert.ok(!s.focus && s.combo === 1 && s.hero.exp + s.hero.level > 1);

// Qua tuần: task tồn đọng dồn sang boss mới, mất máu
s = G.newState(T0);
G.act(s, 'addTask', { title: 'Y', diff: 1, when: 'week' }, T0);
G.tick(s, T0 + 7 * G.DAY);
assert.strictEqual(s.boss.week, '2026-09-21');
assert.strictEqual(s.tasks[0].week, '2026-09-21');
assert.strictEqual(s.hero.hp, 100 - 5 - 15);

// Điểm danh + mất streak khi bỏ ngày
s = G.newState(T0); s.settings.dailyGoal = 1;
G.act(s, 'addTask', { title: 'Z' }, T0);
G.act(s, 'claimDaily', {}, T0); assert.strictEqual(s.hero.streak, 0, 'chưa đủ task');
G.act(s, 'completeTask', { id: s.tasks[0].id }, T0);
G.act(s, 'claimDaily', {}, T0); assert.strictEqual(s.hero.streak, 1);
G.tick(s, T0 + G.DAY); assert.strictEqual(s.hero.streak, 1);
G.tick(s, T0 + 2 * G.DAY); assert.strictEqual(s.hero.streak, 0);

// Mua / đổi thưởng
s = G.newState(T0); s.hero.gold = 2500;
G.act(s, 'buy', { id: 'wpn_sword' }, T0); G.act(s, 'equip', { id: 'wpn_sword' }, T0);
assert.ok(s.weapon === 'wpn_sword' && s.hero.gold === 2350);
G.act(s, 'redeem', { id: 'r1' }, T0); assert.strictEqual(s.hero.gold, 350);

// Pet: đói dần, cho ăn, vuốt ve giới hạn/ngày, độ thân cộng EXP
s = G.newState(T0);
assert.strictEqual(Math.round(G.petFood(s, T0 + 10 * G.HOUR)), 40);
assert.ok(G.tick(s, T0 + 15 * G.HOUR).some(o => o.kind === 'pet'), 'báo đói');
G.act(s, 'use', { id: 'cake' }, T0 + 15 * G.HOUR); assert.strictEqual(s.inv.cake, 0, 'không có bánh thì không dùng');
G.act(s, 'use', { id: 'meat' }, T0 + 15 * G.HOUR);
assert.ok(s.inv.meat === 1 && Math.round(G.petFood(s, T0 + 15 * G.HOUR)) === 55 && s.pet.love === 2);
for (let i = 0; i < 30; i++) G.act(s, 'patPet', {}, T0);
assert.strictEqual(s.pet.love, 17, 'vuốt ve tối đa +15/ngày');
assert.strictEqual(G.bond(s), 1);
assert.ok(Math.abs(G.expMult(s, T0 + 15 * G.HOUR) - 1.03) < 1e-9);

// Pet đổi chỉ số: thỏ +15 HP, mèo +5% vàng; phải mua mới trang bị được
s = G.newState(T0); s.hero.gold = 5000;
G.act(s, 'equip', { id: 'pet_bunny' }, T0); assert.strictEqual(s.petKind, 'pet_slime');
G.act(s, 'buy', { id: 'pet_bunny' }, T0); G.act(s, 'equip', { id: 'pet_bunny' }, T0);
assert.strictEqual(G.maxHp(s), 115);
G.act(s, 'buy', { id: 'acc_crown' }, T0); G.act(s, 'equip', { id: 'acc_crown' }, T0);
assert.ok(s.accs.head === 'acc_crown' && s.hero.gold === 5000 - 800 - 2000);

// Quà đăng nhập: 1 lần/ngày, xoay vòng 7 ngày
s = G.newState(T0);
G.act(s, 'claimLogin', {}, T0); G.act(s, 'claimLogin', {}, T0);
assert.ok(s.hero.gold === 150 && s.login.n === 1);
G.tick(s, T0 + G.DAY); G.act(s, 'claimLogin', {}, T0 + G.DAY);
assert.ok(s.inv.meat === 4 && !G.loginReady(s));

// Nhiệm vụ ngày: tiến độ, nhận thưởng, thưởng thêm khi xong cả 3, đổi mới qua ngày
s = G.newState(T0);
s.bounty.list = [{ k: 'tasks', need: 2, text: 'a', gold: 10 }, { k: 'pat', need: 1, text: 'b', gold: 10 }, { k: 'feed', need: 1, text: 'c', gold: 10 }]
  .map(b => ({ ...b, prog: 0, done: false, got: false }));
for (let i = 0; i < 2; i++) { G.act(s, 'addTask', { title: 't' + i }, T0); G.act(s, 'completeTask', { id: s.tasks[i].id }, T0); }
G.act(s, 'patPet', {}, T0); G.act(s, 'use', { id: 'meat' }, T0);
assert.strictEqual(G.bountyReady(s), 3);
const chests = s.inv.chest;
[0, 1, 2].forEach(i => G.act(s, 'claimBounty', { i }, T0));
assert.ok(s.inv.chest === chests + 1 && s.bounty.bonus && G.bountyReady(s) === 0);
G.tick(s, T0 + G.DAY); assert.ok(!s.bounty.bonus && s.bounty.list.length === 3);

// Thành tựu: báo 1 lần, nhận 1 lần
s = G.newState(T0);
G.act(s, 'addTask', { title: 'x' }, T0); G.act(s, 'completeTask', { id: s.tasks[0].id }, T0);
assert.ok(G.tick(s, T0).some(o => o.kind === 'ach')); assert.ok(!G.tick(s, T0).some(o => o.kind === 'ach'));
const g0 = s.hero.gold; G.act(s, 'claimAch', { id: 'task1' }, T0); G.act(s, 'claimAch', { id: 'task1' }, T0);
assert.strictEqual(s.hero.gold, g0 + 50);

// Save cũ (chưa có pet) vẫn nạp được
const old = G.newState(T0); delete old.pet; delete old.stats; delete old.bounty; delete old.login; delete old.achSeen;
old.owned = ['skin_default'];
const h = G.hydrate(JSON.parse(JSON.stringify(old)), T0);
assert.ok(h.pet.food === 80 && h.owned.includes('pet_slime') && h.bounty.list.length === 3 && G.tick(h, T0));

// Nhắc nhiệm vụ: chỉ khi có việc hôm nay, 90 phút/lần
s = G.newState(T0);
assert.ok(!G.tick(s, T0 + 31 * G.MIN).some(o => o.kind === 'nag'), 'không có việc thì không nhắc');
G.act(s, 'addTask', { title: 'Nộp bài', when: 'today' }, T0);
assert.ok(!G.tick(s, T0 + 60 * G.MIN).some(o => o.kind === 'nag'), 'chưa tới lịch');
assert.ok(G.tick(s, T0 + 122 * G.MIN).some(o => o.kind === 'nag' && o.task === 'Nộp bài'));
assert.ok(!G.tick(s, T0 + 130 * G.MIN).some(o => o.kind === 'nag'));

// Ăn file: cộng độ no tối đa 5 file/lần, đếm thống kê, báo lỗi
s = G.newState(T0);
let ev = G.act(s, 'ateFiles', { names: ['a.txt', 'b.txt', 'c', 'd', 'e', 'f', 'g'], fail: 2 }, T0);
assert.ok(s.stats.eaten === 7 && s.pet.food === 95 && ev.some(o => o.kind === 'eat') && ev.some(o => o.kind === 'eatfail'));
assert.strictEqual(G.act(s, 'toString', {}, T0).length, 0, 'không gọi hàm lạ');

// Trạng thái người dùng: nhiệm vụ ẩn & gợi ý đúng ngữ cảnh, qua ngày thì xóa trạng thái
s = G.newState(T0);
G.act(s, 'setStatus', { id: 'study' }, T0);
assert.strictEqual(s.status, 'study');
for (let i = 0; i < 30; i++) { s.hidden = null; s.nextHidden = 0; G.tick(s, T0 + i); assert.ok(G.STATUSES.study.hidden.includes(s.hidden.title), 'nhiệm vụ ẩn phải hợp khi đang học'); }
const sug = G.suggestions(s);
assert.ok(sug.length === 3 && sug.every(x => G.STATUSES.study.suggest.includes(x)));
G.act(s, 'addTask', { title: sug[0][0], cat: sug[0][1], diff: sug[0][2], when: 'today' }, T0);
assert.ok(!G.suggestions(s, 0, 5).some(x => x[0] === sug[0][0]), 'việc đã nhận không gợi ý lại');
G.act(s, 'setStatus', { id: 'hack' }, T0); assert.strictEqual(s.status, null);
G.act(s, 'setStatus', { id: 'out' }, T0); G.tick(s, T0 + G.DAY); assert.strictEqual(s.status, null);

// Nhiệm vụ lặp lại T2–T6 12:00–13:00, giữ máy
s = G.newState(T0);
G.act(s, 'addRoutine', { title: 'Đưa laptop', days: [1, 2, 3, 4, 5], from: '12:00', to: '13:00', keep: true }, T0);
G.act(s, 'addRoutine', { title: 'sai giờ', days: [1], from: '13:00', to: '12:00' }, T0);
assert.strictEqual(s.routines.length, 1);
G.tick(s, T0); G.tick(s, T0 + G.MIN);
const lap = s.tasks.filter(x => x.routine);
assert.strictEqual(lap.length, 1, 'mỗi ngày tạo đúng 1 lần');
assert.strictEqual(lap[0].start, +new Date('2026-09-14T12:00:00'));
assert.ok(!G.holds(s, +new Date('2026-09-14T11:00:00')) && G.holds(s, +new Date('2026-09-14T12:10:00')));
assert.ok(G.tick(s, +new Date('2026-09-14T11:51:00')).some(o => o.kind === 'alert' && o.msg.includes('10 phút nữa')));
const SAT = +new Date('2026-09-19T09:00:00');
G.tick(s, SAT); assert.strictEqual(s.tasks.filter(x => x.routine).length, 1, 'thứ 7 không tạo');
s = G.newState(T0); G.act(s, 'addRoutine', { title: 'x', days: [1], from: '08:00', to: '08:30' }, T0);
G.tick(s, T0); assert.strictEqual(s.tasks.length, 0, 'đã qua giờ kết thúc thì bỏ qua hôm đó');

// Nhắc uống nước
s = G.newState(T0);
G.act(s, 'setSettings', { waterEvery: 45 }, T0);
assert.ok(!G.tick(s, T0 + 44 * G.MIN).some(o => o.kind === 'water'));
assert.ok(G.tick(s, T0 + 45 * G.MIN).some(o => o.kind === 'water') && s.water.ask);
G.act(s, 'drinkWater', {}, T0 + 46 * G.MIN);
assert.ok(s.water.cups === 1 && !s.water.ask && s.hero.gold === 105);
s.water.day = 'hôm qua'; G.tick(s, T0 + 50 * G.MIN); assert.strictEqual(s.water.cups, 0);

// Nhiều người dùng: Uyên T2–T6 8:30–12:00 (giữ máy tới khi đưa laptop), Việt phần còn lại
const at = h => +new Date('2026-09-14T' + h); // Thứ Hai
let db = G.hydrateDB(JSON.parse(JSON.stringify(G.newState(at('07:00:00')))), at('07:00:00'));
assert.ok(db.active === 'main' && db.profiles[0].default, 'save v1 → hồ sơ main');
db.profiles[0].name = 'Việt';
db.profiles.push({ id: 'uyen', name: 'Uyên', sweet: true, schedule: [{ days: [1, 2, 3, 4, 5], from: '08:30', to: '12:00' }] });
db = G.hydrateDB(JSON.parse(JSON.stringify(db)), at('07:00:00'));
const U = db.states.uyen;
G.act(U, 'addRoutine', { title: 'Đưa laptop cho Tuấn Việt', days: [1, 2, 3, 4, 5], from: '12:00', to: '13:00', keep: true }, at('07:00:00'));
assert.strictEqual(G.scheduled(db, at('08:29:00')), 'main');
ev = G.syncProfile(db, at('08:30:00'));
assert.ok(db.active === 'uyen' && ev[0].kind === 'switch' && ev[0].sweet);
G.tick(U, at('08:31:00'));
assert.strictEqual(G.syncProfile(db, at('12:05:00')).length, 0, 'chưa đưa laptop → vẫn là Uyên');
G.act(U, 'completeTask', { id: U.tasks.find(x => x.routine).id }, at('12:06:00'));
G.syncProfile(db, at('12:06:00')); assert.strictEqual(db.active, 'main', 'xong nhiệm vụ → sang Việt');
{ // Việt tự chọn mình khi Uyên chưa bấm bàn giao (đang giữ máy) → vẫn phải đổi được
  const d2 = G.hydrateDB(JSON.parse(JSON.stringify(db)), at('08:30:00'));
  G.syncProfile(d2, at('08:30:00'));
  G.tick(d2.states.uyen, at('08:31:00') + G.DAY);
  G.syncProfile(d2, at('12:10:00') + G.DAY); assert.strictEqual(d2.active, 'uyen', 'đang giữ máy');
  G.dbAct(d2, 'switchTo', { id: 'main' }, at('12:10:00') + G.DAY);
  assert.strictEqual(d2.active, 'main', 'đổi tay sang người theo lịch thắng giữ máy');
  G.syncProfile(d2, at('12:20:00') + G.DAY); assert.strictEqual(d2.active, 'main', 'không bị kéo lại Uyên');
}
G.syncProfile(db, at('20:00:00')); assert.strictEqual(db.active, 'main');
G.dbAct(db, 'switchTo', { id: 'uyen' }, at('20:00:00')); assert.strictEqual(db.active, 'uyen', 'đổi tay');
G.syncProfile(db, at('20:30:00')); assert.strictEqual(db.active, 'uyen', 'đổi tay giữ nguyên');
G.syncProfile(db, at('02:30:00') + G.DAY); assert.strictEqual(db.active, 'main', 'đổi tay hết hạn sau 6 giờ');
// Pet người vắng mặt không đói
const food0 = U.pet.food; // chốt lúc Uyên rời máy
G.dbAct(db, 'switchTo', { id: 'uyen' }, at('02:30:00') + 3 * G.DAY);
assert.strictEqual(G.petFood(U, at('02:30:00') + 3 * G.DAY), food0, 'vào lại sau 2 ngày → độ no giữ như lúc rời');
G.dbAct(db, 'setProfile', { id: 'uyen', schedule: [{ days: [9], from: '08:00', to: '09:00' }, { days: [6], from: '10:00', to: '11:00' }] }, at('07:00:00'));
assert.deepStrictEqual(db.profiles[1].schedule, [{ days: [6], from: '10:00', to: '11:00' }]);

// Học mỗi ngày: 7 từ tiếng Trung, học xong mới sang bộ mới; nhắc tiếng Anh B1; tin học hiếm
s = G.newState(T0);
G.act(s, 'setSettings', { zhPerDay: 7, enDaily: true, itRemind: true }, T0);
G.tick(s, T0);
assert.ok(G.VOCAB.length >= 390 && G.zhToday(s).length === 7 && G.zhToday(s)[0] === G.VOCAB[0]);
ev = G.tick(s, T0 + 6 * G.MIN).find(o => o.kind === 'study');
assert.ok(ev && ev.msg.includes(G.VOCAB[0].hz) && ev.msg.includes('Tiếng Anh B1'), 'nhắc từ + B1');
assert.ok(!G.tick(s, T0 + 60 * G.MIN).some(o => o.kind === 'study'), '90 phút mới nhắc lại');
G.tick(s, T0 + G.DAY); assert.strictEqual(G.zhToday(s)[0], G.VOCAB[0], 'chưa học xong → hôm sau học lại bộ cũ');
G.act(s, 'learnZh', {}, T0 + G.DAY); G.act(s, 'learnZh', {}, T0 + G.DAY);
assert.ok(s.stats.words === 7 && s.learn.zhDone, 'nhận thưởng 1 lần');
G.act(s, 'learnEn', {}, T0 + G.DAY); assert.strictEqual(s.stats.enDays, 1);
assert.ok(!G.tick(s, T0 + G.DAY + 100 * G.MIN).some(o => o.kind === 'study' && !o.it), 'học xong hết thì thôi nhắc');
G.tick(s, T0 + 2 * G.DAY); assert.strictEqual(G.zhToday(s)[0], G.VOCAB[7], 'hôm sau sang 7 từ tiếp theo');
s.learn.zhFrom = G.VOCAB.length - 2; assert.strictEqual(G.zhToday(s)[2], G.VOCAB[0], 'hết danh sách quay lại đầu');
let itCount = 0;
for (let d = 0; d < 60; d++) itCount += G.tick(s, T0 + d * G.DAY + G.HOUR).filter(o => o.it).length;
assert.ok(itCount >= 3 && itCount <= 12, 'nhắc thi tin học hiếm: ' + itCount + ' lần / 60 ngày');
s = G.newState(T0); G.tick(s, T0 + 6 * G.MIN); assert.ok(!G.tick(s, T0 + 100 * G.MIN).some(o => o.kind === 'study'), 'mặc định tắt');

// Thời tiết: dữ liệu mẫu Open-Meteo thật (TP.HCM 14/09 18:00, mưa phùn)
const SAMPLE = require('./tools/shot/weather-sample.json'), EVE = Date.parse('2026-09-14T11:00:00Z');
const w = G.parseWeather(SAMPLE, 'TP.HCM', EVE);
assert.ok(w.temp === 27 && w.rainProb === 94 && w.code === 53 && w.rain3h > 0);
assert.deepStrictEqual(G.weatherTips(w, 18).map(x => x.id), ['rainNow'], 'buổi tối không nhắc UV');
assert.ok(G.weatherTips({ ...w, code: 1, precip: 0, rain3h: 10, rainProb: 70 }, 8).some(x => x.id === 'rain' && x.text.includes('áo mưa')));
assert.ok(G.weatherTips({ ...w, code: 0, precip: 0, rain3h: 0, rainProb: 0, max: 36, uvMax: 11 }, 9).map(x => x.id).join().startsWith('hot,uv'));
assert.ok(G.weatherTips({ ...w, code: 0, precip: 0, rain3h: 0, rainProb: 0, min: 16, temp: 17 }, 7).some(x => x.id === 'cold' && x.text.includes('nước ấm')));
assert.throws(() => G.parseWeather({ error: true }, 'x', EVE));
s = G.newState(T0);
assert.strictEqual(G.weatherCheck(s, w, EVE).length, 0, 'mặc định không nhắc');
s.settings.weatherTips = true;
assert.strictEqual(G.weatherCheck(s, w, EVE).length, 1);
assert.strictEqual(G.weatherCheck(s, w, EVE + G.MIN).length, 0, 'mỗi loại 1 lần/ngày');
assert.strictEqual(G.weatherCheck(s, { ...w, at: EVE - 4 * G.HOUR }, EVE + G.DAY).length, 0, 'dữ liệu cũ quá 3 giờ thì bỏ');

// Lịch học: giờ theo tiết, nhiệm vụ đi học không phạt, nhắc 60 phút, tạm ngưng, dọn nhiệm vụ cũ
s = G.newState(T0);
G.act(s, 'addClass', { date: '2026-09-14', subject: 'Giải thuật nâng cao', from: 2, to: 6, room: 'B305', teacher: 'Nguyễn Hồng Vũ' }, T0 - G.DAY);
G.act(s, 'addClass', { date: '2026-09-14', subject: 'Triết học', from: 13, to: 16, room: 'Zoom034', online: true }, T0 - G.DAY);
G.act(s, 'addClass', { date: '2026-09-14', subject: 'Sai tiết', from: 7, to: 3 }, T0);
G.act(s, 'addClass', { date: '14/09/2026', subject: 'Sai ngày', from: 1, to: 2 }, T0);
assert.strictEqual(s.classes.length, 2);
const gt = G.classTime(s, s.classes[0]), tr = G.classTime(s, s.classes[1]);
assert.ok(G.clock(gt.start) === '07:20' && G.clock(gt.end) === '12:00' && G.clock(tr.start) === '18:30' && G.clock(tr.end) === '21:50');
const MORNING = +new Date('2026-09-14T06:00:00');
ev = G.tick(s, MORNING);
assert.ok(ev.some(o => o.kind === 'class' && o.msg.includes('2 buổi')), 'tóm tắt buổi sáng');
assert.ok(!G.tick(s, MORNING + G.MIN).some(o => o.kind === 'class' && o.msg.includes('buổi học:')), 'tóm tắt 1 lần/ngày');
assert.strictEqual(s.tasks.filter(t => t.soft && !t.gen).length, 2, 'tạo 2 nhiệm vụ đi học');
assert.ok(G.tick(s, +new Date('2026-09-14T06:25:00')).some(o => o.kind === 'class' && o.msg.includes('55 phút nữa học Giải thuật')));
G.tick(s, +new Date('2026-09-14T07:30:00')); assert.strictEqual(s.status, 'study', 'vào giờ học → Đang học');
const hp0 = s.hero.hp; G.tick(s, +new Date('2026-09-14T12:30:00'));
assert.strictEqual(s.hero.hp, hp0, 'quên tick đi học không bị phạt');
G.act(s, 'toggleClass', { id: s.classes[1].id }, T0);
assert.ok(s.classes[1].off && s.tasks.filter(t => t.soft && !t.gen && t.status === 'todo').length === 1, 'tạm ngưng → bỏ nhiệm vụ');
G.tick(s, T0 + G.DAY); assert.strictEqual(s.tasks.filter(t => t.soft).length, 0, 'qua ngày dọn nhiệm vụ đi học chưa tick');
G.act(s, 'setPeriods', { start: G.PERIODS.map(() => '25:00'), len: 50 }, T0); assert.strictEqual(s.periods.start[0], '06:30', 'khung giờ sai bị bỏ qua');
G.act(s, 'setPeriods', { start: G.PERIODS.map((x, i) => i ? x : '07:00'), len: 45 }, T0);
assert.ok(s.periods.start[0] === '07:00' && s.periods.len === 45);

// Lịch làm theo giờ (ca làm, trợ giảng): kind work, at [HH:MM, HH:MM]
s = G.newState(T0);
G.act(s, 'addClass', { date: '2026-09-14', subject: 'Triết học', from: 13, to: 16, room: 'Zoom034', online: true }, T0);
G.act(s, 'addClass', { date: '2026-09-14', subject: 'Ca 1', at: ['06:30', '14:30'], kind: 'work' }, T0);
G.act(s, 'addClass', { date: '2026-09-14', subject: 'Trợ giảng ở công ty', at: ['14:30', '17:00'], kind: 'work' }, T0);
G.act(s, 'addClass', { date: '2026-09-14', subject: 'Sai giờ', at: ['25:00', '17:00'], kind: 'work' }, T0);
assert.deepStrictEqual(s.classes.map(c => c.subject), ['Ca 1', 'Trợ giảng ở công ty', 'Triết học'], 'sắp theo giờ bắt đầu, bỏ giờ sai');
const ca1 = G.classTime(s, s.classes[0]); assert.ok(G.clock(ca1.start) === '06:30' && G.clock(ca1.end) === '14:30');
const night = G.classTime(s, { date: '2026-09-14', at: ['22:00', '06:00'] }); assert.strictEqual(night.end - night.start, 8 * G.HOUR, 'ca qua đêm');
ev = G.tick(s, +new Date('2026-09-14T05:00:00'));
assert.ok(ev.some(o => o.kind === 'class' && o.msg.includes('1 buổi học · 2 lịch làm') && o.msg.includes('06:30 💼 Ca 1')), JSON.stringify(ev));
assert.ok(G.tick(s, +new Date('2026-09-14T05:40:00')).some(o => o.work && o.msg.includes('50 phút nữa vào Ca 1') && !o.msg.includes('📍')));
assert.ok(s.tasks.some(t => t.soft && t.title === '💼 Ca 1'));
G.tick(s, +new Date('2026-09-14T07:00:00')); assert.strictEqual(s.status, 'work', 'vào ca → Đang làm việc');
assert.ok(!G.parseTasks('làm bài ca 1', s, T0)[0].subject, 'ca làm không bị hiểu là môn học');

// Thời khóa biểu dự kiến + giờ trống
s = G.newState(T0);
const D15 = +new Date('2026-09-15T00:00:00'), at15 = hhmm => +new Date(`2026-09-15T${hhmm}:00`);
G.act(s, 'addClass', { date: '2026-09-15', subject: 'Ca 1', at: ['06:30', '14:30'], kind: 'work' }, T0);
G.act(s, 'addClass', { date: '2026-09-15', subject: 'Triết học', from: 13, to: 16, online: true }, T0);
G.act(s, 'addRoutine', { title: 'Chạy bộ', cat: 'str', days: [2], from: '17:00', to: '18:00' }, T0);
G.act(s, 'addTask', { title: 'Nộp báo cáo', cat: 'int', diff: 2, when: 'today', due: at15('23:59') }, T0);
let ag = G.agenda(s, D15, D15 + G.DAY);
assert.deepStrictEqual(ag.map(x => `${G.clock(x.start)} ${x.kind} ${x.title}`), ['06:30 work Ca 1', '17:00 routine Chạy bộ', '18:30 class Triết học', '23:59 due Nộp báo cáo']);
assert.strictEqual(G.agenda(s, D15 - G.DAY, D15).length, 0, 'thứ Hai không có gì');
assert.strictEqual(G.agenda(s, D15, D15 + G.DAY, D15 + G.DAY).filter(x => x.kind === 'routine').length, 0, 'không chiếu nhiệm vụ lặp lại về quá khứ');
const slots = its => G.freeSlots(its, D15).map(([a, b]) => `${G.clock(a)}-${G.clock(b)}`);
assert.deepStrictEqual(slots(ag), ['14:30-17:00', '21:50-23:00'], 'khoảng < 60 phút và hạn chót không tính');
G.tick(s, at15('10:00'));
ag = G.agenda(s, D15, D15 + G.DAY);
assert.deepStrictEqual(ag.filter(x => x.title === 'Chạy bộ').map(x => x.kind), ['event'], 'nhiệm vụ lặp lại đã tạo → không chiếu trùng');
G.act(s, 'toggleClass', { id: s.classes.find(c => c.subject === 'Triết học').id }, T0);
assert.deepStrictEqual(slots(G.agenda(s, D15, D15 + G.DAY)), ['14:30-17:00', '18:00-23:00'], 'tạm ngưng → trống');
assert.deepStrictEqual(G.freeSlots([], D15).map(([a, b]) => (b - a) / G.HOUR), [17]);

// 🎲 Nhiệm vụ ngẫu nhiên theo lịch
s = G.newState(T0);
G.act(s, 'addClass', { date: '2026-09-15', subject: 'Ca 1', at: ['06:30', '14:30'], kind: 'work' }, T0);
G.act(s, 'addClass', { date: '2026-09-15', subject: 'Triết học', from: 13, to: 16, room: 'Zoom034', online: true }, T0);
assert.deepStrictEqual(G.schedQuests(s, T0), [], 'ngày không có lịch → không có nhiệm vụ');
let sq = G.schedQuests(s, at15('05:00'), 10);
assert.strictEqual(sq.length, 6, '2 lịch × trước/sau + 2 khoảng trống (14:30–18:30, 21:50–23:00)');
assert.ok(sq.every(q => q.title.startsWith('🎲 ') && !/[{}]/.test(q.title) && q.due > at15('05:00') && q.start <= q.due && G.CATS[q.cat]), JSON.stringify(sq));
assert.ok(sq.some(q => q.title.includes('Ca 1')) && sq.some(q => q.title.includes('Triết học') || q.title.includes('Zoom034')));
assert.ok(sq.some(q => q.title.startsWith('🎲 Giờ trống: ') && G.clock(q.start) === '14:30' && G.clock(q.due) === '18:30'), 'khoảng trống 14:30–18:30');
assert.strictEqual(new Set(G.schedQuests(s, at15('05:00'), 3).map(q => q.start + q.title)).size, 3);
sq = G.schedQuests(s, at15('22:00'), 10);
assert.ok(sq.length === 2 && sq.every(q => q.start === at15('22:00')), 'quá hạn thì bỏ, bắt đầu từ bây giờ');
ev = G.tick(s, at15('05:00'));
assert.strictEqual(s.tasks.filter(t => t.gen === 'sched' && t.soft).length, 3, 'tick tạo 3 nhiệm vụ không phạt');
assert.ok(!ev.some(o => o.kind === 'alert'), 'không báo "Tới giờ" trùng tin tóm tắt');
assert.ok(ev.some(o => o.msg.startsWith('🎲 3 nhiệm vụ theo lịch')));
G.tick(s, at15('06:00')); assert.strictEqual(s.tasks.filter(t => t.gen === 'sched').length, 3, '1 lần/ngày');
const hpQ = s.hero.hp; G.tick(s, at15('23:59') + 2 * G.MIN);
assert.strictEqual(s.hero.hp, hpQ, 'quên làm không bị phạt');
s = G.newState(T0); s.settings.schedQuests = false;
G.act(s, 'addClass', { date: '2026-09-15', subject: 'Ca 1', at: ['06:30', '14:30'], kind: 'work' }, T0);
G.tick(s, at15('05:00')); assert.strictEqual(s.tasks.filter(t => t.gen).length, 0, 'tắt trong cài đặt');
s = G.newState(T0); G.tick(s, at15('05:00'));
G.act(s, 'addClass', { date: '2026-09-15', subject: 'Ca 2', at: ['14:30', '22:30'], kind: 'work' }, at15('09:00'));
G.tick(s, at15('09:00')); assert.ok(s.tasks.filter(t => t.gen).length > 0, 'thêm lịch giữa ngày vẫn có nhiệm vụ');

// Hiểu câu → nhiệm vụ
s = G.newState(T0);
for (const [date, subject, from, to, room] of [['2026-09-19', 'Phương pháp nghiên cứu khoa học', 7, 11, 'A208'], ['2026-09-20', 'Phương pháp nghiên cứu khoa học', 8, 12, 'B308'],
  ['2026-09-20', 'Giải thuật nâng cao', 2, 6, 'B305'], ['2026-09-16', 'Triết học', 13, 16, 'Zoom034'], ['2026-09-26', 'Công nghệ phần mềm tiên tiến', 2, 6, 'D303']])
  G.act(s, 'addClass', { date, subject, from, to, room }, T0);
const TUE = +new Date('2026-09-15T10:00:00');
const vi = 'Nguyễn Hồng Vũ nghiên cứu khoa học Đường'; assert.strictEqual(G.unaccent(vi).length, vi.length, 'bỏ dấu giữ độ dài');
let [p] = G.parseTasks('nay thầy tôi giao bài tập code môn nguyên cứu khoa học', s, TUE);
assert.strictEqual(p.title, 'Bài tập code môn Phương pháp nghiên cứu khoa học');
assert.ok(p.cat === 'int' && p.diff === 2 && p.subject === 'Phương pháp nghiên cứu khoa học');
assert.strictEqual(G.clock(p.due) + ' ' + G.dayKey(p.due), '12:30 2026-09-19', 'hạn = buổi học tới của môn');
[p] = G.parseTasks('nộp báo cáo triết học trước thứ 6', s, TUE);
assert.ok(p.title === 'Nộp báo cáo Triết học' && G.dayKey(p.due) === '2026-09-18' && G.clock(p.due) === '23:59', JSON.stringify(p));
const many = G.parseTasks('- Đọc chương 3 giải thuật nâng cao hạn mai\n- chạy bộ 3km cuối tuần\n- thi giữa kỳ CNPM ngày 25/9 lúc 7h30\n- làm slide thuyết trình nhóm trong 3 ngày\n• ghi chú linh tinh', s, TUE);
assert.strictEqual(many.length, 5);
assert.ok(many[0].title === 'Đọc chương 3 Giải thuật nâng cao' && many[0].diff === 1 && G.dayKey(many[0].due) === '2026-09-16', JSON.stringify(many[0]));
assert.ok(many[1].title === 'Chạy bộ 3km' && many[1].cat === 'str' && G.dayKey(many[1].due) === '2026-09-20', JSON.stringify(many[1]));
assert.ok(many[2].title === 'Thi giữa kỳ Công nghệ phần mềm tiên tiến' && many[2].diff === 3 && G.clock(many[2].due) === '07:30' && G.dayKey(many[2].due) === '2026-09-25', JSON.stringify(many[2]));
assert.ok(many[3].cat === 'cre' && G.dayKey(many[3].due) === '2026-09-18', JSON.stringify(many[3]));
assert.ok(many[4].due === null && many[4].when === 'week', 'không có hạn → Tuần này');
[p] = G.parseTasks('hỏi thầy Mai Phú Hợp về bài tiểu luận tuần sau', s, TUE);
assert.ok(p.diff === 3 && p.due === null && p.when === 'next', 'tên Mai không phải "mai"; tuần sau → danh sách Tuần sau');
assert.strictEqual(p.title, 'Hỏi thầy Mai Phú Hợp về bài tiểu luận', 'bỏ "tuần sau" khỏi tên');
[p] = G.parseTasks('làm slide thuyết trình giải thuật tuần sau', s, TUE);
assert.ok(p.title === 'Làm slide thuyết trình Giải thuật nâng cao' && p.when === 'next' && p.cat === 'cre', JSON.stringify(p));
[p] = G.parseTasks('nộp bài triết học trước buổi sau', s, TUE);
assert.ok(p.title === 'Nộp bài Triết học' && G.clock(p.due) === '18:30' && G.dayKey(p.due) === '2026-09-16', JSON.stringify(p));
[p] = G.parseTasks('ôn thi giải thuật thứ 7 tuần sau', s, TUE);
assert.ok(p.title === 'Ôn thi Giải thuật nâng cao' && G.dayKey(p.due) === '2026-09-26' && p.diff === 3, JSON.stringify(p));
[p] = G.parseTasks('Hôm nay cô giao dịch 20 câu tiếng Trung', G.newState(T0), TUE, 'inbox');
assert.ok(p.title === 'Dịch 20 câu tiếng Trung' && p.when === 'inbox', JSON.stringify(p));
for (const t of many) { G.act(s, 'addTask', t, TUE); }
assert.strictEqual(s.tasks.length, 5, 'kết quả dùng thẳng cho addTask');

// Tự nhận biết trạng thái theo phần mềm đang dùng
assert.strictEqual(G.appStatus('WINWORD.EXE'), 'work');
assert.strictEqual(G.appStatus('POWERPNT'), 'work');
assert.strictEqual(G.appStatus('Code'), 'work');
assert.strictEqual(G.appStatus('steam'), 'game');
assert.strictEqual(G.appStatus('VALORANT-Win64-Shipping'), 'game');
assert.strictEqual(G.appStatus('HollowKnight', '', 'D:\\SteamLibrary\\steamapps\\common\\Hollow Knight\\hollow_knight.exe'), 'game');
assert.strictEqual(G.appStatus('msedge', '(3) Facebook — Personal - Microsoft Edge'), 'online');
assert.strictEqual(G.appStatus('chrome', 'Tài liệu không có tiêu đề - Google Tài liệu'), 'work');
assert.strictEqual(G.appStatus('browser', 'LMS HUIT - Cốc Cốc'), 'study');
assert.strictEqual(G.appStatus('explorer'), null);
assert.strictEqual(G.appStatus('QuestLog'), null);
const smp = (sts, t0) => sts.map((st, i) => ({ st, at: t0 - (sts.length - 1 - i) * 5000 }));
assert.strictEqual(G.stableStatus(smp(['work', 'work', 'online', 'work', 'work', 'work', 'work', 'null', 'work', 'work', 'work', 'work'].map(x => x === 'null' ? null : x), T0), T0), 'work');
assert.strictEqual(G.stableStatus(smp(['work', 'game', 'work', 'game', 'work', 'game'], T0), T0), null, 'lưỡng lự thì không đổi');
assert.strictEqual(G.stableStatus(smp(['game', 'game', 'game'], T0), T0), null, 'chưa đủ 30 giây');
s = G.newState(T0);
ev = G.act(s, 'autoStatus', { id: 'work', app: 'Microsoft Word' }, T0);
assert.ok(s.status === 'work' && s.statusAuto && ev[0].msg.includes('Microsoft Word'));
G.act(s, 'setStatus', { id: 'relax' }, T0 + G.MIN);
G.act(s, 'autoStatus', { id: 'game', app: 'Steam' }, T0 + 30 * G.MIN);
assert.strictEqual(s.status, 'relax', 'chọn tay → 1 giờ không tự đổi');
G.act(s, 'resumeAuto', {}, T0 + 31 * G.MIN);
G.act(s, 'autoStatus', { id: 'game', app: 'Steam' }, T0 + 31 * G.MIN);
assert.strictEqual(s.status, 'game', 'bấm tự nhận lại');
assert.ok(!G.tick(s, T0 + 80 * G.MIN).some(o => o.kind === 'nag' && o.msg.includes('Chơi game')));
assert.ok(G.tick(s, T0 + 92 * G.MIN).some(o => o.msg.includes('Chơi game 1 tiếng')), 'chơi 1 giờ → nhắc nghỉ');
s.settings.autoStatus = false; G.act(s, 'autoStatus', { id: 'work' }, T0 + 2 * G.HOUR); assert.strictEqual(s.status, 'game', 'tắt tự nhận');

// Pet lên cấp & tiến hóa
s = G.newState(T0);
assert.deepStrictEqual(G.petGet(s), { lv: 1, xp: 0, el: null });
let pe = []; // EXP qua hoàn thành nhiệm vụ khó (+50 EXP)
const give = times => { for (let i = 0; i < times; i++) { G.act(s, 'addTask', { title: 'x' + i, cat: 'int', diff: 3, when: 'today' }, T0); pe = pe.concat(G.act(s, 'completeTask', { id: s.tasks.at(-1).id }, T0)); } };
s.pet.food = 0; // đói → không buff thân thiết, EXP đúng bằng gốc
give(6); // 300 EXP → Lv 5 (cần 270)
assert.strictEqual(G.petGet(s).lv, 5);
assert.ok(pe.some(o => o.kind === 'evoready') && G.petEvoReady(s) && G.petStage(G.petGet(s)) === 0);
G.act(s, 'evolvePet', { el: 'bolt' }, T0); assert.strictEqual(G.petGet(s).el, null, 'hệ không thuộc loài → bỏ qua');
ev = G.act(s, 'evolvePet', { el: 'fire' }, T0);
assert.ok(ev.some(o => o.kind === 'evolve') && G.petName(s) === 'Slime Lửa' && Math.abs(G.petSkill(s, 'focus') - 0.08) < 1e-9 && G.petSkill(s, 'gold') === 0);
G.act(s, 'evolvePet', { el: 'water' }, T0); assert.strictEqual(G.petGet(s).el, 'fire', 'chọn rồi không đổi');
pe = []; while (G.petGet(s).lv < 15) give(1);
assert.ok(G.petName(s) === 'Slime Viêm Vương' && pe.some(o => o.kind === 'evolve') && Math.abs(G.petSkill(s, 'focus') - 0.15) < 1e-9);
pe = []; while (G.petGet(s).lv < 30) give(1);
assert.ok(G.petName(s) === 'Slime Viêm Vương ★' && pe.some(o => o.kind === 'evolve' && o.msg.includes('THỨC TỈNH')) && Math.abs(G.petSkill(s, 'focus') - 0.225) < 1e-9);
give(3); assert.ok(G.petGet(s).lv === 30 && G.petGet(s).xp === 0, 'tối đa Lv 30');
// mỗi loài nuôi riêng; mua pet tạo hồ sơ Lv 1
s.hero.gold = 99999; G.act(s, 'buy', { id: 'pet_owl' }, T0); G.act(s, 'equip', { id: 'pet_owl' }, T0);
assert.ok(G.petGet(s).lv === 1 && G.petGet(s, 'pet_slime').lv === 30 && G.petName(s) === 'Cú Thông Thái');
// nội tại loài mới
s = G.newState(T0); s.hero.gold = 99999;
for (const id of ['pet_hamster', 'pet_turtle', 'pet_trashbot', 'pet_carp']) G.act(s, 'buy', { id }, T0);
G.act(s, 'equip', { id: 'pet_turtle' }, T0); const gT = s.hero.gold; G.act(s, 'buy', { id: 'freeze' }, T0);
assert.strictEqual(gT - s.hero.gold, 210, 'Rùa: Băng Giá rẻ 30%');
G.act(s, 'equip', { id: 'pet_hamster' }, T0);
G.act(s, 'startFocus', { min: 25 }, T0); const hpH = s.hero.hp; G.act(s, 'cancelFocus', {}, T0 + G.MIN);
assert.strictEqual(s.hero.hp, hpH, 'Hamster: lần bỏ dở đầu không phạt');
G.act(s, 'startFocus', { min: 25 }, T0 + 2 * G.MIN); G.act(s, 'cancelFocus', {}, T0 + 3 * G.MIN);
assert.ok(s.hero.hp < hpH, 'lần thứ 2 vẫn phạt');
G.act(s, 'equip', { id: 'pet_trashbot' }, T0); const gR = s.hero.gold;
ev = G.act(s, 'ateFiles', { names: Array.from({ length: 12 }, (_, i) => 'f' + i) }, T0);
assert.ok(s.hero.gold - gR === 20 && ev[0].msg.includes('🤖 +20 vàng'), 'Robo: tối đa 20 vàng/ngày');
G.act(s, 'equip', { id: 'pet_carp' }, T0); s.hero.streak = 4; s.pet.food = 0;
assert.ok(Math.abs(G.expMult(s, T0) - 1.04) < 1e-9, 'Chép: +1% EXP mỗi ngày chuỗi');
// phụ kiện 3 chỗ đeo; save cũ 1 phụ kiện tự chuyển
s = G.hydrate({ acc: 'acc_glasses', owned: ['skin_default', 'pet_slime', 'pet_cat', 'acc_glasses', 'acc_scarf', 'acc_cap'] }, T0);
assert.ok(s.accs.face === 'acc_glasses' && !('acc' in s) && s.pets.pet_cat.lv === 1);
G.act(s, 'equip', { id: 'acc_scarf' }, T0); G.act(s, 'equip', { id: 'acc_cap' }, T0);
assert.deepStrictEqual(s.accs, { head: 'acc_cap', face: 'acc_glasses', neck: 'acc_scarf' });
G.act(s, 'equip', { id: 'acc_cap' }, T0); assert.strictEqual(s.accs.head, null, 'bấm lại để tháo');
assert.ok(G.SHOP.filter(i => i.kind === 'pet').every(i => i.short && i.evo.length === 2 && i.evo.every(e => G.ELEMENTS[e])), 'loài nào cũng có 2 hệ');

// Trợ lý "Hỏi Pet" ngoại tuyến: luôn có câu trả lời, số liệu lấy từ state
s = G.newState(T0);
G.act(s, 'addTask', { title: 'Nộp báo cáo', when: 'today' }, T0);
G.act(s, 'addClass', { date: '2026-09-14', subject: 'Lập trình Web', from: 7, to: 8, room: 'B2.14' }, T0);
assert.ok(G.answer(s, 'Hôm nay còn nhiệm vụ gì?', T0).includes('Nộp báo cáo'));
assert.ok(G.answer(s, 'lịch hôm nay sao?', T0).includes('Lập trình Web'));
assert.ok(G.answer(s, 'mình level mấy rồi', T0).includes('Lv 1'));
assert.ok(G.answer(s, 'pet đói chưa', T0).includes('no '));
// Khớp theo ranh giới từ: giới từ / tiếng lóng KHÔNG được kích hoạt nhầm luật trong app
for (const q of ['cách chèn mục lục trong Word?', 'ô nhiễm môi trường nước là gì', 'mình thương bạn', 'học phí bao nhiêu tiền']) {
  assert.ok(G.answer(s, q, T0).includes('khóa API'), 'câu ngoài app không được khớp nhầm: ' + q);
}
assert.ok(G.answer(s, 'thời tiết sao rồi', T0, null).includes('thời tiết'), '"thời tiết" không được rơi vào luật lịch');
const fb = G.answer(s, 'cách chèn mục lục trong Word?', T0);
assert.ok(fb.includes('Nộp báo cáo') && fb.includes('khóa API'), 'câu ngoài app: chỉ cách bật AI + vẫn gợi ý việc đang có');
const sum = G.summary(s, T0, null);
assert.ok(sum.includes('Nộp báo cáo') && sum.includes('Lập trình Web') && sum.includes('Lv 1'));
assert.ok(!sum.includes('undefined') && !sum.includes('NaN'));
assert.strictEqual(G.newState(T0).settings.aiKey, '');
G.act(s, 'setSettings', { aiKey: '  sk-ant-test  ' }, T0);
assert.strictEqual(s.settings.aiKey, 'sk-ant-test');

// Ghi nhớ thói quen trò chuyện: cắt gọn, giới hạn 10 dòng, mỗi hồ sơ một bộ nhớ riêng
assert.deepStrictEqual(G.newState(T0).chatNotes, [], 'save mới: chưa ghi nhớ gì');
assert.deepStrictEqual(G.hydrate({}, T0).chatNotes, [], 'save cũ tự có khóa mới');
s = G.newState(T0);
G.act(s, 'setChatNotes', { notes: ['  Uyên   hay hỏi từ vựng  ', '', 'x'.repeat(200), 'a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i'] }, T0);
assert.strictEqual(s.chatNotes.length, 10, 'tối đa 10 ghi chú');
assert.strictEqual(s.chatNotes[0], 'Uyên hay hỏi từ vựng', 'gộp khoảng trắng, bỏ dòng rỗng');
assert.strictEqual(s.chatNotes[1].length, 120, 'mỗi ghi chú tối đa 120 ký tự');
assert.ok(G.act(s, 'clearChatNotes', {}, T0).length && !s.chatNotes.length, 'xóa được ghi nhớ');
const dbN = G.newDB(T0);
G.act(dbN.states[dbN.active], 'setChatNotes', { notes: ['Việt thích trả lời ngắn'] }, T0);
assert.ok(!Object.values(dbN.states).filter(x => x !== dbN.states[dbN.active]).some(x => x.chatNotes.length), 'ghi nhớ không lây sang hồ sơ khác');

console.log('game.test.js: OK');
