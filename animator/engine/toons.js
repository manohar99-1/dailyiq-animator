/* Cartoon characters with faces that react to the story. Scene type: "toon".
   data = { cast: [{who, mood, mood2, act, color}], layout: "auto|solo|duo|trio|orbit", at: 0.5, label: "NO MOON!", bg: "space|day" }
   who  : sun earth moon star cloud buddy phone bulb server coin
   mood : happy joy shocked worried sad cry angry sleepy love dizzy cool scared thinking excited
   act  : float hop shake spin vanish appear fall grow shrink
   At fraction `at` of the scene every character switches from `mood` to `mood2`, and `act` events (vanish, appear, fall) fire. */
(function () {
  const X = window.X, S = window.Scenes;
  const { el, clamp, prog, eo, eio, eob, rnd, lerp, text } = X;
  const INK = '#2a1830';
  let UID = 0;

  /* ------------------------------------------------------------ expressions */
  const P0 = { eye: 1, pup: .55, open: 1, arc: 0, brow: 0, browY: 0, mw: 26, curve: .8, mo: 0, blush: .5, tongue: 0,
    sweat: 0, tears: 0, zzz: 0, hearts: 0, stars: 0, shades: 0, excl: 0, ques: 0, tremble: 0, dizzy: 0, lookUp: 0, wink: 0, talk: 0, specs: 0, bags: 0, raise: 0 };
  const MOODS = {
    happy:    {},
    joy:      { arc: 1, mw: 34, curve: 1, mo: .55, blush: 1, stars: 1 },
    excited:  { eye: 1.2, pup: .7, mw: 34, curve: 1, mo: .7, blush: .9, stars: 1, browY: -8 },
    shocked:  { eye: 1.3, pup: .28, browY: -12, mw: 14, curve: 0, mo: 1.5, blush: .1, excl: 1 },
    boo:      { brow: -20, browY: 2, mw: 26, curve: 1, mo: 0, blush: 0, raise: 1 },
    gasp:     { eye: 1.3, pup: .28, browY: -12, mw: 8, curve: 0, mo: .75, blush: 0, excl: 1 },
    fear:     { eye: 1.3, pup: .25, brow: 22, browY: -8, mw: 9, curve: 0, mo: .6, blush: 0, sweat: 1, tremble: 1 },
    scared:   { eye: 1.3, pup: .25, brow: 26, browY: -8, mw: 20, curve: -.3, mo: .8, blush: 0, sweat: 1, tremble: 1 },
    worried:  { eye: 1.05, pup: .5, brow: 22, browY: -4, mw: 22, curve: -.55, mo: .1, blush: .2, sweat: 1 },
    sad:      { pup: .6, brow: 18, mw: 20, curve: -.95, mo: 0, blush: .1, tears: .5 },
    cry:      { pup: .6, brow: 22, mw: 24, curve: -1, mo: .7, blush: .4, tears: 1 },
    angry:    { eye: .95, pup: .6, brow: -24, browY: 5, mw: 26, curve: -.7, mo: .35, blush: 0 },
    sleepy:   { open: .3, pup: .5, mw: 14, curve: .2, mo: .2, blush: .3, zzz: 1, bags: .8 },
    love:     { arc: 1, mw: 28, curve: 1, mo: .2, blush: 1, hearts: 1 },
    dizzy:    { eye: 1.1, pup: .35, mw: 20, curve: -.2, mo: .5, blush: .3, dizzy: 1, stars: 1 },
    cool:     { mw: 28, curve: .6, shades: 1, blush: .2 },
    determined: { eye: 1.05, pup: .7, brow: -16, browY: 3, mw: 24, curve: .45, mo: 0, blush: .3 },
    proud:    { eye: .95, pup: .6, browY: -6, mw: 30, curve: 1, mo: .1, blush: .8, stars: .7, lookUp: .6 },
    yawn:     { open: .15, arc: .5, mw: 22, curve: 0, mo: 1.3, blush: .3, zzz: .6 },
    giggle:   { arc: 1, mw: 36, curve: 1, mo: .9, blush: 1 },
    hopeful:  { eye: 1.25, pup: .78, brow: 8, browY: -7, mw: 20, curve: .7, mo: .1, blush: .5, stars: 1, lookUp: 1 },
    wink:     { wink: 1, mw: 32, curve: 1, mo: .5, blush: .8 },
    tired:    { open: .55, pup: .5, brow: 12, mw: 20, curve: -.3, mo: .15, blush: .2, sweat: .6, bags: .9 },
    smart:    { pup: .6, mw: 20, curve: .35, mo: 0, blush: .2, specs: 1, browY: -3 },
    puzzled:  { pup: .5, brow: 12, browY: -5, mw: 14, curve: -.1, mo: 0, blush: .1, specs: 1, ques: 1, lookUp: .6 },
    deadpan:  { open: .55, pup: .5, brow: -6, mw: 20, curve: 0, mo: 0, blush: 0, bags: .9 },
    thinking: { pup: .5, brow: 10, browY: -4, mw: 14, curve: 0, mo: 0, blush: .2, ques: 1, lookUp: 1 },
  };
  const MOOD_NAMES = Object.keys(MOODS);
  const mix = (a, b, u) => { const o = {}; for (const k in P0) o[k] = lerp(a[k], b[k], u); return o; };
  const moodP = m => Object.assign({}, P0, MOODS[m] || {});

  /* ------------------------------------------------------------------- face */
  function makeFace(parent, noblush) {
    const f = el('g', {}, parent);
    const cheeks = [-1, 1].map(s => el('ellipse', { cx: s * 55, cy: 16, rx: 15, ry: 9, fill: '#ff6f8c' }, f));
    const eyes = [-1, 1].map(s => {
      const g = el('g', {}, f);
      const white = el('circle', { r: 17, fill: '#fff' }, g);
      const pup = el('circle', { r: 9, fill: '#1b1f3a' }, g);
      const hi = el('circle', { r: 3.4, fill: '#fff' }, g); el('circle', { cx: 3, cy: 3, r: 1.6, fill: '#fff', opacity: .7 }, g);
      const arc = el('path', { d: 'M -16 5 Q 0 -17 16 5', fill: 'none', stroke: INK, 'stroke-width': 6.5, 'stroke-linecap': 'round' }, g);
      return { s, g, white, pup, hi, arc };
    });
    const brows = [-1, 1].map(s => ({ s, e: el('line', { x1: -15, y1: 0, x2: 15, y2: 0, stroke: INK, 'stroke-width': 6, 'stroke-linecap': 'round' }, f) }));
    const mouth = el('path', { fill: '#5a1a2b', stroke: INK, 'stroke-width': 5, 'stroke-linejoin': 'round', 'stroke-linecap': 'round' }, f);
    const tongue = el('ellipse', { rx: 10, ry: 6, fill: '#ff6b81' }, f);
    const shades = el('g', {}, f);
    el('rect', { x: -58, y: -28, width: 48, height: 32, rx: 12, fill: '#10142e' }, shades);
    el('rect', { x: 10, y: -28, width: 48, height: 32, rx: 12, fill: '#10142e' }, shades);
    el('rect', { x: -12, y: -22, width: 24, height: 5, fill: '#10142e' }, shades);
    el('rect', { x: -50, y: -24, width: 16, height: 5, rx: 2, fill: '#fff', opacity: .35 }, shades);
    el('rect', { x: 18, y: -24, width: 16, height: 5, rx: 2, fill: '#fff', opacity: .35 }, shades);

    return function (p, t, look, blink) {
      cheeks.forEach(c => c.setAttribute('opacity', noblush ? 0 : (p.blush * .6).toFixed(3)));
      const oy = p.open * blink;
      eyes.forEach(e => {
        const lx = (look.x + (p.dizzy ? Math.cos(t * 9 + e.s) * .9 : 0)) * 6, ly = (look.y - p.lookUp * .9 + (p.dizzy ? Math.sin(t * 9 + e.s) * .9 : 0)) * 6;
        e.g.setAttribute('transform', `translate(${e.s * 34} -8) scale(${p.eye} ${(p.eye * Math.max(.06, oy)).toFixed(3)})`);
        const ar = e.s === 1 ? Math.max(p.arc, p.wink) : p.arc;
        e.white.setAttribute('opacity', (1 - ar).toFixed(3));
        e.pup.setAttribute('r', (17 * p.pup).toFixed(2)); e.pup.setAttribute('cx', lx.toFixed(2)); e.pup.setAttribute('cy', ly.toFixed(2));
        e.pup.setAttribute('opacity', (1 - ar).toFixed(3));
        e.hi.setAttribute('cx', (lx - 4).toFixed(2)); e.hi.setAttribute('cy', (ly - 5).toFixed(2)); e.hi.setAttribute('opacity', (1 - ar).toFixed(3));
        e.arc.setAttribute('opacity', ar.toFixed(3));
      });
      brows.forEach(b => {
        b.e.setAttribute('transform', `translate(${b.s * 34} ${-40 + p.browY}) rotate(${b.s * p.brow})`);
        b.e.setAttribute('opacity', p.shades > .5 ? 0 : 1);
      });
      const tk = p.talk, syl = tk * (.25 + .75 * Math.abs(Math.sin(t * 10.3)) * (.6 + .4 * Math.abs(Math.sin(t * 3.1))));
      const w = p.mw * (1 + tk * .08), my = 28, c = lerp(p.curve, Math.max(.3, p.curve), tk), o = p.mo * (1 - tk * .5) + syl * 1.1;
      const top = my + 22 * c, bot = my + 22 * c + o * 46;
      mouth.setAttribute('d', `M ${-w} ${my} Q 0 ${top} ${w} ${my} Q 0 ${bot} ${-w} ${my} Z`);
      mouth.setAttribute('fill', o > .08 ? '#5a1a2b' : 'none');
      tongue.setAttribute('cx', 0); tongue.setAttribute('cy', (my + 11 * c + o * 36).toFixed(1));
      tongue.setAttribute('rx', (w * .42).toFixed(1)); tongue.setAttribute('ry', (Math.min(1, o * 1.4) * 8).toFixed(1));
      tongue.setAttribute('opacity', o > .3 ? 1 : 0);
      shades.setAttribute('opacity', p.shades.toFixed(3));
    };
  }

  /* ----------------------------------------------------------------- bodies
     Each body is drawn around (0,0) with a nominal radius of 100 units and returns
     { fy: face centre y, fs: face scale, top: y for floating icons, tick(t) }                        */
  const BODIES = {
    sun(g, c) {
      const rays = el('g', {}, g);
      for (let i = 0; i < 12; i++) {
        const a = i * 30;
        el('path', { d: 'M -17 -112 Q 0 -168 17 -112 Z', fill: '#ffb627', transform: `rotate(${a})` }, rays);
      }
      el('circle', { r: 108, fill: '#ffb627' }, g);
      el('circle', { r: 100, fill: c || '#ffd23f' }, g);
      el('path', { d: 'M -70 -45 A 82 82 0 0 1 40 -75', fill: 'none', stroke: '#fff3b0', 'stroke-width': 10, 'stroke-linecap': 'round', opacity: .7 }, g);
      return { fy: 4, fs: 1, top: -175, tick: t => rays.setAttribute('transform', `rotate(${t * 14})`) };
    },
    earth(g, c) {
      const id = 'ce' + (++UID);
      const defs = el('defs', {}, g); const cp = el('clipPath', { id }, defs); el('circle', { r: 100 }, cp);
      el('circle', { r: 108, fill: '#8fdcff', opacity: .3 }, g);
      el('circle', { r: 100, fill: c || '#2e9bda' }, g);
      const land = el('g', { 'clip-path': `url(#${id})` }, g);
      const lg = el('g', {}, land);
      const blobs = ['M -80 -50 Q -50 -90 -20 -60 Q 0 -30 -30 -10 Q -60 10 -85 -20 Z', 'M 30 -70 Q 70 -85 90 -45 Q 80 -10 45 -25 Q 20 -40 30 -70 Z',
        'M -10 40 Q 30 20 55 50 Q 50 90 10 90 Q -25 85 -10 40 Z', 'M -95 40 Q -75 25 -55 45 Q -60 75 -85 70 Z'];
      [-200, 0, 200].forEach(dx => blobs.forEach(d => el('path', { d, fill: '#7bc74d', transform: `translate(${dx} 0)` }, lg)));
      el('circle', { r: 70, cy: 6, fill: '#58b6e8', opacity: .75 }, g);
      el('ellipse', { cx: -38, cy: -62, rx: 30, ry: 12, fill: '#fff', opacity: .25, transform: 'rotate(-30 -38 -62)' }, g);
      return { fy: 2, fs: 1, top: -135, tick: t => lg.setAttribute('transform', `translate(${(t * 7) % 200} 0)`) };
    },
    moon(g, c) {
      el('circle', { r: 112, fill: '#fff6c9', opacity: .16 }, g);
      el('circle', { r: 100, fill: c || '#eee8d5' }, g);
      [[-62, -52, 14], [58, -62, 10], [66, 40, 16], [-70, 50, 11], [10, 82, 9]].forEach(([x, y, r]) => {
        el('circle', { cx: x, cy: y, r, fill: '#d6cfb6' }, g); el('circle', { cx: x + 2, cy: y + 3, r: r * .7, fill: '#c8c0a4', opacity: .7 }, g);
      });
      return { fy: 0, fs: 1, top: -135, tick() {} };
    },
    star(g, c) {
      let d = ''; for (let i = 0; i < 10; i++) { const r = i % 2 ? 52 : 118, a = -Math.PI / 2 + i * Math.PI / 5; d += (i ? 'L' : 'M') + (r * Math.cos(a)).toFixed(1) + ' ' + (r * Math.sin(a)).toFixed(1); }
      el('path', { d: d + 'Z', fill: c || '#ffd23f', stroke: c || '#ffd23f', 'stroke-width': 18, 'stroke-linejoin': 'round' }, g);
      return { fy: 12, fs: .75, top: -140, tick() {} };
    },
    cloud(g, c) {
      const col = c || '#eaf2ff';
      [[-60, 20, 52], [0, -10, 70], [62, 14, 56]].forEach(([x, y, r]) => el('circle', { cx: x, cy: y, r, fill: col }, g));
      el('rect', { x: -110, y: 10, width: 220, height: 62, rx: 31, fill: col }, g);
      return { fy: 14, fs: .85, top: -105, tick() {} };
    },
    buddy(g, c) {
      const col = c || '#6f8bff';
      el('line', { x1: 0, y1: -92, x2: 0, y2: -128, stroke: col, 'stroke-width': 7, 'stroke-linecap': 'round' }, g);
      const ball = el('circle', { cy: -136, r: 12, fill: '#ff8a1f' }, g);
      el('circle', { r: 100, fill: col }, g);
      el('ellipse', { cx: 0, cy: 38, rx: 62, ry: 48, fill: '#fff', opacity: .14 }, g);
      el('path', { d: 'M -72 -48 A 90 90 0 0 1 20 -88', fill: 'none', stroke: '#fff', 'stroke-width': 10, 'stroke-linecap': 'round', opacity: .35 }, g);
      return { fy: 0, fs: 1, top: -160, tick: t => ball.setAttribute('cy', (-136 + Math.sin(t * 4) * 3).toFixed(1)) };
    },
    phone(g, c) {
      el('rect', { x: -72, y: -118, width: 144, height: 236, rx: 26, fill: c || '#4b5bd6' }, g);
      el('rect', { x: -62, y: -104, width: 124, height: 200, rx: 16, fill: '#c9d6ff' }, g);
      el('rect', { x: -22, y: 102, width: 44, height: 6, rx: 3, fill: '#fff', opacity: .6 }, g);
      return { fy: -14, fs: .72, top: -150, tick() {} };
    },
    bulb(g, c) {
      el('circle', { r: 150, cy: -20, fill: '#ffe066', opacity: .14 }, g);
      el('circle', { cy: -20, r: 92, fill: c || '#ffe066' }, g);
      el('path', { d: 'M -46 54 L 46 54 L 36 96 L -36 96 Z', fill: '#c6cde6' }, g);
      el('rect', { x: -34, y: 96, width: 68, height: 14, rx: 7, fill: '#8f9bc4' }, g);
      el('path', { d: 'M -60 -62 A 80 80 0 0 1 10 -102', fill: 'none', stroke: '#fff', 'stroke-width': 9, 'stroke-linecap': 'round', opacity: .5 }, g);
      return { fy: -22, fs: .95, top: -140, tick() {} };
    },
    server(g, c) {
      const col = c || '#4b5a8a';
      el('rect', { x: -88, y: -112, width: 176, height: 224, rx: 22, fill: col }, g);
      el('rect', { x: -88, y: 52, width: 176, height: 60, rx: 22, fill: '#000', opacity: .18 }, g);
      [-60, -30, 0].forEach((x, i) => el('circle', { cx: 48 + (i - 1) * 24, cy: 82, r: 6, fill: ['#4ff0a8', '#ffd34d', '#ff8a1f'][i] }, g));
      return { fy: -20, fs: .85, top: -150, tick() {} };
    },
    coin(g, c) {
      el('circle', { r: 104, fill: '#e09f0a' }, g);
      el('circle', { r: 96, fill: c || '#ffc93c' }, g);
      el('circle', { r: 80, fill: 'none', stroke: '#e8a90f', 'stroke-width': 5, 'stroke-dasharray': '10 8' }, g);
      return { fy: 0, fs: .9, top: -135, tick() {} };
    },
  };

  /* ---------------------------------------------------------- sea life
     Side-on bodies that face LEFT, each with a wagging tail / moving fins (tick). */
  const tailG = (g, x, y) => { const o = el('g', { transform: `translate(${x} ${y})` }, g); return el('g', {}, o); };
  BODIES.fish = function (g, c) {
    const col = c || '#ff9f43', fin = '#ff7a1a';
    const tail = tailG(g, 92, 0);
    el('path', { d: 'M -8 0 L 74 -50 Q 56 0 74 50 Z', fill: fin }, tail);
    el('path', { d: 'M -45 -70 Q 0 -128 52 -64 Z', fill: fin }, g);
    el('ellipse', { rx: 108, ry: 82, fill: col }, g);
    el('ellipse', { cx: 0, cy: 40, rx: 80, ry: 34, fill: '#fff', opacity: .2 }, g);
    el('path', { d: 'M 46 -62 Q 66 0 46 62', fill: 'none', stroke: '#fff', 'stroke-width': 12, opacity: .55, 'stroke-linecap': 'round' }, g);
    const sf = el('g', { transform: 'translate(20 34)' }, g); const sfi = el('g', {}, sf);
    el('path', { d: 'M 0 0 Q 36 8 22 40 Q 0 24 0 0 Z', fill: fin }, sfi);
    return { fy: -4, fs: .9, top: -130, tick: t => { tail.setAttribute('transform', `rotate(${Math.sin(t * 7) * 15})`); sfi.setAttribute('transform', `rotate(${Math.sin(t * 7 + 1) * 12})`); } };
  };
  BODIES.whale = function (g, c) {
    const col = c || '#4a7bd0';
    const tail = tailG(g, 118, -10);
    el('path', { d: 'M 0 12 Q 34 -20 48 -70 Q 66 -40 106 -52 Q 92 -8 44 14 Z', fill: '#3b66b8' }, tail);
    el('ellipse', { rx: 142, ry: 102, fill: col }, g);
    el('ellipse', { cx: -4, cy: 56, rx: 120, ry: 44, fill: '#d6e6ff', opacity: .9 }, g);
    for (let i = 0; i < 5; i++) el('line', { x1: -70 + i * 26, y1: 70, x2: -62 + i * 26, y2: 92, stroke: '#a9c3ee', 'stroke-width': 3, 'stroke-linecap': 'round' }, g);
    const fl = el('g', { transform: 'translate(40 62)' }, g); const fli = el('g', {}, fl);
    el('path', { d: 'M 0 0 Q 50 20 36 66 Q 6 40 -6 6 Z', fill: '#3b66b8' }, fli);
    const spout = el('g', {}, g); const drops = []; for (let i = 0; i < 5; i++) drops.push(el('circle', { r: 7, fill: '#bfe9ff' }, spout));
    return { fy: -2, fs: 1.05, top: -150, tick: t => {
      tail.setAttribute('transform', `rotate(${Math.sin(t * 3.2) * 10})`); fli.setAttribute('transform', `rotate(${Math.sin(t * 3 + 1) * 10})`);
      drops.forEach((e, i) => { const u = ((t * .8 + i / 5) % 1); e.setAttribute('cx', (-6 + (i - 2) * 16 * u).toFixed(1)); e.setAttribute('cy', (-104 - u * 70 + u * u * 30).toFixed(1)); e.setAttribute('opacity', (Math.sin(u * 3.14) * .9).toFixed(2)); e.setAttribute('r', (6 + 3 * (1 - u)).toFixed(1)); });
    } };
  };
  BODIES.dolphin = function (g, c) {
    const col = c || '#6fa8dc';
    const tail = tailG(g, 112, 0);
    el('path', { d: 'M 0 0 Q 30 -26 52 -56 Q 62 -22 98 -34 Q 84 0 48 8 Q 82 20 98 46 Q 62 38 52 18 Q 30 20 0 8 Z', fill: '#558fc4' }, tail);
    el('path', { d: 'M -20 -76 Q 10 -138 54 -66 Z', fill: '#558fc4' }, g);
    el('ellipse', { rx: 120, ry: 84, fill: col }, g);
    el('ellipse', { cx: -122, cy: 26, rx: 46, ry: 21, fill: '#8fbfe8' }, g);
    el('ellipse', { cx: -4, cy: 44, rx: 100, ry: 34, fill: '#eaf4ff', opacity: .85 }, g);
    const fl = el('g', { transform: 'translate(10 56)' }, g); const fli = el('g', {}, fl);
    el('path', { d: 'M 0 0 Q 40 14 30 52 Q 4 34 -4 6 Z', fill: '#558fc4' }, fli);
    return { fy: -8, fs: .9, top: -140, tick: t => { tail.setAttribute('transform', `rotate(${Math.sin(t * 6) * 16})`); fli.setAttribute('transform', `rotate(${Math.sin(t * 5) * 14})`); } };
  };
  BODIES.shark = function (g, c) {
    const col = c || '#7b8ca3';
    const tail = tailG(g, 116, 0);
    el('path', { d: 'M 0 -6 L 84 -74 L 62 0 L 84 74 L 0 8 Z', fill: '#667690' }, tail);
    el('path', { d: 'M -26 -72 L 22 -156 L 58 -66 Z', fill: '#667690' }, g);
    el('ellipse', { rx: 130, ry: 82, fill: col }, g);
    el('ellipse', { cx: -6, cy: 42, rx: 108, ry: 34, fill: '#e8eef6' }, g);
    [0, 1, 2].forEach(i => el('path', { d: `M ${-86 + i * 12} -6 Q ${-92 + i * 12} 14 ${-86 + i * 12} 34`, fill: 'none', stroke: '#5a6a82', 'stroke-width': 4, 'stroke-linecap': 'round' }, g));
    return { fy: -4, fs: .9, top: -170, tick: t => tail.setAttribute('transform', `rotate(${Math.sin(t * 5) * 14})`) };
  };
  BODIES.jellyfish = function (g, c) {
    const col = c || '#ff8fd1';
    const ten = el('g', {}, g); const ts = [];
    for (let i = 0; i < 5; i++) ts.push(el('path', { fill: 'none', stroke: '#ffb3e1', 'stroke-width': 9, 'stroke-linecap': 'round', opacity: .9 }, ten));
    const dome = el('g', {}, g);
    el('path', { d: 'M -104 24 A 104 104 0 0 1 104 24 Q 62 46 0 30 Q -62 46 -104 24 Z', fill: col, opacity: .95 }, dome);
    el('path', { d: 'M -78 -30 A 90 90 0 0 1 -10 -80', fill: 'none', stroke: '#fff', 'stroke-width': 9, 'stroke-linecap': 'round', opacity: .45 }, dome);
    return { fy: -26, fs: .92, top: -150, tick: t => {
      const k = 1 + .05 * Math.sin(t * 3); dome.setAttribute('transform', `scale(${(2 - k).toFixed(3)} ${k.toFixed(3)})`);
      ts.forEach((e, i) => { const x = -70 + i * 35, s = Math.sin(t * 3 + i) * 16; e.setAttribute('d', `M ${x} 34 Q ${x + s} 80 ${x} 120 T ${x + s * .6} 190`); });
    } };
  };
  BODIES.octopus = function (g, c) {
    const col = c || '#a566e8';
    const ts = []; const gt = el('g', {}, g);
    for (let i = 0; i < 6; i++) ts.push(el('path', { fill: 'none', stroke: col, 'stroke-width': 24, 'stroke-linecap': 'round' }, gt));
    el('circle', { cy: -12, r: 92, fill: col }, g);
    [[-50, -62, 8], [40, -70, 6], [60, -30, 7]].forEach(([x, y, r]) => el('circle', { cx: x, cy: y, r, fill: '#c79bf5', opacity: .8 }, g));
    el('path', { d: 'M -70 -50 A 84 84 0 0 1 -8 -92', fill: 'none', stroke: '#fff', 'stroke-width': 8, 'stroke-linecap': 'round', opacity: .35 }, g);
    return { fy: -12, fs: 1, top: -130, tick: t => ts.forEach((e, i) => { const x = -80 + i * 32, s = Math.sin(t * 3 + i * 1.3) * 22; e.setAttribute('d', `M ${x * .8} 56 Q ${x + s} 110 ${x * 1.2 + s * .5} 150 T ${x * 1.3 - s * .4} 200`); }) };
  };
  BODIES.turtle = function (g, c) {
    const fl = [-1, 1].map(s => { const o = el('g', { transform: `translate(${s * 96} 26)` }, g); const i = el('g', {}, o); el('ellipse', { rx: 44, ry: 18, fill: '#72cf86', transform: `rotate(${s * 22})` }, i); return { s, i }; });
    el('circle', { r: 114, fill: '#3da35d' }, g);
    el('circle', { r: 114, fill: 'none', stroke: '#2c8248', 'stroke-width': 6, 'stroke-dasharray': '34 14' }, g);
    el('circle', { r: 92, fill: '#8fe3a0' }, g);
    el('path', { d: 'M -70 -44 A 86 86 0 0 1 -6 -88', fill: 'none', stroke: '#fff', 'stroke-width': 8, 'stroke-linecap': 'round', opacity: .35 }, g);
    return { fy: 2, fs: .95, top: -140, tick: t => fl.forEach(f => f.i.setAttribute('transform', `rotate(${f.s * Math.sin(t * 3) * 18})`)) };
  };
  BODIES.crab = function (g, c) {
    const col = c || '#ef5b45', leg = '#d9402b';
    [-1, 1].forEach(s => { [0, 1, 2].forEach(k => el('path', { d: `M ${s * 70} ${20 + k * 14} Q ${s * 120} ${24 + k * 18} ${s * 140} ${70 + k * 14}`, fill: 'none', stroke: leg, 'stroke-width': 9, 'stroke-linecap': 'round' }, g)); });
    const cl = [-1, 1].map(s => { const o = el('g', { transform: `translate(${s * 118} -92)` }, g); const i = el('g', {}, o);
      el('path', { d: `M ${-s * 38} 70 Q ${-s * 10} 30 0 0`, fill: 'none', stroke: leg, 'stroke-width': 12, 'stroke-linecap': 'round' }, i);
      el('path', { d: 'M -26 -4 A 30 30 0 1 1 26 -4 L 8 -4 L 0 -26 L -8 -4 Z', fill: col }, i); return { s, i }; });
    el('ellipse', { rx: 108, ry: 78, fill: col }, g);
    el('ellipse', { cx: 0, cy: 44, rx: 80, ry: 26, fill: '#fff', opacity: .16 }, g);
    return { fy: 4, fs: .95, top: -170, tick: t => cl.forEach(c2 => c2.i.setAttribute('transform', `rotate(${c2.s * (Math.sin(t * 5) * 12)})`)) };
  };
  BODIES.angler = function (g, c) {
    const col = c || '#2b3a67';
    const lure = el('g', {}, g);
    el('path', { d: 'M -10 -84 Q -30 -170 -96 -150', fill: 'none', stroke: col, 'stroke-width': 8, 'stroke-linecap': 'round' }, lure);
    const glow = el('circle', { cx: -96, cy: -150, r: 34, fill: '#fff6a8', opacity: .35 }, lure);
    el('circle', { cx: -96, cy: -150, r: 15, fill: '#fff6a8' }, lure);
    const tail = tailG(g, 100, 8);
    el('path', { d: 'M 0 0 L 60 -34 L 52 0 L 60 34 Z', fill: '#223058' }, tail);
    el('ellipse', { rx: 114, ry: 92, fill: col }, g);
    el('ellipse', { cx: -4, cy: 52, rx: 90, ry: 30, fill: '#4a5c94', opacity: .7 }, g);
    for (let i = 0; i < 7; i++) el('path', { d: `M ${-60 + i * 20} 74 l 6 -22 l 6 22 Z`, fill: '#fff' }, g);
    return { fy: -6, fs: 1, top: -190, tick: t => { glow.setAttribute('r', (30 + 8 * Math.sin(t * 4)).toFixed(1)); glow.setAttribute('opacity', (.3 + .15 * Math.sin(t * 4)).toFixed(2)); tail.setAttribute('transform', `rotate(${Math.sin(t * 5) * 12})`); } };
  };
  BODIES.sub = function (g, c) {
    const col = c || '#ffd23f';
    const prop = el('g', { transform: 'translate(152 0)' }, g); const pi = el('ellipse', { rx: 8, ry: 40, fill: '#c98a00' }, prop);
    el('rect', { x: 26, y: -118, width: 12, height: 52, rx: 5, fill: '#c98a00' }, g); el('rect', { x: 14, y: -122, width: 36, height: 12, rx: 6, fill: '#c98a00' }, g);
    el('rect', { x: -136, y: -70, width: 276, height: 140, rx: 70, fill: col }, g);
    el('rect', { x: -120, y: 34, width: 244, height: 26, rx: 13, fill: '#e6b52c' }, g);
    el('circle', { cx: 100, cy: 8, r: 15, fill: '#9fe3ff', stroke: '#c98a00', 'stroke-width': 6 }, g);
    el('path', { d: 'M -136 -10 L -230 -50 L -230 40 L -136 14 Z', fill: '#fff6a8', opacity: .22 }, g);
    el('circle', { cx: -132, cy: 2, r: 9, fill: '#fff6a8' }, g);
    return { fy: -2, fs: .74, top: -150, tick: t => pi.setAttribute('ry', (40 * Math.abs(Math.cos(t * 20)) + 6).toFixed(1)) };
  };

  window.TOON = window.TOON || {};

  /* ------------------------------------------------------- garden friends */
  BODIES.seed = function (g, c) {
    const col = c || '#b9783f';
    el('path', { d: 'M -12 -98 Q 0 -134 14 -98 Z', fill: '#8f5a2c' }, g);
    el('ellipse', { rx: 86, ry: 106, fill: col }, g);
    el('path', { d: 'M 10 -102 Q 76 -62 60 30 Q 44 88 -8 104 Q 58 66 52 -10 Q 50 -62 10 -102 Z', fill: '#8f5a2c', opacity: .42 }, g);
    el('path', { d: 'M -62 -14 Q -54 -80 -10 -94 Q -50 -52 -46 -6 Z', fill: '#fff', opacity: .3 }, g);
    [[-40, 70, 5], [-18, 84, 4], [52, -70, 4]].forEach(([x, y, r]) => el('circle', { cx: x, cy: y, r, fill: '#8f5a2c', opacity: .5 }, g));
    return { fy: 6, fs: .95, top: -158, tick() {} };
  };
  BODIES.sprout = function (g, c) {
    const col = c || '#86e05a';
    el('ellipse', { cx: 0, cy: 100, rx: 138, ry: 48, fill: '#6f4423' }, g);
    el('ellipse', { cx: 0, cy: 92, rx: 126, ry: 40, fill: '#9a6236' }, g);
    [[-70, 96, 7], [64, 100, 6], [18, 112, 5], [-30, 112, 4]].forEach(([x, y, r]) => el('circle', { cx: x, cy: y, r, fill: '#6f4423' }, g));
    el('rect', { x: -17, y: 50, width: 34, height: 56, fill: '#5fc84a' }, g);
    const lv = [-1, 1].map(s => { const o = el('g', { transform: `translate(${s * 8} -66)` }, g); const i = el('g', {}, o);
      el('path', { d: `M 0 0 Q ${s * 70} -92 ${s * 132} -48 Q ${s * 96} 14 0 0 Z`, fill: '#4fc13d' }, i);
      el('path', { d: `M 4 -4 Q ${s * 60} -50 ${s * 112} -42`, fill: 'none', stroke: '#8cec6a', 'stroke-width': 5, 'stroke-linecap': 'round' }, i); return { s, i }; });
    el('circle', { r: 84, fill: col }, g);
    el('path', { d: 'M -62 -34 A 78 78 0 0 1 -8 -80', fill: 'none', stroke: '#fff', 'stroke-width': 10, 'stroke-linecap': 'round', opacity: .4 }, g);
    return { fy: 2, fs: .92, top: -170, tick: t => lv.forEach(l => l.i.setAttribute('transform', `rotate(${l.s * (Math.sin(t * 2.6) * 7 + 3)})`)) };
  };
  BODIES.flower = function (g, c) {
    const col = c || '#ffd23f';
    el('rect', { x: -12, y: 70, width: 24, height: 150, rx: 8, fill: '#4fc13d' }, g);
    [-1, 1].forEach(s => el('path', { d: `M ${s * 8} 170 Q ${s * 90} 100 ${s * 150} 142 Q ${s * 100} 206 ${s * 8} 180 Z`, fill: '#5fd24a' }, g));
    const pet = el('g', {}, g);
    for (let i = 0; i < 14; i++) el('ellipse', { cx: 0, cy: -108, rx: 24, ry: 46, fill: i % 2 ? col : '#ffc21a', transform: `rotate(${i * 360 / 14})` }, pet);
    el('circle', { r: 92, fill: '#a8703a' }, g);
    el('circle', { r: 82, fill: '#d09a5a' }, g);
    el('path', { d: 'M -60 -36 A 74 74 0 0 1 -8 -74', fill: 'none', stroke: '#fff', 'stroke-width': 8, 'stroke-linecap': 'round', opacity: .35 }, g);
    return { fy: 2, fs: .95, top: -175, tick: t => pet.setAttribute('transform', `rotate(${Math.sin(t * .8) * 6})`) };
  };
  BODIES.drop = function (g, c) {
    el('path', { d: 'M 0 -138 C 44 -66 96 -14 96 44 A 96 96 0 0 1 -96 44 C -96 -14 -44 -66 0 -138 Z', fill: c || '#4cc3ff' }, g);
    el('path', { d: 'M 40 -20 C 66 20 70 60 46 96 C 78 70 84 20 40 -20 Z', fill: '#1f8fd6', opacity: .35 }, g);
    el('path', { d: 'M -58 20 Q -66 56 -44 80', fill: 'none', stroke: '#fff', 'stroke-width': 11, 'stroke-linecap': 'round', opacity: .6 }, g);
    return { fy: 38, fs: .88, top: -170, tick() {} };
  };
  BODIES.worm = function (g, c) {
    const col = c || '#ff9aa8', segs = [];
    for (let i = 4; i >= 1; i--) segs.push(el('circle', { r: 50 - i * 4, fill: i % 2 ? '#ff8c9d' : col }, g));
    el('circle', { r: 76, fill: col }, g);
    el('ellipse', { cx: 0, cy: 46, rx: 54, ry: 18, fill: '#fff', opacity: .18 }, g);
    el('path', { d: 'M -52 -38 A 66 66 0 0 1 -6 -68', fill: 'none', stroke: '#fff', 'stroke-width': 8, 'stroke-linecap': 'round', opacity: .45 }, g);
    return { fy: 2, fs: .88, top: -120, tick: t => segs.forEach((e, k) => { const i = 4 - k; e.setAttribute('cx', 62 + (i - 1) * 46 + i * 6); e.setAttribute('cy', (Math.sin(t * 4 - i * .9) * 14 + 22 + i * 2).toFixed(1)); }) };
  };
  BODIES.soil = function (g, c) {
    const col = c || '#8a5a32';
    el('path', { d: 'M -156 96 Q -150 -42 0 -54 Q 150 -42 156 96 Z', fill: col }, g);
    el('path', { d: 'M -120 -6 Q -90 -40 -30 -44 Q -80 -22 -112 20 Z', fill: '#c28a58', opacity: .6 }, g);
    [[-96, 60, 9], [104, 40, 7], [74, 78, 10], [-52, 80, 6], [20, 86, 5]].forEach(([x, y, r]) => el('circle', { cx: x, cy: y, r, fill: '#6b4325' }, g));
    [[-30, -50, -16], [0, -54, 0], [30, -50, 16]].forEach(([x, y, a]) => el('path', { d: 'M -7 0 Q 0 -44 7 0 Z', fill: '#6ccf4c', transform: `translate(${x} ${y}) rotate(${a})` }, g));
    return { fy: 8, fs: .95, top: -130, tick() {} };
  };

  /* A realistic black hole: dark shadow, thin photon ring, lensed light arcs and a tilted glowing accretion disk (no face). */
  BODIES.blackhole = function (g, c) {
    const id = 'bh' + (++UID);
    const defs = el('defs', {}, g);
    const bl = (n, sd) => { const f = el('filter', { id: id + n, filterUnits: 'userSpaceOnUse', x: -400, y: -300, width: 800, height: 600 }, defs); el('feGaussianBlur', { stdDeviation: sd }, f); };
    bl('a', 14); bl('b', 5); bl('c', 2);
    const lg = el('linearGradient', { id: id + 'g', x1: 0, y1: 0, x2: 1, y2: 0 }, defs);   // doppler beaming: bright on the approaching (left) side
    [[0, '#fff6dc'], [.28, '#ffc65a'], [.62, '#ff7a1a'], [1, '#8a2a08']].forEach(([o, col]) => el('stop', { offset: o, 'stop-color': col }, lg));
    const rg = el('radialGradient', { id: id + 'r' }, defs);
    [[0, 'rgba(255,170,70,.55)'], [.5, 'rgba(255,110,30,.22)'], [1, 'rgba(255,90,20,0)']].forEach(([o, col]) => el('stop', { offset: o, 'stop-color': col }, rg));
    const R = 70, RX = 215, RY = 52;
    el('circle', { r: 250, fill: `url(#${id}r)` }, g);
    // back half of the disk (behind the shadow)
    const back = el('g', {}, g);
    el('path', { d: `M ${-RX} 0 A ${RX} ${RY} 0 0 1 ${RX} 0`, fill: 'none', stroke: `url(#${id}g)`, 'stroke-width': 34, filter: `url(#${id}a)`, opacity: .85 }, back);
    el('path', { d: `M ${-RX * .86} 0 A ${RX * .86} ${RY * .86} 0 0 1 ${RX * .86} 0`, fill: 'none', stroke: `url(#${id}g)`, 'stroke-width': 12, filter: `url(#${id}b)` }, back);
    // lensed light arcs that wrap over the top and under the bottom of the shadow
    el('path', { d: `M ${-R * 1.55} 0 A ${R * 1.55} ${R * 1.5} 0 0 1 ${R * 1.55} 0`, fill: 'none', stroke: `url(#${id}g)`, 'stroke-width': 22, filter: `url(#${id}b)`, opacity: .95 }, g);
    el('path', { d: `M ${-R * 1.3} 14 A ${R * 1.3} ${R * 1.28} 0 0 0 ${R * 1.3} 14`, fill: 'none', stroke: `url(#${id}g)`, 'stroke-width': 14, filter: `url(#${id}b)`, opacity: .8 }, g);
    // shadow + photon ring
    el('circle', { r: R + 3, fill: 'none', stroke: '#ffe2b0', 'stroke-width': 5, filter: `url(#${id}c)`, opacity: .95 }, g);
    el('circle', { r: R, fill: '#000' }, g);
    // front half of the disk, in front of the shadow
    const front = el('g', {}, g);
    el('path', { d: `M ${-RX} 0 A ${RX} ${RY} 0 0 0 ${RX} 0`, fill: 'none', stroke: `url(#${id}g)`, 'stroke-width': 30, filter: `url(#${id}a)`, opacity: .8 }, front);
    el('path', { d: `M ${-RX * .9} 0 A ${RX * .9} ${RY * .9} 0 0 0 ${RX * .9} 0`, fill: 'none', stroke: `url(#${id}g)`, 'stroke-width': 13, filter: `url(#${id}c)` }, front);
    // swirling hot streaks give the disk its spin
    const streaks = [0, 1, 2].map(i => el('ellipse', { rx: RX * (.72 + i * .1), ry: RY * (.72 + i * .1), fill: 'none', stroke: '#fff3d6', 'stroke-width': 3, 'stroke-linecap': 'round', 'stroke-dasharray': '40 170', opacity: .75 }, g));
    return { fy: 0, fs: 0, top: -150, noface: true, tick: t => { g.setAttribute('transform', 'rotate(-16)'); streaks.forEach((e, i) => e.setAttribute('stroke-dashoffset', (-t * (90 + i * 40)).toFixed(1))); } };
  };


  /* ------------------------------------------------------- kitchen friends (noodle video) */
  const NOOD = '#f7d065', NOOD2 = '#e3a93a', OLK = '#3a2412';
  const wavy = (x0, y0, y1, amp, k, ph, step) => { let d = ''; const n = Math.max(2, Math.ceil(Math.abs(y1 - y0) / (step || 8))); for (let i = 0; i <= n; i++) { const y = y0 + (y1 - y0) * i / n, u = i / n; d += (i ? 'L' : 'M') + (x0 + amp * Math.sin(y * k + ph) * (.25 + u)).toFixed(1) + ' ' + y.toFixed(1) + ' '; } return d; };
  BODIES.noodle = function (g, c) {
    const col = c || '#ffdf85';
    const body = el('g', {}, g);
    const tube = (parent, w, stroke) => el('path', { fill: 'none', stroke, 'stroke-width': w, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }, parent);
    const arms = [-1, 1].map(sg => ({ sg, o: tube(body, 24, OLK), i: tube(body, 14, col) }));
    const bOut = tube(body, 64, OLK), hOut = tube(body, 100, OLK), bIn = tube(body, 52, col), hIn = tube(body, 88, col);
    hOut.setAttribute('d', 'M0 -88 L0 -56'); hIn.setAttribute('d', 'M0 -88 L0 -56');
    // red sauce hat with drips
    const hat = el('g', {}, g);
    el('path', { d: 'M-40 -100 Q-44 -150 0 -152 Q46 -150 40 -100 Q30 -86 24 -104 Q20 -78 10 -104 Q0 -92 -8 -104 Q-16 -80 -24 -104 Q-34 -86 -40 -100Z', fill: '#d8362b', stroke: OLK, 'stroke-width': 5, 'stroke-linejoin': 'round' }, hat);
    el('ellipse', { cx: -12, cy: -132, rx: 8, ry: 4, fill: '#ff8a7a' }, hat);
    return { fy: -66, fs: .7, top: -170, noblush: true, tick: (t, p) => {
      const f = p ? Math.max(p.tremble || 0, p.excl * .6 || 0) : 0, ph = -t * (2.2 + f * 8), amp = 40 * (1 + f * .4);
      let d = ''; const Y0 = -100, Y1 = 170;
      for (let i = 0; i <= 60; i++) { const u = i / 60, y = Y0 + (Y1 - Y0) * u, x = amp * Math.min(1, u * 3) * Math.sin(y / 22 + ph); d += (i ? 'L' : 'M') + x.toFixed(1) + ' ' + y.toFixed(1) + ' '; }
      [bOut, bIn].forEach(e => e.setAttribute('d', d)); [hOut, hIn].forEach(e => e.setAttribute('d', 'M0 -96 L0 -62'));
      hat.setAttribute('transform', `translate(0 ${(Math.sin(ph * 2) * 2 * (1 + f * 2)).toFixed(1)})`);
      arms.forEach(a => { const y0 = 0, x0 = a.sg * 24, dd = 'M' + x0 + ' ' + y0 + ' Q' + (x0 + a.sg * 36) + ' ' + (y0 + 6) + ' ' + (x0 + a.sg * 52) + ' ' + (y0 + 38);
        [a.o, a.i].forEach(e => { e.setAttribute('d', dd); e.setAttribute('transform', `rotate(${a.sg * (-34 - f * 50)} ${x0} ${y0})`); }); });
    } };
  };
  BODIES.pot = function (g, c) {
    const id = 'pt' + (++UID);
    el('path', { d: 'M -150 -40 L -150 120 Q -150 160 -110 160 L 110 160 Q 150 160 150 120 L 150 -40 Z', fill: '#98a2b5', stroke: OLK, 'stroke-width': 6, 'stroke-linejoin': 'round' }, g);
    el('path', { d: 'M -128 -20 L -128 120 Q -128 142 -108 142', fill: 'none', stroke: '#fff', 'stroke-width': 10, 'stroke-linecap': 'round', opacity: .35 }, g);
    [-1, 1].forEach(sg => { el('rect', { x: sg > 0 ? 148 : -184, y: -20, width: 36, height: 24, rx: 10, fill: '#5a6275', stroke: OLK, 'stroke-width': 5 }, g); });
    el('ellipse', { cy: -40, rx: 150, ry: 34, fill: '#7c869b', stroke: OLK, 'stroke-width': 6 }, g);
    el('ellipse', { cy: -38, rx: 132, ry: 26, fill: '#4aa8e8' }, g);
    const bubs = [0, 1, 2, 3, 4, 5].map(i => el('circle', { fill: '#cfeeff', stroke: '#fff', 'stroke-width': 2 }, g));
    const steam = [0, 1, 2].map(i => el('path', { d: 'M 0 0 Q 18 -26 0 -52 Q -18 -78 0 -104', fill: 'none', stroke: '#fff', 'stroke-width': 12, 'stroke-linecap': 'round' }, g));
    return { fy: 0, fs: 0, top: -190, noface: true, tick: t => {
      bubs.forEach((b, i) => { const u = (t * .8 + i * .17) % 1; b.setAttribute('cx', (-100 + i * 40 + Math.sin(t * 3 + i) * 8).toFixed(1)); b.setAttribute('cy', (-38 - Math.sin(u * 3.14) * 10 - 10 * u).toFixed(1)); b.setAttribute('r', (3 + 8 * Math.sin(u * 3.14)).toFixed(1)); });
      steam.forEach((s, i) => { const u = (t * .5 + i / 3) % 1; s.setAttribute('transform', `translate(${-70 + i * 70} ${-50 - u * 70})`); s.setAttribute('opacity', (.8 * Math.sin(u * 3.14)).toFixed(2)); });
    } };
  };
  BODIES.bowl = function (g, c) {
    el('path', { d: 'M -170 -10 L 170 -10 Q 160 150 60 178 L -60 178 Q -160 150 -170 -10 Z', fill: '#f4f4f8', stroke: OLK, 'stroke-width': 6, 'stroke-linejoin': 'round' }, g);
    el('path', { d: 'M -156 40 Q 0 74 156 40 L 150 70 Q 0 108 -150 70 Z', fill: '#e8483f' }, g);
    el('path', { d: 'M -60 178 L 60 178 L 70 200 L -70 200 Z', fill: '#c9ccd8', stroke: OLK, 'stroke-width': 5, 'stroke-linejoin': 'round' }, g);
    el('path', { d: 'M -140 10 Q -130 110 -60 150', fill: 'none', stroke: '#fff', 'stroke-width': 9, 'stroke-linecap': 'round', opacity: .7 }, g);
    el('ellipse', { cy: -10, rx: 170, ry: 36, fill: '#5a2a18', stroke: OLK, 'stroke-width': 6 }, g);
    el('ellipse', { cy: -14, rx: 150, ry: 26, fill: '#c9501f' }, g);
    [[-90, -14], [-30, -6], [40, -16], [100, -8]].forEach(([x, y], i) => { el('circle', { cx: x, cy: y, r: 6, fill: '#ffd9a0', opacity: .7 }, g); });
    el('path', { d: 'M 60 -16 q 16 -22 34 -6 q -10 12 -34 6 Z', fill: '#4fae4f', stroke: OLK, 'stroke-width': 3 }, g);
    const steam = [0, 1, 2].map(() => el('path', { d: 'M 0 0 Q 16 -22 0 -44 Q -16 -66 0 -88', fill: 'none', stroke: '#fff', 'stroke-width': 10, 'stroke-linecap': 'round' }, g));
    return { fy: 0, fs: 0, top: -200, noface: true, tick: t => steam.forEach((s, i) => { const u = (t * .45 + i / 3) % 1; s.setAttribute('transform', `translate(${-80 + i * 80} ${-40 - u * 60})`); s.setAttribute('opacity', (.7 * Math.sin(u * 3.14)).toFixed(2)); }) };
  };
  BODIES.chopsticks = function (g, c) {
    const sticks = [-1, 1].map(sg => { const o = el('g', {}, g);
      el('path', { d: 'M -7 0 L 7 0 L 12 -420 L -12 -420 Z', fill: '#d8a05a', stroke: OLK, 'stroke-width': 4, 'stroke-linejoin': 'round' }, o);
      el('path', { d: 'M -9 -330 L 9 -330 L 12 -420 L -12 -420 Z', fill: '#b02a2a' }, o);
      el('path', { d: 'M -2 -20 L -4 -310', stroke: '#fff', 'stroke-width': 3, opacity: .5, 'stroke-linecap': 'round' }, o);
      return { sg, o }; });
    return { fy: 0, fs: 0, top: -450, noface: true, tick: (t, p) => { const open = 11 + 6 * Math.sin(t * 2.2); sticks.forEach(s => s.o.setAttribute('transform', `rotate(${s.sg * open})`)); } };
  };
  BODIES.cheese = function (g, c) {
    el('path', { d: 'M -130 70 L 130 70 L 130 -10 Q 20 -110 -130 -40 Z', fill: '#ffcb2e', stroke: OLK, 'stroke-width': 6, 'stroke-linejoin': 'round' }, g);
    el('path', { d: 'M -130 -40 Q 20 -110 130 -10 L 130 20 Q 20 -70 -130 4 Z', fill: '#ffe27a' }, g);
    [[-86, 34, 14], [60, 40, 18], [90, 6, 10], [-20, 46, 9]].forEach(([x, y, r]) => el('ellipse', { cx: x, cy: y, rx: r, ry: r * .8, fill: '#e09f10', stroke: OLK, 'stroke-width': 3 }, g));
    return { fy: 10, fs: .5, top: -110, noblush: true, tick() {} };
  };
  BODIES.chef = null; delete BODIES.chef;

  /* Human-shaped cartoon astronaut (reference style): thick outlines, glass helmet with a human face inside, white suit with orange
     stripes, grey gloves and boots, backpack. Arms and legs react to the mood (calm drift -> scared reaching and flailing). */
  BODIES.astronaut = function (g, c) {
    const id = 'as' + (++UID), OL = '#14122b', W = 4.5, suit = c || '#fbfbfe', shade = '#dde2ee', or = '#ff8f1f', gr = '#a7adbd', dg = '#737a8c';
    const defs = el('defs', {}, g);
    const vg = el('radialGradient', { id: id + 'v', cx: .35, cy: .25, r: 1 }, defs);
    [[0, '#4a68c8'], [.6, '#26408f'], [1, '#14245c']].forEach(([o, col]) => el('stop', { offset: o, 'stop-color': col }, vg));
    const rect = (p, x, y, w, h, rx, fill, sw) => el('rect', { x, y, width: w, height: h, rx, fill, stroke: OL, 'stroke-width': sw == null ? W : sw }, p);
    // backpack
    rect(g, -72, -46, 78, 108, 24, gr); rect(g, -64, -34, 56, 18, 8, dg, 3);
    // legs
    const mkLeg = sg => { const o = el('g', { transform: `translate(${sg * 24} 54)` }, g), i = el('g', {}, o);
      rect(i, -19, 0, 38, 98, 19, suit); el('rect', { x: -18.5, y: 40, width: 37, height: 14, fill: or }, i); rect(i, -19, 0, 38, 98, 19, 'none');
      el('path', { d: 'M -22 86 L 22 86 L 27 116 Q 27 130 10 130 L -26 130 Q -32 112 -22 86 Z', fill: gr, stroke: OL, 'stroke-width': W, 'stroke-linejoin': 'round' }, i);
      el('rect', { x: -22, y: 82, width: 44, height: 12, rx: 5, fill: dg, stroke: OL, 'stroke-width': 3.5 }, i);
      return o; };
    const legL = mkLeg(-1), legR = mkLeg(1);
    // torso, belt, chest panel
    rect(g, -50, -58, 100, 122, 36, suit);
    el('path', { d: 'M -50 36 H 50 V 44 Q 50 64 18 64 H -18 Q -50 64 -50 44 Z', fill: shade, stroke: OL, 'stroke-width': W, 'stroke-linejoin': 'round' }, g);
    rect(g, -28, -34, 56, 38, 8, gr, 3.5);
    [[-14, '#e84a4a'], [2, '#4a7be8'], [16, '#e84a4a']].forEach(([x, col], i) => { rect(g, x - 7, i === 1 ? -22 : -26, 14, 10, 3, col, 2.5); });
    rect(g, -22, -4, 44, 6, 3, dg, 2.5);
    // arms (rotate around the shoulder)
    const mkArm = sg => { const o = el('g', { transform: `translate(${sg * 52} -34)` }, g), i = el('g', {}, o);
      rect(i, -16, -2, 32, 88, 16, suit); el('rect', { x: -15.5, y: 30, width: 31, height: 14, fill: or }, i); rect(i, -16, -2, 32, 88, 16, 'none');
      rect(i, -17, 66, 34, 12, 5, shade, 3.5);
      el('circle', { cx: 0, cy: 98, r: 20, fill: gr, stroke: OL, 'stroke-width': W }, i); el('ellipse', { cx: -sg * 14, cy: 92, rx: 8, ry: 12, fill: gr, stroke: OL, 'stroke-width': 3.5 }, i);
      return o; };
    const armL = mkArm(-1), armR = mkArm(1);
    // neck ring + helmet
    rect(g, -44, -76, 88, 26, 13, shade);
    el('circle', { cy: -142, r: 90, fill: suit, stroke: OL, 'stroke-width': 5.5 }, g);
    el('ellipse', { cy: -140, rx: 72, ry: 68, fill: `url(#${id}v)`, stroke: OL, 'stroke-width': 4.5 }, g);
    const faceHolder = el('g', {}, g);                                    // the human face is drawn here (see makeFace override below)
    return { fy: -140, fs: .9, exx: 0, exy: -140, top: -118, faceParent: faceHolder, makeFace: makeHumanFace,
      afterFace: g => { el('ellipse', { cy: -140, rx: 72, ry: 68, fill: '#8fb4ff', opacity: .14 }, g);                       // glass tint over the face
        el('path', { d: 'M -52 -176 Q -40 -202 -10 -206', fill: 'none', stroke: '#fff', 'stroke-width': 9, 'stroke-linecap': 'round', opacity: .85 }, g);
        el('path', { d: 'M 46 -108 Q 58 -122 60 -138', fill: 'none', stroke: '#fff', 'stroke-width': 5, 'stroke-linecap': 'round', opacity: .5 }, g);
        el('circle', { cx: -62, cy: -160, r: 4, fill: '#fff', opacity: .8 }, g); },
      tick: (t, p) => {
        const f = clamp(Math.max(p ? p.tremble : 0, p ? p.excl * .7 : 0, p && p.sweat > .5 ? .5 : 0), 0, 1), fl = Math.sin(t * 9) * 9 * f;
        armL.setAttribute('transform', `translate(-52 -34) rotate(${lerp(14 + Math.sin(t * 1.6) * 6, 55, f) + fl})`);
        armR.setAttribute('transform', `translate(52 -34) rotate(${-lerp(14 - Math.sin(t * 1.6 + 1) * 6, 150, f) - fl * .6})`);
        legL.setAttribute('transform', `translate(-24 54) rotate(${lerp(6 + Math.sin(t * 1.3) * 3, 20, f) + fl * .8})`);
        legR.setAttribute('transform', `translate(24 54) rotate(${-lerp(6 - Math.sin(t * 1.3 + 1) * 3, 28, f) - fl * .8})`); } };
  };
  /* ======================================================================================
     BRAIN EMPLOYEE ("What Actually Happens Inside Your Brain?"): a tired pink brain with arms and legs.
     Moods used on top of the usual ones: smart (round glasses), puzzled (glasses + ?), cool (sunglasses), tired / deadpan (eye bags).
     Props (noface): clock (7:00, ringing) clock3 (3:00) coffee ball pan smartphone.
     Backgrounds (toon data.bg): bedroom control chat memory night plain.
     ====================================================================================== */
  const BR = '#F4A6B8', BR2 = '#B8566F', BR3 = '#D9748F', LID = '#E58AA3', BRI = '#7a3a50';
  function makeBrainFace(parent) {
    const f = el('g', {}, parent), id = 'bf' + (++UID), defs = el('defs', {}, f);
    const eyes = [-1, 1].map(s => {
      const cid = id + (s > 0 ? 'r' : 'l'), cp = el('clipPath', { id: cid }, defs); el('circle', { r: 7 }, cp);
      const g = el('g', {}, f);
      el('circle', { r: 7, fill: '#fff', stroke: BRI, 'stroke-width': 1.5 }, g);
      const pup = el('circle', { r: 3, fill: '#222' }, g), hi = el('circle', { r: 1, fill: '#fff' }, g);
      const lg = el('g', { 'clip-path': `url(#${cid})` }, g), lid = el('rect', { x: -8, y: -16, width: 16, height: 16, fill: LID }, lg);
      const line = el('line', { x1: -7, x2: 7, stroke: BRI, 'stroke-width': 1.6, 'stroke-linecap': 'round' }, g);
      const bag = el('path', { d: 'M -7 8 Q 0 12 7 8', fill: 'none', stroke: '#8a6aa8', 'stroke-width': 1.8, 'stroke-linecap': 'round' }, g);
      return { s, g, pup, hi, lid, line, bag };
    });
    const brows = [-1, 1].map(s => ({ s, e: el('line', { x1: -7, y1: 0, x2: 7, y2: 0, stroke: BRI, 'stroke-width': 2, 'stroke-linecap': 'round' }, f) }));
    const mouthLine = el('path', { fill: 'none', stroke: BRI, 'stroke-width': 2, 'stroke-linecap': 'round' }, f);
    const mouthO = el('ellipse', { fill: '#7a2a3e', stroke: BRI, 'stroke-width': 1.6 }, f);
    const specs = el('g', {}, f);
    [-1, 1].forEach(s => el('circle', { cx: s * 14, cy: -2, r: 11, fill: '#cfe9ff', 'fill-opacity': .18, stroke: '#2b2b3a', 'stroke-width': 2.2 }, specs));
    el('path', { d: 'M -3 -3 Q 0 -6 3 -3', fill: 'none', stroke: '#2b2b3a', 'stroke-width': 2 }, specs);
    const shades = el('g', {}, f);
    el('rect', { x: -26, y: -10, width: 22, height: 13, rx: 5, fill: '#1c1c28' }, shades); el('rect', { x: 4, y: -10, width: 22, height: 13, rx: 5, fill: '#1c1c28' }, shades);
    el('rect', { x: -4, y: -7, width: 8, height: 2.6, fill: '#1c1c28' }, shades);
    el('path', { d: 'M -22 -6 L -16 -6 M 8 -6 L 14 -6', stroke: '#fff', 'stroke-width': 1.8, 'stroke-linecap': 'round' }, shades);
    return function (p, t, look, blink) {
      const lidAmt = clamp(1 - p.open * blink, 0, 1), yb = -7 + lidAmt * 14;
      eyes.forEach(e => {
        e.g.setAttribute('transform', `translate(${e.s * 14} -2) scale(${p.eye.toFixed(3)})`);
        e.g.setAttribute('opacity', (1 - p.shades).toFixed(3));
        const lx = (look.x + (p.dizzy ? Math.cos(t * 9 + e.s) * .9 : 0)) * 1.8, ly = (look.y - p.lookUp * .9 + (p.dizzy ? Math.sin(t * 9 + e.s) * .9 : 0)) * 1.8 + .6;
        e.pup.setAttribute('r', (5.4 * p.pup).toFixed(2)); e.pup.setAttribute('cx', lx.toFixed(2)); e.pup.setAttribute('cy', ly.toFixed(2));
        e.hi.setAttribute('cx', (lx - 1.1).toFixed(2)); e.hi.setAttribute('cy', (ly - 1.3).toFixed(2));
        e.lid.setAttribute('height', (16 + yb).toFixed(2)); e.line.setAttribute('y1', yb.toFixed(2)); e.line.setAttribute('y2', yb.toFixed(2)); e.line.setAttribute('opacity', lidAmt > .12 ? 1 : 0);
        e.bag.setAttribute('opacity', p.bags.toFixed(3));
      });
      brows.forEach(b => { b.e.setAttribute('transform', `translate(${b.s * 14} ${(-14 + p.browY * .35).toFixed(2)}) rotate(${(b.s * p.brow * .9).toFixed(1)})`); b.e.setAttribute('opacity', p.shades > .5 ? 0 : clamp((Math.abs(p.brow) + Math.abs(p.browY)) / 6, 0, 1).toFixed(3)); });
      const tk = p.talk, syl = tk * (.25 + .75 * Math.abs(Math.sin(t * 10.3)) * (.6 + .4 * Math.abs(Math.sin(t * 3.1))));
      const surprised = p.excl > .3 && syl < .5;            // a small round "o" only at surprise moments
      const open = surprised ? 1 : syl;
      const my = 16, w = Math.min(9, p.mw * .34), cv = p.curve * 4;
      if (surprised || syl > .08) {
        mouthO.setAttribute('cx', 0); mouthO.setAttribute('cy', my + 1);
        mouthO.setAttribute('rx', surprised ? 3.4 : (2.6 + syl * 1.2).toFixed(2)); mouthO.setAttribute('ry', surprised ? 4.4 : (1 + syl * 3.2).toFixed(2)); mouthO.setAttribute('opacity', 1); mouthLine.setAttribute('opacity', 0);
      } else { mouthO.setAttribute('opacity', 0); mouthLine.setAttribute('opacity', 1); mouthLine.setAttribute('d', `M ${-w} ${my} Q 0 ${(my + cv).toFixed(2)} ${w} ${my}`); }
      specs.setAttribute('opacity', p.specs.toFixed(3)); shades.setAttribute('opacity', p.shades.toFixed(3));
    };
  }
  BODIES.brain = function (g, c) {
    const col = c || BR, root = el('g', { transform: 'scale(1.9)' }, g);
    const legs = [-1, 1].map(sg => { const o = el('g', {}, root);
      el('path', { d: 'M 0 36 L 0 54', stroke: BR2, 'stroke-width': 3.5, 'stroke-linecap': 'round', fill: 'none' }, o); el('ellipse', { cx: sg * 3, cy: 56, rx: 8, ry: 3.5, fill: '#3a3a4a' }, o); return { sg, o }; });
    const arms = [-1, 1].map(sg => ({ sg, p: el('path', { fill: 'none', stroke: BR2, 'stroke-width': 3.5, 'stroke-linecap': 'round' }, root), h: el('circle', { r: 3.6, fill: BR2 }, root) }));
    el('path', { d: 'M-48 0 C-52 -26 -30 -42 -8 -38 C6 -46 34 -44 40 -26 C56 -22 58 6 44 16 C46 32 22 40 8 34 C-8 42 -36 38 -40 22 C-54 18 -56 8 -48 0 Z', fill: col, stroke: BR2, 'stroke-width': 2, 'stroke-linejoin': 'round' }, root);
    el('path', { d: 'M-30 -22 C-20 -32 -8 -24 2 -32 M8 -30 C18 -36 28 -30 34 -22 M-38 14 C-30 20 -20 18 -14 26 M14 28 C24 22 34 24 38 14', stroke: BR3, 'stroke-width': 2, fill: 'none', 'stroke-linecap': 'round' }, root);
    return { fy: 0, fs: 1.9, top: -96, exx: 14, exy: -24, makeFace: makeBrainFace, tick: (t, p) => {
      const f = clamp(Math.max(p ? p.tremble : 0, p ? p.excl * .7 : 0, p && p.sweat > .5 ? .35 : 0), 0, 1), fl = Math.sin(t * 9) * 5 * f;
      arms.forEach(a => {
        const sg = a.sg, sw = Math.sin(t * 1.6 + sg) * 1.6 * (1 - f), ex = lerp(61, 62, f), ey = lerp(29, -19, f) + sw + fl * sg, cx = lerp(57, 55, f), cy = lerp(18, -6, f);
        a.p.setAttribute('d', `M ${sg * 47} 6 Q ${sg * cx} ${cy} ${sg * ex} ${ey.toFixed(1)}`); a.h.setAttribute('cx', sg * ex); a.h.setAttribute('cy', ey.toFixed(1));
      });
      legs.forEach(l => l.o.setAttribute('transform', `translate(${l.sg * 14} 36) rotate(${(l.sg * (2 + f * 9) + Math.sin(t * 1.3 + l.sg) * 1.5 + fl * l.sg).toFixed(1)}) translate(0 -36)`));
    } };
  };
  const mkClock = (hr, ring) => function (g) {
    const r = el('g', {}, g), a = (hr % 12) / 12 * 360;
    [-1, 1].forEach(sg => { el('path', { d: `M ${sg * 30} 68 L ${sg * 52} 108`, stroke: OLK, 'stroke-width': 8, 'stroke-linecap': 'round' }, r); el('circle', { cx: sg * 52, cy: -76, r: 22, fill: '#ffd34d', stroke: OLK, 'stroke-width': 5 }, r); });
    el('circle', { r: 78, fill: '#e8483f', stroke: OLK, 'stroke-width': 6 }, r); el('circle', { r: 60, fill: '#fff', stroke: OLK, 'stroke-width': 4 }, r);
    for (let i = 0; i < 12; i++) el('line', { x1: 0, y1: -50, x2: 0, y2: -42, stroke: OLK, 'stroke-width': 3, transform: `rotate(${i * 30})`, 'stroke-linecap': 'round' }, r);
    el('line', { x1: 0, y1: 0, x2: 0, y2: -34, stroke: OLK, 'stroke-width': 6, 'stroke-linecap': 'round', transform: `rotate(${a})` }, r); el('line', { x1: 0, y1: 0, x2: 0, y2: -48, stroke: OLK, 'stroke-width': 4, 'stroke-linecap': 'round' }, r); el('circle', { r: 5, fill: OLK }, r);
    const rg = [-1, 1].map(sg => el('path', { d: `M ${sg * 96} -40 Q ${sg * 112} -20 ${sg * 96} 0 M ${sg * 114} -52 Q ${sg * 138} -20 ${sg * 114} 12`, fill: 'none', stroke: '#ff9f1c', 'stroke-width': 5, 'stroke-linecap': 'round' }, r));
    return { fy: 0, fs: 0, top: -150, noface: true, tick: t => { r.setAttribute('transform', `rotate(${ring ? Math.sin(t * 38) * 5 : 0})`); rg.forEach(e => e.setAttribute('opacity', ring ? (.4 + .6 * Math.abs(Math.sin(t * 19))).toFixed(2) : 0)); } };
  };
  BODIES.clock = mkClock(7, true); BODIES.clock3 = mkClock(3, false);
  BODIES.coffee = function (g) {
    el('path', { d: 'M 66 -10 q 56 4 46 46 q -8 30 -48 26', fill: 'none', stroke: OLK, 'stroke-width': 18, 'stroke-linecap': 'round' }, g); el('path', { d: 'M 66 -10 q 56 4 46 46 q -8 30 -48 26', fill: 'none', stroke: '#fff', 'stroke-width': 8, 'stroke-linecap': 'round' }, g);
    el('path', { d: 'M -76 -30 L 76 -30 L 62 84 Q 58 104 38 104 L -38 104 Q -58 104 -62 84 Z', fill: '#fff', stroke: OLK, 'stroke-width': 6, 'stroke-linejoin': 'round' }, g);
    el('ellipse', { cy: -30, rx: 76, ry: 18, fill: '#6b3a1e', stroke: OLK, 'stroke-width': 5 }, g); el('path', { d: 'M -60 0 L -52 70', stroke: '#e8e8f0', 'stroke-width': 8, 'stroke-linecap': 'round' }, g);
    const st = [0, 1, 2].map(() => el('path', { d: 'M 0 0 Q 14 -20 0 -40 Q -14 -60 0 -80', fill: 'none', stroke: '#fff', 'stroke-width': 9, 'stroke-linecap': 'round' }, g));
    return { fy: 0, fs: 0, top: -170, noface: true, tick: t => st.forEach((s, i) => { const u = (t * .5 + i / 3) % 1; s.setAttribute('transform', `translate(${-40 + i * 40} ${-40 - u * 50})`); s.setAttribute('opacity', (.8 * Math.sin(u * 3.14)).toFixed(2)); }) };
  };
  BODIES.ball = function (g) {
    const sp = el('g', {}, g);
    el('circle', { r: 66, fill: '#ff8a2b', stroke: OLK, 'stroke-width': 6 }, sp); el('path', { d: 'M -66 0 H 66 M 0 -66 V 66 M -46 -46 Q 0 0 -46 46 M 46 -46 Q 0 0 46 46', fill: 'none', stroke: OLK, 'stroke-width': 4 }, sp);
    el('ellipse', { cx: -24, cy: -30, rx: 16, ry: 8, fill: '#fff', opacity: .45, transform: 'rotate(-35 -24 -30)' }, g);
    return { fy: 0, fs: 0, top: -100, noface: true, tick: t => sp.setAttribute('transform', `rotate(${(t * 420) % 360})`) };
  };
  BODIES.pan = function (g) {
    const gl = el('ellipse', { cx: 0, cy: 6, rx: 150, ry: 42, fill: '#ff5a1f', opacity: .35 }, g);
    el('rect', { x: 120, y: -14, width: 150, height: 26, rx: 12, fill: '#6b4a2a', stroke: OLK, 'stroke-width': 5 }, g);
    el('path', { d: 'M -130 -10 L 130 -10 L 112 40 Q 100 62 70 62 L -70 62 Q -100 62 -112 40 Z', fill: '#3a3a48', stroke: OLK, 'stroke-width': 6, 'stroke-linejoin': 'round' }, g);
    el('ellipse', { cy: -10, rx: 130, ry: 24, fill: '#55556a', stroke: OLK, 'stroke-width': 5 }, g); el('ellipse', { cy: -8, rx: 108, ry: 17, fill: '#2b2b38' }, g);
    el('path', { d: 'M -40 -12 Q -48 -26 -20 -26 Q 10 -34 22 -20 Q 44 -14 28 -6 Q 0 2 -40 -12 Z', fill: '#fff', stroke: OLK, 'stroke-width': 3 }, g); el('circle', { cx: -4, cy: -16, r: 10, fill: '#ffb627' }, g);
    const heat = [0, 1, 2].map(() => el('path', { d: 'M 0 0 Q 14 -18 0 -36 Q -14 -54 0 -72', fill: 'none', stroke: '#ff7a3d', 'stroke-width': 8, 'stroke-linecap': 'round' }, g));
    return { fy: 0, fs: 0, top: -140, noface: true, tick: t => { gl.setAttribute('opacity', (.25 + .2 * Math.sin(t * 6)).toFixed(2)); heat.forEach((s, i) => { const u = (t * .7 + i / 3) % 1; s.setAttribute('transform', `translate(${-60 + i * 60} ${-34 - u * 60})`); s.setAttribute('opacity', (.85 * Math.sin(u * 3.14)).toFixed(2)); }); } };
  };
  BODIES.smartphone = function (g) {
    el('rect', { x: -78, y: -140, width: 156, height: 280, rx: 26, fill: '#2b2f3e', stroke: OLK, 'stroke-width': 6 }, g); el('rect', { x: -64, y: -120, width: 128, height: 232, rx: 14, fill: '#9bd4f5' }, g); el('rect', { x: -22, y: -130, width: 44, height: 6, rx: 3, fill: '#14182a' }, g);
    X.text(g, '12:47', 0, -26, 48, '#14182a', 900, 'middle'); X.text(g, 'Wed', 0, -70, 24, '#2b4a6b', 700, 'middle'); el('rect', { x: -40, y: 40, width: 80, height: 12, rx: 6, fill: '#fff', opacity: .55 }, g);
    return { fy: 0, fs: 0, top: -180, noface: true, tick() { } };
  };
  const BRAIN_BGS = ['bedroom', 'control', 'chat', 'memory', 'night', 'plain'];
  function makeBrainBg(kind, p) {
    if (BRAIN_BGS.indexOf(kind) < 0) return null;
    const R = (x, y, w, h, fill, o) => el('rect', Object.assign({ x, y, width: w, height: h, fill }, o || {}), p);
    const C = (cx, cy, r, fill, o) => el('circle', Object.assign({ cx, cy, r, fill }, o || {}), p);
    const upd = [];
    if (kind === 'bedroom') {
      R(0, 0, 720, 1228, '#fbe8c8'); for (let i = 0; i < 9; i++) R(i * 90, 0, 45, 930, '#fff3dc', { opacity: .45 });
      R(0, 930, 720, 298, '#d9b38c'); R(0, 920, 720, 16, '#b88a60'); for (let i = 0; i < 6; i++) el('path', { d: `M ${i * 130} 936 L ${i * 130 - 40} 1228`, stroke: '#c49a70', 'stroke-width': 4, opacity: .6 }, p);
      R(60, 300, 240, 280, '#bfe6ff', { stroke: '#8a6a4a', 'stroke-width': 10 }); const sun = el('g', {}, p); const rays = el('g', {}, sun);
      for (let i = 0; i < 10; i++) el('path', { d: 'M -7 -62 Q 0 -86 7 -62 Z', fill: '#ffd23f', transform: `rotate(${i * 36})` }, rays);
      el('circle', { r: 40, fill: '#ffd23f' }, sun); sun.setAttribute('transform', 'translate(150 410)'); R(176, 300, 6, 280, '#8a6a4a'); R(60, 436, 240, 6, '#8a6a4a');
      el('path', { d: 'M 40 290 Q 80 420 50 600 L 20 600 L 20 290 Z M 320 290 Q 280 420 310 600 L 340 600 L 340 290 Z', fill: '#e8706a', opacity: .9 }, p);
      R(470, 830, 260, 130, '#7aa5d6', { rx: 14 }); R(470, 800, 260, 60, '#5b86b8', { rx: 14 }); R(490, 770, 90, 44, '#fff', { rx: 18, stroke: '#cfd8e6', 'stroke-width': 3 });
      [[130, 1010], [210, 1050], [90, 1090]].forEach(([x, y]) => C(x, y, 9, '#6b3a1e', { opacity: .55 }));
      upd.push(T => rays.setAttribute('transform', `rotate(${T * 12})`));
    } else if (kind === 'control') {
      R(0, 0, 720, 1228, '#26304f'); R(0, 960, 720, 268, '#1a2038'); R(30, 300, 660, 300, '#34406a', { rx: 14, stroke: '#6b7bb8', 'stroke-width': 4 });
      const dots = []; for (let r = 0; r < 4; r++) for (let c = 0; c < 10; c++) dots.push(C(70 + c * 36, 340 + r * 40, 10, '#5be37d'));
      R(440, 330, 220, 140, '#0f1530', { rx: 8, stroke: '#6b7bb8', 'stroke-width': 3 }); const line = el('path', { fill: 'none', stroke: '#5be37d', 'stroke-width': 4, 'stroke-linejoin': 'round' }, p);
      for (let i = 0; i < 6; i++) R(40 + i * 110, 500, 80, 70, '#222c4e', { rx: 8 }); const glow = R(0, 0, 720, 1228, '#ff3b30', { opacity: 0 });
      const sir = el('g', {}, p); C(0, 0, 36, '#ff4d4d', { 'stroke': '#8a1a1a', 'stroke-width': 5 }); sir.setAttribute('transform', 'translate(640 252)'); el('circle', { r: 36, fill: '#ff4d4d', stroke: '#8a1a1a', 'stroke-width': 5 }, sir); const beam = el('path', { d: 'M 0 0 L -230 -60 L -230 60 Z', fill: '#ff4d4d', opacity: .3 }, sir);
      upd.push(T => { dots.forEach((d, i) => d.setAttribute('fill', Math.sin(T * 7 + i * 1.7) > .1 ? '#5be37d' : (Math.sin(T * 5 + i) > .6 ? '#ffd23f' : '#ff4d4d'))); let d = ''; for (let i = 0; i <= 20; i++) d += (i ? 'L' : 'M') + (450 + i * 10) + ' ' + (400 - Math.abs(Math.sin(i * .7 + T * 6)) * 50 * (i % 5 === 0 ? 1.4 : .6)).toFixed(1) + ' '; line.setAttribute('d', d); glow.setAttribute('opacity', (.05 + .07 * Math.abs(Math.sin(T * 5))).toFixed(3)); beam.setAttribute('transform', `rotate(${T * 300})`); });
    } else if (kind === 'chat') {
      R(0, 0, 720, 1228, '#0d3b3a'); R(0, 980, 720, 248, '#0a2e2d');
      const N = [[90, 420], [250, 330], [450, 380], [620, 470], [150, 600], [330, 560], [540, 640], [380, 220]], E = [[0, 1], [1, 2], [2, 3], [0, 4], [4, 5], [5, 2], [5, 6], [6, 3], [1, 7], [7, 2], [1, 5]];
      E.forEach(([a, b]) => el('line', { x1: N[a][0], y1: N[a][1], x2: N[b][0], y2: N[b][1], stroke: '#2ee6a6', 'stroke-width': 2.5, opacity: .75 }, p));
      const nodes = N.map(([x, y]) => C(x, y, 12, '#2ee6a6')), msgs = [];
      for (let i = 0; i < 9; i++) { const gm = el('g', {}, p); const own = i % 2 === 0; el('rect', { x: -22, y: -12, width: 44, height: 24, rx: 10, fill: own ? '#25D366' : '#dcf8c6' }, gm); el('path', { d: 'M -12 0 H 12', stroke: own ? '#fff' : '#0d3b3a', 'stroke-width': 3, 'stroke-linecap': 'round' }, gm); msgs.push({ gm, e: E[i % E.length], k: i * .37, sp: .35 + (i % 4) * .08 }); }
      upd.push(T => { nodes.forEach((n, i) => n.setAttribute('r', (11 + 4 * Math.abs(Math.sin(T * 3 + i))).toFixed(1))); msgs.forEach(m => { const u = (T * m.sp + m.k) % 1, a = N[m.e[0]], b = N[m.e[1]]; m.gm.setAttribute('transform', `translate(${(a[0] + (b[0] - a[0]) * u).toFixed(1)} ${(a[1] + (b[1] - a[1]) * u - 18).toFixed(1)}) scale(${(.6 + .5 * Math.sin(u * 3.14)).toFixed(2)})`); }); });
    } else if (kind === 'memory') {
      R(0, 0, 720, 1228, '#e9e4f5'); R(0, 960, 720, 268, '#cfc4e8');
      const cols = ['#6fa8dc', '#e06666', '#93c47d', '#f6b26b', '#8e7cc3', '#76a5af'];
      [[330, 0], [470, 1], [610, 2]].forEach(([y, k]) => { R(20, y + 24, 680, 12, '#8a5a3a', { rx: 4 }); for (let i = 0; i < 9; i++) { const h = 50 + ((i * 17 + k * 11) % 40); R(40 + i * 62, y + 24 - h, 44, h, cols[(i + k) % cols.length], { rx: 4, stroke: '#14122b', 'stroke-width': 3 }); } });
      const hot = el('g', {}, p); hot.setAttribute('transform', 'translate(560 262)'); el('rect', { x: -60, y: -34, width: 120, height: 68, rx: 10, fill: '#ffd23f', stroke: '#b38f00', 'stroke-width': 5 }, hot); X.text(hot, '2017', 0, 14, 44, '#7a5a00', 900, 'middle');
      const pap = el('g', {}, p); el('rect', { x: -40, y: -52, width: 80, height: 104, fill: '#fff', stroke: '#999', 'stroke-width': 3 }, pap); [-24, -8, 8].forEach(y => el('path', { d: `M -26 ${y} H 26`, stroke: '#bbb', 'stroke-width': 4 }, pap)); el('path', { d: 'M -26 -8 H 26', stroke: '#e06666', 'stroke-width': 4 }, pap);
      upd.push(T => { hot.setAttribute('transform', `translate(560 ${262 + Math.sin(T * 2) * 5}) scale(${1 + .06 * Math.sin(T * 5)})`); pap.setAttribute('transform', `translate(${590 + Math.sin(T * .9) * 30} ${1000 + Math.sin(T * 1.7) * 22}) rotate(${14 + Math.sin(T * 1.3) * 12})`); });
    } else if (kind === 'night') {
      R(0, 0, 720, 1228, '#14183a'); R(0, 980, 720, 248, '#0d1030');
      const st = []; for (let i = 0; i < 30; i++) st.push(C(20 + rnd(i + 3) * 680, 240 + rnd(i + 9) * 640, .8 + rnd(i + 21) * 2, '#fff'));
      C(590, 330, 52, '#f6f1c9'); C(612, 316, 46, '#14183a');
      R(380, 930, 340, 110, '#5b7fb5', { rx: 16 }); R(380, 910, 340, 50, '#3f5f94', { rx: 16 }); C(430, 925, 34, '#f1c7a0'); R(402, 890, 80, 34, '#fff', { rx: 16, opacity: .9 }); el('path', { d: 'M 416 922 q 8 6 16 0 M 436 922 q 8 6 16 0', fill: 'none', stroke: '#6b4a2a', 'stroke-width': 3, 'stroke-linecap': 'round' }, p);
      const z = [0, 1, 2].map(i => X.text(p, 'Z', 0, 0, 40 + i * 10, '#c9d6ff', 800));
      upd.push(T => { st.forEach((s, i) => s.setAttribute('opacity', (.25 + .6 * Math.abs(Math.sin(T * 1.3 + i))).toFixed(2))); z.forEach((e, i) => { const u = (T * .45 + i / 3) % 1; e.setAttribute('opacity', (.9 * Math.sin(u * 3.14)).toFixed(2)); e.setAttribute('transform', `translate(${470 + u * 70} ${880 - u * 120})`); }); });
    } else {
      R(0, 0, 720, 1228, '#f2e6ff'); R(0, 960, 720, 268, '#e0ccff'); R(0, 950, 720, 14, '#c9b0f0');
      C(560, 400, 84, '#fff', { stroke: '#555', 'stroke-width': 8 }); for (let i = 0; i < 12; i++) el('line', { x1: 0, y1: -70, x2: 0, y2: -60, stroke: '#555', 'stroke-width': 4, transform: `translate(560 400) rotate(${i * 30})` }, p);
      el('line', { x1: 560, y1: 400, x2: 560 + 36 * Math.sin(23.5 * .01745), y2: 400 - 36 * Math.cos(23.5 * .01745), stroke: '#333', 'stroke-width': 7, 'stroke-linecap': 'round' }, p); el('line', { x1: 560, y1: 400, x2: 560 + 56 * Math.sin(282 * .01745), y2: 400 - 56 * Math.cos(282 * .01745), stroke: '#333', 'stroke-width': 5, 'stroke-linecap': 'round' }, p); C(560, 400, 6, '#333');
    }
    return { update: T => upd.forEach(f => f(T)) };
  }

  /* ======================================================================================
     INVISIBLE-24-HOURS SHORT: flat 2D noodle-limbed people, a floating-pajamas "invisible" man, a sheet ghost, props.
     who: hero (blue suit) friend (green) priest (black + cross) invis ghost burger cake
     bg : inv_kitchen inv_dark inv_restaurant inv_comments (+ the existing bedroom)
     ====================================================================================== */
  const SKIN = '#ffd9b0';
  const limbP = (parent, w, stroke) => el('path', { fill: 'none', stroke, 'stroke-width': w, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }, parent);
  function mkPerson(o) {
    return function (g, c) {
      el('ellipse', { cx: 0, cy: 346, rx: 74, ry: 13, fill: '#000', opacity: .2 }, g);
      const tee = c || o.suit, hairC = o.hair || '#4a2a14', pants = o.pants || '#3b4560';
      const legs = [-1, 1].map(sg => ({ sg, o: limbP(g, 26, OLK), i: limbP(g, 16, o.robe ? tee : pants) }));
      [-1, 1].forEach(sg => el('ellipse', { cx: sg * 22, cy: 340, rx: 22, ry: 9, fill: '#2b2b3a', stroke: OLK, 'stroke-width': 4 }, g));
      const arms = [-1, 1].map(sg => ({ sg, o: limbP(g, 22, OLK), i: limbP(g, 12, o.robe ? tee : SKIN), h: el('circle', { r: 11, fill: SKIN, stroke: OLK, 'stroke-width': 4 }, g) }));
      el('rect', { x: -13, y: 66, width: 26, height: 24, fill: SKIN, stroke: OLK, 'stroke-width': 4 }, g);
      if (o.robe) el('path', { d: 'M -50 96 Q -50 82 -34 82 L 34 82 Q 50 82 50 96 L 62 300 Q 0 318 -62 300 Z', fill: tee, stroke: OLK, 'stroke-width': 5, 'stroke-linejoin': 'round' }, g);
      else el('path', { d: 'M -48 98 Q -48 82 -30 82 L 30 82 Q 48 82 48 98 L 44 212 Q 0 224 -44 212 Z', fill: tee, stroke: OLK, 'stroke-width': 5, 'stroke-linejoin': 'round' }, g);
      if (o.robe) el('path', { d: 'M 0 140 L 0 198 M -15 158 L 15 158', stroke: '#ffd34d', 'stroke-width': 8, 'stroke-linecap': 'round' }, g);
      el('circle', { r: 80, fill: SKIN, stroke: OLK, 'stroke-width': 5 }, g);
      [-1, 1].forEach(sg => el('ellipse', { cx: sg * 80, cy: 8, rx: 10, ry: 16, fill: SKIN, stroke: OLK, 'stroke-width': 4 }, g));
      el('path', { d: 'M -78 -14 Q -86 -88 0 -86 Q 86 -88 78 -14 Q 60 -56 0 -58 Q -60 -56 -78 -14 Z', fill: hairC, stroke: OLK, 'stroke-width': 4, 'stroke-linejoin': 'round' }, g);
      return { fy: 0, fs: 1, top: -108, noblush: true, tick: (t, p) => {
        const f = p ? clamp(Math.max(p.tremble || 0, p.excl * .8 || 0, p.raise || 0, p.sweat > .5 ? .3 : 0), 0, 1) : 0, sw = Math.sin(t * 1.8), fl = Math.sin(t * 11) * 6 * f;
        arms.forEach(a => { const sg = a.sg, x0 = sg * 46, y0 = 104, ex = sg * lerp(78, 74, f), ey = lerp(186 + sw * 9 * sg, 24 + fl * sg, f), d = `M ${x0} ${y0} Q ${sg * lerp(82, 96, f)} ${lerp(140, 70, f)} ${ex} ${ey}`;
          a.o.setAttribute('d', d); a.i.setAttribute('d', d); a.h.setAttribute('cx', ex); a.h.setAttribute('cy', ey); });
        legs.forEach(l => { const sg = l.sg, d = `M ${sg * 22} 208 Q ${sg * (28 + f * 8)} 272 ${sg * (22 + f * 10)} 332`; l.o.setAttribute('d', d); l.i.setAttribute('d', d); });
      } };
    };
  }
  BODIES.hero = mkPerson({ suit: '#4a90e2' });
  BODIES.friend = mkPerson({ suit: '#4cc38a', hair: '#1c1c28', pants: '#5b4a8a' });
  BODIES.priest = mkPerson({ suit: '#26262f', robe: true, hair: '#9a9aa8' });
  // invisible person: only a see-through glassy outline (no clothes)
  BODIES.invis = function (g, c) {
    const id = 'iv' + (++UID), defs = el('defs', {}, g), fl = el('filter', { id, x: '-30%', y: '-30%', width: '160%', height: '160%' }, defs);
    el('feMorphology', { in: 'SourceAlpha', operator: 'erode', radius: 3.2, result: 'e' }, fl);
    el('feComposite', { in: 'SourceGraphic', in2: 'e', operator: 'out', result: 'rim' }, fl);
    const fillT = el('feComponentTransfer', { in: 'SourceGraphic', result: 'fillA' }, fl); const fa = el('feFuncA', { type: 'linear', slope: .16 }, fillT);
    const mg = el('feMerge', { result: 'm' }, fl); el('feMergeNode', { in: 'fillA' }, mg); el('feMergeNode', { in: 'rim' }, mg);
    el('feDropShadow', { in: 'm', dx: 0, dy: 0, stdDeviation: 2.4, 'flood-color': '#3b8cff', 'flood-opacity': .9 }, fl);
    el('ellipse', { cx: 0, cy: 346, rx: 74, ry: 13, fill: '#000', opacity: .12 }, g);
    const sil = el('g', { filter: `url(#${id})` }, g), W = '#e8f6ff';
    const tube = w => el('path', { fill: 'none', stroke: W, 'stroke-width': w, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }, sil);
    const legs = [-1, 1].map(sg => ({ sg, p: tube(30) })), arms = [-1, 1].map(sg => ({ sg, p: tube(26), h: el('circle', { r: 15, fill: W }, sil) }));
    el('path', { d: 'M -50 98 Q -50 82 -32 82 L 32 82 Q 50 82 50 98 L 46 214 Q 0 226 -46 214 Z', fill: W }, sil);
    el('rect', { x: -13, y: 64, width: 26, height: 26, fill: W }, sil);
    el('circle', { r: 80, fill: W }, sil);
    [-1, 1].forEach(sg => el('ellipse', { cx: sg * 24, cy: 340, rx: 26, ry: 11, fill: W }, sil));
    const sp = [0, 1, 2, 3, 4].map(() => el('path', { d: 'M 0 -10 L 3 -3 L 10 0 L 3 3 L 0 10 L -3 3 L -10 0 L -3 -3 Z', fill: '#fff' }, g));
    const shine = el('path', { d: 'M -52 -34 Q -30 -62 0 -62', fill: 'none', stroke: '#fff', 'stroke-width': 7, 'stroke-linecap': 'round', opacity: .7 }, g);
    return { fy: 0, fs: 1, top: -120, noblush: true, makeFace: p => { const f = makeFace(p, true); p.setAttribute('opacity', .55); return f; }, tick: (t, p) => {
      const f = p ? clamp(Math.max(p.tremble || 0, p.excl * .8 || 0, p.raise || 0), 0, 1) : 0;
      fa.setAttribute('slope', (.14 + .06 * Math.sin(t * 2.4)).toFixed(3)); shine.setAttribute('opacity', (.5 + .3 * Math.sin(t * 2.4 + 1)).toFixed(2));
      arms.forEach(a => { const sg = a.sg, x0 = sg * 46, y0 = 104, ex = sg * lerp(80, 76, f), ey = lerp(190 + Math.sin(t * 1.8) * 9 * sg, 30, f), d = `M ${x0} ${y0} Q ${sg * 94} ${lerp(140, 72, f)} ${ex} ${ey}`; a.p.setAttribute('d', d); a.h.setAttribute('cx', ex); a.h.setAttribute('cy', ey); });
      legs.forEach(l => { const sg = l.sg, d = `M ${sg * 24} 210 Q ${sg * 30} 272 ${sg * 24} 332`; l.p.setAttribute('d', d); });
      sp.forEach((s, i) => { const u = (t * .6 + i / 5) % 1, a = i * 1.9; s.setAttribute('transform', `translate(${Math.cos(a) * (130 + 30 * u)} ${60 + Math.sin(a * 1.3) * 150 - u * 40}) scale(${Math.sin(u * 3.14).toFixed(2)})`); s.setAttribute('opacity', (.9 * Math.sin(u * 3.14)).toFixed(2)); });
    } };
  };
  BODIES.ghost = function (g, c) {
    const aura = el('ellipse', { cx: 0, cy: 20, rx: 150, ry: 170, fill: '#7be0ff', opacity: .28 }, g);
    const body = el('path', { d: 'M -92 -10 Q -92 -120 0 -120 Q 92 -120 92 -10 L 92 150 Q 69 118 46 150 Q 23 118 0 150 Q -23 118 -46 150 Q -69 118 -92 150 Z', fill: c || '#f4fcff', stroke: '#5fb4d9', 'stroke-width': 6, 'stroke-linejoin': 'round' }, g);
    const arms = [-1, 1].map(sg => el('path', { fill: '#f4fcff', stroke: '#5fb4d9', 'stroke-width': 6, 'stroke-linejoin': 'round' }, g));
    return { fy: 0, fs: 1, top: -150, noblush: true, tick: t => {
      aura.setAttribute('opacity', (.22 + .1 * Math.sin(t * 3)).toFixed(2));
      arms.forEach((a, i) => { const sg = i ? 1 : -1, w = Math.sin(t * 3 + i) * 14; a.setAttribute('d', `M ${sg * 84} 20 Q ${sg * 130} ${20 + w} ${sg * 140} ${-20 + w * 1.4} Q ${sg * 112} ${10 + w} ${sg * 90} 50 Z`); });
    } };
  };
  BODIES.burger = function (g) {
    const gl = el('ellipse', { cx: 0, cy: 10, rx: 120, ry: 100, fill: '#ffd34d', opacity: .3 }, g);
    el('path', { d: 'M -90 20 Q -96 -70 0 -76 Q 96 -70 90 20 Z', fill: '#e8a043', stroke: OLK, 'stroke-width': 6, 'stroke-linejoin': 'round' }, g);
    [[-40, -40], [-8, -56], [28, -40], [52, -20], [-58, -14]].forEach(([x, y]) => el('ellipse', { cx: x, cy: y, rx: 8, ry: 4.5, fill: '#fff3c4' }, g));
    el('path', { d: 'M -100 20 Q -80 46 -56 24 Q -32 50 -8 26 Q 16 50 40 26 Q 66 48 100 20 L 100 32 L -100 32 Z', fill: '#59c24a', stroke: OLK, 'stroke-width': 5, 'stroke-linejoin': 'round' }, g);
    el('path', { d: 'M -88 36 L 88 36 L 80 52 L 60 66 L 30 52 L 0 66 L -30 52 L -60 66 L -80 52 Z', fill: '#ffc83d', stroke: OLK, 'stroke-width': 5, 'stroke-linejoin': 'round' }, g);
    el('rect', { x: -92, y: 52, width: 184, height: 36, rx: 16, fill: '#7a3b1e', stroke: OLK, 'stroke-width': 6 }, g);
    el('path', { d: 'M -90 92 L 90 92 Q 90 128 40 128 L -40 128 Q -90 128 -90 92 Z', fill: '#e8a043', stroke: OLK, 'stroke-width': 6, 'stroke-linejoin': 'round' }, g);
    const st = [0, 1, 2].map(i => el('path', { d: 'M -10 0 L 0 -12 L 10 0 L 0 12 Z', fill: '#fff' }, g));
    return { fy: 0, fs: 0, top: -120, noface: true, tick: t => { gl.setAttribute('opacity', (.25 + .12 * Math.sin(t * 4)).toFixed(2)); st.forEach((s, i) => { const u = (t * .7 + i / 3) % 1; s.setAttribute('transform', `translate(${-90 + i * 90} ${-40 - u * 60}) scale(${Math.sin(u * 3.14).toFixed(2)})`); }); } };
  };
  BODIES.cake = function (g) {
    const gl = el('ellipse', { cx: 0, cy: 10, rx: 110, ry: 90, fill: '#ffd34d', opacity: .3 }, g);
    el('path', { d: 'M -90 70 L -90 -10 L 90 -40 L 90 70 Q 0 96 -90 70 Z', fill: '#ffe8c2', stroke: OLK, 'stroke-width': 6, 'stroke-linejoin': 'round' }, g);
    el('path', { d: 'M -90 30 L 90 8 L 90 24 L -90 46 Z', fill: '#e8483f', stroke: OLK, 'stroke-width': 4 }, g);
    el('path', { d: 'M -90 -10 L 90 -40 Q 40 -70 -90 -10 Z', fill: '#ff8fb1', stroke: OLK, 'stroke-width': 6, 'stroke-linejoin': 'round' }, g);
    el('circle', { cx: 0, cy: -48, r: 18, fill: '#d8362b', stroke: OLK, 'stroke-width': 5 }, g); el('path', { d: 'M 0 -66 Q 6 -84 18 -88', fill: 'none', stroke: '#3a7a2a', 'stroke-width': 5, 'stroke-linecap': 'round' }, g);
    return { fy: 0, fs: 0, top: -120, noface: true, tick: t => gl.setAttribute('opacity', (.25 + .12 * Math.sin(t * 4)).toFixed(2)) };
  };
  /* ---------- realistic-size props (1 unit ~ 4 mm, a person is ~420 units tall) ---------- */
  BODIES.blanket = function (g, c) {
    el('path', { d: 'M -290 22 Q -290 -22 -230 -22 L 230 -22 Q 290 -22 290 22 L 310 340 L -310 340 Z', fill: c || '#7b8cff', stroke: OLK, 'stroke-width': 6, 'stroke-linejoin': 'round' }, g);
    el('path', { d: 'M -300 70 L 300 70 M -304 130 L 304 130', stroke: '#fff', 'stroke-width': 10, opacity: .35 }, g);
    el('path', { d: 'M -230 -22 Q 0 -46 230 -22', fill: 'none', stroke: '#fff', 'stroke-width': 8, 'stroke-linecap': 'round', opacity: .5 }, g);
    return { fy: 0, fs: 0, top: -60, noface: true, tick: () => { } };
  };
  BODIES.bubble = function (g, txt) {
    txt = String(txt || '...'); const w = Math.max(120, txt.length * 21 + 56);
    el('path', { d: `M ${-w / 2 + 26} 32 L ${-w / 2 + 6} 74 L ${-w / 2 + 62} 32 Z`, fill: '#fff', stroke: OLK, 'stroke-width': 6, 'stroke-linejoin': 'round' }, g);
    el('rect', { x: -w / 2, y: -34, width: w, height: 70, rx: 35, fill: '#fff', stroke: OLK, 'stroke-width': 6 }, g);
    el('rect', { x: -w / 2 + 14, y: 28, width: 46, height: 10, fill: '#fff' }, g);
    X.text(g, txt, 0, 12, 34, '#14213d', 900);
    return { fy: 0, fs: 0, top: -60, noface: true, tick: () => { } };
  };
  BODIES.book = function (g, c) {
    const gl = el('ellipse', { cx: 0, cy: 0, rx: 52, ry: 40, fill: '#ffd34d', opacity: .3 }, g);
    el('rect', { x: -27, y: -20, width: 54, height: 40, rx: 4, fill: c || '#d9483b', stroke: OLK, 'stroke-width': 4 }, g);
    el('rect', { x: -23, y: 14, width: 48, height: 8, fill: '#fff6dc', stroke: OLK, 'stroke-width': 3 }, g);
    el('rect', { x: -17, y: -12, width: 28, height: 6, rx: 3, fill: '#ffd34d' }, g);
    return { fy: 0, fs: 0, top: -50, noface: true, tick: t => gl.setAttribute('opacity', (.25 + .12 * Math.sin(t * 4)).toFixed(2)) };
  };
  BODIES.lamp = function (g) {       // side table + table lamp; the lamp switches on when the mood changes to "boo"
    const glow = el('ellipse', { cx: 0, cy: -70, rx: 330, ry: 300, fill: '#ffe9a8', opacity: 0 }, g), cone = el('path', { d: 'M -46 -66 L -300 150 L 300 150 L 46 -66 Z', fill: '#fff3c4', opacity: 0 }, g);
    [-1, 1].forEach(s => el('line', { x1: s * 50, y1: 0, x2: s * 56, y2: 140, stroke: OLK, 'stroke-width': 9, 'stroke-linecap': 'round' }, g));
    el('rect', { x: -66, y: -6, width: 132, height: 14, rx: 5, fill: '#a9743f', stroke: OLK, 'stroke-width': 5 }, g);
    el('rect', { x: -5, y: -62, width: 10, height: 58, fill: '#6b4a2a', stroke: OLK, 'stroke-width': 3 }, g);
    el('ellipse', { cx: 0, cy: -4, rx: 24, ry: 6, fill: '#6b4a2a', stroke: OLK, 'stroke-width': 3 }, g);
    const sh = el('path', { d: 'M -38 -62 L -24 -112 L 24 -112 L 38 -62 Z', fill: '#f4e3b2', stroke: OLK, 'stroke-width': 5, 'stroke-linejoin': 'round' }, g);
    return { fy: 0, fs: 0, top: -140, noface: true, tick: (t, p) => { const on = clamp((p && p.raise) || 0, 0, 1); glow.setAttribute('opacity', (on * (.3 + .04 * Math.sin(t * 5))).toFixed(2)); cone.setAttribute('opacity', (on * .3).toFixed(2)); sh.setAttribute('fill', on > .5 ? '#fff6c4' : '#b9a878'); } };
  };
  BODIES.chair = function (g, c) {   // origin = floor under the chair
    const col = c || '#b5763c';
    [[-46, -110, -52, 0], [46, -110, 52, 0]].forEach(([x1, y1, x2, y2]) => el('line', { x1, y1, x2, y2, stroke: OLK, 'stroke-width': 14, 'stroke-linecap': 'round' }, g));
    [[-46, -110, -52, 0], [46, -110, 52, 0]].forEach(([x1, y1, x2, y2]) => el('line', { x1, y1, x2, y2, stroke: col, 'stroke-width': 7, 'stroke-linecap': 'round' }, g));
    el('rect', { x: -52, y: -228, width: 104, height: 112, rx: 12, fill: col, stroke: OLK, 'stroke-width': 6 }, g);
    el('rect', { x: -40, y: -214, width: 80, height: 34, rx: 8, fill: '#d99a5b' }, g);
    el('rect', { x: -62, y: -122, width: 124, height: 22, rx: 8, fill: '#c98443', stroke: OLK, 'stroke-width': 6 }, g);
    return { fy: 0, fs: 0, top: -250, noface: true, tick: () => { } };
  };
  BODIES.table = function (g) {      // restaurant table; origin = middle of the table top
    el('path', { d: 'M -180 0 L 180 0 L 200 250 L -200 250 Z', fill: '#fff', stroke: OLK, 'stroke-width': 6, 'stroke-linejoin': 'round' }, g);
    for (let i = 0; i < 8; i++) el('rect', { x: -190 + i * 48, y: 6, width: 24, height: 240, fill: '#e8483f', opacity: .85 }, g);
    el('rect', { x: -190, y: -12, width: 380, height: 20, rx: 8, fill: '#f6efe2', stroke: OLK, 'stroke-width': 6 }, g);
    el('ellipse', { cx: -90, cy: -16, rx: 46, ry: 8, fill: '#fff', stroke: OLK, 'stroke-width': 4 }, g);
    el('ellipse', { cx: 110, cy: -16, rx: 46, ry: 8, fill: '#fff', stroke: OLK, 'stroke-width': 4 }, g);
    el('rect', { x: 20, y: -52, width: 22, height: 38, rx: 6, fill: '#bfe6ff', stroke: OLK, 'stroke-width': 4, opacity: .9 }, g);
    return { fy: 0, fs: 0, top: -90, noface: true, tick: () => { } };
  };
  BODIES.gift = function (g) {
    const gl = el('ellipse', { cx: 0, cy: 0, rx: 70, ry: 60, fill: '#ffd34d', opacity: .3 }, g);
    el('rect', { x: -38, y: -30, width: 76, height: 66, rx: 8, fill: '#a56bff', stroke: OLK, 'stroke-width': 5 }, g);
    el('rect', { x: -42, y: -42, width: 84, height: 22, rx: 6, fill: '#c19bff', stroke: OLK, 'stroke-width': 5 }, g);
    el('rect', { x: -8, y: -42, width: 16, height: 78, fill: '#ffd34d' }, g);
    X.text(g, '?', 0, 20, 52, '#fff', 900);
    return { fy: 0, fs: 0, top: -70, noface: true, tick: t => gl.setAttribute('opacity', (.25 + .15 * Math.sin(t * 4)).toFixed(2)) };
  };
  const INV_BGS = ['inv_kitchen', 'inv_dark', 'inv_restaurant', 'inv_comments', 'inv_bath', 'inv_bed', 'inv_street', 'inv_living', 'inv_room'];
  function makeInvBg(kind, p) {
    const R = (x, y, w, h, fill, o) => el('rect', Object.assign({ x, y, width: w, height: h, fill }, o || {}), p);
    const C = (cx, cy, r, fill, o) => el('circle', Object.assign({ cx, cy, r, fill }, o || {}), p);
    const upd = [];
    if (kind === 'inv_kitchen') {
      R(0, 0, 720, 1228, '#1d2547'); for (let i = 0; i < 9; i++) R(i * 90, 0, 45, 940, '#252f5a', { opacity: .5 });
      R(0, 940, 720, 288, '#3a2f4f'); R(0, 930, 720, 16, '#2a2140');
      R(470, 150, 200, 220, '#0f1738', { stroke: '#8a6a4a', 'stroke-width': 10, rx: 8 }); C(590, 250, 42, '#f6f1c9'); C(608, 238, 38, '#0f1738'); R(566, 150, 8, 220, '#8a6a4a');
      el('path', { d: 'M 40 400 L 330 430 L 330 940 L 40 940 Z', fill: '#2d6f78', stroke: OLK, 'stroke-width': 8, 'stroke-linejoin': 'round' }, p);
      const light = el('path', { d: 'M 330 440 L 720 330 L 720 1228 L 330 940 Z', fill: '#ffe9a8', opacity: .35 }, p);
      R(20, 380, 330, 570, '#f4f7fb', { stroke: OLK, 'stroke-width': 8, rx: 10, opacity: 0 });
      R(70, 440, 250, 480, '#eaf2fb', { stroke: OLK, 'stroke-width': 6, rx: 6 });
      [560, 690, 820].forEach(y => R(70, y, 250, 10, '#9bb4cc'));
      C(120, 500, 26, '#e8483f', { stroke: OLK, 'stroke-width': 4 }); C(200, 506, 22, '#ffb627', { stroke: OLK, 'stroke-width': 4 }); R(240, 480, 50, 74, '#5ab0ff', { rx: 8, stroke: OLK, 'stroke-width': 4 }); R(100, 600, 120, 70, '#fff', { rx: 8, stroke: OLK, 'stroke-width': 4 }); R(240, 610, 50, 60, '#59c24a', { rx: 8, stroke: OLK, 'stroke-width': 4 });
      R(0, 520, 70, 420, '#2d6f78', { stroke: OLK, 'stroke-width': 6, opacity: .0 });
      upd.push(T => light.setAttribute('opacity', (.3 + .08 * Math.sin(T * 3)).toFixed(2)));
    } else if (kind === 'inv_dark') {
      R(0, 0, 720, 1228, '#12163a'); for (let i = 0; i < 9; i++) R(i * 90, 0, 45, 940, '#171c46', { opacity: .6 });
      R(0, 940, 720, 288, '#1c1b3d'); R(0, 930, 720, 14, '#0c0e26');
      R(60, 260, 220, 300, '#0c1030', { stroke: '#5a4a78', 'stroke-width': 10, rx: 10 }); C(180, 360, 52, '#f6f1c9'); C(204, 346, 46, '#0c1030'); R(176, 260, 8, 300, '#5a4a78'); R(60, 400, 220, 8, '#5a4a78');
      el('path', { d: 'M 40 250 Q 80 400 56 580 L 20 580 L 20 250 Z M 300 250 Q 262 400 284 580 L 320 580 L 320 250 Z', fill: '#4a2a5e', opacity: .95 }, p);
      R(470, 330, 200, 600, '#0a0c22', { stroke: '#5a4a78', 'stroke-width': 10, rx: 8 });
      const door = el('path', { d: 'M 470 330 L 560 360 L 560 900 L 470 930 Z', fill: '#2a1f4a', stroke: '#5a4a78', 'stroke-width': 6, 'stroke-linejoin': 'round' }, p);
      const crack = el('path', { d: 'M 560 360 L 670 340 L 670 930 L 560 900 Z', fill: '#7be0ff', opacity: .4 }, p);
      el('ellipse', { cx: 360, cy: 1040, rx: 250, ry: 60, fill: '#2d2a5e', opacity: .8 }, p);
      const st = []; for (let i = 0; i < 18; i++) st.push(C(20 + rnd(i + 3) * 680, 40 + rnd(i + 9) * 200, .8 + rnd(i + 21) * 1.8, '#fff'));
      upd.push(T => { crack.setAttribute('opacity', (.3 + .15 * Math.sin(T * 3)).toFixed(2)); st.forEach((s, i) => s.setAttribute('opacity', (.25 + .6 * Math.abs(Math.sin(T * 1.3 + i))).toFixed(2))); });
    } else if (kind === 'inv_restaurant') {
      R(0, 0, 720, 1228, '#ffd9a8'); for (let i = 0; i < 9; i++) R(i * 90, 0, 45, 900, '#ffe6c4', { opacity: .6 });
      R(0, 900, 720, 328, '#b9794a'); R(0, 890, 720, 22, '#e2a870');
      [120, 360, 600].forEach((x, i) => { el('line', { x1: x, y1: 0, x2: x, y2: 210, stroke: OLK, 'stroke-width': 5 }, p); el('path', { d: `M ${x - 56} 250 Q ${x - 50} 200 ${x} 200 Q ${x + 50} 200 ${x + 56} 250 Z`, fill: i === 1 ? '#e8483f' : '#ffb627', stroke: OLK, 'stroke-width': 5 }, p); el('ellipse', { cx: x, cy: 262, rx: 40, ry: 12, fill: '#fff6c4', opacity: .9 }, p); });
      R(40, 400, 200, 170, '#fff', { stroke: OLK, 'stroke-width': 6, rx: 10 }); el('path', { d: 'M 60 540 L 100 480 L 140 520 L 180 450 L 220 540 Z', fill: '#59c24a' }, p); C(190, 450, 18, '#ffd34d');
      R(480, 400, 200, 170, '#fff', { stroke: OLK, 'stroke-width': 6, rx: 10 }); X.text(p, 'MENU', 580, 490, 44, '#e8483f', 900); X.text(p, 'BURGER', 580, 540, 30, '#3a2412', 800);
      R(60, 940, 600, 28, '#d9d9e6', { rx: 8, stroke: OLK, 'stroke-width': 5 });
      for (let i = 0; i < 12; i++) R(60 + i * 50, 968, 50, 90, i % 2 ? '#e8483f' : '#fff', { stroke: OLK, 'stroke-width': 3 });
      R(120, 1058, 24, 150, '#7a4a28'); R(576, 1058, 24, 150, '#7a4a28');
    } else if (kind === 'inv_bath') {
      R(0, 0, 720, 1228, '#cfe8ee'); for (let i = 0; i <= 8; i++) el('line', { x1: i * 90, y1: 0, x2: i * 90, y2: 940, stroke: '#a9cdd6', 'stroke-width': 3 }, p); for (let i = 0; i <= 12; i++) el('line', { x1: 0, y1: i * 80, x2: 720, y2: i * 80, stroke: '#a9cdd6', 'stroke-width': 3 }, p);
      R(0, 930, 720, 298, '#8fb0b8'); R(0, 920, 720, 16, '#6f9099');
      R(140, 200, 440, 500, '#e9f3f7', { rx: 34, stroke: '#7a8a99', 'stroke-width': 16 }); R(160, 220, 400, 460, '#f4fbfe', { rx: 22 });
      R(230, 470, 260, 210, '#dcecf2', { rx: 6 }); el('path', { d: 'M 300 470 L 300 300 Q 360 270 420 300 L 420 470 Z', fill: '#e6f0f3' }, p);
      el('path', { d: 'M 190 240 L 300 240 L 200 460 L 190 460 Z M 330 240 L 370 240 L 260 460 L 220 460 Z', fill: '#fff', opacity: .55 }, p);
      R(60, 900, 600, 328, '#f1f5f8', { rx: 14, stroke: OLK, 'stroke-width': 6 }); el('ellipse', { cx: 360, cy: 905, rx: 170, ry: 24, fill: '#cfe0e8', stroke: OLK, 'stroke-width': 5 }, p);
      R(352, 840, 16, 60, '#b8c4cc', { stroke: OLK, 'stroke-width': 4 }); R(330, 836, 60, 14, '#b8c4cc', { rx: 6, stroke: OLK, 'stroke-width': 4 });
      R(80, 150, 12, 40, '#d4a373'); el('path', { d: 'M 60 190 L 112 190 L 106 330 L 66 330 Z', fill: '#ffb6c1', stroke: OLK, 'stroke-width': 4 }, p);
    } else if (kind === 'inv_bed') {
      R(0, 0, 720, 1228, '#f6e5c8'); for (let i = 0; i < 9; i++) R(i * 90, 0, 45, 950, '#fbeed6', { opacity: .6 });
      R(0, 950, 720, 278, '#d9b38c'); R(0, 940, 720, 14, '#b98d62');
      R(40, 120, 190, 220, '#bfe6ff', { rx: 10, stroke: '#8a5a3a', 'stroke-width': 10 }); const sun = C(110, 200, 34, '#ffd34d'); R(131, 120, 8, 220, '#8a5a3a'); R(40, 226, 190, 8, '#8a5a3a');
      R(110, 300, 500, 400, '#8a5a3a', { rx: 46 }); R(130, 320, 460, 360, '#a9743f', { rx: 36 });
      el('ellipse', { cx: 245, cy: 640, rx: 96, ry: 54, fill: '#fff', stroke: OLK, 'stroke-width': 5 }, p); el('ellipse', { cx: 475, cy: 640, rx: 96, ry: 54, fill: '#fff', stroke: OLK, 'stroke-width': 5 }, p);
      R(80, 700, 560, 270, '#6f93c9', { rx: 18, stroke: OLK, 'stroke-width': 6 });
      upd.push(T => sun.setAttribute('r', (34 + 2.5 * Math.sin(T * 2)).toFixed(1)));
    } else if (kind === 'inv_street') {
      const gr = el('linearGradient', { id: 'is' + (++UID), x1: 0, y1: 0, x2: 0, y2: 1 }, el('defs', {}, p)); el('stop', { offset: 0, 'stop-color': '#7ec8ff' }, gr); el('stop', { offset: 1, 'stop-color': '#e6f6ff' }, gr);
      R(0, 0, 720, 1228, 'url(#' + gr.getAttribute('id') + ')'); C(590, 150, 46, '#ffe27a');
      [[40, 60, 120], [170, 210, 150], [560, 160, 150]].forEach(([x, y, w], i) => R(x, 300 + y * .3, w, 700, ['#9fb4d9', '#b7c4e4', '#8fa3cc'][i], { opacity: .8 }));
      R(150, 330, 420, 600, '#3a2f5a', { stroke: OLK, 'stroke-width': 8, rx: 8 }); R(210, 360, 300, 78, '#ff4d8d', { rx: 14, stroke: OLK, 'stroke-width': 5 }); X.text(p, 'VIP CLUB', 360, 414, 50, '#fff', 900);
      R(280, 520, 160, 410, '#1d1633', { stroke: OLK, 'stroke-width': 6 }); R(358, 520, 4, 410, '#6b5a98');
      R(0, 930, 720, 298, '#b9b9c9'); R(0, 925, 720, 16, '#8f8fa3'); R(250, 935, 220, 293, '#d8353a');
      [150, 570].forEach(x => { R(x - 7, 760, 14, 175, '#d4af37', { stroke: OLK, 'stroke-width': 4 }); C(x, 756, 15, '#d4af37', { stroke: OLK, 'stroke-width': 4 }); });
      el('path', { d: 'M 150 780 Q 360 880 570 780', fill: 'none', stroke: '#b3202a', 'stroke-width': 12, 'stroke-linecap': 'round' }, p);
    } else if (kind === 'inv_living') {
      R(0, 0, 720, 1228, '#f1d9bd'); for (let i = 0; i < 9; i++) R(i * 90, 0, 45, 950, '#f6e3c9', { opacity: .6 });
      R(0, 950, 720, 278, '#b98d62'); R(0, 940, 720, 14, '#8f6a45'); el('ellipse', { cx: 360, cy: 1000, rx: 330, ry: 52, fill: '#8f5fa8', opacity: .6 }, p);
      R(40, 250, 210, 380, '#8a5a3a', { rx: 8, stroke: OLK, 'stroke-width': 6 }); [330, 410, 490].forEach(y => R(52, y, 186, 8, '#5e3c24'));
      [['#e8483f', 60], ['#4a90e2', 96], ['#59c24a', 132], ['#ffb627', 168], ['#a56bff', 200]].forEach(([c, x], i) => R(x, 262, 28, 64, c, { stroke: OLK, 'stroke-width': 3 }));
      [['#4a90e2', 70], ['#ffb627', 120], ['#e8483f', 170]].forEach(([c, x]) => R(x, 345, 40, 64, c, { stroke: OLK, 'stroke-width': 3 }));
      R(330, 300, 340, 220, '#10142e', { rx: 10, stroke: OLK, 'stroke-width': 8 }); const scr = R(344, 314, 312, 192, '#3d7be0', { rx: 4 }); R(480, 520, 40, 40, '#2a2a3a'); R(400, 556, 200, 14, '#2a2a3a', { rx: 6 });
      R(30, 740, 330, 210, '#c0504d', { rx: 24, stroke: OLK, 'stroke-width': 6 }); R(30, 700, 330, 80, '#d06461', { rx: 26, stroke: OLK, 'stroke-width': 6 });
      upd.push(T => scr.setAttribute('fill', ['#3d7be0', '#e0623d', '#59c24a'][Math.floor(T * 1.6) % 3]));
    } else if (kind === 'inv_room') {
      R(0, 0, 720, 1228, '#ffe2c0'); for (let i = 0; i < 9; i++) R(i * 90, 0, 45, 700, '#ffe9cf', { opacity: .6 }); R(0, 700, 720, 250, '#e8b98a');
      R(0, 950, 720, 278, '#b98d62'); for (let i = 0; i < 8; i++) el('line', { x1: 0, y1: 950 + i * 40, x2: 720, y2: 950 + i * 40, stroke: '#a67a52', 'stroke-width': 3 }, p);
      R(0, 940, 720, 14, '#8f6a45'); R(470, 180, 200, 280, '#bfe6ff', { rx: 8, stroke: '#8a5a3a', 'stroke-width': 10 }); R(566, 180, 8, 280, '#8a5a3a');
      el('path', { d: 'M 440 170 Q 480 320 452 470 L 420 470 L 420 170 Z M 700 170 Q 660 320 688 470 L 720 470 L 720 170 Z', fill: '#e8603d' }, p);
      R(50, 220, 130, 170, '#fff', { stroke: '#8a5a3a', 'stroke-width': 8 }); el('path', { d: 'M 66 370 L 100 310 L 130 350 L 150 300 L 166 370 Z', fill: '#59c24a' }, p); C(150, 260, 14, '#ffd34d');
      R(210, 300, 90, 120, '#fff', { stroke: '#8a5a3a', 'stroke-width': 8 }); C(255, 350, 28, '#ff8fb1');
    } else {
      const gr = el('linearGradient', { id: 'ig' + (++UID), x1: 0, y1: 0, x2: 0, y2: 1 }, el('defs', {}, p)); el('stop', { offset: 0, 'stop-color': '#3a1f7a' }, gr); el('stop', { offset: 1, 'stop-color': '#13204f' }, gr);
      R(0, 0, 720, 1228, 'url(#' + gr.getAttribute('id') + ')');
      const bub = [['PRANK!', 90, 420, '#ffb627'], ['SNACKS!', 520, 470, '#59c24a'], ['SCARE!', 110, 880, '#ff6b6b'], ['SPY!', 560, 900, '#7be0ff']].map(([tx, x, y, col], i) => { const gg = el('g', {}, p); el('rect', { x: -78, y: -34, width: 156, height: 62, rx: 28, fill: col, stroke: OLK, 'stroke-width': 5 }, gg); el('path', { d: 'M -20 28 L -34 50 L 0 28 Z', fill: col, stroke: OLK, 'stroke-width': 5, 'stroke-linejoin': 'round' }, gg); X.text(gg, tx, 0, 10, 32, '#14213d', 900); return { gg, x, y, i }; });
      const q = [0, 1, 2, 3, 4, 5].map(i => X.text(p, '?', 0, 0, 60 + (i % 3) * 24, '#cdb6ff', 900));
      upd.push(T => { bub.forEach(b => b.gg.setAttribute('transform', `translate(${b.x} ${b.y + Math.sin(T * 2 + b.i) * 14}) rotate(${Math.sin(T * 1.4 + b.i) * 4})`)); q.forEach((e, i) => { const u = (T * .3 + i / 6) % 1; e.setAttribute('transform', `translate(${60 + (i * 117) % 620} ${1100 - u * 900})`); e.setAttribute('opacity', (.5 * Math.sin(u * 3.14)).toFixed(2)); }); });
    }
    return { update: T => upd.forEach(f => f(T)) };
  }

  window.TOON.draw = function (parent, w, mood, t, color) {
    w = who(w); const cg = el('g', {}, parent), body = el('g', {}, cg);
    const b = BODIES[w](body, color || null);
    const fg = el('g', { transform: `translate(0 ${b.fy}) scale(${b.fs})` }, cg), face = b.noface ? (() => { }) : (b.makeFace ? b.makeFace(fg) : makeFace(fg, b.noblush));
    if (b.afterFace) b.afterFace(cg);
    const ex = b.noface ? null : makeExtras(b.exy ? el('g', { transform: `translate(${b.exx || 0} ${b.exy})` }, cg) : cg, b.top), p = moodP(mood);
    face(p, t, { x: .2, y: .1 }, 1); if (ex) tickExtras(ex, p, t, 1); b.tick(t, p); return cg;
  };

  const WHO = Object.keys(BODIES);
  const ALIAS = { hole: 'blackhole', singularity: 'blackhole', robot: 'buddy', spaceman: 'astronaut', cosmonaut: 'astronaut', mascot: 'buddy', ai: 'buddy', sparkle: 'star', internet: 'cloud', wifi: 'cloud', google: 'buddy', rupee: 'coin', money: 'coin', mobile: 'phone', idea: 'bulb', light: 'bulb', computer: 'server', planet: 'earth', water: 'drop', raindrop: 'drop', sunflower: 'flower', plant: 'flower', seedling: 'sprout', ground: 'soil', earthworm: 'worm', orca: 'whale', squid: 'octopus', jelly: 'jellyfish', submarine: 'sub', goldfish: 'fish', lanternfish: 'angler', seaturtle: 'turtle' };
  const who = w => { w = String(w || 'buddy').toLowerCase().trim(); return BODIES[w] ? w : (ALIAS[w] || 'buddy'); };
  Object.assign(window.TOON, { WHO, MOOD_NAMES });

  /* ----------------------------------------------------------- extras above the head */

  /* A human cartoon face (skin, brown hair, expressive eyes and brows) for characters seen through a helmet. Same mood parameters as makeFace. */
  function makeHumanFace(parent) {
    const OL = '#14122b', SK = '#f7c79d', HR = '#7a4725', f = el('g', {}, parent);
    el('ellipse', { cx: 0, cy: -10, rx: 70, ry: 72, fill: HR, stroke: OL, 'stroke-width': 4.5 }, f);
    [-1, 1].forEach(sg => el('ellipse', { cx: sg * 62, cy: 10, rx: 11, ry: 15, fill: SK, stroke: OL, 'stroke-width': 4 }, f));
    el('path', { d: 'M -59 -12 C -59 -52 -32 -62 0 -62 C 32 -62 59 -52 59 -12 C 61 36 34 64 0 64 C -34 64 -61 36 -59 -12 Z', fill: SK, stroke: OL, 'stroke-width': 4.5 }, f);
    const cheeks = [-1, 1].map(sg => el('ellipse', { cx: sg * 40, cy: 26, rx: 13, ry: 8, fill: '#ff8a80' }, f));
    el('path', { d: 'M -3 12 Q 3 22 10 15', fill: 'none', stroke: '#c9885a', 'stroke-width': 3.5, 'stroke-linecap': 'round' }, f);
    const eyes = [-1, 1].map(sg => {
      const g = el('g', {}, f);
      const white = el('ellipse', { rx: 15, ry: 18, fill: '#fff', stroke: OL, 'stroke-width': 3.5 }, g);
      const pup = el('circle', { r: 9, fill: '#2b1a12' }, g);
      const hi = el('circle', { r: 3.2, fill: '#fff' }, g);
      const arc = el('path', { d: 'M -15 5 Q 0 -16 15 5', fill: 'none', stroke: OL, 'stroke-width': 5, 'stroke-linecap': 'round' }, g);
      return { s: sg, g, white, pup, hi, arc };
    });
    const brows = [-1, 1].map(sg => ({ s: sg, e: el('line', { x1: -14, y1: 0, x2: 14, y2: 0, stroke: '#4a2a14', 'stroke-width': 7, 'stroke-linecap': 'round' }, f) }));
    const mouth = el('path', { fill: '#6b1f2a', stroke: OL, 'stroke-width': 4, 'stroke-linejoin': 'round', 'stroke-linecap': 'round' }, f);
    const tongue = el('ellipse', { rx: 8, ry: 5, fill: '#ff7a8a' }, f);
    // fringe + tufts (on top of the forehead)
    el('path', { d: 'M -62 -14 C -66 -64 -22 -84 8 -74 C 40 -82 70 -56 62 -14 C 54 -40 38 -48 20 -50 C 8 -34 -20 -48 -36 -40 C -50 -34 -58 -28 -62 -14 Z', fill: HR, stroke: OL, 'stroke-width': 4.5, 'stroke-linejoin': 'round' }, f);
    el('path', { d: 'M -8 -74 C -2 -92 18 -92 22 -78 C 12 -80 6 -76 -8 -74 Z', fill: HR, stroke: OL, 'stroke-width': 4, 'stroke-linejoin': 'round' }, f);
    el('path', { d: 'M -40 -62 Q -22 -74 -4 -70', fill: 'none', stroke: '#a8683a', 'stroke-width': 5, 'stroke-linecap': 'round', opacity: .8 }, f);
    return function (p, t, look, blink) {
      cheeks.forEach(c => c.setAttribute('opacity', (p.blush * .55).toFixed(3)));
      const oy = p.open * blink;
      eyes.forEach(e => {
        const lx = (look.x + (p.dizzy ? Math.cos(t * 9 + e.s) * .9 : 0)) * 5, ly = (look.y - p.lookUp * .9 + (p.dizzy ? Math.sin(t * 9 + e.s) * .9 : 0)) * 5;
        e.g.setAttribute('transform', `translate(${e.s * 26} -4) scale(${p.eye} ${(p.eye * Math.max(.06, oy)).toFixed(3)})`);
        const ar = e.s === 1 ? Math.max(p.arc, p.wink) : p.arc;
        e.white.setAttribute('opacity', (1 - ar).toFixed(3));
        e.pup.setAttribute('r', Math.min(11, 17 * p.pup).toFixed(2)); e.pup.setAttribute('cx', lx.toFixed(2)); e.pup.setAttribute('cy', ly.toFixed(2)); e.pup.setAttribute('opacity', (1 - ar).toFixed(3));
        e.hi.setAttribute('cx', (lx - 3.5).toFixed(2)); e.hi.setAttribute('cy', (ly - 4.5).toFixed(2)); e.hi.setAttribute('opacity', (1 - ar).toFixed(3));
        e.arc.setAttribute('opacity', ar.toFixed(3));
      });
      brows.forEach(b => b.e.setAttribute('transform', `translate(${b.s * 26} ${-34 + p.browY}) rotate(${b.s * p.brow})`));
      const tk = p.talk, syl = tk * (.25 + .75 * Math.abs(Math.sin(t * 10.3)) * (.6 + .4 * Math.abs(Math.sin(t * 3.1))));
      const w = p.mw * .8 * (1 + tk * .08), my = 38, c = lerp(p.curve, Math.max(.3, p.curve), tk), o = p.mo * (1 - tk * .5) + syl * 1.1;
      const top = my + 18 * c, bot = my + 18 * c + o * 36;
      mouth.setAttribute('d', `M ${-w} ${my} Q 0 ${top} ${w} ${my} Q 0 ${bot} ${-w} ${my} Z`);
      mouth.setAttribute('fill', o > .08 ? '#6b1f2a' : 'none');
      tongue.setAttribute('cx', 0); tongue.setAttribute('cy', (my + 9 * c + o * 28).toFixed(1)); tongue.setAttribute('rx', (w * .4).toFixed(1)); tongue.setAttribute('ry', (Math.min(1, o * 1.4) * 6).toFixed(1)); tongue.setAttribute('opacity', o > .3 ? 1 : 0);
    };
  }
  function makeExtras(parent, top) {
    const ex = {};
    ex.sweat = el('path', { d: 'M 0 -14 Q 10 2 0 10 Q -10 2 0 -14 Z', fill: '#8fdcff' }, parent);
    ex.tears = [-1, 1].map(s => el('path', { d: 'M 0 -8 Q 7 2 0 8 Q -7 2 0 -8 Z', fill: '#8fdcff' }, parent));
    ex.zzz = [0, 1, 2].map(i => X.text(parent, 'z', 0, 0, 34 + i * 10, '#c9d6ff', 800));
    ex.hearts = [0, 1, 2].map(() => el('path', { d: 'M0 -4 C -8 -14 -20 -2 0 12 C 20 -2 8 -14 0 -4 Z', fill: '#ff5c8a' }, parent));
    ex.stars = [0, 1, 2].map(() => el('path', { d: 'M0 -12 L3 -3 L12 0 L3 3 L0 12 L-3 3 L-12 0 L-3 -3 Z', fill: '#fff3b0' }, parent));
    ex.excl = X.text(parent, '!', 0, 0, 84, '#ffd34d', 900);
    ex.ques = X.text(parent, '?', 0, 0, 84, '#8fdcff', 900);
    ex.top = top;
    return ex;
  }
  function tickExtras(ex, p, t, pop) {
    const sw = p.sweat; ex.sweat.setAttribute('opacity', sw.toFixed(3));
    ex.sweat.setAttribute('transform', `translate(78 ${-52 + ((t * 30) % 34)}) scale(${.9 + .2 * Math.sin(t * 6)})`);
    ex.tears.forEach((e, i) => { const u = ((t * 1.3 + i * .5) % 1); e.setAttribute('opacity', (p.tears * (1 - u)).toFixed(3)); e.setAttribute('transform', `translate(${(i ? 1 : -1) * 40} ${8 + u * 70})`); });
    ex.zzz.forEach((e, i) => { const u = ((t * .5 + i * .33) % 1); e.setAttribute('opacity', (p.zzz * Math.sin(u * Math.PI)).toFixed(3)); e.setAttribute('transform', `translate(${70 + u * 40} ${-60 - u * 80}) rotate(${-10 + u * 20})`); });
    ex.hearts.forEach((e, i) => { const u = ((t * .6 + i * .33) % 1); e.setAttribute('opacity', (p.hearts * Math.sin(u * Math.PI)).toFixed(3)); e.setAttribute('transform', `translate(${(i - 1) * 55} ${-90 - u * 90}) scale(${.8 + .5 * u})`); });
    ex.stars.forEach((e, i) => { const a = t * 2 + i * 2.09; e.setAttribute('opacity', (p.stars * (.6 + .4 * Math.sin(t * 7 + i))).toFixed(3)); e.setAttribute('transform', `translate(${Math.cos(a) * 125} ${Math.sin(a) * 62 - 70}) scale(${.8 + .3 * Math.sin(t * 5 + i)}) rotate(${t * 60})`); });
    const bounce = pop;
    ex.excl.setAttribute('opacity', p.excl.toFixed(3)); ex.excl.setAttribute('transform', `translate(${0} ${ex.top}) scale(${(.5 + .5 * bounce) * (p.excl > .01 ? 1 : .01)}) rotate(${Math.sin(t * 12) * 6})`);
    ex.ques.setAttribute('opacity', p.ques.toFixed(3)); ex.ques.setAttribute('transform', `translate(${60} ${ex.top + 10}) scale(${(.5 + .5 * bounce) * (p.ques > .01 ? 1 : .01)}) rotate(${12 + Math.sin(t * 5) * 8})`);
  }


  const STOPS = [[0, [88, 208, 244]], [150, [36, 150, 205]], [600, [16, 80, 150]], [1500, [9, 40, 100]], [4000, [5, 18, 55]], [11000, [2, 6, 22]]];
  function oceanCol(dm) {
    dm = Math.max(0, Math.min(11000, dm));
    for (let i = 1; i < STOPS.length; i++) if (dm <= STOPS[i][0]) { const a = STOPS[i - 1], b = STOPS[i], u = (dm - a[0]) / (b[0] - a[0]); return a[1].map((v, k) => Math.round(v + (b[1][k] - v) * u)); }
    return STOPS[STOPS.length - 1][1];
  }
  const rgb = c => `rgb(${c[0]},${c[1]},${c[2]})`;
  const fmtM = v => Math.round(v).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',') + ' m';
  function makeOcean(parent, withGauge) {
    const id = 'og' + (++UID);
    const defs = el('defs', {}, parent);
    const lg = el('linearGradient', { id, x1: 0, y1: 0, x2: 0, y2: 1 }, defs);
    const s1 = el('stop', { offset: '0%' }, lg), s2 = el('stop', { offset: '100%' }, lg);
    el('rect', { x: -40, y: -40, width: 800, height: 1310, fill: `url(#${id})` }, parent);
    const rays = []; for (let i = 0; i < 4; i++) rays.push(el('path', { d: `M ${80 + i * 170} 0 L ${150 + i * 170} 0 L ${60 + i * 170} 900 L ${-50 + i * 170} 900 Z`, fill: '#fff' }, parent));
    const snow = []; for (let i = 0; i < 46; i++) snow.push({ e: el('circle', { r: .8 + rnd(i + 70) * 2.2, fill: '#cfe8ff' }, parent), x: rnd(i + 31) * 720, o: rnd(i + 50) * 1300, k: .6 + rnd(i + 90) });
    const bub = []; for (let i = 0; i < 14; i++) bub.push({ e: el('circle', { fill: 'none', stroke: '#fff', 'stroke-width': 2.5 }, parent), x: 30 + rnd(i + 11) * 660, o: rnd(i + 17) * 1400, r: 4 + rnd(i + 5) * 9, k: .5 + rnd(i + 3) * .9 });
    const floor = el('path', { d: 'M 0 1228 L 0 1120 Q 90 1070 190 1116 T 400 1100 T 600 1086 T 720 1100 L 720 1228 Z', fill: '#0a1024' }, parent);
    const gauge = el('g', {}, parent);
    let mk, tx, rate = 0;
    if (withGauge) {
      el('line', { x1: 698, y1: 190, x2: 698, y2: 1010, stroke: '#fff', 'stroke-width': 3, opacity: .4, 'stroke-linecap': 'round' }, gauge);
      [[0, '0'], [200, '200'], [1000, '1,000'], [4000, '4,000'], [11000, '11,000']].forEach(([m, l]) => { const y = 190 + 820 * Math.sqrt(m / 11000); el('line', { x1: 690, y1: y, x2: 706, y2: y, stroke: '#fff', 'stroke-width': 3, opacity: .5 }, gauge); X.text(gauge, l, 680, y + 6, 17, '#fff', 600, 'end', { opacity: .55 }); });
      mk = el('path', { d: 'M 698 0 L 674 -13 L 674 13 Z', fill: X.ORANGE }, gauge);
      tx = X.text(gauge, '', 666, 0, 30, '#fff', 800, 'end');
    }
    return { rays, update(dm, t, r) {
      const top = oceanCol(dm), bot = oceanCol(dm + 700);
      s1.setAttribute('stop-color', rgb(top)); s2.setAttribute('stop-color', rgb(bot));
      const ro = Math.max(0, 1 - dm / 900) * .2;
      rays.forEach((e, i) => { e.setAttribute('opacity', ro.toFixed(3)); e.setAttribute('transform', `skewX(${Math.sin(t * .5 + i) * 4})`); });
      const sn = Math.min(1, Math.max(0, (dm - 80) / 300)); const v = 25 + 140 * Math.min(1, Math.abs(r));
      snow.forEach(q => { const y = 1280 - ((q.o + t * v * q.k) % 1320); q.e.setAttribute('cx', (q.x + Math.sin(t + q.o) * 8).toFixed(1)); q.e.setAttribute('cy', y.toFixed(1)); q.e.setAttribute('opacity', (sn * .6).toFixed(2)); });
      const bo = Math.max(0, 1 - dm / 1500);
      bub.forEach(q => { const y = 1300 - ((q.o + t * 60 * q.k) % 1400); q.e.setAttribute('cx', (q.x + Math.sin(t * 2 + q.o) * 10).toFixed(1)); q.e.setAttribute('cy', y.toFixed(1)); q.e.setAttribute('r', q.r.toFixed(1)); q.e.setAttribute('opacity', (bo * .45).toFixed(2)); });
      const fp = Math.min(1, Math.max(0, (dm - 10300) / 600)); floor.setAttribute('transform', `translate(0 ${(260 * (1 - fp)).toFixed(0)})`); floor.setAttribute('opacity', fp > 0 ? 1 : 0);
      if (mk) { const y = 190 + 820 * Math.sqrt(Math.min(1, dm / 11000)); mk.setAttribute('transform', `translate(0 ${y.toFixed(1)})`); tx.setAttribute('y', (y + 10).toFixed(1)); tx.textContent = fmtM(dm); }
    } };
  }

  /* ----------------------------------------------------------------- scene */
  S.toon = function (g, d) {
    const cast = (Array.isArray(d.cast) && d.cast.length ? d.cast : [{ who: d.who || 'buddy', mood: d.mood || 'happy', mood2: d.mood2, act: d.act }]).slice(0, 6);
    const n = cast.length, at = clamp(Number(d.at) > 0 ? Number(d.at) : .5, .15, .85);
    let layout = String(d.layout || 'auto'); if (layout === 'auto') layout = n === 1 ? 'solo' : (n === 2 ? 'duo' : 'trio');
    const orbit = layout === 'orbit' && n >= 2;
    const bg = el('g', {}, g);
    // twinkling background stars
    const ocean = d.bg === 'ocean' ? makeOcean(bg, d.depth !== undefined) : null;
    const D0 = Number(d.depth) || 0, D1 = d.depth2 !== undefined ? Number(d.depth2) || 0 : D0;
    const stars = []; for (let i = 0; i < (ocean || d.bg === 'kitchen' || BRAIN_BGS.indexOf(d.bg) >= 0 || INV_BGS.indexOf(d.bg) >= 0 ? 0 : 26); i++) stars.push({ e: el('circle', { cx: 20 + rnd(i + 3) * 680, cy: 60 + rnd(i + 9) * 1000, r: .8 + rnd(i + 21) * 2.2, fill: '#fff' }, bg), k: i });
    if (d.bg === 'kitchen') {
      el('rect', { x: 0, y: 0, width: 720, height: 1228, fill: '#ffe9c4' }, bg);
      for (let r = 0; r < 14; r++) for (let c = 0; c < 8; c++) el('rect', { x: c * 100 - (r % 2 ? 50 : 0) + 4, y: r * 70 + 4, width: 92, height: 62, rx: 8, fill: (r + c) % 2 ? '#fff3dc' : '#ffe2b0' }, bg);
      el('rect', { x: 0, y: 900, width: 720, height: 330, fill: '#b9794a' }, bg); el('rect', { x: 0, y: 890, width: 720, height: 26, fill: '#e2a870' }, bg);
      for (let i = 0; i < 5; i++) el('path', { d: `M ${i * 160} 930 L ${i * 160} 1228`, stroke: '#a26636', 'stroke-width': 4, opacity: .6 }, bg);
    }
    const brainBg = INV_BGS.indexOf(d.bg) >= 0 ? makeInvBg(d.bg, bg) : makeBrainBg(d.bg, bg);
    if (d.bg === 'day') { el('rect', { x: 0, y: 0, width: 720, height: 1228, fill: '#2d63b8', opacity: .55 }, bg); }

    const CX = 360, CY = 620;
    const pos = (n === 1 ? [[CX, CY, 2.1]] : n === 2 ? [[215, 760, 1.65], [505, 470, 1.55]] : [[CX, 440, 1.3], [185, 820, 1.3], [535, 820, 1.3]]);
    const orbitG = el('g', {}, g);
    const orbs = [];
    if (orbit) { const rx1 = 250, ry1 = 190; orbs.push([rx1, ry1]); el('ellipse', { cx: CX, cy: CY, rx: rx1, ry: ry1, fill: 'none', stroke: '#8fdcff', 'stroke-width': 3, 'stroke-dasharray': '4 14', 'stroke-linecap': 'round', opacity: .45 }, orbitG); }
    const chars = cast.map((c, i) => {
      const w = who(c.who), cg = el('g', {}, g), body = el('g', {}, cg);
      const b = BODIES[w](body, typeof c.color === 'string' && /^#[0-9a-f]{3,8}$/i.test(c.color) ? c.color : (typeof c.text === 'string' ? c.text : null));
      const fg = el('g', { transform: `translate(0 ${b.fy}) scale(${b.fs})` }, cg), face = b.noface ? (() => { }) : (b.makeFace ? b.makeFace(fg) : makeFace(fg, b.noblush));
      if (b.afterFace) b.afterFace(cg);
      const ex = b.noface ? null : makeExtras(b.exy ? el('g', { transform: `translate(${b.exx || 0} ${b.exy})` }, cg) : cg, b.top);
      const m1 = MOODS[c.mood] ? c.mood : 'happy', m2 = MOODS[c.mood2] ? c.mood2 : m1;
      const act0 = String(c.act || 'float').toLowerCase(); const dir = String(c.dir || '').toLowerCase();
      return { c, i, w, cg, body, b, face, ex, flip: dir === 'right' ? -1 : 1, dirr: dir, P1: moodP(m1), P2: moodP(m2), act: act0, base: (Array.isArray(c.pos) && c.pos.length >= 2 ? [Number(c.pos[0]) || CX, Number(c.pos[1]) || CY, Number(c.pos[2]) || 1.5] : (pos[i] || pos[0])), size: Number(c.size) > 0 ? Number(c.size) : 1 };
    });
    // poof (smoke) used by vanish / appear
    const poofs = chars.map(() => { const pg = el('g', {}, g); const ps = []; for (let k = 0; k < 9; k++) ps.push({ e: el('circle', { fill: k % 3 === 0 ? '#ffd34d' : '#ffffff' }, pg), a: k / 9 * 6.283 + rnd(k) * .6, s: 50 + rnd(k + 5) * 60 }); return { pg, ps }; });
    let label = null;
    if (d.label) { label = text(g, String(d.label), 360, 190, 96, X.ORANGE, 900); X.fit(label, 640); }

    return function (lt, dur) {
      const tAt = at * dur, T = lt;
      bg.setAttribute('opacity', 1);
      if (brainBg) brainBg.update(T);
      stars.forEach(s => s.e.setAttribute('opacity', (.25 + .55 * Math.abs(Math.sin(T * 1.5 + s.k))).toFixed(3)));
      if (ocean) ocean.update(lerp(D0, D1, eio(prog(lt, 0, dur))), T, (D1 - D0) / Math.max(1, dur) / 700);
      const reveal = eob(prog(lt, 0, .45)) ;
      const zoom = 1 + .05 * prog(lt, 0, dur);
      g.setAttribute('transform', `translate(360 614) scale(${zoom}) translate(-360 -614)`);
      const pts = [];
      chars.forEach((o, i) => {
        let x = o.base[0], y = o.base[1], sc = o.base[2] * o.size, rot = 0, vis = 1, brot = 0;
        if (orbit) {
          if (i === 0) { x = CX; y = CY; sc = (n === 3 ? 1.1 : 1.7) * o.size; }
          else if (i === 1) { const a = T * .75 - 1.2; x = CX + Math.cos(a) * 250; y = CY + Math.sin(a) * 190; sc = (n === 3 ? .8 : 1.0) * o.size; }
          else { const p1 = pts[1], a = T * 2.1; x = p1.x + Math.cos(a) * 95; y = p1.y + Math.sin(a) * 60; sc = .5 * o.size; }
        }

        let moving = false, tiltDeg = 0;
        const anchor = (nm, def) => {
          if (Array.isArray(nm) && nm.length === 2) return [Number(nm[0]) || 0, Number(nm[1]) || 0];
          switch (String(nm || def)) {
            case 'left': return [-200, o.base[1]]; case 'right': return [920, o.base[1]]; case 'top': return [o.base[0], -200]; case 'bottom': return [o.base[0], 1450];
            case 'high': return [o.base[0], 250]; case 'deep': return [o.base[0], 960]; case 'center': return [CX, CY]; default: return [o.base[0], o.base[1]];
          }
        };
        if (o.act === 'swim' || o.act === 'dive' || o.act === 'rise' || o.act === 'sink') {
          const c = o.c; const goingLeft = o.dirr === 'left' || (!o.dirr && (c.from === 'right' || (c.to === 'left' && !c.from)));
          const vert = o.act !== 'swim';
          const A = anchor(c.from, vert ? (o.act === 'rise' ? 'deep' : 'high') : (goingLeft ? 'right' : 'left'));
          const B = anchor(c.to, vert ? (o.act === 'rise' ? 'high' : 'deep') : (goingLeft ? 'left' : 'right'));
          const s0 = clamp(Number(c.start) || 0, 0, .95) * dur, e0 = clamp(Number(c.end) > 0 ? Number(c.end) : 1, .05, 1) * dur;
          const at_ = tt => { const u = prog(tt, s0, Math.max(s0 + .3, e0)); const k = vert ? eio(u) : u; return [A[0] + (B[0] - A[0]) * k, A[1] + (B[1] - A[1]) * k]; };
          const P = at_(T), Q = at_(T + .08);
          x = P[0] + (vert ? Math.sin(T * 2.2) * 24 : 0); y = P[1] + (vert ? 0 : (c.walk ? -Math.abs(Math.sin(T * 7)) * 12 : Math.sin(T * 3 + i) * 26));
          const vx = (Q[0] - P[0]) / .08, vy = (Q[1] - P[1]) / .08;
          if (Math.abs(vx) > 8) o.flip = vx > 0 ? -1 : 1; else if (vert && !o.dirr) o.flip = o.flip || 1;
          tiltDeg = clamp(Math.atan2(vy, Math.abs(vx) + 24) * 57.3 * .75, -40, 40);
          moving = Math.hypot(vx, vy) > 20;
        }
        if (o.act === 'circle') { const a = T * 1.1 + i * 2; x = CX + Math.cos(a) * 210; y = CY + Math.sin(a) * 130; o.flip = -Math.sign(-Math.sin(a)) || 1; moving = true; }
        const after = T - tAt, ap = prog(after, 0, .35);
        let sx = 1, sy = 1;
        switch (o.act) {
          case 'hop': y -= Math.abs(Math.sin(T * 4.5)) * 46; sy = 1 + .06 * Math.cos(T * 9); break;
          case 'shake': x += Math.sin(T * 38) * 7 * (after > 0 ? 1.4 : .3); break;
          case 'wiggle': brot = Math.sin(T * 4) * 12; break;
          case 'spin': brot = T * 220; y += Math.sin(T * 6) * 8; break;
          case 'vanish': if (after >= 0) { const u = prog(after, 0, .3); sc *= (1 + .18 * Math.sin(u * 3.14) ) * (1 - eio(u)); vis = u >= 1 ? 0 : 1; } break;
          case 'appear': if (after < 0) { vis = 0; } else { sc *= eob(prog(after, 0, .5)); } break;
          case 'fall': if (after > 0) { y += 1100 * Math.pow(after / 1.3, 2); rot = after * 60; x += after * 30; } break;
          case 'grow': sc *= 1 + .6 * prog(lt, 0, dur); break;
          case 'stretch': { const k = eio(prog(lt, (Number(o.c.start) || 0) * dur, (Number(o.c.end) > 0 ? Number(o.c.end) : 1) * dur)); sy *= 1 + 1.0 * k; sx *= 1 - .4 * k; y -= 40 * k; break; }
          case 'suck': {      // spiral into the black hole, stretched like spaghetti, shrinking away
            const hole = chars.find(q => q.w === 'blackhole'); const hx = hole ? hole.base[0] : CX, hy = hole ? hole.base[1] : CY;
            const s0 = (Number(o.c.start) > 0 ? Number(o.c.start) : .25) * dur, e0 = (Number(o.c.end) > 0 ? Number(o.c.end) : 1) * dur;
            const k = prog(T, s0, e0), kk = Math.pow(k, 2.1);
            const a0 = Math.atan2(o.base[1] - hy, o.base[0] - hx), r0 = Math.hypot(o.base[0] - hx, o.base[1] - hy);
            const a = a0 + kk * 5.2, r = r0 * (1 - kk);
            x = hx + Math.cos(a) * r; y = hy + Math.sin(a) * r * .55;
            const rx = hx - x, ry = hy - y; rot = Math.atan2(-rx, ry) * 57.3 * Math.min(1, k * 3);
            sy *= 1 + 2.4 * kk; sx *= 1 - .5 * kk; sc *= 1 - .9 * Math.pow(k, 1.4); if (k >= .985) vis = 0; break; }
          case 'splat': { const k = prog(lt, (Number(o.c.start) || .5) * dur, (Number(o.c.start) || .5) * dur + .18); y += 95 * k; sy *= 1 - .65 * k; sx *= 1 + .55 * k; if (k >= 1) sx *= 1 + .04 * Math.sin((lt - (Number(o.c.start) || .5) * dur) * 14) * Math.exp(-(lt - (Number(o.c.start) || .5) * dur) * 3); break; }
          case 'shrink': sc *= 1 - .55 * prog(lt, 0, dur); break;
        }
        // idle life: bob + breathe + reaction squash when the mood changes
        if (!moving) y += Math.sin(T * 2.1 + i * 1.7) * 9;
        const br = 1 + .02 * Math.sin(T * 3 + i);
        const pulse = Math.exp(-Math.max(0, after) * 7) * (after >= 0 ? 1 : 0);
        sx = br * (1 - .08 * pulse) * (1 + .0); sy = sy * br * (1 + .14 * pulse);
        if (o.P2.tremble > .5 && after >= 0 || o.P1.tremble > .5 && after < 0) x += Math.sin(T * 50) * 2.5;
        sc *= reveal;
        if (o.c.enter) { const dl = Number(o.c.delay) || 0, k = 1 - eob(prog(lt, dl, dl + .7)), e = String(o.c.enter); x += (e === 'left' ? -560 : e === 'right' ? 560 : 0) * k; y += (e === 'bottom' ? 760 : e === 'top' ? -760 : 0) * k; if (lt < dl) vis = 0; }
                pts[i] = { x, y };
        o.cg.setAttribute('transform', `translate(${x.toFixed(1)} ${y.toFixed(1)}) rotate(${rot.toFixed(1)}) scale(${(sc * sx).toFixed(3)} ${(sc * sy).toFixed(3)})`);
        X.show(o.cg, vis); o.body.setAttribute('transform', `scale(${o.flip || 1} 1) rotate(${(brot - tiltDeg).toFixed(1)})`);
        // expression
        const u = eio(prog(after, -.05, .25));
        const p = mix(o.P1, o.P2, u);
        if (o.c.brief && after >= 0) { const dk = Math.exp(-after * 2.6); p.mo = lerp(.08, p.mo, dk); p.mw = lerp(18, p.mw, dk); p.curve = lerp(-.25, p.curve, dk); p.tongue = 0; p.mw = Math.min(p.mw, 16); p.mo = Math.min(p.mo, .55); }   // mouth opens only for a moment, then closes
        const bl = (T + i * .9) % 3.2; const blink = bl < .13 ? 1 - Math.sin(bl / .13 * 3.14) * .95 : 1;
        // look toward the nearest other character (or the middle)
        let tx = CX, ty = CY; const other = chars.length > 1 ? (i === 0 ? 1 : 0) : -1; if (other >= 0 && pts[other]) { tx = pts[other].x; ty = pts[other].y; } else if (other >= 0) { tx = chars[other].base[0]; ty = chars[other].base[1]; }
        const dx = tx - x, dy = ty - y, L = Math.hypot(dx, dy) || 1, look = { x: (dx / L) * .8, y: (dy / L) * .8 };
        if (other < 0) { look.x = Math.sin(T * .9) * .5; look.y = .1; }
        o.face(p, T, look, blink);
        if (o.ex) tickExtras(o.ex, p, T, o.act === 'vanish' ? 1 : eob(prog(T, 0, .5)));
        o.b.tick(moving ? T * 1.7 : T, p);
      });
      // smoke puffs
      chars.forEach((o, i) => {
        const ev = (o.act === 'vanish' || o.act === 'appear'), pp = poofs[i], after = T - tAt;
        const u = ev ? prog(after, o.act === 'vanish' ? .08 : 0, (o.act === 'vanish' ? .08 : 0) + .7) : 0;
        X.show(pp.pg, ev && u > 0 && u < 1 ? 1 : 0);
        if (!ev || !(u > 0 && u < 1)) return;
        const c = pts[i];
        pp.ps.forEach(q => { const r = q.s * (.35 + eo(u)) * (o.base[2] * .6 + .35); q.e.setAttribute('cx', (c.x + Math.cos(q.a) * eo(u) * q.s * 1.6).toFixed(1)); q.e.setAttribute('cy', (c.y + Math.sin(q.a) * eo(u) * q.s * 1.2).toFixed(1)); q.e.setAttribute('r', r.toFixed(1)); q.e.setAttribute('opacity', (.9 * (1 - u)).toFixed(3)); });
      });
      if (orbit) {
        const after = T - tAt, gone = chars[1] && chars[1].act === 'vanish' && after > .3;
        orbitG.setAttribute('opacity', gone ? Math.max(0, 1 - prog(after, .3, .8)) : 1);
      }
      if (label) { const p = prog(lt, .25, .7); label.setAttribute('opacity', p.toFixed(3)); X.pop(label, 360, 190, .6 + .4 * eob(p)); }
    };
  };

  /* ============================================================================
     CONVERSATION scenes (type "talk"): characters speak in speech bubbles, mouths move, no voice needed.
     data = { bg: garden|cutaway|rain, label, cast:[{who, mood, where: ground|under|sky, name, x, scale}],
              lines:[{who: index, text, mood, react:{idx:mood}, change:{idx:'sprout'}}] }
     ============================================================================ */
  const limbify = (name, cfg) => {
    const orig = BODIES[name];
    BODIES[name] = function (g, c) {
      const arms = [-1, 1].map(s => {
        const o = el('g', { transform: `translate(${s * cfg.ax} ${cfg.ay})` }, g), i = el('g', {}, o);
        el('path', { d: `M 0 0 Q ${s * 28} ${cfg.dy} ${s * cfg.len} ${cfg.dy2}`, fill: 'none', stroke: cfg.col, 'stroke-width': 16, 'stroke-linecap': 'round' }, i);
        el('circle', { cx: s * cfg.len, cy: cfg.dy2, r: 15, fill: cfg.col }, i); return { s, i };
      });
      if (cfg.legs) [-1, 1].forEach(s => {
        el('rect', { x: s * cfg.lx - 9, y: cfg.ly, width: 18, height: 36, rx: 8, fill: cfg.col }, g);
        el('ellipse', { cx: s * cfg.lx - s * 8, cy: cfg.ly + 38, rx: 24, ry: 12, fill: cfg.col2 || cfg.col }, g);
      });
      const b = orig(g, c), t0 = b.tick;
      b.tick = (t, st) => { t0(t); const a = (st && st.arm) || 0;
        arms.forEach((m, k) => m.i.setAttribute('transform', `rotate(${(-m.s * (6 + Math.sin(t * 2.2 + k * 2) * 5 + a * (50 + 30 * Math.sin(t * 7 + k * 1.7)))).toFixed(1)})`)); };
      return b;
    };
  };
  limbify('seed', { ax: 80, ay: 10, len: 54, dy: 20, dy2: 14, col: '#8f5a2c', legs: true, lx: 36, ly: 96, col2: '#6e4220' });
  limbify('sprout', { ax: 78, ay: 8, len: 52, dy: 18, dy2: 12, col: '#6fd04a' });
  limbify('drop', { ax: 84, ay: 56, len: 50, dy: 18, dy2: 12, col: '#2aa8ee', legs: true, lx: 38, ly: 128, col2: '#1f86d0' });

  const TNAME = { seed: 'Seedy', sprout: 'Sprouty', flower: 'Sunny Bloom', drop: 'Drippy', sun: 'Sunny Ray', cloud: 'Rainy Cloud', soil: 'Mr. Soil', worm: 'Wiggly', moon: 'Moony', earth: 'Earthy', buddy: 'Buddy', fish: 'Finn', whale: 'Willa', dolphin: 'Dolly', jellyfish: 'Jelly', octopus: 'Inky', turtle: 'Shelly', crab: 'Crabby', shark: 'Sharky', angler: 'Glow', sub: 'Subby', star: 'Twinkle', blackhole: 'Black hole', phone: 'Phoney', bulb: 'Bulby', server: 'Servo', coin: 'Coiny' };
  const TCOL = { seed: '#a8642f', sprout: '#3f9a2e', flower: '#d99100', drop: '#1f86d0', sun: '#e07a00', cloud: '#5b6fc9', soil: '#7a4a28', worm: '#d9506c', moon: '#8a7f5a', earth: '#1f7fbf', buddy: '#4a63e0' };
  const BOT = { seed: 146, sprout: 150, flower: 290, drop: 168, sun: 110, cloud: 78, soil: 100, worm: 98, moon: 100, earth: 100, buddy: 100, star: 120, phone: 120, bulb: 112, server: 112, coin: 104, fish: 82, whale: 102, dolphin: 86, shark: 82, jellyfish: 190, octopus: 200, turtle: 114, crab: 90, angler: 92, sub: 70 };

  function makeGarden(parent, kind) {
    const defs = el('defs', {}, parent), id = 'sk' + (++UID), id2 = 'sl' + UID;
    const rain = kind === 'rain';
    const lg = el('linearGradient', { id, x1: 0, y1: 0, x2: 0, y2: 1 }, defs);
    el('stop', { offset: '0%', 'stop-color': rain ? '#5d6e93' : '#6fcfff' }, lg); el('stop', { offset: '100%', 'stop-color': rain ? '#b7c5dc' : '#dcf5ff' }, lg);
    const sg = el('linearGradient', { id: id2, x1: 0, y1: 0, x2: 0, y2: 1 }, defs);
    el('stop', { offset: '0%', 'stop-color': '#9a6636' }, sg); el('stop', { offset: '100%', 'stop-color': '#4d2f18' }, sg);
    const horizon = kind === 'cutaway' ? 330 : 960;
    el('rect', { x: -40, y: -40, width: 800, height: horizon + 60, fill: `url(#${id})` }, parent);
    if (!rain) { el('circle', { cx: 590, cy: 130, r: 120, fill: '#fff6b0', opacity: .35 }, parent); el('circle', { cx: 590, cy: 130, r: 70, fill: '#fff09a', opacity: .75 }, parent); }
    const hy = horizon - 4;
    el('path', { d: `M -20 ${hy} Q 90 ${hy - 120} 230 ${hy - 40} T 470 ${hy - 50} T 760 ${hy - 70} L 760 ${hy + 10} L -20 ${hy + 10} Z`, fill: rain ? '#6f9a73' : '#93dc7c' }, parent);
    const clouds = [];
    for (let i = 0; i < 4; i++) {
      const cg = el('g', {}, parent), col = rain ? '#8d99b3' : '#ffffff';
      [[-34, 6, 30], [0, -8, 40], [38, 4, 32]].forEach(([x, y, r]) => el('circle', { cx: x, cy: y, r, fill: col, opacity: .95 }, cg));
      el('rect', { x: -66, y: 4, width: 132, height: 34, rx: 17, fill: col, opacity: .95 }, cg);
      clouds.push({ cg, x: rnd(i + 4) * 900, y: 60 + rnd(i + 14) * (kind === 'cutaway' ? 120 : 200), s: .7 + rnd(i + 24) * .6, v: 6 + rnd(i + 34) * 8 });
    }
    // ground
    el('rect', { x: -40, y: horizon, width: 800, height: 1300 - horizon, fill: `url(#${id2})` }, parent);
    for (let i = 0; i < 26; i++) el('circle', { cx: rnd(i + 60) * 720, cy: horizon + 50 + rnd(i + 80) * (1228 - horizon - 70), r: 4 + rnd(i + 99) * 9, fill: i % 3 ? '#6b4325' : '#b88454', opacity: .6 }, parent);
    if (kind === 'cutaway') {
      el('path', { d: 'M -20 520 Q 150 480 260 560 T 520 600 T 760 540', fill: 'none', stroke: '#3b2412', 'stroke-width': 34, 'stroke-linecap': 'round', opacity: .22 }, parent);
      el('path', { d: 'M -20 880 Q 120 840 300 900 T 620 860 T 760 900', fill: 'none', stroke: '#3b2412', 'stroke-width': 30, 'stroke-linecap': 'round', opacity: .2 }, parent);
    }
    el('rect', { x: -40, y: horizon - 8, width: 800, height: 40, fill: '#58c23f' }, parent);
    for (let i = 0; i < 36; i++) el('path', { d: 'M -6 0 L 0 -16 L 6 0 Z', fill: i % 2 ? '#6fd653' : '#49b032', transform: `translate(${i * 21 + rnd(i) * 10} ${horizon - 6})` }, parent);
    for (let i = 0; i < 6; i++) { const fx = 40 + rnd(i + 120) * 640, fy = horizon + 6; el('line', { x1: fx, y1: fy, x2: fx, y2: fy - 20, stroke: '#3f9a2e', 'stroke-width': 3 }, parent); el('circle', { cx: fx, cy: fy - 24, r: 7, fill: ['#ff7aa8', '#ffd23f', '#fff', '#b88aff'][i % 4] }, parent); }
    const streaks = []; if (rain) for (let i = 0; i < 40; i++) streaks.push({ e: el('line', { stroke: '#d6ecff', 'stroke-width': 3, 'stroke-linecap': 'round', opacity: .6 }, parent), x: rnd(i + 5) * 760, o: rnd(i + 7) * 1300, v: 700 + rnd(i + 8) * 400 });
    return { update(t) {
      clouds.forEach(c => c.cg.setAttribute('transform', `translate(${((c.x + t * c.v) % 900) - 90} ${c.y}) scale(${c.s})`));
      streaks.forEach(q => { const y = ((q.o + t * q.v) % 1300) - 40; q.e.setAttribute('x1', q.x); q.e.setAttribute('y1', y); q.e.setAttribute('x2', q.x - 8); q.e.setAttribute('y2', y + 34); });
    } };
  }

  S.talk = function (g, d) {
    const cast = (Array.isArray(d.cast) ? d.cast : []).slice(0, 3); if (!cast.length) cast.push({ who: 'buddy' });
    const n = cast.length, kind = ['garden', 'cutaway', 'rain'].includes(d.bg) ? d.bg : 'garden';
    const scene = makeGarden(g, kind);
    const defs = el('defs', {}, g), fid = 'ol' + (++UID), f = el('filter', { id: fid, x: '-25%', y: '-25%', width: '150%', height: '150%' }, defs);
    el('feMorphology', { in: 'SourceAlpha', operator: 'dilate', radius: 3.4, result: 'd' }, f);
    el('feFlood', { 'flood-color': '#47281a', result: 'c' }, f);
    el('feComposite', { in: 'c', in2: 'd', operator: 'in', result: 'o' }, f);
    const mg = el('feMerge', {}, f); el('feMergeNode', { in: 'o' }, mg); el('feMergeNode', { in: 'SourceGraphic' }, mg);
    const XS = n === 1 ? [360] : n === 2 ? [195, 525] : [120, 360, 600], SC = n === 1 ? 1.7 : n === 2 ? 1.4 : 1.05;
    const GY = kind === 'cutaway' ? 365 : 960, bubTop = kind === 'cutaway';

    // lines
    const idxOf = v => { if (typeof v === 'number') return clamp(Math.round(v), 0, n - 1); const s = String(v || '').toLowerCase(); const k = cast.findIndex(c => String(c.name || '').toLowerCase() === s || who(c.who) === s); return k >= 0 ? k : 0; };
    const lines = (Array.isArray(d.lines) ? d.lines : []).slice(0, 10).map(L => ({
      sp: idxOf(L.who), text: String(L.text || '').trim(), mood: MOODS[L.mood] ? L.mood : null, react: L.react || {}, change: L.change || {}, words: String(L.text || '').trim().split(/\s+/).length }));
    // characters (+ every body they can change into)
    const chars = cast.map((c, i) => {
      const sc = (Number(c.scale) > 0 ? Number(c.scale) : (c.where === 'sky' ? .8 : SC)), x = Number.isFinite(Number(c.x)) && c.x !== undefined ? Number(c.x) : XS[i];
      const where = c.where || (kind === 'cutaway' ? 'under' : 'ground');
      const names = new Set([who(c.who)]); lines.forEach(L => { if (L.change[i]) names.add(who(L.change[i])); });
      const v = {}; names.forEach(nm => {
        const cg = el('g', {}, g), body = el('g', { filter: `url(#${fid})` }, cg), b = BODIES[nm](body, null);
        const fg = el('g', { transform: `translate(0 ${b.fy}) scale(${b.fs})` }, cg), face = makeFace(fg), ex = makeExtras(cg, b.top);
        v[nm] = { cg, b, face, ex };
      });
      return { c, i, sc, x, where, v, w0: who(c.who), m0: MOODS[c.mood] ? c.mood : 'happy', poof: null };
    });
    const poofs = chars.map(() => { const pg = el('g', {}, g), ps = []; for (let k = 0; k < 9; k++) ps.push({ e: el('circle', { fill: k % 3 === 0 ? '#ffd34d' : '#fff' }, pg), a: k / 9 * 6.283 + rnd(k) * .6, s: 50 + rnd(k + 5) * 60 }); return { pg, ps }; });
    const posY = (o, nm) => o.where === 'sky' ? 225 : (o.where === 'under' ? 850 : GY) - (o.where === 'sky' ? 0 : (BOT[nm] || 110) * o.sc);

    // speech bubbles (one per line, built once)
    const bubbles = []; const who_ = chars.map(o => o.w0);
    lines.forEach((L, k) => {
      Object.keys(L.change).forEach(ci => { who_[ci] = who(L.change[ci]); });
      const nm = who_[L.sp], bg = el('g', {}, g);
      const wl = X.wrap(L.text, 24), h = 44 + wl.length * 54, W = 640, x0 = 40;
      const by = bubTop ? 905 : 520 - h, spk = chars[L.sp];
      const tipX = clamp(spk.x, 110, 610), far = spk.where === 'sky' && bubTop;
      const tipY = bubTop ? by - 52 : by + h + 56;
      if (!far) el('path', { d: bubTop ? `M ${tipX - 24} ${by + 4} L ${tipX} ${tipY} L ${tipX + 24} ${by + 4} Z` : `M ${tipX - 24} ${by + h - 4} L ${tipX} ${tipY} L ${tipX + 24} ${by + h - 4} Z`, fill: '#fff', stroke: '#14213d', 'stroke-width': 5, 'stroke-linejoin': 'round' }, bg);
      el('rect', { x: x0, y: by, width: W, height: h, rx: 36, fill: '#fff', stroke: '#14213d', 'stroke-width': 5 }, bg);
      if (!far) el('rect', { x: tipX - 20, y: bubTop ? by - 2 : by + h - 8, width: 40, height: 10, fill: '#fff' }, bg);
      const col = TCOL[nm] || '#4a63e0', name = (chars[L.sp].c.name && !L.change[L.sp]) ? chars[L.sp].c.name : (TNAME[nm] || nm);
      const cw = Math.max(120, name.length * 17 + 44);
      el('rect', { x: x0 + 18, y: by - 22, width: cw, height: 40, rx: 20, fill: col, stroke: '#14213d', 'stroke-width': 4 }, bg);
      X.text(bg, name, x0 + 18 + cw / 2, by + 6, 24, '#fff', 800);
      const txt = wl.map((ln, li) => ({ ln, words: ln.split(' '), e: X.text(bg, '', x0 + 38, by + 62 + li * 54, 40, '#1b2440', 800, 'start') }));
      bubbles.push({ bg, txt, tipX, tipY: far ? by + h / 2 : tipY, total: L.words });
      bg.setAttribute('opacity', 0);
    });
    let label = null;
    if (d.label) { label = text(g, String(d.label), 360, 100, 56, X.ORANGE, 900); X.fit(label, 640); }

    return function (lt, dur) {
      const T = lt, t0 = .3, usable = Math.max(2, dur - .9);
      const W = lines.map(L => L.words + 1.4), tot = W.reduce((a, b) => a + b, 0) || 1;
      let acc = 0; const st = lines.map((L, k) => { const s = t0 + acc / tot * usable; acc += W[k]; return { s, e: t0 + acc / tot * usable }; });
      let idx = -1; for (let k = 0; k < lines.length; k++) if (T >= st[k].s) idx = k;
      scene.update(T);
      if (label) { const p = prog(lt, .2, .6); label.setAttribute('opacity', p.toFixed(3)); X.pop(label, 360, 100, .6 + .4 * eob(p)); }
      bubbles.forEach((B, k) => {
        const on = k === idx; X.show(B.bg, on ? 1 : 0); if (!on) return;
        const L = st[k], span = L.e - L.s, r = clamp((T - L.s) / (span * .78), 0, 1), vis = Math.ceil(r * B.total);
        let left = vis; B.txt.forEach(tl => { const kk = Math.min(left, tl.words.length); tl.e.textContent = tl.words.slice(0, kk).join(' '); left -= kk; });
        const pp = eob(prog(T - L.s, 0, .2)), s = .8 + .2 * pp;
        B.bg.setAttribute('transform', `translate(${B.tipX} ${B.tipY}) scale(${s.toFixed(3)}) translate(${-B.tipX} ${-B.tipY})`);
      });
      const spkNow = idx >= 0 ? lines[idx] : null, talking = spkNow ? (T - st[idx].s) < (st[idx].e - st[idx].s) * .8 : false;
      const pos = chars.map(o => ({ x: o.x, y: 0 }));
      chars.forEach((o, i) => {
        // state from the dialogue so far
        let mood = o.m0, prev = o.m0, moodT = 0, wNow = o.w0, chT = -9;
        for (let k = 0; k <= idx; k++) {
          const L = lines[k]; let m = null; if (L.sp === i) m = L.mood; else if (L.react[i]) m = L.react[i];
          if (m && MOODS[m] && m !== mood) { prev = mood; mood = m; moodT = st[k].s; }
          if (L.change[i]) { wNow = who(L.change[i]); chT = st[k].s; }
        }
        const speaking = !!spkNow && spkNow.sp === i && talking;
        const p = mix(moodP(prev), moodP(mood), eio(prog(T, moodT, moodT + .3)));
        p.talk = speaking ? 1 : 0; o._talk = lerp(o._talk || 0, p.talk, .35);
        p.talk = o._talk;
        const y = posY(o, wNow); pos[i].y = y;
        const pop = eob(prog(T, chT, chT + .45)) , reveal = eob(prog(T, 0, .5));
        const bob = Math.sin(T * 2 + i * 1.9) * 7 + (speaking ? Math.abs(Math.sin(T * 9)) * -9 : 0);
        for (const nm in o.v) {
          const V = o.v[nm], shown = nm === wNow;
          X.show(V.cg, shown ? 1 : 0); if (!shown) continue;
          const sc = o.sc * reveal * (chT > -1 ? pop : 1) * (1 + (speaking ? .03 * Math.sin(T * 9) : 0));
          V.cg.setAttribute('transform', `translate(${o.x.toFixed(1)} ${(y + bob).toFixed(1)}) rotate(${(speaking ? Math.sin(T * 5) * 2.5 : Math.sin(T * 1.5 + i) * 1.2).toFixed(2)}) scale(${sc.toFixed(3)})`);
          let tx = 360, ty = 500; if (spkNow && spkNow.sp !== i) { tx = chars[spkNow.sp].x; ty = posY(chars[spkNow.sp], wNow) } else { const q = chars[(i + 1) % n]; tx = q.x; ty = y; }
          const dx = tx - o.x, dy = ty - y, Ln = Math.hypot(dx, dy) || 1;
          const bl = (T + i * .9) % 3.4, blink = bl < .13 ? 1 - Math.sin(bl / .13 * 3.14) * .95 : 1;
          V.face(p, T, { x: dx / Ln * .8, y: dy / Ln * .6 }, blink);
          tickExtras(V.ex, p, T, 1);
          V.b.tick(T, { arm: Math.max(speaking ? .55 : 0, (/^(joy|excited|giggle|proud|love)$/.test(mood) ? .5 : 0)) });
        }
        // poof when the body changes (seed -> sprout -> flower)
        const pg = poofs[i], u = chT > -1 ? prog(T - chT, 0, .7) : 0; X.show(pg.pg, u > 0 && u < 1 ? 1 : 0);
        if (u > 0 && u < 1) pg.ps.forEach(q => { q.e.setAttribute('cx', (o.x + Math.cos(q.a) * eo(u) * q.s * 1.6).toFixed(1)); q.e.setAttribute('cy', (y - 40 + Math.sin(q.a) * eo(u) * q.s * 1.2).toFixed(1)); q.e.setAttribute('r', (q.s * (.3 + eo(u)) * .6).toFixed(1)); q.e.setAttribute('opacity', (.9 * (1 - u)).toFixed(3)); });
      });
    };
  };
})();
