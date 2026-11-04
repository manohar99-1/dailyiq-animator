/* Scene library. Every scene is  fn(group, data, X) -> update(lt, dur)  where lt = seconds into the scene.
   Missing fields in `data` always fall back to sensible defaults so LLM-written specs never crash. */
(function () {
  const S = window.Scenes = {};
  const { el, clamp, prog, eo, eio, eob, rnd, lerp, pop, show, text, icon, node, line, setLine, fit, badge, spread } = window.X;
  const X = window.X;
  const arr = (v, n) => (Array.isArray(v) ? v : []).slice(0, n);
  const str = (v, dflt) => (v === undefined || v === null ? (dflt || '') : String(v));
  const P = (lt, dur, a, b) => prog(lt / dur, a, b);           // fraction-of-scene progress

  /* ---------------------------------------------------------------- hook */
  S.hook = function (g, d) {
    const lines = (Array.isArray(d.lines) && d.lines.length ? d.lines : [d.text || d.title || '']).slice(0, 3).map(String);
    const r1 = el('circle', { cx: 360, cy: 330, r: 90, fill: 'none', stroke: X.BLUE, 'stroke-width': 4 }, g);
    const r2 = el('circle', { cx: 360, cy: 330, r: 90, fill: 'none', stroke: X.ORANGE, 'stroke-width': 3 }, g);
    const ico = icon(g, d.icon || 'bolt', 360, 330, 190, X.CYAN, 1.5);
    const ts = []; let y = 610;
    lines.forEach((ln, i) => {
      const t = text(g, ln, 360, y, 118, i === lines.length - 1 ? X.ORANGE : X.WHITE, 800); const s = fit(t, 640);
      ts.push({ t, y }); y += s * 1.12;
    });
    return function (lt, dur) {
      pop(ico, 360, 330, eob(prog(lt, 0, 0.45)));
      [r1, r2].forEach((r, i) => { const u = (lt * 0.8 + i * 0.5) % 1; r.setAttribute('r', 90 + u * 130); r.setAttribute('opacity', (1 - u) * 0.6); });
      ts.forEach((o, i) => { const p = prog(lt, 0.18 + i * 0.24, 0.6 + i * 0.24); o.t.setAttribute('opacity', p); pop(o.t, 360, o.y, 0.7 + 0.3 * eob(p)); });
    };
  };

  /* ----------------------------------------------------------- searchbar */
  S.searchbar = function (g, d) {
    const query = str(d.query, 'search anything'), word = str(d.word, ''), vanish = d.vanish !== false;
    const bar = el('g', {}, g);
    el('rect', { x: 50, y: 500, width: 620, height: 112, rx: 56, fill: 'rgba(25,55,120,.55)', stroke: X.BLUE, 'stroke-width': 5 }, bar);
    icon(bar, 'search', 112, 556, 52, X.CYAN, 2.2);
    const typed = text(bar, '', 172, 570, 42, X.WHITE, 500, 'start');
    const cursor = el('rect', { x: 172, y: 532, width: 4, height: 48, fill: X.CYAN }, bar);
    if (word) { const w = text(bar, word, 360, 440, 118, X.WHITE, 800); fit(w, 640); }
    const burst = el('g', {}, g), bsq = [];
    for (let i = 0; i < 30; i++) { const a = rnd(i + 1) * 6.283, sp = 140 + rnd(i + 40) * 330, s = 7 + rnd(i + 70) * 9;
      bsq.push({ e: el('rect', { width: s, height: s, fill: [X.BLUE, X.CYAN, X.WHITE, X.ORANGE][i % 4] }, burst), a, sp, s }); }
    const flash = el('circle', { cx: 360, cy: 556, r: 10, fill: 'none', stroke: X.WHITE, 'stroke-width': 6 }, g);
    const q = text(g, '?', 360, 720, 330, X.CYAN, 800);
    return function (lt, dur, f) {
      const ty1 = Math.min(1.0, dur * 0.4), n = Math.floor(prog(lt, 0.05, ty1) * query.length);
      typed.textContent = query.slice(0, n);
      const cw = typed.getComputedTextLength ? typed.getComputedTextLength() : 0;
      cursor.setAttribute('x', 176 + cw);
      const v0 = Math.max(ty1 + 0.25, dur * 0.5), vs = Math.max(0.45, Math.min(1, (dur - v0 - 0.1) / 0.95)), vt = (lt - v0) / vs;
      cursor.setAttribute('display', (!vanish || vt < 0.1) && Math.floor(lt * 5) % 2 === 0 ? 'inline' : 'none');
      let o = 1, dx = 0, sx = 1, sy = 1;
      if (vanish && vt >= 0 && vt < 0.35) { dx = (rnd(f) - .5) * 26; o = rnd(f + 7) > .35 ? 1 : .3; }
      if (vanish && vt >= 0.35) { const p = prog(vt, 0.35, 0.6); sy = 1 - eo(p) * .965; sx = 1 + .04 * p; }
      if (vanish && vt >= 0.6) { const p = prog(vt, 0.6, 0.8); sx = 1.04 - eo(p) * 1.03; }
      if (vanish && vt >= 0.8) o = 0;
      bar.setAttribute('transform', `translate(${360 + dx} 556) scale(${sx.toFixed(3)},${sy.toFixed(3)}) translate(-360 -556)`); show(bar, o);
      bsq.forEach(b => { const dd = vt - 0.62; if (!vanish || dd < 0 || dd > 0.8) { b.e.setAttribute('display', 'none'); return; }
        const r = b.sp * eo(dd / 0.8) * 0.8; b.e.setAttribute('display', 'inline');
        b.e.setAttribute('x', 360 + Math.cos(b.a) * r - b.s / 2); b.e.setAttribute('y', 556 + Math.sin(b.a) * r - b.s / 2); b.e.setAttribute('opacity', (1 - dd / 0.8).toFixed(3)); });
      const fp = prog(vt, 0.62, 1.0); flash.setAttribute('r', 10 + fp * 260); flash.setAttribute('opacity', !vanish || vt < 0.62 || vt > 1 ? 0 : (1 - fp) * .9);
      const showQ = vanish && d.after !== 'none' && vt > 0.85;
      show(q, showQ ? prog(vt, 0.85, 1.0) : 0); q.setAttribute('transform', `translate(360 720) scale(${1 + .06 * Math.sin(lt * 9)}) translate(-360 -720)`);
    };
  };

  /* ---------------------------------------------------------------- flow */
  S.flow = function (g, d) {
    let nodes = arr(d.nodes, 5); if (nodes.length < 2) nodes = [{ icon: 'user', label: 'You' }, { icon: 'server', label: 'System' }, { icon: 'check', label: 'Done' }];
    const n = nodes.length, layout = d.layout || (n <= 3 ? 'row' : 'zigzag'); let pos;
    if (layout === 'row' && n <= 3) { const xs = spread(n, 130, 590); pos = xs.map(x => [x, 560]); }
    else if (layout === 'column') { const ys = spread(n, 260, 900); pos = ys.map(y => [360, y]); }
    else { const ys = spread(n, 250, 920); pos = ys.map((y, i) => [i % 2 ? 520 : 200, y]); }
    const lns = [], nds = [];
    for (let i = 0; i < n - 1; i++) lns.push(line(g, pos[i][0], pos[i][1], pos[i + 1][0], pos[i + 1][1], X.BLUE, 5));
    nodes.forEach((o, i) => nds.push(node(g, str(o.icon, 'chip'), str(o.label, ''), pos[i][0], pos[i][1], 54, { maxLabel: 190 })));
    const pk = el('circle', { r: 13, fill: X.ORANGE, stroke: '#fff3d6', 'stroke-width': 3 }, g), pk2 = el('circle', { r: 20, fill: X.ORANGE, opacity: .35 }, g);
    const ring = el('circle', { cx: pos[n - 1][0], cy: pos[n - 1][1], r: 54, fill: 'none', stroke: X.GREEN, 'stroke-width': 6 }, g);
    const seg = []; let tot = 0; for (let i = 0; i < n - 1; i++) { const L = Math.hypot(pos[i + 1][0] - pos[i][0], pos[i + 1][1] - pos[i][1]); seg.push(L); tot += L; }
    return function (lt, dur) {
      const step = 0.1;
      nds.forEach((o, i) => { const p = P(lt, dur, 0.03 + i * step, 0.03 + i * step + 0.1); pop(o.g, pos[i][0], pos[i][1], eob(p)); o.g.setAttribute('opacity', p > 0 ? 1 : 0); });
      lns.forEach((l, i) => setLine(l, P(lt, dur, 0.08 + i * step, 0.08 + i * step + 0.1)));
      const u = eio(P(lt, dur, 0.42, 0.88)); let dd = u * tot, px = pos[0][0], py = pos[0][1], idx = 0;
      for (let i = 0; i < seg.length; i++) { if (dd <= seg[i]) { const k = dd / seg[i]; px = lerp(pos[i][0], pos[i + 1][0], k); py = lerp(pos[i][1], pos[i + 1][1], k); idx = i + k; break; } dd -= seg[i]; px = pos[i + 1][0]; py = pos[i + 1][1]; idx = i + 1; }
      const on = P(lt, dur, 0.42, 0.88) > 0 && P(lt, dur, 0.42, 0.88) < 1;
      [pk, pk2].forEach(c => { c.setAttribute('cx', px); c.setAttribute('cy', py); c.setAttribute('display', on ? 'inline' : 'none'); });
      pk2.setAttribute('r', 20 + 4 * Math.sin(lt * 18));
      nds.forEach((o, i) => { const reached = P(lt, dur, 0.42, 0.88) > 0 && idx >= i - 0.15; o.set(i === n - 1 && u >= 1 ? 'good' : (reached && Math.abs(idx - i) < 0.6 ? 'hot' : 'on')); });
      const rp = prog(P(lt, dur, 0.88, 1), 0, 1); ring.setAttribute('r', 54 + rp * 60); ring.setAttribute('opacity', u >= 1 ? 1 - rp : 0);
    };
  };

  /* ------------------------------------------------------------- network */
  const NODES = [[90, 470], [205, 380], [200, 580], [330, 480], [335, 670], [450, 385], [465, 575], [590, 470], [625, 675], [135, 770], [260, 845], [405, 790], [540, 835], [330, 300]];
  const EDGES = [[0, 1], [0, 2], [1, 2], [1, 3], [2, 3], [2, 4], [3, 4], [3, 5], [3, 6], [4, 6], [4, 10], [4, 11], [5, 6], [5, 7], [6, 7], [6, 8], [6, 11], [7, 8], [8, 12], [9, 10], [10, 11], [11, 12], [1, 13], [13, 5], [2, 9], [13, 3]];
  S.network = function (g, d) {
    const crash = d.crash !== false, fromL = str(d.from, 'YOU'), toL = str(d.to, 'SITE'), title = str(d.label, ''), crashL = str(d.crash_label, 'CRASH!'), okL = str(d.result, 'STILL WORKS');
    const edges = EDGES.map(([a, b]) => ({ e: line(g, NODES[a][0], NODES[a][1], NODES[b][0], NODES[b][1], X.BLUE, 4), a, b }));
    const nodes = NODES.map((n) => { const gg = el('g', {}, g); const c = el('circle', { cx: n[0], cy: n[1], r: 17, fill: X.DARK, stroke: X.CYAN, 'stroke-width': 5 }, gg); const dd = el('circle', { cx: n[0], cy: n[1], r: 6, fill: X.BLUE }, gg); return { g: gg, c, d: dd }; });
    const route2 = [0, 2, 4, 6, 8], route1 = [0, 1, 3];
    const poly = ids => ids.map(i => NODES[i].join(',')).join(' ');
    const hiLen = (() => { let L = 0; for (let i = 0; i < route2.length - 1; i++) L += Math.hypot(NODES[route2[i]][0] - NODES[route2[i + 1]][0], NODES[route2[i]][1] - NODES[route2[i + 1]][1]); return L; })();
    const hi = el('polyline', { points: poly(route2), fill: 'none', stroke: X.ORANGE, 'stroke-width': 9, 'stroke-linecap': 'round', 'stroke-linejoin': 'round', 'stroke-dasharray': hiLen + ' ' + hiLen }, g);
    function polyPos(ids, u) { let tot = 0; const sg = []; for (let i = 0; i < ids.length - 1; i++) { const A = NODES[ids[i]], B = NODES[ids[i + 1]], L = Math.hypot(A[0] - B[0], A[1] - B[1]); sg.push([A, B, L]); tot += L; } let dd = u * tot;
      for (const [A, B, L] of sg) { if (dd <= L) { const k = dd / L; return [lerp(A[0], B[0], k), lerp(A[1], B[1], k)]; } dd -= L; } const l = NODES[ids[ids.length - 1]]; return [l[0], l[1]]; }
    const pk = el('circle', { r: 11, fill: X.ORANGE, stroke: '#fff3d6', 'stroke-width': 3 }, g), pk2 = el('circle', { r: 7, fill: X.ORANGE, opacity: .5 }, g);
    const amb = [0, 1, 2, 3].map(() => el('circle', { r: 6, fill: X.ORANGE, opacity: .7 }, g)), AMB = [[5, 7], [9, 10], [11, 12], [13, 5]];
    const tagYou = text(g, fromL, 90, 525, 28, X.WHITE, 700), tagSite = text(g, toL, 625, 730, 28, X.WHITE, 700);
    const titleG = el('g', {}, g); if (title) { const tt = text(titleG, title.toUpperCase(), 360, 215, 46, X.CYAN, 800, 'middle', { 'letter-spacing': 3 }); fit(tt, 660); el('path', { d: 'M60 236 Q200 226 360 238 T660 232', fill: 'none', stroke: X.ORANGE, 'stroke-width': 6, 'stroke-linecap': 'round' }, titleG); }
    const crashLbl = text(g, crashL, 330, 418, 52, X.RED, 800);
    const ring = el('circle', { cx: NODES[3][0], cy: NODES[3][1], r: 20, fill: 'none', stroke: X.RED, 'stroke-width': 6 }, g);
    const xmark = el('path', { d: `M${NODES[3][0] - 10} ${NODES[3][1] - 10} L${NODES[3][0] + 10} ${NODES[3][1] + 10} M${NODES[3][0] + 10} ${NODES[3][1] - 10} L${NODES[3][0] - 10} ${NODES[3][1] + 10}`, stroke: X.WHITE, 'stroke-width': 5, 'stroke-linecap': 'round' }, g);
    const ring2 = el('circle', { cx: NODES[8][0], cy: NODES[8][1], r: 20, fill: 'none', stroke: X.CYAN, 'stroke-width': 6 }, g);
    const okG = el('g', {}, g); icon(okG, 'check', NODES[8][0], 560, 70, X.WHITE, 2.4);
    const okC = el('circle', { cx: NODES[8][0], cy: 560, r: 36, fill: 'rgba(143,220,255,.18)', stroke: X.CYAN, 'stroke-width': 6 }, okG);
    const works = text(g, okL, 360, 975, 64, X.CYAN, 800, 'middle', { 'letter-spacing': 4 }); fit(works, 660);
    return function (lt, dur, f) {
      const buildEnd = dur * (crash ? 0.38 : 0.42), NA = i => 0.04 + i * (buildEnd - 0.4) / 14;
      const tCrash = dur * 0.6, crashed = crash && lt >= tCrash;
      const shk = (crash && lt > tCrash && lt < tCrash + .45) ? Math.sin(lt * 80) * 7 * (1 - prog(lt, tCrash, tCrash + .45)) : 0; g.setAttribute('transform', `translate(${shk} ${shk * .5})`);
      nodes.forEach((n, i) => { const p = prog(lt, NA(i), NA(i) + .35); pop(n.g, NODES[i][0], NODES[i][1], eob(p)); n.g.setAttribute('opacity', p > 0 ? 1 : 0);
        if (i === 3 && crashed) { n.c.setAttribute('stroke', X.RED); n.c.setAttribute('fill', 'rgba(255,77,77,.35)'); n.d.setAttribute('fill', X.RED); } else { n.c.setAttribute('stroke', X.CYAN); n.c.setAttribute('fill', X.DARK); n.d.setAttribute('fill', X.BLUE); } });
      edges.forEach((E, k) => { const st = Math.max(NA(E.a), NA(E.b)) + .05 + .01 * k; setLine(E.e, eo(prog(lt, st, st + .4))); const dead = crashed && (E.a === 3 || E.b === 3);
        E.e.setAttribute('stroke', dead ? X.RED : X.BLUE); E.e.setAttribute('opacity', dead ? lerp(.85, .28, prog(lt, tCrash + .05, tCrash + .45)) : .85); });
      amb.forEach((a, i) => { const on = lt > buildEnd * .6 && lt < (crash ? tCrash : dur * .9); if (!on) { a.setAttribute('display', 'none'); return; } const A = NODES[AMB[i][0]], B = NODES[AMB[i][1]], u = (lt * .7 + i * .31) % 1; a.setAttribute('display', 'inline'); a.setAttribute('cx', lerp(A[0], B[0], u)); a.setAttribute('cy', lerp(A[1], B[1], u)); });
      tagYou.setAttribute('opacity', prog(lt, NA(0) + .2, NA(0) + .5)); tagSite.setAttribute('opacity', prog(lt, NA(8) + .2, NA(8) + .5));
      const tp = prog(lt, buildEnd * .7, buildEnd * .7 + .35); titleG.setAttribute('opacity', tp); titleG.setAttribute('transform', `translate(0 ${(1 - eo(tp)) * 16})`);
      let px, py, on = false;
      if (crash) {
        const t1 = tCrash - dur * 0.14; if (lt >= t1 && lt < tCrash + .15) { const u = prog(lt, t1, tCrash); const pos = polyPos(route1, eio(u)); px = pos[0]; py = pos[1]; on = true; pk.setAttribute('opacity', lt >= tCrash ? (rnd(f) > .4 ? 1 : .2) : 1); }
        const t2 = tCrash + .4, t3 = Math.max(t2 + .6, dur * 0.9); if (lt >= t2 && lt < t3) { const pos = polyPos(route2, eio(prog(lt, t2, t3))); px = pos[0]; py = pos[1]; on = true; pk.setAttribute('opacity', 1); }
      } else { const t2 = buildEnd, t3 = dur * .9; if (lt >= t2 && lt < t3) { const pos = polyPos(route2, eio(prog(lt, t2, t3))); px = pos[0]; py = pos[1]; on = true; pk.setAttribute('opacity', 1); } }
      pk.setAttribute('display', on ? 'inline' : 'none'); pk2.setAttribute('display', on ? 'inline' : 'none'); if (on) { pk.setAttribute('cx', px); pk.setAttribute('cy', py); pk2.setAttribute('cx', px); pk2.setAttribute('cy', py); pk2.setAttribute('r', 16 + 4 * Math.sin(lt * 20)); }
      const cp = prog(lt, tCrash, tCrash + .4); ring.setAttribute('r', 20 + cp * 120); ring.setAttribute('opacity', crashed && lt < tCrash + .45 ? 1 - cp : 0); show(xmark, crashed ? 1 : 0);
      const clp = prog(lt, tCrash, tCrash + .12); crashLbl.setAttribute('opacity', crashed ? clp * (1 - prog(lt, tCrash + .9, tCrash + 1.2)) : 0); pop(crashLbl, 330, 418, .6 + .4 * eob(clp));
      const t2 = crash ? tCrash + .4 : buildEnd, t3 = Math.max(t2 + .6, dur * 0.9), hp = prog(lt, t2, t3);
      hi.setAttribute('stroke-dashoffset', hiLen * (1 - eio(hp))); hi.setAttribute('opacity', hp > 0 ? 1 : 0);
      const ap = prog(lt, t3, t3 + .5); ring2.setAttribute('r', 20 + ap * 90); ring2.setAttribute('opacity', lt >= t3 ? 1 - ap : 0);
      const kp = prog(lt, t3, t3 + .25); okG.setAttribute('opacity', kp); pop(okG, NODES[8][0], 560, eob(kp));
      const wp = prog(lt, t3 + .1, t3 + .35); works.setAttribute('opacity', wp); pop(works, 360, 975, .85 + .15 * eo(wp));
    };
  };

  /* ----------------------------------------------------------------- hub */
  S.hub = function (g, d) {
    const hubD = d.hub || {}, fail = d.fail !== false; let spokes = arr(d.spokes, 6); if (spokes.length < 3) spokes = [{ icon: 'mail', label: 'Mail' }, { icon: 'map', label: 'Maps' }, { icon: 'video', label: 'Video' }, { icon: 'phone', label: 'Phone' }];
    const n = spokes.length, cx = 360, cy = 580, R = 260, label = str(d.label, '');
    const pos = spokes.map((_, i) => { const a = -Math.PI / 2 + i * 2 * Math.PI / n; return [cx + R * Math.cos(a) * 0.95, cy + R * Math.sin(a) * 1.0]; });
    const lns = pos.map(p => line(g, cx, cy, p[0], p[1], X.BLUE, 5));
    const hubN = node(g, str(hubD.icon, 'cloud'), str(hubD.label, ''), cx, cy, 78, { labelSize: 34 });
    const sp = spokes.map((o, i) => node(g, str(o.icon, 'chip'), str(o.label, ''), pos[i][0], pos[i][1], 46, { labelSize: 26, maxLabel: 160 }));
    const pks = pos.map(() => el('circle', { r: 9, fill: X.ORANGE }, g));
    const lbl = label ? badge(g, label.toUpperCase(), 360, 190, 44, X.ORANGE) : null;
    return function (lt, dur, f) {
      const tF = dur * 0.6, failed = fail && lt >= tF;
      pop(hubN.g, cx, cy, eob(P(lt, dur, 0.02, 0.14)));
      sp.forEach((o, i) => { const p = P(lt, dur, 0.1 + i * 0.04, 0.22 + i * 0.04); pop(o.g, pos[i][0], pos[i][1], eob(p)); o.g.setAttribute('opacity', p > 0 ? 1 : 0); });
      lns.forEach((l, i) => { setLine(l, P(lt, dur, 0.12 + i * 0.04, 0.26 + i * 0.04)); l.setAttribute('stroke', failed ? X.RED : X.BLUE); l.setAttribute('opacity', failed ? lerp(.9, .2, prog(lt, tF, tF + .5)) : .9); });
      pks.forEach((c, i) => { const on = lt > dur * .3 && (!fail || lt < tF); c.setAttribute('display', on ? 'inline' : 'none'); const u = (lt * .9 + i * .17) % 1; c.setAttribute('cx', lerp(cx, pos[i][0], u)); c.setAttribute('cy', lerp(cy, pos[i][1], u)); });
      hubN.set(failed ? (Math.floor(lt * 10) % 2 && lt < tF + .8 ? 'dead' : 'bad') : 'on');
      sp.forEach((o, i) => o.set(failed && lt > tF + .15 + i * .12 ? 'dead' : 'on'));
      if (lbl) { const p = prog(lt, fail ? tF - .2 : dur * .2, (fail ? tF - .2 : dur * .2) + .3); lbl.setAttribute('opacity', p); pop(lbl, 360, 190, .85 + .15 * eo(p)); }
      const v = document.getElementById('redv'); if (failed) S._red = Math.max(S._red || 0, 0.5 * (1 - prog(lt, tF + .8, tF + 1.4)) * prog(lt, tF, tF + .2));
    };
  };

  /* ---------------------------------------------------------------- grid */
  S.grid = function (g, d) {
    let items = arr(d.items, 9); if (items.length < 2) items = [{ icon: 'mail', label: 'Mail' }, { icon: 'map', label: 'Maps' }, { icon: 'video', label: 'Video' }, { icon: 'cloud', label: 'Cloud' }];
    const n = items.length, cols = d.cols || (n <= 4 ? 2 : 3), rows = Math.ceil(n / cols), mode = d.mode || 'fail', cw = 215, ch = 215;
    const x0 = 360 - (cols - 1) * cw / 2, y0 = 560 - (rows - 1) * ch / 2 + (d.badge ? 40 : 0);
    const tiles = items.map((o, i) => { const c = i % cols, r = Math.floor(i / cols), x = x0 + c * cw, y = y0 + r * ch, gg = el('g', {}, g);
      const rect = el('rect', { x: x - 72, y: y - 72, width: 144, height: 144, rx: 36, fill: 'rgba(40,100,200,.35)', stroke: X.BLUE, 'stroke-width': 5 }, gg);
      const ic = icon(gg, str(o.icon, 'chip'), x, y, 74, X.CYAN, 1.8); const t = text(gg, str(o.label, ''), x, y + 108, 28, X.WHITE, 700); fit(t, 190); return { g: gg, rect, ic, t, x, y }; });
    const b = d.badge ? badge(g, str(d.badge).toUpperCase(), 360, 215, 62, mode === 'light' ? X.GREEN : X.RED) : null;
    const order = Array.isArray(d.order) ? d.order : items.map((_, i) => i);
    return function (lt, dur) {
      tiles.forEach((T, i) => { const p = P(lt, dur, 0.03 + i * .04, 0.15 + i * .04); pop(T.g, T.x, T.y, eob(p)); T.g.setAttribute('opacity', p > 0 ? 1 : 0); });
      const t0 = dur * .42, span = dur * .45;
      order.forEach((idx, k) => { const T = tiles[idx]; if (!T) return; const when = t0 + span * k / Math.max(order.length, 1);
        let dead = mode === 'fail' && lt >= when + .15, lit = mode === 'light' && lt >= when;
        if (mode === 'fail' && lt >= when && lt < when + .15) T.g.setAttribute('opacity', rnd(Math.floor(lt * 30) + k) > .5 ? 1 : .25);
        T.rect.setAttribute('stroke', dead ? '#46506f' : (lit ? X.GREEN : X.BLUE)); T.rect.setAttribute('fill', dead ? 'rgba(25,32,58,.8)' : (lit ? 'rgba(79,240,168,.22)' : 'rgba(40,100,200,.35)'));
        T.ic.setAttribute('stroke', dead ? '#59658c' : (lit ? '#c9ffe9' : X.CYAN)); T.ic.style.color = dead ? '#59658c' : (lit ? '#c9ffe9' : X.CYAN); T.t.setAttribute('fill', dead ? '#7d89ad' : X.WHITE); });
      if (b) { const p = prog(lt, t0 - .2, t0 + .1); b.setAttribute('opacity', p); pop(b, 360, 215, .85 + .15 * eob(p)); }
    };
  };

  /* ------------------------------------------------------------- counter */
  S.counter = function (g, d) {
    const to = Number(d.value) || 0, from = Number(d.from) || 0, pre = str(d.prefix), suf = str(d.suffix), lab = str(d.label), sub = str(d.sub), loc = d.locale || 'en-IN';
    const ring = el('circle', { cx: 360, cy: 360, r: 120, fill: 'none', stroke: X.BLUE, 'stroke-width': 8, 'stroke-linecap': 'round', 'stroke-dasharray': 754, 'stroke-dashoffset': 754, transform: 'rotate(-90 360 360)' }, g);
    el('circle', { cx: 360, cy: 360, r: 120, fill: 'none', stroke: 'rgba(120,170,255,.18)', 'stroke-width': 8 }, g);
    const ico = icon(g, d.icon || 'bolt', 360, 360, 110, X.CYAN, 1.7);
    const num = text(g, '', 360, 650, 170, X.WHITE, 900); const lines = X.wrap(lab, 20).slice(0, 3);
    const lt_ = lines.map((l, i) => text(g, l, 360, 745 + i * 58, 46, X.CYAN, 700)); const st = sub ? text(g, sub, 360, 745 + lines.length * 58 + 30, 32, X.WHITE, 500) : null;
    const sp = Array.from({ length: 10 }, (_, i) => el('circle', { r: 4, fill: i % 2 ? X.ORANGE : X.CYAN }, g));
    return function (lt, dur) {
      const u = eo(P(lt, dur, 0.04, 0.72)); const v = lerp(from, to, u);
      num.textContent = pre + (d.plain ? String(Math.round(v)) : X.fmt(v, loc)) + suf; num.setAttribute('font-size', 170); fit(num, 640);
      ring.setAttribute('stroke-dashoffset', 754 * (1 - u)); pop(ico, 360, 360, eob(P(lt, dur, 0, .15)));
      const pulse = u >= 1 ? 1 + .04 * Math.sin((lt - dur * .72) * 12) * Math.exp(-(lt - dur * .72) * 3) : 1; pop(num, 360, 600, pulse);
      lt_.forEach((t, i) => { const p = prog(lt, dur * .2 + i * .12, dur * .2 + i * .12 + .3); t.setAttribute('opacity', p); });
      if (st) st.setAttribute('opacity', prog(lt, dur * .45, dur * .45 + .4));
      sp.forEach((c, i) => { const a = rnd(i) * 6.28, r = 150 + ((lt * 60 + i * 30) % 90); c.setAttribute('cx', 360 + Math.cos(a + lt * .5) * r); c.setAttribute('cy', 360 + Math.sin(a + lt * .5) * r); c.setAttribute('opacity', u > 0 && u < 1 ? .8 : 0); });
    };
  };

  /* ------------------------------------------------------------- compare */
  S.compare = function (g, d) {
    const A = d.a || {}, B = d.b || {}, win = d.winner || null;
    function card(o, y, col, name) { const gg = el('g', {}, g);
      const rect = el('rect', { x: 50, y, width: 620, height: 330, rx: 40, fill: 'rgba(25,45,100,.55)', stroke: col, 'stroke-width': 6 }, gg);
      icon(gg, str(o.icon, name === 'a' ? 'user' : 'robot'), 140, y + 95, 100, col, 1.7);
      const t = text(gg, str(o.title, name === 'a' ? 'Before' : 'After'), 215, y + 85, 50, X.WHITE, 800, 'start'); fit(t, 420);
      const pts = arr(o.points, 3).map((p, i) => { const pg = el('g', {}, gg); el('circle', { cx: 100, cy: y + 168 + i * 56, r: 8, fill: col }, pg); const pt = text(pg, str(p), 125, y + 180 + i * 56, 34, X.WHITE, 500, 'start'); fit(pt, 510); return pg; });
      return { g: gg, rect, pts, y }; }
    const cA = card(A, 150, X.BLUE, 'a'), cB = card(B, 610, X.ORANGE, 'b');
    const vs = el('g', {}, g); el('circle', { cx: 360, cy: 555, r: 44, fill: X.DARK, stroke: X.WHITE, 'stroke-width': 5 }, vs); text(vs, 'VS', 360, 570, 38, X.WHITE, 900);
    const tickA = icon(g, 'check', 625, 205, 56, X.GREEN, 2.6), tickB = icon(g, 'check', 625, 665, 56, X.GREEN, 2.6);
    return function (lt, dur) {
      const pa = P(lt, dur, 0.03, 0.2), pb = P(lt, dur, 0.32, 0.5), pv = P(lt, dur, 0.26, 0.38);
      pop(cA.g, 360, cA.y + 165, eob(pa)); cA.g.setAttribute('opacity', pa > 0 ? 1 : 0); pop(cB.g, 360, cB.y + 165, eob(pb)); cB.g.setAttribute('opacity', pb > 0 ? 1 : 0); pop(vs, 360, 555, eob(pv)); vs.setAttribute('opacity', pv > 0 ? 1 : 0);
      cA.pts.forEach((p, i) => p.setAttribute('opacity', prog(lt, dur * (.12 + i * .05), dur * (.12 + i * .05) + .25))); cB.pts.forEach((p, i) => p.setAttribute('opacity', prog(lt, dur * (.4 + i * .05), dur * (.4 + i * .05) + .25)));
      const w = P(lt, dur, 0.72, 0.82);
      [[cA, 'a', tickA, X.BLUE], [cB, 'b', tickB, X.ORANGE]].forEach(([c, k, tk, col]) => { const isW = win === k; c.rect.setAttribute('stroke', isW && w > 0 ? X.GREEN : col); c.g.setAttribute('opacity', (pa > 0 || k === 'b' && pb > 0) ? (win && !isW ? 1 - .5 * w : 1) : 0); show(tk, isW ? w : 0); });
    };
  };

  /* --------------------------------------------------------------- steps */
  S.steps = function (g, d) {
    const steps = arr(d.steps, 5).map(String); if (!steps.length) steps.push('Step one', 'Step two', 'Step three'); const n = steps.length, title = str(d.title);
    const top = title ? 330 : 260, ys = spread(n, top, 960 - (n > 4 ? 0 : 60)); const items = [];
    const spine = line(g, 110, ys[0], 110, ys[n - 1], 'rgba(120,170,255,.4)', 6);
    if (title) { const t = text(g, title.toUpperCase(), 360, 200, 46, X.CYAN, 800); fit(t, 640); }
    steps.forEach((s, i) => { const gg = el('g', {}, g); const c = el('circle', { cx: 110, cy: ys[i], r: 40, fill: X.DARK, stroke: X.BLUE, 'stroke-width': 6 }, gg);
      const num = text(gg, String(i + 1), 110, ys[i] + 15, 42, X.WHITE, 800); const ck = icon(gg, 'check', 110, ys[i], 46, X.GREEN, 3);
      const ls = X.wrap(s, 24).slice(0, 2), ts = ls.map((l, k) => { const t = text(gg, l, 180, ys[i] + 12 + (k - (ls.length - 1) / 2) * 44, 38, X.WHITE, 600, 'start'); fit(t, 500); return t; });
      items.push({ g: gg, c, num, ck, ts, y: ys[i] }); });
    return function (lt, dur) {
      setLine(spine, P(lt, dur, 0.02, 0.3));
      items.forEach((o, i) => { const p = P(lt, dur, 0.04 + i * .06, 0.14 + i * .06); pop(o.g, 110, o.y, .6 + .4 * eob(p)); o.g.setAttribute('opacity', p > 0 ? 1 : 0);
        const act = 0.15 + i * (0.78 / n), a = P(lt, dur, act, act + .08), done = P(lt, dur, act + .78 / n, act + .78 / n + .06) > 0 || (i === n - 1 && P(lt, dur, .93, 1) > 0);
        o.c.setAttribute('stroke', done ? X.GREEN : (a > 0 ? X.ORANGE : X.BLUE)); o.c.setAttribute('fill', done ? 'rgba(79,240,168,.2)' : (a > 0 ? 'rgba(255,138,31,.25)' : X.DARK));
        show(o.ck, done ? 1 : 0); o.num.setAttribute('display', done ? 'none' : 'inline'); o.ts.forEach(t => t.setAttribute('fill', a > 0 || done ? X.WHITE : '#9fb0d8')); }); };
  };

  /* --------------------------------------------------------------- alert */
  S.alert = function (g, d) {
    const kind = d.kind || 'warning', C = { warning: X.RED, error: X.RED, success: X.GREEN, info: X.CYAN }[kind] || X.RED, ic = d.icon || { warning: 'warning', error: 'x', success: 'check', info: 'question' }[kind] || 'warning';
    const sym = el('g', {}, g);
    if (kind === 'warning' && !d.icon) { el('path', { d: 'M360 270 L520 560 L200 560 Z', fill: 'rgba(255,77,77,.16)', stroke: C, 'stroke-width': 10, 'stroke-linejoin': 'round' }, sym); text(sym, '!', 360, 520, 200, X.WHITE, 800); }
    else { el('circle', { cx: 360, cy: 420, r: 150, fill: C === X.GREEN ? 'rgba(79,240,168,.14)' : 'rgba(255,77,77,.14)', stroke: C, 'stroke-width': 10 }, sym); icon(sym, ic, 360, 420, 170, X.WHITE, 2.2); }
    const t = badge(g, str(d.text, kind === 'success' ? 'ALL GOOD' : 'ALERT').toUpperCase(), 360, 720, 84, C); const sl = X.wrap(str(d.sub), 26).slice(0, 3).map((l, i) => text(g, l, 360, 810 + i * 50, 38, X.WHITE, 500));
    const ring = el('circle', { cx: 360, cy: 420, r: 150, fill: 'none', stroke: C, 'stroke-width': 5 }, g);
    return function (lt, dur) {
      const p = P(lt, dur, 0, .18), sh = (kind !== 'success' && kind !== 'info' && lt < .5) ? Math.sin(lt * 90) * 8 * (1 - lt / .5) * p : 0;
      sym.setAttribute('transform', `translate(${360 + sh} 420) scale(${p <= 0 ? .001 : .4 + .6 * eob(p)}) translate(-360 -420)`);
      const tp = prog(lt, .25, .5); t.setAttribute('opacity', tp); pop(t, 360, 720, .8 + .2 * eob(tp)); sl.forEach((s, i) => s.setAttribute('opacity', prog(lt, .45 + i * .1, .75 + i * .1)));
      const u = (lt * .9) % 1; ring.setAttribute('r', 150 + u * 90); ring.setAttribute('opacity', (1 - u) * .5);
      if (kind === 'warning' || kind === 'error') S._red = Math.max(S._red || 0, .4 * prog(lt, 0, .3) * (.7 + .3 * Math.sin(lt * 10)));
    };
  };

  /* ---------------------------------------------------------------- bars */
  S.bars = function (g, d) {
    let bars = arr(d.bars, 6).map(b => ({ label: str(b.label), value: Number(b.value) || 0 })); if (bars.length < 2) bars = [{ label: 'A', value: 20 }, { label: 'B', value: 55 }, { label: 'C', value: 90 }];
    const n = bars.length, mx = Math.max(...bars.map(b => b.value), 1), unit = str(d.unit), title = str(d.title), hl = d.highlight !== undefined ? d.highlight : bars.findIndex(b => b.value === mx);
    const base = 900, maxH = 520, slot = 600 / n, bw = Math.min(110, slot * .62), x0 = 60 + slot / 2;
    if (title) { const t = text(g, title.toUpperCase(), 360, 200, 44, X.CYAN, 800); fit(t, 640); }
    el('line', { x1: 50, y1: base, x2: 670, y2: base, stroke: '#4f6bb0', 'stroke-width': 5, 'stroke-linecap': 'round' }, g);
    const bs = bars.map((b, i) => { const x = x0 + i * slot, gg = el('g', {}, g), col = i === hl ? X.ORANGE : X.BLUE;
      const r = el('rect', { x: x - bw / 2, y: base, width: bw, height: 0, rx: 14, fill: i === hl ? 'rgba(255,138,31,.55)' : 'rgba(61,165,255,.45)', stroke: col, 'stroke-width': 5 }, gg);
      const v = text(gg, '', x, base - 20, 38, X.WHITE, 800); const l = text(gg, b.label, x, base + 46, 30, X.WHITE, 600); fit(l, slot - 8); return { r, v, x, b }; });
    return function (lt, dur) {
      bs.forEach((o, i) => { const p = eo(P(lt, dur, .08 + i * .08, .42 + i * .08)), h = maxH * (o.b.value / mx) * p; o.r.setAttribute('y', base - h); o.r.setAttribute('height', Math.max(h, 0));
        o.v.textContent = (p > 0 ? X.fmt(o.b.value * p, d.locale) + unit : ''); o.v.setAttribute('y', base - h - 18); o.v.setAttribute('opacity', p > 0.05 ? 1 : 0); }); };
  };

  /* ------------------------------------------------------------ collapse */
  S.collapse = function (g, d) {
    const names = arr(d.items, 5).map(String); const its = names.length ? names : ['phone', 'laptop', 'cab', 'shop', 'play']; const n = its.length;
    const lab = Array.isArray(d.label) ? d.label.slice(0, 2).map(String) : (d.label ? X.wrap(String(d.label).toUpperCase(), 14).slice(0, 2) : ['SINGLE POINT', 'OF FAILURE']);
    el('path', { d: 'M30 1012 H690', stroke: '#4f6bb0', 'stroke-width': 5, 'stroke-linecap': 'round', fill: 'none', 'stroke-dasharray': '26 12' }, g);
    const pillar = el('g', {}, g); const pRect = el('rect', { x: 325, y: 720, width: 70, height: 290, rx: 10, fill: 'rgba(35,75,160,.55)', stroke: X.BLUE, 'stroke-width': 6 }, pillar);
    const crack = el('path', { d: 'M360 722 L346 770 L372 806 L344 850 L368 892 L352 940', fill: 'none', stroke: X.RED, 'stroke-width': 6, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }, pillar); const cl = crack.getTotalLength(); crack.setAttribute('stroke-dasharray', cl);
    const stub = el('polygon', { points: '325,1010 395,1010 395,884 376,868 356,888 340,868 325,880', fill: 'rgba(35,75,160,.55)', stroke: X.RED, 'stroke-width': 6, 'stroke-linejoin': 'round' }, g);
    const deb = Array.from({ length: 7 }, (_, i) => { const s = 16 + rnd(i + 2) * 22; return { e: el('polygon', { points: `0,${-s} ${s * .9},${s * .4} ${-s * .6},${s * .8}`, fill: 'rgba(70,120,220,.8)', stroke: X.RED, 'stroke-width': 3 }, g), x: 330 + rnd(i) * 60, y: 740 + rnd(i + 11) * 120, vx: (rnd(i + 21) - .5) * 420, vy: -60 - rnd(i + 31) * 220, w: (rnd(i + 41) - .5) * 14 }; });
    const plat = el('g', {}, g); el('rect', { x: 70, y: 670, width: 580, height: 50, rx: 18, fill: 'rgba(60,110,210,.55)', stroke: X.CYAN, 'stroke-width': 6 }, plat);
    const xs = spread(n, 150, 570), items = its.map((nm, i) => { const gg = el('g', {}, g); el('rect', { x: -44, y: -92, width: 88, height: 88, rx: 22, fill: 'rgba(255,255,255,.08)', stroke: i % 2 ? X.YELLOW : X.WHITE, 'stroke-width': 5 }, gg); icon(gg, nm, 0, -48, 52, i % 2 ? X.YELLOW : X.CYAN, 1.8); return { g: gg, x0: xs[i] }; });
    const lblG = el('g', {}, g); lab.forEach((l, i) => { const t = text(lblG, l, 360, 350 + i * 70, 64, X.ORANGE, 800); fit(t, 640); }); el('path', { d: 'M110 446 Q240 436 360 448 T610 442', fill: 'none', stroke: X.RED, 'stroke-width': 7, 'stroke-linecap': 'round' }, lblG);
    const dust = Array.from({ length: 7 }, () => el('circle', { r: 10, fill: '#9fb4e8' }, g));
    const rot = (x, y, deg, cx, cy) => { const a = deg * Math.PI / 180, c = Math.cos(a), s = Math.sin(a), dx = x - cx, dy = y - cy; return [cx + dx * c - dy * s, cy + dx * s + dy * c]; };
    return function (lt, dur) {
      const tC = Math.max(1.5, Math.min(dur * .55, dur - 1.4)), tCr0 = Math.min(.5, tC * .3);
      const ang = t => { const sway = .55 * Math.sin(t * 9) * prog(t, tCr0, tC - .6) * (1 - prog(t, tC - .35, tC)); return t < tC ? [sway, 360, 695] : [-17 * eio(prog(t, tC, tC + .55)), 650, 695]; };
      const sh = lt > tC + .05 ? Math.sin(lt * 70) * 8 * Math.exp(-(lt - tC - .05) * 6) : 0; g.setAttribute('transform', `translate(${sh} ${sh * .6})`);
      crack.setAttribute('stroke-dashoffset', cl * (1 - eo(prog(lt, tCr0, tC - .25)))); const hot = prog(lt, tCr0, tC - .3), pulse = .5 + .5 * Math.sin(lt * 12);
      pRect.setAttribute('stroke', hot > 0 ? `rgb(${Math.round(lerp(61, 255, hot * (.6 + .4 * pulse)))},${Math.round(lerp(165, 77, hot))},${Math.round(lerp(255, 77, hot))})` : X.BLUE);
      pillar.setAttribute('display', lt < tC ? 'inline' : 'none'); stub.setAttribute('display', lt >= tC ? 'inline' : 'none');
      deb.forEach(o => { const dt = lt - tC; if (dt < 0) { o.e.setAttribute('display', 'none'); return; } let y = o.y + o.vy * dt + .5 * 1500 * dt * dt, x = o.x + o.vx * dt; if (y > 1000) { y = 1000; x = o.x + o.vx * ((-o.vy + Math.sqrt(o.vy * o.vy + 3000 * (1000 - o.y))) / 1500); } o.e.setAttribute('display', 'inline'); o.e.setAttribute('transform', `translate(${x} ${y}) rotate(${o.w * dt * 60})`); });
      const [a, px, py] = ang(lt); plat.setAttribute('transform', `rotate(${a} ${px} ${py})`);
      items.forEach((it, i) => { const det = tC + .1 + i * .04, bob = lt < tCr0 ? Math.sin(lt * 4 + i) * 2 : 0;
        if (lt < det) { const p = rot(it.x0, 670 + bob, a, px, py); it.g.setAttribute('transform', `translate(${p[0]} ${p[1]}) rotate(${a})`); return; }
        const A0 = ang(det), base = rot(it.x0, 670, A0[0], A0[1], A0[2]), dt = lt - det, gr = 1500, vx = -70 - i * 38 * (i % 2 ? 1 : .4) - (i === n - 1 ? 160 : 0), vy = -60 - rnd(i + 3) * 60, w = (rnd(i + 9) - .5) * 260;
        const dl = (-vy + Math.sqrt(vy * vy + 2 * gr * Math.max(1012 - base[1], 1))) / gr, dd = Math.min(dt, dl), sq = dt >= dl ? Math.max(0, 1 - (dt - dl) * 6) : 0;
        it.g.setAttribute('transform', `translate(${base[0] + vx * dd} ${base[1] + vy * dd + .5 * gr * dd * dd}) rotate(${A0[0] + w * dd * .5}) scale(${1 + .08 * sq},${1 - .1 * sq})`); });
      const lp = prog(lt, tCr0, tCr0 + .35); lblG.setAttribute('opacity', lp); lblG.setAttribute('transform', `translate(0 ${(1 - eo(lp)) * 14})`);
      dust.forEach((c, i) => { const dt = lt - (tC + .5 + i * .05); if (dt < 0 || dt > .55) { c.setAttribute('display', 'none'); return; } c.setAttribute('display', 'inline'); c.setAttribute('cx', 150 + i * 70 + (rnd(i) - .5) * 40); c.setAttribute('cy', 1000 - dt * 60); c.setAttribute('r', 10 + dt * 60); c.setAttribute('opacity', .45 * (1 - dt / .55)); });
      S._red = Math.max(S._red || 0, lt > tCr0 ? .3 * prog(lt, tCr0, tCr0 + .5) * (.6 + .4 * Math.sin(lt * 10)) * (1 - prog(lt, tC + .4, tC + .8)) : 0);
    };
  };

  /* ----------------------------------------------------------- keypoints */
  S.keypoints = function (g, d) {
    let pts = arr(d.points, 4).map(String); if (!pts.length) pts = [str(d.text, 'Key idea')]; const n = pts.length, ys = spread(n, n === 1 ? 560 : 330, n === 1 ? 560 : 880);
    const rows = pts.map((p, i) => { const gg = el('g', {}, g); const col = [X.BLUE, X.ORANGE, X.CYAN, X.GREEN][i % 4];
      el('rect', { x: 50, y: ys[i] - 70, width: 620, height: 140, rx: 36, fill: 'rgba(25,45,100,.55)', stroke: col, 'stroke-width': 6 }, gg);
      icon(gg, i === n - 1 && n > 1 ? 'check' : 'bolt', 120, ys[i], 64, col, 2.2); const ls = X.wrap(p, 18).slice(0, 2);
      ls.forEach((l, k) => { const t = text(gg, l, 175, ys[i] + 16 + (k - (ls.length - 1) / 2) * 56, 52, X.WHITE, 800, 'start'); fit(t, 470); }); return { g: gg, y: ys[i] }; });
    return function (lt, dur) { rows.forEach((o, i) => { const p = P(lt, dur, .05 + i * .16, .05 + i * .16 + .12); pop(o.g, 360, o.y, .75 + .25 * eob(p)); o.g.setAttribute('opacity', p > 0 ? 1 : 0); }); };
  };

  S._red = 0;
})();
