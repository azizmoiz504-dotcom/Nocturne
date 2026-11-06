/* Bait Al Maqdis website (hardware-store look): the moving parts.
   The hand tools in the hero (the tape pulls out), the tools going onto the wall, the hazard tapes,
   the pegboard, the tape-measure counters and the showroom shutter. Everything here is extra: without it (or with
   "reduce motion" on) the pages still show and do everything, just without movement. */
(() => {
  'use strict';
  const d = document, html = d.documentElement;
  const CFG = JSON.parse(d.getElementById('site-config').textContent);
  const $ = (s, el) => (el || d).querySelector(s);
  const $$ = (s, el) => Array.prototype.slice.call((el || d).querySelectorAll(s));
  const mq = q => !!(window.matchMedia && matchMedia(q).matches);
  const reduce = mq('(prefers-reduced-motion: reduce)');
  const fine = mq('(hover: hover) and (pointer: fine)');
  const G = window.gsap, ST = window.ScrollTrigger;
  const motion = !!(G && ST) && !reduce;
  const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
  const fontsReady = (d.fonts && d.fonts.ready) ? d.fonts.ready.catch(() => {}) : Promise.resolve();
  const scrollToY = y => { if (window.BAM && window.BAM.scrollToY) window.BAM.scrollToY(y); else window.scrollTo(0, y); };
  const B3 = () => (window.BAM3D && window.BAM3D.ready ? window.BAM3D : null);

  if (motion) {
    G.registerPlugin(ST);
    html.classList.add('has-motion');
    ST.config({ ignoreMobileResize: true });
  }
  requestAnimationFrame(() => requestAnimationFrame(() => html.classList.add('is-loaded')));

  /* ---------- smooth scrolling, for a mouse or trackpad only (phones keep their own) ---------- */
  let lenis = null;
  if (motion && fine && window.Lenis && window.BAM_SMOOTH) {   // off: the plain browser scroll is the quickest on every machine
    const own = n => n.classList && (n.classList.contains('sheet') || n.classList.contains('drawer') || n.classList.contains('palette') || n.classList.contains('lightbox') ||
      n.classList.contains('menu') || n.classList.contains('rail') || n.classList.contains('rchips') || n.classList.contains('more') || n.classList.contains('cat__side') || n.hasAttribute('data-lenis-prevent'));
    lenis = new window.Lenis({ lerp: 0.1, smoothWheel: true, syncTouch: false, autoRaf: false, allowNestedScroll: true, prevent: own });
    lenis.on('scroll', ST.update);
    G.ticker.add(t => lenis.raf(t * 1000));
    G.ticker.lagSmoothing(0);
    window.__lenis = lenis;
    let stopped = false;
    const sync = () => { const s = html.classList.contains('is-locked'); if (s !== stopped) { stopped = s; if (s) lenis.stop(); else lenis.start(); } };
    new MutationObserver(sync).observe(html, { attributes: true, attributeFilter: ['class'] });
  }

  /* links to a part of this same page glide there */
  d.addEventListener('click', e => {
    if (e.defaultPrevented || e.button || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    const a = e.target.closest && e.target.closest('a[href*="#"]');
    if (!a) return;
    const u = new URL(a.href, location.href);
    if (u.origin !== location.origin || u.pathname !== location.pathname || u.search !== location.search) return;
    const id = decodeURIComponent(u.hash.slice(1));
    if (!id || id.indexOf('=') >= 0) return;
    const el = d.getElementById(id);
    if (!el) return;
    e.preventDefault();
    const rbar = $('#rbar');
    const off = id === 'products' && rbar ? rbar.offsetHeight : 0;
    scrollToY(id === 'top' ? 0 : el.getBoundingClientRect().top + window.scrollY - off);
    try { history.replaceState(history.state, '', '#' + id); } catch (err) {}
  });

  /* ---------- the 3D: the hero, and "Every tool" ---------- */
  function three() {
    const hero = $('#top'), fix = $('#fixings');
    const b = B3();
    if (!b || !hero) return;
    // the canvas only draws while the hero or "Every tool" is on screen
    const vis = new Map();
    const io = new IntersectionObserver(es => {
      es.forEach(e => vis.set(e.target, e.isIntersecting));
      const on = Array.from(vis.values()).some(Boolean);
      b.show(on);
      html.classList.toggle('gl-off', !on);
    }, { rootMargin: '10% 0px' });
    [hero, fix].filter(Boolean).forEach(el => io.observe(el));

    const labels = {};
    $$('[data-label]').forEach(el => { labels[el.getAttribute('data-label')] = el; });
    b.setLabels(labels);
    const fixLabels = $('#fixLabels'), bar = $('#fixBar'), pct = $('#fixPct');
    const setAna = p => {
      b.anatomy(p);
      if (bar) bar.style.transform = 'scaleX(' + p.toFixed(3) + ')';
      if (pct) pct.textContent = Math.round(p * 100) + '%';
      if (fixLabels) fixLabels.classList.toggle('is-on', p > 0.82);
    };
    // naming a part in the list lights up its label
    $$('[data-fix]').forEach(a => {
      const id = a.getAttribute('data-fix'), l = labels[id];
      if (!l) return;
      a.addEventListener('mouseenter', () => l.classList.add('is-hot'));
      a.addEventListener('mouseleave', () => l.classList.remove('is-hot'));
      l.addEventListener('mouseenter', () => a.classList.add('is-hot'));
      l.addEventListener('mouseleave', () => a.classList.remove('is-hot'));
    });

    if (!motion) { b.skipIntro(); b.hero(0); if (b.approach) b.approach(1); setAna(1); return; }
    const phone = innerWidth < 900;
    ST.create({ trigger: hero, start: 'top top', end: 'bottom top', scrub: phone ? true : 0.6, onUpdate: s => b.hero(s.progress, s.end - s.start) });
    if (fix) {
      const small = innerWidth < 900;
      // while the section scrolls up, the tools move from the hero's place to this one
      ST.create({ trigger: fix, start: 'top bottom', end: 'top top', scrub: 0.7, onUpdate: s => b.approach && b.approach(s.progress) });
      ST.create({
        trigger: fix, start: 'top top', end: () => '+=' + Math.round(innerHeight * (small ? 1.3 : 1.7)), pin: '.fix__pin', pinSpacing: true, scrub: 0.7,
        onUpdate: s => setAna(clamp(s.progress * 1.18, 0, 1))
      });
      // once it lets go, the tools scroll away with the section
      ST.create({ trigger: fix, start: 'bottom bottom', end: 'bottom top', onUpdate: s => b.exit && b.exit(s.progress) });
    }
  }

  /* ---------- the hero title rises, the HUD counts ---------- */
  function heroCue() {
    const cue = $('.hud__cue');
    if (!cue || !motion) return;
    ST.create({ start: 0, end: 300, onUpdate: s => { cue.style.opacity = String(1 - s.progress); } });
  }

  /* ---------- the hazard tapes run, faster while you scroll ---------- */
  function tapes() {
    const ts = $$('.tape__track');
    if (!ts.length || !motion) return;
    ts.forEach((t, i) => {
      const dir = (i % 2 ? 1 : -1) * (CFG.lang === 'ar' ? -1 : 1);
      const tw = G.fromTo(t, { xPercent: dir < 0 ? 0 : -50 }, { xPercent: dir < 0 ? -50 : 0, ease: 'none', duration: i % 2 ? 46 : 38, repeat: -1 });
      ST.create({ start: 0, end: 'max', onUpdate: s => { const v = Math.min(5, Math.abs(s.getVelocity()) / 400); G.to(tw, { timeScale: 1 + v, duration: 0.2, overwrite: true }); G.to(tw, { timeScale: 1, duration: 1.2, delay: 0.2 }); } });
    });
    $$('.tapes').forEach(el => G.fromTo(el, { '--sk': 0 }, { '--sk': 1, ease: 'none', scrollTrigger: { trigger: el, start: 'top bottom', end: 'bottom top', scrub: true } }));
  }

  /* ---------- the about statement lights up word by word ---------- */
  function statement() {
    const el = $('[data-words]');
    if (!el) return;
    const words = el.textContent.trim().split(/\s+/);
    el.innerHTML = words.map(w => '<span class="sw">' + w.replace(/[&<>]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c])) + '</span>').join(' ');
    if (!motion) { el.classList.add('is-lit'); return; }
    const sw = $$('.sw', el);
    ST.create({ trigger: el, start: 'top 80%', end: 'bottom 45%', scrub: true, onUpdate: s => {
      const n = Math.round(s.progress * sw.length);
      sw.forEach((w, i) => w.classList.toggle('on', i < n));
    } });
  }

  /* ---------- the pegboard: tags swing onto their hooks ---------- */
  function pegboard() {
    const tags = $$('.hang');
    if (!tags.length || !motion) return;
    G.set(tags, { rotate: () => (Math.random() * 16 - 8), y: -30, opacity: 0, transformOrigin: '50% 0%' });
    ST.batch(tags, { start: 'top 92%', once: true, onEnter: batch => G.to(batch, { rotate: 0, y: 0, opacity: 1, duration: 1.4, ease: 'elastic.out(1, 0.35)', stagger: 0.06 }) });
    if (fine) tags.forEach(t => {
      t.addEventListener('mouseenter', () => G.fromTo(t, { rotate: 0 }, { keyframes: [{ rotate: 3.5, duration: 0.18 }, { rotate: -2.5, duration: 0.25 }, { rotate: 1.2, duration: 0.25 }, { rotate: 0, duration: 0.3 }], ease: 'sine.inOut', overwrite: true }));
    });
  }

  /* ---------- the tape-measure counters pull out ---------- */
  function meters() {
    const ms = $$('.meter');
    if (!ms.length) return;
    if (!motion || !('IntersectionObserver' in window)) { ms.forEach(m => m.classList.add('is-out')); return; }
    const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add('is-out'); io.unobserve(e.target); } }), { threshold: 0.6 });
    ms.forEach(m => io.observe(m));
  }

  /* ---------- the two big ranges: their products drift as you pass ---------- */
  function brands() {
    if (!motion) return;
    $$('[data-bp]').forEach(bp => {
      $$('.bp__cut', bp).forEach((c, i) => G.fromTo(c, { y: 40 + i * 14 }, { y: -40 - i * 18, ease: 'none', scrollTrigger: { trigger: bp, start: 'top bottom', end: 'bottom top', scrub: true } }));
      const w = $('.bp__word', bp);
      if (w) G.fromTo(w, { xPercent: CFG.lang === 'ar' ? -8 : 8 }, { xPercent: CFG.lang === 'ar' ? 8 : -8, ease: 'none', scrollTrigger: { trigger: bp, start: 'top bottom', end: 'bottom top', scrub: true } });
    });
  }

  /* ---------- the example price request slides in and gets its stamp ---------- */
  function receipt() {
    const r = $('.receipt');
    if (!r) return;
    if (!motion) { r.classList.add('is-sent'); return; }
    ST.create({ trigger: r, start: 'top 75%', once: true, onEnter: () => r.classList.add('is-in') });
    ST.create({ trigger: r, start: 'center 55%', once: true, onEnter: () => r.classList.add('is-sent') });
  }

  /* ---------- the showroom: its shutter rolls up (in 3D when the browser can draw it) ---------- */
  function shutter() {
    const sh = $('#shutter'), unit = $('.unit');
    if (!sh || !unit) return;
    const wh = window.BAMWH && window.BAMWH.ready ? window.BAMWH : null;
    if (wh) {      // the 3D showroom: it holds still in the middle of the screen while the shutter goes up
      if (!motion) { wh.skip(); wh.progress(1); return; }
      const stage = $('.visit__stage'), phone = innerWidth < 900;
      const pinEl = !phone && stage && stage.offsetHeight <= innerHeight * 0.98 ? stage : unit;
      ST.create({ trigger: pinEl, start: 'center center', end: () => '+=' + Math.round(innerHeight * (phone ? 1.1 : 1.3)), pin: pinEl, pinSpacing: true, scrub: 0.6, onUpdate: s => wh.progress(s.progress) });
      return;
    }
    if (!motion) { unit.classList.add('is-open'); return; }
    G.fromTo(sh, { yPercent: 0 }, { yPercent: -92, ease: 'none', scrollTrigger: { trigger: unit, start: 'top 80%', end: 'center 45%', scrub: 0.5, onLeave: () => unit.classList.add('is-open'), onEnterBack: () => unit.classList.remove('is-open') } });
  }

  /* ---------- the big name in the footer ---------- */
  function footWord() {
    const w = $('.foot__word span');
    if (!w || !motion) return;
    G.fromTo(w, { yPercent: 60, opacity: 0.2 }, { yPercent: 0, opacity: 1, ease: 'none', scrollTrigger: { trigger: '.foot', start: 'top bottom', end: 'bottom bottom', scrub: true } });
  }

  /* ---------- a range page: the hanging tag sways, groups rise ---------- */
  function rangePage() {
    const tag = $('.rh__tag');
    if (tag && motion) {
      G.fromTo(tag, { rotate: -9 }, { rotate: 0, duration: 2.2, ease: 'elastic.out(1, 0.3)', delay: 0.25 });
      if (fine) {
        const fig = $('.rh__fig');
        fig.addEventListener('mousemove', e => { const r = fig.getBoundingClientRect(); G.to(tag, { rotate: ((e.clientX - r.left) / r.width - 0.5) * 7, duration: 0.6, ease: 'power2.out' }); });
        fig.addEventListener('mouseleave', () => G.to(tag, { rotate: 0, duration: 1.6, ease: 'elastic.out(1, 0.3)' }));
      }
    }
  }

  const go = () => {
    if (CFG.page === 'home') { three(); heroCue(); tapes(); statement(); pegboard(); meters(); brands(); receipt(); shutter(); }
    else rangePage();
    footWord();
    if (motion) {
      fontsReady.then(() => ST.refresh());
      addEventListener('load', () => ST.refresh());
      // the catalogue fills in (and grows with "Show more") after the page has loaded: measure again so the showroom holds still in the right place
      if (CFG.page === 'home' && 'ResizeObserver' in window) {
        let lastH = 0, tm = 0;
        const again = () => { if (window.BAM && window.BAM.holdBar) window.BAM.holdBar(500); ST.refresh(); };   // the top bar stays as it is while measuring
        new ResizeObserver(es => {
          const h = Math.round(es[0].contentRect.height);
          if (Math.abs(h - lastH) < 2) return;
          lastH = h; clearTimeout(tm); tm = setTimeout(again, 160);
        }).observe(d.querySelector('main') || d.body);
      }
      // arriving on a part of the home page (…/#visit): go there once everything has its height
      const h = decodeURIComponent(location.hash.slice(1));
      const el = h && h.indexOf('=') < 0 && d.getElementById(h);
      if (el && CFG.page === 'home') fontsReady.then(() => { ST.refresh(); const y = el.getBoundingClientRect().top + window.scrollY; if (lenis) lenis.scrollTo(y, { immediate: true, force: true }); else window.scrollTo(0, y); });
    }
  };
  go();
})();
