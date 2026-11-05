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
    sweat: 0, tears: 0, zzz: 0, hearts: 0, stars: 0, shades: 0, excl: 0, ques: 0, tremble: 0, dizzy: 0, lookUp: 0 };
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
      const hi = el('circle', { r: 3.4, fill: '#fff' }, g);
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
        e.white.setAttribute('opacity', (1 - p.arc).toFixed(3));
        e.pup.setAttribute('r', (17 * p.pup).toFixed(2)); e.pup.setAttribute('cx', lx.toFixed(2)); e.pup.setAttribute('cy', ly.toFixed(2));
        e.pup.setAttribute('opacity', (1 - p.arc).toFixed(3));
        e.hi.setAttribute('cx', (lx - 4).toFixed(2)); e.hi.setAttribute('cy', (ly - 5).toFixed(2)); e.hi.setAttribute('opacity', (1 - p.arc).toFixed(3));
        e.arc.setAttribute('opacity', p.arc.toFixed(3));
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
  const WHO = Object.keys(BODIES);
  const ALIAS = { robot: 'buddy', mascot: 'buddy', ai: 'buddy', sparkle: 'star', internet: 'cloud', wifi: 'cloud', google: 'buddy', rupee: 'coin', money: 'coin', mobile: 'phone', idea: 'bulb', light: 'bulb', computer: 'server', planet: 'earth' };
  const who = w => { w = String(w || 'buddy').toLowerCase().trim(); return BODIES[w] ? w : (ALIAS[w] || 'buddy'); };
  window.TOON = { WHO, MOOD_NAMES };

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

  /* ----------------------------------------------------------------- scene */
  S.toon = function (g, d) {
    const cast = (Array.isArray(d.cast) && d.cast.length ? d.cast : [{ who: d.who || 'buddy', mood: d.mood || 'happy', mood2: d.mood2, act: d.act }]).slice(0, 3);
    const n = cast.length, at = clamp(Number(d.at) > 0 ? Number(d.at) : .5, .15, .85);
    let layout = String(d.layout || 'auto'); if (layout === 'auto') layout = n === 1 ? 'solo' : (n === 2 ? 'duo' : 'trio');
    const orbit = layout === 'orbit' && n >= 2;
    const bg = el('g', {}, g);
    // twinkling background stars
    const stars = []; for (let i = 0; i < 26; i++) stars.push({ e: el('circle', { cx: 20 + rnd(i + 3) * 680, cy: 60 + rnd(i + 9) * 1000, r: .8 + rnd(i + 21) * 2.2, fill: '#fff' }, bg), k: i });
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
      return { c, i, w, cg, body, b, face, ex, P1: moodP(m1), P2: moodP(m2), act: String(c.act || 'float').toLowerCase(), base: pos[i] || pos[0], size: Number(c.size) > 0 ? Number(c.size) : 1 };
    });
    // poof (smoke) used by vanish / appear
    const poofs = chars.map(() => { const pg = el('g', {}, g); const ps = []; for (let k = 0; k < 9; k++) ps.push({ e: el('circle', { fill: k % 3 === 0 ? '#ffd34d' : '#ffffff' }, pg), a: k / 9 * 6.283 + rnd(k) * .6, s: 50 + rnd(k + 5) * 60 }); return { pg, ps }; });
    let label = null;
    if (d.label) { label = text(g, String(d.label), 360, 190, 96, X.ORANGE, 900); X.fit(label, 640); }

    return function (lt, dur) {
      const tAt = at * dur, T = lt;
      bg.setAttribute('opacity', 1);
      stars.forEach(s => s.e.setAttribute('opacity', (.25 + .55 * Math.abs(Math.sin(T * 1.5 + s.k))).toFixed(3)));
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
        const after = T - tAt, ap = prog(after, 0, .35);
        let sx = 1, sy = 1;
        switch (o.act) {
          case 'hop': y -= Math.abs(Math.sin(T * 4.5)) * 46; sy = 1 + .06 * Math.cos(T * 9); break;
          case 'shake': x += Math.sin(T * 38) * 7 * (after > 0 ? 1.4 : .3); break;
          case 'spin': brot = T * 220; y += Math.sin(T * 6) * 8; break;
          case 'vanish': if (after >= 0) { const u = prog(after, 0, .3); sc *= (1 + .18 * Math.sin(u * 3.14) ) * (1 - eio(u)); vis = u >= 1 ? 0 : 1; } break;
          case 'appear': if (after < 0) { vis = 0; } else { sc *= eob(prog(after, 0, .5)); } break;
          case 'fall': if (after > 0) { y += 1100 * Math.pow(after / 1.3, 2); rot = after * 60; x += after * 30; } break;
          case 'grow': sc *= 1 + .6 * prog(lt, 0, dur); break;
          case 'shrink': sc *= 1 - .55 * prog(lt, 0, dur); break;
        }
        // idle life: bob + breathe + reaction squash when the mood changes
        y += Math.sin(T * 2.1 + i * 1.7) * 9;
        const br = 1 + .02 * Math.sin(T * 3 + i);
        const pulse = Math.exp(-Math.max(0, after) * 7) * (after >= 0 ? 1 : 0);
        sx = br * (1 - .08 * pulse) * (1 + .0); sy = sy * br * (1 + .14 * pulse);
        if (o.P2.tremble > .5 && after >= 0 || o.P1.tremble > .5 && after < 0) x += Math.sin(T * 50) * 2.5;
        sc *= reveal;
        pts[i] = { x, y };
        o.cg.setAttribute('transform', `translate(${x.toFixed(1)} ${y.toFixed(1)}) rotate(${rot.toFixed(1)}) scale(${(sc * sx).toFixed(3)} ${(sc * sy).toFixed(3)})`);
        X.show(o.cg, vis); o.body.setAttribute('transform', `rotate(${brot.toFixed(1)})`);
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
        o.b.tick(T);
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
