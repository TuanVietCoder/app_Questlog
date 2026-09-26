// Kiểm tra giao diện tự động: chạy app thật với dữ liệu mẫu riêng (QL_DATA → không đụng save thật / registry),
// chụp widget + từng tab + bảng Pet × biểu cảm vào tools/shot/out/, ghi lỗi console vào out/report.txt.
// Chạy từ thư mục gốc dự án:  node_modules\electron\dist\electron.exe tools\shot
const fs = require('fs'), path = require('path');
const APP = path.resolve(__dirname, '../..');
const OUT = path.join(__dirname, 'out'), DATA = path.join(OUT, 'data');
fs.rmSync(OUT, { recursive: true, force: true });
fs.mkdirSync(DATA, { recursive: true });
process.env.QL_DATA = DATA;

// Dữ liệu mẫu đủ phong phú để mọi khu vực có nội dung.
const G = require(APP + '/game.js');
const now = Date.now(), s = G.newState(now);
const add = (title, cat, diff, when, due) => { G.act(s, 'addTask', { title, cat, diff, when, due }, now - 3 * G.HOUR); return s.tasks.at(-1); };
add('Ôn chương 3 Giải tích', 'int', 3, 'today', now + 2 * G.HOUR);
add('Nộp báo cáo', 'int', 3, 'today', now - 40 * G.MIN);
const done = add('Code tính năng đăng nhập', 'int', 2, 'week');
add('Chạy bộ 3km', 'str', 2, 'week'); add('Học 20 từ vựng', 'int', 1, 'next'); add('Ý tưởng: app nhắc uống nước', 'cre', 1, 'inbox');
G.act(s, 'completeTask', { id: done.id }, now - G.HOUR);
G.tick(s, now);
Object.assign(s.hero, { gold: 1350, streak: 4, best: 9 });
s.skills = { int: 34, str: 12, cre: 8, spi: 6 };
s.owned.push('pet_cat', 'acc_bow', 'skin_sakura', 'wpn_staff');
Object.assign(s, { petKind: 'pet_cat', accs: { head: 'acc_bow', face: null, neck: 'acc_bell' }, skin: 'skin_sakura', weapon: 'wpn_staff', nextHidden: now + 9 * G.HOUR });
s.pet.love = 64; s.login.last = s.day;
s.pets = { pet_slime: { lv: 16, xp: 30, el: 'water' }, pet_cat: { lv: 7, xp: 40, el: null } }; // mèo sẵn sàng chọn hệ
G.act(s, 'autoStatus', { id: 'work', app: 'Microsoft Word' }, now);
G.act(s, 'addRoutine', { title: 'Tập gym', cat: 'str', days: [1, 3, 5], from: '19:00', to: '20:30' }, now);
add('Thi giữa kỳ CNPM', 'int', 3, 'week', G.startOfDay(now) + 2 * G.DAY + 7.5 * G.HOUR); // như app tự nhận khi mở Word
const dk = off => G.dayKey(now + off * G.DAY);
G.act(s, 'addClass', { date: dk(0), subject: 'Giải thuật nâng cao', from: 13, to: 16, room: 'B305 - 140 Lê Trọng Tấn', teacher: 'Nguyễn Hồng Vũ' }, now);
G.act(s, 'addClass', { date: dk(1), subject: 'Triết học', from: 13, to: 16, room: 'Zoom034', teacher: 'Mai Phú Hợp', online: true }, now);
G.act(s, 'addClass', { date: dk(1), subject: 'Ca 1', at: ['06:30', '14:30'], kind: 'work' }, now);
G.act(s, 'addClass', { date: dk(1), subject: 'Trợ giảng ở công ty', at: ['14:30', '17:00'], kind: 'work' }, now);
G.act(s, 'addClass', { date: dk(2), subject: 'Phương pháp nghiên cứu khoa học', from: 8, to: 12, room: 'B308 - 140 Lê Trọng Tấn', teacher: 'Trần Khải Thiện' }, now);
G.act(s, 'toggleClass', { id: s.classes.find(c => c.subject === 'Phương pháp nghiên cứu khoa học').id }, now);
G.act(s, 'addClass', { date: dk(-2), subject: 'Công nghệ phần mềm tiên tiến', from: 2, to: 6, room: 'D303 - 140 Lê Trọng Tấn', teacher: 'Nguyễn Thị Bích Ngân' }, now);
// Hồ sơ thứ 2 (nịnh, có lịch, nhiệm vụ lặp lại giữ máy, nhắc uống nước)
const db = G.hydrateDB(JSON.parse(JSON.stringify(s)), now);
db.profiles[0].name = 'Việt';
db.profiles.push({ id: 'uyen', name: 'Uyên', sweet: true, schedule: [{ days: [0], from: '00:00', to: '00:01' }] }); // lịch không bao giờ trúng: ảnh chụp không phụ thuộc giờ chạy (đổi người bằng switchTo)
const u = db.states.uyen = G.newState(now);
u.hero.name = 'Uyên'; u.owned.push('skin_sakura', 'acc_bow'); u.skin = 'skin_sakura'; u.accs = { head: 'acc_bow', face: null, neck: null }; u.login.last = u.day;
G.act(u, 'addRoutine', { title: 'Đưa laptop cho Tuấn Việt', days: [0, 1, 2, 3, 4, 5, 6], from: '23:58', to: '23:59', keep: true }, now);
G.act(u, 'setSettings', { waterEvery: 45, zhPerDay: 7, enDaily: true, itRemind: true, weatherTips: true }, now);
G.tick(u, now);
db.weather = G.parseWeather(require('./weather-sample.json'), 'TP. Hồ Chí Minh', now); // app sẽ tải bản thật đè lên nếu có mạng
u.water.ask = now + 10 * G.MIN; u.water.day = u.day;
fs.writeFileSync(path.join(DATA, 'save.json'), JSON.stringify(db));

const { app, BrowserWindow, Menu } = require('electron');
app.commandLine.appendSwitch('disable-features', 'CalculateNativeWinOcclusion'); // cửa sổ bị che (VD: app thật đang mở) vẫn vẽ để chụp được
let trayTemplate = null; // bắt template menu khay để bấm thử
const buildMenu = Menu.buildFromTemplate.bind(Menu);
Menu.buildFromTemplate = t => { if (t.some(i => i.label === 'Thoát')) trayTemplate = t; return buildMenu(t); };
const report = [];
app.on('web-contents-created', (_, wc) => {
  wc.on('console-message', e => { if (e.level === 'error' || (e.level === 'warning' && !/Security Warning/.test(e.message))) report.push(`[${e.level}] ${e.message} @${e.sourceId}:${e.lineNumber}`); });
  wc.on('render-process-gone', (e, d) => report.push('RENDERER GONE ' + d.reason));
});
process.on('uncaughtException', er => report.push('MAIN ' + er.stack));
const finish = code => { fs.writeFileSync(path.join(OUT, 'report.txt'), report.filter(x => !x.startsWith('info:')).length ? report.join('\n') : ['OK: không có lỗi console', ...report].join('\n')); app.exit(code); };
setTimeout(() => { report.unshift('TIMEOUT'); finish(1); }, 90000);
require(APP + '/main.js');

const sleep = ms => new Promise(r => setTimeout(r, ms));
const shot = async (w, name) => fs.writeFileSync(path.join(OUT, name + '.png'), (await w.webContents.capturePage()).toPNG());

app.whenReady().then(async () => {
  await sleep(3500);
  const wins = BrowserWindow.getAllWindows(), find = f => wins.find(w => w.webContents.getURL().includes(f));
  const dash = find('app.html'), widget = find('widget.html');
  try {
    await shot(widget, 'widget');
    for (const tab of ['quests', 'schedule', 'daily', 'focus', 'pet', 'skills', 'boss', 'shop', 'stats', 'settings']) {
      dash.webContents.send('tab', tab); await sleep(700); await shot(dash, 'tab-' + tab);
    }
    // Tab Nhiệm vụ: danh sách "Tuần này" + menu ⋯ + tùy chọn ⚙ đang mở
    const djs = code => dash.webContents.executeJavaScript(code);
    await djs("document.getElementById('stIcon').click()"); await sleep(300); await shot(dash, 'status-box');
    await djs("document.querySelector('#stPop [data-id=study]').click()"); await sleep(600);
    report.push(`info: ô trạng thái sau khi chọn = ${await djs("document.getElementById('stIcon').textContent + ' · mở=' + document.getElementById('stBox').open")}`);
    dash.webContents.send('tab', 'schedule'); await sleep(500);
    await djs(`ui.cview = 'week'; paint()`); dash.webContents.invalidate(); await sleep(1200); await shot(dash, 'schedule-week');
    report.push(`info: TKB tuần = ${await djs(`[...document.querySelectorAll('.wk-col:not(.wk-hours) .wk-head')].map(h => h.innerText.replace(/\\n/g, ' ')).join(' | ') + ' · khối: ' + document.querySelectorAll('.wk-it').length`)}`);
    await djs(`ui.cview = 'month'; paint()`); dash.webContents.invalidate(); await sleep(1200); await shot(dash, 'schedule-month');
    await djs(`document.querySelector('.mo-cell.today').click()`); await sleep(300);
    report.push(`info: bấm ô hôm nay trong tháng → view = ${await djs('ui.cview')}`);
    await djs(`ui.cview = 'next'; ui.calAt = 0; paint()`);
    dash.webContents.send('tab', 'quests'); await sleep(500);
    await djs(`ui.qview = 'week'; paint(); document.querySelector('.qmore > summary').click()`); await sleep(300); await shot(dash, 'quests-week-menu');
    await djs(`ui.qview = 'today'; paint(); document.querySelector('.qopts > summary').click()`); await sleep(300); await shot(dash, 'quests-add-options');
    await djs(`ui.qview = 'today'; paint(); document.getElementById('addTitle').value = 'nay thầy tôi giao bài tập code môn nguyên cứu khoa học'; updateHint();
      document.querySelector('.qopts').open = false; document.querySelector('details[data-open=smart]').open = true; document.getElementById('smartText').value = 'nộp báo cáo triết học trước thứ 6\\n- chạy bộ 3km cuối tuần\\n- thi giữa kỳ CNPM ngày 25/9 lúc 7h30'; DO.smartParse();`);
    await sleep(400); await shot(dash, 'quests-smart');
    const n0 = (await djs('api.get()')).tasks.length;
    await djs("DO.smartAccept(); document.getElementById('addForm').requestSubmit()"); await sleep(800);
    const got = (await djs('api.get()')).tasks.slice(-4).map(t => `${t.title} [${t.due ? new Date(t.due).toLocaleString('vi-VN') : t.when || t.week}]`);
    report.push(`info: nhận từ đoạn văn + ô thêm: ${(await djs('api.get()')).tasks.length - n0} nhiệm vụ → ${got.join(' | ')}`);
    report.push(`info: gợi ý ô thêm = ${await djs(`document.getElementById('smartHint').textContent`)}`);
    report.push(`info: nhóm thanh bên đang mở = ${await djs(`[...document.querySelectorAll('#tabs details')].map(d => (d.open ? '▾' : '▸') + d.querySelector('summary').textContent.trim()).join(' | ')`)}`);
    // Đổi sang hồ sơ Uyên: widget + tab Nhiệm vụ + Cài đặt
    const invoke = (ch, ...a) => Promise.resolve(require('electron').ipcMain._invokeHandlers.get(ch)({ sender: null }, ...a));
    await invoke('profile', 'switchTo', { id: 'uyen' });
    await sleep(1500); await shot(widget, 'uyen-widget');
    report.push(`info: widget height after resize = ${widget.getBounds().height}`);
    for (const tab of ['quests', 'daily', 'settings']) { dash.webContents.send('tab', tab); await sleep(700); await shot(dash, 'uyen-' + tab); }
    // Widget: bấm 👤 → chọn Việt; khay: chọn lại Uyên
    await widget.webContents.executeJavaScript(`document.getElementById('bUser').click()`);
    await sleep(300); await shot(widget, 'widget-user-row');
    await widget.webContents.executeJavaScript(`document.querySelector('#userRow [data-uid="main"]').click(); JSON.stringify({ active: S.active, btn: !!document.querySelector('#userRow [data-uid="main"]'), api: typeof api.profile })`).then(x => report.push('info: widget click ' + x));
    await sleep(300); report.push('info: main active sau click = ' + (await invoke('get')).active);
    await sleep(800);
    const who = () => widget.webContents.executeJavaScript(`document.getElementById('ttl').textContent`);
    report.push(`info: sau khi bấm trên widget → ${await who()}`);
    const sub = trayTemplate.find(i => i.submenu).submenu;
    report.push(`info: menu khay "${trayTemplate.find(i => i.submenu).label}" → ${sub.map(i => (i.checked ? '●' : '○') + i.label).join(' ')}`);
    sub.find(i => i.label === 'Uyên').click();
    await sleep(800);
    report.push(`info: sau khi bấm Uyên trong khay → ${await who()} · menu: ${trayTemplate.find(i => i.submenu).label}`);
    // Uyên: Pet hỏi đáp có nút bấm (widget + thẻ nhân vật), bấm trả lời
    await invoke('profile', 'switchTo', { id: 'uyen' }); await sleep(1200);
    await widget.webContents.executeJavaScript('pet.ask()'); await dash.webContents.executeJavaScript('heroPet.ask()');
    await sleep(500); await shot(widget, 'uyen-widget-ask'); await shot(dash, 'uyen-dash-ask');
    await widget.webContents.executeJavaScript(`document.querySelector('#scene .ask-row button').click()`);
    await sleep(500); await shot(widget, 'uyen-widget-answer');
    report.push(`info: sau khi trả lời, Pet nói: ${await widget.webContents.executeJavaScript(`document.querySelector('#scene > .pet-bubble').textContent`)}`);
    await invoke('profile', 'switchTo', { id: 'main' });
    await sleep(600);
    // Hỏi Pet: bấm 💬 trên widget → cửa sổ chat nổi cạnh widget (chưa có khóa API → câu trả lời ngoại tuyến từ G.answer)
    await widget.webContents.executeJavaScript(`document.getElementById('bChat').click()`);
    await sleep(900);
    const chat = BrowserWindow.getAllWindows().find(w => w.webContents.getURL().includes('chat.html'));
    if (!chat) throw new Error('khong mo duoc cua so chat');
    const cb = chat.getBounds(), wb = widget.getBounds();
    report.push(`info: cửa sổ chat ${chat.isVisible() ? 'hiện' : 'ẩn'} · ${cb.width}×${cb.height} tại ${cb.x},${cb.y} · widget tại ${wb.x},${wb.y} · cạnh ${cb.x < wb.x ? 'trái' : 'phải'} widget`);
    await chat.webContents.executeJavaScript(`document.getElementById('q').value = 'Hôm nay còn nhiệm vụ gì?'; document.getElementById('go').click()`);
    await sleep(1200); await shot(chat, 'chat-window');
    report.push(`info: Hỏi Pet ngoại tuyến → ${await chat.webContents.executeJavaScript(`[...document.querySelectorAll('#log .m')].map(x => x.textContent).join(' || ')`)}`);
    // Xuyên chuột: rê lên 👻 → bắt chuột tạm → bấm tắt được
    const ign = [], setIgn = widget.setIgnoreMouseEvents.bind(widget);
    widget.setIgnoreMouseEvents = (v, o) => { ign.push(v); return setIgn(v, o); };
    await invoke('act', 'setSettings', { clickThrough: true }); await sleep(400);
    await widget.webContents.executeJavaScript(`document.getElementById('bGhost').dispatchEvent(new MouseEvent('mouseenter'))`); await sleep(300);
    await widget.webContents.executeJavaScript(`document.getElementById('bGhost').click()`); await sleep(600);
    report.push(`info: xuyên chuột setIgnoreMouseEvents = [${ign.join(', ')}] · sau khi bấm 👻 clickThrough = ${(await invoke('get')).settings.clickThrough}`);
    const gal = new BrowserWindow({ width: 2400, height: 800, show: false });
    await gal.loadFile(path.join(__dirname, 'gallery.html'));
    await sleep(1200); await shot(gal, 'pet-gallery');
    gal.setSize(1300, 1600); await gal.loadFile(path.join(__dirname, 'gallery.html'), { search: 'evo' });
    await sleep(1200); await shot(gal, 'pet-evolution');
  } catch (e) { report.push('SHOT ' + e.stack); }
  finish(0);
});
