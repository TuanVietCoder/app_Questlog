// Hành vi Pet — dùng chung cho widget và bảng điều khiển. Không chứa luật chơi: chỉ đọc state và gọi callback.
//   liếc theo chuột · tò mò khi chuột lại gần · vui khi rê lên · ngại khi bị nhìn lâu · nhột khi rê qua lại
//   bấm = vuốt ve (chọc nhiều = bực, chọc lúc ngủ = cáu) · nhấp đúp = nhào lộn · vắng 90s = ngủ gật
//   kéo file vào vùng Pet = há miệng, thả = ăn (main chuyển vào Thùng rác)
//   lúc rảnh: nhắc nhiệm vụ thật, than chán, đòi ăn, nói theo trạng thái (tắt được bằng settings.petTalk)
//   hồ sơ có sweet=true: tương tác dày hơn (lúc rảnh 8–18s), khen / nịnh (LINES.sweet*, {n} = tên), hỏi đáp có nút bấm (ASK_SWEET)
(function () {
const LINES = {
  pat: ['Hì hì~', 'Thích quá!', 'Nữa đi ❤', 'Ấm ghê~', 'Bạn tốt nhất!'],
  angry: ['Đủ rồi mà!', 'Chóng mặt quá…', 'Hừm!'],
  poke: ['Để mình ngủ tí…', 'Ư… đang mơ đẹp mà!', 'Hứ! Đánh thức mình!'],
  wake: ['Á! Bạn về rồi!', 'Mình không ngủ đâu nha…', 'Ơ… sáng rồi à?'],
  curious: ['Gì thế?', 'Hửm?', 'Cho xem với!'],
  shy: ['Nhìn gì mà nhìn~', 'Ngại quá à…', 'Đừng nhìn chằm chằm!'],
  tickle: ['Nhột quá! 🤣', 'Hahaha dừng lại!', 'Đừng cù mà!'],
  trick: ['Ta-da! ✨', 'Nhào lộn nè!', 'Giỏi không?'],
  chomp: ['Cho mình ăn hả? 😋', 'Aaa~ há miệng nè!', 'Thơm quá!'],
  eat: ['Ngon quá! 😋', 'Nhai nhai…', 'Ợ~ no rồi', 'Rác ngon ghê!'],
  eatfail: ['Không nuốt nổi… 🤢', 'Cái này cứng quá!', 'Mình không dám ăn cái đó!'],
  idle: ['Mình tin bạn!', 'Uống nước chưa đó?', 'Săn quái không?', 'Nay học gì vậy?', 'Tập trung 25 phút nha!'],
  bored: ['Chán quááá…', 'Chơi với mình đi~', 'Hôm nay làm gì chưa đó?', 'Buồn ngủ vì chán…', 'Đi săn quái điii!'],
  lonely: ['Hôm nay chưa ai vuốt ve mình…', 'Bấm vào mình một cái đi~'],
  hungry: ['Đói quá…', 'Có gì ăn không…', '🍖?'],
  reward: ['Giỏi quá!', 'Tuyệt!', 'Yeah!', 'Hạ gục rồi!'],
  big: ['Tuyệt vời!!', 'Bạn là huyền thoại!', 'Ăn mừng thôi!'],
  hurt: ['Ui da!', 'Đau quá…', 'Cẩn thận nha!'],
  crit: ['CHÍ MẠNG!', 'Bùm!!'],
  alert: ['Sắp tới giờ!', 'Nhanh lên!'],
  hidden: ['Có nhiệm vụ bí mật!', 'Psst… làm cái này đi!'],
  focus: ['Cố lên!', 'Đang săn quái…', 'Đừng bỏ cuộc!'],
  greet: ['Chào {n}! Cố lên nha 💪', 'Tới lượt {n} rồi!', 'Hello {n}, hôm nay làm gì nè?'],
  water: ['Uống nước thôi {n} 💧', 'Nhắc uống nước nè!', 'Một cốc nước cho tỉnh táo nha 💧'],
  drink: ['Giỏi quá! 💧', 'Mát ghê~', 'Uống đều vậy là khỏe nè!'],
  english: ['Hôm nay luyện tiếng Anh B1 chưa? 🔤', 'B1 cần luyện mỗi ngày một chút nha!', 'Học tiếng Anh 15 phút thôi cũng được nè!'],
  sweetEnglish: ['{n} ơi, luyện tiếng Anh B1 chưa nè? 🔤', '{n} giỏi vậy, B1 chắc chắn đậu! Luyện xíu nha 💪', 'Luyện tiếng Anh xong mình khen {n} tiếp 😚'],
  askStatus: ['{n} đang làm gì nè? Bấm chọn trạng thái đi~', 'Cho mình biết {n} đang học hay đi chơi nha?'],
  // Hồ sơ sweet (vd. Uyên): nịnh xíu
  sweet: ['Nay {n} thật dễ thương 🥰', '{n} cười lên xinh ghê á~', 'Có {n} ở đây mình vui hẳn 💖', '{n} giỏi quá, Việt mà biết chắc tự hào lắm!',
    'Ai mà dễ thương vậy ta? À, {n} chứ ai 😳', '{n} mệt thì nghỉ xíu nha, thương thương~', 'Việt dặn mình chăm {n} kỹ đó nha 😌',
    '{n} là số 1 luôn!', 'Hôm nay {n} xinh hơn hôm qua nữa đó ✨', 'Mình thích lúc {n} dùng máy nhất 🤭'],
  sweetGreet: ['Chào {n} xinh đẹp! ☀️', 'A, {n} tới rồi! Nhớ {n} ghê 🥰', '{n} tới là máy sáng hẳn lên ✨'],
  sweetPat: ['{n} vuốt nhẹ nhàng ghê~ 💕', 'Được {n} cưng là nhất!', 'Hì, {n} dễ thương quá đi'],
  sweetShy: ['{n} nhìn mình hoài ngại ghê 😳', 'Bị {n} nhìn là đỏ mặt liền 🙈'],
  sweetTrick: ['Nhào lộn tặng {n} nè! 🤸💖', 'Ta-da! {n} vỗ tay đi~ 👏', 'Múa cho {n} xem nè 💃'],
  sweetTickle: ['{n} cù mình nhột quá à 🤣', 'Hahaha {n} tha cho mình đi~', 'Hi hi, {n} nghịch ghê!'],
  sweetWake: ['{n} về rồi! Nhớ ghê 🥺', 'Á, {n} đó hả? Mình không ngủ đâu nha 😳', 'Mở mắt ra là thấy {n}, vui ghê ✨'],
  sweetReward: ['{n} giỏi quá trời! 🎉', 'Xong rồi! {n} đỉnh ghê 💪', 'Thêm một chiến công cho {n} nè ⭐'],
  sweetBig: ['{n} là huyền thoại luôn! 👑', 'Mình tự hào về {n} ghê 🥹💖', 'Ăn mừng cho {n} thôi! 🎊'],
  sweetHurt: ['Ui, {n} không sao chứ? 🥺', 'Không sao, lần sau {n} làm được mà! 💪', 'Mình thổi thổi cho {n} nè 🌬️💖'],
  sweetEat: ['{n} cho mình ăn ngon ghê 😋', 'Cảm ơn {n} nha, no rồi 🤤', 'Đồ {n} đưa là ngon nhất!'],
  sweetDrink: ['{n} uống nước ngoan quá 💧✨', 'Da {n} sẽ đẹp hơn nữa đó 💖', 'Giỏi ghê! Mình thưởng {n} một tim ❤️'],
  sweetCurious: ['{n} tới chơi với mình hả? 🥰', 'Ơ, {n} định làm gì đó? 👀', 'Gì vậy {n}?'],
  sweetBored: ['{n} ơi chơi với mình xíu đi~ 🥺', 'Mình nhớ {n} ghê, bấm vào mình đi 👉👈', 'Làm một nhiệm vụ nhỏ rồi chơi với mình nha {n}'],
  sweetWater: ['{n} ơi uống nước nè, da đẹp nè 💧', 'Uống nước cho khỏe nha {n} 💖', '{n} uống nước đi rồi mình khen tiếp 😚'],
};
const pick = a => a[Math.floor(Math.random() * a.length)];
// Hỏi đáp cho hồ sơ sweet: [câu hỏi, [[nút, biểu cảm, câu trả lời | null = một câu khen ngẫu nhiên]…]]
const ASK_SWEET = [
  ['Hôm nay {n} thấy sao? 🥰', [['😊 Vui', 'love', '{n} vui là mình vui! 💖'], ['😐 Thường', 'happy', 'Để mình làm {n} vui hơn nha~ 🎶'], ['😫 Mệt', 'love', 'Thương thương 🫂 nghỉ 5 phút rồi làm tiếp nha']]],
  ['{n} uống nước chưa? 💧', [['Rồi', 'happy', 'Giỏi ghê! Da đẹp là nhờ vậy đó ✨'], ['Chưa', 'curious', 'Đi uống liền nha, mình đợi {n}! 💧']]],
  ['{n} muốn nghe mình khen không? 😳', [['Có!', 'love', null], ['Hông', 'shy', 'Hứ, vẫn khen: {n} dễ thương nhất! 😤💖']]],
  ['Nay {n} học được gì mới chưa? 📚', [['Rồi nè', 'love', 'Wow {n} siêu quá, kể mình nghe với! 🤩'], ['Chưa', 'happy', 'Học 25 phút với mình nha, mình ngồi cạnh nè 📖']]],
  ['{n} có muốn nghỉ tay xíu không? ☕', [['Có', 'happy', 'Vươn vai, uống nước, 5 phút rồi quay lại nha 🙆'], ['Học tiếp', 'love', '{n} chăm quá, mình tự hào ghê! 💪']]],
  ['{n} ăn gì chưa đó? 🍚', [['Rồi', 'happy', 'Ngoan ghê! Ăn no mới học giỏi nè 😋'], ['Chưa', 'sad', 'Nhớ ăn uống đầy đủ nha {n}, mình lo đó 🥺']]],
];
const cut = (t, n = 22) => (t.length > n ? t.slice(0, n - 1) + '…' : t);

// Một bộ lắng nghe kéo-thả cho cả trang; mỗi Pet đăng ký vùng thả của mình (trang có thể có nhiều Pet).
const zones = [];
let lit = null;
const light = z => { if (lit !== z) { if (lit) lit.classList.remove('eat-ready'); if (z) z.classList.add('eat-ready'); lit = z; } };
const hit = e => {
  if (![...(e.dataTransfer?.types || [])].includes('Files')) return null;
  for (const z of zones) { const el = z.el(); if (el && el.contains(e.target) && z.enabled()) return { z, el }; }
  return null;
};
document.addEventListener('dragover', e => {
  e.preventDefault(); // luôn chặn để Chromium không mở file trong cửa sổ
  const h = hit(e);
  e.dataTransfer.dropEffect = h ? 'move' : 'none';
  light(h && h.el);
  if (h) h.z.hover();
});
document.addEventListener('dragleave', e => { if (!e.relatedTarget) light(null); });
document.addEventListener('drop', e => {
  e.preventDefault();
  light(null);
  const h = hit(e);
  if (h && e.dataTransfer.files.length) h.z.drop([...e.dataTransfer.files]);
});

window.PetCtl = function ({ host, bubbleHost, dropZone, onPat, onEat }) {
  let S = null, base = 'idle', temp = null, tempUntil = 0, sleeping = false, externalIdle = false;
  let hover = false, hoverSince = 0, shyDone = false, near = false, lastX = 0, lastDir = 0, flips = [];
  let lastMove = Date.now(), lookUntil = 0, look = { x: 0, y: 0 }, pats = [], lastPatSent = 0, chompSaid = 0;
  let nextIdle = Date.now() + 15000, bubbleTimer;

  const svg = () => host() && host().querySelector('.pet-svg');
  const busy = () => Date.now() < tempUntil;
  const talk = () => !S || S.settings.petTalk !== false;
  const user = () => userOf(S);
  // line('pat') → câu ngẫu nhiên, ưu tiên LINES.sweetPat khi hồ sơ sweet; thay {n} bằng tên.
  const line = key => {
    const u = user(), sk = 'sweet' + key[0].toUpperCase() + key.slice(1);
    return pick(u.sweet && LINES[sk] ? LINES[sk] : LINES[key]).replaceAll('{n}', u.name);
  };
  const emote = (m, ms = 1600) => { temp = m; tempUntil = Date.now() + ms; };
  const name = t => t.replaceAll('{n}', user().name);
  const anim = cls => { const h = host(); if (!h) return; h.classList.remove('hop', 'spin'); replay(h, cls); };
  function bubble() {
    const h = (bubbleHost || host)();
    if (!h) return null;
    let b = h.querySelector(':scope > .pet-bubble');
    if (!b) { b = document.createElement('div'); b.className = 'pet-bubble'; h.appendChild(b); }
    return b;
  }
  function say(text, ms = 2400) {
    const b = bubble();
    if (!b) return;
    b.classList.remove('ask');
    b.textContent = text;
    b.hidden = false;
    replay(b, 'pop');
    clearTimeout(bubbleTimer);
    bubbleTimer = setTimeout(() => { b.hidden = true; }, ms);
  }
  function wake() { sleeping = false; lastMove = Date.now(); emote('surprised', 1300); anim('hop'); say(line('wake')); }
  // Bong bóng có nút trả lời; bấm → Pet phản ứng. Không trả lời thì tự tắt sau 15 giây.
  function ask([q, options]) {
    const b = bubble();
    if (!b) return;
    b.textContent = name(q);
    b.classList.add('ask');
    const row = document.createElement('div');
    row.className = 'ask-row';
    for (const [label, mood, reply] of options) {
      const btn = document.createElement('button');
      btn.textContent = label;
      btn.onclick = ev => { ev.stopPropagation(); emote(mood, 2400); anim('hop'); say(reply ? name(reply) : line('sweet'), 3200); };
      row.appendChild(btn);
    }
    b.appendChild(row);
    b.hidden = false;
    replay(b, 'pop');
    clearTimeout(bubbleTimer);
    bubbleTimer = setTimeout(() => { b.hidden = true; }, 15000);
    emote('curious', 2500);
  }

  if (dropZone && onEat) zones.push({
    el: dropZone,
    enabled: () => !S || S.settings.eatFiles !== false,
    hover: () => {
      if (sleeping) wake();
      emote('chomp', 700);
      if (Date.now() - chompSaid > 4000) { chompSaid = Date.now(); say(pick(LINES.chomp), 1500); }
    },
    drop: files => { emote('eat', 2000); anim('hop'); onEat(files); },
  });

  // Tọa độ chuột theo client của cửa sổ. idle (chỉ widget gửi): máy không có thao tác 90 giây.
  function cursor(x, y, idle) {
    const now = Date.now(), el = svg();
    if (idle !== undefined) externalIdle = true;
    if (idle) sleeping = true;
    else { if (sleeping) wake(); lastMove = now; }
    if (!el) return;
    const r = el.getBoundingClientRect(), cx = r.left + r.width / 2, cy = r.top + r.height * 0.63;
    const dx = x - cx, dy = y - cy, dist = Math.hypot(dx, dy) || 1, reach = Math.min(1, dist / (r.width * 1.2));
    if (now > lookUntil) look = { x: dx / dist * 3.4 * reach, y: dy / dist * 2.6 * reach };
    const wasHover = hover, wasNear = near;
    hover = dist < r.width * 0.42;
    near = dist < r.width * 2.2;
    if (hover && !wasHover) { hoverSince = now; shyDone = false; flips = []; if (user().sweet && !sleeping && !busy() && Math.random() < 0.3) say(line('curious'), 1800); }
    if (hover) { // cù lét: rê qua lại nhanh trên người Pet
      const dir = Math.sign(x - lastX);
      if (dir && dir !== lastDir) { lastDir = dir; flips = flips.filter(t => now - t < 1200); flips.push(now); }
      if (flips.length >= 6 && !sleeping) { flips = []; emote('laugh', 1800); say(line('tickle'), 1500); }
    }
    lastX = x;
    if (near && !wasNear && !hover && !sleeping && !busy() && Math.random() < 0.6) {
      emote('curious', 2200);
      if (Math.random() < 0.4) say(line('curious'), 1500);
    }
  }

  function pat() {
    const now = Date.now();
    if (sleeping) { wake(); emote('angry', 1600); say(pick(LINES.poke)); return; }
    pats = pats.filter(t => now - t < 3000); pats.push(now);
    anim('hop');
    if (pats.length >= 8) { emote(Math.random() < 0.5 ? 'angry' : 'dizzy', 2200); say(pick(LINES.angry)); return; }
    emote('love', 1500);
    if (Math.random() < (user().sweet ? 0.7 : 0.35)) say(line('pat'), 1600);
    if (onPat && now - lastPatSent > 350) { lastPatSent = now; onPat(); }
  }
  function trick() { anim('spin'); emote(user().sweet ? 'love' : 'happy', 1400); say(line('trick'), 1600); }

  function react(e) {
    const k = e.kind;
    if (k === 'reward' || k === 'loot' || k === 'bounty') { emote('happy', 1800); anim('hop'); if (Math.random() < (user().sweet ? 0.9 : 0.5)) say(line('reward')); }
    if (k === 'level' || k === 'boss' || k === 'ach') { emote('love', 2600); anim('hop'); say(line('big'), 2800); }
    if (k === 'crit') { emote('surprised', 900); anim('hop'); say(pick(LINES.crit), 1200); }
    if (k === 'hurt' || k === 'dead') { emote('hurt', 1800); say(line('hurt')); }
    if (k === 'alert') { emote('surprised', 2500); anim('hop'); say(pick(LINES.alert), 3000); }
    if (k === 'nag') { emote('curious', 3000); anim('hop'); say(`Nhớ làm "${cut(e.task)}" nha!`, 4000); }
    if (k === 'hidden') { emote('curious', 3000); say(pick(LINES.hidden), 3000); }
    if (k === 'pet') { emote('hungry', 3000); say(pick(LINES.hungry), 2500); }
    if (k === 'eat') { emote('eat', 1800); say(line('eat'), 2000); }
    if (k === 'switch') { emote(e.sweet ? 'love' : 'happy', 2600); anim('hop'); setTimeout(() => say(line('greet'), 3200), 300); }
    if (k === 'water') { emote('curious', 3000); anim('hop'); say(line('water'), 4000); }
    if (k === 'drink') { emote('happy', 1800); say(line('drink'), 1800); }
    if (k === 'status' && G.STATUSES[e.status]) { emote('happy', 1800); anim('hop'); say(pick(G.STATUSES[e.status].talk), 2600); }
    if (k === 'study') { emote('curious', 3000); anim('hop'); say(e.it ? '💻 Nhớ chứng chỉ tin học cơ bản nha!' : e.word ? `📖 ${e.word.hz} (${e.word.py}): ${e.word.vi}` : line('english'), 4500); }
    if (k === 'weather' && e.tips && e.tips[0]) { emote('surprised', 2500); anim('hop'); say(`${user().sweet ? user().name + ' ơi, ' : ''}${e.tips[0].icon} ${e.tips[0].text.split(' — ').pop()}`, 5000); }
    if (k === 'class') { emote('surprised', 2800); anim('hop'); say(e.work ? `💼 Sắp vào ${e.subject}! Chuẩn bị đi làm nha` : e.subject ? `🏫 Sắp học ${e.subject}! ${e.online ? 'Nhớ vào Zoom' : 'Chuẩn bị đồ đi học'} nha` : e.msg.slice(0, 80), 4500); }
    if (k === 'evolve') { emote('love', 3200); anim('spin'); say(e.msg.slice(0, 90), 4200); }
    if (k === 'evoready') { emote('surprised', 2800); anim('hop'); say('Mình sắp tiến hóa rồi! Vào tab Pet chọn hệ cho mình nha ✨', 4500); }
    if (k === 'petlv') { emote('happy', 1800); anim('hop'); }
    if (k === 'say') { emote('happy', 2200); anim('hop'); } // câu trả lời hiện ở ô Hỏi Pet trên widget, Pet chỉ nhúc nhích cho có hồn
    if (k === 'eatfail') { emote('sad', 2200); say(pick(LINES.eatfail), 2400); }
  }

  // Câu nhắc lấy từ dữ liệu thật: việc trễ, việc sắp tới hạn, quà chưa nhận, boss, nhiệm vụ ngày…
  function remind(now) {
    const s = S, todo = s.tasks.filter(t => t.status === 'todo'), eod = G.endOfDay(now), c = [];
    const late = todo.filter(t => G.deadline(t) && G.deadline(t) < now);
    const today = todo.filter(t => G.deadline(t) >= now && G.deadline(t) <= eod).sort((a, b) => G.deadline(a) - G.deadline(b));
    if (late.length) c.push(`"${cut(late[0].title)}" trễ hạn rồi kìa! 😱`);
    if (today.length) {
      const m = Math.round((G.deadline(today[0]) - now) / 60000);
      c.push(m < 120 ? `Còn ${m < 60 ? m + ' phút' : Math.round(m / 60) + ' giờ'} là tới hạn "${cut(today[0].title)}"` : `Hôm nay còn ${today.length} nhiệm vụ nè`);
    }
    const cl = s.classes.filter(x => x.date === G.dayKey(now) && !x.off).map(x => ({ x, t: G.classTime(s, x) })).find(o => o.t.start > now);
    if (cl && cl.t.start - now < 3 * G.HOUR) c.push(`Còn ${Math.max(1, Math.round((cl.t.start - now) / 60000))} phút nữa ${cl.x.kind === 'work' ? 'vào' : 'học'} ${cut(cl.x.subject)} đó ${G.schedIcon(cl.x)}`);
    const n = G.zhToday(s).length;
    if (n && !s.learn.zhDone) c.push(`Hôm nay học ${n} từ tiếng Trung nha 📖`);
    if (s.settings.enDaily && !s.learn.enDone) c.push('Chưa luyện tiếng Anh B1 hôm nay đó! 🔤');
    if (s.hidden) c.push(`Làm nhiệm vụ bí mật đi: ${cut(s.hidden.title, 26)}`);
    if (G.loginReady(s)) c.push('Có quà đăng nhập chưa nhận kìa! 🎁');
    if (G.bountyReady(s) || G.achReady(s)) c.push('Có thưởng chờ nhận ở tab Hằng ngày!');
    const b = s.bounty.list.find(x => !x.done);
    if (b) c.push(`Nhiệm vụ ngày: ${cut(b.text, 24)} (${b.prog}/${b.need})`);
    if (!s.claimed && G.doneOn(s, s.day) >= s.settings.dailyGoal) c.push('Đủ nhiệm vụ rồi, điểm danh đi! 🔥');
    const boss = G.weekTasks(s, s.boss.week).filter(t => t.status === 'todo').length;
    if (boss && !s.boss.defeated) c.push(`Boss tuần còn ${boss} nhiệm vụ nữa là gục!`);
    if (!todo.length) c.push('Chưa có nhiệm vụ nào… thêm 1 cái đi?');
    if (!c.length) return null;
    const u = user(), msg = pick(c);
    return u.sweet && Math.random() < 0.5 ? `${u.name} ơi, ${msg[0].toLowerCase()}${msg.slice(1)}` : msg;
  }
  const bored = now => {
    const h = new Date(now).getHours(), last = Math.max(G.lastDone(S), S.log.length ? S.log[S.log.length - 1].t : 0);
    return h >= 9 && h < 23 && now - last > 2 * G.HOUR;
  };

  function idleAct(now) {
    const r = Math.random();
    if (base === 'hungry') { if (talk() && r < 0.5) say(pick(LINES.hungry)); return; }
    if (base === 'focus') { if (talk() && r < 0.25) say(pick(LINES.focus)); return; }
    if (S && talk()) { // học & thời tiết
      const words = G.zhToday(S);
      if (words.length && Math.random() < 0.2) { const w = pick(words); return say(S.learn.zhDone ? `Còn nhớ không? ${w.hz} = ${w.vi} 😉` : `📖 ${w.hz} (${w.py}): ${w.vi}`, 4000); }
      if (S.settings.enDaily && !S.learn.enDone && Math.random() < 0.08) return say(line('english'), 3200);
      if (S.settings.itRemind && Math.random() < 0.015) return say('💻 Đừng quên chứng chỉ tin học cơ bản nha!', 3200);
      const tip = S.settings.weatherTips && Math.random() < 0.06 && G.weatherTips(S.weather, new Date(now).getHours())[0];
      if (tip) return say(`${tip.icon} ${tip.text.split(' — ').pop()}`, 3600);
    }
    if (S && talk() && user().sweet && Math.random() < 0.25) return ask(pick(ASK_SWEET));
    if (S && talk() && user().sweet && Math.random() < 0.35) { emote(Math.random() < 0.5 ? 'love' : 'shy', 2200); return say(line('sweet'), 3200); }
    if (S && talk() && !S.status && Math.random() < 0.15) { emote('curious', 2200); return say(line('askStatus'), 3200); }
    if (S && talk() && G.STATUSES[S.status] && Math.random() < 0.15) return say(pick(G.STATUSES[S.status].talk), 2600);
    if (S && talk() && r < 0.25) { const msg = remind(now); if (msg) { anim('hop'); return say(msg, 3500); } }
    if (S && r < 0.4 && bored(now)) { emote('bored', 3200); if (talk()) say(S.pet.patDay !== S.day && Math.random() < 0.4 ? pick(LINES.lonely) : line('bored'), 3000); return; }
    if (r < 0.52) { lookUntil = now + 1400; look = { x: (Math.random() < 0.5 ? -1 : 1) * 3.4, y: Math.random() * 2 - 1 }; return; }
    if (r < 0.62) return emote('happy', 2000);
    if (r < 0.68) return anim('hop');
    if (r < 0.74) return emote('sleepy', 1200); // ngáp
    if (r < 0.8 && talk()) say(pick(LINES.idle), 2600);
  }

  let greeted = false;
  function setState(s) {
    S = s;
    if (!greeted) {
      greeted = true;
      const hr = new Date().getHours(), u = userOf(s);
      setTimeout(() => say(u.sweet ? line('greet') : hr < 11 ? `Chào buổi sáng ${u.name}! ☀️` : hr < 18 ? `Chào buổi chiều ${u.name}!` : hr < 23 ? `Tối rồi, cố thêm chút nha ${u.name}!` : 'Khuya rồi… ngủ sớm nha 🌙', 3000), 900);
    }
    base = s.focus ? 'focus' : G.petFood(s, Date.now()) < 25 ? 'hungry' : s.hero.hp < G.maxHp(s) * 0.3 ? 'sad' : 'idle';
  }

  function frame() {
    const now = Date.now(), el = svg();
    if (!el || document.hidden) return;
    if (!externalIdle && !sleeping && now - lastMove > 90000) sleeping = true;
    if (hover && !shyDone && !sleeping && !busy() && now - hoverSince > 4000) { shyDone = true; emote('shy', 2600); say(line('shy'), 2000); }
    if (now > nextIdle) {
      nextIdle = now + (user().sweet ? 8000 + Math.random() * 10000 : 15000 + Math.random() * 20000); // sweet: tương tác dày hơn
      if (!sleeping && !busy() && !hover) idleAct(now);
    }
    const mood = busy() ? temp : sleeping ? 'sleepy' : hover && base !== 'focus' ? 'happy' : base;
    if (el.dataset.mood !== mood) el.dataset.mood = mood;
    const lx = `${look.x.toFixed(2)}px`, ly = `${look.y.toFixed(2)}px`;
    if (el.style.getPropertyValue('--lx') !== lx || el.style.getPropertyValue('--ly') !== ly) { el.style.setProperty('--lx', lx); el.style.setProperty('--ly', ly); }
  }
  setInterval(frame, 120);


  return { cursor, pat, trick, react, setState, say, emote, ask: () => ask(pick(ASK_SWEET)) };
};
})();
