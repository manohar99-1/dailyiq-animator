// DailyIQ "Dood" Short: WHAT IF YOU GOT GTA 6 IN REAL LIFE? Every frame is an SVG string built from time t.
const W = 1080, H = 1920;
const COL = { cream: '#F6F0E2', navy: '#16213E', ink: '#12151C', red: '#E53935', yellow: '#FFD83D' };
const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
const seg = (t, a, b) => clamp((t - a) / (b - a));
const ease = x => (x < .5 ? 2 * x * x : 1 - Math.pow(-2 * x + 2, 2) / 2);
const easeOut = x => 1 - Math.pow(1 - x, 3);
const pop = x => { if (x <= 0) return 0; if (x >= 1) return 1; const c1 = 1.70158, c3 = c1 + 1; return 1 + c3 * Math.pow(x - 1, 3) + c1 * Math.pow(x - 1, 2); };
const lerp = (a, b, p) => a + (b - a) * p;
const n2 = v => Math.round(v * 100) / 100;
const R = n => { const x = Math.sin(n * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };

const P = TIMING.phrases, SC = TIMING.scenes;
const KEYS = Object.keys(SC).map(Number).sort((a, b) => a - b);
const VIS = {};
KEYS.forEach((k, i) => {
  const s = i === 0 ? 0 : SC[k].start - 0.4;
  const e = i === KEYS.length - 1 ? TIMING.total + 1 : SC[KEYS[i + 1]].start - 0.4;
  VIS[k] = [s, e];
});
function findIn(pi, re) { for (const w of P[pi].words) if (re.test(w.w)) return w; return P[pi].words[0]; }
const LABELS = { 1: 'THE DREAM', 2: 'WANTED LEVEL', 3: 'FREE CAR', 4: 'POLICE CHASE', 5: 'NO MONEY CHEAT', 6: 'FINAL MISSION' };

const cv = document.createElement('canvas').getContext('2d');
function textW(str, size, weight = 900) { cv.font = `${weight} ${size}px InterX`; return cv.measureText(str).width; }

// speech bubble with the character's words as a subtitle. Shows between t0 and t1, tail points at (tx,ty).
function bubble(t, t0, t1, lines, cx, cy, tx, ty) {
  if (t < t0 || t > t1) return '';
  const a = pop(seg(t, t0, t0 + 0.25)) * (1 - seg(t, t1 - 0.2, t1));
  if (a < 0.01) return '';
  const size = 44, lh = 54;
  const w = Math.max(...lines.map(l => textW(l, size))) + 64, h = lines.length * lh + 36;
  cx = clamp(cx, 40 + w / 2, 1040 - w / 2);
  const x0 = cx - w / 2, y0 = cy - h / 2, yb = y0 + h, bx = clamp(tx, x0 + 44, x0 + w - 44);
  const tail = `<path d="M${n2(bx - 22)},${n2(yb - 2)} L${n2(tx)},${n2(ty)} L${n2(bx + 22)},${n2(yb - 2)}" fill="#fff" stroke="${COL.ink}" stroke-width="7" stroke-linejoin="round"/>`;
  const box = `<rect x="${n2(x0)}" y="${n2(y0)}" width="${n2(w)}" height="${n2(h)}" rx="34" fill="#fff" stroke="${COL.ink}" stroke-width="7"/>`;
  const cover = `<rect x="${n2(bx - 19)}" y="${n2(yb - 6)}" width="38" height="9" fill="#fff"/>`;
  const txt = lines.map((l, i) => `<text x="${n2(cx)}" y="${n2(y0 + 18 + lh * (i + 1) - 14)}" text-anchor="middle" font-family="InterX" font-weight="900" font-size="${size}" fill="${COL.ink}">${l}</text>`).join('');
  return `<g transform="translate(${n2(tx)},${n2(ty)}) scale(${n2(a)}) translate(${n2(-tx)},${n2(-ty)})">${tail}${box}${cover}${txt}</g>`;
}

// ======================= Dood & people: ONE outline around the whole body =======================
// Every body part is drawn twice: first all parts in ink but fatter (the outline pass), then all parts in their
// own colour on top. Overlapping parts therefore merge into one silhouette with a single outline and no inner lines.
const OUTW = 7;
function limb(ox, oy, a1, l1, a2, l2) {
  const r1 = a1 * Math.PI / 180, r2 = a2 * Math.PI / 180;
  const kx = ox + Math.sin(r1) * l1, ky = oy + Math.cos(r1) * l1;
  return [ox, oy, kx, ky, kx + Math.sin(r2) * l2, ky + Math.cos(r2) * l2];
}
function outlinePass(parts) {
  return parts.map(p => {
    const tf = p.tf ? ` transform="${p.tf}"` : '';
    if (p.t === 'line') return `<polyline points="${p.pts.map(n2).join(' ')}" fill="none" stroke="${COL.ink}" stroke-width="${p.w + 2 * OUTW}" stroke-linecap="round" stroke-linejoin="round"/>`;
    if (p.t === 'circ') return `<circle cx="${n2(p.cx)}" cy="${n2(p.cy)}" r="${p.r + OUTW}" fill="${COL.ink}"${tf}/>`;
    if (p.t === 'ell') return `<ellipse cx="${n2(p.cx)}" cy="${n2(p.cy)}" rx="${p.rx + OUTW}" ry="${p.ry + OUTW}" fill="${COL.ink}"${tf}/>`;
    return `<path d="${p.d}" fill="${COL.ink}" stroke="${COL.ink}" stroke-width="${2 * OUTW}" stroke-linejoin="round"${tf}/>`;
  }).join('');
}
function fillPass(parts) {
  return parts.map(p => {
    const tf = p.tf ? ` transform="${p.tf}"` : '';
    if (p.t === 'line') return `<polyline points="${p.pts.map(n2).join(' ')}" fill="none" stroke="${p.col}" stroke-width="${p.w}" stroke-linecap="round" stroke-linejoin="round"/>`;
    if (p.t === 'circ') return `<circle cx="${n2(p.cx)}" cy="${n2(p.cy)}" r="${p.r}" fill="${p.col}"${tf}/>`;
    if (p.t === 'ell') return `<ellipse cx="${n2(p.cx)}" cy="${n2(p.cy)}" rx="${p.rx}" ry="${p.ry}" fill="${p.col}"${tf}/>`;
    return `<path d="${p.d}" fill="${p.col}"${tf}/>`;
  }).join('');
}
// subtle faces: small changes only, no big open mouths, no wide eyes
function face(expr, look, blink) {
  const e = COL.ink, lx = look.x || 0, ly = look.y || 0;
  const sw = (d, w = 5) => `<path d="${d}" fill="none" stroke="${e}" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round"/>`;
  const r = expr === 'surprise' ? 7.5 : 6.5;
  const eye = x => blink > 0.5 ? sw(`M${x - 8},-4 L${x + 8},-4`, 5) : `<ellipse cx="${n2(x + lx)}" cy="${n2(-4 + ly)}" rx="${r}" ry="${r}" fill="${e}"/>`;
  const F = {
    neutral: ['M-28,-22 Q-17,-27 -8,-23', 'M10,-23 Q21,-27 31,-22', 'M-8,24 Q4,29 16,24'],
    focus: ['M-28,-24 L-8,-20', 'M10,-20 L30,-24', 'M-6,26 L14,26'],
    confused: ['M-28,-28 Q-17,-34 -8,-28', 'M10,-20 L30,-22', 'M-8,26 Q0,22 6,27 Q12,31 18,25'],
    surprise: ['M-28,-30 Q-17,-36 -8,-30', 'M10,-30 Q21,-36 31,-30', null],
    uneasy: ['M-30,-18 L-8,-26', 'M10,-26 L32,-18', 'M-10,28 Q-3,22 4,28 Q11,34 18,28'],
    shrug: ['M-28,-26 L-8,-30', 'M10,-30 L30,-26', 'M-8,26 Q4,22 16,26'],
    deadpan: ['M-28,-22 L-8,-22', 'M10,-22 L30,-22', 'M-8,26 L16,26'],
    annoyed: ['M-28,-30 L-8,-22', 'M10,-22 L30,-30', 'M-8,30 Q4,23 16,30'],
  }[expr] || null;
  const [bl, br, mo] = F;
  const mouth = mo ? sw(mo) : `<ellipse cx="5" cy="27" rx="5" ry="6" fill="none" stroke="${e}" stroke-width="5"/>`;
  return eye(-17) + eye(19) + sw(bl) + sw(br) + mouth;
}
function person(o) {
  const { x = 0, y = 0, s = 1, flip = 1, expr = 'neutral', look = { x: 0, y: 0 }, blink = 0, lean = 0, tilt = 0, hipY = -190,
    legs = [[-3, -3], [3, 3]], arms = [[-8, -6], [8, 6]], shirt = COL.red, pants = '#2B3A67', skin = '#fff', headCol = '#fff', shoe = '#fff', cap = null, tufts = true } = o;
  const L = 150, lr = lean * Math.PI / 180, sn = Math.sin(lr), cs = Math.cos(lr);
  const dir = [sn, -cs], perp = [cs, sn];
  const sh = [dir[0] * L, hipY + dir[1] * L];
  const hd = [dir[0] * (L + 64), hipY + dir[1] * (L + 64)];
  const lg0 = limb(-10, hipY, legs[0][0], 95, legs[0][1], 95), lg1 = limb(10, hipY, legs[1][0], 95, legs[1][1], 95);
  const so = (sgn) => [sh[0] + perp[0] * 27 * sgn - dir[0] * 12, sh[1] + perp[1] * 27 * sgn - dir[1] * 12];
  const s0 = so(-1), s1 = so(1);
  const ar0 = limb(s0[0], s0[1], arms[0][0], 78, arms[0][1], 78), ar1 = limb(s1[0], s1[1], arms[1][0], 78, arms[1][1], 78);
  const sleeve = (ar, a1) => { const r = a1 * Math.PI / 180; return { t: 'line', pts: [ar[0], ar[1], ar[0] + Math.sin(r) * 30, ar[1] + Math.cos(r) * 30], w: 31, col: shirt }; };
  const tfh = `translate(${n2(hd[0])},${n2(hd[1])}) rotate(${n2(tilt + lean)})`;
  const parts = [];
  parts.push({ t: 'line', pts: lg0, w: 17, col: pants }, { t: 'ell', cx: lg0[4] + 10, cy: lg0[5] + 4, rx: 26, ry: 13, col: shoe });
  parts.push({ t: 'line', pts: ar0, w: 14, col: skin }, sleeve(ar0, arms[0][0]), { t: 'circ', cx: ar0[4], cy: ar0[5], r: 14, col: skin });
  parts.push({ t: 'line', pts: lg1, w: 17, col: pants }, { t: 'ell', cx: lg1[4] + 10, cy: lg1[5] + 4, rx: 26, ry: 13, col: shoe });
  parts.push({ t: 'line', pts: [dir[0] * 20, hipY + dir[1] * 20, dir[0] * (L - 38), hipY + dir[1] * (L - 38)], w: 78, col: shirt });
  parts.push({ t: 'line', pts: [sh[0], sh[1], hd[0], hd[1]], w: 16, col: skin });
  parts.push({ t: 'circ', cx: 0, cy: 0, r: 56, col: headCol, tf: tfh });
  if (cap) parts.push({ t: 'path', d: 'M-55,-12 A56,56 0 0 1 55,-12 Q0,-32 -55,-12 Z', col: cap, tf: tfh });
  parts.push({ t: 'line', pts: ar1, w: 14, col: skin }, sleeve(ar1, arms[1][0]), { t: 'circ', cx: ar1[4], cy: ar1[5], r: 14, col: skin });
  let g = outlinePass(parts);
  if (tufts) g += `<path transform="${tfh}" d="M-16,-52 L-26,-84 M0,-54 L0,-90 M16,-52 L26,-84" fill="none" stroke="${COL.ink}" stroke-width="8" stroke-linecap="round"/>`;
  g += fillPass(parts);
  g += `<g transform="${tfh}"><g transform="translate(12,2)">${face(expr, look, blink)}</g></g>`;
  const wp = (lx, ly) => [x + flip * s * lx, y + s * ly];
  return {
    svg: `<g transform="translate(${n2(x)},${n2(y)}) scale(${n2(s * flip)},${n2(s)})">${g}</g>`,
    pt: { head: wp(hd[0], hd[1]), hand0: wp(ar0[4], ar0[5]), hand1: wp(ar1[4], ar1[5]), hip: wp(0, hipY) },
  };
}
function walkPose(ph, amp = 1) {
  const a = 26 * amp * Math.sin(ph), b = 26 * amp * Math.sin(ph + Math.PI);
  const bend = p => -24 * (0.5 + 0.5 * Math.sin(p + 1.3));
  return { legs: [[a, a + bend(ph)], [b, b + bend(ph + Math.PI)]], arms: [[-22 * amp * Math.sin(ph) - 8, -22 * amp * Math.sin(ph) - 18], [22 * amp * Math.sin(ph) + 8, 22 * amp * Math.sin(ph) + 22]] };
}
const blinkAt = (t, off = 0) => (((t + off) % 3.3) < 0.12 ? 1 : 0);
const star5 = (cx, cy, r, fill, stroke, sw = 6, rot = 0) => {
  let d = '';
  for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + i * Math.PI / 5, rr = i % 2 ? r * 0.45 : r; d += (i ? 'L' : 'M') + n2(cx + Math.cos(a) * rr) + ',' + n2(cy + Math.sin(a) * rr); }
  return `<path d="${d}Z" transform="rotate(${n2(rot)} ${n2(cx)} ${n2(cy)})" fill="${fill}" stroke="${stroke}" stroke-width="${sw}" stroke-linejoin="round"/>`;
};

// ======================= Scene 1a: living room =======================
const F1 = findIn(0, /^discovering/i).s - 0.05;   // TV flash starts
const FL = F1 + 0.35;
const HUD0 = findIn(0, /^turned/i).s - 0.05;   // HUD pops in as the narrator says 'turned into GTA 6'                              // fully white, world takes over
function roomScene(t) {
  const GY = 1340, TVX = 865, TVY = 1000;
  const planks = Array.from({ length: 7 }, (_, i) => `<line x1="-300" y1="${1330 + i * 70}" x2="1400" y2="${1330 + i * 70}" stroke="#B27A4B" stroke-width="5"/>`).join('');
  const stripes = Array.from({ length: 20 }, (_, i) => `<rect x="${-300 + i * 90}" y="-300" width="40" height="1700" fill="#F6E9CF"/>`).join('');
  let g = `<rect x="-300" y="-300" width="1700" height="1700" fill="#EFD9B4"/>${stripes}
<rect x="-300" y="1300" width="1700" height="900" fill="#C68B59"/>${planks}<rect x="-300" y="1290" width="1700" height="20" fill="#fff"/>
<rect x="120" y="360" width="250" height="360" rx="12" fill="#BFE6FF" stroke="${COL.ink}" stroke-width="8"/><circle cx="290" cy="470" r="40" fill="#FFE066"/><rect x="238" y="360" width="6" height="360" fill="#fff"/><rect x="120" y="536" width="250" height="6" fill="#fff"/>
<rect x="480" y="400" width="170" height="230" rx="10" fill="#fff" stroke="${COL.ink}" stroke-width="8"/><path d="M565 450 l16 36 38 4 -29 26 9 38 -34 -20 -34 20 9-38 -29-26 38-4z" fill="#FFB74D"/>
<ellipse cx="640" cy="1430" rx="520" ry="80" fill="#E26D5C" stroke="#12151C" stroke-width="6"/>`;
  // couch
  g += `<rect x="110" y="985" width="400" height="270" rx="60" fill="#5B7DB1" stroke="${COL.ink}" stroke-width="8"/>
<rect x="100" y="1215" width="500" height="125" rx="36" fill="#6B8FC7" stroke="${COL.ink}" stroke-width="8"/>
<rect x="84" y="1100" width="70" height="240" rx="34" fill="#4E6FA3" stroke="${COL.ink}" stroke-width="8"/>`;
  // TV + stand
  const flick = t > F1 - 0.45 ? (Math.sin(t * 60) > 0.2 ? 0.8 : 0.0) * seg(t, F1 - 0.45, F1) : 0;
  g += `<rect x="760" y="1110" width="210" height="190" rx="12" fill="#6E4120" stroke="${COL.ink}" stroke-width="8"/>
<rect x="690" y="880" width="350" height="240" rx="20" fill="#2A2F3A" stroke="${COL.ink}" stroke-width="8"/>
<g clip-path="url(#tvclip)"><rect x="708" y="898" width="314" height="204" fill="#7FB8FF"/><rect x="708" y="1010" width="314" height="92" fill="#3C3F46"/>
<rect x="708" y="1052" width="314" height="5" fill="#fff" opacity=".7"/>
<g transform="translate(${n2(((t * 140) % 420) + 640)},0)"><rect x="-120" y="1000" width="90" height="32" rx="10" fill="#E53935"/><rect x="-104" y="982" width="52" height="24" rx="8" fill="#9ED3FF"/><circle cx="-102" cy="1034" r="10" fill="#222"/><circle cx="-52" cy="1034" r="10" fill="#222"/></g>
<rect x="708" y="898" width="314" height="204" fill="#fff" opacity="${n2(flick)}"/></g>`;
  // Dood sitting, playing
  const lean = 6 + 2.5 * Math.sin(t * 2.3);
  const nearF = t > F1 - 0.3;
  const thumb = 4 * Math.sin(t * 14);
  const d = person({ x: 330, y: GY, s: 0.95, hipY: -95, lean, tilt: nearF ? -2 : 4, expr: nearF ? 'surprise' : 'focus', look: { x: 4, y: 0 }, blink: blinkAt(t),
    legs: [[88, 0], [92, 2]], arms: [[38, 98 + thumb], [44, 104 - thumb]] });
  g += d.svg;
  const hx = (d.pt.hand0[0] + d.pt.hand1[0]) / 2 + 8, hy = (d.pt.hand0[1] + d.pt.hand1[1]) / 2 - 2;
  g += `<g transform="translate(${n2(hx)},${n2(hy)})"><rect x="-34" y="-14" width="68" height="28" rx="12" fill="#2E3440" stroke="${COL.ink}" stroke-width="5"/><circle cx="-18" cy="0" r="5" fill="#9BE564"/><circle cx="16" cy="-4" r="4" fill="#FFD83D"/><circle cx="24" cy="4" r="4" fill="#FF6B6B"/></g>`;
  const camS = lerp(1.0, 1.08, ease(seg(t, 0, F1)));
  const cam = `translate(${TVX},${TVY}) scale(${n2(camS)}) translate(${-TVX},${-TVY})`;
  let out = `<g transform="${cam}">${g}</g>`;
  // flash grows from the TV
  const k = seg(t, F1, FL);
  if (k > 0) out += `<circle cx="${TVX}" cy="${TVY}" r="${n2(lerp(40, 2600, ease(k)))}" fill="#fff"/>`;
  out += bubble(t, 0.4, F1 - 0.12, ['Just one more mission...'], 440, 850, 350, 975);
  return out;
}

// ======================= Game world (street) =======================
function buildWorld() {
  let g = `<rect x="-200" y="-200" width="1500" height="1700" fill="url(#sky)"/><circle cx="820" cy="900" r="330" fill="url(#sun)"/>`;
  for (let i = 0; i < 14; i++) { const w = 70 + R(i) * 50, h = 260 + R(i + 9) * 380; g += `<rect x="${n2(-30 + i * 92)}" y="${n2(1250 - h)}" width="${n2(w)}" height="${n2(h)}" fill="#A9BFDD" opacity=".85"/>`; }
  const cols = ['#5B6B8C', '#6E7FA3', '#4F5F80', '#7A6A8E', '#58708F'];
  let x = -60;
  for (let i = 0; i < 9; i++) {
    const w = 120 + R(i + 3) * 70, h = 460 + R(i + 5) * 420, base = 1330, top = base - h;
    g += `<rect x="${n2(x)}" y="${n2(top)}" width="${n2(w)}" height="${n2(h)}" fill="${cols[i % 5]}"/><rect x="${n2(x)}" y="${n2(top)}" width="${n2(w)}" height="16" fill="#00000030"/>`;
    const cn = Math.floor((w - 16) / 34), rn = Math.floor((h - 60) / 56);
    for (let c = 0; c < cn; c++) for (let r = 0; r < rn; r++) {
      const lit = R(i * 100 + c * 13 + r * 7) > 0.62;
      g += `<rect x="${n2(x + 14 + c * 34)}" y="${n2(top + 34 + r * 56)}" width="20" height="30" rx="2" fill="${lit ? '#FFE9A6' : '#26304A'}"/>`;
    }
    if (i % 3 === 1) g += `<rect x="${n2(x + w / 2 - 3)}" y="${n2(top - 60)}" width="6" height="60" fill="#3A4460"/>`;
    x += w + 8;
  }
  // shops at street level
  const shops = [[40, 300, '#D9534F', 'CAFE'], [380, 330, '#3FA66B', '24H MART'], [750, 340, '#E0A030', 'PIZZA']];
  shops.forEach(([sx, sw, c, name]) => {
    g += `<rect x="${sx}" y="1150" width="${sw}" height="190" fill="#3A3F52"/><rect x="${sx + 20}" y="1215" width="${sw - 40}" height="125" fill="#BFE0F5" opacity=".9"/>
<path d="M${sx - 8},1150 L${sx + sw + 8},1150 L${sx + sw},1212 L${sx},1212 Z" fill="${c}"/><text x="${sx + sw / 2}" y="1198" text-anchor="middle" font-family="InterX" font-weight="900" font-size="38" fill="#fff">${name}</text>`;
  });
  // palms + lamps
  const palm = px => {
    let o = `<path d="M${px},1340 Q${px + 30},1150 ${px + 10},960" fill="none" stroke="#8B5E3C" stroke-width="26" stroke-linecap="round"/>`;
    for (let i = 0; i < 7; i++) { const a = -160 + i * 50; o += `<ellipse cx="${px + 10}" cy="960" rx="90" ry="20" fill="#3F9142" transform="rotate(${a} ${px + 10} 960) translate(70,0)"/>`; }
    return o;
  };
  g += palm(220) + palm(940);
  [520, 700].forEach(lx => { g += `<rect x="${lx}" y="1010" width="12" height="330" fill="#2D3340"/><rect x="${lx - 40}" y="1000" width="64" height="12" fill="#2D3340"/><ellipse cx="${lx - 38}" cy="1016" rx="18" ry="8" fill="#FFE9A6"/>`; });
  // sidewalk, curb, road
  g += `<rect x="-200" y="1330" width="1500" height="150" fill="#CFCBC4"/>` + Array.from({ length: 16 }, (_, i) => `<line x1="${i * 80}" y1="1330" x2="${i * 80 - 30}" y2="1480" stroke="#B3AFA8" stroke-width="4"/>`).join('') +
    `<rect x="-200" y="1478" width="1500" height="22" fill="#9A968F"/><rect x="-200" y="1500" width="1500" height="500" fill="url(#road)"/>` +
    Array.from({ length: 10 }, (_, i) => `<rect x="${i * 130 - 20}" y="1650" width="80" height="12" fill="#F2E7A8"/>`).join('') + `<rect x="-200" y="1780" width="1500" height="10" fill="#fff" opacity=".6"/>`;
  g += `<rect x="-200" y="-200" width="1500" height="1700" fill="url(#vig)"/>`;
  return g;
}
const WORLD = buildWorld();

// ======================= HUD (generic open-world game interface) =======================
function hud(t, t0, stars, tt, cash = '₹5,000', cashCol = '#9BE564') {
  const a = i => pop(seg(t, t0 + i * 0.2, t0 + i * 0.2 + 0.35));
  let g = '';
  const m = a(0);
  if (m > 0.01) {
    g += `<g transform="translate(150,1650) scale(${n2(m)})"><circle r="108" fill="${COL.ink}"/><clipPath id="mm"><circle r="98"/></clipPath><g clip-path="url(#mm)"><rect x="-100" y="-100" width="200" height="200" fill="#3E5B4A"/>
<g transform="rotate(${n2(-12 + 3 * Math.sin(t))})"><rect x="-8" y="-120" width="16" height="240" fill="#8FA59A"/><rect x="-120" y="-30" width="240" height="14" fill="#8FA59A"/><rect x="40" y="-120" width="10" height="240" fill="#6F8A7B"/><rect x="-120" y="48" width="240" height="10" fill="#6F8A7B"/><rect x="-70" y="-100" width="60" height="40" fill="#4F7F9A"/></g>
<path d="M0,-18 L13,14 L0,6 L-13,14Z" fill="#4FC3F7" stroke="#fff" stroke-width="3"/></g><circle r="102" fill="none" stroke="#fff" stroke-width="6"/></g>`;
  }
  const b = a(1);
  if (b > 0.01) g += `<g transform="translate(300,1650) scale(${n2(b)})" style="transform-origin:0 0"><rect x="0" y="-34" width="190" height="22" rx="6" fill="${COL.ink}"/><rect x="3" y="-31" width="184" height="16" rx="4" fill="#4FA3FF"/><rect x="0" y="0" width="190" height="22" rx="6" fill="${COL.ink}"/><rect x="3" y="3" width="184" height="16" rx="4" fill="#E53935"/></g>`;
  const c = a(2);
  if (c > 0.01) g += `<text transform="translate(1030,1720) scale(${n2(c)})" text-anchor="end" font-family="InterX" font-weight="900" font-size="56" fill="${cashCol}" stroke="${COL.ink}" stroke-width="9" paint-order="stroke" stroke-linejoin="round">${cash}</text>`;
  const d = a(3);
  if (d > 0.01) {
    const flash = stars > 0 ? (Math.sin(tt * 9) > 0 ? '#FF4040' : '#4F8BFF') : '#FFD83D';
    let s = '';
    for (let i = 0; i < 5; i++) s += star5(770 + i * 62, 1590, 25, i < stars ? flash : '#00000055', '#fff', 4);
    g += `<g opacity="${n2(clamp(d))}">${s}</g>`;
  }
  return g;
}

// ======================= Scene 1b + 1 =======================
function scene1(t) {
  if (t < FL) return roomScene(t);
  const tw = FL, GY = 1440, S1 = 1.1;
  const k = t - tw;
  const open = seg(k, 0.55, 0.7);                       // eyes open after the flash fades
  const lookX = k < 1.0 ? 0 : (k < 1.6 ? -5 : (k < 2.2 ? 5 : 0));
  const handsUp = ease(seg(k, 2.2, 2.8)) * (1 - ease(seg(k, 3.5, 4.0)));
  const lookDown = ease(seg(k, 2.2, 2.7)) * (1 - ease(seg(k, 3.5, 3.9)));
  const arms = [[lerp(-8, 32, handsUp), lerp(-6, 158, handsUp)], [lerp(8, 42, handsUp), lerp(6, 168, handsUp)]];
  const expr = k < 0.6 ? 'neutral' : (k < 1.0 ? 'surprise' : (lookDown > 0.5 ? 'confused' : 'confused'));
  const sway = k < 0.6 ? 3 * Math.sin(k * 7) : 0;
  const d = person({ x: 540, y: GY, s: S1, flip: 1, expr, look: { x: lookX, y: 4 * lookDown }, blink: k < 0.55 ? 1 : blinkAt(t, 1), lean: sway + 2 * lookDown, tilt: (lookX / 5) * 5 + 8 * lookDown, arms,
    bob: 0 });
  let g = WORLD + d.svg;
  // player marker bobbing above head
  const mk = pop(seg(t, HUD0 + 0.25, HUD0 + 0.5)) * (1 - seg(t, HUD0 + 0.9, HUD0 + 1.15));
  if (mk > 0.01) g += `<path transform="translate(${n2(d.pt.head[0])},${n2(d.pt.head[1] - 190 + 8 * Math.sin(t * 5))}) scale(${n2(mk)})" d="M0,26 L-26,-12 L-10,-12 L-10,-30 L10,-30 L10,-12 L26,-12Z" fill="#9BE564" stroke="${COL.ink}" stroke-width="6" stroke-linejoin="round"/>`;
  const camS = lerp(1.06, 1.0, easeOut(seg(k, 0, 1.2)));
  const cam = `translate(540,1300) scale(${n2(camS)}) translate(-540,-1300)`;
  let out = `<g transform="${cam}">${g}</g>` + hud(t, HUD0, 0, t);
  out += bubble(t, FL + 0.85, FL + 1.85, ['Wait... what?'], 540, 775, 545, 925);
  out += bubble(t, HUD0 + 1.3, HUD0 + 2.55, ['Am I... in the game?'], 540, 775, 545, 925);
  const wa = 1 - seg(t, FL, FL + 0.55);                  // white fades away
  if (wa > 0.01) out += `<rect x="0" y="0" width="${W}" height="${H}" fill="#fff" opacity="${n2(wa)}"/>`;
  return out;
}

// ======================= Scene 2: bump, wanted star =======================
function scene2(t) {
  const tS = VIS[2][0];
  const wBump = findIn(1, /^bump/i), wWanted = findIn(1, /^wanted/i), wEntire = findIn(1, /^entire/i), wPolice = findIn(1, /^police/i);
  const bumpT = wBump.s + 0.25, wantT = wWanted.s, policeT = wPolice.s, entireT = wEntire.s, broT = P[2].start, sandT = broT + 0.6;
  const backT = wantT + 1.8;
  const GY = 1440, S = 1.1;
  const bxD = 470, bxS = 612;
  // Dood
  let dx, dPh = t * 5.2, dArms, dLegs, dExpr = 'neutral', dLook = { x: 0, y: 0 }, dTilt = 0, dLean = 0;
  const wp = walkPose(dPh, 0.85);
  if (t < bumpT) { dx = bxD - 150 * (bumpT - t); dArms = wp.arms; dLegs = wp.legs; }
  else {
    const rc = easeOut(seg(t, bumpT, bumpT + 0.3));
    dx = bxD - 24 * rc;
    dArms = [[-8, -6], [8, 6]]; dLegs = [[0, 0], [0, 0]];
    dExpr = 'surprise'; dLean = -4 * (1 - seg(t, bumpT + 0.3, bumpT + 0.8)) * rc;
    if (t > wantT) {
      dExpr = 'surprise';
      const up = ease(seg(t, wantT + 0.1, wantT + 0.45)) * (1 - ease(seg(t, wantT + 0.9, wantT + 1.2)));
      const rt = ease(seg(t, wantT + 0.9, wantT + 1.2)) * (1 - ease(seg(t, backT - 0.1, backT + 0.2)));
      dLook = { x: 5 * rt, y: -6 * up }; dTilt = -8 * up + 5 * rt;
      if (t > wantT + 1.1) dExpr = 'uneasy';
    }
    if (t > backT && t < broT - 0.1) {
      const bk = t - backT; dx = bxD - 24 - 70 * bk;
      const w2 = walkPose(-t * 4.2, 0.6); dArms = [[w2.arms[0][0] * 0.4, w2.arms[0][1] * 0.4], [w2.arms[1][0] * 0.4, w2.arms[1][1] * 0.4]]; dLegs = w2.legs;
      dExpr = 'uneasy'; dLook = { x: 5, y: 0 };
    } else if (t >= broT - 0.1) {
      dx = bxD - 24 - 70 * (broT - 0.1 - backT);
      const sh = ease(seg(t, broT, broT + 0.4));
      dArms = [[lerp(-8, -36, sh), lerp(-6, -100, sh)], [lerp(8, 30, sh), lerp(6, 92, sh)]];
      dExpr = sh > 0.5 ? 'shrug' : 'uneasy'; dLook = { x: 0, y: 0 }; dTilt = -6 * sh;
    }
  }
  // Stranger (faces left, walks into Dood, then walks off to the right)
  let sx, sFlip = -1, sPh = t * 5.6, sArms, sLegs, sExpr = 'neutral', sLook = { x: 0, y: 0 };
  const walkOffT = sandT + 0.9;
  const swp = walkPose(sPh, 0.85);
  if (t < bumpT) { sx = bxS + 160 * (bumpT - t); sArms = swp.arms; sLegs = swp.legs; }
  else {
    sx = bxS + 18 * easeOut(seg(t, bumpT, bumpT + 0.3));
    sArms = [[-8, -6], [8, 6]]; sLegs = [[0, 0], [0, 0]]; sExpr = 'annoyed'; sLook = { x: -4, y: 0 };
    if (t > bumpT + 0.5 && t < wantT + 0.6) sArms = [[-8, -6], [lerp(8, 30, ease(seg(t, bumpT + 0.5, bumpT + 0.9))), lerp(6, 74, ease(seg(t, bumpT + 0.5, bumpT + 0.9)))]];
    if (t > wantT + 0.2 && t < walkOffT) { sExpr = 'surprise'; sLook = { x: -5, y: -5 * ease(seg(t, wantT + 0.2, wantT + 0.5)) }; }
    if (t >= walkOffT) { sFlip = 1; const w3 = walkPose(sPh, 0.85); sx = bxS + 18 + 150 * (t - walkOffT); sArms = w3.arms; sLegs = w3.legs; sExpr = 'neutral'; sLook = { x: 0, y: 0 }; }
  }
  const dd = person({ x: dx, y: GY, s: S, flip: 1, expr: dExpr, look: dLook, tilt: dTilt, lean: dLean, blink: blinkAt(t), arms: dArms, legs: dLegs, bob: 3 * Math.sin(dPh * 2) * (t < bumpT ? 1 : 0) });
  const ss = person({ x: sx, y: GY, s: S * 0.97, flip: sFlip, expr: sExpr, look: sLook, blink: blinkAt(t, 1.4), arms: sArms, legs: sLegs, shirt: '#3FA66B', pants: '#5B4A3A', skin: '#F1C9A0', headCol: '#F1C9A0', shoe: '#E8E2D4', cap: '#4A2E1B', tufts: false });
  let g = WORLD + ss.svg + dd.svg;
  // wanted star over Dood's head
  const sa = pop(seg(t, wantT, wantT + 0.35));
  if (sa > 0.01) {
    const sxp = dd.pt.head[0], syp = dd.pt.head[1] - 170 - 6 * Math.sin(t * 4);
    g += `<g transform="translate(${n2(sxp)},${n2(syp)}) scale(${n2(sa)}) translate(${n2(-sxp)},${n2(-syp)})">${star5(sxp, syp, 52, '#FFD83D', COL.ink, 8, 8 * Math.sin(t * 3))}</g>`;
  }
  // siren glow once police are mentioned
  const sir = seg(t, policeT, policeT + 0.5);
  const stars = t >= policeT ? 3 : (t >= wantT ? 1 : 0);
  let out = '';
  const camX = lerp(0, -20, seg(t, tS, tS + 5));
  out += `<g transform="translate(${n2(camX)},0)">${g}</g>`;
  if (sir > 0.01) { const red = Math.sin(t * 8) > 0; out += `<rect x="16" y="92" width="1048" height="1800" fill="url(#${red ? 'sirenR' : 'sirenB'})" opacity="${n2(0.55 * sir)}"/>`; }
  const hd = dd.pt.head, sh = ss.pt.head;
  out += bubble(t, bumpT + 0.15, bumpT + 1.45, ['Hey! Watch it!'], sh[0] + 60, sh[1] - 195, sh[0] + 5, sh[1] - 75);
  out += bubble(t, bumpT + 0.55, bumpT + 1.6, ['Sorry!'], hd[0] - 60, hd[1] - 195, hd[0] - 10, hd[1] - 75);
  out += bubble(t, wantT + 0.25, wantT + 1.5, ['Wanted?!', 'For what?!'], hd[0] - 40, hd[1] - 335, hd[0] - 72, hd[1] - 100);
  out += bubble(t, broT + 0.2, broT + 1.6, ['It was an accident!'], hd[0] - 20, hd[1] - 335, hd[0] - 72, hd[1] - 100);
  out += hud(t, 0, stars, t);
  return out;
}
function placeholder(k) { return `<rect x="0" y="0" width="${W}" height="${H}" fill="#EAD6B6"/><text x="540" y="1000" text-anchor="middle" font-family="InterX" font-weight="900" font-size="70" fill="${COL.navy}">SCENE ${k}</text>`; }
const SCENES = { 1: scene1, 2: scene2 };

// ======================= captions =======================
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

// ======================= frame =======================
function frame(t) {
  let sc = KEYS[0];
  KEYS.forEach(k => { if (t >= VIS[k][0]) sc = k; });
  const [a, b] = VIS[sc];
  const fin = seg(t, a, a + 0.25), fout = 1 - seg(t, b - 0.2, b);
  const alpha = sc === KEYS[0] ? fout : Math.min(fin, fout);
  const scene = (SCENES[sc] || placeholder)(t);
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="720" height="1280">
<defs><pattern id="dots" width="40" height="40" patternUnits="userSpaceOnUse"><circle cx="20" cy="20" r="3.2" fill="#E4D9BF"/></pattern>
<clipPath id="pc"><rect x="16" y="92" width="1048" height="1800" rx="52"/></clipPath>
<clipPath id="tvclip"><rect x="708" y="898" width="314" height="204" rx="6"/></clipPath>
<linearGradient id="beam" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#FFF6B0" stop-opacity="0"/><stop offset="1" stop-color="#FFF6B0" stop-opacity=".85"/></linearGradient>
<linearGradient id="sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#5FA8F5"/><stop offset=".6" stop-color="#B8DAFF"/><stop offset="1" stop-color="#FFE2B8"/></linearGradient>
<radialGradient id="sun"><stop offset="0" stop-color="#FFF4C4" stop-opacity=".95"/><stop offset="1" stop-color="#FFF4C4" stop-opacity="0"/></radialGradient>
<linearGradient id="road" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#454850"/><stop offset="1" stop-color="#2A2C32"/></linearGradient>
<radialGradient id="vig" cx=".5" cy=".62" r=".75"><stop offset=".6" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".35"/></radialGradient>
<linearGradient id="sirenR" x1="0" x2="1"><stop offset="0" stop-color="#FF2D2D" stop-opacity=".75"/><stop offset=".35" stop-color="#FF2D2D" stop-opacity="0"/><stop offset=".7" stop-color="#2D6BFF" stop-opacity="0"/><stop offset="1" stop-color="#2D6BFF" stop-opacity=".75"/></linearGradient>
<linearGradient id="sirenB" x1="0" x2="1"><stop offset="0" stop-color="#2D6BFF" stop-opacity=".75"/><stop offset=".35" stop-color="#2D6BFF" stop-opacity="0"/><stop offset=".7" stop-color="#FF2D2D" stop-opacity="0"/><stop offset="1" stop-color="#FF2D2D" stop-opacity=".75"/></linearGradient></defs>
<rect width="${W}" height="${H}" fill="${COL.cream}"/><rect width="${W}" height="${H}" fill="url(#dots)"/>
<text x="540" y="66" text-anchor="middle" font-family="InterX" font-weight="900" font-size="34" fill="${COL.navy}" letter-spacing="1">WHAT IF YOU GOT GTA 6 IN REAL LIFE?</text>
<g clip-path="url(#pc)"><rect x="16" y="92" width="1048" height="1800" fill="#EAD6B6"/>
<g opacity="${n2(alpha)}">${scene}</g>
${caption(t)}</g>
<rect x="16" y="92" width="1048" height="1800" rx="52" fill="none" stroke="${COL.navy}" stroke-width="8"/>
</svg>`;
}
window.renderFrame = t => { document.getElementById('stage').innerHTML = frame(t); };
