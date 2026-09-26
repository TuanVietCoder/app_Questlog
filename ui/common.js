// Hàm dùng chung cho widget và bảng điều khiển (nạp trước mọi script giao diện khác).
const $ = id => document.getElementById(id);
const two = n => String(n).padStart(2, '0');
const mmss = ms => { const t = Math.max(0, Math.ceil(ms / 1000)); return `${two(Math.floor(t / 60))}:${two(t % 60)}`; };
const esc = v => String(v).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const pct = (cur, max) => Math.max(0, Math.min(100, cur / max * 100));
const MOBS = ['👾', '🦇', '🕷️', '🐺', '👻', '🦂', '🐗', '🧌', '🐊']; // quái trong trận idle khi tập trung
const WEEKDAYS = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];
const daysTxt = days => days.length === 7 ? 'Mỗi ngày' : days.join() === '1,2,3,4,5' ? 'T2–T6' : days.map(d => WEEKDAYS[d]).join(', ');
// Hồ sơ người đang dùng máy (state gửi từ main có thêm profiles/active).
const userOf = s => ((s && s.profiles) || []).find(p => p.id === s.active) || { name: s ? s.hero.name : '', sweet: false };
const KILL_SEC = 20; // hoạt ảnh: 20 giây tập trung hạ 1 quái (thưởng thật tính khi xong phiên)

function setBar(el, cur, max, label) {
  el.querySelector('i').style.width = `${pct(cur, max)}%`;
  const sp = el.querySelector('span');
  if (sp && label !== undefined) sp.textContent = label;
}
// Chạy lại animation CSS của một class (bỏ class → ép reflow → gắn lại).
function replay(el, cls) { el.classList.remove(cls); void el.offsetWidth; el.classList.add(cls); }

// Ô "Hỏi Pet" (widget + dashboard): nối #chatIn/#chatGo/#chatOut, nút #bChat để bật/tắt nếu cửa sổ có.
// Trả về hàm hiện câu trả lời — gọi lại khi nhận event "say".
function wireChat() {
  const show = msg => { $("chatOut").hidden = false; $("chatOut").textContent = msg; if ($("chatRow")) $("chatRow").hidden = false; };
  const send = () => {
    const v = $("chatIn").value.trim();
    if (!v) return;
    $("chatIn").value = "";
    show("…");
    api.chat(v);
  };
  $("chatGo").onclick = send;
  $("chatIn").onkeydown = e => {
    if (e.key === "Enter") send();
    if (e.key === "Escape" && $("chatRow")) $("chatRow").hidden = true;
  };
  if ($("bChat")) $("bChat").onclick = () => {
    $("chatRow").hidden = !$("chatRow").hidden;
    if (!$("chatRow").hidden) $("chatIn").focus();
  };
  return show;
}
