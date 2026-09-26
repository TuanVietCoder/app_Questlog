// Cửa sổ chat nổi cạnh widget (main.js đặt vị trí, bám theo widget khi kéo).
// Không chứa luật chơi: gửi câu hỏi qua api.chat, nhận câu trả lời qua event "say".
// Lịch sử do main giữ trong RAM (mỗi hồ sơ vài lượt), mở cửa sổ thì main gửi lại qua kênh "chatlog".
const EMPTY = 'Hỏi mình bất cứ điều gì nha 💬\nNhiệm vụ, lịch học, từ vựng… hay mẹo Word, sức khỏe, đời sống.';
let waiting = null;

function bubble(cls, text) {
  const el = document.createElement('div');
  el.className = 'm ' + cls;
  el.textContent = text;
  return el;
}
function paint(list) {
  const log = $('log');
  log.innerHTML = '';
  if (!list.length) {
    const e = document.createElement('div');
    e.className = 'empty';
    e.textContent = EMPTY;
    log.appendChild(e);
    return;
  }
  for (const m of list) log.appendChild(bubble(m.role === 'user' ? 'me' : 'pet', m.content));
  scroll();
}
function add(cls, text, wait) {
  const log = $('log');
  const empty = log.querySelector('.empty');
  if (empty) empty.remove();
  const el = bubble(cls + (wait ? ' wait' : ''), text);
  log.appendChild(el);
  scroll();
  return el;
}
const scroll = () => { $('log').scrollTop = $('log').scrollHeight; };

function send() {
  const v = $('q').value.trim();
  if (!v || waiting) return;
  $('q').value = '';
  add('me', v);
  waiting = add('pet', 'Pet đang nghĩ…', true);
  api.chat(v);
}

$('go').onclick = send;
$('q').onkeydown = e => {
  if (e.key === 'Enter') send();
  if (e.key === 'Escape') api.ui('chat-hide');
};
$('close').onclick = () => api.ui('chat-hide');
$('clear').onclick = () => {
  if (!$('clear').classList.contains('sure')) {
    $('clear').classList.add('sure');
    $('clear').textContent = '?';
    setTimeout(() => { $('clear').classList.remove('sure'); $('clear').textContent = '🧠'; }, 3000);
    return;
  }
  $('clear').classList.remove('sure');
  $('clear').textContent = '🧠';
  api.act('clearChatNotes');
};

api.on('state', s => { $('who').textContent = `${G.petName(s)} · ${userOf(s).name}`; });
api.on('chatlog', list => paint(list || []));
api.on('event', e => {
  if (e.kind !== 'say') return;
  if (waiting) { waiting.remove(); waiting = null; }
  add('pet', e.msg);
});
api.on('chat-focus', () => $('q').focus());
api.get().then(s => { $('who').textContent = `${G.petName(s)} · ${userOf(s).name}`; paint([]); });
