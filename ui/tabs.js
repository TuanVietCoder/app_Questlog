// Nội dung các tab của bảng điều khiển. Mỗi tab: TABS.<tên> = s => chuỗi HTML (vẽ lại toàn bộ khi state đổi).
// Nút bấm dùng data-act (gọi hành động game.js) hoặc data-do (hàm DO.* khai báo cạnh tab). Khung chung ở app.js.

// ---------- TAB: NHIỆM VỤ (gọn: 1 ô thêm · trạng thái · chọn danh sách · mỗi việc 1 dòng) ----------
const Q_VIEWS = [ // [khóa, icon, tên, thông báo khi trống, gợi ý khi trống]
  ['today', '🔥', 'Hôm nay', 'Hôm nay chưa có việc gấp', 'Thêm nhiệm vụ ở ô phía trên, hoặc chọn trạng thái để nhận gợi ý'],
  ['week', '📅', 'Tuần này', 'Tuần này chưa có nhiệm vụ', 'Nhiệm vụ trong tuần gộp thành máu của Boss tuần'],
  ['next', '🗓️', 'Tuần sau', 'Chưa lên kế hoạch tuần sau', 'Khai báo trước để Boss tuần sau hiện hình'],
  ['inbox', '📥', 'Chờ', 'Danh sách chờ trống', 'Ctrl+Shift+T ở bất cứ đâu để ghi nhanh ý tưởng vào đây'],
  ['done', '✅', 'Xong', 'Hôm nay chưa hạ gục nhiệm vụ nào', 'Bấm vòng tròn bên trái nhiệm vụ để hoàn thành'],
];
const WHERE = [['today', '🔥 Hôm nay'], ['week', '📅 Tuần này'], ['next', '🗓️ Tuần sau'], ['inbox', '📥 Chờ']];
const opt = (o, sel) => Object.entries(o).map(([v, l]) => `<option value="${v}" ${String(v) === String(sel) ? 'selected' : ''}>${l}</option>`).join('');
const catOpt = sel => opt(Object.fromEntries(Object.entries(G.CATS).map(([k, c]) => [k, `${c.icon} ${c.name}`])), sel);

// Một nhiệm vụ = 1 dòng: vòng tròn hoàn thành · tên + (nhánh, sao, EXP, hạn) · menu ⋯ (tập trung / chuyển / xóa).
function questRow(t, now) {
  const c = G.CATS[t.cat], d = G.DIFF[t.diff], dl = G.deadline(t), done = t.status === 'done';
  const where = t.week ? (t.week === G.weekKey(now) ? 'week' : 'next') : t.due ? 'today' : 'inbox';
  const due = done ? `✅ ${hm(t.doneAt)}` : !dl ? '' : dl < now ? `<span class="late">⚠ trễ ${durTxt(now - dl)}</span>`
    : `<span class="${dl - now < 3 * G.HOUR ? 'soon' : ''}">⏰ ${t.start ? `${hm(t.start)}–${hm(dl)}` : whenTxt(dl)}</span>`;
  return `<div class="qrow ${done ? 'done' : ''}" style="--c:${c.color}">
    ${done ? '<span class="qcheck on">✓</span>' : `<button class="qcheck" data-act="completeTask" data-id="${t.id}" title="Hoàn thành · +${d.exp} EXP +${d.gold}💰"></button>`}
    <div><div class="qtitle">${t.routine ? '🔁 ' : ''}${t.keep ? '🔒 ' : ''}${esc(t.title)}</div>
      <div class="qmeta">${c.icon} ${c.name} · <span class="stars">${stars(t.diff)}</span> · +${d.exp} EXP${due ? ` · ${due}` : ''}</div></div>
    ${done ? '' : `<details class="qmore"><summary title="Tùy chọn">⋯</summary><div class="qmenu">
      <button data-do="focusOn" data-id="${t.id}">⏱ Tập trung làm việc này</button>
      ${WHERE.filter(([w]) => w !== where).map(([w, l]) => `<button data-act="updateTask" data-id="${t.id}" data-when="${w}">Chuyển → ${l}</button>`).join('')}
      <button class="danger" data-act="deleteTask" data-id="${t.id}" data-confirm="Xóa nhiệm vụ này?">🗑 Xóa</button></div></details>`}
  </div>`;
}

TABS.quests = s => {
  const now = Date.now(), cur = G.weekKey(now), eod = G.endOfDay(now);
  const lists = { today: [], week: [], next: [], inbox: [], done: [] };
  for (const t of s.tasks) {
    const dl = G.deadline(t);
    if (t.status === 'done') { if (G.dayKey(t.doneAt) === G.dayKey(now)) lists.done.push(t); }
    else if (dl && dl <= eod) lists.today.push(t);
    else if (t.week && t.week !== cur) lists.next.push(t);
    else if (t.week || t.due) lists.week.push(t);
    else lists.inbox.push(t);
  }
  for (const k of ['today', 'week', 'next', 'inbox']) lists[k].sort((a, b) => (G.deadline(a) || 9e15) - (G.deadline(b) || 9e15));
  lists.done.sort((a, b) => b.doneAt - a.doneAt);
  const [vk, vi, vn, emptyTitle, emptyHint] = Q_VIEWS.find(v => v[0] === ui.qview) || Q_VIEWS[0];
  const st = G.STATUSES[s.status], sug = G.suggestions(s, ui.sugSeed), boss = G.bossOf(cur);
  return `<div class="qwrap">
    ${st && sug.length ? `<div class="sugs"><span class="muted">Gợi ý:</span>${sug.map(([title, cat, diff]) =>
      `<button class="sug" data-act="addTask" data-title="${esc(title)}" data-cat="${cat}" data-diff="${diff}" data-when="today" title="Nhận vào Hôm nay">＋ ${G.CATS[cat].icon} ${esc(title)}</button>`).join('')}
      <button class="sug" data-do="reroll" title="Đổi gợi ý">🎲</button></div>` : ''}

    <form id="addForm" class="qadd">
      <input name="title" id="addTitle" data-keep="a-title" placeholder="＋ Gõ tự nhiên rồi Enter — VD: nộp báo cáo NCKH trước thứ 6" maxlength="200" autocomplete="off">
      <details class="qopts" data-open="qopts"><summary title="Nhánh, độ khó, thời hạn">⚙</summary><div class="qopts-b">
        <select name="cat" data-keep="a-cat">${catOpt('int')}</select>
        <select name="diff" data-keep="a-diff">${opt({ 1: '★ Dễ', 2: '★★ Vừa', 3: '★★★ Khó' }, 2)}</select>
        <select name="when">${opt(Object.fromEntries(WHERE), vk === 'done' ? 'today' : vk)}</select>
        <input name="due" data-keep="a-due" type="datetime-local" title="Hạn chót (tùy chọn)">
      </div></details>
      <button class="primary">Thêm</button>
    </form>
    <div class="qhint smart-hint" id="smartHint"></div>
    <details class="routines" data-open="smart"><summary>✨ Giao nhiều việc bằng đoạn văn / file .txt <span class="muted">— app tự hiểu môn, loại việc, hạn chót</span></summary>
      <textarea id="smartText" data-keep="smart-text" rows="4" placeholder="Mỗi dòng một việc, gõ như nhắn tin. VD:&#10;nay thầy giao bài tập code môn nghiên cứu khoa học&#10;- đọc chương 3 giải thuật hạn mai&#10;- thi giữa kỳ CNPM ngày 25/9 lúc 7h30"></textarea>
      <div class="rform"><button type="button" class="primary" data-do="smartParse">✨ Phân tích</button>
        <label class="filebtn">📄 Mở file .txt<input type="file" accept=".txt,.md,text/plain" data-change="smartFile"></label>
        <span class="muted">hoặc kéo thả file .txt vào ô trên</span></div>
      <div id="smartOut">${smartRows()}</div>
    </details>

    <div class="seg">${Q_VIEWS.map(([k, ic, n]) => `<button data-do="qview" data-v="${k}" class="${k === vk ? 'on' : ''}">${ic} ${n}<b>${lists[k].length}</b></button>`).join('')}</div>
    ${vk === 'week' ? `<div class="qhint">👹 Boss tuần: ${boss.icon} ${boss.name} — hoàn thành hết trước 23:59 Chủ Nhật để hạ gục</div>` : ''}
    <div class="qlist">${lists[vk].length ? lists[vk].map(t => questRow(t, now)).join('')
      : `<div class="qempty"><b>${vi}</b>${emptyTitle}<div class="muted">${emptyHint}</div></div>`}</div>

    <details class="routines" data-open="routines"><summary>🔁 Nhiệm vụ lặp lại <b>${s.routines.length}</b> <span class="muted">— tự tạo vào Hôm nay theo ngày & giờ</span></summary>
      ${s.routines.map(r => `<div class="routine"><span>${G.CATS[r.cat].icon}</span><b>${esc(r.title)}</b>
        <span class="muted">${daysTxt(r.days)} · ${r.from}–${r.to} · ${stars(r.diff)}${r.keep ? ' · 🔒 giữ máy tới khi xong' : ''}</span>
        <button class="danger" data-act="delRoutine" data-id="${r.id}" data-confirm="Xóa nhiệm vụ lặp lại này?" title="Xóa">🗑</button></div>`).join('') || '<div class="empty">Chưa có nhiệm vụ lặp lại.</div>'}
      <form id="routineForm" class="rform">
        <input name="title" data-keep="rt-title" placeholder="VD: Đưa laptop cho …" maxlength="200" required>
        <select name="cat" data-keep="rt-cat">${catOpt('spi')}</select>
        <select name="diff" data-keep="rt-diff">${opt({ 1: '★', 2: '★★', 3: '★★★' }, 1)}</select>
        <span class="days">${WEEKDAYS.map((d, i) => `<label><input type="checkbox" name="days" value="${i}" ${i >= 1 && i <= 5 ? 'checked' : ''}>${d}</label>`).join('')}</span>
        <input type="time" name="from" data-keep="rt-from" value="08:00" required>–<input type="time" name="to" data-keep="rt-to" value="09:00" required>
        <label title="Không tự đổi sang người khác theo lịch cho tới khi xong"><input type="checkbox" name="keep"> 🔒</label>
        <button class="primary">＋ Thêm</button>
      </form>
    </details>
  </div>`;
};
// ---- hiểu câu tự nhiên (G.parseTasks) ----
const whenLabel = w => ({ today: '🔥 Hôm nay', week: '📅 Tuần này', next: '🗓️ Tuần sau', inbox: '📥 Chờ' }[w] || '📅 Tuần này');
const smartDesc = t => `${G.CATS[t.cat].icon} ${G.CATS[t.cat].name} · ${stars(t.diff)} · ${t.due ? '⏰ ' + whenTxt(t.due) : whenLabel(t.when)}`;
const smartFallback = () => (ui.qview && ui.qview !== 'done' ? ui.qview : 'today');
function updateHint() { // gợi ý ngay dưới ô thêm: app hiểu câu thế nào
  const el = $('smartHint'), input = $('addTitle'), v = input ? input.value.trim() : '';
  if (!el) return;
  if (!v) { el.textContent = ''; return; }
  if (ui.manualAdd) { el.textContent = '⚙ Dùng nhánh / độ khó / hạn bạn đã chọn'; return; }
  const [t] = G.parseTasks(v, S, Date.now(), smartFallback());
  el.innerHTML = t ? `✨ Sẽ thêm: <b>${esc(t.title)}</b> · ${smartDesc(t)}${t.why.length ? ` <span class="muted">(${esc(t.why.join(' · '))})</span>` : ''}` : '';
}
TABS.quests.after = updateHint;
function smartRows() {
  const list = ui.smart || [];
  if (!list.length) return '';
  return `<div class="smart-list">${list.map((t, i) => `<label class="smart-row ${t.on === false ? 'skip' : ''}">
      <input type="checkbox" data-si="${i}" ${t.on === false ? '' : 'checked'}>
      <div><input class="smart-title" data-st="${i}" value="${esc(t.title)}">
        <div class="qmeta">${smartDesc(t)}${t.why.length ? ' · ' + esc(t.why.join(' · ')) : ''}</div></div></label>`).join('')}
    <button type="button" class="primary" data-do="smartAccept">＋ Nhận ${list.filter(t => t.on !== false).length} nhiệm vụ</button></div>`;
}
let hintTimer;
document.addEventListener('input', e => {
  if (e.target.id === 'addTitle') { clearTimeout(hintTimer); hintTimer = setTimeout(updateHint, 120); }
  if (e.target.dataset.st && ui.smart) ui.smart[+e.target.dataset.st].title = e.target.value;
});
document.addEventListener('change', e => {
  if (e.target.closest('.qopts')) { ui.manualAdd = true; updateHint(); }
  if (e.target.dataset.si && ui.smart) { ui.smart[+e.target.dataset.si].on = e.target.checked; $('smartOut').innerHTML = smartRows(); }
});
DO.smartParse = () => {
  ui.smart = G.parseTasks($('smartText').value, S, Date.now());
  $('smartOut').innerHTML = smartRows() || '<div class="muted">Chưa đọc được việc nào — mỗi dòng một việc nhé.</div>';
};
DO.smartFile = async el => {
  const f = el.files && el.files[0];
  if (!f) return;
  if (f.size > 200000) return toast({ kind: 'info', msg: '📄 File quá lớn (tối đa 200 KB)' });
  $('smartText').value = await f.text();
  el.value = '';
  DO.smartParse();
};
DO.smartAccept = () => {
  for (const t of (ui.smart || []).filter(x => x.on !== false && x.title.trim())) api.act('addTask', { title: t.title.trim(), cat: t.cat, diff: t.diff, when: t.when, due: t.due });
  ui.smart = [];
  $('smartText').value = '';
  paint();
};
// Kéo thả file .txt vào ô văn bản (chặn trước bộ kéo-thả "Pet ăn file" của petctl.js)
document.addEventListener('dragover', e => {
  if (e.target.id === 'smartText' && [...e.dataTransfer.types].includes('Files')) { e.preventDefault(); e.stopPropagation(); e.dataTransfer.dropEffect = 'copy'; }
}, true);
document.addEventListener('drop', e => {
  if (e.target.id !== 'smartText' || !e.dataTransfer.files.length) return;
  e.preventDefault(); e.stopPropagation();
  DO.smartFile({ files: e.dataTransfer.files });
}, true);
document.addEventListener('submit', e => {
  if (e.target.id !== 'addForm') return;
  e.preventDefault();
  const f = new FormData(e.target), title = f.get('title').trim();
  if (!title) return;
  const [t] = ui.manualAdd ? [] : G.parseTasks(title, S, Date.now(), smartFallback());
  if (t) api.act('addTask', { title: t.title, cat: t.cat, diff: t.diff, when: t.when, due: t.due });
  else api.act('addTask', { title, cat: f.get('cat'), diff: +f.get('diff'), when: f.get('when'), due: f.get('due') ? +new Date(f.get('due')) : null });
  ui.manualAdd = false;
  $('smartHint').textContent = '';
  view.querySelector('[data-keep="a-title"]').value = '';
  view.querySelector('[data-keep="a-due"]').value = '';
});
document.addEventListener('submit', e => {
  if (e.target.id !== 'routineForm') return;
  e.preventDefault();
  const f = new FormData(e.target);
  api.act('addRoutine', { title: f.get('title'), cat: f.get('cat'), diff: +f.get('diff'), days: f.getAll('days').map(Number), from: f.get('from'), to: f.get('to'), keep: f.get('keep') === 'on' });
  view.querySelector('[data-keep="rt-title"]').value = '';
});
// Bấm ra ngoài thì đóng menu ⋯ / tùy chọn đang mở.
document.addEventListener('click', e => document.querySelectorAll('details.qmore[open], details.qopts[open]').forEach(d => { if (!d.contains(e.target)) d.open = false; }));
DO.qview = b => { ui.qview = b.dataset.v; paint(); };
DO.reroll = () => { ui.sugSeed++; paint(); };
DO.focusOn = b => { ui.focusTask = b.dataset.id; setTab('focus'); };

// ---------- TAB: TẬP TRUNG ----------
TABS.focus = s => {
  const f = s.focus, now = Date.now(), w = G.item(s.weapon);
  const todo = s.tasks.filter(t => t.status === 'todo');
  if (f) {
    const task = s.tasks.find(t => t.id === f.taskId);
    return `<div class="grid2">
      <div class="panel"><h2>⚔️ Đang săn quái <small>${task ? esc(task.title) : 'Tu luyện tự do'}</small></h2>
        <div class="focus-arena fighting"><div class="pet">${petSVG(s, 'focus')}</div><div class="mob" id="fMob">👾</div></div>
        <div class="big-timer" id="bigTimer">${mmss(f.start + f.min * G.MIN - now)}</div>
        ${barHTML('exp', now - f.start, f.min * G.MIN, '', 'fBar')}
        <p class="muted" id="fKills" style="text-align:center"></p>
        <div style="text-align:center"><button class="danger" data-act="cancelFocus" data-confirm="Bỏ dở sẽ mất 10 HP và rớt combo. Chắc chứ?">✖ Bỏ cuộc</button></div>
      </div>
      <div class="panel"><h2>📜 Luật</h2><p class="muted">Giữ tập trung đến hết giờ để nhận <b>EXP = phút × 2</b> (nhân combo x${(1 + 0.1 * Math.min(s.combo, 10)).toFixed(1)}${w ? ` và ${w.icon} +${w.bonus * 100}%` : ''}), vàng, điểm kỹ năng ${G.CATS[f.cat].icon} và cơ hội rớt rương. Bỏ giữa chừng: −10 HP, mất combo.</p></div>
    </div>`;
  }
  const est = Math.round(ui.focusMin * 2 * (1 + 0.1 * Math.min(s.combo, 10)) * (1 + (w ? w.bonus : 0)) * G.expMult(s, now));
  return `<div class="grid2">
    <div class="panel"><h2>⏳ Chuẩn bị xuất quân <small>Combo hiện tại x${s.combo}</small></h2>
      <div class="focus-arena"><div class="pet">${petSVG(s)}</div><div class="mob" style="opacity:.25">💤</div></div>
      <p class="muted">Thời lượng</p>
      <div class="dur-picks">${[15, 25, 45, 60, 90].map(m => `<button data-do="dur" data-min="${m}" class="${ui.focusMin === m ? 'on' : ''}">${m} phút</button>`).join('')}
        <input type="number" min="1" max="180" value="${ui.focusMin}" data-change="durCustom" style="width:80px"></div>
      <p class="muted">Làm nhiệm vụ nào?</p>
      <select data-change="focusTask" style="width:100%"><option value="">🧘 Tu luyện tự do (cộng Tinh thần)</option>
        ${todo.map(t => `<option value="${t.id}" ${t.id === ui.focusTask ? 'selected' : ''}>${G.CATS[t.cat].icon} ${esc(t.title)}</option>`).join('')}</select>
      <div class="big-timer">${two(ui.focusMin)}:00</div>
      <div style="text-align:center"><button class="primary" data-do="startFocus" style="padding:10px 28px;font-size:16px">⚔️ Bắt đầu — dự kiến +${est} EXP</button></div>
    </div>
    <div class="panel"><h2>🕹️ Idle RPG</h2><p class="muted">Khi đếm giờ chạy, Pet trên widget tự đánh quái & nhặt tài nguyên. Hết giờ nhận thưởng lớn + combo tăng 10%/phiên (tối đa x2). Phiên ≥20 phút có 20% rớt 📦, 5% rớt 🧊.<br><br>Mẹo: phiên 25 phút + nghỉ 5 phút (Pomodoro) là cách giữ combo đều nhất.</p>
      ${todayFocus(s)}</div>
  </div>`;
};
function todayFocus(s) {
  const today = G.dayKey(Date.now()), rows = s.log.filter(l => (l.k === 'focus' || l.k === 'cancel') && G.dayKey(l.t) === today);
  const mins = rows.reduce((a, l) => a + (l.n || 0), 0);
  return `<h2 style="margin-top:14px">📅 Hôm nay <small>${mins} phút tập trung</small></h2>
    ${rows.slice(-8).reverse().map(l => `<div class="muted">${hm(l.t)} — ${l.k === 'focus' ? `✅ ${l.n} phút ${G.CATS[l.cat].icon}` : '❌ Bỏ dở'}</div>`).join('') || '<div class="empty">Chưa có phiên nào.</div>'}`;
}
DO.dur = b => { ui.focusMin = +b.dataset.min; paint(); };
DO.durCustom = el => { ui.focusMin = Math.min(180, Math.max(1, +el.value || 25)); paint(); };
DO.focusTask = el => { ui.focusTask = el.value; };
DO.startFocus = () => api.act('startFocus', { min: ui.focusMin, taskId: ui.focusTask || null });

// ---------- TAB: CÂY KỸ NĂNG ----------
TABS.skills = s => {
  const t = G.heroTitle(s);
  const branch = k => {
    const c = G.CATS[k], p = s.skills[k], tier = G.tier(s, k), next = G.TIERS[tier];
    const prev = tier ? G.TIERS[tier - 1] : 0;
    const nodes = G.NODES[k].map((n, i) => `${i ? `<div class="link ${i < tier ? 'on' : ''}"></div>` : ''}
      <div class="node ${i < tier ? 'on' : ''}" title="${n} — cần ${G.TIERS[i]} điểm">${c.icon}<small>${n}</small></div>`).join('');
    const bonus = { int: `+${tier * 5}% EXP`, str: `+${tier * 10} HP`, cre: `+${tier * 5}% vàng`, spi: `−${tier * 10}% sát thương` }[k];
    return `<div class="panel branch" style="--c:${c.color}">
      <h2 style="color:${c.color}">${c.icon} ${c.name} <small>${p} điểm · bậc ${tier}/5 · đang hưởng ${bonus}</small></h2>
      <div class="nodes">${nodes}</div>
      <div style="height:28px"></div>
      ${next ? barHTML('exp', p - prev, next - prev, `${p} / ${next} → mở "${G.NODES[k][tier]}"`) : '<div class="muted">🌟 Đã mở toàn bộ nhánh</div>'}
      <p class="muted">Nội tại: ${c.perk}</p></div>`;
  };
  return `<div class="grid2">
    <div class="panel" style="text-align:center">
      <div style="width:190px;height:190px;margin:0 auto">${petSVG(s)}</div>
      <div class="boss-name" style="color:var(--gold)">${esc(t.title)}</div>
      <p class="muted">Nhánh cao nhất quyết định danh hiệu & ngoại hình:<br>📘 mũ phù thủy · 💪 băng đô · 🎨 mũ nồi · 🧘 hào quang<br>Thăng hạng danh hiệu ở 15 / 60 / 150 điểm — hào quang càng sáng.</p>
      <p class="muted">Cộng điểm: hoàn thành nhiệm vụ (+1/+2/+3 theo độ khó) · phiên tập trung (+1 mỗi 25 phút)</p>
    </div>
    ${Object.keys(G.CATS).map(branch).join('')}
  </div>`;
};

// ---------- TAB: BOSS TUẦN ----------
function bossBlock(s, key, preview) {
  const boss = G.bossOf(key), tasks = G.weekTasks(s, key);
  const max = tasks.reduce((a, t) => a + G.DIFF[t.diff].dmg * 10, 0);
  const hp = tasks.filter(t => t.status === 'todo').reduce((a, t) => a + G.DIFF[t.diff].dmg * 10, 0);
  const dead = !preview && s.boss.week === key && s.boss.defeated;
  const left = G.weekEnd(key) - Date.now();
  return `<div class="panel boss-stage">
    <div class="muted">${preview ? 'TUẦN SAU' : 'TUẦN NÀY'} · ${dm(key + 'T00:00:00')} → ${dm(G.weekEnd(key))}</div>
    <div class="boss-ico ${dead ? 'dead' : ''}" style="${preview ? 'filter:brightness(0) drop-shadow(0 0 8px #a855f7)' : ''}">${boss.icon}</div>
    <div class="boss-name">${boss.name}</div>
    ${max ? barHTML('boss', hp, max, `${hp} / ${max} HP`) : `<p class="muted">Boss chưa hiện hình — ${preview ? 'khai báo nhiệm vụ tuần sau' : 'thêm nhiệm vụ cho tuần này'} để tạo thanh máu.</p>`}
    <p class="muted">${dead ? '🏆 Đã hạ gục! Phần thưởng 👑 Rương Hoàng Kim nằm trong Cửa hàng › Túi đồ.'
      : preview ? 'Mỗi nhiệm vụ = một phần máu Boss (★10 · ★★20 · ★★★40).'
      : `⏳ Còn ${durTxt(left)} tới 23:59 Chủ Nhật. Dọn sạch để nhận 👑 Rương Hoàng Kim. Boss bỏ trốn: −15 HP, nhiệm vụ tồn dồn sang tuần sau.`}</p>
  </div>
  <div class="panel"><h2>${preview ? '🗓️ Kế hoạch tuần sau' : '⚔️ Đòn đánh tuần này'} <small>${tasks.filter(t => t.status === 'done').length}/${tasks.length} hoàn thành</small></h2>
    ${preview ? `<form id="nextForm" class="addform" style="grid-template-columns:1fr 1fr auto">
      <input name="title" data-keep="n-title" style="grid-column:1/-1" placeholder="Khai báo nhiệm vụ cho tuần sau…" maxlength="200" autocomplete="off">
      <select name="cat" data-keep="n-cat">${Object.entries(G.CATS).map(([k, c]) => `<option value="${k}">${c.icon} ${c.name}</option>`).join('')}</select>
      <select name="diff" data-keep="n-diff"><option value="1">★</option><option value="2" selected>★★</option><option value="3">★★★</option></select>
      <button class="primary">＋ Khai báo</button></form>` : ''}
    ${tasks.map(t => questRow(t, Date.now())).join('') || '<div class="empty">Chưa có nhiệm vụ.</div>'}
  </div>`;
}
TABS.boss = s => {
  const now = Date.now();
  return `<div class="grid2"><div class="stack">${bossBlock(s, G.weekKey(now), false)}</div>
    <div class="stack">${bossBlock(s, G.weekKey(now + 7 * G.DAY), true)}</div></div>`;
};
document.addEventListener('submit', e => {
  if (e.target.id !== 'nextForm') return;
  e.preventDefault();
  const f = new FormData(e.target), title = f.get('title').trim();
  if (!title) return;
  api.act('addTask', { title, cat: f.get('cat'), diff: +f.get('diff'), when: 'next' });
  view.querySelector('[data-keep="n-title"]').value = '';
});

// ---------- TAB: CỬA HÀNG ----------
TABS.shop = s => {
  const gold = s.hero.gold;
  const card = it => {
    const own = s.owned.includes(it.id), eq = s.skin === it.id || s.weapon === it.id;
    const art = it.kind === 'skin' ? `<div class="swatch" style="background:${it.color}"></div>` : `<div class="big">${it.icon}</div>`;
    const btn = it.kind === 'use' ? `<button data-act="buy" data-id="${it.id}" ${gold < G.priceOf(s, it) ? 'disabled' : ''}>Mua</button>`
      : own ? `<button data-act="equip" data-id="${it.id}" class="${eq ? 'primary' : ''}">${eq ? 'Đang dùng' : 'Trang bị'}</button>`
      : `<button data-act="buy" data-id="${it.id}" ${gold < it.price ? 'disabled' : ''}>Mua</button>`;
    return `<div class="item ${it.rare ? 'rare' : ''}">${it.rare ? '<span class="tag">HIẾM</span>' : ''}${art}
      <b>${it.name}</b><div class="desc">${it.desc || (it.bonus ? `+${it.bonus * 100}% EXP khi tập trung` : 'Đổi màu Pet')}</div>
      <div class="price">${own && it.kind !== 'use' ? '✔ Đã có' : `💰 ${G.priceOf(s, it).toLocaleString('vi-VN')}`}</div>${btn}</div>`;
  };
  const inv = ['potion', 'freeze', 'chest', 'relic', 'meat', 'cake'].map(G.item).map(it => `<div class="item"><span class="count">×${s.inv[it.id]}</span><div class="big">${it.icon}</div>
    <b>${it.name}</b><div class="desc">${it.desc}</div>
    <button class="primary" data-act="use" data-id="${it.id}" ${s.inv[it.id] ? '' : 'disabled'} ${it.id === 'freeze' ? 'data-confirm="Dùng Băng Giá: dời mọi deadline thêm 24 giờ và bảo toàn streak?"' : ''}>Dùng</button></div>`).join('');
  const sale = kind => G.SHOP.filter(i => i.kind === kind && (i.price || kind !== 'use')).filter(i => i.price || s.owned.includes(i.id)).map(card).join('');
  return `<div class="stack">
    <div class="panel"><h2>🎒 Túi đồ</h2><div class="items">${inv}</div></div>
    <div class="panel"><h2>🎁 Đổi thưởng ngoài đời <small>tự đặt phần thưởng cho chính mình</small></h2>
      <div class="items">${s.rewards.map(r => `<div class="item"><div class="big">${esc(r.icon)}</div><b>${esc(r.name)}</b>
        <div class="price">💰 ${r.cost.toLocaleString('vi-VN')}</div>
        <button class="primary" data-act="redeem" data-id="${r.id}" ${gold < r.cost ? 'disabled' : ''} data-confirm="Đổi ${r.cost} vàng lấy: ${esc(r.name)}?">Đổi</button>
        <button class="danger" data-act="delReward" data-id="${r.id}" data-confirm="Xóa phần thưởng này?" style="padding:2px">Xóa</button></div>`).join('')}
        <form id="rewardForm" class="item" style="text-align:left">
          <input name="icon" data-keep="r-icon" placeholder="Biểu tượng 🎁" maxlength="4">
          <input name="name" data-keep="r-name" placeholder="VD: 1 giờ xem phim" maxlength="80" required>
          <input name="cost" data-keep="r-cost" type="number" min="1" placeholder="Giá vàng" required>
          <button class="primary">＋ Thêm phần thưởng</button></form></div></div>
    <div class="panel"><h2>🧪 Vật phẩm</h2><div class="items">${sale('use')}</div></div>
    <div class="panel"><h2>🐾 Pet · Skin · Phụ kiện <small>đã chuyển sang tab riêng, có thử đồ trực tiếp</small></h2><button class="primary" data-tab="pet">Mở Tiệm Pet →</button></div>
    <div class="panel"><h2>⚔️ Vũ khí <small>hiện trên Pet, tăng EXP tập trung</small></h2><div class="items">${sale('weapon')}</div></div>
  </div>`;
};
document.addEventListener('submit', e => {
  if (e.target.id !== 'rewardForm') return;
  e.preventDefault();
  const f = new FormData(e.target);
  api.act('addReward', { icon: f.get('icon') || '🎁', name: f.get('name'), cost: +f.get('cost') });
  ['r-icon', 'r-name', 'r-cost'].forEach(k => { view.querySelector(`[data-keep="${k}"]`).value = ''; });
});

// ---------- TAB: THỐNG KÊ ----------
TABS.stats = s => {
  const key = G.weekKey(Date.now() + ui.statWeek * 7 * G.DAY), start = +new Date(key + 'T00:00:00'), end = G.weekEnd(key);
  const logs = s.log.filter(l => l.t >= start && l.t <= end);
  const days = Array.from({ length: 7 }, (_, i) => ({ mins: 0, tasks: 0, label: ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'][i] }));
  const skill = { int: 0, str: 0, cre: 0, spi: 0 };
  for (const l of logs) {
    const d = days[(new Date(l.t).getDay() + 6) % 7];
    if (l.k === 'focus') { d.mins += l.n; skill[l.cat] += Math.max(1, Math.round(l.n / 25)); }
    if (l.k === 'task') { d.tasks++; skill[l.cat] += l.n; }
  }
  const kills = days.reduce((a, d) => a + d.tasks, 0), mins = days.reduce((a, d) => a + d.mins, 0);
  const best = days.reduce((b, d, i) => (d.mins + d.tasks * 25 > days[b].mins + days[b].tasks * 25 ? i : b), 0);
  const due = s.tasks.filter(t => { const dl = G.deadline(t); return (dl && dl >= start && dl <= end) || (t.status === 'done' && t.doneAt >= start && t.doneAt <= end); });
  const rate = due.length ? Math.round(due.filter(t => t.status === 'done').length / due.length * 100) : 0;
  const fails = logs.filter(l => l.k === 'fail').length, cancels = logs.filter(l => l.k === 'cancel').length;
  const maxBar = Math.max(30, ...days.map(d => d.mins));
  const topCat = Object.keys(skill).sort((a, b) => skill[b] - skill[a])[0];
  const tc = (k, v, ic, sub = '') => `<div class="tcard"><div class="k">${k}</div><div class="v">${v}</div><div class="muted">${sub}</div><div class="ic">${ic}</div></div>`;
  return `<div class="stack">
    <div class="panel" style="display:flex;gap:8px;align-items:center"><h2 style="margin:0;flex:1">📊 Báo cáo tuần <small>${dm(start)} → ${dm(end)}</small></h2>
      <button data-do="statWeek" data-w="-1" class="${ui.statWeek ? 'primary' : ''}">◀ Tuần trước</button><button data-do="statWeek" data-w="0" class="${ui.statWeek ? '' : 'primary'}">Tuần này</button></div>
    <div class="cards">
      ${tc('Quái đã hạ', kills, '⚔️', 'nhiệm vụ hoàn thành')}
      ${tc('Tập trung', `${Math.floor(mins / 60)}h${two(mins % 60)}`, '⏳', `${logs.filter(l => l.k === 'focus').length} phiên · ${cancels} lần bỏ dở`)}
      ${tc('Hoàn thành', `${rate}%`, '🎯', `${due.filter(t => t.status === 'done').length}/${due.length} nhiệm vụ có hạn trong tuần`)}
      ${tc('Ngày sung sức', kills + mins ? days[best].label : '—', '🏅', kills + mins ? `${days[best].mins} phút · ${days[best].tasks} nhiệm vụ` : 'chưa có dữ liệu')}
      ${tc('Trễ hạn', fails, '💔', 'lần bị mất máu')}
      ${tc('Chuỗi ngày', s.hero.streak, '🔥', `kỷ lục ${s.hero.best} ngày`)}
      ${tc('Nhánh nổi bật', skill[topCat] ? G.CATS[topCat].icon : '—', '🌳', skill[topCat] ? `${G.CATS[topCat].name} +${skill[topCat]} điểm` : 'chưa có')}
      ${tc('Boss', ui.statWeek === 0 && s.boss.defeated ? 'HẠ' : 'Chưa', G.bossOf(key).icon, G.bossOf(key).name)}
    </div>
    <div class="panel"><h2>⏳ Phút tập trung theo ngày <small>cột vàng = ngày làm việc hiệu quả nhất</small></h2>
      <div class="chart">${days.map((d, i) => `<div class="col ${kills + mins && i === best ? 'best' : ''}"><span>${d.mins}'</span>
        <div class="b" style="height:${d.mins / maxBar * 100}%"></div><span>${d.label} · ⚔${d.tasks}</span></div>`).join('')}</div></div>
  </div>`;
};
DO.statWeek = b => { ui.statWeek = +b.dataset.w; paint(); };

// ---------- TAB: CÀI ĐẶT ----------
TABS.settings = s => {
  const st = s.settings;
  const chk = (k, label, sub) => `<div class="setrow"><div>${label}<div class="muted">${sub}</div></div><input type="checkbox" data-change="setChk" data-k="${k}" ${st[k] ? 'checked' : ''}></div>`;
  const hk = (k, label) => `<div class="setrow"><div>${label}</div><input data-change="setTxt" data-k="${k}" value="${esc(st[k])}" style="width:260px;font-family:var(--mono)"></div>`;
  const u = userOf(s);
  const profile = p => {
    const slot = (p.schedule || [])[0] || { days: [1, 2, 3, 4, 5], from: '08:00', to: '12:00' };
    return `<div class="profile" data-id="${p.id}">
      <div class="setrow"><div><b>👤 ${esc(p.name)}</b>${p.default ? ' <span class="muted">· dùng ngoài các lịch</span>' : ''}
        <div class="muted">${(p.schedule || []).map(x => `${daysTxt(x.days)} ${x.from}–${x.to}`).join(' · ') || 'Không có lịch riêng'}</div></div>
        ${p.id === s.active ? `<span class="muted">✅ đang dùng${s.override ? ' (đổi tay)' : ''}</span>` : `<button data-do="switchUser" data-id="${p.id}">Dùng ngay</button>`}</div>
      <div class="setrow"><span>💖 Pet khen / nịnh người này</span><input type="checkbox" data-change="profileSweet" data-id="${p.id}" ${p.sweet ? 'checked' : ''}></div>
      ${p.default ? '' : `<div class="rform"><span class="muted">Lịch:</span>
        <span class="days">${WEEKDAYS.map((d, i) => `<label><input type="checkbox" name="sd" value="${i}" ${slot.days.includes(i) ? 'checked' : ''}>${d}</label>`).join('')}</span>
        <input type="time" name="sfrom" value="${slot.from}">–<input type="time" name="sto" value="${slot.to}">
        <button data-do="saveSchedule" data-id="${p.id}">Lưu lịch</button></div>`}
    </div>`;
  };
  return `<div class="grid2">
    <div class="panel"><h2>👥 Người dùng máy này <small>tự đổi người theo lịch · đổi tay có hiệu lực tới khi lịch đổi người (tối đa 6 giờ)</small></h2>
      ${s.profiles.map(profile).join('')}
      <p class="muted">Các cài đặt bên dưới áp dụng cho <b>${esc(u.name)}</b> (mỗi người có nhân vật, Pet, nhiệm vụ và cài đặt riêng).</p></div>
    <div class="panel"><h2>🪟 Widget</h2>
      <div class="setrow"><div>Độ trong suốt<div class="muted">${Math.round(st.opacity * 100)}%</div></div><input type="range" min="20" max="100" value="${Math.round(st.opacity * 100)}" data-change="setOpa"></div>
      ${chk('clickThrough', '👻 Xuyên chuột (click-through)', 'Click xuyên qua widget xuống ứng dụng bên dưới. Tắt bằng phím tắt hoặc khay hệ thống.')}
      ${chk('onTop', '📌 Luôn nổi trên cùng', 'Widget không bị cửa sổ khác che')}
      ${chk('autostart', '🚀 Khởi động cùng Windows', 'Tự chạy ẩn khi bật máy (chỉ hiện widget)')}
    </div>
    <div class="panel"><h2>⌨️ Phím tắt toàn cầu <small>Enter để lưu</small></h2>
      ${hk('hkQuick', 'Thêm nhanh nhiệm vụ')}${hk('hkGhost', 'Bật/tắt xuyên chuột')}${hk('hkWidget', 'Ẩn/hiện widget')}
      <p class="muted">Cú pháp Electron: <code>CommandOrControl+Shift+T</code>, <code>Alt+Space</code>… Lưu ý Ctrl+Shift+T trùng "mở lại tab vừa đóng" của trình duyệt.</p>
    </div>
    <div class="panel"><h2>🐾 Pet &amp; trạng thái</h2>
      ${chk('autoStatus', '🤖 Tự nhận trạng thái theo phần mềm đang dùng', 'Word, PowerPoint, Excel, VS Code… → Đang làm việc · Zoom, Teams, trang học → Đang học · Steam, Liên Minh, Valorant… → Đang chơi game · Facebook, YouTube, Zalo → Đang online. Chọn tay thì app nghỉ tự nhận 1 giờ.')}
      ${chk('petTalk', '💬 Pet tự bắt chuyện', 'Thỉnh thoảng nhắc nhiệm vụ, than chán, đòi ăn. Tắt thì Pet chỉ nói khi bạn tương tác.')}
      <div class="setrow"><div>🤖 Hỏi Pet bằng Claude<div class="muted">Dán khóa API Anthropic (console.anthropic.com) để Pet trả lời thông minh qua nút 💬 trên widget. Để trống: Pet vẫn trả lời được nhiệm vụ, lịch, từ vựng, chỉ số, thời tiết — không cần mạng.<br>⚠️ Khi có khóa, mỗi câu hỏi sẽ gửi tóm tắt (tên, cấp, nhiệm vụ &amp; lịch hôm nay, thời tiết) tới Anthropic và tính phí vào tài khoản của bạn. Khóa lưu trong save.json trên máy này.</div></div>
        <input type="password" data-change="setTxt" data-k="aiKey" value="${esc(st.aiKey || '')}" placeholder="sk-ant-..." style="width:220px;font-family:var(--mono)"></div>
      <div class="setrow"><div>🧠 Ghi nhớ thói quen trò chuyện<div class="muted">Sau mỗi vài lượt chat, Pet tự ghi vài dòng quan sát về ${esc(u.name)} (hay hỏi gì, thích trả lời ngắn hay dài, văn phong) để lần sau trả lời hợp hơn. Mỗi người một bộ nhớ riêng, lưu trong máy. Chỉ là ghi chú tham khảo — không đổi được tính cách hay quy tắc của Pet.</div>
        ${(s.chatNotes || []).length ? `<ul class="muted notes">${s.chatNotes.map(x => `<li>${esc(x)}</li>`).join('')}</ul>` : '<div class="muted">Chưa ghi nhớ gì — chat vài lượt (có khóa API) rồi quay lại xem.</div>'}</div>
        ${(s.chatNotes || []).length ? '<button data-act="clearChatNotes">Xóa ghi nhớ</button>' : ''}</div>
      ${chk('eatFiles', '📄 Cho Pet ăn file', 'Kéo file/thư mục thả vào Pet → chuyển vào Thùng rác (lấy lại được). Ổ không có Thùng rác (USB, ổ mạng) và thư mục hệ thống bị từ chối.')}
    </div>
    <div class="panel"><h2>📚 Học tập & thời tiết <small>áp dụng cho ${esc(u.name)}</small></h2>
      <div class="setrow"><div>🏮 Số từ tiếng Trung mỗi ngày<div class="muted">0 = tắt · bộ 390 từ ≈ HSK 4–5 · học xong mới sang bộ mới</div></div><input type="number" min="0" max="10" value="${st.zhPerDay}" data-change="setTxt" data-k="zhPerDay" style="width:80px"></div>
      ${chk('enDaily', '🔤 Nhắc luyện tiếng Anh B1 mỗi ngày', 'Mỗi ngày một gợi ý luyện, bấm "Đã luyện" để nhận EXP')}
      ${chk('schedQuests', '🎲 Nhiệm vụ ngẫu nhiên theo lịch học & làm', 'Mỗi sáng tạo 3 việc nhỏ quanh lịch hôm nay: chuẩn bị trước giờ học / vào ca, ôn bài / giãn cơ sau đó, tận dụng khoảng trống. Không bị phạt nếu quên.')}
      ${chk('itRemind', '💻 Thỉnh thoảng nhắc thi chứng chỉ tin học cơ bản', 'Rất hiếm: khoảng 1–2 tuần một lần')}
      ${chk('weatherTips', '🌤️ Nhắc giữ sức khỏe theo thời tiết', 'Áo mưa, nước ấm, chống nắng, áo ấm… mỗi loại tối đa 1 lần/ngày')}
      <div class="setrow"><div>📍 Vị trí thời tiết (chung cho máy)<div class="muted">Hiện tại: ${esc(s.location.name)} · nguồn Open-Meteo</div></div>
        <span><input id="cityInput" placeholder="VD: Hà Nội" style="width:140px"> <button data-do="setCity">Đổi</button></span></div>
    </div>
    <div class="panel"><h2>🎯 Mục tiêu</h2>
      <div class="setrow"><div>Số nhiệm vụ để điểm danh mỗi ngày<div class="muted">Điểm danh giữ chuỗi 🔥 và nhận vàng</div></div><input type="number" min="1" max="20" value="${st.dailyGoal}" data-change="setTxt" data-k="dailyGoal" style="width:80px"></div>
      <div class="setrow"><div>💧 Nhắc uống nước mỗi … phút<div class="muted">0 = tắt · áp dụng cho ${esc(u.name)}</div></div><input type="number" min="0" max="240" step="5" value="${st.waterEvery}" data-change="setTxt" data-k="waterEvery" style="width:80px"></div>
    </div>
    <div class="panel about"><h2>ℹ️ Giới thiệu</h2>
      <div class="setrow"><div><b>QuestLog</b> <span class="muted">v${esc(s.version || '')}</span><div class="muted">Quản lý thời gian kiểu game nhập vai · Pet đồng hành · lịch học & làm</div></div></div>
      <div class="setrow"><div>👤 Tác giả<div class="muted">${esc(s.author ? s.author.name : '')}</div></div></div>
      <div class="setrow"><div>✉️ Liên hệ, báo lỗi, góp ý<div class="sel">${esc(s.author ? s.author.email : '')}</div></div><button data-do="copyEmail">Sao chép</button></div>
      <p class="muted">Gặp lỗi hoặc có ý tưởng? Gửi email kèm ảnh chụp màn hình và phiên bản ở trên.</p>
    </div>
    <div class="panel"><h2>📖 Luật phạt</h2><p class="muted">Trễ hạn: −5 HP × độ khó (một lần/nhiệm vụ). Bỏ dở tập trung: −10 HP. Boss bỏ trốn: −15 HP. Không điểm danh qua ngày: mất chuỗi.<br>HP về 0: mất chuỗi ngày; nếu không có chuỗi thì mất 30% EXP của cấp hiện tại. Hồi sinh với 50% HP.<br>🧊 Băng Giá chặn mọi hình phạt trong 24h.</p></div>
  </div>`;
};
DO.copyEmail = () => {
  const mail = S.author ? S.author.email : '';
  navigator.clipboard.writeText(mail).then(() => toast({ kind: 'info', msg: `✉️ Đã sao chép ${mail}` }), () => toast({ kind: 'info', msg: `✉️ Email tác giả: ${mail}` }));
};
DO.setChk = el => api.act('setSettings', { [el.dataset.k]: el.checked });
DO.setTxt = el => api.act('setSettings', { [el.dataset.k]: el.type === 'number' ? +el.value : el.value.trim() });
DO.setCity = () => { const v = $('cityInput').value.trim(); if (v) api.city(v); };
DO.switchUser = b => api.profile('switchTo', { id: b.dataset.id });
DO.profileSweet = el => api.profile('setProfile', { id: el.dataset.id, sweet: el.checked });
DO.saveSchedule = b => {
  const box = b.closest('.profile');
  api.profile('setProfile', { id: b.dataset.id, schedule: [{ days: [...box.querySelectorAll('[name=sd]:checked')].map(x => +x.value), from: box.querySelector('[name=sfrom]').value, to: box.querySelector('[name=sto]').value }] });
};
DO.setOpa = el => api.act('setSettings', { opacity: el.value / 100 });

// ---------- TAB: HẰNG NGÀY ----------
function loginCal(s) {
  const ready = G.loginReady(s), today = ready ? s.login.n % 7 : (s.login.n - 1) % 7;
  return `<div class="cal">${G.LOGIN.map((rw, i) => {
    const got = ready ? i < today : i <= today, k = Object.keys(rw).pop();
    return `<div class="lday ${got ? 'got' : ''} ${i === today && ready ? 'cur' : ''} ${i === 6 ? 'big7' : ''}">
      <small>Ngày ${i + 1}</small><div class="ic">${i === 6 ? '👑' : k === 'gold' ? '💰' : G.item(k).icon}</div>
      <b>${G.rewardTxt(rw)}</b>${got ? '<span class="tick">✔</span>' : ''}</div>`;
  }).join('')}</div>`;
}
// Học mỗi ngày: từ tiếng Trung hôm nay (G.zhToday), gợi ý tiếng Anh B1, nhắc tin học.
function studyPanel(s) {
  const st = s.settings, L = s.learn, words = G.zhToday(s);
  if (!words.length && !st.enDaily && !st.itRemind) return '';
  return `<div class="panel study"><h2>📚 Học mỗi ngày <small>${esc(userOf(s).name)} · đã học ${s.stats.words} từ tiếng Trung · ${s.stats.enDays} ngày tiếng Anh</small>
      ${words.length ? `<button data-do="hideVi" class="${ui.hideVi ? 'primary' : ''}" title="Che nghĩa để tự kiểm tra, rê chuột để xem">🙈 Che nghĩa</button>` : ''}</h2>
    ${words.length ? `<div class="muted">🏮 Tiếng Trung · chủ đề: ${esc(words[0].topic)}</div>
      <div class="words ${ui.hideVi ? 'hide-vi' : ''}">${words.map(w => `<div class="word"><b>${esc(w.hz)}</b><span class="py">${esc(w.py)}</span><span class="vi">${esc(w.vi)}</span></div>`).join('')}</div>
      <div>${L.zhDone ? '<span class="muted">✅ Đã học xong hôm nay — mai có từ mới</span>' : `<button class="primary" data-act="learnZh">✅ Đã thuộc ${words.length} từ (+${3 * words.length} EXP)</button> <span class="muted">chưa bấm thì mai học lại bộ này</span>`}</div>` : ''}
    ${st.enDaily ? `<div class="study-row"><span>🔤 <b>Tiếng Anh B1 hôm nay:</b> ${esc(G.enTip(Date.now()))}</span>${L.enDone ? '<span class="muted">✅ Đã luyện</span>' : '<button class="primary" data-act="learnEn">✅ Đã luyện (+20 EXP)</button>'}</div>` : ''}
    ${st.itRemind ? '<div class="study-row muted">💻 Chứng chỉ tin học cơ bản: ôn Word · Excel · PowerPoint · Internet, để ý lịch thi của trường.</div>' : ''}
  </div>`;
}
function weatherPanel(s) {
  const w = s.weather;
  if (!w) return '';
  const now = Date.now(), info = G.wxInfo(w.code), tips = G.weatherTips(w, new Date(now).getHours());
  return `<div class="panel weather"><h2>${info.icon} Thời tiết <small>${esc(w.place)} · cập nhật ${hm(w.at)}${now - w.at > 3 * G.HOUR ? ' · dữ liệu cũ, kiểm tra mạng' : ''}</small></h2>
    <div class="wx-now"><b class="wx-temp">${w.temp}°C</b><div>${info.name} · cảm giác ${w.feels}°C<br>
      <span class="muted">Hôm nay ${w.min}–${w.max}°C · mưa ${w.rainProb}% (3 giờ tới ${w.rain3h}%) · ẩm ${w.humid}% · UV tối đa ${w.uvMax} · gió ${w.wind} km/h</span></div></div>
    ${tips.length ? `<div class="wx-tips">${tips.map(x => `<div>${x.icon} ${esc(x.text)}</div>`).join('')}</div>` : '<div class="muted">Thời tiết dễ chịu, không có lưu ý đặc biệt 🌿</div>'}
  </div>`;
}
DO.hideVi = () => { ui.hideVi = !ui.hideVi; paint(); };

TABS.daily = s => {
  const now = Date.now(), ready = G.loginReady(s);
  const bounty = s.bounty.list.map((b, i) => `<div class="bounty ${b.got ? 'got' : b.done ? 'ready' : ''}">
      <div class="bt"><b>${esc(b.text)}</b><span class="price">+${b.gold}💰 +30 EXP</span></div>
      ${barHTML('exp', b.prog, b.need, `${b.prog} / ${b.need}`)}
      ${b.got ? '<span class="muted">✅ Đã nhận</span>' : `<button class="${b.done ? 'primary' : ''}" data-act="claimBounty" data-i="${i}" ${b.done ? '' : 'disabled'}>Nhận</button>`}
    </div>`).join('');
  const got3 = s.bounty.list.filter(b => b.got).length;
  const ach = G.ACH.map(a => {
    const done = s.ach.includes(a.id), rd = !done && a.test(s);
    return `<div class="ach ${done ? 'done' : rd ? 'ready' : ''}"><div class="ic">${a.icon}</div><b>${a.name}</b><small>${a.desc}</small>
      ${done ? '<span class="muted">✔ Đã nhận</span>' : rd ? `<button class="primary" data-act="claimAch" data-id="${a.id}">Nhận ${a.gold}💰</button>` : `<span class="price">${a.gold}💰</span>`}</div>`;
  }).join('');
  const st = s.stats;
  return `<div class="stack">
    ${studyPanel(s)}${weatherPanel(s)}
    <div class="panel"><h2>📅 Quà đăng nhập <small>đã nhận ${st.logins} ngày · vòng 7 ngày, ngày 7 quà lớn</small></h2>
      ${loginCal(s)}
      <div style="text-align:center;margin-top:12px">${ready ? '<button class="primary" data-act="claimLogin" style="padding:9px 26px">🎁 Nhận quà hôm nay</button>' : '<span class="muted">✅ Đã nhận hôm nay — mai quay lại nhé!</span>'}</div></div>
    <div class="panel"><h2>📜 Nhiệm vụ ngày <small>làm mới sau ${durTxt(G.endOfDay(now) - now)} · xong cả 3: +📦 Rương Gỗ +100💰 ${s.bounty.bonus ? '✅' : `(${got3}/3)`}</small></h2>
      <div class="bounties">${bounty}</div></div>
    <div class="panel"><h2>🏅 Thành tựu <small>${s.ach.length}/${G.ACH.length} · ${st.tasks} nhiệm vụ · ${Math.floor(st.focus / 60)}h${two(st.focus % 60)} tập trung · ${st.bosses} boss · ${st.pats} lần vuốt ve</small></h2>
      <div class="achs">${ach}</div>
      <p class="muted">💥 Mỗi nhiệm vụ hoàn thành có 12% ra đòn CHÍ MẠNG nhân đôi vàng.</p></div>
  </div>`;
};

// ---------- TAB: PET ----------
TABS.pet = s => {
  const now = Date.now(), sp = G.item(s.petKind), food = Math.round(G.petFood(s, now)), b = G.bond(s);
  const next = G.BOND[b + 1], prev = G.BOND[b], gold = s.hero.gold;
  const pats = s.pet.patDay === s.day ? Math.min(15, s.pet.pats) : 0;
  const rec = G.petGet(s), st = G.petStage(rec), need = G.petNeed(rec.lv), maxed = rec.lv >= G.PET_MAX, ready = G.petEvoReady(s);
  const card = it => {
    const own = s.owned.includes(it.id), eq = [s.skin, s.petKind, ...Object.values(s.accs)].includes(it.id);
    const p = it.kind === 'pet' && own && G.petGet(s, it.id);
    const art = it.kind === 'skin' ? `<div class="swatch ${it.anim ? 'rainbow' : ''}" style="background:${it.color}"></div>` : `<div class="big">${it.icon}</div>`;
    const btn = own ? (eq && it.kind !== 'acc' ? '<button class="primary" disabled>Đang dùng</button>'
        : `<button data-act="equip" data-id="${it.id}" class="${eq ? 'primary' : ''}">${eq ? 'Tháo ra' : it.kind === 'pet' ? 'Dẫn theo' : 'Đeo'}</button>`)
      : `<button data-act="buy" data-id="${it.id}" ${gold < it.price ? 'disabled' : ''}>Mua 💰 ${it.price.toLocaleString('vi-VN')}</button>`;
    return `<div class="item ${it.rare ? 'rare' : ''} ${eq ? 'equipped' : ''}" data-preview="${it.id}">${it.rare ? '<span class="tag">HIẾM</span>' : ''}${art}
      <b>${p ? G.petName(s, it.id) : it.name}</b>${p ? `<span class="plv">Lv ${p.lv}${p.el ? ' ' + G.ELEMENTS[p.el].icon : ''}</span>` : ''}
      <div class="desc">${it.kind === 'acc' ? G.ACC_SLOTS[it.slot] + (own ? ' · ✔ Đã có' : '') : it.desc || (own ? '✔ Đã có' : 'Rê chuột để thử')}</div>${btn}</div>`;
  };
  const slotOrder = Object.keys(G.ACC_SLOTS);
  const list = kind => G.SHOP.filter(i => i.kind === kind).sort((a, b) => kind === 'acc' ? slotOrder.indexOf(a.slot) - slotOrder.indexOf(b.slot) : 0).map(card).join('');
  const branch = el => {
    const E = G.ELEMENTS[el], chosen = rec.el === el;
    return `<div class="evo-branch ${chosen ? 'chosen' : rec.el ? 'locked' : ''}" style="--c:${E.color}">
      <div class="evo-forms">${[1, 2, 3].map(k => `<div class="evo-mini ${chosen && st >= k ? 'got' : ''}">${petSVG(s, k === 3 ? 'love' : 'happy', { el, stage: k })}<small>Lv ${G.PET_EVO[k - 1]}${k === 3 ? ' ★' : ''}</small></div>`).join('')}</div>
      <b>${E.icon} Hệ ${E.name} · ${sp.short} ${E.titles[0]} → ${sp.short} ${E.titles[1]}</b>
      <div class="muted">${[1, 2, 3].map(k => G.elSkillTxt(el, k)).join(' → ')}</div>
      ${ready ? `<button class="primary" data-act="evolvePet" data-el="${el}" data-confirm="Tiến hóa ${sp.name} theo hệ ${E.name}? Chọn rồi không đổi lại được.">✨ Chọn hệ ${E.name}</button>`
        : chosen ? '<span class="evo-tag">✔ Đã chọn</span>' : ''}
    </div>`;
  };
  const evoHint = ready ? '🥚 Đã đạt Lv 5: chọn 1 hệ để tiến hóa!'
    : !rec.el ? `Còn ${G.PET_EVO[0] - rec.lv} cấp nữa là được chọn hệ.`
    : st < 3 ? `${G.STAGES[st + 1]} ở Lv ${G.PET_EVO[st]}.` : 'Đã thức tỉnh hoàn toàn!';
  const feed = id => `<button class="${s.inv[id] ? 'primary' : ''}" data-act="use" data-id="${id}" ${s.inv[id] && food < 100 ? '' : 'disabled'}>${G.item(id).icon} Cho ăn ×${s.inv[id]}</button>
    <button data-act="buy" data-id="${id}" ${gold < G.item(id).price ? 'disabled' : ''} title="Mua thêm">＋ ${G.item(id).price}💰</button>`;
  return `<div class="pet-layout">
    <div class="panel pet-room-panel">
      <h2>${sp.icon} ${G.petName(s)} <small>${G.STAGES[st]}</small></h2>
      <div class="pet-room"><div id="petRoom" class="pet-host" data-do="patRoom" data-key="${petKeyOf(s)}">${petSVG(s)}</div></div>
      <p class="muted" style="text-align:center;margin:0">👆 Bấm: vuốt ve · nhấp đúp: nhào lộn · rê qua lại: cù lét · 📄 kéo file thả vào: Pet ăn (vào Thùng rác)</p>
      <div class="kv"><span>🐾 Lv ${rec.lv}</span><small>${maxed ? 'Cấp tối đa' : `${rec.xp}/${need} XP`}</small></div>
      ${barHTML('pxp', maxed ? 1 : rec.xp, maxed ? 1 : need, ready ? '✨ Sẵn sàng tiến hóa' : '')}
      <div class="pskills"><span>🎯 ${sp.desc}</span>${st ? `<span style="--c:${G.ELEMENTS[rec.el].color}">${G.ELEMENTS[rec.el].icon} ${G.elSkillTxt(rec.el, st)}</span>` : ''}</div>
      <div class="kv"><span>💞 ${G.BOND_NAMES[b]}</span><small>${next ? `${s.pet.love}/${next} → ${G.BOND_NAMES[b + 1]}` : 'Tối đa'}</small></div>
      ${barHTML('love', next ? s.pet.love - prev : 1, next ? next - prev : 1, `+${b * 3}% EXP`)}
      <div class="kv"><span>🍖 Độ no ${food}%</span><small>${food < 25 ? '🥺 Đói — mất buff thân thiết' : 'giảm 4%/giờ'}</small></div>
      ${barHTML('food', food, 100, '')}
      <div class="feed">${feed('meat')}${feed('cake')}</div>
      <p class="muted" style="margin:0">Tăng thân thiết: vuốt ve (${pats}/15 hôm nay) · cho ăn · hoàn thành nhiệm vụ (+1) · tập trung xong (+2). Mỗi bậc thân +3% EXP khi Pet no. Pet đã ăn ${s.stats.eaten} file.</p>
    </div>
    <div class="stack">
      <div class="panel evo"><h2>✨ Tiến hóa <small>Lv 5 chọn hệ · Lv 15 dạng III · Lv 30 thức tỉnh ★</small></h2>
        <div class="evo-row">
          <div class="evo-base"><div class="evo-mini ${st === 0 ? 'got' : ''}">${petSVG(s, 'idle', { el: null, stage: 0 })}</div><b>${sp.name}</b><small>Dạng I</small></div>
          <div class="evo-branches">${sp.evo.map(branch).join('')}</div>
        </div>
        <p class="muted">${evoHint} Pet đang dẫn theo nhận XP bằng số EXP bạn kiếm được; mỗi loài lên cấp riêng.</p>
      </div>
      <div class="panel"><h2>🐾 Loài Pet <small>mỗi loài một nội tại · rê chuột để xem trước</small></h2><div class="items">${list('pet')}</div></div>
      <div class="panel"><h2>🎨 Skin <small>đổi màu cho mọi loài</small></h2><div class="items">${list('skin')}</div></div>
      <div class="panel"><h2>🎀 Phụ kiện <small>đeo cùng lúc: 1 món đội đầu · 1 món ở mặt · 1 món đeo cổ</small></h2><div class="items">${list('acc')}</div></div>
    </div>
  </div>`;
};

// ---------- TAB: LỊCH HỌC ----------
const C_VIEWS = [['next', '⏭ Sắp tới'], ['week', '🗓️ Tuần'], ['month', '📆 Tháng'], ['all', '📋 Tất cả'], ['past', '⏮ Đã qua']];
// ---- Thời khóa biểu tuần / tháng (G.agenda + G.freeSlots) ----
const CAL = { from: 6, to: 24, px: 32 }; // khung giờ vẽ & số px mỗi giờ
const durH = ms => { const m = Math.round(ms / G.MIN); return m % 60 ? `${Math.floor(m / 60)}h${two(m % 60)}` : `${m / 60}h`; };
const dayOf = (items, d) => items.filter(x => x.start < d + G.DAY && (x.end > d || x.start >= d));
const lateDue = x => x.kind === 'due' && new Date(x.start).getHours() === 23 && new Date(x.start).getMinutes() === 59;
const itTitle = x => `${x.kind === 'due' ? `Hạn ${hm(x.start)}` : `${hm(x.start)}–${hm(x.end)}`} · ${x.icon} ${x.title}${x.room ? ' · ' + x.room : ''}${x.off ? ' (tạm ngưng)' : ''}`;
const calLegend = `<span class="cal-legend"><i class="k-class">🏫 Học</i><i class="k-online">💻 Học online</i><i class="k-work">💼 Làm</i><i class="k-event">📌 Việc có giờ</i><i class="k-due">⏰ Hạn chót</i><i class="k-free">Trống ≥1h</i></span>`;
function weekView(s, now) {
  const mon = +new Date(G.weekKey(ui.calAt || now) + 'T00:00:00');
  const days = [...Array(7)].map((_, i) => G.startOfDay(mon + i * G.DAY + 2 * G.HOUR));
  const items = G.agenda(s, mon, days[6] + G.DAY, now), H = (CAL.to - CAL.from) * CAL.px;
  const y = (d, t) => Math.max(0, Math.min(H, (t - d) / G.HOUR - CAL.from) * CAL.px);
  let total = 0;
  const cols = days.map(d => {
    const its = dayOf(items, d), free = G.freeSlots(its, d), blocks = its.filter(x => x.kind !== 'due'), lanes = [];
    const dues = its.filter(lateDue), marks = its.filter(x => x.kind === 'due' && !lateDue(x));
    let group = [], groupEnd = 0; // các khối chồng giờ nhau xếp thành làn cạnh nhau, chỉ nhóm đó hẹp lại
    const close = () => group.forEach(g => { g.w = 100 / lanes.length; });
    for (const x of blocks) {
      if (x.start >= groupEnd) { close(); group = []; lanes.length = 0; }
      let i = lanes.findIndex(e => e <= x.start); if (i < 0) i = lanes.push(0) - 1;
      lanes[i] = x.end; x.lane = i; group.push(x); groupEnd = Math.max(groupEnd, x.end);
    }
    close();
    const fm = free.reduce((a, [f, t]) => a + t - f, 0);
    total += fm;
    return `<div class="wk-col ${d === G.startOfDay(now) ? 'today' : ''}">
      <div class="wk-head"><b>${dm(d)}</b><small class="${fm ? 'ok' : 'busy'}">${fm ? `trống ${durH(fm)}` : 'kín lịch'}</small>
        ${dues.length ? `<small class="wk-dues" title="${esc(dues.map(itTitle).join('\n'))}">⏰ ${dues.length} hạn chót</small>` : ''}</div>
      <div class="wk-body" style="height:${H}px">
        ${free.map(([f, t]) => `<div class="wk-free" style="top:${y(d, f)}px;height:${y(d, t) - y(d, f)}px" title="Trống ${hm(f)}–${hm(t)} (${durH(t - f)})"><span>${hm(f)}–${hm(t)}</span></div>`).join('')}
        ${blocks.map(x => { const top = y(d, x.start); return `<div class="wk-it k-${x.online && x.kind === 'class' ? 'online' : x.kind} ${x.off ? 'off' : ''}" style="top:${top}px;height:${Math.max(16, y(d, x.end) - top)}px;left:${x.lane * x.w}%;width:${x.w}%" title="${esc(itTitle(x))}"><b>${hm(x.start)}</b> ${x.icon} ${esc(x.title)}</div>`; }).join('')}
        ${marks.map(x => `<div class="wk-mark" style="top:${y(d, x.start)}px" title="${esc(itTitle(x))}">⏰ ${hm(x.start)} ${esc(x.title)}</div>`).join('')}
        ${d === G.startOfDay(now) ? `<div class="wk-now" style="top:${y(d, now)}px"></div>` : ''}
      </div></div>`;
  });
  return `<div class="cal-nav"><button data-do="calMove" data-d="-7" title="Tuần trước">‹</button><button data-do="calToday">Hôm nay</button><button data-do="calMove" data-d="7" title="Tuần sau">›</button>
      <b>Tuần ${dm(days[0])} – ${dm(days[6])}</b><span class="muted">tổng trống ${durH(total)} (06:00–23:00, khoảng ≥ 1 giờ)</span>${calLegend}</div>
    <div class="wk-scroll"><div class="wk">
      <div class="wk-col wk-hours"><div class="wk-head"></div><div class="wk-body" style="height:${H}px">${[...Array(CAL.to - CAL.from)].map((_, i) => `<span style="top:${i * CAL.px}px">${two(CAL.from + i)}:00</span>`).join('')}</div></div>
      ${cols.join('')}</div></div>`;
}
function monthView(s, now) {
  const a = new Date(ui.calAt || now), first = +new Date(a.getFullYear(), a.getMonth(), 1), next = +new Date(a.getFullYear(), a.getMonth() + 1, 1);
  const start = +new Date(G.weekKey(first) + 'T00:00:00'), n = Math.ceil((next - start) / G.DAY / 7 - 0.01) * 7;
  const days = [...Array(n)].map((_, i) => G.startOfDay(start + i * G.DAY + 2 * G.HOUR)), items = G.agenda(s, start, days[n - 1] + G.DAY, now);
  return `<div class="cal-nav"><button data-do="calMove" data-m="-1" title="Tháng trước">‹</button><button data-do="calToday">Hôm nay</button><button data-do="calMove" data-m="1" title="Tháng sau">›</button>
      <b>Tháng ${a.getMonth() + 1}/${a.getFullYear()}</b><span class="muted">bấm một ngày để xem tuần đó</span>${calLegend}</div>
    <div class="wk-scroll"><div class="mo">${['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'].map(x => `<div class="mo-h">${x}</div>`).join('')}
      ${days.map(d => {
        const its = dayOf(items, d), fm = G.freeSlots(its, d).reduce((m, [f, t]) => m + t - f, 0);
        return `<button class="mo-cell ${d >= first && d < next ? '' : 'out'} ${d === G.startOfDay(now) ? 'today' : ''}" data-do="calWeek" data-t="${d}" title="${esc(its.map(itTitle).join('\n') || 'Trống cả ngày')}">
          <span class="mo-top"><b>${new Date(d).getDate()}</b><small class="${fm ? 'ok' : 'busy'}">${fm ? durH(fm) + ' trống' : 'kín'}</small></span>
          ${its.slice(0, 4).map(x => `<span class="mo-it k-${x.online && x.kind === 'class' ? 'online' : x.kind} ${x.off ? 'off' : ''}">${x.kind === 'due' ? '⏰' : hm(x.start)} ${esc(x.title)}</span>`).join('')}
          ${its.length > 4 ? `<span class="muted">+${its.length - 4} mục</span>` : ''}</button>`;
      }).join('')}</div></div>`;
}
DO.calMove = b => { const a = new Date(ui.calAt || Date.now()); if (b.dataset.m) a.setMonth(a.getMonth() + +b.dataset.m, 1); else a.setDate(a.getDate() + +b.dataset.d); ui.calAt = +a; paint(); };
DO.calToday = () => { ui.calAt = 0; paint(); };
DO.calWeek = b => { ui.calAt = +b.dataset.t; ui.cview = 'week'; paint(); };
function classCard(s, c, now) {
  const { start, end } = G.classTime(s, c), live = !c.off && now >= start && now < end, done = now >= end;
  const work = c.kind === 'work';
  return `<div class="ccard ${c.off ? 'off' : c.online ? 'online' : work ? 'work' : ''} ${done && !c.off ? 'past' : ''}">
    <div><div class="qtitle">${G.schedIcon(c)} ${esc(c.subject)}${c.off ? ' <span class="ctag red">Tạm ngưng</span>' : live ? ` <span class="ctag">${work ? 'Đang làm' : 'Đang học'}</span>` : ''}</div>
      <div class="qmeta">⏰ ${c.at ? '' : `Tiết ${c.from}–${c.to} · `}${hm(start)}–${hm(end)}</div>
      ${c.room || c.teacher ? `<div class="qmeta">${c.online ? '💻 Trực tuyến · ' : '📍 '}${esc(c.room)}${c.teacher ? ` · 👤 ${esc(c.teacher)}` : ''}</div>` : ''}</div>
    <details class="qmore"><summary title="Tùy chọn">⋯</summary><div class="qmenu">
      <button data-act="toggleClass" data-id="${c.id}">${c.off ? '▶ Học lại (bỏ tạm ngưng)' : '⏸ Đánh dấu tạm ngưng'}</button>
      <button class="danger" data-act="delClass" data-id="${c.id}" data-confirm="Xóa lịch này?">🗑 Xóa</button></div></details>
  </div>`;
}
TABS.schedule = s => {
  const now = Date.now(), today = G.dayKey(now), view = ui.cview || 'next';
  const list = s.classes.filter(c => view === 'all' || (view === 'past' ? c.date < today : c.date >= today));
  if (view === 'past') list.reverse();
  const days = [...new Set(list.map(c => c.date))];
  const nextOn = s.classes.find(c => !c.off && G.classTime(s, c).end > now);
  const P = s.periods;
  return `<div class="qwrap">
    <div class="sched-head"><div><b>📅 Lịch học & làm của ${esc(userOf(s).name)}</b>
      <div class="muted">${s.classes.filter(c => !c.off && c.kind !== 'work').length} buổi học · ${s.classes.filter(c => !c.off && c.kind === 'work').length} lịch làm · ${s.classes.filter(c => c.off).length} tạm ngưng · nhắc trước 60 phút, tự tạo nhiệm vụ 🏫/💼 trong ngày (không bị phạt)</div></div>
      ${nextOn ? `<div class="sched-next">Tiếp theo: <b>${G.schedIcon(nextOn)} ${esc(nextOn.subject)}</b><br>${WEEKDAYS[new Date(nextOn.date + 'T12:00').getDay()]} ${nextOn.date.slice(8)}/${nextOn.date.slice(5, 7)} · ${hm(G.classTime(s, nextOn).start)}</div>` : ''}</div>
    <div class="seg">${C_VIEWS.map(([k, n]) => `<button data-do="cview" data-v="${k}" class="${k === view ? 'on' : ''}">${n}</button>`).join('')}</div>
    ${view === 'week' ? weekView(s, now) : view === 'month' ? monthView(s, now) : days.length ? days.map(d => `<div class="cday ${d === today ? 'today' : ''}"><span class="cdate">${WEEKDAYS[new Date(d + 'T12:00').getDay()]}, ${d.slice(8)}/${d.slice(5, 7)}${d === today ? ' · Hôm nay' : ''}</span>
      ${list.filter(c => c.date === d).map(c => classCard(s, c, now)).join('')}</div>`).join('')
      : `<div class="qempty"><b>📅</b>${view === 'past' ? 'Chưa có buổi học nào đã qua' : 'Không có lịch sắp tới'}<div class="muted">Thêm bên dưới, hoặc gửi ảnh lịch học / lịch làm cho Claude cập nhật</div></div>`}
    <details class="routines" data-open="addClass"><summary>＋ Thêm buổi học / lịch làm</summary>
      <form id="classForm" class="rform">
        <input type="date" name="date" required>
        <input name="subject" data-keep="c-subject" placeholder="Tên môn" maxlength="120" required style="flex:1 1 200px">
        <label>Tiết <input type="number" name="from" min="1" max="16" value="1" style="width:60px"> – <input type="number" name="to" min="1" max="16" value="3" style="width:60px"></label>
        <label>hoặc giờ <input type="time" name="t1"> – <input type="time" name="t2"></label>
        <label><input type="checkbox" name="work"> 💼 Lịch làm</label>
        <input name="room" data-keep="c-room" placeholder="Phòng / Zoom" maxlength="120">
        <input name="teacher" data-keep="c-teacher" placeholder="Giảng viên" maxlength="80">
        <label><input type="checkbox" name="online"> 💻 Trực tuyến</label>
        <button class="primary">＋ Thêm</button>
      </form></details>
    <details class="routines" data-open="periods"><summary>⏰ Giờ các tiết <span class="muted">— tiết ${P.len} phút, tiết 1 bắt đầu ${P.start[0]}</span></summary>
      <form id="periodForm"><div class="periods">${P.start.map((t, i) => `<label>Tiết ${i + 1}<input type="time" name="p" value="${t}"></label>`).join('')}</div>
        <div class="rform"><label>Mỗi tiết <input type="number" name="len" min="30" max="90" value="${P.len}" style="width:70px"> phút</label>
          <span class="muted">Mặc định theo HUIT (ca 6h30 · 9h30 · 12h30 · 15h30 · 18h30) — chỉnh nếu trường khác giờ.</span>
          <button class="primary">Lưu giờ tiết</button></div></form></details>
  </div>`;
};
DO.cview = b => { ui.cview = b.dataset.v; paint(); };
document.addEventListener('submit', e => {
  const f = e.target;
  if (f.id === 'classForm') {
    e.preventDefault();
    const d = new FormData(f);
    api.act('addClass', { date: d.get('date'), subject: d.get('subject'), from: +d.get('from'), to: +d.get('to'), at: d.get('t1') && d.get('t2') ? [d.get('t1'), d.get('t2')] : null,
      kind: d.get('work') === 'on' ? 'work' : '', room: d.get('room'), teacher: d.get('teacher'), online: d.get('online') === 'on' });
    view.querySelector('[data-keep="c-subject"]').value = '';
  }
  if (f.id === 'periodForm') {
    e.preventDefault();
    const d = new FormData(f);
    api.act('setPeriods', { start: d.getAll('p'), len: +d.get('len') });
  }
});
