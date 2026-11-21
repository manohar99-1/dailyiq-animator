// DailyIQ "Dood" Short: every frame is an SVG string built from time t (seconds).
const W = 1080, H = 1920;
const COL = { cream: '#F6F0E2', navy: '#16213E', ink: '#12151C', blue: '#2F6FDB', yellow: '#FFD83D' };
const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
const seg = (t, a, b) => clamp((t - a) / (b - a));
const ease = x => (x < .5 ? 2 * x * x : 1 - Math.pow(-2 * x + 2, 2) / 2);
const easeOut = x => 1 - Math.pow(1 - x, 3);
const pop = x => { if (x <= 0) return 0; if (x >= 1) return 1; const c1 = 1.70158, c3 = c1 + 1; return 1 + c3 * Math.pow(x - 1, 3) + c1 * Math.pow(x - 1, 2); };
const lerp = (a, b, p) => a + (b - a) * p;
const n2 = v => Math.round(v * 100) / 100;

const P = TIMING.phrases, SC = TIMING.scenes;
const KEYS = Object.keys(SC).map(Number).sort((a, b) => a - b);
const VIS = {};
KEYS.forEach((k, i) => {
  const s = i === 0 ? 0 : SC[k].start - 0.4;
  const e = i === KEYS.length - 1 ? TIMING.total + 1 : SC[KEYS[i + 1]].start - 0.4;
  VIS[k] = [s, e];
});
function findWord(re) { for (const p of P) for (const w of p.words) if (re.test(w.w)) return w; return null; }
const LABELS = { 1: 'THE SHRINK', 2: 'THE JUNGLE', 3: 'THE WATER TRAP', 4: 'THE GIANT ANT', 5: 'THE SCIENCE', 6: 'THE PROBLEM', 7: 'FOLLOW' };

const cv = document.createElement('canvas').getContext('2d');
function textW(str, size, weight = 900) { cv.font = `${weight} ${size}px InterX`; return cv.measureText(str).width; }

// ---------- Dood (stick-figure host) ----------
function limb(ox, oy, a1, l1, a2, l2) {
  const r1 = a1 * Math.PI / 180, r2 = a2 * Math.PI / 180;
  const kx = ox + Math.sin(r1) * l1, ky = oy + Math.cos(r1) * l1;
  return [ox, oy, kx, ky, kx + Math.sin(r2) * l2, ky + Math.cos(r2) * l2];
}
const poly3 = (p, w = 12, col = COL.ink) => `<polyline points="${n2(p[0])},${n2(p[1])} ${n2(p[2])},${n2(p[3])} ${n2(p[4])},${n2(p[5])}" fill="none" stroke="${col}" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round"/>`;
const shoe = (x, y) => `<ellipse cx="${n2(x + 9)}" cy="${n2(y + 6)}" rx="24" ry="12" fill="#fff" stroke="${COL.ink}" stroke-width="5"/>`;
function face(expr) {
  const e = COL.ink;
  const eye = (x, y, r) => `<circle cx="${x}" cy="${y}" r="${r}" fill="${e}"/>`;
  const sw = (d, w = 5) => `<path d="${d}" fill="none" stroke="${e}" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round"/>`;
  switch (expr) {
    case 'curious': return eye(-17, -4, 6.5) + eye(19, -4, 6.5) + sw('M-30,-24 Q-17,-34 -6,-24') + sw('M8,-20 L30,-20') + sw('M-8,24 Q4,30 16,22');
    case 'wonder': return `<circle cx="-17" cy="-4" r="9" fill="${e}"/><circle cx="19" cy="-4" r="9" fill="${e}"/><circle cx="-14" cy="-8" r="3" fill="#fff"/><circle cx="22" cy="-8" r="3" fill="#fff"/>` + sw('M-30,-26 Q-17,-36 -6,-26') + sw('M8,-26 Q19,-36 32,-26') + `<ellipse cx="4" cy="26" rx="7" ry="8" fill="none" stroke="${e}" stroke-width="5"/>`;
    case 'scared': return `<circle cx="-17" cy="-4" r="13" fill="#fff" stroke="${e}" stroke-width="4"/><circle cx="19" cy="-4" r="13" fill="#fff" stroke="${e}" stroke-width="4"/><circle cx="-14" cy="-3" r="4.5" fill="${e}"/><circle cx="22" cy="-3" r="4.5" fill="${e}"/>` + sw('M-32,-26 L-8,-34') + sw('M6,-34 L32,-26') + `<ellipse cx="4" cy="30" rx="8" ry="11" fill="${e}"/>`;
    case 'worry': return eye(-17, -2, 6.5) + eye(19, -2, 6.5) + sw('M-32,-18 L-8,-28') + sw('M6,-28 L32,-18') + sw('M-14,28 Q-7,20 0,28 Q7,36 14,28');
    case 'tired': return sw('M-28,-2 L-8,-2', 6) + sw('M10,-2 L30,-2', 6) + sw('M-30,-14 L-8,-11') + sw('M8,-11 L30,-14') + sw('M-12,28 Q4,20 18,28');
    default: return eye(-17, -4, 6.5) + eye(19, -4, 6.5) + sw('M-10,24 Q4,30 18,24');
  }
}
function dood(o) {
  const { x = 0, y = 0, s = 1, flip = 1, expr = 'curious', lean = 0, tilt = 0, bob = 0, legs = [[0, 0], [0, 0]], arms = [[-12, -8], [12, 8]], sweat = 0 } = o;
  const hipY = -186 + bob, L = 150, lr = lean * Math.PI / 180;
  const c = Math.cos(lr), sn = Math.sin(lr);
  const shx = sn * L, shy = hipY - c * L;
  const hx = shx + sn * 70, hy = shy - c * 70;
  const lg0 = limb(-10, hipY, legs[0][0], 95, legs[0][1], 95), lg1 = limb(10, hipY, legs[1][0], 95, legs[1][1], 95);
  const ar0 = limb(shx - 24 * c, shy - 24 * sn, arms[0][0], 78, arms[0][1], 78);
  const ar1 = limb(shx + 24 * c, shy + 24 * sn, arms[1][0], 78, arms[1][1], 78);
  const sleeve = (ar, a1) => { const r = a1 * Math.PI / 180; return `<line x1="${n2(ar[0])}" y1="${n2(ar[1])}" x2="${n2(ar[0] + Math.sin(r) * 28)}" y2="${n2(ar[1] + Math.cos(r) * 28)}" stroke="${COL.blue}" stroke-width="30" stroke-linecap="round"/>`; };
  let g = '';
  g += poly3(lg0, 13) + shoe(lg0[4], lg0[5]);
  g += poly3(ar0, 12) + sleeve(ar0, arms[0][0]);
  g += poly3(lg1, 13) + shoe(lg1[4], lg1[5]);
  g += `<g transform="translate(0,${n2(hipY)}) rotate(${n2(lean)})"><path d="M-30,-26 L30,-26 L26,2 L-26,2 Z" fill="${COL.ink}"/><path d="M-34,-148 Q0,-160 34,-148 L38,-28 Q0,-18 -38,-28 Z" fill="${COL.blue}" stroke="${COL.ink}" stroke-width="6" stroke-linejoin="round"/></g>`;
  g += `<line x1="${n2(shx)}" y1="${n2(shy - 4)}" x2="${n2(hx)}" y2="${n2(hy + 48)}" stroke="${COL.ink}" stroke-width="12" stroke-linecap="round"/>`;
  g += `<g transform="translate(${n2(hx)},${n2(hy)}) rotate(${n2(tilt + lean)})"><circle r="54" fill="#fff" stroke="${COL.ink}" stroke-width="7"/>`
    + `<path d="M-14,-52 L-24,-80 M0,-54 L0,-86 M14,-52 L24,-80" stroke="${COL.ink}" stroke-width="7" stroke-linecap="round" fill="none"/>`
    + `<g transform="translate(10,0)">${face(expr)}</g></g>`;
  if (sweat > 0) g += `<g transform="translate(${n2(hx + 62)},${n2(hy - 20 + 14 * sweat)}) scale(${n2(sweat)})"><path d="M0,-16 Q14,4 0,14 Q-14,4 0,-16Z" fill="#7CC8FF" stroke="${COL.ink}" stroke-width="3"/></g>`;
  g += poly3(ar1, 12) + sleeve(ar1, arms[1][0]);
  return `<g transform="translate(${n2(x)},${n2(y)}) scale(${n2(s * flip)},${n2(s)})">${g}</g>`;
}
function walkPose(ph, amp = 1) {
  const a = 26 * amp * Math.sin(ph), b = 26 * amp * Math.sin(ph + Math.PI);
  const bend = (p) => -24 * (0.5 + 0.5 * Math.sin(p + 1.3));
  return { legs: [[a, a + bend(ph)], [b, b + bend(ph + Math.PI)]], arms: [[-22 * amp * Math.sin(ph) - 8, -22 * amp * Math.sin(ph) - 18], [22 * amp * Math.sin(ph) + 8, 22 * amp * Math.sin(ph) + 22]] };
}

// ---------- Ant ----------
function ant(x, y, s, flip, ph, a = 1) {
  const col = '#3A2218', col2 = '#6B3321';
  let g = '';
  const legs = (back) => {
    let o = '';
    for (let i = 0; i < 3; i++) {
      const p = ph + i * 2.1 + (back ? Math.PI : 0);
      const bx = -14 + i * 16, by = 12;
      const fx = bx + 26 + 16 * Math.sin(p), fy = 62 - 10 * Math.max(0, Math.cos(p));
      o += `<polyline points="${bx},${by} ${bx + 20},${34 - (back ? 4 : 0)} ${n2(fx)},${n2(fy)}" fill="none" stroke="${back ? col2 : col}" stroke-width="7" stroke-linecap="round" stroke-linejoin="round"/>`;
    }
    return o;
  };
  g += legs(true);
  g += `<ellipse cx="-72" cy="2" rx="50" ry="36" fill="${col}"/><ellipse cx="-72" cy="-8" rx="36" ry="14" fill="#fff" opacity=".12"/>`;
  g += `<ellipse cx="0" cy="-4" rx="30" ry="24" fill="${col2}"/>`;
  g += `<circle cx="50" cy="-12" r="27" fill="${col}"/><circle cx="60" cy="-20" r="7" fill="#fff"/><circle cx="62" cy="-20" r="3.2" fill="${COL.ink}"/>`;
  const aw = 6 * Math.sin(ph * 0.7);
  g += `<path d="M64,-34 Q86,${-70 + aw} 106,${-60 + aw}" fill="none" stroke="${col}" stroke-width="5" stroke-linecap="round"/>`;
  g += `<path d="M56,-36 Q70,${-78 - aw} 90,${-78 - aw}" fill="none" stroke="${col}" stroke-width="5" stroke-linecap="round"/>`;
  g += legs(false);
  return `<g opacity="${a}" transform="translate(${n2(x)},${n2(y)}) scale(${n2(s * flip)},${n2(s)})">${g}</g>`;
}

// ---------- shared world pieces ----------
const planks = Array.from({ length: 9 }, (_, i) => `<line x1="-400" y1="${1215 + i * 110}" x2="1500" y2="${1215 + i * 110}" stroke="#B27A4B" stroke-width="6"/>`).join('');
const stripes = Array.from({ length: 22 }, (_, i) => `<rect x="${-400 + i * 90}" y="-400" width="40" height="1600" fill="#F2D9B2"/>`).join('');
const ROOM = `<rect x="-400" y="-400" width="1900" height="1600" fill="#F7E2C1"/>${stripes}
<rect x="130" y="370" width="290" height="420" rx="14" fill="#fff" stroke="${COL.ink}" stroke-width="8"/><rect x="150" y="390" width="250" height="380" fill="#BFE6FF"/>
<circle cx="330" cy="480" r="46" fill="#FFE066"/><path d="M170 650 q20-40 60-20 q30-30 70 0 q40-10 60 20 z" fill="#fff"/>
<rect x="272" y="390" width="6" height="380" fill="#fff"/><rect x="150" y="575" width="250" height="6" fill="#fff"/>
<rect x="560" y="420" width="170" height="230" rx="10" fill="#fff" stroke="${COL.ink}" stroke-width="8"/>
<path d="M645 470 l16 36 38 4 -29 26 9 38 -34 -20 -34 20 9-38 -29-26 38-4z" fill="#FFB74D"/>
<rect x="790" y="800" width="40" height="400" fill="#7B5B3A"/><rect x="740" y="1090" width="620" height="110" fill="#7B5B3A"/>
<rect x="760" y="990" width="600" height="110" rx="20" fill="#F1F1F1" stroke="${COL.ink}" stroke-width="6"/><rect x="930" y="985" width="430" height="120" rx="18" fill="#4F8EF7"/>
<ellipse cx="850" cy="985" rx="84" ry="38" fill="#fff" stroke="${COL.ink}" stroke-width="6"/>
<rect x="-400" y="1195" width="1900" height="1200" fill="#C68B59"/>${planks}<rect x="-400" y="1180" width="1900" height="22" fill="#fff"/>
<ellipse cx="470" cy="1320" rx="400" ry="80" fill="#E26D5C" stroke="${COL.ink}" stroke-width="6"/>`;
const star = (x, y, r, col, rot = 0) => `<path transform="translate(${n2(x)},${n2(y)}) rotate(${n2(rot)})" d="M0,${-r} L${r * .28},${-r * .28} L${r},0 L${r * .28},${r * .28} L0,${r} L${-r * .28},${r * .28} L${-r},0 L${-r * .28},${-r * .28}Z" fill="${col}"/>`;

// ---------- Scene 1: the shrink ----------
function scene1(t) {
  const F0 = P[0].end + 0.03;
  const shr = ease(seg(t, F0 + 0.15, F0 + 1.55));
  const camS = lerp(1.0, 0.9, ease(seg(t, F0 + 0.2, F0 + 1.8)));
  const shake = (t > F0 && t < F0 + 0.9) ? 10 * Math.sin(t * 70) * (1 - seg(t, F0, F0 + 0.9)) : 0;
  const GY = 1300, DX = 480;
  let phase = 'a', tc = 0;
  if (t >= F0 + 1.7) { phase = 'c'; tc = F0 + 1.7; } else if (t >= F0) { phase = 'b'; tc = F0; }
  const bump = 1 + 0.06 * Math.exp(-12 * Math.max(0, t - tc));
  const ds = lerp(1.25, 0.28, shr) * bump;
  const bob = 4 * Math.sin(t * 3) * (1 - shr * 0.5);
  let d;
  if (phase === 'a') d = { expr: 'curious', arms: [[-12, -8], [30, 205]], tilt: -6, bob };
  else if (phase === 'b') d = { expr: 'scared', arms: [[-118, -150], [118, 150]], legs: [[-12, -12], [12, 12]], tilt: 0, bob: bob * 0.5 };
  else d = { expr: 'wonder', arms: [[-12, -8], [12, 8]], tilt: -10, bob: 2 * Math.sin(t * 3) };
  const gcx = DX, gcy = GY - 230 * lerp(1.25, 0.2, shr) / 1.25 * 1.25;
  let g = ROOM;
  // "?" bubble
  const qa = pop(seg(t, 0.9, 1.15)) * (1 - seg(t, F0 - 0.15, F0));
  if (qa > 0.01) g += `<g transform="translate(700,560) scale(${n2(qa)})"><ellipse rx="70" ry="62" fill="#fff" stroke="${COL.ink}" stroke-width="7"/><path d="M-30,52 L-52,100 L6,62Z" fill="#fff" stroke="${COL.ink}" stroke-width="7" stroke-linejoin="round"/><ellipse rx="64" ry="56" fill="#fff"/><text y="30" text-anchor="middle" font-family="InterX" font-weight="900" font-size="92" fill="${COL.navy}">?</text></g>`;
  g += dood({ x: DX, y: GY, s: ds, ...d });
  // flash, rays, ring, stars
  if (t > F0 - 0.05 && t < F0 + 2.0) {
    const k = seg(t, F0, F0 + 1.7);
    const cx = DX, cy = GY - 230 * ds;
    const ring = lerp(60, 380, easeOut(seg(t, F0, F0 + 0.7)));
    g += `<circle cx="${cx}" cy="${cy}" r="${n2(ring)}" fill="none" stroke="#9B7BFF" stroke-width="${n2(18 * (1 - k))}" opacity="${n2(0.9 * (1 - k))}"/>`;
    for (let i = 0; i < 14; i++) {
      const a = i / 14 * Math.PI * 2 + t * 1.5;
      g += `<line x1="${n2(cx + Math.cos(a) * 120)}" y1="${n2(cy + Math.sin(a) * 120)}" x2="${n2(cx + Math.cos(a) * (240 + 140 * (1 - k)))}" y2="${n2(cy + Math.sin(a) * (240 + 140 * (1 - k)))}" stroke="${i % 2 ? '#FFD83D' : '#fff'}" stroke-width="12" stroke-linecap="round" opacity="${n2(0.9 * (1 - k))}"/>`;
    }
    for (let i = 0; i < 8; i++) {
      const a = i / 8 * Math.PI * 2 - t * 2.2, r = 130 + 120 * k + 20 * Math.sin(t * 6 + i);
      g += star(cx + Math.cos(a) * r, cy + Math.sin(a) * r * 0.85, 22 * (1 - k * 0.6), i % 2 ? '#7EE8FF' : '#FFD83D', t * 90);
    }
  }
  // giant ant arrives
  const aprog = easeOut(seg(t, F0 + 1.2, F0 + 2.4));
  if (aprog > 0) g += ant(lerp(1500, 760, aprog), GY - 62 * 1.4 - 14, 1.4, -1, aprog < 1 ? t * 9 : t * 1.2, 1);
  const flashA = clamp(1 - Math.abs(t - (F0 + 0.1)) / 0.28) * 0.85;
  const cam = `translate(540,1090) scale(${n2(camS)}) translate(${n2(-540 + shake)},-1050)`;
  return `<g transform="${cam}">${g}</g>` + (flashA > 0.01 ? `<rect x="0" y="0" width="${W}" height="${H}" fill="#fff" opacity="${n2(flashA)}"/>` : '');
}

// ---------- Scene 2: carpet jungle ----------
function blade(x, b, h, w, sway, col) {
  return `<path d="M${n2(x - w)},${n2(b)} Q${n2(x - w * .4 + sway * .5)},${n2(b - h * .55)} ${n2(x + sway)},${n2(b - h)} Q${n2(x + w * .4 + sway * .5)},${n2(b - h * .5)} ${n2(x + w)},${n2(b)} Z" fill="${col}"/>`;
}
function bladeRow(t, base, hMin, hMax, count, w, cols, x0, x1, seed) {
  let o = '';
  for (let i = 0; i < count; i++) {
    const r1 = (Math.sin(seed + i * 12.9898) * 43758.5453) % 1, r2 = (Math.sin(seed * 1.7 + i * 78.233) * 12345.678) % 1;
    const x = lerp(x0, x1, i / (count - 1)) + 20 * Math.abs(r1);
    const h = lerp(hMin, hMax, Math.abs(r2));
    o += blade(x, base, h, w, 10 * Math.sin(t * 1.6 + x * 0.013), cols[i % cols.length]);
  }
  return o;
}
function scene2(t) {
  const t0 = VIS[2][0];
  const wFor = findWord(/^forest/i), wDust = findWord(/^dust/i), wEnorm = findWord(/^enormous/i);
  const camS = lerp(1.0, 1.07, seg(t, t0, t0 + 5));
  const GY = 1500;
  const ph = t * 5.2;
  const wp = walkPose(ph, 0.75);
  const dx = lerp(390, 650, easeOut(seg(t, t0 + 0.4, t0 + 5.2)) * 0.9 + seg(t, t0 + 0.4, t0 + 5.2) * 0.1);
  const tiredK = wEnorm ? seg(t, wEnorm.s - 0.5, wEnorm.s) : 0;
  let g = `<rect x="-300" y="-300" width="1700" height="1700" fill="#EAD6B6"/><rect x="-300" y="1330" width="1700" height="1300" fill="#5C8E52"/>`;
  g += `<rect x="900" y="-300" width="120" height="1650" fill="#CDB38C"/><rect x="860" y="1290" width="200" height="50" fill="#BFA27A"/>`;
  g += `<rect x="20" y="-300" width="250" height="1630" fill="url(#wood)"/>` + [60, 110, 160, 215].map(x => `<line x1="${x}" y1="-300" x2="${x + 8}" y2="1330" stroke="#6A3E1C" stroke-width="4" opacity=".5"/>`).join('') + `<rect x="-20" y="1260" width="330" height="72" rx="10" fill="#6E4120"/>`;
  g += bladeRow(t, 1345, 200, 330, 26, 15, ['#86B86F', '#79AD65', '#8FC079'], -40, 1100, 3);
  g += bladeRow(t, 1430, 260, 400, 22, 18, ['#5F9A4F', '#548F47', '#69A458'], -20, 1100, 7);
  // dust particle
  const da = wDust ? pop(seg(t, wDust.s, wDust.s + 0.4)) : 1;
  if (da > 0.01) {
    const dy = 1190 + 12 * Math.sin(t * 2), dxp = 820 + 8 * Math.sin(t * 1.3);
    let blob = `<g transform="translate(${n2(dxp)},${n2(dy)}) scale(${n2(da)})"><ellipse rx="96" ry="84" fill="#B9B2A8"/>`;
    for (let i = 0; i < 12; i++) { const a = i / 12 * Math.PI * 2; blob += `<circle cx="${n2(Math.cos(a) * 92)}" cy="${n2(Math.sin(a) * 80)}" r="${14 + 6 * Math.sin(i * 3.1)}" fill="#B9B2A8"/>`; }
    blob += `<ellipse cx="-30" cy="-28" rx="34" ry="20" fill="#E4DED6" opacity=".8"/><ellipse cx="26" cy="26" rx="40" ry="26" fill="#9C958B" opacity=".6"/></g>`;
    g += blob;
  }
  g += dood({ x: dx, y: GY, s: 0.5, expr: tiredK > 0.5 ? 'tired' : 'wonder', lean: 9 + 4 * tiredK, tilt: tiredK > 0.5 ? 6 : -8, bob: 3 * Math.sin(ph * 2), sweat: tiredK > 0.5 ? clamp((tiredK - 0.5) * 2) : 0, ...wp });
  g += bladeRow(t, 1640, 150, 250, 20, 20, ['#3F7D3A', '#357233', '#468742'], -30, 1100, 11);
  // "forest" tree highlight pop
  if (false && wFor) { const fa = pop(seg(t, wFor.s, wFor.s + 0.3)) * (1 - seg(t, wFor.e + 0.6, wFor.e + 1.0)); if (fa > 0.01) g += `<g transform="translate(560,860) scale(${n2(fa)})">${[0, 1, 2].map(i => `<rect x="${-70 + i * 60}" y="${-20 - (i % 2) * 20}" width="16" height="70" fill="#6B4423"/><circle cx="${-62 + i * 60}" cy="${-40 - (i % 2) * 20}" r="${34 + (i % 2) * 8}" fill="#3F9142"/>`).join('')}</g>`; }
  const cam = `translate(540,1000) scale(${n2(camS)}) translate(-540,-1000)`;
  return `<g transform="${cam}">${g}</g>`;
}
function placeholder(k, t) { return `<rect x="0" y="0" width="${W}" height="${H}" fill="#EAD6B6"/><text x="540" y="1000" text-anchor="middle" font-family="InterX" font-weight="900" font-size="70" fill="${COL.navy}">SCENE ${k}</text>`; }
const SCENES = { 1: scene1, 2: scene2 };

// ---------- captions ----------
const CH = [];
P.forEach((p, pi) => {
  const n = p.words.length, k = Math.ceil(n / 3); let idx = 0;
  for (let c = 0; c < k; c++) { const size = Math.floor(n / k) + (c < n % k ? 1 : 0); const ws = p.words.slice(idx, idx + size); idx += size; CH.push({ pi, ws, s: ws[0].s, e: ws[ws.length - 1].e }); }
});
function caption(t) {
  let cur = null;
  for (let i = 0; i < CH.length; i++) {
    const c = CH[i]; const nxt = (CH[i + 1] && CH[i + 1].pi === c.pi) ? CH[i + 1].s : c.e + 0.3;
    if (t >= c.s - 0.02 && t < Math.min(nxt, c.e + 0.3)) { cur = c; break; }
  }
  if (!cur) return '';
  const words = cur.ws.map(w => w.w.toUpperCase().replace(/\.\.\./, '…'));
  let size = 92; const maxW = 930;
  const tw = sz => words.reduce((a, w) => a + textW(w, sz), 0) + textW(' ', sz) * (words.length - 1);
  while (tw(size) > maxW && size > 40) size -= 2;
  const sp = textW(' ', size); let x = 540 - tw(size) / 2;
  let ci = 0; cur.ws.forEach((w, i) => { if (t >= w.s) ci = i; });
  const a = pop(seg(t, cur.s - 0.02, cur.s + 0.18));
  let out = '';
  words.forEach((w, i) => {
    out += `<text x="${n2(x)}" y="240" font-family="InterX" font-weight="900" font-size="${size}" fill="${i === ci ? COL.yellow : '#fff'}" stroke="${COL.navy}" stroke-width="${n2(size * 0.17)}" paint-order="stroke" stroke-linejoin="round">${w}</text>`;
    x += textW(w, size) + sp;
  });
  return `<g transform="translate(540,215) scale(${n2(0.85 + 0.15 * a)}) translate(-540,-215)">${out}</g>`;
}

// ---------- frame ----------
function frame(t) {
  let sc = KEYS[0];
  KEYS.forEach(k => { if (t >= VIS[k][0]) sc = k; });
  const [a, b] = VIS[sc];
  const fin = seg(t, a, a + 0.25), fout = 1 - seg(t, b - 0.2, b);
  const alpha = sc === KEYS[0] ? fout : Math.min(fin, fout);
  const slide = (1 - fout) * -40;
  const scene = (SCENES[sc] || ((tt) => placeholder(sc, tt)))(t);
  const pills = KEYS.filter(k => k <= 6).map((k, i) => `<rect x="${330 + i * 58}" y="1838" width="48" height="16" rx="8" fill="${k === sc ? COL.yellow : '#4A5A86'}"/>`).join('');
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="720" height="1280">
<defs><pattern id="dots" width="40" height="40" patternUnits="userSpaceOnUse"><circle cx="20" cy="20" r="3.2" fill="#E4D9BF"/></pattern>
<clipPath id="pc"><rect x="16" y="92" width="1048" height="1800" rx="52"/></clipPath>
<linearGradient id="wood" x1="0" x2="1"><stop offset="0" stop-color="#7A4A24"/><stop offset=".5" stop-color="#A66B38"/><stop offset="1" stop-color="#7A4A24"/></linearGradient></defs>
<rect width="${W}" height="${H}" fill="${COL.cream}"/><rect width="${W}" height="${H}" fill="url(#dots)"/>
<text x="540" y="66" text-anchor="middle" font-family="InterX" font-weight="900" font-size="34" fill="${COL.navy}" letter-spacing="1">WHAT IF YOU BECAME SMALLER THAN AN ANT?</text>
<g clip-path="url(#pc)"><rect x="16" y="92" width="1048" height="1800" fill="#EAD6B6"/>
<g opacity="${n2(alpha)}" transform="translate(${n2(slide)},0)">${scene}</g>
<rect x="16" y="1800" width="1048" height="92" fill="${COL.navy}"/>
<text x="64" y="1862" font-family="InterX" font-weight="900" font-size="46" fill="#fff">Daily<tspan fill="${COL.yellow}">IQ</tspan></text>
<text x="1030" y="1858" text-anchor="end" font-family="InterX" font-weight="800" font-size="30" fill="#fff">${sc}/6  ${LABELS[sc] || ''}</text>${pills}
${caption(t)}</g>
<rect x="16" y="92" width="1048" height="1800" rx="52" fill="none" stroke="${COL.navy}" stroke-width="8"/>
</svg>`;
}
window.renderFrame = t => { document.getElementById('stage').innerHTML = frame(t); };
