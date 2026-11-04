/* Shared helpers for every scene. */
(function () {
  const NS = 'http://www.w3.org/2000/svg';
  const X = window.X = {};
  X.NS = NS;
  X.BLUE = '#3da5ff'; X.CYAN = '#8fdcff'; X.ORANGE = '#ff8a1f'; X.RED = '#ff4d4d'; X.WHITE = '#eaf4ff';
  X.YELLOW = '#ffd34d'; X.GREEN = '#4ff0a8'; X.DARK = '#0a1128'; X.GREY = '#59658c';

  X.el = (tag, attrs, parent) => {
    const e = document.createElementNS(NS, tag);
    for (const k in (attrs || {})) e.setAttribute(k, attrs[k]);
    if (parent) parent.appendChild(e);
    return e;
  };
  X.clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
  X.prog = (t, a, b) => X.clamp((t - a) / ((b - a) || 1e-6));
  X.eo = x => 1 - Math.pow(1 - x, 3);
  X.eio = x => x < .5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;
  X.eob = x => { const c1 = 1.70158, c3 = c1 + 1; return 1 + c3 * Math.pow(x - 1, 3) + c1 * Math.pow(x - 1, 2); };
  X.rnd = n => { const x = Math.sin(n * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };
  X.lerp = (a, b, u) => a + (b - a) * u;
  X.show = (g, o) => { g.setAttribute('opacity', o.toFixed(3)); g.setAttribute('display', o <= 0.003 ? 'none' : 'inline'); };
  X.pop = (g, cx, cy, s) => g.setAttribute('transform', `translate(${cx} ${cy}) scale(${s <= 0 ? 0.001 : s}) translate(${-cx} ${-cy})`);
  X.FONT = "InterBundled, Inter, sans-serif";

  X.text = (parent, str, x, y, size, fill, weight, anchor, extra) => {
    const t = X.el('text', Object.assign({ x, y, 'font-size': size, fill, 'font-weight': weight || 700,
      'text-anchor': anchor || 'middle', 'font-family': X.FONT }, extra || {}), parent);
    t.textContent = str; return t;
  };
  /* shrink a text element until it fits maxW */
  X.fit = (t, maxW) => {
    let s = parseFloat(t.getAttribute('font-size')), guard = 0;
    while (guard++ < 30) {
      const w = t.getComputedTextLength ? t.getComputedTextLength() : 0;
      if (!w || w <= maxW) break;
      s *= Math.min(0.94, maxW / w); t.setAttribute('font-size', s.toFixed(1));
    }
    return s;
  };
  /* simple word wrap into lines of <= maxChars */
  X.wrap = (str, maxChars) => {
    const words = String(str).split(/\s+/), lines = []; let cur = '';
    for (const w of words) {
      if ((cur + ' ' + w).trim().length > maxChars && cur) { lines.push(cur); cur = w; } else cur = (cur + ' ' + w).trim();
    }
    if (cur) lines.push(cur); return lines;
  };
  /* icon: 24-grid line icon centred on (cx,cy) with width size */
  X.icon = (parent, name, cx, cy, size, color, sw) => {
    const g = X.el('g', {}, parent);
    const m = window.iconMarkup(name);
    g.setAttribute('transform', `translate(${cx - size / 2} ${cy - size / 2}) scale(${size / 24})`);
    g.setAttribute('fill', 'none'); g.setAttribute('stroke', color || X.WHITE);
    g.setAttribute('stroke-width', sw || 1.8); g.setAttribute('stroke-linecap', 'round'); g.setAttribute('stroke-linejoin', 'round');
    g.style.color = color || X.WHITE;
    if (m) g.innerHTML = m;
    else { // unknown icon name -> circle with its first letter
      g.innerHTML = '<circle cx="12" cy="12" r="9"/>';
      const t = X.el('text', { x: 12, y: 16.5, 'font-size': 12, 'text-anchor': 'middle', fill: color || X.WHITE, stroke: 'none', 'font-weight': 700, 'font-family': X.FONT }, g);
      t.textContent = String(name || '?').slice(0, 1).toUpperCase();
    }
    return g;
  };
  /* labelled icon node (circle + icon + label). returns {g, set(state)} */
  X.node = (parent, name, label, cx, cy, r, opts) => {
    opts = opts || {};
    const g = X.el('g', {}, parent);
    const c = X.el('circle', { cx, cy, r, fill: 'rgba(30,70,150,.45)', stroke: X.BLUE, 'stroke-width': 5 }, g);
    const ic = X.icon(g, name, cx, cy, r * 1.05, X.CYAN, 1.7);
    let t = null;
    if (label) { t = X.text(g, label, cx, cy + r + 36, opts.labelSize || 30, X.WHITE, 700); X.fit(t, opts.maxLabel || (r * 3.2)); }
    return {
      g, c, ic, t,
      set(state) {
        const col = { on: [X.BLUE, X.CYAN, 'rgba(30,70,150,.45)'], hot: [X.ORANGE, '#ffd9a8', 'rgba(255,138,31,.25)'], dead: ['#46506f', '#59658c', 'rgba(25,32,58,.8)'],
                      bad: [X.RED, '#ffb4b4', 'rgba(255,77,77,.28)'], good: [X.GREEN, '#c9ffe9', 'rgba(79,240,168,.22)'] }[state] || [X.BLUE, X.CYAN, 'rgba(30,70,150,.45)'];
        c.setAttribute('stroke', col[0]); c.setAttribute('fill', col[2]);
        ic.setAttribute('stroke', col[1]); ic.style.color = col[1];
        if (t) t.setAttribute('fill', state === 'dead' ? '#7d89ad' : X.WHITE);
      }
    };
  };
  X.line = (parent, x1, y1, x2, y2, color, w) => {
    const L = Math.hypot(x2 - x1, y2 - y1);
    const e = X.el('line', { x1, y1, x2, y2, stroke: color || X.BLUE, 'stroke-width': w || 4, 'stroke-linecap': 'round', 'stroke-dasharray': L, 'stroke-dashoffset': L }, parent);
    e._L = L; return e;
  };
  X.setLine = (e, p) => e.setAttribute('stroke-dashoffset', e._L * (1 - X.clamp(p)));
  /* big pill label (e.g. OUTAGE) */
  X.badge = (parent, str, cx, cy, size, color) => {
    const t = X.text(parent, str, cx, cy, size, color, 800, 'middle', { 'letter-spacing': Math.round(size * 0.14) });
    X.fit(t, 640); return t;
  };
  /* spread n items along a line, returns positions */
  X.spread = (n, a, b) => Array.from({ length: n }, (_, i) => n === 1 ? (a + b) / 2 : a + (b - a) * i / (n - 1));
  X.fmt = (v, locale) => { try { return Math.round(v).toLocaleString(locale || 'en-IN'); } catch (e) { return String(Math.round(v)); } };
})();
