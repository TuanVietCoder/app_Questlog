// Vẽ Pet bằng SVG: loài + skin (màu) + phụ kiện + mũ theo nhánh kỹ năng + vũ khí.
// Biểu cảm đổi bằng thuộc tính data-mood (CSS ẩn/hiện mắt, miệng, lông mày, hiệu ứng); mắt liếc bằng biến CSS --lx/--ly.
(function () {
const INK = '#1e1b2e', LINE = 'stroke="rgba(0,0,0,.35)" stroke-width="2.5"';

// ty: đỉnh đầu (để đặt mũ/phụ kiện). back: vẽ sau thân. front: vẽ đè lên thân (trước mặt).
const SPECIES = {
  pet_slime: { ty: 40,
    body: `<path class="sk" d="M18 104 Q10 64 36 44 Q60 26 84 44 Q110 64 102 104 Q60 112 18 104 Z" fill="var(--skin)" ${LINE}/>
      <path d="M26 98 Q22 70 40 54" stroke="rgba(255,255,255,.35)" stroke-width="5" fill="none" stroke-linecap="round"/>
      <ellipse cx="44" cy="58" rx="7" ry="4" fill="#fff" opacity=".7"/>` },
  pet_cat: { ty: 46,
    back: `<path class="tail" d="M94 100 Q118 92 110 68 Q106 58 112 50" stroke="rgba(0,0,0,.35)" stroke-width="11" fill="none" stroke-linecap="round"/>
      <path class="tail sk" d="M94 100 Q118 92 110 68 Q106 58 112 50" stroke="var(--skin)" stroke-width="7" fill="none" stroke-linecap="round"/>`,
    body: `<path class="sk ear-l" d="M28 64 L32 24 L56 48 Z" fill="var(--skin)" ${LINE} stroke-linejoin="round"/>
      <path class="sk ear-r" d="M92 64 L88 24 L64 48 Z" fill="var(--skin)" ${LINE} stroke-linejoin="round"/>
      <path d="M34 54 L35 34 L48 47 Z M86 54 L85 34 L72 47 Z" fill="#f9a8d4" opacity=".8"/>
      <path class="sk" d="M20 104 Q14 70 34 52 Q60 38 86 52 Q106 70 100 104 Q60 112 20 104 Z" fill="var(--skin)" ${LINE}/>
      <ellipse cx="42" cy="60" rx="7" ry="4" fill="#fff" opacity=".45"/>`,
    front: `<path d="M36 86 L18 82 M36 90 L18 92 M84 86 L102 82 M84 90 L102 92" stroke="${INK}" stroke-width="1.5" opacity=".55" stroke-linecap="round"/>` },
  pet_bunny: { ty: 54,
    back: `<circle cx="100" cy="98" r="9" fill="#fff" ${LINE}/>`,
    body: `<g class="ear-l"><ellipse class="sk" cx="44" cy="30" rx="9" ry="27" transform="rotate(-12 44 30)" fill="var(--skin)" ${LINE}/>
        <ellipse cx="44" cy="32" rx="4" ry="18" transform="rotate(-12 44 32)" fill="#f9a8d4" opacity=".8"/></g>
      <g class="ear-r"><ellipse class="sk" cx="76" cy="30" rx="9" ry="27" transform="rotate(12 76 30)" fill="var(--skin)" ${LINE}/>
        <ellipse cx="76" cy="32" rx="4" ry="18" transform="rotate(12 76 32)" fill="#f9a8d4" opacity=".8"/></g>
      <path class="sk" d="M20 104 Q12 72 36 58 Q60 46 84 58 Q108 72 100 104 Q60 112 20 104 Z" fill="var(--skin)" ${LINE}/>
      <ellipse cx="40" cy="66" rx="7" ry="4" fill="#fff" opacity=".45"/>`,
    front: `<path d="M57 86 Q60 89 63 86" stroke="#f472b6" stroke-width="3" fill="none" stroke-linecap="round"/>` },
  pet_owl: { ty: 40, noMouth: true,
    body: `<path class="sk" d="M36 50 L28 24 L52 40 Z M84 50 L92 24 L68 40 Z" fill="var(--skin)" ${LINE} stroke-linejoin="round"/>
      <path class="sk" d="M24 106 Q16 60 40 42 Q60 30 80 42 Q104 60 96 106 Q60 114 24 106 Z" fill="var(--skin)" ${LINE}/>
      <path class="wing" d="M26 66 Q8 86 28 104" fill="rgba(0,0,0,.18)"/><path class="wing wing-r" d="M94 66 Q112 86 92 104" fill="rgba(0,0,0,.18)"/>
      <ellipse cx="60" cy="98" rx="20" ry="11" fill="#fff" opacity=".35"/>
      <path d="M52 94 l3 3 l3 -3 M62 94 l3 3 l3 -3 M57 100 l3 3 l3 -3" stroke="rgba(0,0,0,.3)" stroke-width="1.5" fill="none"/>
      <circle cx="47" cy="76" r="13" fill="#fff" stroke="rgba(0,0,0,.25)" stroke-width="3"/><circle cx="73" cy="76" r="13" fill="#fff" stroke="rgba(0,0,0,.25)" stroke-width="3"/>`,
    front: `<path d="M55 86 L65 86 L60 95 Z" fill="#f59e0b" stroke="#92400e" stroke-width="1.5" stroke-linejoin="round"/>` },
  pet_ghost: { ty: 36, float: true,
    body: `<path class="sk" d="M26 108 L26 64 Q26 32 60 32 Q94 32 94 64 L94 108 Q88 100 81 108 Q74 100 67 108 Q60 100 53 108 Q46 100 39 108 Q32 100 26 108 Z"
        fill="var(--skin)" fill-opacity=".88" ${LINE} stroke-linejoin="round"/>
      <path class="arm" d="M27 76 Q14 80 16 92" stroke="rgba(0,0,0,.3)" stroke-width="5" fill="none" stroke-linecap="round"/>
      <path class="arm arm-r" d="M93 76 Q106 80 104 92" stroke="rgba(0,0,0,.3)" stroke-width="5" fill="none" stroke-linecap="round"/>
      <ellipse cx="42" cy="48" rx="8" ry="4" fill="#fff" opacity=".6"/>` },
  pet_dragon: { ty: 44,
    back: `<g class="wings"><path class="sk wing" d="M32 70 L4 46 L12 70 L0 78 L28 86 Z" fill="var(--skin)" ${LINE} stroke-linejoin="round" opacity=".85"/>
        <path class="sk wing wing-r" d="M88 70 L116 46 L108 70 L120 78 L92 86 Z" fill="var(--skin)" ${LINE} stroke-linejoin="round" opacity=".85"/></g>
      <path class="sk tail" d="M92 100 Q116 104 114 86 L122 82 L110 76 L108 86 Q106 96 90 94 Z" fill="var(--skin)" ${LINE} stroke-linejoin="round"/>`,
    body: `<path d="M40 50 L32 26 L50 42 Z M80 50 L88 26 L70 42 Z" fill="#fde68a" stroke="#92400e" stroke-width="2" stroke-linejoin="round"/>
      <path class="sk" d="M18 104 Q12 66 36 48 Q60 34 84 48 Q108 66 102 104 Q60 112 18 104 Z" fill="var(--skin)" ${LINE}/>
      <ellipse cx="60" cy="99" rx="22" ry="10" fill="#fef3c7" opacity=".65"/>
      <path d="M44 99 H76 M48 104 H72" stroke="rgba(146,64,14,.3)" stroke-width="1.5"/>
      <ellipse cx="42" cy="58" rx="7" ry="4" fill="#fff" opacity=".5"/>`,
    front: `<circle cx="56" cy="85" r="1.3" fill="${INK}" opacity=".6"/><circle cx="64" cy="85" r="1.3" fill="${INK}" opacity=".6"/>` },
  pet_hamster: { ty: 42,
    back: `<ellipse class="sk" fill="var(--skin)" ${LINE} cx="20" cy="86" rx="10" ry="12"/><ellipse class="sk" fill="var(--skin)" ${LINE} cx="100" cy="86" rx="10" ry="12"/>`,
    body: `<g class="ear-l"><circle class="sk" fill="var(--skin)" ${LINE} cx="34" cy="48" r="10"/><circle cx="34" cy="48" r="5" fill="#f9a8d4" opacity=".85"/></g>
      <g class="ear-r"><circle class="sk" fill="var(--skin)" ${LINE} cx="86" cy="48" r="10"/><circle cx="86" cy="48" r="5" fill="#f9a8d4" opacity=".85"/></g>
      <path class="sk" fill="var(--skin)" ${LINE} d="M60 42 Q104 42 106 80 Q108 110 60 110 Q12 110 14 80 Q16 42 60 42 Z"/>
      <ellipse cx="60" cy="101" rx="24" ry="8" fill="#fff7ed" opacity=".75"/>
      <ellipse cx="42" cy="56" rx="7" ry="4" fill="#fff" opacity=".5"/>
      <path d="M60 43 Q57 36 50 35 Q57 32 60 38 Q63 32 70 35 Q63 36 60 43 Z" fill="#22c55e" stroke="#15803d" stroke-width="1.5" stroke-linejoin="round"/>`,
    front: `<ellipse cx="46" cy="107" rx="6" ry="4" fill="#fecaca" stroke="rgba(0,0,0,.3)" stroke-width="1.5"/><ellipse cx="74" cy="107" rx="6" ry="4" fill="#fecaca" stroke="rgba(0,0,0,.3)" stroke-width="1.5"/>` },
  pet_trashbot: { ty: 36,
    back: `<g class="tail"><path d="M84 40 Q88 28 92 20" stroke="#64748b" stroke-width="3" fill="none" stroke-linecap="round"/><circle cx="93" cy="18" r="5" fill="#f87171" stroke="#7f1d1d" stroke-width="2"/></g>`,
    body: `<rect class="sk" fill="var(--skin)" ${LINE} x="20" y="46" width="80" height="62" rx="16"/>
      <rect x="30" y="60" width="60" height="42" rx="12" fill="#fff" opacity=".28"/>
      <path d="M25 60 V96 M95 60 V96" stroke="rgba(0,0,0,.18)" stroke-width="3" stroke-linecap="round"/>
      <g class="ear-l"><rect x="14" y="34" width="92" height="16" rx="8" fill="#cbd5e1" ${LINE}/>
        <rect x="50" y="28" width="20" height="8" rx="4" fill="#94a3b8" stroke="rgba(0,0,0,.35)" stroke-width="2"/>
        <ellipse cx="36" cy="40" rx="9" ry="2.5" fill="#fff" opacity=".75"/></g>`,
    front: `<rect x="27" y="106" width="18" height="7" rx="3.5" fill="#475569"/><rect x="75" y="106" width="18" height="7" rx="3.5" fill="#475569"/>` },
  pet_frog: { ty: 44,
    back: `<ellipse class="sk" fill="var(--skin)" ${LINE} cx="22" cy="104" rx="13" ry="6"/><ellipse class="sk" fill="var(--skin)" ${LINE} cx="98" cy="104" rx="13" ry="6"/>`,
    body: `<circle class="sk" fill="var(--skin)" ${LINE} cx="38" cy="56" r="14"/><circle class="sk" fill="var(--skin)" ${LINE} cx="82" cy="56" r="14"/>
      <path class="sk" fill="var(--skin)" ${LINE} d="M12 104 Q8 72 36 62 Q60 54 84 62 Q112 72 108 104 Q60 114 12 104 Z"/>
      <ellipse cx="34" cy="50" rx="5" ry="3" fill="#fff" opacity=".6"/><ellipse cx="78" cy="50" rx="5" ry="3" fill="#fff" opacity=".6"/>
      <ellipse cx="60" cy="103" rx="30" ry="8" fill="#fefce8" opacity=".7"/>` },
  pet_turtle: { ty: 48,
    back: `<path class="sk" fill="var(--skin)" ${LINE} d="M14 96 Q12 40 60 34 Q108 40 106 96 Z"/>
      <path d="M60 38 V45 M34 47 l4 6 M86 47 l-4 6 M18 70 h8 M102 70 h-8" stroke="rgba(0,0,0,.3)" stroke-width="2.5" stroke-linecap="round"/>
      <path class="tail" d="M60 50 L69 40" stroke="#1e1b2e" stroke-width="3" stroke-linecap="round"/>
      <ellipse cx="22" cy="104" rx="10" ry="7" fill="#d9f99d" ${LINE}/><ellipse cx="98" cy="104" rx="10" ry="7" fill="#d9f99d" ${LINE}/>`,
    body: `<path d="M26 90 Q24 52 60 50 Q96 52 94 90 Q94 112 60 112 Q26 112 26 90 Z" fill="#dcfce7" ${LINE}/>
      <ellipse cx="42" cy="62" rx="7" ry="4" fill="#fff" opacity=".7"/>` },
  pet_panda: { ty: 46,
    back: `<g class="ear-l"><circle cx="30" cy="50" r="13" fill="#27272a" ${LINE}/></g><g class="ear-r"><circle cx="90" cy="50" r="13" fill="#27272a" ${LINE}/></g>
      <g class="tail"><path d="M92 104 L112 62" stroke="#b45309" stroke-width="4" stroke-linecap="round"/><path d="M112 62 Q120 50 111 43 Q105 52 109 61 Z" fill="#27272a"/></g>`,
    body: `<path class="sk" fill="var(--skin)" ${LINE} d="M16 104 Q10 62 40 50 Q60 44 80 50 Q110 62 104 104 Q60 114 16 104 Z"/>
      <ellipse cx="46" cy="77" rx="11" ry="13" transform="rotate(20 46 77)" fill="#27272a" opacity=".2"/>
      <ellipse cx="74" cy="77" rx="11" ry="13" transform="rotate(-20 74 77)" fill="#27272a" opacity=".2"/>
      <ellipse cx="40" cy="58" rx="7" ry="4" fill="#fff" opacity=".55"/>`,
    front: `<ellipse cx="32" cy="104" rx="9" ry="7" fill="#27272a" ${LINE}/><ellipse cx="88" cy="104" rx="9" ry="7" fill="#27272a" ${LINE}/>` },
  pet_octo: { ty: 36, float: true,
    back: `<g class="wing"><path class="sk" fill="var(--skin)" ${LINE} d="M22 84 Q14 104 22 112 Q30 108 30 96 Q34 108 42 112 Q48 104 44 90 Z" stroke-linejoin="round"/></g>
      <g class="wing wing-r"><path class="sk" fill="var(--skin)" ${LINE} d="M98 84 Q106 104 98 112 Q90 108 90 96 Q86 108 78 112 Q72 104 76 90 Z" stroke-linejoin="round"/></g>
      <path class="sk" fill="var(--skin)" ${LINE} d="M48 96 Q46 110 54 114 Q60 108 60 100 Q60 108 66 114 Q74 110 72 96 Z" stroke-linejoin="round"/>`,
    body: `<path class="sk" fill="var(--skin)" ${LINE} d="M16 86 Q12 36 60 34 Q108 36 104 86 Q104 102 60 102 Q16 102 16 86 Z"/>
      <ellipse cx="40" cy="48" rx="8" ry="4" fill="#fff" opacity=".6"/><circle cx="84" cy="48" r="4" fill="#fff" opacity=".25"/><circle cx="92" cy="58" r="2.5" fill="#fff" opacity=".25"/>`,
    front: `<g fill="#fbcfe8" opacity=".9"><circle cx="24" cy="104" r="2"/><circle cx="96" cy="104" r="2"/><circle cx="56" cy="108" r="1.8"/><circle cx="64" cy="108" r="1.8"/></g>` },
  pet_carp: { ty: 44, float: true,
    back: `<g class="tail"><path class="sk" fill="var(--skin)" ${LINE} d="M96 80 Q116 58 118 70 Q112 80 118 90 Q116 102 96 86 Z" stroke-linejoin="round"/></g>
      <path d="M44 48 Q60 30 78 46 Z" fill="#fff" opacity=".75" ${LINE} stroke-linejoin="round"/>
      <circle cx="18" cy="44" r="4" fill="none" stroke="#bae6fd" stroke-width="1.5"/><circle cx="10" cy="58" r="2.5" fill="none" stroke="#bae6fd" stroke-width="1.5"/>`,
    body: `<path class="sk" fill="var(--skin)" ${LINE} d="M12 82 Q12 46 60 44 Q104 46 104 82 Q104 110 60 110 Q12 110 12 82 Z"/>
      <path d="M40 58 q6 -6 12 0 M52 58 q6 -6 12 0 M64 58 q6 -6 12 0 M46 52 q6 -6 12 0 M58 52 q6 -6 12 0" stroke="rgba(255,255,255,.6)" stroke-width="2" fill="none" stroke-linecap="round"/>
      <ellipse cx="58" cy="103" rx="26" ry="6" fill="#fff7ed" opacity=".6"/>
      <g class="wing"><path d="M18 90 Q4 96 10 106 Q18 104 24 96 Z" fill="#fff" opacity=".8" ${LINE} stroke-linejoin="round"/></g>`,
    front: `<path d="M44 97 Q34 101 30 110 M76 97 Q86 101 90 110" stroke="${INK}" stroke-width="1.6" fill="none" opacity=".5" stroke-linecap="round"/>` },
};

// ---------- hình tiến hóa: lớp sau thân (back) + lớp trước (front) theo hệ & dạng ----------
const tear = (x, y, k, fill, stroke) => `<path d="M${x} ${y} Q${x - 10 * k} ${y - 8 * k} ${x} ${y - 26 * k} Q${x + 10 * k} ${y - 8 * k} ${x} ${y} Z" fill="${fill}" stroke="${stroke}" stroke-width="1.5" stroke-linejoin="round"/>`;
const flame = (x, y, k) => `<g class="evo-flame">${tear(x, y, k, '#fb923c', '#c2410c')}${tear(x, y - 2 * k, k * 0.55, '#fde047', 'none')}</g>`;
const leaf = (x, y, dir, k) => { const d = dir * k; return `<path d="M${x} ${y} Q${x + 12 * d} ${y - 20 * k} ${x + 30 * d} ${y - 10 * k} Q${x + 14 * d} ${y + 4 * k} ${x} ${y} Z" fill="#4ade80" stroke="#15803d" stroke-width="1.5"/><path d="M${x} ${y} Q${x + 14 * d} ${y - 8 * k} ${x + 26 * d} ${y - 9 * k}" stroke="#15803d" stroke-width="1" fill="none"/>`; };
const bloom = (x, y) => `<g><circle cx="${x - 3}" cy="${y}" r="3.2" fill="#f9a8d4"/><circle cx="${x + 3}" cy="${y}" r="3.2" fill="#f9a8d4"/><circle cx="${x}" cy="${y - 3}" r="3.2" fill="#f9a8d4"/><circle cx="${x}" cy="${y + 3}" r="3.2" fill="#f9a8d4"/><circle cx="${x}" cy="${y}" r="2" fill="#fde047"/></g>`;
const spark = (x, y, r, fill) => `<path class="evo-spark" d="M${x} ${y - r} Q${x} ${y} ${x + r} ${y} Q${x} ${y} ${x} ${y + r} Q${x} ${y} ${x - r} ${y} Q${x} ${y} ${x} ${y - r} Z" fill="${fill}"/>`;
const moon = (x, y, r) => `<path d="M${x} ${y - r} A${r} ${r} 0 0 0 ${x} ${y + r} A${r * 0.7} ${r} 0 0 1 ${x} ${y - r} Z" fill="#fde68a" stroke="#a16207" stroke-width="1.2"/>`;
const mirror = d => d.replace(/([ML]|Q|\s)(-?\d+(?:\.\d+)?) (-?\d+(?:\.\d+)?)/g, (m, c, x, y) => `${c}${120 - x} ${y}`); // lật trái ↔ phải quanh x = 60
function evoSVG(el, st, ty) {
  if (!el || !st) return { back: '', front: '' };
  const big = st >= 2, c = G.ELEMENTS[el].color;
  let back = '', front = '';
  if (el === 'fire') {
    back = flame(14, 98, big ? 1 : 0.8) + flame(106, 98, big ? 1 : 0.8) + (big ? flame(36, ty + 18, 1.05) + flame(60, ty + 8, 1.3) + flame(84, ty + 18, 1.05) : '');
    front = `<g fill="#fdba74"><circle cx="24" cy="60" r="1.8"/><circle cx="98" cy="54" r="1.5"/>${big ? '<circle cx="104" cy="74" r="1.8"/><circle cx="14" cy="76" r="1.4"/>' : ''}</g>`;
  }
  if (el === 'water') {
    const fin = `M22 78 Q${big ? -4 : 0} ${big ? 60 : 66} ${big ? 2 : 6} 98 Q14 90 22 98 Z`;
    back = `<g fill="#7dd3fc" stroke="#0369a1" stroke-width="1.5" opacity=".92"><path d="${fin}"/><path d="${mirror(fin)}"/>`
      + (big ? `<path d="M26 ${ty + 20} Q20 ${ty - 12} 44 ${ty - 6} Q40 ${ty - 22} 60 ${ty - 16} Q78 ${ty - 30} 88 ${ty - 8} Q104 ${ty - 6} 94 ${ty + 20} Z" fill="#38bdf8"/>` : '') + '</g>';
    front = `<g fill="none" stroke="#7dd3fc" stroke-width="1.5"><circle cx="100" cy="46" r="4"/><circle cx="108" cy="36" r="2.5"/>${big ? '<circle cx="14" cy="50" r="3.5"/><circle cx="20" cy="38" r="2"/>' : ''}</g>`;
  }
  if (el === 'leaf') {
    back = leaf(26, 92, -1, 1) + leaf(94, 92, 1, 1) + (big ? leaf(42, ty + 12, -1, 0.9) + leaf(78, ty + 12, 1, 0.9) + leaf(56, ty + 4, -1, 0.7) + leaf(64, ty + 4, 1, 0.7) : '');
    front = bloom(22, 104) + (big ? bloom(98, 106) + bloom(30, ty + 14) : '');
  }
  if (el === 'bolt') {
    const b = 'M96 100 L114 82 L105 81 L118 62 L97 79 L106 80 Z';
    back = `<g fill="#facc15" stroke="#a16207" stroke-width="1.5" stroke-linejoin="round"><path d="${b}"/>`
      + (big ? `<path d="M42 ${ty + 14} L30 ${ty - 4} L38 ${ty - 4} L28 ${ty - 22} L46 ${ty} L38 ${ty} Z"/><path d="${mirror(`M42 ${ty + 14} L30 ${ty - 4} L38 ${ty - 4} L28 ${ty - 22} L46 ${ty} L38 ${ty} Z`)}"/><path d="${mirror(b)}"/>` : '') + '</g>';
    front = `<path d="M16 50 l7 4 M12 62 l8 0 M104 40 l-6 6${big ? ' M108 56 l-8 2 M20 38 l6 6' : ''}" stroke="#fde047" stroke-width="2.2" stroke-linecap="round"/>`;
  }
  if (el === 'moon') {
    const cape = 'M28 70 Q0 56 4 100 Q16 92 30 100 Z';
    back = big ? `<g fill="#4c1d95" stroke="#2e1065" stroke-width="1.5" opacity=".9"><path d="${cape}"/><path d="${mirror(cape)}"/></g>${spark(14, 84, 3, '#fde68a')}${spark(106, 84, 3, '#fde68a')}` : '';
    front = moon(20, big ? 36 : 40, big ? 11 : 8) + spark(34, 28, 4, '#fde68a') + spark(12, 58, 3, '#fff') + (big ? spark(104, 30, 4, '#fde68a') : '');
  }
  if (st === 3) {
    back = `<ellipse cx="60" cy="76" rx="57" ry="52" fill="none" stroke="${c}" stroke-width="2" stroke-dasharray="3 7" opacity=".85" class="awake-ring"/>` + back;
    front += spark(12, 26, 5, '#fff') + spark(108, 20, 4, '#fde68a') + spark(110, 66, 3, '#fff');
  }
  return { back, front };
}

const hats = {
  int: `<path d="M38 40 L60 2 L84 40 Z" fill="#6d28d9" stroke="#2e1065" stroke-width="2"/>
        <ellipse cx="61" cy="40" rx="30" ry="6" fill="#5b21b6"/><text x="56" y="30" font-size="12">⭐</text>`,
  str: `<path d="M26 50 Q60 34 96 50 L95 58 Q60 44 27 58 Z" fill="#dc2626"/>
        <path d="M94 52 l14 -6 l-4 10 l8 6 l-16 -2 Z" fill="#b91c1c"/>`,
  cre: `<ellipse cx="58" cy="36" rx="28" ry="9" fill="#be185d" transform="rotate(-12 58 36)"/>
        <circle cx="52" cy="26" r="3" fill="#be185d"/>`,
  spi: `<ellipse cx="60" cy="18" rx="24" ry="6" fill="none" stroke="#fde68a" stroke-width="4" class="halo"/>`,
};

function accSVG(id, ty) {
  const emo = (e, x, y, size) => `<text x="${x}" y="${y}" font-size="${size}" text-anchor="middle">${e}</text>`;
  return {
    acc_bow: emo('🎀', 78, ty + 10, 22),
    acc_flower: emo('🌸', 78, ty + 10, 20),
    acc_crown: emo('👑', 60, ty + 4, 28),
    acc_tophat: emo('🎩', 60, ty + 6, 32),
    acc_glasses: `<g class="glasses"><rect x="36" y="68" width="22" height="14" rx="5" fill="#0b0b12" opacity=".92"/><rect x="62" y="68" width="22" height="14" rx="5" fill="#0b0b12" opacity=".92"/>
      <path d="M58 73 H62 M36 72 L26 68 M84 72 L94 68" stroke="#0b0b12" stroke-width="2.5"/><path d="M40 71 l6 0 M66 71 l6 0" stroke="#fff" stroke-width="1.5" opacity=".6"/></g>`,
    acc_nonla: `<path d="M20 ${ty + 8} L60 ${ty - 22} L100 ${ty + 8} Q60 ${ty + 16} 20 ${ty + 8} Z" fill="#f5deb3" stroke="#a16207" stroke-width="2" stroke-linejoin="round"/>
      <path d="M41 ${ty - 7} H79 M32 ${ty + 1} H88" stroke="#d4a373" stroke-width="1.5"/>`,
    acc_cap: `<path d="M34 ${ty + 10} Q34 ${ty - 12} 60 ${ty - 12} Q86 ${ty - 12} 86 ${ty + 10} Z" fill="#3b82f6" stroke="#1e3a8a" stroke-width="2"/>
      <path d="M62 ${ty + 10} L106 ${ty + 13} Q108 ${ty + 4} 84 ${ty + 3}" fill="#2563eb" stroke="#1e3a8a" stroke-width="2" stroke-linejoin="round"/>
      <circle cx="60" cy="${ty - 12}" r="3" fill="#1e3a8a"/><path d="M46 ${ty - 4} Q52 ${ty - 9} 58 ${ty - 9}" stroke="#fff" stroke-width="2" opacity=".5" fill="none"/>`,
    acc_beanie: `<path d="M30 ${ty + 10} Q30 ${ty - 16} 60 ${ty - 16} Q90 ${ty - 16} 90 ${ty + 10} Z" fill="#f472b6" stroke="#9d174d" stroke-width="2"/>
      <rect x="27" y="${ty + 2}" width="66" height="11" rx="5.5" fill="#ec4899" stroke="#9d174d" stroke-width="2"/>
      <circle cx="60" cy="${ty - 18}" r="7" fill="#fff" stroke="#9d174d" stroke-width="2"/>`,
    acc_catears: `<path d="M30 ${ty + 10} Q60 ${ty - 8} 90 ${ty + 10}" stroke="#1f2937" stroke-width="4" fill="none" stroke-linecap="round"/>
      <path d="M33 ${ty + 5} L37 ${ty - 18} L52 ${ty - 1} Z M87 ${ty + 5} L83 ${ty - 18} L68 ${ty - 1} Z" fill="#1f2937" stroke-linejoin="round"/>
      <path d="M38 ${ty} L40 ${ty - 10} L47 ${ty - 3} Z M82 ${ty} L80 ${ty - 10} L73 ${ty - 3} Z" fill="#f9a8d4"/>`,
    acc_sprout: `<path d="M60 ${ty + 3} Q58 ${ty - 7} 60 ${ty - 13}" stroke="#15803d" stroke-width="3" fill="none" stroke-linecap="round"/>
      <path d="M60 ${ty - 11} Q46 ${ty - 24} 39 ${ty - 12} Q50 ${ty - 5} 60 ${ty - 11} Z M60 ${ty - 13} Q72 ${ty - 28} 81 ${ty - 16} Q70 ${ty - 7} 60 ${ty - 13} Z" fill="#4ade80" stroke="#15803d" stroke-width="1.5"/>`,
    acc_star: `<path d="M82 ${ty - 3} l3.2 6.6 7.2 1 -5.2 5 1.3 7.2 -6.5 -3.4 -6.5 3.4 1.3 -7.2 -5.2 -5 7.2 -1 Z" fill="#facc15" stroke="#a16207" stroke-width="1.6" stroke-linejoin="round"/>`,
    acc_round: `<g fill="#ffffff22" stroke="#111827" stroke-width="2.5"><circle cx="47" cy="76" r="11"/><circle cx="73" cy="76" r="11"/></g><path d="M58 75 Q60 72 62 75 M36 74 L26 70 M84 74 L94 70" stroke="#111827" stroke-width="2.5" fill="none"/>`,
    acc_heart: `<g fill="#f43f5e" fill-opacity=".85" stroke="#881337" stroke-width="2" stroke-linejoin="round">
      <path d="M47 86 L36 75 Q32 67 39 64 Q45 62 47 68 Q49 62 55 64 Q62 67 58 75 Z"/><path d="M73 86 L62 75 Q58 67 65 64 Q71 62 73 68 Q75 62 81 64 Q88 67 84 75 Z"/></g>
      <path d="M58 72 H62 M35 72 L26 69 M85 72 L94 69" stroke="#881337" stroke-width="2.5"/>`,
    acc_bowtie: `<path d="M60 104 L45 96 L45 112 Z M60 104 L75 96 L75 112 Z" fill="#8b5cf6" stroke="#4c1d95" stroke-width="2" stroke-linejoin="round"/><circle cx="60" cy="104" r="4" fill="#6d28d9" stroke="#4c1d95" stroke-width="1.5"/>`,
    acc_bell: `<path d="M28 98 Q60 112 92 98" stroke="#dc2626" stroke-width="5" fill="none" stroke-linecap="round"/>
      <circle cx="60" cy="108" r="6.5" fill="#facc15" stroke="#a16207" stroke-width="2"/><path d="M60 109 V114" stroke="#a16207" stroke-width="1.8"/><circle cx="58" cy="106" r="1.5" fill="#fff" opacity=".8"/>`,
    acc_scarf: `<path d="M24 96 Q60 110 96 96 L96 105 Q60 119 24 105 Z" fill="#ef4444" stroke="#7f1d1d" stroke-width="2" stroke-linejoin="round"/>
      <path d="M36 101 V110 M52 104 V113 M68 104 V113 M84 101 V110" stroke="#fecaca" stroke-width="2" opacity=".7"/>
      <path d="M76 106 L80 120 L91 118 L87 103 Z" fill="#dc2626" stroke="#7f1d1d" stroke-width="2" stroke-linejoin="round"/>`,
    acc_medal: `<path d="M50 94 L58 106 M70 94 L62 106" stroke="#2563eb" stroke-width="5" stroke-linecap="round"/>
      <circle cx="60" cy="108" r="8" fill="#facc15" stroke="#a16207" stroke-width="2"/>${'<path d="M60 103 l1.7 3.4 3.7 .5 -2.7 2.6 .7 3.7 -3.4 -1.8 -3.4 1.8 .7 -3.7 -2.7 -2.6 3.7 -.5 Z" fill="#fff7ed"/>'}`,
    acc_phones: `<path d="M24 ${ty + 34} Q60 ${ty - 22} 96 ${ty + 34}" stroke="#334155" stroke-width="6" fill="none" stroke-linecap="round"/>
      <rect x="16" y="${ty + 26}" width="12" height="22" rx="5" fill="#ef4444" stroke="#7f1d1d" stroke-width="2"/>
      <rect x="92" y="${ty + 26}" width="12" height="22" rx="5" fill="#ef4444" stroke="#7f1d1d" stroke-width="2"/>`,
  }[id] || '';
}

const FACE = `
  <g class="brows" stroke="${INK}" stroke-width="3" stroke-linecap="round" fill="none">
    <path class="b-angry" d="M39 62 L53 67 M81 62 L67 67"/>
    <path class="b-sad" d="M39 67 L53 62 M81 67 L67 62"/>
    <path class="b-curious" d="M40 65 L53 65 M67 61 Q74 55 81 60"/>
  </g>
  <g class="eyes">
    <g class="eye-open"><g class="pupils">
      <ellipse cx="47" cy="76" rx="5.5" ry="8" fill="${INK}"/><ellipse cx="73" cy="76" rx="5.5" ry="8" fill="${INK}"/>
      <circle cx="49" cy="72" r="2" fill="#fff"/><circle cx="75" cy="72" r="2" fill="#fff"/>
    </g></g>
    <g class="eye-happy" stroke="${INK}" stroke-width="3.2" stroke-linecap="round" fill="none"><path d="M41 78 Q47 69 53 78 M67 78 Q73 69 79 78"/></g>
    <g class="eye-closed" stroke="${INK}" stroke-width="3" stroke-linecap="round" fill="none"><path d="M41 76 Q47 81 53 76 M67 76 Q73 81 79 76"/></g>
    <g class="eye-half"><path d="M40 73 H54 M66 73 H80" stroke="${INK}" stroke-width="3" stroke-linecap="round"/>
      <ellipse cx="47" cy="78.5" rx="5" ry="4" fill="${INK}"/><ellipse cx="73" cy="78.5" rx="5" ry="4" fill="${INK}"/></g>
    <g class="eye-x" stroke="${INK}" stroke-width="3" stroke-linecap="round"><path d="M42 71 L52 81 M52 71 L42 81 M68 71 L78 81 M78 71 L68 81"/></g>
  </g>
  <g class="cheeks"><ellipse cx="36" cy="88" rx="6" ry="3" fill="#f472b6"/><ellipse cx="84" cy="88" rx="6" ry="3" fill="#f472b6"/></g>
  <g class="mouths" stroke="${INK}" stroke-width="2.5" stroke-linecap="round" fill="none">
    <path class="m-smile" d="M54 90 Q60 96 66 90"/>
    <path class="m-cat" d="M52 89 Q56 94 60 89 Q64 94 68 89"/>
    <path class="m-grin" d="M52 88 Q60 101 68 88 Z" fill="${INK}"/>
    <ellipse class="m-o" cx="60" cy="92" rx="3.5" ry="4.5" fill="${INK}"/>
    <path class="m-sad" d="M54 95 Q60 89 66 95"/>
    <path class="m-flat" d="M55 92 L65 92"/>
    <path class="m-wavy" d="M53 92 Q56.5 89 60 92 Q63.5 95 67 92"/>
    <g class="m-big"><ellipse cx="60" cy="93" rx="9" ry="8" fill="${INK}"/><ellipse cx="60" cy="97.5" rx="5" ry="3" fill="#f472b6" stroke="none"/></g>
    <ellipse class="m-chew" cx="60" cy="92" rx="6" ry="4" fill="${INK}"/>
  </g>`;

const FX = `
  <g class="fx">
    <g class="fx-heart"><text x="84" y="44" font-size="14">❤️</text><text x="22" y="52" font-size="10">💕</text></g>
    <g class="fx-zzz" fill="#c4b5fd" font-weight="800" font-family="Consolas, monospace"><text x="84" y="48" font-size="11">z</text><text x="92" y="36" font-size="15">Z</text></g>
    <text class="fx-q" x="90" y="46" font-size="20" font-weight="900" fill="#fde047" stroke="#000" stroke-width=".8">?</text>
    <text class="fx-ex" x="90" y="46" font-size="22" font-weight="900" fill="#f87171" stroke="#000" stroke-width=".8">!</text>
    <text class="fx-anger" x="86" y="48" font-size="16">💢</text>
    <text class="fx-note" x="88" y="50" font-size="14" fill="#fde68a">♪</text>
    <path class="fx-sweat" d="M92 54 Q86 64 92 66 Q98 64 92 54 Z" fill="#7dd3fc" stroke="#0369a1" stroke-width="1"/>
    <g class="fx-food"><circle cx="30" cy="36" r="13" fill="#fff" opacity=".92"/><circle cx="40" cy="52" r="3" fill="#fff" opacity=".9"/><text x="30" y="41" font-size="14" text-anchor="middle">🍖</text></g>
    <text class="fx-sigh" x="68" y="104" font-size="12">💨</text>
    <path class="fx-blush" d="M30 87 l3 -5 M35 87 l3 -5 M40 87 l3 -5 M78 87 l3 -5 M83 87 l3 -5 M88 87 l3 -5" stroke="#db2777" stroke-width="1.6" stroke-linecap="round"/>
    <g class="fx-crumb" fill="#fde68a" stroke="#92400e" stroke-width=".6"><circle cx="47" cy="101" r="2"/><circle cx="73" cy="103" r="1.6"/><circle cx="66" cy="108" r="1.3"/><circle cx="52" cy="107" r="1.1"/></g>
    <text class="fx-haha" x="80" y="50" font-size="11" font-weight="800" fill="#fde68a" stroke="#000" stroke-width=".5">ha ha</text>
    <g class="fx-star"><text x="30" y="46" font-size="11">💫</text><text x="80" y="42" font-size="11">⭐</text></g>
  </g>`;

window.PET_MOODS = ['idle', 'happy', 'love', 'surprised', 'curious', 'sleepy', 'sad', 'hungry', 'angry', 'dizzy', 'focus', 'hurt', 'bored', 'chomp', 'eat', 'laugh', 'shy'];

let auraN = 0; // mỗi SVG một id gradient (id trùng có thể trỏ vào SVG đang ẩn → không vẽ)
// form (tùy chọn) = {el, stage} để vẽ thử dạng tiến hóa khác dạng hiện tại (cây tiến hóa trong tab Pet)
window.petSVG = function (s, mood = 'idle', form) {
  const sp = SPECIES[s.petKind] || SPECIES.pet_slime;
  const skin = G.item(s.skin) || G.item('skin_default');
  const accs = s.accs || {}, rec = G.petGet(s), f = form || { el: rec.el, stage: G.petStage(rec) };
  const evo = evoSVG(f.el, f.stage, sp.ty), scale = [0.86, 0.93, 1, 1][f.stage || 0];
  const { cls, rank } = G.heroTitle(s);
  const wpn = G.item(s.weapon);
  const aid = `aura${++auraN}`, aura = cls ? `<defs><radialGradient id="${aid}"><stop offset="0" stop-color="${G.CATS[cls].color}" stop-opacity="${0.16 + rank * 0.1}"/><stop offset="1" stop-color="${G.CATS[cls].color}" stop-opacity="0"/></radialGradient></defs>
    <ellipse cx="60" cy="74" rx="${56 + rank * 4}" ry="${48 + rank * 3}" fill="url(#${aid})" class="aura"/>` : ''; // opacity do CSS .aura nhấp nháy, độ đậm nằm ở stop-opacity
  const hat = cls && !accs.head ? `<g transform="translate(0 ${sp.ty - 40})">${hats[cls]}</g>` : '';
  return `<svg viewBox="0 0 120 120" class="pet-svg ${s.petKind || 'pet_slime'} stage-${f.stage || 0} ${skin.anim ? 'skin-' + skin.anim : ''} ${sp.noMouth ? 'no-mouth' : ''} ${sp.float ? 'floaty' : ''}"
      data-mood="${mood}" style="--skin:${skin.color}">
    ${aura}
    <ellipse cx="60" cy="112" rx="34" ry="5" fill="#000" opacity=".25" class="pet-shadow"/>
    <g class="pet-body"><g class="pet-tilt"><g transform="translate(60 112) scale(${scale}) translate(-60 -112)">
      ${evo.back}${sp.back || ''}${sp.body}
      <g class="face">${FACE}</g>
      ${sp.front || ''}
      ${hat}
      ${['neck', 'head', 'face'].map(k => (accs[k] ? accSVG(accs[k], sp.ty) : '')).join('')}
      ${evo.front}
      ${wpn ? `<text x="92" y="102" font-size="30" class="pet-weapon">${wpn.icon}</text>` : ''}
    </g></g></g>
    ${FX}
  </svg>`;
};
})();
