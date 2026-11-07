/* Timeline runtime: window.loadSpec(spec) then window.render(t, frameIndex) draws the exact frame for time t. */
(function () {
  const X = window.X, S = window.Scenes;
  let spec = null, inst = [], parts = [], endEls = null;
  const $ = id => document.getElementById(id);

  function buildEnd(ch) {
    const end = $('end'); end.innerHTML = '';
    const mk = (cls, css, html) => { const d = document.createElement('div'); d.className = cls; Object.assign(d.style, css); d.innerHTML = html || ''; end.appendChild(d); return d; };
    const head = mk('abs', { top: '276px', fontSize: '70px', fontWeight: 800 }, (ch.end_text || 'Follow for more').replace(/</g, '&lt;'));
    const ul = mk('', { position: 'absolute', left: '300px', top: '366px', width: '120px', height: '7px', borderRadius: '4px', background: '#ff8a1f' });
    const nm = String(ch.name || 'Channel'), ac = String(ch.name_accent || ''), base = ac && nm.endsWith(ac) ? nm.slice(0, nm.length - ac.length) : nm;
    const name = mk('abs', { top: '410px', fontSize: '127px', fontWeight: 900, lineHeight: '1.1' }, `${base.replace(/</g, '&lt;')}<span style="color:#2f7bff">${ac.replace(/</g, '&lt;')}</span>`);
    const handle = mk('abs', { top: '545px', fontSize: '35px', fontWeight: 600, color: '#5c6780' }, String(ch.handle || '').replace(/</g, '&lt;'));
    const defs = [['Like', '#2f7bff', 'thumb', 693, 467, 85, .55], ['Comment', '#ff8a1f', 'chat', 807, 467, 85, .95], ['Subscribe', '#ff3b3b', 'bell', 930, 520, 100, 1.35]];
    const btns = defs.map(([lab, col, ic, cy, w, h, t0]) => {
      const b = mk('btn', { top: cy + 'px', width: w + 'px', height: h + 'px', background: col, fontSize: Math.round(h * .42) + 'px', marginLeft: (-w / 2) + 'px', paddingLeft: '10px', boxSizing: 'border-box' });
      const bd = h - 19; b.innerHTML = `<div class="badge" style="width:${bd}px;height:${bd}px"><svg viewBox="0 0 24 24" width="${bd * .6}" height="${bd * .6}" fill="none" stroke="${col}" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" style="color:${col}">${window.iconMarkup(ic)}</svg></div><div class="lab" style="padding-right:${bd / 2}px">${lab}</div>`;
      return { b, t0, cy, h, lab };
    });
    return { head, ul, name, handle, btns };
  }
  const eob = X.eob;

  window.loadSpec = async function (sp) {
    spec = sp;
    await Promise.all(['400', '500', '600', '700', '800', '900'].map(w => document.fonts.load(`${w} 40px InterBundled`)));
    await document.fonts.ready;
    const sg = $('scenes'); sg.innerHTML = ''; inst = [];
    sp.scenes.forEach((s, i) => {
      const grp = X.el('g', { display: 'inline' }, sg), inner = X.el('g', s.type === 'story' ? {} : { filter: 'url(#fx)' }, grp);
      let upd;
      try { upd = (S[s.type] || S.keypoints)(inner, s.data || {}); }
      catch (e) { console.error('scene ' + i + ' (' + s.type + ') failed: ' + e); inner.innerHTML = ''; upd = S.keypoints(inner, { points: [String(s.say || '')] }); }
      grp.setAttribute('display', 'none'); inst.push({ grp, upd, s });
    });
    if (X.preload) await Promise.all(X.preload);
    const pg = $('parts'); pg.innerHTML = ''; parts = [];
    for (let i = 0; i < 22; i++) parts.push({ c: X.el('circle', { r: 1.5 + X.rnd(i) * 2.2, fill: i % 4 ? X.CYAN : X.ORANGE, 'fill-opacity': .35 }, pg), x: X.rnd(i + 9) * 720, y: X.rnd(i + 3) * 1228, s: 6 + X.rnd(i + 5) * 14 });
    const tt = $('title'); const tx = tt.querySelector('.t'); tx.textContent = sp.title || ''; tx.style.fontSize = '43px';
    let g = 0; while (tx.scrollWidth > 620 && g++ < 30) tx.style.fontSize = (parseFloat(tx.style.fontSize) * .94) + 'px';
    if (sp.look && sp.look.title_in_video === false) tt.style.display = 'none';
    endEls = buildEnd(sp.channel || {});
    return true;
  };

  window.render = function (t, f) {
    if (!spec) return;
    const T = spec.T, cl = X.clamp, prog = X.prog;
    X.S_red_reset = (S._red = 0);
    $('turb').setAttribute('seed', 1 + Math.floor(t * 9) % 8);
    parts.forEach((p, i) => { p.c.setAttribute('cx', (p.x + Math.sin(t * .6 + i) * 14) % 720); p.c.setAttribute('cy', ((p.y - t * p.s) % 1228 + 1228) % 1228); });
    $('stage').style.transform = `scale(${(640 / 720) * (1 + .05 * cl(t / T))})`;
    inst.forEach((o, idx) => {
      const s = o.s, nx = spec.scenes[idx + 1], pv = spec.scenes[idx - 1];
      let op = Math.min(prog(t, s.start - .12, s.start + .12), 1 - prog(t, s.end - .12, s.end + .12));
      if (s.type === 'story') {   // story -> story: dissolve the new scene in over the old one (no dark dip)
        const fin = pv && pv.type === 'story' ? prog(t, s.start - .02, s.start + .4) : prog(t, s.start - .12, s.start + .12);
        const fout = nx && nx.type === 'story' ? 1 : 1 - prog(t, s.end - .12, s.end + .12);
        op = Math.min(fin, fout);
      }
      X.show(o.grp, op); if (op <= 0) return;
      o.upd(Math.max(0, t - s.start), s.end - s.start, f);
    });
    $('redv').setAttribute('opacity', cl(S._red, 0, .6).toFixed(3));
    let c = ''; for (const k of spec.captions) if (t >= k.s && t < k.e + .05) c = k.text;
    const cb = $('capbox'); if (cb._t !== c) { cb._t = c; cb.textContent = c; cb.style.fontSize = '48px'; cb.style.display = c ? 'flex' : 'none';
      if (c) { const w = cb.offsetWidth; if (w > 680) cb.style.fontSize = Math.max(28, Math.floor(48 * 680 / w)) + 'px'; } }
    // title
    const tt = $('title'); const fadeOut = 1 - prog(t, T, T + .35);
    tt.style.opacity = (prog(t, .15, .65) * fadeOut).toFixed(3); $('frame').style.opacity = fadeOut.toFixed(3);
    // end card
    const end = $('end'), te = t - T;
    if (te < 0) { end.style.display = 'none'; return; }
    end.style.display = 'block'; end.style.opacity = prog(te, .1, .5).toFixed(3);
    const k = X.eo(prog(te, .15, .65)); const E = endEls;
    [E.head, E.name, E.handle].forEach((e, i) => { e.style.opacity = k; e.style.transform = `translateY(${(1 - k) * 20}px)`; }); E.ul.style.opacity = k;
    E.btns.forEach(o => { const p = (te - o.t0) / .42; if (p <= 0) { o.b.style.opacity = 0; return; }
      let s = .55 + .45 * eob(Math.min(p, 1)); if (o.lab === 'Subscribe' && te > 2.0) s *= 1 + .018 * Math.sin((te - 2.0) * 7);
      o.b.style.opacity = Math.min(p * 1.6, 1); o.b.style.transform = `translateY(-50%) scale(${s})`; });
  };
})();
