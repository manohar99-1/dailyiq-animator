// Scenes 3-6 of the GTA Short + props (car, owner's bat, trash can, wall, pool, house, phone, scooter, mission card).
const END_T = 56.5;
VIS[6][1] = END_T;
const T3 = VIS[3][0], T4 = VIS[4][0], T5 = VIS[5][0], T6 = VIS[6][0];
const ink = COL.ink;
const mod = (a, m) => ((a % m) + m) % m;
const ws = (pi, re) => findIn(pi, re).s;

// ---------------- car (side view, faces right) ----------------
function car(o) {
  const { x, y, s = 1, rot = 0, color = '#18B6C8', id = 'c0', occ = null, cops = null, lightPh = null, alarm = false, shake = 0, wheelRot = 0, stripe = null } = o;
  const glass = '-100,-110 -80,-198 80,-198 128,-110';
  const wheel = cx => `<circle cx="${cx}" cy="-38" r="47" fill="#1C1F26"/><circle cx="${cx}" cy="-38" r="38" fill="#2A2D36" stroke="${ink}" stroke-width="6"/><circle cx="${cx}" cy="-38" r="16" fill="#C9CED8" stroke="${ink}" stroke-width="4"/><g transform="rotate(${n2(wheelRot)} ${cx} -38)"><line x1="${cx - 16}" y1="-38" x2="${cx + 16}" y2="-38" stroke="${ink}" stroke-width="5"/><line x1="${cx}" y1="-54" x2="${cx}" y2="-22" stroke="${ink}" stroke-width="5"/></g>`;
  let g = `<path d="M-215,-52 Q-215,-100 -165,-102 L-120,-102 L-94,-203 Q-88,-218 -66,-218 L84,-218 Q104,-218 116,-205 L150,-102 L190,-96 Q222,-90 222,-58 L222,-40 Q222,-30 210,-30 L-205,-30 Q-215,-30 -215,-45 Z" fill="${color}" stroke="${ink}" stroke-width="8" stroke-linejoin="round"/>`;
  if (stripe) g += `<rect x="-205" y="-84" width="415" height="22" fill="${stripe}" opacity=".95"/>`;
  g += `<polygon points="${glass}" fill="#BFE6FF" stroke="none"/>`;
  g += `<clipPath id="${id}g"><polygon points="${glass}"/></clipPath>`;
  if (occ) {
    const d = person(Object.assign({ x: 25, y: 148, s: 0.75, expr: 'uneasy', arms: [[10, 20], [14, 24]] }, occ));
    g += `<g clip-path="url(#${id}g)">${d.svg}</g>`;
  }
  if (cops) {
    g += `<g clip-path="url(#${id}g)">`;
    [-8, 62].forEach((cx, i) => {
      g += `<circle cx="${cx}" cy="-150" r="32" fill="#F1C9A0" stroke="${ink}" stroke-width="6"/><path d="M${cx - 34},-158 A34,34 0 0 1 ${cx + 34},-158 L${cx + 40},-150 L${cx - 40},-150Z" fill="#1F3A7A" stroke="${ink}" stroke-width="5"/>`;
      const e = cops.expr === 'surprise' ? 7 : 5;
      g += `<circle cx="${cx + 10 + (cops.look || 0)}" cy="-144" r="${e}" fill="${ink}"/><circle cx="${cx + 28 + (cops.look || 0)}" cy="-144" r="${e}" fill="${ink}"/>`;
      g += cops.expr === 'surprise' ? `<ellipse cx="${cx + 20}" cy="-122" rx="6" ry="8" fill="none" stroke="${ink}" stroke-width="5"/>` : `<path d="M${cx + 8},-122 L${cx + 32},-122" stroke="${ink}" stroke-width="5" stroke-linecap="round"/>`;
    });
    g += `</g>`;
  }
  g += `<polygon points="${glass}" fill="none" stroke="${ink}" stroke-width="7" stroke-linejoin="round"/>`;
  g += `<path d="M-60,-100 L-60,-42 M-100,-58 L-84,-58" stroke="${ink}" stroke-width="5" fill="none" stroke-linecap="round"/>`;
  g += `<ellipse cx="212" cy="-72" rx="14" ry="10" fill="#FFF3A0" stroke="${ink}" stroke-width="4"/><ellipse cx="-210" cy="-72" rx="9" ry="12" fill="#FF5252" stroke="${ink}" stroke-width="4"/>`;
  if (!cops) g += `<rect x="-228" y="-134" width="52" height="12" rx="4" fill="${color}" stroke="${ink}" stroke-width="5"/><path d="M-210,-122 L-210,-100 M-190,-122 L-190,-104" stroke="${ink}" stroke-width="6"/>`;
  g += wheel(-125) + wheel(135);
  if (lightPh !== null) {
    const a = Math.sin(lightPh) > 0;
    g += `<rect x="-34" y="-236" width="32" height="18" rx="5" fill="${a ? '#FF3B3B' : '#7A1E1E'}" stroke="${ink}" stroke-width="4"/><rect x="2" y="-236" width="32" height="18" rx="5" fill="${a ? '#1F3A7A' : '#3B7BFF'}" stroke="${ink}" stroke-width="4"/>`;
    g += `<circle cx="${a ? -18 : 18}" cy="-228" r="46" fill="${a ? '#FF3B3B' : '#3B7BFF'}" opacity=".35"/>`;
  }
  if (alarm) {
    g += `<circle cx="212" cy="-72" r="46" fill="#FFE066" opacity=".55"/><circle cx="-210" cy="-72" r="40" fill="#FF8080" opacity=".5"/>`;
    g += `<path d="M-70,-250 l-36,-26 M10,-258 l0,-44 M90,-250 l36,-26" stroke="#FFD83D" stroke-width="9" stroke-linecap="round"/>`;
  }
  return `<g transform="translate(${n2(x + shake)},${n2(y)}) rotate(${n2(rot)} 0 -60) scale(${n2(s)})">${g}</g>`;
}
function bat(hand, ang, len, flip = 1) {
  const e = [hand[0] + flip * Math.sin(ang * Math.PI / 180) * len, hand[1] - Math.cos(ang * Math.PI / 180) * len];
  return `<line x1="${n2(hand[0])}" y1="${n2(hand[1])}" x2="${n2(e[0])}" y2="${n2(e[1])}" stroke="${ink}" stroke-width="32" stroke-linecap="round"/><line x1="${n2(hand[0])}" y1="${n2(hand[1])}" x2="${n2(e[0])}" y2="${n2(e[1])}" stroke="#C8894A" stroke-width="19" stroke-linecap="round"/>`;
}
const poof = (cx, cy, k) => k <= 0 || k >= 1 ? '' : [[-50, 10, 46], [0, -24, 58], [50, 8, 46], [-20, 36, 40], [26, 38, 40]].map(([dx, dy, r]) => `<circle cx="${n2(cx + dx * (0.6 + k))}" cy="${n2(cy + dy * (0.6 + k))}" r="${n2(r * (0.5 + k))}" fill="#fff" stroke="${ink}" stroke-width="5" opacity="${n2(1 - k)}"/>`).join('');

// ---------------- scene 3: a free car, until the owner shows up ----------------
function scene3(t) {
  const wThat = ws(3, /^that/i), wFree = ws(3, /^free/i), wWell = ws(4, /^well/i), wOwner = ws(4, /^owner/i), wDisc = ws(4, /^discovers/i);
  const CX = 760, CY = 1575, SC3 = 1.35, GY = 1440, stopX = 300;
  const jumpT = wWell + 0.15, landT = jumpT + 0.55, alarmT = landT + 0.1;
  const ownT0 = wOwner - 0.35;
  let g = WORLD;
  // Dood walks in, spots the car, looks around, hops in
  let dx, dy = GY, dArms, dLegs, expr = 'neutral', look = { x: 0, y: 0 }, tilt = 0, showStand = true;
  const wp = walkPose(t * 5.2, 0.85);
  if (t < wThat) { dx = stopX - 130 * (wThat - t); dArms = wp.arms; dLegs = wp.legs; }
  else {
    dx = stopX; dArms = [[-8, -6], [8, 6]]; dLegs = [[-3, -3], [3, 3]];
    if (t < wFree + 0.2) { expr = 'surprise'; look = { x: 5, y: 0 }; }
    else if (t < jumpT) {
      const k = t - wFree;
      look = { x: k < 0.6 ? -5 : (k < 1.1 ? 5 : 0), y: 0 }; tilt = (look.x / 5) * 6; expr = 'neutral';
    }
  }
  if (t >= jumpT) {
    const u = seg(t, jumpT, landT), e = easeOut(u);
    dx = lerp(stopX, CX + 34, e); dy = lerp(GY, CY + 195, e) - 260 * Math.sin(Math.PI * u);
    dArms = [[-150, -170], [150, 170]]; dLegs = [[-25, -40], [30, 45]];
    showStand = t < landT;
  }
  const standing = person({ x: dx, y: dy, s: 1.0, expr, look, tilt, blink: blinkAt(t), arms: dArms, legs: dLegs });
  const alarmOn = t >= alarmT && Math.sin(t * 14) > 0;
  const sk = t >= alarmT ? 3 * Math.sin(t * 40) : 0;
  const inCar = t >= landT;
  const turn = ease(seg(t, wOwner, wOwner + 0.4));
  g += car({ x: CX, y: CY, s: SC3, color: '#18B6C8', id: 'c3', alarm: alarmOn, shake: sk, occ: inCar ? { expr: turn > 0.5 ? 'uneasy' : 'neutral', look: { x: -5 * turn, y: 0 }, blink: turn > 0.5 ? 0 : blinkAt(t), tilt: -6 * turn } : null });
  if (showStand) g += standing.svg;
  g += poof(CX + 34, CY - 209, seg(t, landT, landT + 0.4));
  // owner with a bat, arriving from behind
  if (t > ownT0 - 0.1) {
    const speed = 500, ox = t < wDisc ? 370 - speed * (wDisc - t) : 370;
    const raise = ease(seg(t, wDisc, wDisc + 0.25));
    const w2 = walkPose(t * 11, 1.2);
    const arms = t < wDisc ? [[w2.arms[0][0], w2.arms[0][1]], [w2.arms[1][0], w2.arms[1][1]]] : [[-8, -6], [lerp(8, 150, raise), lerp(6, 172, raise)]];
    const ow = person({ x: ox, y: GY, s: 1.08, expr: 'annoyed', blink: 0, arms, legs: t < wDisc ? w2.legs : [[-3, -3], [3, 3]], shirt: '#7A4FC4', pants: '#3A3A44', skin: '#E7B98F', headCol: '#E7B98F', shoe: '#555', cap: '#222', tufts: false });
    g += ow.svg;
    g += bat(ow.pt.hand1, t < wDisc ? 70 : lerp(70, 12, raise), 175);
    g += `<g id="own"></g>`;
    g += bubble(t, wDisc - 0.05, wDisc + 1.1, ["THAT'S MY CAR!"], ox, 790, ox, 940);
  }
  g += bubble(t, wFree, wFree + 1.2, ['Free car?!'], 300, 800, 300, 965);
  g += bubble(t, wDisc + 0.45, VIS[3][1] - 0.05, ['Uh... hi?'], 800, 1150, 800, 1275);
  return g + hud(t, 0, 1, t);
}

// ---------------- scrolling street for the chase and the ending ----------------
const TW = 1080;
function tileLayer(seed, base, hMin, hMax, cols, windows, n) {
  const widths = []; let sum = 0;
  for (let i = 0; i < n; i++) { const w = 90 + R(seed + i) * 90; widths.push(w); sum += w; }
  const k = TW / sum; let x = 0, g = '';
  for (let i = 0; i < n; i++) {
    const w = widths[i] * k, h = hMin + R(seed + i + 40) * (hMax - hMin);
    g += `<rect x="${n2(x)}" y="${n2(base - h)}" width="${n2(w - 4)}" height="${n2(h)}" fill="${cols[i % cols.length]}"/>`;
    if (windows) {
      const cn = Math.floor((w - 24) / 34), rn = Math.floor((h - 50) / 56);
      for (let c = 0; c < cn; c++) for (let r = 0; r < rn; r++) g += `<rect x="${n2(x + 12 + c * 34)}" y="${n2(base - h + 30 + r * 56)}" width="20" height="30" rx="2" fill="${R(seed * 7 + i * 100 + c * 13 + r * 7) > 0.6 ? '#FFE9A6' : '#26304A'}"/>`;
    }
    x += w;
  }
  return g;
}
const FAR = tileLayer(300, 1250, 260, 640, ['#A9BFDD', '#9DB4D6'], false, 9);
const MID = tileLayer(500, 1330, 420, 860, ['#5B6B8C', '#6E7FA3', '#4F5F80', '#7A6A8E', '#58708F'], true, 5);
const PROPS = `<path d="M180,1340 Q210,1150 190,960" fill="none" stroke="#8B5E3C" stroke-width="26" stroke-linecap="round"/>` + Array.from({ length: 7 }, (_, i) => `<ellipse cx="190" cy="960" rx="90" ry="20" fill="#3F9142" transform="rotate(${-160 + i * 50} 190 960) translate(70,0)"/>`).join('') +
  `<rect x="720" y="1010" width="12" height="330" fill="#2D3340"/><rect x="680" y="1000" width="64" height="12" fill="#2D3340"/><ellipse cx="682" cy="1016" rx="18" ry="8" fill="#FFE9A6"/>`;
function scrollTile(str, off) { const o = -mod(off, TW); return `<g transform="translate(${n2(o)},0)">${str}<g transform="translate(${TW},0)">${str}</g></g>`; }
function chaseBG(D) {
  let g = `<rect x="-200" y="-200" width="1500" height="1700" fill="url(#sky)"/><circle cx="820" cy="900" r="330" fill="url(#sun)"/>`;
  g += scrollTile(FAR, D * 0.12) + scrollTile(MID, D * 0.35) + scrollTile(PROPS, D * 0.9);
  g += `<rect x="-200" y="1330" width="1500" height="150" fill="#CFCBC4"/>`;
  g += `<g transform="translate(${n2(-mod(D, 80))},0)">${Array.from({ length: 16 }, (_, i) => `<line x1="${i * 80}" y1="1330" x2="${i * 80 - 30}" y2="1480" stroke="#B3AFA8" stroke-width="4"/>`).join('')}</g>`;
  g += `<rect x="-200" y="1478" width="1500" height="22" fill="#9A968F"/><rect x="-200" y="1500" width="1500" height="500" fill="url(#road)"/>`;
  g += `<g transform="translate(${n2(-mod(D, 130))},0)">${Array.from({ length: 11 }, (_, i) => `<rect x="${i * 130 - 20}" y="1730" width="80" height="12" fill="#F2E7A8"/>`).join('')}</g>`;
  return g + `<rect x="-200" y="-200" width="1500" height="1700" fill="url(#vig)"/>`;
}

// ---------------- scene 4: the chase ----------------
const trashT = ws(6, /^terrible/i), wallT = trashT + 1.2, poolT = ws(6, /^calling/i), splashT = poolT + 0.62;
function speedAt(t) {
  let v = 950;
  v *= 1 - 0.55 * Math.exp(-Math.pow((t - trashT - 0.1) / 0.15, 2));
  if (t >= wallT) v *= seg(t, wallT + 0.35, wallT + 0.9);
  if (t >= poolT) v *= 1 - seg(t, poolT + 0.1, poolT + 0.75);
  return v;
}
const DT = 1 / 120, DTAB = [0];
for (let i = 1; i <= Math.ceil((VIS[4][1] - T4) / DT) + 2; i++) DTAB.push(DTAB[i - 1] + speedAt(T4 + (i - 1) * DT) * DT);
const Dist = t => { const f = clamp((t - T4) / DT, 0, DTAB.length - 1.001), i = Math.floor(f); return lerp(DTAB[i], DTAB[i + 1], f - i); };
const trash = (x, y, rot, lid) => `<g transform="translate(${n2(x)},${n2(y)}) rotate(${n2(rot)} 0 -65)"><rect x="-45" y="-130" width="90" height="130" rx="10" fill="#8E99A6" stroke="${ink}" stroke-width="7"/><path d="M-20,-115 L-20,-15 M0,-115 L0,-15 M20,-115 L20,-15" stroke="#6C7683" stroke-width="6"/><ellipse cx="${lid[0]}" cy="${-132 + lid[1]}" rx="54" ry="13" fill="#A7B1BE" stroke="${ink}" stroke-width="7" transform="rotate(${lid[2]} ${lid[0]} ${-132 + lid[1]})"/></g>`;
const wallRect = (x, y, rot) => `<g transform="translate(${n2(x)},${n2(y)}) rotate(${n2(rot)} 75 0)"><rect x="-75" y="-320" width="150" height="320" fill="#C0583B" stroke="${ink}" stroke-width="8"/>${Array.from({ length: 8 }, (_, i) => `<line x1="-75" y1="${-320 + (i + 1) * 40}" x2="75" y2="${-320 + (i + 1) * 40}" stroke="#8E3F2A" stroke-width="5"/>`).join('')}${Array.from({ length: 8 }, (_, i) => `<line x1="${i % 2 ? -25 : 25}" y1="${-320 + i * 40}" x2="${i % 2 ? -25 : 25}" y2="${-320 + (i + 1) * 40}" stroke="#8E3F2A" stroke-width="5"/>`).join('')}</g>`;
function scene4(t) {
  const D = Dist(t), v = speedAt(t);
  const baseX = 470, carY = 1640, S = 0.95;
  const Xp = Dist(poolT) + 910;                       // pool's left edge in world coordinates
  const poolX = Xp - D, poolW = 520;
  let g = chaseBG(D);
  // pool behind the car
  if (poolX < 1200) g += `<rect x="${n2(poolX)}" y="1596" width="${poolW}" height="300" fill="#2B88C9"/><rect x="${n2(poolX - 14)}" y="1578" width="${poolW + 28}" height="26" fill="#EAF6FF" stroke="${ink}" stroke-width="6"/><rect x="${n2(poolX + 40)}" y="1700" width="${poolW - 80}" height="6" fill="#fff" opacity=".35"/>`;
  // speed lines
  for (let i = 0; i < 9; i++) { const lx = 1500 - mod(i * 233 + D * 2.2, 1700), ly = 1530 + (i * 97) % 300; if (v > 80) g += `<line x1="${n2(lx)}" y1="${ly}" x2="${n2(lx + 130 * (v / 950))}" y2="${ly}" stroke="#fff" stroke-width="5" opacity="${n2(0.45 * v / 950)}" stroke-linecap="round"/>`; }
  // obstacles
  const trX = Dist(trashT) + baseX + 263 - D;
  if (t < trashT + 0.02 && trX < 1300) g += trash(trX, carY - 4, 0, [0, 0, 0]);
  const waX = Dist(wallT) + baseX + 291 - D;
  const fall = ease(seg(t, wallT + 0.25, wallT + 0.9));
  if (waX > -300 && waX < 1300) g += wallRect(waX, carY + 2, 86 * fall);
  // the car's story
  let cx = baseX, cy = carY, rot = 0, sh = 0;
  const wob = t > ws(6, /^driving/i) ? Math.sin(t * 3.1) : 0;
  cy += 9 * wob + 3 * Math.sin(t * 22) * (v > 80 ? 1 : 0); rot += 2.5 * wob;
  const th = seg(t, trashT, trashT + 0.5); cy -= 60 * Math.sin(Math.PI * th); rot -= 10 * Math.sin(Math.PI * th);
  const wh = seg(t, wallT, wallT + 1.0);
  cx -= 120 * easeOut(seg(t, wallT, wallT + 0.3)) * (1 - ease(seg(t, wallT + 0.35, wallT + 1.0)));
  rot += 16 * Math.exp(-wh * 4) * Math.sin(wh * 18) + 12 * (1 - seg(t, wallT, wallT + 0.12)) * 0;
  const pu = seg(t, poolT, poolT + 0.85);
  if (t >= poolT) { cx = lerp(baseX, 860, easeOut(pu)); cy = lerp(carY, 1700, pu) - 190 * Math.sin(Math.PI * pu); rot = 14 * pu; }
  if (t > poolT + 0.85) { cy = 1700 + 7 * Math.sin((t - poolT) * 5) * Math.exp(-(t - poolT - 0.85) * 1.2); rot = 14 - 2 * Math.sin((t - poolT) * 4); }
  const shk = (hit, k) => k * Math.exp(-(t - hit) * 9) * Math.sin(t * 80) * (t >= hit ? 1 : 0);
  sh = shk(trashT, 4) + shk(wallT, 10) + shk(splashT, 6);
  // police cars
  const stop = ease(seg(t, poolT + 0.2, poolT + 1.0));
  const pc = (px, py, k) => car({ x: px, y: py, s: 0.8, color: '#F2F4F8', stripe: '#2A5BD7', id: 'p' + k, cops: { expr: t > poolT + 0.6 ? 'surprise' : 'deadpan', look: t > poolT + 0.6 ? 6 : 0 }, lightPh: t * 16 + k, wheelRot: -t * 800 * (1 - stop) });
  g += pc(lerp(-200 + 10 * Math.sin(t * 4), 40, stop), 1730, 2);
  g += pc(lerp(140 + 14 * Math.sin(t * 5), 300, stop), 1700, 1);
  g += car({ x: cx, y: cy, s: S, color: '#18B6C8', id: 'c4', occ: { expr: t > poolT + 0.9 ? 'surprise' : 'uneasy', blink: 0, look: { x: 4, y: 0 } }, wheelRot: -t * 900 * (v / 950), alarm: false });
  // trash can launched by the hit, plus junk
  if (t >= trashT) {
    const k = t - trashT, hx = baseX + 220;
    g += trash(hx + 330 * k, carY - 6 - 520 * k + 1100 * k * k, 720 * k, [30 * k, -20 * k, 200 * k]);
    for (let i = 0; i < 7; i++) { const a = -0.4 - i * 0.28, sp = 380 + i * 40; const jx = hx + 40 + Math.cos(a) * sp * k + 60 * i * k, jy = carY - 40 + Math.sin(a) * sp * k + 900 * k * k; if (k < 1.2) g += `<rect x="${n2(jx)}" y="${n2(jy)}" width="22" height="22" rx="5" fill="${['#FFD83D', '#9BE564', '#FF6B6B', '#fff'][i % 4]}" stroke="${ink}" stroke-width="4" transform="rotate(${n2(k * 500 * (i % 2 ? 1 : -1))} ${n2(jx + 11)} ${n2(jy + 11)})"/>`; }
  }
  // impact sparks on the wall
  if (t >= wallT && t < wallT + 0.4) { const k = (t - wallT) / 0.4; for (let i = 0; i < 8; i++) { const a = i * Math.PI / 4; g += `<line x1="${n2(baseX + 215 + Math.cos(a) * 30 * k)}" y1="${n2(carY - 130 + Math.sin(a) * 30 * k)}" x2="${n2(baseX + 215 + Math.cos(a) * (60 + 70 * k))}" y2="${n2(carY - 130 + Math.sin(a) * (60 + 70 * k))}" stroke="#FFD83D" stroke-width="9" stroke-linecap="round" opacity="${n2(1 - k)}"/>`; } }
  // pool water in front of the car, splash, bubbles
  if (poolX < 1200) {
    g += `<rect x="${n2(poolX)}" y="1620" width="${poolW}" height="280" fill="#4FC3F7" opacity=".55"/><path d="M${n2(poolX)},1620 q40,-14 80,0 t80,0 t80,0 t80,0 t80,0 t80,0 t80,0" fill="none" stroke="#fff" stroke-width="6" opacity=".8"/>`;
    if (t >= splashT) {
      const k = t - splashT;
      for (let i = 0; i < 14; i++) { const a = -Math.PI / 2 + (i - 6.5) * 0.2, sp = 520 + (i % 4) * 90; const px = 860 + Math.cos(a) * sp * k * 0.55, py = 1620 + Math.sin(a) * sp * k + 1300 * k * k; if (k < 1.1) g += `<circle cx="${n2(px)}" cy="${n2(py)}" r="${n2(14 - 5 * (i % 3))}" fill="#CFEFFF" stroke="${ink}" stroke-width="3" opacity="${n2(1 - k / 1.1)}"/>`; }
      for (let r = 0; r < 2; r++) if (k > r * 0.25) g += `<ellipse cx="860" cy="1622" rx="${n2(60 + (k - r * 0.25) * 320)}" ry="${n2(10 + (k - r * 0.25) * 34)}" fill="none" stroke="#fff" stroke-width="6" opacity="${n2(clamp(1 - (k - r * 0.25) / 1.0))}"/>`;
      for (let b = 0; b < 6; b++) g += `<circle cx="${n2(800 + b * 28 + 5 * Math.sin(t * 6 + b))}" cy="${n2(1700 - ((k * 140 + b * 40) % 220))}" r="${6 + b % 3 * 3}" fill="#fff" opacity=".7"/>`;
    }
  }
  const out = `<g transform="translate(${n2(sh)},${n2(sh * 0.6)})">${g}</g>`;
  const stars = t >= poolT ? 5 : (t >= trashT ? 4 : 3);
  let o = out + hud(t, 0, stars, t);
  o += bubble(t, ws(6, /^driving/i), ws(6, /^driving/i) + 1.3, ['Which one is', 'the brake?!'], 520, 1190, 540, 1360);
  o += bubble(t, wallT - 0.15, wallT + 0.85, ['AAAHH!'], 560, 1160, 600, 1330);
  o += bubble(t, ws(6, /^ambulance/i) + 0.02, ws(6, /^ambulance/i) + 1.5, ['Call an ambulance...', 'for us!'], 330, 1380, 300, 1520);
  o += bubble(t, poolT + 1.15, VIS[4][1] - 0.05, ['Why is there', 'a POOL?!'], 830, 1330, 860, 1480);
  return o;
}

// ---------------- scene 5: respawn at home, empty bank account ----------------
function houseWorld() {
  let g = `<rect x="-200" y="-200" width="1500" height="1700" fill="url(#sky)"/><circle cx="820" cy="900" r="330" fill="url(#sun)"/>`;
  g += `<ellipse cx="200" cy="1330" rx="520" ry="190" fill="#8CC98A"/><ellipse cx="920" cy="1350" rx="560" ry="170" fill="#79BA7C"/>`;
  g += `<circle cx="130" cy="1130" r="95" fill="#3F9142" stroke="${ink}" stroke-width="7"/><rect x="118" y="1210" width="26" height="130" fill="#8B5E3C"/>`;
  g += `<rect x="560" y="1010" width="440" height="400" fill="#F7E3BE" stroke="${ink}" stroke-width="8"/><polygon points="520,1010 780,790 1040,1010" fill="#C75B4A" stroke="${ink}" stroke-width="8" stroke-linejoin="round"/><rect x="900" y="840" width="60" height="110" fill="#B5543A" stroke="${ink}" stroke-width="7"/>`;
  g += `<rect x="730" y="1215" width="100" height="195" rx="6" fill="#6B4A2E" stroke="${ink}" stroke-width="7"/><circle cx="812" cy="1318" r="8" fill="#FFD83D"/>`;
  [[590, 1070], [880, 1070]].forEach(([wx, wy]) => { g += `<rect x="${wx}" y="${wy}" width="100" height="100" fill="#BFE6FF" stroke="${ink}" stroke-width="7"/><path d="M${wx + 50},${wy} v100 M${wx},${wy + 50} h100" stroke="${ink}" stroke-width="5"/>`; });
  g += `<rect x="-200" y="1400" width="1500" height="520" fill="#6CC06B"/><polygon points="700,1410 860,1410 960,1892 640,1892" fill="#D9D3C7"/>`;
  for (let i = 0; i < 9; i++) g += `<rect x="${i * 62 - 20}" y="1330" width="40" height="86" rx="6" fill="#fff" stroke="${ink}" stroke-width="5"/>`;
  g += `<rect x="-200" y="1368" width="1500" height="14" fill="#fff" stroke="${ink}" stroke-width="4"/>`;
  return g + `<rect x="-200" y="-200" width="1500" height="1700" fill="url(#vig)"/>`;
}
const HOUSE = houseWorld();
function phoneBig(t, tShow, amount, loading, wiggle, colAmt) {
  const a = pop(seg(t, tShow, tShow + 0.3));
  if (a < 0.01) return '';
  return `<g transform="translate(815,1010) rotate(${n2(wiggle)}) scale(${n2(a * 1.15)})"><rect x="-175" y="-310" width="350" height="620" rx="46" fill="#14161C" stroke="${ink}" stroke-width="8"/><rect x="-155" y="-280" width="310" height="560" rx="26" fill="#F4F6FA"/><rect x="-155" y="-280" width="310" height="86" rx="26" fill="#2F6FED"/><rect x="-155" y="-224" width="310" height="30" fill="#2F6FED"/><text y="-222" text-anchor="middle" font-family="InterX" font-weight="900" font-size="38" fill="#fff">MY BANK</text><text y="-120" text-anchor="middle" font-family="InterX" font-weight="800" font-size="30" fill="#6B7280">BALANCE</text>${loading ? `<circle cy="-10" r="46" fill="none" stroke="#C7CCD6" stroke-width="12"/><path d="M0,-56 A46,46 0 0 1 46,-10" fill="none" stroke="#2F6FED" stroke-width="12" stroke-linecap="round" transform="rotate(${n2(t * 540)} 0 -10)"/>` : `<text y="20" text-anchor="middle" font-family="InterX" font-weight="900" font-size="120" fill="${colAmt}">${amount}</text>`}<rect x="-120" y="110" width="240" height="18" rx="9" fill="#E3E7EE"/><rect x="-120" y="150" width="190" height="18" rx="9" fill="#E3E7EE"/><rect x="-120" y="190" width="215" height="18" rx="9" fill="#E3E7EE"/></g>`;
}
function scene5(t) {
  const GY = 1500, S = 1.1, X = 380;
  const spawnT = T5 + 0.2, wResp = ws(7, /^respawn/i), wTiny = ws(8, /^tiny/i), wProb = ws(8, /^problem/i), wNo = ws(8, /^no$/i), wCheat = ws(8, /^cheat/i);
  const wAcc = ws(9, /^account/i), wDead = ws(9, /^dead/i), endT = VIS[5][1];
  const revealT = wNo + 0.05;
  let g = HOUSE;
  // respawn light beam
  const bu = seg(t, spawnT, spawnT + 1.0);
  if (bu > 0 && bu < 1) {
    const w = 190 * Math.sin(Math.PI * Math.min(1, bu * 1.1)) ;
    g += `<rect x="${n2(X - w / 2)}" y="700" width="${n2(w)}" height="${GY - 700 + 30}" fill="url(#beam)" opacity=".9"/>`;
    for (let i = 0; i < 14; i++) { const py = GY - ((bu * 900 + i * 71) % 760), px = X + 80 * Math.sin(i * 2.1 + t * 4); g += `<path d="M${n2(px - 10)},${n2(py)} h20 M${n2(px)},${n2(py - 10)} v20" stroke="#fff" stroke-width="6" stroke-linecap="round" opacity=".85"/>`; }
  }
  const vis = clamp(seg(t, spawnT + 0.25, spawnT + 0.7));
  let arms = [[-8, -6], [8, 6]], expr = 'neutral', hop = 0, look = { x: 0, y: 0 }, tilt = 0, legs = [[-3, -3], [3, 3]];
  const cel = seg(t, wResp - 0.05, wResp + 0.45) * (1 - seg(t, wResp + 0.9, wResp + 1.3));
  if (cel > 0) { arms = [[lerp(-8, -150, cel), lerp(-6, -168, cel)], [lerp(8, 150, cel), lerp(6, 168, cel)]]; hop = 38 * Math.abs(Math.sin((t - wResp) * 9)) * cel; }
  const phoneUp = ease(seg(t, wTiny - 0.3, wTiny + 0.1)) * (1 - ease(seg(t, wDead - 0.2, wDead + 0.15)));
  if (phoneUp > 0) arms = [[lerp(arms[0][0], 42, phoneUp), lerp(arms[0][1], 102, phoneUp)], [lerp(arms[1][0], 50, phoneUp), lerp(arms[1][1], 110, phoneUp)]];
  const shake = (t > wCheat + 0.25 && t < wAcc - 0.3) ? 1 : 0;
  if (t >= revealT) expr = 'deadpan';
  if (t >= wDead) { // pockets turned out: hands at the hips
    const pu = ease(seg(t, wDead, wDead + 0.3)); arms = [[lerp(42, -30, pu), lerp(102, -40, pu)], [lerp(50, 30, pu), lerp(110, 40, pu)]];
  }
  const jig = shake ? 3 * Math.sin(t * 38) : 0;
  const d = person({ x: X + jig, y: GY - hop, s: S, expr, look, tilt, blink: blinkAt(t), arms, legs });
  g += `<g opacity="${n2(vis)}">${d.svg}</g>`;
  if (phoneUp > 0.3) { const m = [(d.pt.hand0[0] + d.pt.hand1[0]) / 2, (d.pt.hand0[1] + d.pt.hand1[1]) / 2]; g += `<g transform="translate(${n2(m[0] + 8)},${n2(m[1] - 4)}) rotate(${n2(12 + (shake ? 8 * Math.sin(t * 40) : 0))})"><rect x="-22" y="-38" width="44" height="76" rx="9" fill="#14161C" stroke="${ink}" stroke-width="5"/><rect x="-16" y="-30" width="32" height="58" rx="5" fill="#BFD6FF"/></g>`; }
  // phone close-up: loading, then 0, then again
  const loading = t < revealT || (t > wAcc && t < wAcc + 0.6);
  const wig = shake ? 7 * Math.sin(t * 30) : 0;
  const again = t > wAcc + 0.6 ? 6 * Math.exp(-(t - wAcc - 0.6) * 5) * Math.sin(t * 40) : 0;
  g += phoneBig(t, wProb - 0.1, '₹0', loading, wig + again, '#E53935');
  // HUD: the game's cash counts down to the real balance
  const cashN = Math.round(5000 * (1 - ease(seg(t, revealT, revealT + 0.6))));
  let o = g + hud(t, 0, 0, t, '₹' + cashN.toLocaleString('en-IN'), cashN === 0 ? '#FF5A5A' : '#9BE564');
  o += bubble(t, spawnT + 0.9, spawnT + 2.2, ['Respawned! Nice!'], 460, 760, 400, 990);
  o += bubble(t, wCheat, wCheat + 1.3, ['No cheat code?!'], 440, 760, 400, 990);
  o += bubble(t, wAcc + 0.1, wAcc + 1.3, ['Still zero...'], 440, 760, 400, 990);
  o += bubble(t, wDead + 0.45, endT - 0.05, ['Even my pockets', 'are empty!'], 450, 720, 400, 990);
  return o;
}

// ---------------- scene 6: the final mission ----------------
const becomeT = ws(11, /^becoming/i), unlockT = ws(10, /^unlock/i);
function scooter(x, y, handle, wheelRot, k = 1) {
  handle = [x + (handle[0] - x) / k, y + (handle[1] - y) / k];
  const w = cx => `<circle cx="${cx}" cy="-34" r="34" fill="#2A2D36" stroke="${ink}" stroke-width="7"/><circle cx="${cx}" cy="-34" r="12" fill="#C9CED8" stroke="${ink}" stroke-width="4"/><g transform="rotate(${n2(wheelRot)} ${cx} -34)"><line x1="${cx - 12}" y1="-34" x2="${cx + 12}" y2="-34" stroke="${ink}" stroke-width="4"/></g>`;
  const hx = handle[0] - x, hy = handle[1] - y;
  return `<g transform="translate(${n2(x)},${n2(y)}) scale(${k})">${w(-70)}${w(190)}<line x1="190" y1="-34" x2="${n2(hx)}" y2="${n2(hy)}" stroke="${ink}" stroke-width="22" stroke-linecap="round"/><line x1="190" y1="-34" x2="${n2(hx)}" y2="${n2(hy)}" stroke="#FF6B35" stroke-width="11" stroke-linecap="round"/><line x1="${n2(hx - 18)}" y1="${n2(hy)}" x2="${n2(hx + 18)}" y2="${n2(hy)}" stroke="${ink}" stroke-width="16" stroke-linecap="round"/><rect x="-100" y="-46" width="320" height="26" rx="13" fill="#FF6B35" stroke="${ink}" stroke-width="7"/><rect x="-60" y="-106" width="125" height="36" rx="16" fill="#2D2D2D" stroke="${ink}" stroke-width="6"/><rect x="-130" y="-92" width="84" height="48" rx="14" fill="#FF6B35" stroke="${ink}" stroke-width="7"/></g>`;
}
const bag = (x, y, rot) => `<g transform="translate(${n2(x)},${n2(y)}) rotate(${n2(rot)})"><path d="M-22,-70 Q0,-112 22,-70" fill="none" stroke="${ink}" stroke-width="9"/><path d="M-50,-70 L50,-70 L60,0 L-60,0Z" fill="#FF9A2E" stroke="${ink}" stroke-width="7" stroke-linejoin="round"/><circle cx="0" cy="-36" r="13" fill="#fff" stroke="${ink}" stroke-width="5"/></g>`;
function missionCard(t) {
  const a = pop(seg(t, unlockT, unlockT + 0.35)) * (1 - seg(t, becomeT + 0.25, becomeT + 0.5));
  if (a < 0.01) return '';
  const y = lerp(380, 560, easeOut(seg(t, unlockT, unlockT + 0.4)));
  return `<g transform="translate(540,${n2(y)}) scale(${n2(a)})"><rect x="-440" y="-170" width="880" height="340" rx="26" fill="#12151C" opacity=".94" stroke="${COL.yellow}" stroke-width="9"/><text y="-96" text-anchor="middle" font-family="InterX" font-weight="900" font-size="46" fill="${COL.yellow}">NEW MISSION UNLOCKED</text><rect x="-380" y="-70" width="760" height="5" fill="#ffffff55"/><text y="2" text-anchor="middle" font-family="InterX" font-weight="900" font-size="58" fill="#fff">MISSION: DELIVER FOOD</text><text y="100" text-anchor="middle" font-family="InterX" font-weight="900" font-size="66" fill="#9BE564">REWARD: ₹500</text></g>`;
}
function scene6(t) {
  const GY = 1440, S = 0.72, X0 = 400, bagX = 700, scX = 860, K = 0.66;
  const run0 = becomeT + 0.25, pickT = becomeT + 0.7, mountT = becomeT + 1.0;
  const dt = Math.max(0, t - mountT);
  const Dsc = 560 * (dt * dt) / (1 + dt);                          // street scroll once he rides away
  let g = chaseBG(Dsc);
  g += `<rect x="-200" y="-200" width="1500" height="1700" fill="#FF9A3C" opacity=".10"/>`;
  const sit = { hipY: -8, lean: 20 + 2 * Math.sin(t * 2.4), tilt: 14, legs: [[88, 84], [92, 88]], arms: [[28, 58], [34, 66]] };
  let pose;
  const sx = scX - lerp(0, 120, seg(t, mountT, mountT + 1.0));       // scooter drifts left on screen as the world scrolls
  const scooterX = t < mountT ? scX : sx;
  if (t < becomeT) pose = { x: X0, y: GY, hipY: sit.hipY, lean: sit.lean, tilt: sit.tilt, legs: sit.legs, arms: sit.arms, expr: t > unlockT - 0.1 ? 'surprise' : 'deadpan', blink: blinkAt(t), look: { x: 0, y: t > unlockT ? 6 : 4 } };
  else if (t < mountT) {
    const u = seg(t, becomeT, becomeT + 0.4), e = ease(u), rn = seg(t, run0, mountT);
    const x = t < run0 ? X0 + 15 * e : (t < pickT ? lerp(X0 + 15, bagX, seg(t, run0, pickT)) : lerp(bagX, scX - 40, seg(t, pickT, mountT)));
    const ph = t * 15, w = walkPose(ph, 1.4);
    pose = { x, y: GY - 55 * Math.sin(Math.PI * u) * (t < run0 ? 1 : 0), hipY: lerp(sit.hipY, -190, e), lean: lerp(20, t >= run0 ? 8 : 0, e), tilt: lerp(14, 0, e),
      legs: t < run0 ? [[lerp(88, -3, e), lerp(84, -3, e)], [lerp(92, 3, e), lerp(88, 3, e)]] : w.legs, arms: t < run0 ? [[lerp(28, -8, e), lerp(58, -6, e)], [lerp(34, 8, e), lerp(66, 6, e)]] : w.arms, expr: 'neutral', blink: 0, look: { x: 4, y: 0 } };
  } else {
    pose = { x: scooterX + 0, y: GY, hipY: -91, lean: 0, tilt: 0, legs: [[100, 48], [96, 44]], arms: [[35, 95], [40, 100]], expr: 'neutral', blink: blinkAt(t), look: { x: 4, y: 0 } };
  }
  const d = person(Object.assign({ s: S }, pose));
  const pu = seg(t, mountT + 0.1, mountT + 1.1);
  let pcar = '';
  if (pu > 0) pcar = car({ x: lerp(-560, 370, easeOut(pu)) + 6 * Math.sin(t * 6), y: 1575, s: 1.45, color: '#F2F4F8', stripe: '#2A5BD7', id: 'p6', cops: { expr: 'deadpan' }, lightPh: t * 16, wheelRot: -t * 900 });
  g += pcar;
  if (t >= mountT) g += scooter(scooterX, GY, [d.pt.hand1[0], d.pt.hand1[1]], -Dsc * 1.2, K);
  else g += scooter(scX, GY, [scX + 164, GY - 189], 0, K);
  if (t < pickT) g += bag(bagX, GY, 0);
  g += d.svg;
  if (t >= pickT) g += bag(d.pt.hand1[0] + 6, d.pt.hand1[1] + 90, 8 * Math.sin(t * 12));
  // phone in his hand while he is slumped
  if (t < becomeT + 0.1) { const buzz = t > unlockT - 0.25 ? 4 * Math.sin(t * 50) : 0; g += `<g transform="translate(${n2(d.pt.hand1[0] + 10 + buzz)},${n2(d.pt.hand1[1] - 6)}) rotate(-18)"><rect x="-24" y="-42" width="48" height="84" rx="10" fill="#14161C" stroke="${ink}" stroke-width="5"/><rect x="-18" y="-34" width="36" height="66" rx="6" fill="${t > unlockT - 0.1 ? '#FFE9A6' : '#3A4660'}"/></g>`; }
  // police car follows the scooter
  let o = g + missionCard(t) + hud(t, 0, 0, t, '₹0', '#FF5A5A');
  o += bubble(t, T6 + 0.45, T6 + 1.9, ['So tired...'], 520, 960, 480, 1090);
  o += bubble(t, unlockT + 0.55, unlockT + 1.7, ['A mission!'], 520, 960, 480, 1090);
  o += bubble(t, becomeT + 0.1, becomeT + 1.15, ['Delivery time!'], 520, 760, 500, 930);
  o += bubble(t, mountT + 0.35, END_T - 0.1, ['Not again!'], 500, 960, 700, 1120);
  return o;
}
SCENES[3] = scene3; SCENES[4] = scene4; SCENES[5] = scene5; SCENES[6] = scene6;
