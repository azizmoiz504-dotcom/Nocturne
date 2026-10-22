/* Bait Al Maqdis website (new look): the moving parts.
   The wall of every product that sorts itself into its ranges as you scroll, the parts board, the featured ranges,
   the price request being filled in, and the smaller touches. Everything here is extra: without it (or with
   "reduce motion" on) the pages still show and do everything, just without movement. */
(() => {
  'use strict';
  const d = document, html = d.documentElement;
  const CFG = JSON.parse(d.getElementById('site-config').textContent);
  const T = CFG.t, AR = CFG.lang === 'ar', ROOT = CFG.root, HOME = CFG.home || './';
  const $ = (s, el) => (el || d).querySelector(s);
  const $$ = (s, el) => Array.prototype.slice.call((el || d).querySelectorAll(s));
  const ESC = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
  const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ESC[c]);
  const ico = n => '<svg class="ico ico--' + n + '" viewBox="0 0 24 24" aria-hidden="true" focusable="false">' + CFG.icons[n] + '</svg>';
  const mq = q => !!(window.matchMedia && matchMedia(q).matches);
  const reduce = mq('(prefers-reduced-motion: reduce)');
  const fine = mq('(hover: hover) and (pointer: fine)');
  const G = window.gsap, ST = window.ScrollTrigger, SPLIT = window.SplitText;
  const motion = !!(G && ST) && !reduce;
  const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
  const easeIO = t => (t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
  const back = t => { const c = 1.9; return 1 + (c + 1) * Math.pow(t - 1, 3) + c * Math.pow(t - 1, 2); };
  const seeded = a => () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
  const fontsReady = (d.fonts && d.fonts.ready) ? d.fonts.ready.catch(() => {}) : Promise.resolve();
  const scrollToY = y => { if (window.BAM && window.BAM.scrollToY) window.BAM.scrollToY(y); else window.scrollTo(0, y); };

  if (motion) {
    G.registerPlugin(ST); if (SPLIT) G.registerPlugin(SPLIT);
    html.classList.add('has-motion');
    ST.config({ ignoreMobileResize: true });
  }

  /* ---------- smooth scrolling, for a mouse or trackpad only (phones keep their own) ---------- */
  let lenis = null;
  if (motion && fine && window.Lenis) {
    const own = n => n.classList && (n.classList.contains('sheet') || n.classList.contains('drawer') || n.classList.contains('palette') || n.classList.contains('lightbox') || n.classList.contains('menu') || n.classList.contains('chips') || n.classList.contains('more') || n.hasAttribute('data-lenis-prevent'));
    lenis = new window.Lenis({ lerp: .1, smoothWheel: true, syncTouch: false, autoRaf: false, allowNestedScroll: true, prevent: own });
    lenis.on('scroll', ST.update);
    G.ticker.add(t => lenis.raf(t * 1000));
    G.ticker.lagSmoothing(0);
    window.__lenis = lenis;
    let stopped = false;
    const sync = () => { const s = html.classList.contains('is-locked') || html.classList.contains('is-intro'); if (s !== stopped) { stopped = s; if (s) lenis.stop(); else lenis.start(); } };
    new MutationObserver(sync).observe(html, { attributes: true, attributeFilter: ['class'] });
  }

  /* links to a part of this same page glide there */
  let explore = null;
  d.addEventListener('click', e => {
    if (e.defaultPrevented || e.button || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    const a = e.target.closest && e.target.closest('a[href*="#"]');
    if (!a) return;
    const u = new URL(a.href, location.href);
    if (u.origin !== location.origin || u.pathname !== location.pathname || u.search !== location.search) return;
    const id = decodeURIComponent(u.hash.slice(1));
    if (!id || id.indexOf('=') >= 0) return;
    if (a.hasAttribute('data-explore') && explore) { e.preventDefault(); scrollToY(explore()); return; }
    const el = d.getElementById(id);
    if (!el) return;
    e.preventDefault();
    const rbar = $('#rbar');
    const off = id === 'products' && rbar ? rbar.offsetHeight : 0;
    scrollToY(id === 'top' ? 0 : el.getBoundingClientRect().top + window.scrollY - off);
    try { history.replaceState(history.state, '', '#' + id); } catch (err) {}
  });

  /* ---------- the progress of the page, as a tape measure in the top bar ---------- */
  const tape = $('#tapeFill');
  if (tape) {
    if (motion) { const set = G.quickSetter(tape, 'scaleX'); ST.create({ start: 0, end: 'max', onUpdate: s => set(s.progress) }); }
    else {
      const upd = () => { const m = d.documentElement.scrollHeight - innerHeight; tape.style.transform = 'scaleX(' + (m > 0 ? clamp(window.scrollY / m, 0, 1) : 0) + ')'; };
      addEventListener('scroll', upd, { passive: true }); upd();
    }
  }

  /* ---------- a label that follows the pointer over things you can open, and buttons that lean to it ---------- */
  if (motion && fine) {
    html.classList.add('has-cursor');
    const cur = $('#cursor'), lab = cur && $('span', cur);
    if (cur) {
      const qx = G.quickTo(cur, 'x', { duration: .35, ease: 'power3' }), qy = G.quickTo(cur, 'y', { duration: .35, ease: 'power3' });
      d.addEventListener('mousemove', e => { qx(e.clientX); qy(e.clientY); }, { passive: true });
      d.addEventListener('mouseover', e => {
        const t = e.target.closest && e.target.closest('[data-cursor]');
        if (t) { lab.textContent = t.getAttribute('data-cursor'); cur.classList.add('on'); } else cur.classList.remove('on');
      });
      d.documentElement.addEventListener('mouseleave', () => cur.classList.remove('on'));
      d.addEventListener('mousedown', () => cur.classList.remove('on'));
    }
    $$('.btn--signal, .tool--list').forEach(b => {
      b.classList.add('is-mag');
      const qx = G.quickTo(b, 'x', { duration: .7, ease: 'elastic.out(1, .45)' }), qy = G.quickTo(b, 'y', { duration: .7, ease: 'elastic.out(1, .45)' });
      b.addEventListener('mousemove', e => { const r = b.getBoundingClientRect(); qx((e.clientX - r.left - r.width / 2) * .22); qy((e.clientY - r.top - r.height / 2) * .35); });
      b.addEventListener('mouseleave', () => { qx(0); qy(0); });
    });
  }

  /* clicking a range's name carries the name over to the range's own page (where the browser can) */
  d.addEventListener('click', e => {
    if (e.defaultPrevented || e.button || e.metaKey || e.ctrlKey || e.shiftKey) return;
    const a = e.target.closest && e.target.closest('a[data-rname], a.blk, a.rnext__a');
    if (!a) return;
    $$('[data-vt]').forEach(el => { el.style.viewTransitionName = ''; el.removeAttribute('data-vt'); });
    const el = a.querySelector('.idx__name, .blk__l > span, .rnext__name');
    if (el) { el.style.viewTransitionName = 'rname'; el.setAttribute('data-vt', ''); }
  });
  addEventListener('pageshow', () => $$('[data-vt]').forEach(el => { el.style.viewTransitionName = ''; el.removeAttribute('data-vt'); }));

  /* ---------- big headings rise line by line ---------- */
  function headings() {
    $$('[data-split]').forEach(el => {
      const go = targets => G.from(targets, { yPercent: 108, autoAlpha: SPLIT ? 1 : 0, duration: 1.15, stagger: .09, ease: 'expo.out', scrollTrigger: { trigger: el, start: 'top 86%', once: true }, onComplete: () => { el._done = true; } });
      if (!SPLIT) { go([el]); return; }
      SPLIT.create(el, { type: 'lines', mask: 'lines', autoSplit: true, onSplit: self => (el._done ? null : go(self.lines)) });
    });
    $$('.sec__head').forEach(h => {
      const bits = $$(':scope > :not(h2)', h);
      if (bits.length) G.from(bits, { y: 26, autoAlpha: 0, duration: 1, stagger: .08, ease: 'power3.out', scrollTrigger: { trigger: h, start: 'top 84%', once: true } });
    });
  }

  /* ---------- the opening: the number of products counts up on flaps, once per visit ---------- */
  function intro(ready) {
    return new Promise(done => {
      const n = parseInt((($('.strip .num') || {}).textContent || '').replace(/\D/g, ''), 10) || 597;
      const digits = String(n).length;
      const brand = (($('.brand__word') || {}).firstChild || {}).textContent || T.brand;
      const el = d.createElement('div');
      el.className = 'intro'; el.setAttribute('aria-hidden', 'true');
      el.innerHTML = '<div class="intro__in"><span class="intro__mark"></span><span class="intro__num" dir="ltr">' + '<span class="f">0</span>'.repeat(digits) +
        '</span><span class="intro__lbl">' + esc(brand.trim()) + '</span></div><i class="intro__bar"></i><button class="intro__skip" type="button">' + esc(T.skip_intro) + '</button>';
      d.body.appendChild(el);
      html.classList.add('is-intro');
      const cells = $$('.f', el), bar = $('.intro__bar', el);
      const show = v => {
        const s = String(v).padStart(digits, '0');
        cells.forEach((c, i) => { if (c.textContent !== s[i]) { c.textContent = s[i]; c.classList.remove('go'); void c.offsetWidth; c.classList.add('go'); } });
      };
      let loaded = false, finished = false;
      const c = { v: 0 };
      const tw = G.to(c, { v: n, duration: 1.45, ease: 'power2.inOut', onUpdate: () => { show(Math.round(c.v)); bar.style.transform = 'scaleX(' + (c.v / n * (loaded ? 1 : .9)) + ')'; } });
      const finish = () => {
        if (finished) return; finished = true;
        tw.progress(1); show(n); bar.style.transform = 'scaleX(1)';
        d.removeEventListener('keydown', finish);
        setTimeout(() => { el.classList.add('out'); html.classList.remove('is-intro'); done(); setTimeout(() => el.remove(), 1150); }, 220);
      };
      const wait = new Promise(r => setTimeout(r, 2600));
      Promise.race([ready.then(() => { loaded = true; }, () => {}), wait]).then(() => new Promise(r => (tw.progress() >= 1 ? r() : tw.eventCallback('onComplete', r)))).then(finish);
      $('.intro__skip', el).addEventListener('click', finish);
      d.addEventListener('keydown', finish);
    });
  }
  const seenIntro = () => { try { if (sessionStorage.getItem('bam-intro')) return true; sessionStorage.setItem('bam-intro', '1'); return false; } catch (e) { return true; } };

  /* ---------- the wall: every product, then sorted into its ranges as you scroll ---------- */
  function Wall(stage, animated) {
    const canvas = $('#wall'), ctx = canvas.getContext('2d'), map = $('#map'), tip = $('#tip'), sorted = $('#heroSorted');
    const st = { intro: animated ? 0 : 1, sort: animated ? 0 : 1, labels: animated ? 0 : 1 };
    let data = null, img = null, tiles = [], blocks = [], blkEls = [], W = 0, H = 0, dpr = 1, dirty = true, C = {};
    let cols = 1, rows = 1, cw = 1, ch = 1, cellTile = [];
    let mx = -1e4, my = -1e4, over = false, hov = -1, hb = -1;
    const pm = { x: 0, y: 0 }, pmT = { x: 0, y: 0 };

    const colors = () => {
      const cs = getComputedStyle(html), v = n => cs.getPropertyValue(n).trim();
      C = { paper: v('--paper'), paper2: v('--paper-2'), panel: v('--panel'), plate: v('--plate'), ink: v('--ink'), line: v('--line-2'), line3: v('--line-3'), signal: v('--signal'), dark: html.getAttribute('data-theme') === 'dark' };
      dirty = true;
    };

    const ready = fetch(CFG.wall).then(r => { if (!r.ok) throw new Error(r.status); return r.json(); }).then(j => {
      data = j;
      return new Promise((ok, bad) => { img = new Image(); img.decoding = 'async'; img.onload = ok; img.onerror = bad; img.src = ROOT + j.src; });
    }).then(() => {
      const acols = data.cols, cell = data.cell, rnd = seeded(11);
      const byRange = {};
      tiles = data.t.map((t, j) => {
        const k = (byRange[t[0]] = (byRange[t[0]] || 0) + 1) - 1;
        return { r: t[0], k: k, slug: t[1], en: t[2], ar: t[3], pn: t[4], has: !!t[5], ax: (j % acols) * cell, ay: Math.floor(j / acols) * cell,
                 z: .25 + rnd() * .75, amp: (rnd() - .5) * 2 * (50 + rnd() * 150), rot: (rnd() - .5) * 1.3, jit: rnd(), h: 1, px: 0, py: 0, d: 0 };
      });
      colors(); layout(); buildMap(); place();
    });

    function layout() {
      W = canvas.clientWidth; H = canvas.clientHeight;
      if (!W || !H || !tiles.length) return;
      dpr = Math.min(2, window.devicePixelRatio || 1);
      canvas.width = Math.round(W * dpr); canvas.height = Math.round(H * dpr);
      // scattered: an even grid over the whole screen, every product in a random cell
      const N = tiles.length, s0 = Math.sqrt(W * H / N);
      cols = Math.max(4, Math.round(W / s0)); rows = Math.ceil(N / cols);
      cw = W / cols; ch = H / rows;
      const size = Math.min(cw, ch) * .84, cells = [], rnd = seeded(23);
      for (let i = 0; i < cols * rows; i++) cells.push(i);
      for (let i = cells.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); const x = cells[i]; cells[i] = cells[j]; cells[j] = x; }
      cellTile = new Array(cols * rows).fill(-1);
      const ox = AR ? W : 0, maxD = Math.hypot(W, H);
      tiles.forEach((t, i) => {
        const c = cells[i]; cellTile[c] = i;
        t.sx = (c % cols + .5) * cw; t.sy = (Math.floor(c / cols) + .5) * ch; t.ss = size;
        t.d = Math.hypot(t.sx - ox, t.sy) / maxD * .8 + t.jit * .2;
      });
      treemap();
    }

    // sorted: a block for each range, sized by how many products it has, the products packed inside
    function treemap() {
      const sr = stage.getBoundingClientRect(), cr = canvas.getBoundingClientRect();
      const ref = sorted.getBoundingClientRect(), cs = getComputedStyle(sorted);
      let x0 = ref.left - cr.left + parseFloat(cs.paddingLeft), x1 = ref.right - cr.left - parseFloat(cs.paddingRight);
      if (!(x1 - x0 > 100)) { x0 = 16; x1 = W - 16; }
      const top = animated ? Math.round(sorted.offsetHeight + 6) : 8, bottom = H - (W < 760 ? 14 : 26);
      const items = data.r.map((r, i) => ({ i: i, v: Math.pow(Math.max(1, r[3]), .65) })).sort((a, b) => b.v - a.v);
      const area = (x1 - x0) * (bottom - top), sum = items.reduce((a, b) => a + b.v, 0);
      items.forEach(it => { it.v = it.v / sum * area; });
      const rects = squarify(items, x0, top, x1 - x0, bottom - top);
      const rank = {}; items.forEach((it, n) => { rank[it.i] = n; });
      blocks = rects.map(b => {
        const g = 3, x = AR ? x0 + x1 - b.x - b.w : b.x;
        const o = { i: b.i, x: x + g, y: b.y + g, w: b.w - 2 * g, h: b.h - 2 * g, rank: rank[b.i], dim: 0 };
        o.cls = (o.w < 150 || o.h < 90) ? 's' : (o.w > 340 && o.h > 220 ? 'l' : 'm');
        return o;
      });
      const byI = {}; blocks.forEach(b => { byI[b.i] = b; });
      const counts = data.r.map(r => r[3]);
      tiles.forEach(t => {
        const b = byI[t.r], n = counts[t.r];
        if (!b._s) {
          const small = W < 760, lh = b.cls === 's' ? (b.h > 64 ? (small ? 17 : 20) : 0) : (b.cls === 'm' ? (small ? 22 : 30) : (small ? 32 : 44)), pad = b.cls === 's' ? 4 : 8;
          let ix = b.x + pad, iy = b.y + lh + pad, iw = b.w - 2 * pad, ih = b.h - lh - 2 * pad;
          if (ih < 10) { iy = b.y + pad; ih = b.h - 2 * pad; }
          let s = Math.min(110, Math.sqrt(iw * ih / n)), c = 1, r = 1;
          for (let k = 0; k < 80; k++) { c = Math.max(1, Math.floor(iw / s)); r = Math.ceil(n / c); if (r * s <= ih && c * s <= iw) break; s *= .965; }
          c = Math.min(c, n);
          b._s = s; b._c = c; b._ox = ix + (iw - c * s) / 2; b._oy = iy + (ih - r * s) / 2;
        }
        const col = t.k % b._c, row = Math.floor(t.k / b._c), cc = AR ? b._c - 1 - col : col;
        t.tx = b._ox + (cc + .5) * b._s; t.ty = b._oy + (row + .5) * b._s; t.ts = b._s * .88;
        t.dl = b.rank / 18 * .4 + t.jit * .12;
      });
      blocks.forEach(b => { delete b._s; });
      dirty = true;
    }

    function squarify(items, x, y, w, h) {
      const out = []; let rest = items.slice();
      const worst = (row, s) => { let sum = 0, mx = 0, mn = Infinity; row.forEach(r => { sum += r.v; mx = Math.max(mx, r.v); mn = Math.min(mn, r.v); }); return Math.max(s * s * mx / (sum * sum), sum * sum / (s * s * mn)); };
      while (rest.length) {
        const s = Math.min(w, h);
        let row = [rest[0]], best = worst(row, s), k = 1;
        while (k < rest.length) { const next = row.concat(rest[k]), ws = worst(next, s); if (ws > best) break; row = next; best = ws; k++; }
        const sum = row.reduce((a, b) => a + b.v, 0);
        if (w >= h) { const cw2 = sum / h; let yy = y; row.forEach(r => { const rh = r.v / cw2; out.push({ i: r.i, x: x, y: yy, w: cw2, h: rh }); yy += rh; }); x += cw2; w -= cw2; }
        else { const rh = sum / w; let xx = x; row.forEach(r => { const rw = r.v / rh; out.push({ i: r.i, x: xx, y: y, w: rw, h: rh }); xx += rw; }); y += rh; h -= rh; }
        rest = rest.slice(row.length);
      }
      return out;
    }

    function buildMap() {
      map.innerHTML = '';
      blkEls = blocks.map((b, k) => {
        const r = data.r[b.i], name = AR ? (r[2] || r[1]) : r[1];
        const a = d.createElement('a');
        a.href = HOME + 'range/' + r[0] + '/';
        a.setAttribute('aria-label', name + ' · ' + (r[3] === 1 ? T.one_product : String(T.n_products).replace('{n}', r[3])));
        a.innerHTML = '<span class="blk__l"><span>' + esc(name) + '</span><b>' + r[3] + '</b></span><span class="blk__go">' + ico('arrow') + '</span>';
        const on = () => { hb = k; dirty = true; }, off = () => { if (hb === k) { hb = -1; dirty = true; } };
        a.addEventListener('mouseenter', on); a.addEventListener('mouseleave', off);
        a.addEventListener('focus', on); a.addEventListener('blur', off);
        map.appendChild(a);
        return a;
      });
    }
    function place() {
      blocks.forEach((b, k) => {
        const a = blkEls[k]; if (!a) return;
        a.className = 'blk blk--' + b.cls + (b.w < 84 ? ' blk--xs' : '');
        a.style.left = b.x + 'px'; a.style.top = b.y + 'px'; a.style.width = b.w + 'px'; a.style.height = b.h + 'px';
      });
      labels();
    }
    // the range names come in one after another as the blocks settle
    function labels() {
      const n = blkEls.length;
      blkEls.forEach((a, k) => {
        const v = clamp(st.labels * 1.6 - (blocks[k].rank / n) * .6, 0, 1);
        a.style.opacity = v; a.style.visibility = v > 0 ? 'visible' : 'hidden'; a.style.transform = v < 1 ? 'translateY(' + ((1 - v) * 14).toFixed(1) + 'px)' : '';
      });
      map.classList.toggle('is-live', st.labels > .97);
    }

    function hover() {
      // the pointer: the wall leans a little with it, and the products near it grow
      pm.x += (pmT.x - pm.x) * .07; pm.y += (pmT.y - pm.y) * .07;
      let busy = Math.abs(pmT.x - pm.x) > .001 || Math.abs(pmT.y - pm.y) > .001;
      const R = Math.max(120, Math.min(W, H) * .18), live = over && st.sort < .02 && st.intro >= 1;
      for (let i = 0; i < tiles.length; i++) {
        const t = tiles[i];
        let h = 1, px = 0, py = 0;
        if (live) {
          const dx = t.sx - mx, dy = t.sy - my, dd = Math.hypot(dx, dy);
          if (dd < R) { const f = 1 - dd / R, f2 = f * f; h = 1 + 1.3 * f2 + (i === hov ? .5 : 0); const push = f2 * 18 / (dd || 1); px = dx * push; py = dy * push; }
        }
        if (Math.abs(t.h - h) > .002 || Math.abs(t.px - px) > .05 || Math.abs(t.py - py) > .05) {
          t.h += (h - t.h) * .2; t.px += (px - t.px) * .2; t.py += (py - t.py) * .2; busy = true;
        }
      }
      blocks.forEach((b, k) => { const want = hb >= 0 && k !== hb ? .55 : 0; if (Math.abs(b.dim - want) > .005) { b.dim += (want - b.dim) * .18; busy = true; } });
      return busy;
    }

    const X = [], Y = [], S = [], Rr = [], A = [], big = [];
    function draw() {
      if (!W || !H) return;
      const P = st.sort, ip = st.intro, q = clamp((P - .5) / .4, 0, 1), par = 1 - clamp(P * 3, 0, 1), sh = 14 * par;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.globalCompositeOperation = 'source-over'; ctx.globalAlpha = 1;
      ctx.fillStyle = C.paper; ctx.fillRect(0, 0, W, H);
      if (q > 0) { ctx.globalAlpha = q; ctx.fillStyle = C.paper2; blocks.forEach(b => ctx.fillRect(b.x, b.y, b.w, b.h)); ctx.globalAlpha = 1; }
      big.length = 0;
      for (let i = 0; i < tiles.length; i++) {
        const t = tiles[i];
        let a = 1, sc = 1;
        if (ip < 1) { const k = clamp((ip * 1.6 - t.d) / .6, 0, 1); if (k <= 0) { A[i] = 0; continue; } sc = back(k); a = Math.min(1, k * 2.5); }
        let x = t.sx + pm.x * sh * t.z + t.px * par, y = t.sy + pm.y * sh * t.z + t.py * par, s = t.ss * (par > 0 ? 1 + (t.h - 1) * par : 1), r = 0;
        if (P > 0) {
          const k = easeIO(clamp((P - t.dl) / .48, 0, 1));
          if (k > 0) {
            const dx = t.tx - x, dy = t.ty - y, len = Math.hypot(dx, dy) || 1, arc = Math.sin(Math.PI * k) * t.amp;
            x += dx * k - dy / len * arc; y += dy * k + dx / len * arc; s += (t.ts - s) * k; r = Math.sin(Math.PI * k) * t.rot;
          }
        }
        X[i] = x; Y[i] = y; S[i] = s * sc; Rr[i] = r; A[i] = a;
        if (t.h > 1.04 && par > 0) big.push(i);
      }
      const tile = (i, plate) => {
        const t = tiles[i], s = S[i], h = s / 2;
        if (Rr[i]) { ctx.save(); ctx.translate(X[i], Y[i]); ctx.rotate(Rr[i]); }
        const x = Rr[i] ? -h : X[i] - h, y = Rr[i] ? -h : Y[i] - h;
        if (plate) { ctx.globalCompositeOperation = 'source-over'; ctx.fillStyle = plate; ctx.fillRect(x, y, s, s); }
        if (t.has) { ctx.globalCompositeOperation = 'multiply'; ctx.drawImage(img, t.ax, t.ay, data.cell, data.cell, x, y, s, s); }
        else box(x, y, s);
        if (Rr[i]) ctx.restore();
      };
      // a product with no photo yet: a small line drawing of a box
      const box = (x, y, s) => {
        const c = x + s / 2, m = y + s / 2, r = s * .26;
        ctx.globalCompositeOperation = 'source-over'; ctx.strokeStyle = C.dark ? '#9a9ea6' : C.line3; ctx.lineWidth = Math.max(1, s / 40);
        ctx.beginPath();
        ctx.moveTo(c, m - r); ctx.lineTo(c + r, m - r / 2); ctx.lineTo(c + r, m + r / 2); ctx.lineTo(c, m + r); ctx.lineTo(c - r, m + r / 2); ctx.lineTo(c - r, m - r / 2); ctx.closePath();
        ctx.moveTo(c - r, m - r / 2); ctx.lineTo(c, m); ctx.lineTo(c + r, m - r / 2); ctx.moveTo(c, m); ctx.lineTo(c, m + r);
        ctx.stroke();
      };
      const bigSet = big.length ? new Set(big) : null;
      if (C.dark) {
        ctx.fillStyle = C.plate;
        for (let i = 0; i < tiles.length; i++) {
          if (!A[i] || (bigSet && bigSet.has(i))) continue;
          ctx.globalAlpha = A[i]; const s = S[i], h = s / 2;
          if (Rr[i]) { ctx.save(); ctx.translate(X[i], Y[i]); ctx.rotate(Rr[i]); ctx.fillRect(-h, -h, s, s); ctx.restore(); } else ctx.fillRect(X[i] - h, Y[i] - h, s, s);
        }
      }
      for (let i = 0; i < tiles.length; i++) {
        if (!A[i] || (bigSet && bigSet.has(i))) continue;
        ctx.globalAlpha = A[i]; tile(i, null);
      }
      ctx.globalAlpha = 1;
      if (big.length) {
        big.sort((a, b) => tiles[a].h - tiles[b].h);
        big.forEach(i => {
          tile(i, C.dark ? C.plate : C.panel);
          if (i === hov) {
            const s = S[i], x = X[i] - s / 2, y = Y[i] - s / 2;
            ctx.globalCompositeOperation = 'source-over'; ctx.strokeStyle = C.ink; ctx.lineWidth = 1.5; ctx.strokeRect(x, y, s, s);
            ctx.fillStyle = C.signal; ctx.fillRect(AR ? x + s - 14 : x, y - 3, 14, 3);
          }
        });
      }
      ctx.globalCompositeOperation = 'source-over';
      if (q > 0) {
        blocks.forEach(b => {
          if (b.dim > .01) { ctx.globalAlpha = b.dim; ctx.fillStyle = C.paper; ctx.fillRect(b.x, b.y, b.w, b.h); }
          ctx.globalAlpha = q; ctx.strokeStyle = C.line3; ctx.lineWidth = 1; ctx.strokeRect(b.x + .5, b.y + .5, b.w - 1, b.h - 1);
        });
        ctx.globalAlpha = 1;
      }
    }

    let seen = true;
    if ('IntersectionObserver' in window) new IntersectionObserver(es => { seen = es[es.length - 1].isIntersecting; if (seen) dirty = true; }).observe(stage);
    function frame() {
      if (!img || !W || !seen) return;
      const busy = (animated && fine) ? hover() : false;
      if (dirty || busy) { dirty = false; draw(); }
    }

    // the pointer over the wall: which product it is on, its name next to it, and a click opens it
    const pick = (cx, cy) => {
      const r = canvas.getBoundingClientRect(), x = cx - r.left - pm.x * 14 * .6, y = cy - r.top - pm.y * 14 * .6;
      const c = Math.floor(x / cw), rr = Math.floor(y / ch);
      if (c < 0 || rr < 0 || c >= cols || rr >= rows) return -1;
      return cellTile[rr * cols + c];
    };
    const hideTip = () => { tip.classList.remove('on'); hov = -1; canvas.style.cursor = ''; };
    const url = i => { const t = tiles[i]; return HOME + 'range/' + data.r[t.r][0] + '/#p=' + t.slug; };
    if (animated) {
      stage.addEventListener('pointermove', e => {
        if (e.pointerType !== 'mouse' || !data) return;
        const r = canvas.getBoundingClientRect();
        mx = e.clientX - r.left; my = e.clientY - r.top;
        pmT.x = mx / W * 2 - 1; pmT.y = my / H * 2 - 1;
        over = e.target === canvas;
        const k = over && st.sort < .02 && st.intro >= 1 ? pick(e.clientX, e.clientY) : -1;
        if (k >= 0) {
          const t = tiles[k];
          hov = k; canvas.style.cursor = 'pointer';
          tip.firstChild.textContent = AR ? (t.ar || t.en) : t.en;
          tip.lastChild.textContent = t.pn || (AR ? data.r[t.r][2] : data.r[t.r][1]);
          tip.lastChild.setAttribute('dir', 'ltr');
          const tw = tip.offsetWidth, th = tip.offsetHeight;
          let tx = e.clientX + 18, ty = e.clientY + 18;
          if (tx + tw > innerWidth - 10) tx = e.clientX - tw - 14;
          if (ty + th > innerHeight - 10) ty = e.clientY - th - 14;
          tip.style.transform = 'translate3d(' + tx + 'px,' + ty + 'px,0)';
          tip.classList.add('on');
        } else hideTip();
        dirty = true;
      });
      stage.addEventListener('pointerleave', () => { over = false; pmT.x = 0; pmT.y = 0; hideTip(); dirty = true; });
    }
    canvas.addEventListener('click', e => { if (!data || st.sort > .05) return; const k = pick(e.clientX, e.clientY); if (k >= 0) location.href = url(k); });

    d.addEventListener('bam:theme', colors);
    let lw = 0, lh = 0, rt = 0;
    const resize = () => {
      clearTimeout(rt);
      rt = setTimeout(() => {
        const w = canvas.clientWidth, h = canvas.clientHeight;
        if (w === lw && Math.abs(h - lh) < 2) return;
        lw = w; lh = h; layout(); place();
      }, 120);
    };
    addEventListener('resize', resize);
    fontsReady.then(() => { if (tiles.length) { layout(); place(); } });

    return { st: st, ready: ready, frame: frame, labels: labels, hideTip: hideTip, dirty: () => { dirty = true; } };
  }

  function home() {
    const stage = $('#heroStage');
    if (!stage) return;
    const hero = stage.parentNode;
    if (!motion) {
      // no movement: the words, then the ranges as a map
      hero.classList.add('is-static');
      const w = Wall(stage, false);
      const loop = () => { w.frame(); };
      w.ready.then(() => { loop(); d.addEventListener('bam:theme', () => requestAnimationFrame(loop)); addEventListener('resize', () => setTimeout(loop, 200)); }).catch(() => {});
      return;
    }
    const w = Wall(stage, true), st = w.st;
    G.ticker.add(w.frame);
    const strips = $$('.strip', stage), ins = $$('.strip__in', stage), panel = $('.hero__panel', stage), eyebrow = $('.hero__eyebrow', stage);
    const veil = $('.hero__veil', stage), cue = $('#heroCue'), sorted = $('#heroSorted'), map = $('#map');
    const tl = G.timeline({
      defaults: { ease: 'none' },
      scrollTrigger: {
        trigger: stage, start: 'top top', end: () => '+=' + Math.round(stage.offsetHeight * 1.8), pin: true, scrub: .9, invalidateOnRefresh: true, refreshPriority: 2,
        onUpdate: s => { w.dirty(); if (s.progress > .01) w.hideTip(); }
      },
      onUpdate: () => { w.labels(); w.dirty(); }
    });
    tl.to(cue, { autoAlpha: 0, duration: .04 }, 0)
      .to(strips, { xPercent: AR ? 118 : -118, duration: .16, stagger: .025, ease: 'power2.in' }, 0)
      .to([eyebrow, panel], { y: 50, autoAlpha: 0, duration: .12, stagger: .02, ease: 'power2.in' }, .02)
      .to(veil, { autoAlpha: 0, duration: .2 }, 0)
      .to(st, { sort: 1, duration: .72 }, .08)
      .fromTo(sorted, { autoAlpha: 0, y: 40 }, { autoAlpha: 1, y: 0, duration: .12, ease: 'power2.out' }, .62)
      .to(st, { labels: 1, duration: .2 }, .74)
      .to({}, { duration: .12 });
    explore = () => { const s = tl.scrollTrigger; return s.start + (s.end - s.start) * .985; };
    // the opening, then the wall builds itself and the words slide in
    const opening = (!location.hash && window.scrollY < 40 && !seenIntro()) ? intro(w.ready) : Promise.resolve();
    opening.then(() => {
      G.from(ins, { xPercent: AR ? 101 : -101, duration: 1.15, stagger: .09, ease: 'expo.out', delay: .05 });
      G.fromTo(eyebrow, { clipPath: AR ? 'inset(0 0 0 100%)' : 'inset(0 100% 0 0)' }, { clipPath: 'inset(0 0% 0 0%)', duration: 1, ease: 'expo.inOut', delay: .2 });
      G.fromTo(panel, { clipPath: 'inset(0 0 100% 0)' }, { clipPath: 'inset(0 0 0% 0)', duration: 1.1, ease: 'expo.inOut', delay: .4 });
      G.from(cue, { opacity: 0, duration: .8, delay: 1.3 });
      w.ready.then(() => G.to(st, { intro: 1, duration: 1.9, ease: 'none', onUpdate: w.dirty })).catch(() => {});
    });
    w.ready.catch(() => { st.intro = 1; });
  }

  /* ---------- the list of ranges: a picture of the range follows the pointer ---------- */
  function peek() {
    const pk = $('#peek'); if (!pk || !fine) return;
    const pi = $('img', pk);
    const qx = G.quickTo(pk, 'x', { duration: .55, ease: 'power3' }), qy = G.quickTo(pk, 'y', { duration: .55, ease: 'power3' });
    $$('[data-peek]').forEach(a => {
      a.addEventListener('mouseenter', () => { if (pi.getAttribute('src') !== a.dataset.peek) pi.src = a.dataset.peek; pk.classList.add('on'); });
      a.addEventListener('mouseleave', () => pk.classList.remove('on'));
    });
    d.addEventListener('mousemove', e => { qx(e.clientX + (AR ? -340 : 40)); qy(e.clientY - 112); }, { passive: true });
  }

  /* ---------- a featured range: its name slides past in outline and fills in, its products float up ---------- */
  function featured() {
    $$('[data-feat]').forEach(sec => {
      const word = $('.feat__word span', sec), cuts = $$('.cut', sec), card = $('.feat__card', sec);
      if (!word) return;
      const fill = word.cloneNode(true); fill.classList.add('is-fill'); word.parentNode.appendChild(fill);
      const from = () => innerWidth * .22, to = () => Math.min(-innerWidth * .18, innerWidth * .92 - word.offsetWidth);
      const tl = G.timeline({ defaults: { ease: 'none' }, scrollTrigger: { trigger: sec, start: 'top bottom', end: 'bottom bottom', scrub: .6, invalidateOnRefresh: true } });
      tl.fromTo([word, fill], { x: from }, { x: to, duration: 1 }, 0)
        .fromTo(fill, { clipPath: 'inset(0% 100% 0% 0%)' }, { clipPath: 'inset(0% 0% 0% 0%)', duration: .6 }, .3);
      cuts.forEach((c, i) => tl.fromTo(c, { y: () => innerHeight * (.3 + (i % 3) * .14), rotation: i % 2 ? -9 : 9 }, { y: () => -innerHeight * (.1 + (i % 3) * .09), rotation: i % 2 ? 5 : -5, duration: 1 }, 0));
      if (card) G.from(card, { y: 90, autoAlpha: 0, duration: 1.2, ease: 'expo.out', scrollTrigger: { trigger: sec, start: 'top 35%', once: true } });
    });
  }

  /* ---------- the parts board: rows flip over to other products every few seconds ---------- */
  const GLYPHS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789-/.';
  function scramble(el, to, dur) {
    const from = el.textContent, len = Math.max(from.length, to.length), t0 = performance.now();
    dur = dur || 650;
    const step = now => {
      const p = Math.min(1, (now - t0) / dur);
      let out = '';
      for (let i = 0; i < len; i++) {
        const at = i / len * .55;
        if (p >= at + .45) out += to[i] || '';
        else if (p >= at) out += (to[i] === ' ' || to[i] === undefined && from[i] === undefined) ? ' ' : GLYPHS[(Math.random() * GLYPHS.length) | 0];
        else out += from[i] || '';
      }
      el.textContent = p < 1 ? out : to;
      if (p < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }
  function flip(cell, el, to) { cell.classList.remove('is-swap'); void cell.offsetWidth; cell.classList.add('is-swap'); setTimeout(() => { el.textContent = to; }, 240); }
  function board(wallData) {
    const bd = $('#board'), rows = $$('#boardRows .board__row'), clk = $('#boardClock');
    if (!bd) return;
    let fmt = null;
    try { fmt = new Intl.DateTimeFormat('en-GB', { timeZone: 'Asia/Dubai', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false }); } catch (e) {}
    const tick = () => { if (clk) clk.textContent = (AR ? 'عجمان ' : 'AJMAN ') + (fmt ? fmt.format(new Date()) : new Date().toTimeString().slice(0, 8)); };
    tick();
    let clock = 0, timer = 0, k = 0;
    const B = wallData && wallData.b, R = wallData && wallData.r;
    const turn = () => {
      if (!B || !rows.length) return;
      const row = rows[k % rows.length], it = B[(rows.length + k) % B.length]; k++;
      const rg = R[it[5]], cells = $$('.c', row);
      row.href = HOME + 'range/' + rg[0] + '/#p=' + it[6];
      const texts = [it[0], AR ? (it[2] || it[1]) : it[1], AR ? it[4] : it[3], AR ? (rg[2] || rg[1]) : rg[1]];
      cells.forEach((c, i) => {
        const el = $('bdi', c) || c;
        setTimeout(() => { if (!AR || i === 0) scramble(el, String(texts[i]), 520 + i * 90); else flip(c, el, texts[i]); }, i * 90);
      });
    };
    const start = () => { if (!clock) clock = setInterval(tick, 1000); if (motion && !timer) timer = setInterval(turn, 2300); };
    const stop = () => { clearInterval(clock); clearInterval(timer); clock = timer = 0; };
    if (motion) {
      ST.create({ trigger: bd, start: 'top bottom', end: 'bottom top', onToggle: s => (s.isActive ? start() : stop()) });
      G.from(rows, { rotateX: -90, autoAlpha: 0, transformOrigin: '50% 0%', transformPerspective: 700, duration: .8, stagger: .08, ease: 'back.out(1.7)', scrollTrigger: { trigger: bd, start: 'top 80%', once: true } });
    } else if ('IntersectionObserver' in window) {
      new IntersectionObserver(es => es.forEach(e => (e.isIntersecting ? start() : stop()))).observe(bd);
    }
  }

  /* ---------- prices on request: the list fills in, gets sent and stamped ---------- */
  function request() {
    const sec = $('#prices'); if (!sec) return;
    const stage = $('.req__stage', sec), doc = $('#reqDoc'), lines = $$('.doc__l:not(.doc__l--blank)', doc), stamp = $('.doc__stamp', doc), steps = $$('#reqSteps .step');
    const dx = AR ? 34 : -34;
    if (mq('(min-width: 900px) and (min-height: 640px)')) {
      sec.classList.add('is-scrub');
      const setStep = p => steps.forEach((s, i) => s.classList.toggle('is-on', i === (p < .42 ? 0 : p < .76 ? 1 : 2)));
      setStep(0);
      const tl = G.timeline({ defaults: { ease: 'none' }, scrollTrigger: { trigger: stage, start: 'top top', end: () => '+=' + Math.round(innerHeight * 1.3), pin: true, scrub: .7, refreshPriority: 1, invalidateOnRefresh: true, onUpdate: s => setStep(s.progress) } });
      tl.fromTo(doc, { rotation: -6, y: 70 }, { rotation: -1.6, y: 0, duration: .3, ease: 'power2.out' }, 0)
        .fromTo(lines, { autoAlpha: 0, x: dx }, { autoAlpha: 1, x: 0, duration: .1, stagger: .12, ease: 'power2.out' }, .06)
        .fromTo(stamp, { autoAlpha: 0, scale: 2.8, rotation: -40 }, { autoAlpha: .92, scale: 1, rotation: -14, duration: .06, ease: 'power4.in' }, .74)
        .to(doc, { keyframes: { x: [0, -7, 5, -3, 0] }, duration: .06 }, .8)
        .to({}, { duration: .14 });
    } else {
      const tl = G.timeline({ scrollTrigger: { trigger: doc, start: 'top 78%', once: true } });
      tl.from(lines, { autoAlpha: 0, x: dx, duration: .6, stagger: .18, ease: 'power3.out' })
        .from(stamp, { autoAlpha: 0, scale: 2.6, rotation: -40, duration: .45, ease: 'power4.in' }, '+=.15')
        .to(doc, { keyframes: { x: [0, -5, 4, -2, 0] }, duration: .3 });
    }
  }

  /* ---------- the printed catalogues fan out, the showroom label drops in, the name in the footer rises ---------- */
  function lower() {
    const books = $$('.book');
    if (books.length) G.from(books, { y: 150, rotation: i => (i - 1) * 7, autoAlpha: 0, duration: 1.3, stagger: .12, ease: 'expo.out', scrollTrigger: { trigger: '#books', start: 'top 85%', once: true } });
    const label = $('#visitLabel');
    if (label) G.fromTo(label, { y: -240, rotation: -14, autoAlpha: 0 }, { y: 0, rotation: 1.4, autoAlpha: 1, duration: 1.7, ease: 'elastic.out(1, .5)', scrollTrigger: { trigger: label, start: 'top 88%', once: true } });
  }
  function footWord() {
    const box = $('.foot__word'), w = box && $('[data-word]', box);
    if (!w) return;
    const text = w.textContent.trim();
    const fit = () => {
      const cs = getComputedStyle(box), avail = box.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight);
      w.style.fontSize = '100px';
      const ww = w.getBoundingClientRect().width;
      if (ww > 0) w.style.fontSize = (100 * avail / ww * .995).toFixed(2) + 'px';
    };
    let parts = [w];
    if (motion && !AR) { w.innerHTML = Array.from(text).map(c => (c === ' ' ? ' ' : '<span class="ch">' + esc(c) + '</span>')).join(''); parts = $$('.ch', w); }
    fit(); fontsReady.then(fit);
    let rt = 0; addEventListener('resize', () => { clearTimeout(rt); rt = setTimeout(fit, 150); });
    if (motion) G.from(parts, { yPercent: 110, duration: 1.3, stagger: .04, ease: 'expo.out', scrollTrigger: { trigger: box, start: 'top 98%', once: true } });
  }

  /* ---------- a range's own page ---------- */
  function rangePage() {
    const rh = $('.rh'); if (!rh) return;
    const name = $('.rh__name', rh), frame = $('.frame', rh), fimg = frame && $('img', frame);
    const tl = G.timeline({ delay: .05 });
    tl.from('.crumbs', { autoAlpha: 0, y: 14, duration: .7, ease: 'power3.out' }, 0);
    if (name) {
      if (SPLIT) {
        const sp = SPLIT.create(name, { type: 'lines', mask: 'lines' });
        G.set(sp.lines, { yPercent: 108 });
        requestAnimationFrame(() => { if (window.__vt) G.set(sp.lines, { yPercent: 0 }); else G.to(sp.lines, { yPercent: 0, duration: 1.25, stagger: .08, ease: 'expo.out' }); });
      } else if (!window.__vt) tl.from(name, { autoAlpha: 0, y: 30, duration: 1 }, 0);
    }
    const alt = $$('.rh__alt', rh);
    if (alt.length) tl.from(alt, { autoAlpha: 0, y: 18, duration: .8, ease: 'power3.out' }, .25);
    tl.from($$('.rh__copy > *', rh), { autoAlpha: 0, y: 28, duration: .9, stagger: .08, ease: 'power3.out' }, .3);
    if (frame) {
      tl.fromTo(frame, { clipPath: 'inset(100% 0% 0% 0%)' }, { clipPath: 'inset(0% 0% 0% 0%)', duration: 1.1, ease: 'expo.inOut' }, .15);
      if (fimg) tl.from(fimg, { scale: 1.3, duration: 1.6, ease: 'expo.out' }, .35);
      tl.from($$('.dim--x i', rh), { scaleX: 0, duration: .9, ease: 'power3.inOut' }, .75)
        .from($$('.dim--y i', rh), { scaleY: 0, duration: .9, ease: 'power3.inOut' }, .8)
        .from($$('.dim b', rh), { autoAlpha: 0, duration: .5 }, 1.2)
        .from($$('.cm', frame), { scale: 0, duration: .6, stagger: .06, ease: 'back.out(2)' }, 1.05);
    }
    // the conveyor belt of the range's products: it speeds up as you scroll, and runs back when you scroll up
    const track = $('.belt__track');
    if (track) {
      const belt = track.parentNode;
      const tw = G.fromTo(track, { xPercent: 0 }, { xPercent: AR ? 50 : -50, duration: 70, ease: 'none', repeat: -1 });
      let boost = 0, dir = 1, ts = 1, seen = true, held = false;
      const apply = () => { if (held || !seen) tw.pause(); else tw.resume(); };
      ST.create({ trigger: belt, start: 'top bottom', end: 'bottom top', onUpdate: s => { boost = Math.min(Math.abs(s.getVelocity()) / 220, 9); dir = s.direction; }, onToggle: s => { seen = s.isActive; apply(); } });
      belt.addEventListener('mouseenter', () => { held = true; apply(); });
      belt.addEventListener('mouseleave', () => { held = false; apply(); });
      G.ticker.add(() => {
        if (tw.paused()) return;
        ts += (dir * (1 + boost) - ts) * .08; boost *= .93;
        tw.timeScale(ts);
      });
    }
    // the products come up as they scroll into view
    if ('IntersectionObserver' in window) {
      const io = new IntersectionObserver(es => {
        let n = 0;
        es.forEach(en => {
          if (!en.isIntersecting) return;
          const el = en.target;
          el.style.transitionDelay = (n++ % 8) * 55 + 'ms';
          el.classList.add('is-in'); io.unobserve(el);
          setTimeout(() => { el.style.transitionDelay = ''; }, 1400);
        });
      }, { rootMargin: '0px 0px -5% 0px' });
      $$('.card').forEach(c => io.observe(c));
    } else $$('.card').forEach(c => c.classList.add('is-in'));
  }

  /* ---------- start ---------- */
  const go = () => {
    if (CFG.page === 'home') {
      home();
      let wallData = null;
      const wd = CFG.wall ? fetch(CFG.wall).then(r => r.json()).then(j => { wallData = j; }).catch(() => {}) : Promise.resolve();
      if (motion) { headings(); peek(); featured(); }
      wd.then(() => board(wallData));
      if (motion) { request(); lower(); }
      footWord();
    } else {
      if (motion) { rangePage(); headings(); }
      footWord();
    }
    if (motion) {
      fontsReady.then(() => ST.refresh());
      addEventListener('load', () => ST.refresh());
      // arriving on a part of the home page (…/#visit): go there once everything has its height
      const h = decodeURIComponent(location.hash.slice(1));
      const el = h && h.indexOf('=') < 0 && d.getElementById(h);
      if (el && CFG.page === 'home') fontsReady.then(() => { ST.refresh(); const y = el.getBoundingClientRect().top + window.scrollY; if (lenis) lenis.scrollTo(y, { immediate: true, force: true }); else window.scrollTo(0, y); });
    }
  };
  go();
})();
