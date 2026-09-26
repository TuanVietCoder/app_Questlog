const q = document.getElementById('q'), preview = document.getElementById('preview');
const CAT_TAGS = { tt: 'int', int: 'int', tc: 'str', str: 'str', st: 'cre', cre: 'cre', tn: 'spi', spi: 'spi' };

// "Viết báo cáo #tt !3 @17:30" → { title, cat, diff, when, due }
function parse(text) {
  const p = { cat: 'int', diff: 2, when: 'inbox', due: null };
  p.title = text.replace(/(^|\s)([#!@])(\S+)/g, (m, sp, sign, v) => {
    v = v.toLowerCase();
    if (sign === '#' && CAT_TAGS[v]) { p.cat = CAT_TAGS[v]; return ''; }
    if (sign === '!' && /^[123]$/.test(v)) { p.diff = +v; return ''; }
    if (sign === '@' && ['nay', 'today'].includes(v)) { p.when = 'today'; return ''; }
    if (sign === '@' && ['tuan', 'week'].includes(v)) { p.when = 'week'; return ''; }
    if (sign === '@' && ['tuansau', 'next'].includes(v)) { p.when = 'next'; return ''; }
    const hm = sign === '@' && v.match(/^(\d{1,2})[:h](\d{2})?$/);
    if (hm && +hm[1] < 24) {
      const d = new Date(); d.setHours(+hm[1], +(hm[2] || 0), 0, 0);
      if (+d < Date.now()) d.setDate(d.getDate() + 1);
      p.due = +d; p.when = 'today'; return '';
    }
    return m;
  }).replace(/\s+/g, ' ').trim();
  return p;
}

const WHEN = { inbox: 'Danh sách chờ', today: 'Hôm nay', week: 'Tuần này', next: 'Tuần sau' };
q.oninput = () => {
  const p = parse(q.value);
  preview.textContent = p.title ? `→ ${WHEN[p.when]} · ${G.CATS[p.cat].icon} ${G.CATS[p.cat].name} · ${G.DIFF[p.diff].name} (+${G.DIFF[p.diff].exp} EXP)${p.due ? ` · hạn ${new Date(p.due).toLocaleString('vi-VN', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit' })}` : ''}` : '';
};
q.onkeydown = async e => {
  if (e.key === 'Escape') return api.ui('quick-hide');
  if (e.key !== 'Enter') return;
  const p = parse(q.value);
  if (!p.title) return;
  await api.act('addTask', p);
  q.value = ''; preview.textContent = '';
  api.ui('quick-hide');
};
api.on('quick-open', () => { q.focus(); q.select(); });
