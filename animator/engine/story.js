/* Image-based "story" scenes: glossy 2D characters (PNG sprites with 3-5 expressions) acting on painted backgrounds.
   Scene type "story". Everything is a pure function of time t so frames can be rendered in parallel.

   data = {
     bg: "soil|sunny|rainy", bg_at: [{line, dt, bg}]        background (and later swaps with a cross-fade)
     cam: {z0, z1, x, y}                                      slow push-in; per line "cam": {z, x, y, dur} moves the camera
     cast: [{id, char, x, y, h, mood, flip, hidden, z, float}] x,y = feet position as 0..1 of the stage, h = body height (0..1 of stage height)
     props: [{type: "root"|"mound", ...}]
     lines: [{who, text, mood, set:{id:mood}, pause, label, chips, cam, bg, do:[acts], fx:[effects]}]
   }
   acts  (dt = seconds after the line's voice starts, dur = seconds):
     move {to:[x,y]}  scale {to}  rot {to}  appear  vanish  morph {to:"sprouty", h}  mood {mood}
     hop {n}  shake  wiggle  spin  squash  emote {emote:"!|?|zzz|heart|star|sweat"}
   fx    : rain {x0,x1,y0,y1,n} sparkle {x,y} rays {x,y} ripple {x,y} swirl {x,y} glow {x,y} bubbles {x,y0,y1,x}  dust {x,y}
   chips : [{icon:"drop|air|warm|sun|seed|leaf|co2", text:"WATER"}]  (small badges at the top; [] clears them)
   Timing fields t0, t1, env (mouth levels per frame) are filled in by the pipeline. */
(function () {
  const X = window.X, S = window.Scenes;
  const { el, clamp, prog, eo, eio, eob, rnd, lerp } = X;
  const W = 720, H = 1228, BASE = 'assets/seed/';
  const MAN = window.SEED_MANIFEST || { chars: {}, bgs: {} };
  X.preload = X.preload || [];
  const loaded = {};
  const preload = src => { if (!loaded[src]) { loaded[src] = 1; const i = new Image(); i.src = src; X.preload.push(i.decode().catch(() => { })); } return src; };
  const INK = '#2a1830';
  const bounce = u => { u = clamp(u); const n1 = 7.5625, d1 = 2.75; if (u < 1 / d1) return n1 * u * u; if (u < 2 / d1) return n1 * (u -= 1.5 / d1) * u + .75; if (u < 2.5 / d1) return n1 * (u -= 2.25 / d1) * u + .9375; return n1 * (u -= 2.625 / d1) * u + .984375; };

  /* mood -> sprite expression. i = idle expression, p = [mouth closed, mouth open] while talking, e = energy of the talking bounce */
  const MOOD = {
    happy: { i: 1, p: [1, 2], e: 1 }, joy: { i: 1, p: [1, 2], e: 1.5 }, excited: { i: 1, p: [1, 2], e: 1.6 }, giggle: { i: 1, p: [1, 2], e: 1.4 },
    proud: { i: 1, p: [1, 2], e: 1 }, cool: { i: 1, p: [1, 2], e: .8 }, love: { i: 1, p: [1, 2], e: 1 }, hopeful: { i: 1, p: [1, 2], e: 1 },
    determined: { i: 1, p: [1, 2], e: 1.2 }, thinking: { i: 1, p: [1, 2], e: .7 }, wink: { i: 1, p: [1, 2], e: 1 }, calm: { i: 5, p: [1, 2], e: .6 },
    shocked: { i: 3, p: [3, 3], e: 1.5 }, surprised: { i: 3, p: [3, 3], e: 1.3 }, scared: { i: 3, p: [3, 3], e: 1.5 }, dizzy: { i: 3, p: [3, 3], e: 1 }, yawn: { i: 3, p: [3, 3], e: .5 },
    worried: { i: 4, p: [4, 4], e: .8 }, sad: { i: 4, p: [4, 4], e: .6 }, cry: { i: 4, p: [4, 4], e: .8 }, tired: { i: 4, p: [4, 4], e: .5 }, angry: { i: 4, p: [4, 4], e: 1.2 },
    sleepy: { i: 5, p: [5, 5], e: .5 },
  };
  const FALLBACK = { 3: 2, 4: 1, 5: 1, 2: 1, 1: 1 };
  const pick = (man, e) => (man.exprs.indexOf(e) >= 0 ? e : (man.exprs.indexOf(FALLBACK[e]) >= 0 ? FALLBACK[e] : man.exprs[0]));

  /* ------------------------------------------------------------ small vector helpers */
  const star4 = (r) => `M0 ${-r} Q ${r * .16} ${-r * .16} ${r} 0 Q ${r * .16} ${r * .16} 0 ${r} Q ${-r * .16} ${r * .16} ${-r} 0 Q ${-r * .16} ${-r * .16} 0 ${-r}Z`;
  const dropPath = 'M0 -20 C 9 -6 13 2 13 8 A 13 13 0 0 1 -13 8 C -13 2 -9 -6 0 -20 Z';
  function mkDrop(parent, s) {
    const g = el('g', {}, parent), i = el('g', { transform: `scale(${s})` }, g);
    el('path', { d: dropPath, fill: '#3db8ff', stroke: '#0f3f8f', 'stroke-width': 3, 'stroke-linejoin': 'round' }, i);
    el('ellipse', { cx: -4.5, cy: 3, rx: 2.6, ry: 5, fill: '#fff', opacity: .8, transform: 'rotate(18 -4.5 3)' }, i);
    return g;
  }
  const ICONS = {
    drop: (g) => { el('path', { d: 'M12 2.5 C 9 8 5.5 12 5.5 15.5 a6.5 6.5 0 0 0 13 0 C18.5 12 15 8 12 2.5Z', fill: '#3db8ff', stroke: '#0f3f8f', 'stroke-width': 1.4 }, g); el('ellipse', { cx: 9.3, cy: 15.5, rx: 1.3, ry: 2.6, fill: '#fff', opacity: .85 }, g); },
    air: (g) => { ['M3 8 H14 a3 3 0 1 0 -3 -3', 'M3 12.5 H19 a3 3 0 1 1 -3 3', 'M3 17 H10 a2.5 2.5 0 1 1 -2.5 2.5'].forEach(d => el('path', { d, fill: 'none', stroke: '#5a86c9', 'stroke-width': 2, 'stroke-linecap': 'round' }, g)); },
    warm: (g) => { el('path', { d: 'M12 2 C13 7 18 9 18 15 a6 6 0 0 1 -12 0 C6 12 8 11 8.5 8 C10 9 10.5 10 11 11 C12 8 11 5 12 2Z', fill: '#ff8a1f', stroke: '#b23a00', 'stroke-width': 1.4, 'stroke-linejoin': 'round' }, g); el('path', { d: 'M12 12 C14 14 15 15 15 17 a3 3 0 0 1 -6 0 C9 15 11 14 12 12Z', fill: '#ffd34d' }, g); },
    sun: (g) => { el('circle', { cx: 12, cy: 12, r: 4.8, fill: '#ffd23f', stroke: '#e07b00', 'stroke-width': 1.4 }, g); for (let i = 0; i < 8; i++) el('line', { x1: 12, y1: 2.5, x2: 12, y2: 5.2, stroke: '#e07b00', 'stroke-width': 1.8, 'stroke-linecap': 'round', transform: `rotate(${i * 45} 12 12)` }, g); },
    seed: (g) => { el('path', { d: 'M12 2.5 C16.5 8 18.5 12 17.5 16 C16.5 20 7.5 20 6.5 16 C5.5 12 7.5 8 12 2.5Z', fill: '#f29a2e', stroke: '#7a3b12', 'stroke-width': 1.5 }, g); },
    leaf: (g) => { el('path', { d: 'M4.5 19.5 C4 10 10 4 20 4 C20 13.5 14.5 19.5 4.5 19.5Z', fill: '#6fd13a', stroke: '#1f6b17', 'stroke-width': 1.5, 'stroke-linejoin': 'round' }, g); el('path', { d: 'M5 19 C9 14 13 10 17 7', fill: 'none', stroke: '#1f6b17', 'stroke-width': 1.3 }, g); },
    co2: (g) => { X.text(g, 'CO', 11, 14.5, 9, '#35506f', 800, 'middle'); X.text(g, '2', 18.2, 17, 6, '#35506f', 800, 'middle'); },
    sugar: (g) => { el('rect', { x: 5.5, y: 6, width: 13, height: 12, rx: 2.4, fill: '#fff', stroke: '#9aa8c4', 'stroke-width': 1.5 }, g); el('path', { d: 'M8 11 l3 -2 l3 2 M8 15 l3 -2 l3 2', fill: 'none', stroke: '#ff7ab6', 'stroke-width': 1.3, 'stroke-linecap': 'round' }, g); },
  };

  /* ----------------------------------------------------------------- the scene */
  S.story = function (g, d) {
    const FPS = d.fps || 30;
    const lines = (d.lines || []).map((L, i) => Object.assign({ t0: i * 2.2, t1: i * 2.2 + 2, env: '' }, L));
    const NL = lines.length;
    const camG = el('g', {}, g);
    const bgG = el('g', {}, camG), underG = el('g', {}, camG), worldG = el('g', {}, camG), overFxG = el('g', {}, camG), overG = el('g', {}, g);
    const overFx = () => overFxG;
    const lineStart = i => (lines[Math.max(0, Math.min(NL - 1, i))] || { t0: 0 }).t0;
    const evT = (e, L) => L.t0 + (e.dt || 0);

    /* ---- backgrounds with cross-fades */
    const bgKeys = [d.bg || 'soil'];
    const bgTrack = [{ t: -9, bg: bgKeys[0] }];
    lines.forEach(L => { if (L.bg) { if (bgKeys.indexOf(L.bg) < 0) bgKeys.push(L.bg); bgTrack.push({ t: L.t0 + (L.bg_dt || 0), bg: L.bg }); } });
    const bgEls = {};
    bgKeys.forEach(k => {
      const gi = el('g', {}, bgG);
      const im = el('image', { href: preload(BASE + 'bg_' + k + '.jpg'), x: 0, y: 0, width: W, height: Math.round(W * 1376 / 768), preserveAspectRatio: 'none' }, gi);
      bgEls[k] = gi;
    });
    /* ---- cast */
    const cast = (d.cast || []).map((c, ci) => {
      const o = Object.assign({ x: .5, y: .75, h: .3, mood: 'happy', flip: false }, c);
      o.id = o.id || o.char; o.variants = {};
      o.base = o.char; o.ci = ci;
      return o;
    });
    const byId = {}; cast.forEach(c => byId[c.id] = c);
    /* gather acts */
    const acts = [];   // {id, type, t, dur, ...}
    lines.forEach((L, li) => (L.do || []).forEach(a => acts.push(Object.assign({ dur: .8 }, a, { t: evT(a, L), li }))));
    cast.forEach(c => { if (c.hidden) c.a0 = 0; });
    /* sprites */
    const worldItems = [];
    cast.forEach(c => {
      const chars = [c.char]; acts.forEach(a => { if (a.id === c.id && a.type === 'morph' && chars.indexOf(a.to) < 0) chars.push(a.to); });
      c.g = el('g', {}, worldG);
      c.back = el('g', {}, c.g);                      // roots etc. (behind sprite)
      c.flipG = el('g', c.flip ? { transform: 'scale(-1 1)' } : {}, c.g);
      c.top = el('g', {}, c.g);                       // emotes
      c.vs = {};
      chars.forEach(v => {
        const man = MAN.chars[v]; if (!man) return;
        const hv = (v === c.char) ? c.h : ((acts.find(a => a.id === c.id && a.type === 'morph' && a.to === v) || {}).h || c.h);
        const k = hv * H / man.bh;
        const vg = el('g', { display: 'none' }, c.flipG);
        const ims = {};
        man.exprs.forEach(e => { ims[e] = el('image', { href: preload(BASE + v + '_' + e + '.png'), x: -man.ax * k, y: -man.ay * k, width: man.w * k, height: man.h * k, opacity: 0 }, vg); });
        c.vs[v] = { g: vg, ims, man, k, last: -1 };
      });
      c.z = (c.z != null) ? c.z : c.y;
    });
    cast.slice().sort((a, b) => a.z - b.z).forEach(c => worldG.appendChild(c.g));
    /* props: roots (follow a character) and mounds */
    const props = (d.props || []).map(p => {
      const o = Object.assign({ dur: 1.4, color: '#f6dfae', edge: '#7a4a22' }, p);
      const L = lines[o.line != null ? o.line : 0] || lines[0]; o.t = (L ? L.t0 : 0) + (o.dt || 0);
      if (o.type === 'root') {
        const host = byId[o.follow]; const parent = host ? host.back : worldG;
        o.g = el('g', host ? {} : { transform: `translate(${o.x * W} ${o.y * H})` }, parent);
        o.paths = (o.paths || []).map((pts, pi) => {
          const d_ = catmull(pts), w = pi === 0 ? 15 : 9;
          const a = el('path', { d: d_, fill: 'none', stroke: o.edge, 'stroke-width': w + 7, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }, o.g);
          const b = el('path', { d: d_, fill: 'none', stroke: o.color, 'stroke-width': w, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }, o.g);
          const L2 = a.getTotalLength(); [a, b].forEach(p => { p.setAttribute('stroke-dasharray', L2 + 1); p.setAttribute('stroke-dashoffset', L2 + 1); });
          return { a, b, L: L2 + 1, delay: pi === 0 ? 0 : .25 + .18 * pi };
        });
      } else if (o.type === 'mound') {
        const w = o.w || 240;
        o.g = el('g', { display: 'none' }, worldG);
        const gg = el('g', { transform: `translate(${o.x * W} ${o.y * H})` }, o.g); o.inner = gg;
        el('path', { d: `M ${-w / 2} 0 C ${-w * .42} ${-w * .3} ${-w * .18} ${-w * .34} 0 ${-w * .34} C ${w * .18} ${-w * .34} ${w * .42} ${-w * .3} ${w / 2} 0 Z`, fill: '#7a4a22', stroke: '#4a2c12', 'stroke-width': 5, 'stroke-linejoin': 'round' }, gg);
        el('path', { d: `M ${-w * .36} ${-w * .12} C ${-w * .25} ${-w * .26} ${-w * .1} ${-w * .3} ${w * .05} ${-w * .3}`, fill: 'none', stroke: '#a8713a', 'stroke-width': 7, 'stroke-linecap': 'round', opacity: .8 }, gg);
        [[-.28, -.14], [.22, -.1], [.0, -.2]].forEach(([px, py], i) => el('circle', { cx: px * w, cy: py * w, r: 6 + i * 2, fill: '#5e3a1a', opacity: .7 }, gg));
        el('rect', { x: -w * .6, y: -3, width: w * 1.2, height: 6, rx: 3, fill: '#3f7a1c' }, gg);
        o.zlayer = true;
      }
      return o;
    });
    props.filter(p => p.type === 'mound').forEach(p => worldG.appendChild(p.g));
    /* ---- fx */
    const fxs = [];
    lines.forEach((L, li) => (L.fx || []).forEach((f, fi) => {
      const o = Object.assign({ dur: 2 }, f, { t: evT(f, L), id: li * 10 + fi });
      const G = el('g', { display: 'none' }, o.under ? underG : overFxG); o.g = G; build(o, G); fxs.push(o);
    }));

    function build(o, G) {
      const r = (n) => rnd(o.id * 17 + n);
      switch (o.type) {
        case 'rain': {
          o.drops = Array.from({ length: o.n || 26 }, (_, i) => ({ g: mkDrop(G, .55 + r(i) * .35), x: lerp(o.x0 != null ? o.x0 : 0, o.x1 != null ? o.x1 : W, r(i + 40)), ph: r(i + 80), sp: 780 + r(i + 5) * 340 }));
          o.rings = Array.from({ length: 8 }, (_, i) => ({ e: el('ellipse', { fill: 'none', stroke: '#bfe8ff', 'stroke-width': 3 }, G), x: lerp(o.x0 != null ? o.x0 : 40, o.x1 != null ? o.x1 : W - 40, r(i + 120)), ph: r(i + 160) }));
          break;
        }
        case 'sparkle': o.sp = Array.from({ length: 12 }, (_, i) => ({ e: el('path', { d: star4(8 + r(i) * 9), fill: i % 3 ? '#fff6a8' : '#ffffff', stroke: '#ffb627', 'stroke-width': 1.2 }, G), a: i / 12 * 6.283 + r(i + 3), R: 90 + r(i + 9) * 90, rot: r(i + 7) * 90 })); break;
        case 'rays': o.rays = Array.from({ length: 9 }, (_, i) => el('path', { d: 'M -22 0 L 0 -640 L 22 0 Z', fill: 'url(#rayg)' }, G)); ensureRayGrad(); break;
        case 'ripple': o.rings = [0, 1, 2].map(i => el('ellipse', { fill: 'none', stroke: '#6fd0ff', 'stroke-width': 5 }, G)); break;
        case 'swirl': o.paths = [0, 1, 2].map(i => el('path', { d: `M ${-110} ${-30 + i * 30} C ${-60} ${-60 + i * 30} ${-20} ${i * 30} ${30} ${-30 + i * 30} S ${100} ${-20 + i * 30} ${120} ${-30 + i * 30}`, fill: 'none', stroke: '#fff', 'stroke-width': 7, 'stroke-linecap': 'round', 'stroke-dasharray': '70 190', opacity: .85 }, G)); break;
        case 'glow': o.c = el('circle', { r: 200, fill: 'url(#warmg)' }, G); o.pts = Array.from({ length: 9 }, (_, i) => ({ e: el('circle', { r: 4 + r(i) * 4, fill: '#ffb347' }, G), x: (r(i) - .5) * 220, ph: r(i + 30) })); ensureWarmGrad(); break;
        case 'bubbles': o.bs = Array.from({ length: o.n || 7 }, (_, i) => ({ g: mkDrop(G, .5 + r(i) * .3), ph: r(i + 4), dx: (r(i + 9) - .5) * 40 })); break;
        case 'dust': o.ds = Array.from({ length: 9 }, (_, i) => ({ e: el('circle', { fill: '#b98a56', stroke: '#6b4421', 'stroke-width': 2 }, G), a: -Math.PI * (.1 + .8 * r(i)), R: 40 + r(i + 5) * 70, s: 7 + r(i + 9) * 9 })); break;
      }
    }
    function defs() { return document.querySelector('#svg defs'); }
    function ensureRayGrad() { if (document.getElementById('rayg')) return; const lg = el('linearGradient', { id: 'rayg', x1: 0, y1: 0, x2: 0, y2: 1 }, defs()); lg.setAttribute('gradientTransform', 'rotate(0)'); el('stop', { offset: 0, 'stop-color': '#fff7b0', 'stop-opacity': 0 }, lg); el('stop', { offset: 1, 'stop-color': '#fff7b0', 'stop-opacity': .55 }, lg); }
    function ensureWarmGrad() { if (document.getElementById('warmg')) return; const rg = el('radialGradient', { id: 'warmg' }, defs()); el('stop', { offset: 0, 'stop-color': '#ffb347', 'stop-opacity': .55 }, rg); el('stop', { offset: 1, 'stop-color': '#ffb347', 'stop-opacity': 0 }, rg); }

    /* ---- overlay: label + chips */
    const LY = d.label_y || 88, CY = d.chips_y || 210;
    const labelG = el('g', {}, overG), chipG = el('g', {}, overG);
    const labelBg = el('rect', { rx: 30, ry: 30, height: 60, fill: 'rgba(20,33,61,.86)', stroke: '#ffb627', 'stroke-width': 4 }, labelG);
    const HEAD = d.label_style === 'headline';   // big orange headline text (like the ocean video) instead of a small pill
    const labelTx = X.text(labelG, '', W / 2, 0, 34, '#fff', 800, 'middle', { 'letter-spacing': 2 });
    if (HEAD) { labelTx.setAttribute('fill', '#ff8a1f'); labelTx.setAttribute('stroke', '#14213d'); labelTx.setAttribute('stroke-width', 11); labelTx.setAttribute('paint-order', 'stroke'); labelTx.setAttribute('stroke-linejoin', 'round'); labelTx.setAttribute('font-weight', 900); }
    const labelTrack = []; const chipTrack = [];
    lines.forEach((L, i) => {
      if (L.label != null) labelTrack.push({ t: L.t0 + (L.label_dt || 0), text: String(L.label) });
      if (L.chips) { const cs = L.chips.map(c => Object.assign({}, c, { tAbs: (c.line != null && lines[c.line] ? lines[c.line].t0 : L.t0) + (c.dt || 0) }));
        chipTrack.push({ t: cs.length ? Math.min.apply(null, cs.map(c => c.tAbs)) : L.t0 + (L.chips_dt || 0), chips: cs }); }
    });
    const chipEls = [];
    chipTrack.forEach((ct, ci) => ct.els = ct.chips.map((c, i) => {
      const n = ct.chips.length, cx = W / 2 + (i - (n - 1) / 2) * (n > 3 ? 150 : 190), cy = CY;
      const gg = el('g', { display: 'none' }, chipG);
      const inner = el('g', { transform: `translate(${cx} ${cy})` }, gg);
      el('circle', { r: 52, fill: 'rgba(255,255,255,.93)', stroke: '#14213d', 'stroke-width': 5 }, inner);
      const ic = el('g', { transform: 'translate(-30 -30) scale(2.5)' }, inner); (ICONS[c.icon] || ICONS.seed)(ic);
      const tx = X.text(inner, String(c.text || '').toUpperCase(), 0, 84, 30, '#fff', 800, 'middle', { stroke: '#14213d', 'stroke-width': 7, 'paint-order': 'stroke', 'stroke-linejoin': 'round' });
      return { g: gg, inner, cx, cy, i, tAbs: c.tAbs };
    }));

    /* ---- helpers for tracks */
    const moodTrack = {};  // id -> [{t, mood}]
    cast.forEach(c => moodTrack[c.id] = [{ t: -9, mood: c.mood }]);
    lines.forEach(L => {
      const t = L.t0 - .12;
      if (L.mood && moodTrack[L.who]) moodTrack[L.who].push({ t, mood: L.mood });
      Object.keys(L.set || {}).forEach(k => moodTrack[k] && moodTrack[k].push({ t, mood: L.set[k] }));
    });
    acts.filter(a => a.type === 'mood').forEach(a => moodTrack[a.id] && moodTrack[a.id].push({ t: a.t, mood: a.mood }));
    Object.values(moodTrack).forEach(a => a.sort((x, y) => x.t - y.t));
    const moodAt = (id, t) => { let m = 'happy'; for (const e of moodTrack[id] || []) if (e.t <= t) m = e.mood; return m; };
    const moodChanges = id => (moodTrack[id] || []).slice(1);

    const tweenProps = ['x', 'y', 's', 'rot', 'a'];
    const tweens = {};   // id -> prop -> [{t,dur,to}]
    cast.forEach(c => { tweens[c.id] = { x: [], y: [], s: [], rot: [], a: [] }; });
    acts.forEach(a => {
      const T = tweens[a.id]; if (!T) return;
      if (a.type === 'move') { T.x.push({ t: a.t, dur: a.dur, to: a.to[0], ease: a.ease }); T.y.push({ t: a.t, dur: a.dur, to: a.to[1], ease: a.ease }); }
      if (a.type === 'scale') T.s.push({ t: a.t, dur: a.dur, to: a.to, ease: a.ease });
      if (a.type === 'rot') T.rot.push({ t: a.t, dur: a.dur, to: a.to, ease: a.ease });
      if (a.type === 'appear') T.a.push({ t: a.t, dur: Math.min(a.dur, .35), to: 1 });
      if (a.type === 'vanish') T.a.push({ t: a.t, dur: Math.min(a.dur, .4), to: 0 });
    });
    Object.keys(tweens).forEach(id => tweenProps.forEach(p => tweens[id][p].sort((a, b) => a.t - b.t)));
    const EASE = { eo, eio, eob, lin: u => u, bounce };
    function val(id, prop, t, init) {
      let v = init;
      for (const e of tweens[id][prop]) {
        if (t >= e.t + e.dur) { v = e.to; continue; }
        if (t > e.t) { const f = (EASE[e.ease] || eio)((t - e.t) / e.dur); v = lerp(v, e.to, f); }
        break;
      }
      return v;
    }
    /* "appear" / "vanish" also pop the scale */
    function popScale(id, t) {
      /* the most recent appear/vanish decides: appear pops in, vanish shrinks away */
      let last = null, first = null;
      acts.forEach(a => { if (a.id !== id || (a.type !== 'appear' && a.type !== 'vanish')) return; if (!first || a.t < first.t) first = a; if (a.t <= t && (!last || a.t >= last.t)) last = a; });
      if (!last) return first && first.type === 'appear' ? .35 : 1;
      if (last.type === 'appear') { const u = (t - last.t) / Math.max(.45, last.dur); return u < 1 ? .35 + .65 * eob(clamp(u)) : 1; }
      return 1 - .6 * clamp((t - last.t) / .4);
    }
    function trans(c, t) {
      const o = { dx: 0, dy: 0, rot: 0, sx: 1, sy: 1, flash: 0 };
      const doHop = (t0, dur, n, hgt) => { const u = (t - t0) / dur; if (u > 0 && u < 1) { const ph = u * n, f = ph - Math.floor(ph); o.dy -= H * hgt * 4 * f * (1 - f) * (1 - u * .35); const land = f < .14 || f > .9 ? 1 : 0; if (land) { o.sy *= .9; o.sx *= 1.07; } else { o.sy *= 1.05; o.sx *= .97; } } };
      acts.forEach(a => {
        if (a.id !== c.id) return; const u = (t - a.t) / (a.dur || .8);
        if (u < 0 || u > 1) return;
        if (a.type === 'hop') doHop(a.t, a.dur, a.n || 2, a.h || .035);
        if (a.type === 'shake') o.dx += Math.sin(u * 40) * 7 * (1 - u);
        if (a.type === 'wiggle') o.rot += Math.sin(u * 6.283 * (a.n || 2)) * 7 * (1 - u * .5);
        if (a.type === 'spin') o.rot += 360 * eo(u);
        if (a.type === 'squash') { o.sy *= 1 - .2 * Math.sin(u * Math.PI); o.sx *= 1 + .14 * Math.sin(u * Math.PI); }
        if (a.type === 'morph') { const f = Math.sin(clamp(u) * Math.PI); o.sy *= 1 + .25 * Math.sin(u * 9) * (1 - u); o.sx *= 1 - .15 * Math.sin(u * 9) * (1 - u); o.flash = Math.max(o.flash, f); }
      });
      moodChanges(c.id).forEach(m => {
        const u = (t - m.t) / .7; if (u < 0 || u > 1) return;
        if (m.mood === 'shocked' || m.mood === 'surprised' || m.mood === 'scared') doHop(m.t, .55, 1, .03);
        else if (m.mood === 'excited' || m.mood === 'joy' || m.mood === 'giggle') doHop(m.t, .7, 2, .022);
        else if (m.mood === 'sad' || m.mood === 'worried' || m.mood === 'cry') { o.sy *= 1 - .05 * Math.sin(u * Math.PI); o.dx += Math.sin(u * 20) * 2 * (1 - u) * (m.mood === 'worried' ? 1 : 0); }
      });
      return o;
    }
    /* ---- speaking */
    const lineAt = t => { for (let i = 0; i < NL; i++) if (t >= lines[i].t0 && t < lines[i].t1 + .08) return i; return -1; };
    function envAt(L, t) {
      const i = Math.floor((t - L.t0) * FPS); if (i < 0) return 0;
      const s = L.env || ''; if (!s) { return (Math.sin(t * 23) + Math.sin(t * 9.1)) > -.2 ? 1 : 0; }
      return i < s.length ? +s[i] : 0;
    }
    /* ---- emotes */
    function emoteDraw(G, kind, u, big) {
      G.innerHTML = '';
      const a = u < .12 ? u / .12 : u > .85 ? (1 - u) / .15 : 1; G.setAttribute('opacity', clamp(a).toFixed(2));
      const pop = .6 + .4 * eob(clamp(u * 5));
      const inner = el('g', { transform: `translate(0 ${-Math.sin(u * 6) * 4}) scale(${pop})` }, G);
      if (kind === '!' || kind === '?') {
        el('circle', { r: 30, fill: kind === '!' ? '#ff4d4d' : '#3d8bff', stroke: '#fff', 'stroke-width': 5 }, inner);
        X.text(inner, kind, 0, 14, 42, '#fff', 900, 'middle');
      } else if (kind === 'zzz') {
        [0, 1, 2].forEach(i => { const uu = ((u * 1.6 + i * .33) % 1); X.text(inner, 'Z', 30 + uu * 40 + i * 6, -uu * 70 - i * 6, 26 + i * 9, '#cfe3ff', 900, 'middle', { stroke: '#2a4a8a', 'stroke-width': 5, 'paint-order': 'stroke', opacity: (1 - uu).toFixed(2) }); });
      } else if (kind === 'sweat') {
        const dd = mkDrop(inner, 1.1); dd.setAttribute('transform', `translate(46 ${-10 + (u * 3 % 1) * 34})`);
      } else if (kind === 'heart') {
        el('path', { d: 'M0 14 C -34 -8 -18 -34 0 -16 C 18 -34 34 -8 0 14Z', fill: '#ff5b8a', stroke: '#fff', 'stroke-width': 4, 'stroke-linejoin': 'round' }, inner);
      } else if (kind === 'star') {
        el('path', { d: star4(28), fill: '#ffe45e', stroke: '#ff9d00', 'stroke-width': 3 }, inner);
      }
    }
    const emotes = [];
    acts.filter(a => a.type === 'emote').forEach(a => { const c = byId[a.id]; if (c) emotes.push({ c, t: a.t, dur: a.dur || 1.2, kind: a.emote || '!', g: el('g', {}, c.top), last: null }); });
    cast.forEach(c => {            // automatic emotes that go with moods
      moodTrack[c.id].forEach((m, i) => {
        const next = moodTrack[c.id][i + 1], end = next ? next.t : 1e9;
        if (m.mood === 'sleepy') emotes.push({ c, t: Math.max(0, m.t), dur: end - Math.max(0, m.t), kind: 'zzz', g: el('g', {}, c.top), auto: 1 });
        if (m.mood === 'worried' && i > 0) emotes.push({ c, t: m.t + .2, dur: Math.min(end - m.t - .2, 2.2), kind: 'sweat', g: el('g', {}, c.top), auto: 1 });
        if ((m.mood === 'shocked' || m.mood === 'scared') && i > 0) emotes.push({ c, t: m.t + .05, dur: 1, kind: '!', g: el('g', {}, c.top), auto: 1 });
        if (m.mood === 'thinking' && i > 0) emotes.push({ c, t: m.t + .1, dur: Math.min(end - m.t, 2.4), kind: '?', g: el('g', {}, c.top), auto: 1 });
        if (m.mood === 'love' && i > 0) emotes.push({ c, t: m.t + .1, dur: 1.6, kind: 'heart', g: el('g', {}, c.top), auto: 1 });
      });
    });

    /* ---- sparkle bursts for morphs */
    acts.filter(a => a.type === 'morph').forEach(a => { const c = byId[a.id]; if (!c) return; const o = { type: 'sparkle', t: a.t, dur: 1.1, follow: c, id: 900 + fxs.length }; o.g = el('g', { display: 'none' }, overFx()); build(o, o.g); fxs.push(o); });

    /* ===================================================== per-frame update */
    return function (t, dur, f) {
      /* camera */
      let z = lerp((d.cam || {}).z0 || 1, (d.cam || {}).z1 || 1.06, clamp(t / Math.max(dur, 1))), cx = (d.cam || {}).x || .5, cy = (d.cam || {}).y || .5;
      lines.forEach(L => { if (!L.cam) return; const t0 = L.t0 + (L.cam.dt || 0), u = eio(prog(t, t0, t0 + (L.cam.dur || 1.2)));
        if (t >= t0) { const pz = L.cam.z != null ? L.cam.z : z; z = lerp(z, pz, u); cx = lerp(cx, L.cam.x != null ? L.cam.x : cx, u); cy = lerp(cy, L.cam.y != null ? L.cam.y : cy, u); } });
      cx = clamp(cx, .5 / z, 1 - .5 / z); cy = clamp(cy, .5 / z, 1 - .5 / z);
      camG.setAttribute('transform', `translate(${W / 2} ${H / 2}) scale(${z.toFixed(4)}) translate(${(-cx * W).toFixed(2)} ${(-cy * H).toFixed(2)})`);
      /* background cross-fade (bg image taller than the stage -> centre it) */
      const bgy = (H - Math.round(W * 1376 / 768)) / 2;
      let cur = bgTrack[0].bg, prev = cur, mixU = 1;
      for (let i = 1; i < bgTrack.length; i++) if (t >= bgTrack[i].t) { prev = cur; cur = bgTrack[i].bg; mixU = clamp((t - bgTrack[i].t) / .6); }
      Object.keys(bgEls).forEach(k => { const e = bgEls[k]; e.firstChild.setAttribute('y', bgy); const o = k === cur ? (prev === cur ? 1 : mixU) : (k === prev && mixU < 1 ? 1 : 0); e.setAttribute('opacity', o); e.setAttribute('display', o > 0 ? 'inline' : 'none'); e.style.zIndex = k === cur ? 2 : 1; });
      if (cur !== prev) bgG.appendChild(bgEls[cur]);

      /* characters */
      const li = lineAt(t), Lc = li >= 0 ? lines[li] : null;
      cast.forEach(c => {
        const T = tweens[c.id];
        let x = val(c.id, 'x', t, c.x), y = val(c.id, 'y', t, c.y), s = val(c.id, 's', t, c.s0 != null ? c.s0 : 1), rot = val(c.id, 'rot', t, 0), a = val(c.id, 'a', t, c.hidden ? 0 : 1);
        s *= popScale(c.id, t);
        if (c.hidden && a <= 0.01 && !acts.some(q => q.id === c.id && q.type === 'appear' && t >= q.t)) { c.g.setAttribute('display', 'none'); return; }
        const tr = trans(c, t);
        const mood = moodAt(c.id, t), MD = MOOD[mood] || MOOD.happy;
        /* talking */
        const speaking = Lc && Lc.who === c.id && t >= Lc.t0 && t < Lc.t1 + .02;
        let lvl = 0; if (speaking) lvl = envAt(Lc, t);
        const idle = Math.sin(t * 2.6 + c.ci * 1.7);
        const flt = (c.float || /^(ray|cloud)$/.test(c.char)) ? Math.sin(t * 1.7 + c.ci) * 9 : 0;
        const talkPulse = speaking ? (.014 * MD.e * lvl) : 0;
        const sy = (1 + .012 * idle + talkPulse) * tr.sy, sx = (1 - .008 * idle - talkPulse * .4) * tr.sx;
        c.g.setAttribute('transform', `translate(${(x * W + tr.dx).toFixed(2)} ${(y * H + tr.dy + flt).toFixed(2)}) rotate(${(rot + tr.rot + (speaking ? Math.sin(t * 7) * 1.2 * MD.e : Math.sin(t * 1.4 + c.ci) * .8)).toFixed(2)}) scale(${(sx * s).toFixed(4)} ${(sy * s).toFixed(4)})`);
        c.g.setAttribute('opacity', clamp(a).toFixed(3)); c.g.setAttribute('display', a <= .003 ? 'none' : 'inline');
        /* which variant (morph) */
        let v = c.char; acts.forEach(q => { if (q.id === c.id && q.type === 'morph' && t >= q.t + q.dur * .35) v = q.to; });
        const V = c.vs[v] || c.vs[c.char]; if (!V) return;
        /* expression */
        let e;
        if (speaking) e = MD.p[lvl > 0 ? 1 : 0]; else e = MD.i;
        if ((e === 1 || e === 2) && !(Lc && Lc.who === c.id && !lvl && false)) { const per = 3.1 + rnd(c.ci * 5) * 1.6, ph = ((t + rnd(c.ci * 3) * 3) % per); if (ph < .13) e = 5; }
        e = pick(V.man, e);
        Object.keys(c.vs).forEach(k => { const VV = c.vs[k]; VV.g.setAttribute('display', VV === V ? 'inline' : 'none'); });
        if (V.last !== e) { Object.keys(V.ims).forEach(k => V.ims[k].setAttribute('opacity', +k === e ? 1 : 0)); V.last = e; }
        c.flipG.style.filter = tr.flash > .02 ? `brightness(${(1 + tr.flash * 1.4).toFixed(2)}) saturate(${(1 - tr.flash * .4).toFixed(2)})` : '';
        c.curPos = { x: x * W, y: y * H, top: y * H - V.man.ay * V.k * s };
        /* emote placement above head */
        c.top.setAttribute('transform', `translate(0 ${(-V.man.ay * V.k - 44).toFixed(1)})`);
      });
      /* emotes live inside c.g (scaled); counter-scale not needed since small */
      emotes.forEach(m => { const u = (t - m.t) / m.dur; const on = u >= 0 && u <= 1 && m.c.g.getAttribute('display') !== 'none'; m.g.setAttribute('display', on ? 'inline' : 'none'); if (on) emoteDraw(m.g, m.kind, u); });
      /* props */
      props.forEach(p => {
        const u = (t - p.t);
        if (p.type === 'root') { const k = clamp(u / p.dur); p.paths.forEach(q => { const kk = clamp((u - q.delay * p.dur * .5) / p.dur); const off = q.L * (1 - eio(kk)); q.a.setAttribute('stroke-dashoffset', off); q.b.setAttribute('stroke-dashoffset', off); }); }
        if (p.type === 'mound') { const k = clamp(u / .5); p.g.setAttribute('display', u >= 0 ? 'inline' : 'none'); const s = eob(k); p.inner.setAttribute('transform', `translate(${p.x * W} ${p.y * H}) scale(${s.toFixed(3)} ${s.toFixed(3)})`); }
      });
      /* fx */
      fxs.forEach(o => {
        const u = (t - o.t) / o.dur; const on = u >= 0 && u <= 1;
        o.g.setAttribute('display', on ? 'inline' : 'none'); if (!on) return;
        const fade = Math.min(1, u * 6, (1 - u) * 5);
        let ox = o.x != null ? o.x * W : 0, oy = o.y != null ? o.y * H : 0;
        if (o.follow && o.follow.curPos) { ox = o.follow.curPos.x; oy = (o.follow.curPos.y + o.follow.curPos.top) / 2; }
        const tt = t - o.t;
        o.g.setAttribute('opacity', fade.toFixed(3));
        switch (o.type) {
          case 'rain': {
            const y0 = (o.y0 != null ? o.y0 : .05) * H, y1 = (o.y1 != null ? o.y1 : .85) * H;
            o.drops.forEach(dp => { const per = (y1 - y0) / dp.sp, ph = ((tt / per) + dp.ph) % 1; dp.g.setAttribute('transform', `translate(${dp.x.toFixed(1)} ${(y0 + ph * (y1 - y0)).toFixed(1)}) rotate(8)`); });
            o.rings.forEach(rg => { const ph = ((tt * .9) + rg.ph) % 1; rg.e.setAttribute('cx', rg.x); rg.e.setAttribute('cy', y1 + rg.ph * 40); rg.e.setAttribute('rx', 6 + ph * 34); rg.e.setAttribute('ry', 2 + ph * 11); rg.e.setAttribute('opacity', (1 - ph).toFixed(2)); });
            break; }
          case 'sparkle': o.sp.forEach(p => { const k = eo(u); p.e.setAttribute('transform', `translate(${(ox + Math.cos(p.a) * p.R * k).toFixed(1)} ${(oy + Math.sin(p.a) * p.R * k - 20 * k).toFixed(1)}) rotate(${p.rot + u * 200}) scale(${(1 - u * .7).toFixed(2)})`); }); break;
          case 'rays': o.g.setAttribute('transform', `translate(${ox} ${oy})`); o.rays.forEach((r, i) => r.setAttribute('transform', `rotate(${(i * 40 + tt * 10 + 100).toFixed(1)})`)); break;
          case 'ripple': o.rings.forEach((r, i) => { const ph = ((tt * .8) + i / 3) % 1; r.setAttribute('cx', ox); r.setAttribute('cy', oy); r.setAttribute('rx', 20 + ph * (o.R || 120)); r.setAttribute('ry', 8 + ph * (o.R || 120) * .35); r.setAttribute('opacity', ((1 - ph) * .9).toFixed(2)); }); break;
          case 'swirl': o.g.setAttribute('transform', `translate(${ox} ${oy})`); o.paths.forEach((p, i) => p.setAttribute('stroke-dashoffset', (-tt * 160 - i * 50).toFixed(1))); break;
          case 'glow': { o.c.setAttribute('cx', ox); o.c.setAttribute('cy', oy); o.c.setAttribute('r', 190 + Math.sin(tt * 3) * 18);
            o.pts.forEach(p => { const ph = ((tt * .5) + p.ph) % 1; p.e.setAttribute('cx', ox + p.x); p.e.setAttribute('cy', oy + 80 - ph * 260); p.e.setAttribute('opacity', (Math.sin(ph * Math.PI)).toFixed(2)); }); break; }
          case 'bubbles': { const ya = (o.y0 != null ? o.y0 : .8) * H, yb = (o.y1 != null ? o.y1 : .3) * H;
            o.bs.forEach(b => { const ph = ((tt * .45) + b.ph) % 1; b.g.setAttribute('transform', `translate(${(ox + b.dx + Math.sin(ph * 12) * 8).toFixed(1)} ${lerp(ya, yb, ph).toFixed(1)})`); b.g.setAttribute('opacity', Math.min(1, ph * 6, (1 - ph) * 4).toFixed(2)); }); break; }
          case 'dust': o.ds.forEach(p => { const k = eo(u); p.e.setAttribute('cx', (ox + Math.cos(p.a) * p.R * k).toFixed(1)); p.e.setAttribute('cy', (oy + Math.sin(p.a) * p.R * k).toFixed(1)); p.e.setAttribute('r', (p.s * (.5 + k)).toFixed(1)); p.e.setAttribute('opacity', (1 - u).toFixed(2)); }); break;
        }
      });
      /* label */
      let lab = ''; let lt = 0; labelTrack.forEach(l => { if (t >= l.t) { lab = l.text; lt = t - l.t; } });
      if (lab) {
        labelG.setAttribute('display', 'inline'); labelTx.textContent = lab;
        if (HEAD) { labelTx.setAttribute('font-size', 70); X.fit(labelTx, 660); }
        const w = Math.min(660, labelTx.getComputedTextLength() + 70); labelTx.setAttribute('y', HEAD ? LY + 24 : LY + 12);
        labelBg.setAttribute('display', HEAD ? 'none' : 'inline'); labelBg.setAttribute('x', W / 2 - w / 2); labelBg.setAttribute('width', w); labelBg.setAttribute('y', LY - 30);
        const k = eob(clamp(lt / .35)); labelG.setAttribute('transform', `translate(${W / 2} ${LY}) scale(${k.toFixed(3)}) translate(${-W / 2} ${-LY})`); labelG.setAttribute('display', 'inline');
      } else labelG.setAttribute('display', 'none');
      /* chips */
      let act = null; chipTrack.forEach(ct => { if (t >= ct.t) act = ct; });
      chipTrack.forEach(ct => ct.els.forEach(e => { if (ct !== act) { e.g.setAttribute('display', 'none'); return; }
        const u = (t - e.tAbs) / .4; e.g.setAttribute('display', u > 0 ? 'inline' : 'none');
        const k = eob(clamp(u)); e.inner.setAttribute('transform', `translate(${e.cx} ${(e.cy + Math.sin(t * 2 + e.i) * 4).toFixed(1)}) scale(${k.toFixed(3)})`); }));
    };
  };

  /* Catmull-Rom through points -> smooth cubic path */
  function catmull(pts) {
    if (pts.length < 2) return '';
    let d = `M ${pts[0][0]} ${pts[0][1]}`;
    for (let i = 0; i < pts.length - 1; i++) {
      const p0 = pts[i - 1] || pts[i], p1 = pts[i], p2 = pts[i + 1], p3 = pts[i + 2] || p2;
      d += ` C ${p1[0] + (p2[0] - p0[0]) / 6} ${p1[1] + (p2[1] - p0[1]) / 6} ${p2[0] - (p3[0] - p1[0]) / 6} ${p2[1] - (p3[1] - p1[1]) / 6} ${p2[0]} ${p2[1]}`;
    }
    return d;
  }
})();
