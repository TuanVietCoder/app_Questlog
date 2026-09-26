// Widget ghim màn hình: Pet + HP/EXP + hẹn giờ tập trung + nhắc hạn. Hàm chung ($, mmss, setBar…) ở common.js.
const LOOT = ['💰', '🪵', '💎', '🍖', '🦴', '🪙'];
let S, petKey = '', lastKills = -1;
const pet = PetCtl({ host: () => $('pet'), bubbleHost: () => $('scene'), dropZone: () => $('scene'), onPat: () => api.act('patPet'), onEat: files => api.eat(files) });

const hhmm = t => new Date(t).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });

function floatText(txt, color, x = 50, y = 40) {
  const el = document.createElement('div');
  el.className = 'float-txt';
  el.textContent = txt;
  el.style.cssText = `color:${color};left:${x}%;top:${y}%;transform:translateX(-50%)`;
  $('scene').appendChild(el);
  setTimeout(() => el.remove(), 1500);
}

function render(s) {
  S = s;
  const now = Date.now(), h = s.hero, t = G.heroTitle(s);
  $('lv').textContent = `Lv ${h.level}`;
  $('ttl').textContent = `${userOf(s).name} · ${t.title}${h.streak ? ` · 🔥${h.streak}` : ''}`;
  const st = G.STATUSES[s.status];
  $('bStatus').textContent = st ? st.icon : '❔';
  $('bStatus').title = st ? `${s.statusAuto ? '🤖 ' : ''}${st.name}${s.statusAuto && s.statusApp ? ` (${s.statusApp})` : ''} — bấm để đổi` : 'Bạn đang làm gì? Bấm để chọn';
  $('statusRow').querySelectorAll('button').forEach(b => b.classList.toggle('on', b.dataset.st === s.status));
  $('bUser').hidden = s.profiles.length < 2;
  $('userRow').innerHTML = s.profiles.map(p => `<button data-uid="${p.id}" class="${p.id === s.active ? 'on' : ''}" title="Chuyển sang ${esc(p.name)}">👤 ${esc(p.name)}</button>`).join('');
  $('water').hidden = !(s.water.ask > now);
  const w = s.weather, L = s.learn, zh = G.zhToday(s).length && !L.zhDone, en = s.settings.enDaily && !L.enDone;
  $('wx').hidden = !w;
  if (w) {
    $('wx').textContent = `${G.wxInfo(w.code).icon} ${w.temp}° · ☔ ${Math.max(w.rain3h, w.rainProb)}%`;
    $('wx').title = [`${w.place}: ${G.wxInfo(w.code).name}, ${w.min}–${w.max}°C`, ...G.weatherTips(w, new Date(now).getHours()).map(x => `${x.icon} ${x.text}`)].join('\n');
  }
  const cls = s.classes.filter(c => c.date === G.dayKey(now) && !c.off).map(c => ({ c, ...G.classTime(s, c) })).find(x => x.end > now);
  $('study').hidden = !(cls || zh || en);
  $('study').textContent = cls ? `${G.schedIcon(cls.c)} ${hhmm(cls.start)} ${cls.c.subject}` : [zh && `📖 ${L.zhCount} từ TQ`, en && '🔤 B1'].filter(Boolean).join(' · ');
  $('study').title = cls ? `${cls.c.subject} · ${hhmm(cls.start)}–${hhmm(cls.end)}${cls.c.room ? ' · ' + cls.c.room : ''}` : '';
  $('info').hidden = $('wx').hidden && $('study').hidden;
  $('waterTxt').textContent = `${userOf(s).sweet ? userOf(s).name + ' ơi, u' : 'U'}ống nước nè! · ${s.water.cups} cốc`;
  setBar($('hp'), h.hp, G.maxHp(s), `❤ ${h.hp}/${G.maxHp(s)}`);
  setBar($('exp'), h.exp, G.expNeed(h.level), `EXP ${h.exp}/${G.expNeed(h.level)}`);

  const rec = G.petGet(s), key = [s.skin, s.weapon, t.cls, t.rank, s.petKind, JSON.stringify(s.accs), rec.el, G.petStage(rec)].join();
  if (key !== petKey) { petKey = key; $('pet').innerHTML = petSVG(s); }
  pet.setState(s);
  const food = Math.round(G.petFood(s, now)), b = G.bond(s);
  setBar($('food'), food, 100, `${food}%`);
  $('bond').textContent = `Lv ${rec.lv}${G.petEvoReady(s) ? '✨' : ''} · 💞 ${G.BOND_NAMES[b]}`;
  $('bond').title = `${G.petName(s)} · Lv ${rec.lv}${G.petEvoReady(s) ? ' · sẵn sàng tiến hóa (vào tab Pet)' : ''} · thân thiết: ${G.BOND_NAMES[b]}`;
  $('bFeed').textContent = s.inv.meat ? '🍖' : s.inv.cake ? '🍰' : '🛒';
  $('dot').hidden = !(G.loginReady(s) || G.bountyReady(s) || G.achReady(s));

  $('card').classList.toggle('ghost', s.settings.clickThrough);
  $('card').classList.toggle('frozen', G.frozen(s, now));
  $('opa').value = Math.round(s.settings.opacity * 100);
  $('opaVal').textContent = `${$('opa').value}%`;

  const mult = G.expMult(s, now);
  $('buff').hidden = mult <= 1.001 && !G.frozen(s, now);
  $('buff').textContent = G.frozen(s, now) ? '🧊 ĐÓNG BĂNG' : `✨ EXP x${mult.toFixed(2)}`;

  $('hq').hidden = !s.hidden;
  if (s.hidden) $('hqTxt').textContent = s.hidden.title;

  const upcoming = s.tasks.filter(x => x.status === 'todo' && G.deadline(x)).sort((a, b) => G.deadline(a) - G.deadline(b))[0];
  $('next').textContent = upcoming ? `➤ ${upcoming.title} · ${new Date(G.deadline(upcoming)).toDateString() === new Date().toDateString() ? hhmm(G.deadline(upcoming)) : new Date(G.deadline(upcoming)).toLocaleDateString('vi-VN', { weekday: 'short', day: '2-digit', month: '2-digit' })}` : 'Không có nhiệm vụ gấp ✨';
  frame();
}

// Cập nhật mỗi giây: đồng hồ, trận đánh idle, đếm ngược nhiệm vụ ẩn.
function frame() {
  if (!S) return;
  const now = Date.now(), f = S.focus;
  $('scene').classList.toggle('fighting', !!f);
  $('idle').hidden = !!f; $('next').hidden = !!f; $('fight').hidden = !f; $('mob').hidden = !f;
  if (S.hidden) $('hqTime').textContent = mmss(S.hidden.until - now);
  if (!f) { lastKills = -1; return; }

  const el = now - f.start, total = f.min * 6e4, sec = Math.floor(el / 1000);
  $('timer').textContent = mmss(total - el);
  setBar($('fbar'), el, total);
  const kills = Math.floor(sec / KILL_SEC);
  $('kills').textContent = `⚔ ${kills} quái · ${LOOT[0]}×${kills * 3} · combo x${S.combo}`;
  $('mob').querySelector('.mob-ico').textContent = MOBS[kills % MOBS.length];
  setBar($('mob'), KILL_SEC - (sec % KILL_SEC), KILL_SEC);
  if (lastKills >= 0 && kills > lastKills) floatText(`+${LOOT[kills % LOOT.length]}`, '#fde68a', 78, 18);
  lastKills = kills;
  if (sec % 2 === 0) {
    replay($('mob').querySelector('.mob-ico'), 'hit');
    floatText(`-${7 + (sec * 13) % 23}`, '#fca5a5', 80, 30);
  }
}

api.on('state', render);
api.on('cursor', c => pet.cursor(c.x, c.y, c.idle));
api.on('event', e => {
  pet.react(e);
  if (e.kind === 'crit') floatText('💥 CHÍ MẠNG', '#fb923c', 50, 22);
  if (e.kind === 'reward' || e.kind === 'loot') floatText(e.msg.match(/\+\d+ EXP/)?.[0] || '🎁', '#86efac');
  if (e.kind === 'level' || e.kind === 'boss') floatText('⭐ LEVEL UP', '#fde047', 50, 20);
  if (e.kind === 'evolve') floatText('✨ TIẾN HÓA', '#c4b5fd', 50, 20);
  if (e.kind === 'petlv') floatText('🐾 Pet lên cấp', '#f9a8d4');
  if (e.kind === 'hurt' || e.kind === 'dead') {
    floatText(e.msg.match(/−\d+ HP/)?.[0] || '💔', '#f87171');
    $('scene').classList.add('hurt'); setTimeout(() => $('scene').classList.remove('hurt'), 1300);
  }
  if (e.kind === 'alert') {
    $('signTxt').textContent = e.task;
    $('sign').hidden = false; $('glass').hidden = false;
    replay($('card'), 'alarm');
    setTimeout(() => { $('glass').hidden = true; }, 3200);
    setTimeout(() => { $('sign').hidden = true; }, 90000);
  }
  if (['hidden', 'nag', 'water', 'study', 'weather', 'class'].includes(e.kind)) replay($('card'), 'alarm');
  if (e.kind === 'drink') floatText('💧 +5💰', '#7dd3fc');
  if (e.kind === 'switch') $('statusRow').hidden = false; // người mới → hỏi trạng thái
});

$('bDash').onclick = () => api.ui('dash', G.loginReady(S) || G.bountyReady(S) || G.achReady(S) ? 'daily' : undefined);
$('pet').onclick = () => pet.pat();
$('pet').ondblclick = () => pet.trick();
$('bFeed').onclick = () => S.inv.meat ? api.act('use', { id: 'meat' }) : S.inv.cake ? api.act('use', { id: 'cake' }) : api.ui('dash', 'pet');
$('bQuick').onclick = () => api.ui('quick');
$('bChat').onclick = () => api.ui('chat'); // ô chat là cửa sổ riêng cạnh widget (docs mục 8.4)
$('bGhost').onclick = () => api.ui('ghost');
$('bGhost').onmouseenter = () => S && S.settings.clickThrough && api.ui('capture', true);
$('bGhost').onmouseleave = () => S && S.settings.clickThrough && api.ui('capture', false);
$('bHide').onclick = () => api.ui('widget-hide');
$('bOpa').onclick = () => { $('opaRow').hidden = !$('opaRow').hidden; };
$('opa').oninput = () => { $('opaVal').textContent = `${$('opa').value}%`; api.act('setSettings', { opacity: $('opa').value / 100 }); };
$('signOk').onclick = () => { $('sign').hidden = true; $('glass').hidden = true; $('card').classList.remove('alarm'); };
$('hqOk').onclick = () => api.act('completeHidden');
$('waterOk').onclick = () => api.act('drinkWater');
$('info').onclick = () => api.ui('dash', 'daily');
$('statusRow').innerHTML = Object.entries(G.STATUSES).map(([id, st]) => `<button data-st="${id}" title="${st.name}">${st.icon}</button>`).join('');
$('statusRow').onclick = e => { const b = e.target.closest('[data-st]'); if (b) { api.act('setStatus', { id: b.dataset.st }); $('statusRow').hidden = true; } };
$('bStatus').onclick = () => { $('statusRow').hidden = !$('statusRow').hidden; };
$('bUser').onclick = () => { $('userRow').hidden = !$('userRow').hidden; };
$('userRow').onclick = e => {
  const b = e.target.closest('[data-uid]');
  if (!b) return;
  $('userRow').hidden = true;
  if (b.dataset.uid !== S.active) api.profile('switchTo', { id: b.dataset.uid });
};
new ResizeObserver(() => api.ui('widget-h', Math.ceil($('card').getBoundingClientRect().height) + 12)).observe($('card'));
document.querySelectorAll('.go').forEach(b => b.onclick = () => api.act('startFocus', { min: +b.dataset.min }));
let sureTimer;
$('bCancel').onclick = () => {
  const b = $('bCancel');
  if (!b.classList.contains('sure')) {
    b.classList.add('sure'); b.textContent = 'Chắc? −10HP';
    sureTimer = setTimeout(() => { b.classList.remove('sure'); b.textContent = '✖ Bỏ'; }, 3000);
    return;
  }
  clearTimeout(sureTimer); b.classList.remove('sure'); b.textContent = '✖ Bỏ';
  api.act('cancelFocus');
};

api.get().then(render);
setInterval(() => document.hidden || frame(), 1000);
