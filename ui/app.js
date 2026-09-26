// Bảng điều khiển — phần khung: HUD, thẻ nhân vật, điều hướng tab, toast, hộp quà đăng nhập, Pet ở thanh bên.
// Nội dung từng tab nằm trong tabs.js (TABS.<tên> = s => html). Mọi thay đổi dữ liệu đi qua api.act → main → game.js.
const view = $('view');
const TABS = {};
const DO = {};  // data-do="tên" / data-change="tên" → DO.tên(element, event)
const ui = { tab: location.hash.slice(1) || 'quests', focusMin: 25, focusTask: '', statWeek: 0, sugSeed: 0, hideVi: false, qview: 'today', open: {} };
let S, petKey = '', loginShown = false, previewing = null;
const eat = files => api.eat(files);
const heroPet = PetCtl({ host: () => $('heroPet'), dropZone: () => $('heroPet'), onPat: () => api.act('patPet'), onEat: eat });
const roomPet = PetCtl({ host: () => $('petRoom'), dropZone: () => document.querySelector('.pet-room'), onPat: () => api.act('patPet'), onEat: eat });
const petKeyOf = s => { const t = G.heroTitle(s), p = G.petGet(s); return [s.skin, s.weapon, s.petKind, JSON.stringify(s.accs), t.cls, t.rank, p.el, G.petStage(p)].join(); };

// ---------- định dạng ----------
const hm = t => { const d = new Date(t); return `${two(d.getHours())}:${two(d.getMinutes())}`; };
const dm = t => { const d = new Date(t); return `${WEEKDAYS[d.getDay()]} ${two(d.getDate())}/${two(d.getMonth() + 1)}`; };
const whenTxt = t => G.dayKey(t) === G.dayKey(Date.now()) ? hm(t) : `${dm(t)} ${hm(t)}`;
const durTxt = ms => ms < G.HOUR ? `${Math.max(1, Math.round(ms / G.MIN))} phút` : ms < 2 * G.DAY ? `${Math.round(ms / G.HOUR)} giờ` : `${Math.round(ms / G.DAY)} ngày`;
const stars = n => '★'.repeat(n) + '☆'.repeat(3 - n);
const barHTML = (cls, cur, max, label, id = '') => `<div class="bar ${cls}" ${id && `id="${id}"`}><i style="width:${pct(cur, max)}%"></i><span>${label}</span></div>`;

// ---------- vẽ ----------
// Vẽ lại tab hiện tại; giữ giá trị ô nhập (data-keep) và giữ nguyên node Pet trong phòng nếu ngoại hình không đổi.
function paint() {
  if (!S) return;
  const keep = {};
  view.querySelectorAll('[data-keep]').forEach(el => { keep[el.dataset.keep] = el.value; });
  view.querySelectorAll('details[data-open]').forEach(el => { ui.open[el.dataset.open] = el.open; });
  const focused = document.activeElement && document.activeElement.dataset.keep;
  const room = $('petRoom');
  view.innerHTML = (TABS[ui.tab] || TABS.quests)(S);
  const fresh = $('petRoom');
  if (room && fresh && room.dataset.key === fresh.dataset.key) fresh.replaceWith(room);
  view.querySelectorAll('[data-keep]').forEach(el => { if (el.dataset.keep in keep) el.value = keep[el.dataset.keep]; });
  view.querySelectorAll('details[data-open]').forEach(el => { el.open = !!ui.open[el.dataset.open]; });
  const tab = TABS[ui.tab] || TABS.quests;
  if (tab.after) tab.after(); // việc cần làm sau khi vẽ (VD: gợi ý ô thêm nhiệm vụ)
  if (focused) { const el = view.querySelector(`[data-keep="${focused}"]`); if (el) el.focus(); }
  document.querySelectorAll('#tabs button').forEach(b => b.classList.toggle('on', b.dataset.tab === ui.tab));
  if (openedFor !== ui.tab) { // mở nhóm chứa tab đang xem (1 lần mỗi khi đổi tab, để người dùng vẫn tự đóng được)
    openedFor = ui.tab;
    const grp = document.querySelector(`#tabs [data-tab="${ui.tab}"]`)?.closest('details');
    if (grp) grp.open = true;
  }
}
let openedFor = null;
function setTab(t) { ui.tab = t; history.replaceState(null, '', `#${t}`); view.scrollTop = 0; paint(); }

function renderHud(s) {
  const now = Date.now(), h = s.hero, t = G.heroTitle(s), mx = G.maxHp(s);
  setBar($('hudHp'), h.hp, mx, `❤ HP ${h.hp} / ${mx}`);
  setBar($('hudExp'), h.exp, G.expNeed(h.level), `EXP ${h.exp} / ${G.expNeed(h.level)} — Cấp ${h.level + 1}`);
  $('hudGold').textContent = h.gold.toLocaleString('vi-VN');
  $('hudStreak').textContent = `${h.streak} ngày`;
  const mult = G.expMult(s, now), buff = s.buffs.filter(b => b.until > now).sort((a, b) => b.until - a.until)[0];
  $('hudBuff').hidden = mult <= 1.001;
  $('hudBuff').textContent = `✨ EXP x${mult.toFixed(2)}${buff ? ` · ${durTxt(buff.until - now)}` : ''}`;
  $('hudFreeze').hidden = !G.frozen(s, now);
  $('hudFreeze').textContent = `🧊 Đóng băng đến ${whenTxt(s.frozenUntil)}`;
  const done = G.doneOn(s, s.day), goal = s.settings.dailyGoal;
  $('claim').disabled = s.claimed || done < goal;
  $('claim').textContent = s.claimed ? '✅ Đã điểm danh' : `🎁 Điểm danh (${Math.min(done, goal)}/${goal})`;

  const key = petKeyOf(s);
  if (key !== petKey) { petKey = key; $('heroPet').innerHTML = petSVG(s); }
  heroPet.setState(s); roomPet.setState(s);
  const food = Math.round(G.petFood(s, now));
  setBar($('heroFood'), food, 100, `🍖 ${food}%`);
  $('heroBond').textContent = `💞 ${G.BOND_NAMES[G.bond(s)]}`;
  const daily = +G.loginReady(s) + G.bountyReady(s) + G.achReady(s) + +!!(G.zhToday(s).length && !s.learn.zhDone) + +!!(s.settings.enDaily && !s.learn.enDone);
  $('hudWx').hidden = !s.weather;
  if (s.weather) {
    $('hudWx').textContent = `${G.wxInfo(s.weather.code).icon} ${s.weather.temp}°C`;
    $('hudWx').title = [`${s.weather.place}: ${G.wxInfo(s.weather.code).name}`, ...G.weatherTips(s.weather, new Date(now).getHours()).map(x => `${x.icon} ${x.text}`)].join('\n');
  }
  $('bdgDaily').hidden = !daily; $('bdgDaily').textContent = daily;
  $('bdgPet').hidden = food >= 25; $('bdgPet').textContent = '!';
  $('bdgG1').hidden = !daily; $('bdgG1').textContent = daily; // hiện trên tiêu đề nhóm khi nhóm đang đóng
  $('bdgG2').hidden = food >= 25; $('bdgG2').textContent = '!';
  if (document.activeElement !== $('heroName')) $('heroName').value = h.name;
  const u = userOf(s), st = G.STATUSES[s.status];
  if (document.activeElement !== $('userSel'))
    $('userSel').innerHTML = s.profiles.map(p => `<option value="${p.id}" ${p.id === s.active ? 'selected' : ''}>👤 ${esc(p.name)}</option>`).join('');
  // ô trạng thái nhỏ cạnh cấp: chỉ biểu tượng, bấm mở bảng chọn
  $('stIcon').textContent = st ? st.icon : '❔';
  $('stIcon').classList.toggle('auto', !!(st && s.statusAuto));
  $('stIcon').title = st ? `${st.name}${s.statusAuto ? ` · 🤖 tự nhận${s.statusApp ? ' · ' + s.statusApp : ''}` : ''} — bấm để đổi` : 'Bạn đang làm gì? Bấm để chọn';
  $('stPop').innerHTML = Object.entries(G.STATUSES).map(([id, x]) => `<button class="${s.status === id ? 'on' : ''}" data-act="setStatus" data-id="${id}" title="${x.name}">${x.icon}</button>`).join('')
    + (s.settings.autoStatus && s.statusHold > now ? '<button data-act="resumeAuto" title="Để app tự nhận lại theo phần mềm đang dùng">🤖</button>' : '');
  $('waterBar').hidden = !(s.water.ask > now);
  if (s.water.ask > now) $('waterBar').innerHTML = `<span style="font-size:22px">💧</span><div class="t"><b>Tới giờ uống nước rồi${u.sweet ? `, ${esc(u.name)} ơi` : ''}!</b><div class="muted">Hôm nay đã uống ${s.water.cups} cốc</div></div><button class="primary" data-act="drinkWater">💧 Đã uống</button>`;
  $('heroTitle').textContent = t.title;
  $('heroLv').textContent = `CẤP ${h.level}`;

  $('hq').hidden = !s.hidden;
  if (s.hidden) $('hq').innerHTML = `<span style="font-size:22px">❓</span><div class="t"><div class="muted">NHIỆM VỤ ẨN · thưởng buff x1.5 EXP trong 1 giờ</div><b style="color:var(--text);font-family:var(--font)">${esc(s.hidden.title)}</b></div><b id="hqTime">${mmss(s.hidden.until - now)}</b><button class="primary" data-act="completeHidden">✔ Xong</button><button data-act="dismissHidden">Bỏ qua</button>`;
}

function render(s) {
  S = s; renderHud(s); paint();
  if (loginShown !== s.active + s.day && G.loginReady(s)) { loginShown = s.active + s.day; showLogin(s); } // mỗi người mỗi ngày 1 lần
}
function showLogin(s) {
  const d = $('loginDlg');
  d.innerHTML = `<h2>📅 Quà đăng nhập <small>quay lại mỗi ngày — ngày 7 nhận quà lớn</small></h2>${loginCal(s)}
    <div class="dlg-acts"><button id="dlgLater">Để sau</button><button class="primary" id="dlgGet">🎁 Nhận quà hôm nay</button></div>`;
  d.showModal();
  $('dlgLater').onclick = () => d.close();
  $('dlgGet').onclick = () => { api.act('claimLogin'); d.close(); };
}

function toast(e) {
  heroPet.react(e); roomPet.react(e);
  if (e.kind === 'say') chatSay(e.msg);
  const el = document.createElement('div');
  el.className = `toast ${e.kind}`;
  el.textContent = e.msg;
  $('toasts').appendChild(el);
  while ($('toasts').children.length > 5) $('toasts').firstChild.remove();
  setTimeout(() => el.remove(), ['boss', 'level', 'evolve', 'evoready'].includes(e.kind) ? 9000 : 5000);
  if (e.kind === 'hit') { const b = document.querySelector('.boss-ico'); if (b) replay(b, 'hit'); }
}

// ---------- sự kiện ----------
// data-act="hànhĐộng" data-…  → api.act(hànhĐộng, dataset) · data-tab → đổi tab · data-confirm → hỏi trước
document.addEventListener('click', e => {
  const b = e.target.closest('[data-act],[data-do],[data-tab]');
  if (!b || b.disabled) return;
  if (b.dataset.tab) return setTab(b.dataset.tab);
  if (b.dataset.confirm && !confirm(b.dataset.confirm)) return;
  if (b.dataset.act) api.act(b.dataset.act, { ...b.dataset });
  if (b.dataset.do) DO[b.dataset.do](b, e);
});
document.addEventListener('change', e => { const el = e.target.closest('[data-change]'); if (el) DO[el.dataset.change](el, e); });
document.addEventListener('click', e => { if (!e.target.closest('#stBox summary')) $('stBox').open = false; }); // chọn xong / bấm ra ngoài → đóng bảng trạng thái
document.addEventListener('dblclick', e => {
  if (e.target.closest('#heroPet')) heroPet.trick();
  if (e.target.closest('#petRoom')) roomPet.trick();
});
document.addEventListener('mousemove', e => { heroPet.cursor(e.clientX, e.clientY); roomPet.cursor(e.clientX, e.clientY); });
// Rê chuột lên skin / loài / phụ kiện (data-preview) để thử trên Pet trong phòng.
document.addEventListener('mouseover', e => {
  const el = e.target.closest('[data-preview]'), room = $('petRoom'), id = el ? el.dataset.preview : null;
  if (!room || id === previewing) return;
  previewing = id;
  const it = id && G.item(id), field = it && { skin: 'skin', pet: 'petKind' }[it.kind];
  room.innerHTML = petSVG(field ? { ...S, [field]: id } : it && it.kind === 'acc' ? { ...S, accs: { ...S.accs, [it.slot]: id } } : S);
});
$('claim').onclick = () => api.act('claimDaily');
$('heroPet').onclick = () => heroPet.pat();
const chatSay = wireChat(); // ô Hỏi Pet ở thanh bên
$('heroName').onchange = () => api.act('rename', { name: $('heroName').value });
$('userSel').onchange = () => api.profile('switchTo', { id: $('userSel').value });
DO.patRoom = () => roomPet.pat();

// Đồng hồ mỗi giây: nhiệm vụ ẩn + trận đánh ở tab Tập trung (không vẽ lại cả tab).
setInterval(() => {
  if (!S || document.hidden) return;
  const now = Date.now(), f = S.focus;
  if (S.hidden && $('hqTime')) $('hqTime').textContent = mmss(S.hidden.until - now);
  if (f && $('bigTimer')) {
    const el = now - f.start, kills = Math.floor(el / (KILL_SEC * 1000));
    $('bigTimer').textContent = mmss(f.start + f.min * G.MIN - now);
    setBar($('fBar'), el, f.min * G.MIN);
    $('fMob').textContent = MOBS[kills % MOBS.length];
    $('fKills').textContent = `⚔ Đã hạ ${kills} quái · nhặt 💰×${kills * 3} · combo x${S.combo}`;
  }
}, 1000);

// Chờ tabs.js nạp xong (script sau) rồi mới nhận dữ liệu.
window.addEventListener('DOMContentLoaded', () => {
  api.on('state', render);
  api.on('event', toast);
  api.on('tab', setTab);
  api.get().then(render);
});
