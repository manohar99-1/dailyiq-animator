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
    sweat: 0, tears: 0, zzz: 0, hearts: 0, stars: 0, shades: 0, excl: 0, ques: 0, tremble: 0, dizzy: 0, lookUp: 0, wink: 0 };
  const MOODS = {
    happy:    {},
    joy:      { arc: 1, mw: 34, curve: 1, mo: .55, blush: 1, stars: 1 },
    excited:  { eye: 1.2, pup: .7, mw: 34, curve: 1, mo: .7, blush: .9, stars: 1, browY: -8 },
    shocked:  { eye: 1.3, pup: .28, browY: -12, mw: 14, curve: 0, mo: 1.5, blush: .1, excl: 1 },
    scared:   { eye: 1.3, pup: .25, brow: 26, browY: -8, mw: 20, curve: -.3, mo: .8, blush: 0, sweat: 1, tremble: 1 },
    worried:  { eye: 1.05, pup: .5, brow: 22, browY: -4, mw: 22, curve: -.55, mo: .1, blush: .2, sweat: 1 },
    sad:      { pup: .6, brow: 18, mw: 20, curve: -.95, mo: 0, blush: .1, tears: .5 },
    cry:      { pup: .6, brow: 22, mw: 24, curve: -1, mo: .7, blush: .4, tears: 1 },
    angry:    { eye: .95, pup: .6, brow: -24, browY: 5, mw: 26, curve: -.7, mo: .35, blush: 0 },
    sleepy:   { open: .3, pup: .5, mw: 14, curve: .2, mo: .2, blush: .3, zzz: 1 },
    love:     { arc: 1, mw: 28, curve: 1, mo: .2, blush: 1, hearts: 1 },
    dizzy:    { eye: 1.1, pup: .35, mw: 20, curve: -.2, mo: .5, blush: .3, dizzy: 1, stars: 1 },
    cool:     { mw: 28, curve: .6, shades: 1, blush: .2 },
    determined: { eye: 1.05, pup: .7, brow: -16, browY: 3, mw: 24, curve: .45, mo: 0, blush: .3 },
    proud:    { eye: .95, pup: .6, browY: -6, mw: 30, curve: 1, mo: .1, blush: .8, stars: .7, lookUp: .6 },
    yawn:     { open: .15, arc: .5, mw: 22, curve: 0, mo: 1.3, blush: .3, zzz: .6 },
    giggle:   { arc: 1, mw: 36, curve: 1, mo: .9, blush: 1 },
    hopeful:  { eye: 1.25, pup: .78, brow: 8, browY: -7, mw: 20, curve: .7, mo: .1, blush: .5, stars: 1, lookUp: 1 },
    wink:     { wink: 1, mw: 32, curve: 1, mo: .5, blush: .8 },
    tired:    { open: .55, pup: .5, brow: 12, mw: 20, curve: -.3, mo: .15, blush: .2, sweat: .6 },
    thinking: { pup: .5, brow: 10, browY: -4, mw: 14, curve: 0, mo: 0, blush: .2, ques: 1, lookUp: 1 },
  };
  const MOOD_NAMES = Object.keys(MOODS);
  const mix = (a, b, u) => { const o = {}; for (const k in P0) o[k] = lerp(a[k], b[k], u); return o; };
  const moodP = m => Object.assign({}, P0, MOODS[m] || {});

  /* ------------------------------------------------------------------- face */
  function makeFace(parent) {
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
      cheeks.forEach(c => c.setAttribute('opacity', (p.blush * .6).toFixed(3)));
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
      const w = p.mw, my = 28, c = p.curve, o = p.mo;
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
  window.TOON.draw = function (parent, w, mood, t, color) {
    w = who(w); const cg = el('g', {}, parent), body = el('g', {}, cg);
    const b = BODIES[w](body, color || null);
    const fg = el('g', { transform: `translate(0 ${b.fy}) scale(${b.fs})` }, cg), face = makeFace(fg), ex = makeExtras(cg, b.top), p = moodP(mood);
    face(p, t, { x: .2, y: .1 }, 1); tickExtras(ex, p, t, 1); b.tick(t); return cg;
  };

  const WHO = Object.keys(BODIES);
  const ALIAS = { robot: 'buddy', mascot: 'buddy', ai: 'buddy', sparkle: 'star', internet: 'cloud', wifi: 'cloud', google: 'buddy', rupee: 'coin', money: 'coin', mobile: 'phone', idea: 'bulb', light: 'bulb', computer: 'server', planet: 'earth', water: 'drop', raindrop: 'drop', sunflower: 'flower', plant: 'flower', seedling: 'sprout', ground: 'soil', earthworm: 'worm', orca: 'whale', squid: 'octopus', jelly: 'jellyfish', submarine: 'sub', goldfish: 'fish', lanternfish: 'angler', seaturtle: 'turtle' };
  const who = w => { w = String(w || 'buddy').toLowerCase().trim(); return BODIES[w] ? w : (ALIAS[w] || 'buddy'); };
  Object.assign(window.TOON, { WHO, MOOD_NAMES });

  /* ----------------------------------------------------------- extras above the head */
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
    const cast = (Array.isArray(d.cast) && d.cast.length ? d.cast : [{ who: d.who || 'buddy', mood: d.mood || 'happy', mood2: d.mood2, act: d.act }]).slice(0, 3);
    const n = cast.length, at = clamp(Number(d.at) > 0 ? Number(d.at) : .5, .15, .85);
    let layout = String(d.layout || 'auto'); if (layout === 'auto') layout = n === 1 ? 'solo' : (n === 2 ? 'duo' : 'trio');
    const orbit = layout === 'orbit' && n >= 2;
    const bg = el('g', {}, g);
    // twinkling background stars
    const ocean = d.bg === 'ocean' ? makeOcean(bg, d.depth !== undefined) : null;
    const D0 = Number(d.depth) || 0, D1 = d.depth2 !== undefined ? Number(d.depth2) || 0 : D0;
    const stars = []; for (let i = 0; i < (ocean ? 0 : 26); i++) stars.push({ e: el('circle', { cx: 20 + rnd(i + 3) * 680, cy: 60 + rnd(i + 9) * 1000, r: .8 + rnd(i + 21) * 2.2, fill: '#fff' }, bg), k: i });
    if (d.bg === 'day') { el('rect', { x: 0, y: 0, width: 720, height: 1228, fill: '#2d63b8', opacity: .55 }, bg); }

    const CX = 360, CY = 620;
    const pos = (n === 1 ? [[CX, CY, 2.1]] : n === 2 ? [[215, 760, 1.65], [505, 470, 1.55]] : [[CX, 440, 1.3], [185, 820, 1.3], [535, 820, 1.3]]);
    const orbitG = el('g', {}, g);
    const orbs = [];
    if (orbit) { const rx1 = 250, ry1 = 190; orbs.push([rx1, ry1]); el('ellipse', { cx: CX, cy: CY, rx: rx1, ry: ry1, fill: 'none', stroke: '#8fdcff', 'stroke-width': 3, 'stroke-dasharray': '4 14', 'stroke-linecap': 'round', opacity: .45 }, orbitG); }
    const chars = cast.map((c, i) => {
      const w = who(c.who), cg = el('g', {}, g), body = el('g', {}, cg);
      const b = BODIES[w](body, typeof c.color === 'string' && /^#[0-9a-f]{3,8}$/i.test(c.color) ? c.color : null);
      const fg = el('g', { transform: `translate(0 ${b.fy}) scale(${b.fs})` }, cg), face = makeFace(fg);
      const ex = makeExtras(cg, b.top);
      const m1 = MOODS[c.mood] ? c.mood : 'happy', m2 = MOODS[c.mood2] ? c.mood2 : m1;
      const act0 = String(c.act || 'float').toLowerCase(); const dir = String(c.dir || '').toLowerCase();
      return { c, i, w, cg, body, b, face, ex, flip: dir === 'right' ? -1 : 1, dirr: dir, P1: moodP(m1), P2: moodP(m2), act: act0, base: pos[i] || pos[0], size: Number(c.size) > 0 ? Number(c.size) : 1 };
    });
    // poof (smoke) used by vanish / appear
    const poofs = chars.map(() => { const pg = el('g', {}, g); const ps = []; for (let k = 0; k < 9; k++) ps.push({ e: el('circle', { fill: k % 3 === 0 ? '#ffd34d' : '#ffffff' }, pg), a: k / 9 * 6.283 + rnd(k) * .6, s: 50 + rnd(k + 5) * 60 }); return { pg, ps }; });
    let label = null;
    if (d.label) { label = text(g, String(d.label), 360, 190, 96, X.ORANGE, 900); X.fit(label, 640); }

    return function (lt, dur) {
      const tAt = at * dur, T = lt;
      bg.setAttribute('opacity', 1);
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
          x = P[0] + (vert ? Math.sin(T * 2.2) * 24 : 0); y = P[1] + (vert ? 0 : Math.sin(T * 3 + i) * 26);
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
          case 'shrink': sc *= 1 - .55 * prog(lt, 0, dur); break;
        }
        // idle life: bob + breathe + reaction squash when the mood changes
        if (!moving) y += Math.sin(T * 2.1 + i * 1.7) * 9;
        const br = 1 + .02 * Math.sin(T * 3 + i);
        const pulse = Math.exp(-Math.max(0, after) * 7) * (after >= 0 ? 1 : 0);
        sx = br * (1 - .08 * pulse) * (1 + .0); sy = sy * br * (1 + .14 * pulse);
        if (o.P2.tremble > .5 && after >= 0 || o.P1.tremble > .5 && after < 0) x += Math.sin(T * 50) * 2.5;
        sc *= reveal;
        pts[i] = { x, y };
        o.cg.setAttribute('transform', `translate(${x.toFixed(1)} ${y.toFixed(1)}) rotate(${rot.toFixed(1)}) scale(${(sc * sx).toFixed(3)} ${(sc * sy).toFixed(3)})`);
        X.show(o.cg, vis); o.body.setAttribute('transform', `scale(${o.flip || 1} 1) rotate(${(brot - tiltDeg).toFixed(1)})`);
        // expression
        const u = eio(prog(after, -.05, .25));
        const p = mix(o.P1, o.P2, u);
        const bl = (T + i * .9) % 3.2; const blink = bl < .13 ? 1 - Math.sin(bl / .13 * 3.14) * .95 : 1;
        // look toward the nearest other character (or the middle)
        let tx = CX, ty = CY; const other = chars.length > 1 ? (i === 0 ? 1 : 0) : -1; if (other >= 0 && pts[other]) { tx = pts[other].x; ty = pts[other].y; } else if (other >= 0) { tx = chars[other].base[0]; ty = chars[other].base[1]; }
        const dx = tx - x, dy = ty - y, L = Math.hypot(dx, dy) || 1, look = { x: (dx / L) * .8, y: (dy / L) * .8 };
        if (other < 0) { look.x = Math.sin(T * .9) * .5; look.y = .1; }
        o.face(p, T, look, blink);
        tickExtras(o.ex, p, T, o.act === 'vanish' ? 1 : eob(prog(T, 0, .5)));
        o.b.tick(moving ? T * 1.7 : T);
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
})();
