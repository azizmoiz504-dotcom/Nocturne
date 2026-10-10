/* Fakhri Tools — page orchestration */
(function () {
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const CATS = window.FT_CATS, FAMS = window.FT_FAMILIES, IMG = window.FT_IMG || '', CFG = window.FT_CONFIG;
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const fine = matchMedia('(hover: hover) and (pointer: fine)').matches;
  const pad = n => String(n).padStart(2, '0');
  const clamp = (x, a, b) => Math.max(a, Math.min(b, x));
  gsap.registerPlugin(ScrollTrigger);
  ScrollTrigger.config({ ignoreMobileResize: true });

  const PH = '<svg class="ph" viewBox="0 0 64 64" fill="none" stroke="currentColor" stroke-width="2"><circle cx="32" cy="12" r="9"/><path d="M32 21v11M14 32h36v18H14zM5 36h9v10H5zM50 36h9v10h-9z"/></svg>';
  document.addEventListener('load', e => {
    const t = e.target;
    if (t && t.tagName === 'IMG') t.classList.add('is-loaded');
  }, true);
  document.addEventListener('error', e => {
    const t = e.target;
    if (t && t.tagName === 'IMG' && t.hasAttribute('data-ph')) t.outerHTML = PH;
  }, true);
  const art = (c, cls) => '<svg class="' + (cls || 'art') + '" aria-hidden="true"><use href="#' + c.art + '"/></svg>';

  /* ---------------- Contact details from js/config.js ---------------- */
  const PHONE = CFG.phoneDisplay, TEL = CFG.phoneLink;
  const waUrl = text => CFG.whatsappDigits ? 'https://wa.me/' + CFG.whatsappDigits + (text ? '?text=' + encodeURIComponent(text) : '') : '';
  const mapsUrl = () => CFG.mapsUrl || CFG.mapsSearchUrl;
  const WA_HELLO = 'Hello Fakhri Tools, I would like a quote.';

  function applyLinks(root) {
    root = root || document;
    $$('[data-wa-text]', root).forEach(e => { e.textContent = CFG.whatsappDisplay || '[WhatsApp number]'; });
    $$('[data-email-text]', root).forEach(e => { e.textContent = CFG.email || '[Email address]'; });
    $$('[data-wa-link]', root).forEach(a => {
      const u = waUrl(a.dataset.waMsg || WA_HELLO);
      if (u) { a.href = u; a.target = '_blank'; a.rel = 'noopener'; a.removeAttribute('data-missing'); }
      else { a.href = '#'; a.dataset.missing = 'wa'; a.removeAttribute('target'); }
    });
    $$('[data-email-link]', root).forEach(a => {
      a.removeAttribute('data-scroll');
      if (CFG.email) { a.href = 'mailto:' + CFG.email; a.removeAttribute('data-missing'); }
      else { a.href = '#'; a.dataset.missing = 'email'; (a.closest('div') && a.closest('dd') ? a.closest('div') : a).hidden = true; }
    });
    $$('[data-maps]', root).forEach(a => { a.href = mapsUrl(); });
  }
  document.addEventListener('click', e => {
    const m = e.target.closest('[data-missing]');
    if (!m) return;
    e.preventDefault(); e.stopPropagation();
    toast((m.dataset.missing === 'wa' ? '[WhatsApp number]' : '[Email address]') + ' not added yet — please call ' + PHONE);
  }, true);

  let toastT;
  function toast(msg) {
    const t = $('#toast'); t.textContent = msg; t.classList.add('is-on');
    clearTimeout(toastT); toastT = setTimeout(() => t.classList.remove('is-on'), 2800);
  }

  /* ---------------- Opening hours (Dubai time) ---------------- */
  const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const fmtHour = h => { const hh = Math.floor(h), mm = Math.round((h - hh) * 60); return ((hh % 12) || 12) + ':' + pad(mm) + (hh < 12 ? 'am' : 'pm'); };
  function dubaiParts() {
    const p = {};
    new Intl.DateTimeFormat('en-GB', { timeZone: 'Asia/Dubai', hour: '2-digit', minute: '2-digit', second: '2-digit', weekday: 'short', day: '2-digit', month: 'short', hour12: false })
      .formatToParts(new Date()).forEach(x => { p[x.type] = x.value; });
    p.dow = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].indexOf(p.weekday);
    p.h = (+p.hour % 24) + (+p.minute) / 60;
    return p;
  }
  function openState(p) {
    const isDay = d => CFG.openDays.includes(d);
    if (isDay(p.dow) && p.h >= CFG.openFrom && p.h < CFG.openTo) return { open: true, text: 'Open now · until ' + fmtHour(CFG.openTo) };
    if (isDay(p.dow) && p.h < CFG.openFrom) return { open: false, text: 'Closed · opens ' + fmtHour(CFG.openFrom) + ' today' };
    for (let k = 1; k <= 7; k++) {
      const d = (p.dow + k) % 7;
      if (isDay(d)) return { open: false, text: 'Closed · opens ' + fmtHour(CFG.openFrom) + (k === 1 ? ' tomorrow' : ' ' + DAYS[d]) };
    }
    return { open: false, text: 'Closed' };
  }

  /* ---------------- Smooth scroll ---------------- */
  let lenis = null;
  if (window.Lenis && !reduce) {
    lenis = new Lenis({ lerp: 0.1, smoothWheel: true, wheelMultiplier: 1 });
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add(t => lenis.raf(t * 1000));
    gsap.ticker.lagSmoothing(0);
  }
  function scrollToEl(target) {
    const el = typeof target === 'string' ? (target === '#top' ? 0 : $(target)) : target;
    if (el === null || el === undefined) return;
    if (lenis) lenis.scrollTo(el, { duration: 1.8, easing: t => 1 - Math.pow(1 - t, 4) });
    else if (el === 0) window.scrollTo({ top: 0, behavior: 'smooth' });
    else el.scrollIntoView({ behavior: 'smooth' });
  }

  /* ================= Shop: helpers ================= */
  const catBySlug = s => CATS.find(c => c.slug === s);
  const famName = id => FAMS.find(f => f.id === id).name;
  function itemOf(id) {
    const [slug, i] = String(id).split(':');
    const c = catBySlug(slug);
    if (!c || !c.items[+i]) return null;
    const it = c.items[+i];
    return { id: slug + ':' + (+i), c, i: +i, name: it[0], chips: it[1], size: it[2], img: c.imgs[+i] ? IMG + c.imgs[+i] : '' };
  }
  const imgTag = (src, alt) => src ? '<img data-ph src="' + src + '" alt="' + (alt || '').replace(/"/g, '&quot;') + '" loading="lazy" decoding="async" >' : PH;
  const MATS = [['Bronze', /bronze/i], ['Brass', /brass/i], ['Stainless', /\bS\.S\b|stainless/i], ['Carbon steel', /\bC\.S\b/], ['Cast iron', /\bC\.I\b/i], ['Galvanised', /\bG\.I\b/], ['Mild steel', /\bM\.S\b/], ['Aluminium', /alumin/i], ['Rubber', /rubber|neoprene/i]];
  function materialOf(name) {
    let best = null, at = 1e9;
    MATS.forEach(([m, r]) => { const k = name.search(r); if (k > -1 && k < at) { at = k; best = m; } });
    return best;
  }
  const chipsHTML = arr => arr.length ? '<div class="prow__chips">' + arr.map(s => '<span>' + s + '</span>').join('') + '</div>' : '';

  /* ================= Quote basket (id -> qty) ================= */
  const rfq = new Map();
  try { (JSON.parse(localStorage.getItem('ft-rfq') || '[]')).forEach(([k, q]) => { if (itemOf(k)) rfq.set(k, Math.max(1, +q || 1)); }); } catch (e) {}
  const saveRfq = () => { try { localStorage.setItem('ft-rfq', JSON.stringify([...rfq])); } catch (e) {} };
  const lineText = (o, q) => '• ' + o.name + (o.size ? ' (' + o.size + ')' : '') + ' × ' + q;
  function quoteMessage() {
    if (!rfq.size) return 'Hello Fakhri Tools, I would like a quote.';
    return 'Hello Fakhri Tools, I would like a quote for:\n' + [...rfq].map(([id, q]) => lineText(itemOf(id), q)).join('\n');
  }

  function setQty(id, q) {
    q = Math.round(+q || 0);
    if (q <= 0) rfq.delete(id); else rfq.set(id, Math.min(99999, q));
    saveRfq(); syncRfq(false);
  }
  function toggleRfq(id, srcEl) {
    const o = itemOf(id); if (!o) return;
    const added = !rfq.has(id);
    if (added) rfq.set(id, 1); else rfq.delete(id);
    saveRfq(); syncRfq(true);
    toast((added ? 'Added to quote — ' : 'Removed — ') + o.name);
    if (added && srcEl) requestAnimationFrame(() => flyToBar(srcEl));
  }
  function addAll(c, srcEl) {
    let n = 0;
    c.items.forEach((_, i) => { const id = c.slug + ':' + i; if (!rfq.has(id)) { rfq.set(id, 1); n++; } });
    saveRfq(); syncRfq(true);
    toast(n ? 'Added ' + n + ' products from ' + c.name : 'The full ' + c.name + ' range is already in your quote');
    if (n && srcEl) requestAnimationFrame(() => flyToBar(srcEl));
  }

  // product image flies into the quote bar
  function flyToBar(srcEl) {
    const holder = srcEl.closest('[data-fly]');
    const img = holder && holder.querySelector('img');
    const bar = $('#qbar');
    if (!img || !bar.classList.contains('is-on') || reduce) return;
    const a = img.getBoundingClientRect(), b = $('#qbarThumbs').getBoundingClientRect();
    const ghost = img.cloneNode();
    ghost.className = 'fly-ghost';
    Object.assign(ghost.style, { left: a.left + 'px', top: a.top + 'px', width: a.width + 'px', height: a.height + 'px' });
    document.body.appendChild(ghost);
    gsap.to(ghost, {
      x: b.left + b.width / 2 - (a.left + a.width / 2), y: b.top + b.height / 2 - (a.top + a.height / 2),
      scale: 34 / Math.max(a.width, 1), rotate: -20, duration: 0.85, ease: 'power3.inOut',
      onComplete: () => { ghost.remove(); gsap.fromTo('#qbarThumbs', { scale: 1.3 }, { scale: 1, duration: 0.7, ease: 'elastic.out(1,0.4)' }); }
    });
  }

  function syncRfq(bump) {
    const n = rfq.size;
    $('#rfqCount').textContent = n; $$('.js-rfq-n').forEach(e => { e.textContent = n; });
    if (bump) { const b = $('#rfqBtn'); b.classList.remove('bump'); void b.offsetWidth; b.classList.add('bump'); }
    $$('[data-add]').forEach(b => {
      const on = rfq.has(b.dataset.add);
      b.classList.toggle('is-added', on);
      const l = $('.lbl', b); if (l) l.textContent = on ? 'Added' : 'Add to quote';
    });
    // contact form list
    $('#formRfq').hidden = n === 0;
    const list = $('#rfqList'); list.innerHTML = '';
    rfq.forEach((q, id) => {
      const o = itemOf(id);
      const li = document.createElement('li');
      li.innerHTML = '<span></span><button type="button" aria-label="Remove">×</button>';
      li.firstChild.textContent = o.name + (o.size ? ' (' + o.size + ')' : '') + ' × ' + q;
      li.lastChild.addEventListener('click', () => setQty(id, 0));
      list.appendChild(li);
    });
    $('#qsWa').dataset.waMsg = quoteMessage(); applyLinks($('.qs__foot'));
    // floating quote bar
    const bar = $('#qbar');
    bar.classList.toggle('is-on', n > 0);
    document.body.classList.toggle('has-quote', n > 0);
    $('#qbarCount').textContent = n + (n === 1 ? ' product' : ' products');
    $('#qbarThumbs').innerHTML = [...rfq.keys()].slice(-4).reverse().map(id => '<i>' + imgTag(itemOf(id).img) + '</i>').join('');
    if (qs.classList.contains('is-open')) renderSheet();
    if (qvId) syncQV();
  }
  document.addEventListener('click', e => {
    const b = e.target.closest('[data-add]');
    if (b) { e.preventDefault(); e.stopPropagation(); toggleRfq(b.dataset.add, b); }
  });
  $('#rfqClear').addEventListener('click', () => { rfq.clear(); saveRfq(); syncRfq(true); });


  /* ================= Quote review sheet ================= */
  const qs = $('#qs');
  function renderSheet() {
    const n = rfq.size;
    $('#qsCount').textContent = n;
    $('#qsList').innerHTML = n ? [...rfq].map(([id, q]) => {
      const o = itemOf(id);
      return '<div class="qs__row" data-id="' + id + '">' +
        '<button class="qs__img" data-qv="' + id + '">' + imgTag(o.img) + '</button>' +
        '<div class="qs__info"><span class="mono">' + o.c.name + '</span><b>' + o.name + '</b>' + (o.size ? '<small>' + o.size + '</small>' : '') + '</div>' +
        '<div class="qty"><button type="button" data-q="-1" aria-label="Less">−</button><input type="text" inputmode="numeric" value="' + q + '" aria-label="Quantity"><button type="button" data-q="1" aria-label="More">+</button></div>' +
        '<button class="qs__rm" type="button" aria-label="Remove">×</button></div>';
    }).join('') : '<div class="qs__empty"><b>Your quote is empty.</b><p>Browse the catalogue and tap “Add to quote” on anything you need — sizes and quantities can be adjusted here.</p><div class="qs__empty-btns"><button class="btn btn--red" id="qsBrowse" type="button">Browse the catalogue</button><a class="btn btn--ghost" href="tel:+97142850135">Call +971 4 285 0135</a></div></div>';
    $('.qs__foot').hidden = n === 0;
  }
  function openSheet() {
    renderSheet();
    qs.classList.add('is-open'); qs.setAttribute('aria-hidden', 'false');
    lenis && lenis.stop();
    gsap.fromTo('.qs__row', { y: 24, opacity: 0 }, { y: 0, opacity: 1, duration: 0.7, ease: 'expo.out', stagger: 0.04, delay: 0.15 });
  }
  function closeSheet() {
    if (!qs.classList.contains('is-open')) return;
    qs.classList.remove('is-open'); qs.setAttribute('aria-hidden', 'true');
    if (!sr.classList.contains('is-open')) lenis && lenis.start();
  }
  $$('[data-qs-close]', qs).forEach(b => b.addEventListener('click', closeSheet));
  $('#qsList').addEventListener('click', e => {
    const row = e.target.closest('.qs__row'); if (!row) return;
    const id = row.dataset.id;
    const step = e.target.closest('[data-q]');
    if (step) setQty(id, (rfq.get(id) || 0) + (+step.dataset.q));
    if (e.target.closest('.qs__rm')) setQty(id, 0);
    if (e.target.closest('#qsBrowse')) { closeSheet(); hardCloseShowroom(); scrollToEl('#catalogue'); }
  });
  $('#qsList').addEventListener('change', e => {
    const row = e.target.closest('.qs__row'); if (row && e.target.tagName === 'INPUT') setQty(row.dataset.id, e.target.value);
  });
  $('#qsForm').addEventListener('click', () => { closeSheet(); hardCloseShowroom(); setTimeout(() => scrollToEl('#contact'), 80); });
  $('#qbarOpen').addEventListener('click', openSheet);
  $('#rfqBtn').addEventListener('click', openSheet);

  /* ================= Quick view ================= */
  const qv = $('#qv');
  let qvId = null;
  function syncQV() {
    const on = rfq.has(qvId);
    const btn = $('#qvAdd');
    btn.classList.toggle('is-added', on);
    $('span', btn).textContent = on ? 'Update quantity' : 'Add to quote';
    $('#qvState').hidden = !on;
    if (on) $('#qvState b').textContent = rfq.get(qvId) + ' in your quote';
  }
  function fillQV(id) {
    const o = itemOf(id); if (!o) return;
    qvId = o.id;
    const mat = materialOf(o.name);
    $('#qvMedia').innerHTML = imgTag(o.img, o.name);
    $('#qvCat').textContent = famName(o.c.fam) + ' / ' + o.c.name;
    $('#qvName').textContent = o.name;
    $('#qvSize').textContent = o.size || 'On request';
    $('#qvSpecs').innerHTML =
      '<div><dt class="mono">Material</dt><dd>' + (mat || 'See specification') + '</dd></div>' +
      '<div><dt class="mono">Specs & ratings</dt><dd>' + (o.chips.length ? chipsHTML(o.chips) : 'Standard') + '</dd></div>' +
      '<div><dt class="mono">How to buy</dt><dd>Add it to your quote, then send by WhatsApp or email — or call the counter</dd></div>';
    $('#qvQty').value = rfq.get(o.id) || 1;
    $('#qvPos').textContent = pad(o.i + 1) + ' / ' + pad(o.c.items.length);
    $('#qvWa').dataset.waMsg = 'Hello Fakhri Tools, please send me a quote for: ' + o.name + (o.size ? ' (' + o.size + ')' : '') + '.'; applyLinks(qv);
    syncQV();
  }
  function openQV(id) {
    const wasOpen = qv.classList.contains('is-open');
    fillQV(id);
    qv.classList.add('is-open'); qv.setAttribute('aria-hidden', 'false');
    lenis && lenis.stop();
    if (!wasOpen) gsap.fromTo('.qv__card', { y: 40, scale: 0.96, opacity: 0 }, { y: 0, scale: 1, opacity: 1, duration: 0.7, ease: 'expo.out' });
    gsap.fromTo('#qvMedia img', { scale: 0.8, rotate: -6, opacity: 0 }, { scale: 1, rotate: 0, opacity: 1, duration: 0.9, ease: 'expo.out' });
  }
  function closeQV() {
    if (!qv.classList.contains('is-open')) return;
    qv.classList.remove('is-open'); qv.setAttribute('aria-hidden', 'true'); qvId = null;
    if (!sr.classList.contains('is-open') && !qs.classList.contains('is-open')) lenis && lenis.start();
  }
  function stepQV(d) { const o = itemOf(qvId); if (o) openQV(o.c.slug + ':' + ((o.i + d + o.c.items.length) % o.c.items.length)); }
  $$('[data-qv-close]', qv).forEach(b => b.addEventListener('click', closeQV));
  $('#qvPrev').addEventListener('click', () => stepQV(-1));
  $('#qvNext').addEventListener('click', () => stepQV(1));
  $$('.qv [data-step]').forEach(b => b.addEventListener('click', () => { const i = $('#qvQty'); i.value = Math.max(1, (+i.value || 1) + (+b.dataset.step)); }));
  $('#qvAdd').addEventListener('click', e => {
    const q = Math.max(1, +$('#qvQty').value || 1);
    const isNew = !rfq.has(qvId);
    rfq.set(qvId, q); saveRfq(); syncRfq(isNew);
    toast((isNew ? 'Added to quote — ' : 'Updated — ') + itemOf(qvId).name + ' × ' + q);
    const media = $('#qvMedia');
    if (isNew) requestAnimationFrame(() => flyToBar(media));
  });
  document.addEventListener('click', e => {
    const b = e.target.closest('[data-qv]');
    if (b) { e.preventDefault(); openQV(b.dataset.qv); }
  });

  /* ================= Product markup ================= */
  function rowHTML(c, i, withCat) {
    const o = itemOf(c.slug + ':' + i), on = rfq.has(o.id);
    return '<div class="prow" data-fly>' +
      '<button class="prow__img" data-qv="' + o.id + '">' + imgTag(o.img) + '</button>' +
      '<button class="prow__main" data-qv="' + o.id + '">' + (withCat ? '<span class="prow__cat">' + c.name + '</span>' : '') + '<h4>' + o.name + '</h4>' +
      (o.size ? '<div class="prow__size">' + o.size + '</div>' : '') + chipsHTML(o.chips) + '</button>' +
      '<button class="add' + (on ? ' is-added' : '') + '" data-add="' + o.id + '"><span class="plus">+</span><span class="lbl">' + (on ? 'Added' : 'Add to quote') + '</span></button>' +
      '</div>';
  }
  function cardHTML(c, i) {
    const o = itemOf(c.slug + ':' + i), on = rfq.has(o.id), mat = materialOf(o.name);
    return '<article class="pc" data-fly data-mat="' + (mat || '') + '" data-specs="' + o.chips.join('|') + '">' +
      '<button class="pc__media" data-qv="' + o.id + '" data-cursor="View"><span class="pc__no mono">' + pad(i + 1) + '</span>' +
      (mat ? '<span class="pc__mat mono">' + mat + '</span>' : '') + imgTag(o.img, o.name) + '</button>' +
      '<div class="pc__body"><h4>' + o.name + '</h4>' + (o.size ? '<div class="pc__size">' + o.size + '</div>' : '') + chipsHTML(o.chips) + '</div>' +
      '<div class="pc__foot"><button class="pc__quick mono" data-qv="' + o.id + '">Quick view</button>' +
      '<button class="add' + (on ? ' is-added' : '') + '" data-add="' + o.id + '"><span class="plus">+</span><span class="lbl">' + (on ? 'Added' : 'Add to quote') + '</span></button></div>' +
      '</article>';
  }

  /* ================= Category showroom (full screen) ================= */
  const sr = $('#showroom'), srScroll = $('#srScroll'), srContent = $('#srContent');
  const RELATED = {
    valves: ['gaskets-caf-canf-sheets', 'ss-ms-flanges-forging-casting', 'ss-forged-low-pressure-bw-fittings', 'instrumentation-fittings-pressure-gas'],
    couplings: ['gaskets-caf-canf-sheets', 'quick-couplings', 'chicago-couplings-fittings', 'hammer-union'],
    fittings: ['ss-ms-flanges-forging-casting', 'gaskets-caf-canf-sheets', 'ball-valves', 'gate-valves'],
    sealing: ['ss-ms-flanges-forging-casting', 'ball-valves', 'gate-valves', 'instrumentation-fittings-pressure-gas']
  };
  let srIdx = -1;
  const filt = { mat: 'all', spec: 'all' };

  $('#srTabs').innerHTML = CATS.map(c => '<button data-cat="' + c.slug + '">' + c.name + '</button>').join('');

  function renderShowroom(idx) {
    srIdx = idx;
    const c = CATS[idx];
    filt.mat = 'all'; filt.spec = 'all';
    const mats = [...new Set(c.items.map(it => materialOf(it[0])).filter(Boolean))];
    const specCount = new Map();
    c.items.forEach(it => it[1].forEach(s => specCount.set(s, (specCount.get(s) || 0) + 1)));
    const specs = [...specCount].sort((a, b) => b[1] - a[1]).map(x => x[0]).slice(0, 10);
    const next = CATS[(idx + 1) % CATS.length];
    const related = RELATED[c.fam].filter(s => s !== c.slug).slice(0, 3).map(catBySlug);
    const fchips = (key, list) => '<button class="chip is-on" data-f="' + key + '" data-v="all">All</button>' + list.map(v => '<button class="chip" data-f="' + key + '" data-v="' + v + '">' + v + '</button>').join('');

    srContent.innerHTML =
      '<header class="sr__hero">' +
        '<div class="sr__copy">' +
          '<div class="sr__crumbs mono"><button data-sr-close>Catalogue</button><i>/</i><span>' + famName(c.fam) + '</span><i>/</i><b>' + pad(idx + 1) + ' of 18</b></div>' +
          '<h2 class="sr__title">' + c.name + '</h2>' +
          '<p class="sr__desc">' + c.desc + '</p>' +
          '<div class="sr__facts"><div><b>' + pad(c.items.length) + '</b><small class="mono">Products</small></div>' +
            '<div><b>' + pad(Math.max(1, mats.length)) + '</b><small class="mono">Materials</small></div>' +
            '<div><b>' + pad(specCount.size) + '</b><small class="mono">Specs & ratings</small></div></div>' +
          '<div class="sr__ctas" data-fly><img class="sr__flysrc" src="' + IMG + c.imgs[0] + '" alt="" >' +
            '<button class="btn btn--red magnetic" data-addall>Quote the full range <svg><use href="#arrow"/></svg></button>' +
            '<a class="btn btn--ghost magnetic" href="#" data-wa-link data-wa-msg="Hello Fakhri Tools, I would like a quote for your ' + c.name + '."><svg><use href="#wa"/></svg> Ask on WhatsApp</a></div>' +
        '</div>' +
        '<div class="sr__stage">' +
          '<div class="sr__orb"><svg class="sr__ring" viewBox="0 0 200 200"><defs><path id="srRing" d="M100,100 m-90,0 a90,90 0 1,1 180,0 a90,90 0 1,1 -180,0"/></defs><text><textPath href="#srRing">Fakhri Tools · Al Quoz Industrial Area 3 · Dubai · Get a quote · Call · WhatsApp ·</textPath></text></svg>' +
          '<div class="sr__plate" id="srPlate">' + imgTag(IMG + c.imgs[0], c.name) + '</div></div>' +
          '<div class="sr__thumbs">' + c.imgs.slice(0, 6).map((im, i) => '<button class="' + (i ? '' : 'is-on') + '" data-feat="' + i + '" aria-label="Show product ' + (i + 1) + '">' + imgTag(IMG + im) + '</button>').join('') + '</div>' +
        '</div>' +
      '</header>' +
      '<div class="sr__trust mono"><span>B2B trade counter · Dubai</span><span>Al Quoz Industrial Area 3</span><span>Open Mon–Sat 7:30am–6:00pm</span><span>Quotes by call, WhatsApp or visit</span></div>' +
      '<div class="sr__toolbar">' +
        (mats.length > 1 ? '<div class="sr__filter"><span class="mono">Material</span>' + fchips('mat', mats) + '</div>' : '') +
        (specs.length > 1 ? '<div class="sr__filter"><span class="mono">Spec</span>' + fchips('spec', specs) + '</div>' : '') +
        '<span class="sr__showing mono" id="srShowing">Showing ' + c.items.length + ' of ' + c.items.length + '</span>' +
      '</div>' +
      '<div class="sr__grid" id="srGrid">' + c.items.map((_, i) => cardHTML(c, i)).join('') + '</div>' +
      '<section class="sr__related"><div class="sr__rel-head"><span class="mono">Complete the line</span><h3>Everything that goes with ' + c.name.toLowerCase().replace(/ — .*/, '') + '.</h3><p>Gaskets, flanges, fittings and instruments — ask for them all in one quote.</p></div>' +
        '<div class="sr__rel-grid">' + related.map(r => '<button class="rel" data-cat="' + r.slug + '"><span class="rel__img">' + imgTag(IMG + r.imgs[0], r.name) + '</span><span class="mono">' + pad(r.items.length) + ' products</span><b>' + r.name + '</b><i><svg><use href="#arrow"/></svg></i></button>').join('') + '</div>' +
      '</section>' +
      '<button class="sr__next" data-cat="' + next.slug + '"><span class="mono">Next category — ' + pad(((idx + 1) % CATS.length) + 1) + '</span><b>' + next.name + '</b><span class="sr__next-img">' + imgTag(IMG + next.imgs[0], next.name) + '</span></button>';

    applyLinks(srContent);
    $$('#srTabs button').forEach(b => b.classList.toggle('is-on', b.dataset.cat === c.slug));
    const on = $('#srTabs .is-on');
    if (on) { const tabs = $('#srTabs'); tabs.scrollTo({ left: on.offsetLeft - tabs.offsetLeft - 40, behavior: 'smooth' }); }
    srScroll.scrollTop = 0;
    if (fine && !reduce) bindMagnetic($$('.magnetic', srContent));
  }

  function animateIn() {
    if (reduce) return;
    const tl = gsap.timeline();
    tl.from('.sr__title', { yPercent: 40, opacity: 0, duration: 1, ease: 'expo.out' })
      .from('.sr__crumbs, .sr__desc, .sr__facts > div, .sr__ctas > .btn', { y: 30, opacity: 0, duration: 0.9, ease: 'expo.out', stagger: 0.05 }, 0.08)
      .from('.sr__plate', { scale: 0.6, rotate: -25, opacity: 0, duration: 1.3, ease: 'expo.out' }, 0)
      .from('.sr__ring', { scale: 0.8, opacity: 0, duration: 1.4, ease: 'expo.out' }, 0.1)
      .from('.sr__thumbs button', { y: 20, opacity: 0, duration: 0.7, ease: 'expo.out', stagger: 0.04 }, 0.3)
      .from('.sr__trust span', { y: 16, opacity: 0, duration: 0.7, ease: 'expo.out', stagger: 0.05 }, 0.3)
      .from('.sr__grid .pc', { y: 60, opacity: 0, duration: 1, ease: 'expo.out', stagger: 0.05 }, 0.35);
  }

  function applyFilters() {
    let shown = 0;
    const cards = $$('#srGrid .pc');
    cards.forEach(p => {
      const ok = (filt.mat === 'all' || p.dataset.mat === filt.mat) && (filt.spec === 'all' || p.dataset.specs.split('|').includes(filt.spec));
      p.style.display = ok ? '' : 'none'; if (ok) shown++;
    });
    $('#srShowing').textContent = 'Showing ' + shown + ' of ' + cards.length;
    gsap.fromTo(cards.filter(p => p.style.display !== 'none'), { y: 30, opacity: 0 }, { y: 0, opacity: 1, duration: 0.7, ease: 'expo.out', stagger: 0.035 });
  }

  srContent.addEventListener('click', e => {
    const f = e.target.closest('[data-f]');
    if (f) {
      filt[f.dataset.f] = f.dataset.v;
      $$('[data-f="' + f.dataset.f + '"]', srContent).forEach(x => x.classList.toggle('is-on', x === f));
      applyFilters();
      return;
    }
    const t = e.target.closest('[data-feat]');
    if (t) {
      const c = CATS[srIdx];
      $$('[data-feat]', srContent).forEach(x => x.classList.toggle('is-on', x === t));
      $('#srPlate').innerHTML = imgTag(IMG + c.imgs[+t.dataset.feat], c.name);
      gsap.fromTo('#srPlate img', { scale: 0.7, rotate: 12, opacity: 0 }, { scale: 1, rotate: 0, opacity: 1, duration: 0.8, ease: 'expo.out' });
      return;
    }
    const all = e.target.closest('[data-addall]');
    if (all) addAll(CATS[srIdx], all);
    if (e.target.closest('[data-sr-close]')) closeShowroom();
  });
  $$('[data-sr-close]', sr).forEach(b => b.addEventListener('click', closeShowroom));
  $('#srQuote').addEventListener('click', openSheet);

  function openShowroom(idx, srcEl, push) {
    if (sr.classList.contains('is-open')) { switchShowroom(idx, push); return; }
    renderShowroom(idx);
    closeMega(); closeMenu();
    sr.classList.add('is-open'); sr.setAttribute('aria-hidden', 'false');
    document.body.classList.add('is-shop');
    lenis && lenis.stop();
    if (push !== false) history.pushState({ sr: CATS[idx].slug }, '', '#products/' + CATS[idx].slug);
    const W = innerWidth, H = innerHeight;
    let from = 'inset(' + H + 'px 0px 0px 0px round 0px)';
    if (srcEl) {
      const r = srcEl.getBoundingClientRect();
      from = 'inset(' + r.top + 'px ' + (W - r.right) + 'px ' + (H - r.bottom) + 'px ' + r.left + 'px round 22px)';
    }
    if (reduce) { sr.style.clipPath = 'none'; return; }
    gsap.fromTo(sr, { clipPath: from }, { clipPath: 'inset(0px 0px 0px 0px round 0px)', duration: 1, ease: 'expo.inOut', onComplete: () => { sr.style.clipPath = 'none'; } });
    gsap.delayedCall(0.45, animateIn);
  }
  function switchShowroom(idx, push) {
    if (idx === srIdx) { srScroll.scrollTo({ top: 0, behavior: 'smooth' }); return; }
    if (push !== false) history.replaceState({ sr: CATS[idx].slug }, '', '#products/' + CATS[idx].slug);
    gsap.to(srContent, { opacity: 0, y: 30, duration: 0.35, ease: 'power2.in', onComplete: () => {
      renderShowroom(idx);
      gsap.fromTo(srContent, { opacity: 0, y: 0 }, { opacity: 1, duration: 0.3 });
      animateIn();
    } });
  }
  function doCloseShowroom() {
    if (!sr.classList.contains('is-open')) return;
    closeQV();
    const finish = () => {
      sr.classList.remove('is-open'); sr.setAttribute('aria-hidden', 'true');
      sr.style.clipPath = ''; document.body.classList.remove('is-shop');
      srIdx = -1;
      if (/^#products\//.test(location.hash)) history.replaceState(null, '', location.pathname + location.search);
      if (!qs.classList.contains('is-open')) lenis && lenis.start();
    };
    if (reduce) return finish();
    gsap.fromTo(sr, { clipPath: 'inset(0px 0px 0px 0px round 0px)' }, { clipPath: 'inset(0px 0px ' + innerHeight + 'px 0px round 0px)', duration: 0.8, ease: 'expo.inOut', onComplete: finish });
  }
  function closeShowroom() {
    if (history.state && history.state.sr) history.back();
    else doCloseShowroom();
  }
  function hardCloseShowroom() {
    if (!sr.classList.contains('is-open')) return;
    if (history.state && history.state.sr) history.replaceState(null, '', location.pathname + location.search);
    doCloseShowroom();
  }
  const closeDrawer = hardCloseShowroom;
  window.addEventListener('popstate', () => {
    const m = location.hash.match(/^#products\/(.+)$/);
    const i = m ? CATS.findIndex(c => c.slug === m[1]) : -1;
    if (i > -1) openShowroom(i, null, false); else doCloseShowroom();
  });
  const openBySlug = (slug, srcEl) => { const i = CATS.findIndex(c => c.slug === slug); if (i > -1) openShowroom(i, srcEl); };
  document.addEventListener('click', e => {
    const b = e.target.closest('[data-cat]');
    if (b) { e.preventDefault(); closeQV(); openBySlug(b.dataset.cat, b.classList.contains('card') ? b : null); }
  });
  function closeTop() {
    if (qv.classList.contains('is-open')) return closeQV();
    if (qs.classList.contains('is-open')) return closeSheet();
    if (sr.classList.contains('is-open')) return closeShowroom();
    closeMega(); closeMenu();
  }
  document.addEventListener('keydown', e => {
    if (!qv.classList.contains('is-open')) return;
    if (e.key === 'ArrowRight') stepQV(1);
    if (e.key === 'ArrowLeft') stepQV(-1);
  });

  function bindMagnetic(els) {
    els.forEach(b => {
      if (b._mag) return; b._mag = true;
      b.addEventListener('pointermove', e => {
        const r = b.getBoundingClientRect();
        gsap.to(b, { x: (e.clientX - r.left - r.width / 2) * 0.22, y: (e.clientY - r.top - r.height / 2) * 0.32, duration: 0.6, ease: 'power3.out' });
      });
      b.addEventListener('pointerleave', () => gsap.to(b, { x: 0, y: 0, duration: 1, ease: 'elastic.out(1,0.4)' }));
    });
  }

  /* ---------------- Mega menu + footer list ---------------- */
  const nav = $('#nav');
  $('#megaIn').innerHTML = FAMS.map(f =>
    '<div><h6>' + f.name + '</h6>' + CATS.filter(c => c.fam === f.id).map(c =>
      '<button data-cat="' + c.slug + '">' + c.name + '<small>' + pad(c.items.length) + '</small></button>').join('') + '</div>').join('') +
    '<div class="mega__feature"><b>Get a quote</b><p>Call, WhatsApp or visit the counter in Al Quoz. Mon–Sat 7:30am–6:00pm, Sunday closed.</p><a href="#contact" data-scroll>Get a quote <svg><use href="#arrow"/></svg></a></div>';
  $('#footCats').innerHTML = CATS.map(c => '<button data-cat="' + c.slug + '">' + c.name + '</button>').join('');

  const megaBtn = $('#megaBtn');
  function openMega() { nav.classList.add('is-mega'); megaBtn.setAttribute('aria-expanded', 'true'); }
  function closeMega() { nav.classList.remove('is-mega'); megaBtn.setAttribute('aria-expanded', 'false'); }
  megaBtn.addEventListener('click', () => nav.classList.contains('is-mega') ? closeMega() : openMega());
  if (fine) {
    megaBtn.addEventListener('mouseenter', openMega);
    nav.addEventListener('mouseleave', closeMega);
  }

  /* ---------------- Mobile menu ---------------- */
  function closeMenu() { if (document.body.classList.contains('is-menu')) { document.body.classList.remove('is-menu'); lenis && lenis.start(); } }
  $('#burger').addEventListener('click', () => {
    const on = document.body.classList.toggle('is-menu');
    lenis && (on ? lenis.stop() : lenis.start());
  });

  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') closeTop();
    if (e.key === '/' && !/INPUT|TEXTAREA|SELECT/.test(document.activeElement.tagName)) {
      e.preventDefault(); scrollToEl('#catalogue'); setTimeout(() => $('#search').focus({ preventScroll: true }), 900);
    }
  });

  /* ---------------- Catalogue ---------------- */
  const grid = $('#catGrid');
  grid.innerHTML = CATS.map((c, i) => {
    const feature = c.slug === 'ball-valves';
    return '<button class="card' + (feature ? ' card--feature' : '') + '" data-cat="' + c.slug + '" data-fam="' + c.fam + '" data-cursor="Open">' +
      '<div class="card__top mono"><span>' + pad(i + 1) + '</span><span class="card__count">' + pad(c.items.length) + ' items</span></div>' +
      '<div class="card__img"><img data-ph src="' + IMG + c.imgs[0] + '" alt="' + c.name + '" decoding="async" fetchpriority="low" ></div>' +
      '<h3>' + c.name + '</h3><p>' + c.desc + '</p>' +
      '<span class="card__go"><svg><use href="#arrow"/></svg></span></button>';
  }).join('');
  $$('.card', grid).forEach(card => card.addEventListener('pointermove', e => {
    const r = card.getBoundingClientRect();
    card.style.setProperty('--mx', (e.clientX - r.left) + 'px');
    card.style.setProperty('--my', (e.clientY - r.top) + 'px');
  }));

  const chips = $('#famChips');
  chips.innerHTML = '<button class="chip is-on" data-fam="all">All <small>18</small></button>' +
    FAMS.map(f => '<button class="chip" data-fam="' + f.id + '">' + f.name + ' <small>' + pad(CATS.filter(c => c.fam === f.id).length) + '</small></button>').join('');
  chips.addEventListener('click', e => {
    const b = e.target.closest('.chip'); if (!b) return;
    $$('.chip', chips).forEach(x => x.classList.toggle('is-on', x === b));
    const fam = b.dataset.fam;
    $('#search').value = ''; showResults('');
    const cards = $$('.card', grid);
    cards.forEach(c => { c.style.display = (fam === 'all' || c.dataset.fam === fam) ? '' : 'none'; });
    gsap.fromTo(cards.filter(c => c.style.display !== 'none'), { y: 40, opacity: 0 }, { y: 0, opacity: 1, duration: 0.8, ease: 'expo.out', stagger: 0.04 });
    ScrollTrigger.refresh();
  });

  const results = $('#catResults');
  function showResults(q) {
    q = q.trim().toLowerCase();
    if (q.length < 2) { results.hidden = true; grid.hidden = false; ScrollTrigger.refresh(); return; }
    const toks = q.split(/\s+/);
    const hits = [];
    CATS.forEach(c => c.items.forEach((it, i) => {
      const hay = (it[0] + ' ' + it[1].join(' ') + ' ' + it[2] + ' ' + c.name).toLowerCase();
      if (toks.every(t => hay.includes(t))) hits.push([c, i]);
    }));
    grid.hidden = true; results.hidden = false;
    const safe = q.replace(/[<>&"]/g, '');
    results.innerHTML = '<div class="res-head mono"><span>' + hits.length + ' result' + (hits.length === 1 ? '' : 's') + ' for “' + safe + '”</span><span>Across 18 categories</span></div>' +
      (hits.length ? hits.map(h => rowHTML(h[0], h[1], true)).join('') : '<div class="res-empty">Nothing matched — try a material (S.S, C.I, brass), a rating (PN16, 3000#) or a connection (NPT, flanged).</div>');
    ScrollTrigger.refresh();
  }
  $('#search').addEventListener('input', e => showResults(e.target.value));

  /* ---------------- Oilfield brands ---------------- */
  const BRANDS = window.FT_BRANDS || [];
  $('#brandsGrid').innerHTML = BRANDS.map((b, i) =>
    '<button class="btile" data-brand="' + b.name + '" data-cursor="Quote">' +
      '<span class="btile__no mono">' + pad(i + 1) + '</span>' +
      '<span class="btile__mark">' + (b.logo ? '<img src="' + b.logo + '" alt="' + b.name + '" decoding="async">' : '<span class="btile__word' + (b.name.length > 12 ? ' is-long' : '') + '">' + b.name.replace(/-/g, '‑') + '</span>') + '</span>' +
      '<span class="btile__foot"><span class="mono">' + (b.logo ? b.name : 'Oilfield brand') + '</span><b>Get a quote <svg><use href="#arrow"/></svg></b></span>' +
    '</button>').join('');
  $('#brandsGrid').addEventListener('click', e => {
    const t = e.target.closest('[data-brand]'); if (!t) return;
    const msg = $('#fMsg');
    const line = 'Quote request — ' + t.dataset.brand + ': ';
    if (!msg.value.includes(line)) msg.value = (msg.value ? msg.value.trim() + String.fromCharCode(10) : '') + line;
    toast(t.dataset.brand + ' added to your enquiry');
    scrollToEl('#contact');
  });

  /* ---------------- Gauges ---------------- */
  $$('.gauge').forEach((g, gi) => {
    const val = +g.dataset.value, scale = +g.dataset.scale, majors = +g.dataset.majors, isTime = g.dataset.type === 'time';
    const fill = val / scale;
    const cx = 110, cy = 110, r = 88;
    const pt = (a, rr) => [cx + rr * Math.cos(a * Math.PI / 180), cy + rr * Math.sin(a * Math.PI / 180)];
    const arc = (a0, a1, rr) => { const p0 = pt(a0, rr), p1 = pt(a1, rr); return 'M' + p0[0] + ' ' + p0[1] + ' A' + rr + ' ' + rr + ' 0 ' + (a1 - a0 > 180 ? 1 : 0) + ' 1 ' + p1[0] + ' ' + p1[1]; };
    const minor = majors * 5;
    let ticks = '';
    for (let i = 0; i <= minor; i++) {
      const a = 135 + 270 * i / minor, maj = i % 5 === 0;
      const p0 = pt(a, maj ? 64 : 69), p1 = pt(a, 75);
      ticks += '<line class="g-tick' + (maj ? ' maj' : '') + '" x1="' + p0[0] + '" y1="' + p0[1] + '" x2="' + p1[0] + '" y2="' + p1[1] + '"/>';
      if (maj) { const pn = pt(a, 53); ticks += '<text class="g-num" x="' + pn[0] + '" y="' + (pn[1] + 3) + '">' + Math.round(scale * i / minor) + '</text>'; }
    }
    g.innerHTML =
      '<svg viewBox="0 0 220 190">' +
      (gi === 0 ? '<defs><linearGradient id="gGrad" x1="0" x2="1"><stop offset="0" stop-color="#084767"/><stop offset=".7" stop-color="#b91a20"/><stop offset="1" stop-color="#e0303a"/></linearGradient></defs>' : '') +
      '<path class="g-track" d="' + arc(135, 405, r) + '"/>' +
      '<path class="g-prog" pathLength="1" d="' + arc(135, 405, r) + '"/>' +
      '<path class="g-red" d="' + arc(378, 405, 97) + '"/>' + ticks +
      '<g class="g-needle-wrap"><g class="g-needle-g"><polygon class="g-needle" points="-12,0 0,-3.2 76,0 0,3.2" transform="translate(110 110)"/></g></g>' +
      '<circle class="g-cap" cx="110" cy="110" r="7"/>' +
      '</svg><div class="gauge__val"><b><span class="n">' + (isTime ? '0:00' : '00') + '</span><sup class="s">' + (isTime ? 'am' : '') + '</sup></b><span class="mono">' + g.dataset.label + '</span></div>';
    const needle = $('.g-needle-g', g), prog = $('.g-prog', g), num = $('.n', g), sup = $('.s', g), wrap = $('.g-needle-wrap', g);
    const show = v => {
      if (isTime) { const t = fmtHour(Math.round(v * 4) / 4); num.textContent = t.slice(0, -2); sup.textContent = t.slice(-2); }
      else num.textContent = pad(Math.round(v));
    };
    gsap.set(needle, { rotation: 135, svgOrigin: '110 110' });
    ScrollTrigger.create({
      trigger: g, start: 'top 85%', once: true,
      onEnter: () => {
        g.classList.add('is-on');
        const o = { v: 0 };
        gsap.to(o, { v: 1, duration: 2.6, ease: 'expo.out', delay: gi * 0.12, onUpdate: () => { show(val * o.v); prog.style.strokeDashoffset = 1 - fill * o.v; } });
        gsap.to(needle, { rotation: 135 + 270 * fill, svgOrigin: '110 110', duration: 2.4, ease: 'elastic.out(1, 0.45)', delay: gi * 0.12 });
      }
    });
  });

  /* ---------------- Split helpers ---------------- */
  function splitWords(el, cls) {
    const walk = node => {
      Array.from(node.childNodes).forEach(n => {
        if (n.nodeType === 3) {
          const frag = document.createDocumentFragment();
          n.textContent.split(/(\s+)/).forEach(part => {
            if (!part) return;
            if (/^\s+$/.test(part)) { frag.appendChild(document.createTextNode(' ')); return; }
            if (cls) { const s = document.createElement('span'); s.className = cls; s.textContent = part; frag.appendChild(s); return; }
            const o = document.createElement('span'); o.className = 'sw';
            const i = document.createElement('span'); i.textContent = part; o.appendChild(i); frag.appendChild(o);
          });
          n.replaceWith(frag);
        } else if (n.nodeType === 1 && n.tagName !== 'BR') walk(n);
      });
    };
    walk(el);
    return cls ? $$('.' + cls, el) : $$('.sw > span', el);
  }

  /* ---------------- Ticker tapes ---------------- */
  let tapes = [], tapesOn = true;
  new IntersectionObserver(es => { tapesOn = es[0].isIntersecting; }, { rootMargin: '100px' }).observe($('.tickers'));
  function setupTapes() {
    tapes = [];
    $$('.tape').forEach(t => {
      const tr = $('.tape__track', t);
      if (!tr._unit) tr._unit = tr.innerHTML;
      tr.innerHTML = tr._unit;
      const uw = tr.scrollWidth;
      const n = Math.ceil(innerWidth * 1.3 / uw) + 1;
      tr.innerHTML = tr._unit.repeat(n + 1);
      tapes.push({ t, tr, uw, x: -Math.random() * uw, sp: +t.dataset.speed, dir: +t.dataset.dir });
    });
  }
  gsap.ticker.add((time, dt) => {
    if (!tapesOn) return;
    const v = lenis ? lenis.velocity : 0;
    tapes.forEach(o => {
      const boost = 1 + Math.min(8, Math.abs(v) * 0.22);
      const d = o.dir * (v < -0.3 ? -1 : 1);
      o.x += d * o.sp * boost * dt / 1000;
      if (o.x <= -o.uw) o.x += o.uw;
      if (o.x > 0) o.x -= o.uw;
      o.tr.style.transform = 'translate3d(' + o.x.toFixed(2) + 'px,0,0)';
    });
  });

  /* ---------------- Clock + open status ---------------- */
  const tickG = $('.clock-ticks');
  if (tickG) {
    let s = '';
    for (let i = 0; i < 12; i++) { const a = i * 30 * Math.PI / 180; s += '<line x1="' + (50 + Math.sin(a) * 38) + '" y1="' + (50 - Math.cos(a) * 38) + '" x2="' + (50 + Math.sin(a) * 43) + '" y2="' + (50 - Math.cos(a) * 43) + '"/>'; }
    tickG.innerHTML = s;
  }
  function tickClock() {
    const p = dubaiParts(), st = openState(p);
    $$('.js-clock').forEach(e => { e.textContent = p.hour + ':' + p.minute; });
    $$('.js-clock-long').forEach(e => { e.textContent = p.hour + ':' + p.minute + ':' + p.second; });
    $$('.js-date').forEach(e => { e.textContent = p.weekday + ' ' + p.day + ' ' + p.month + ' · GST (UTC+4)'; });
    $$('.js-open, .js-open-pill').forEach(e => { e.textContent = st.text; e.classList.toggle('st-open', st.open); e.classList.toggle('st-closed', !st.open); });
    const h = +p.hour % 12, m = +p.minute, s = +p.second;
    const set = (sel, deg) => { const el = $(sel); if (el) el.setAttribute('transform', 'rotate(' + deg + ' 50 50)'); };
    set('.clock-face .hh', h * 30 + m * 0.5); set('.clock-face .mm', m * 6 + s * 0.1); set('.clock-face .ss', s * 6);
  }
  tickClock(); setInterval(tickClock, 1000);
  $$('.js-year').forEach(e => { e.textContent = new Date().getFullYear(); });

  /* ---------------- Quote form → WhatsApp or email ---------------- */
  const form = $('#form');
  function formMessage() {
    const v = id => $(id).value.trim();
    const lines = ['Hello Fakhri Tools, I would like a quote.', '', 'Name: ' + v('#fName'), 'Mobile: ' + v('#fMobile')];
    if (v('#fCompany')) lines.push('Company: ' + v('#fCompany'));
    if (v('#fEmail')) lines.push('Email: ' + v('#fEmail'));
    if (v('#fMsg')) lines.push('', v('#fMsg'));
    if (rfq.size) lines.push('', 'Items:', ...[...rfq].map(([id, q]) => lineText(itemOf(id), q)));
    return lines.join('\n');
  }
  function validForm() {
    const checks = [['#fName', v => v.trim().length > 1], ['#fMobile', v => v.replace(/\D/g, '').length >= 7]];
    let ok = true;
    checks.forEach(([s, fn]) => {
      const el = $(s, form), field = el.closest('.field');
      field.classList.remove('is-err'); void field.offsetWidth;
      if (!fn(el.value)) { field.classList.add('is-err'); ok = false; }
    });
    if (!ok) toast('Please add your name and mobile number');
    return ok;
  }
  function send(how) {
    if (!validForm()) return;
    const msg = formMessage();
    if (how === 'wa') {
      const u = waUrl(msg);
      if (!u) return toast('[WhatsApp number] not added yet — please call ' + PHONE);
      window.open(u, '_blank', 'noopener');
    } else {
      if (!CFG.email) return toast('[Email address] not added yet — please call ' + PHONE);
      location.href = 'mailto:' + CFG.email + '?subject=' + encodeURIComponent('Quote request — Fakhri Tools') + '&body=' + encodeURIComponent(msg);
    }
  }
  form.addEventListener('submit', e => { e.preventDefault(); send('wa'); });
  $('[data-send="email"]', form).addEventListener('click', () => send('email'));
  if (!CFG.email) $('[data-send="email"]', form).hidden = true;

  /* ---------------- Nav state ---------------- */
  let lastY = 0;
  function onScroll(y) {
    nav.classList.toggle('is-scrolled', y > 40);
    const down = y > lastY;
    if (y > 500 && down && !nav.classList.contains('is-mega') && Math.abs(y - lastY) > 2) nav.classList.add('is-hidden');
    else if (!down) nav.classList.remove('is-hidden');
    lastY = y;
  }
  if (lenis) lenis.on('scroll', e => onScroll(e.scroll)); else window.addEventListener('scroll', () => onScroll(scrollY), { passive: true });

  ['about', 'sectors', 'catalogue', 'brands', 'how', 'network', 'contact'].forEach(id => {
    const sec = document.getElementById(id); if (!sec) return;
    ScrollTrigger.create({
      trigger: sec, start: 'top 50%', end: 'bottom 50%',
      onToggle: s => {
        if (!s.isActive) return;
        $$('.nav__links a').forEach(a => a.classList.toggle('is-active', a.getAttribute('href') === '#' + id));
      }
    });
  });

  /* ---------------- Cursor + magnetic ---------------- */
  if (fine && !reduce) {
    const cur = $('.cursor'), ring = $('.cursor__ring'), dot = $('.cursor__dot'), txt = $('.cursor__txt');
    const pos = { x: innerWidth / 2, y: innerHeight / 2 }, rp = { x: pos.x, y: pos.y };
    window.addEventListener('pointermove', e => {
      pos.x = e.clientX; pos.y = e.clientY;
      dot.style.transform = 'translate(' + pos.x + 'px,' + pos.y + 'px)';
    }, { passive: true });
    gsap.ticker.add(() => {
      rp.x += (pos.x - rp.x) * 0.18; rp.y += (pos.y - rp.y) * 0.18;
      ring.style.transform = 'translate(' + rp.x + 'px,' + rp.y + 'px)';
    });
    document.addEventListener('mouseover', e => {
      const lab = e.target.closest('[data-cursor]');
      const hov = e.target.closest('a,button,input,textarea,select,label,#globe');
      cur.classList.toggle('is-label', !!lab);
      cur.classList.toggle('is-hover', !lab && !!hov);
      txt.textContent = lab ? lab.dataset.cursor : '';
    });
    bindMagnetic($$('.magnetic'));
  }

  /* ================= Scroll choreography ================= */
  gsap.set('.hero__title .line > span', { yPercent: 115, rotate: 3 });
  gsap.set(['.hero__eyebrow', '.hero__sub', '.hero__ctas', '.hero__hud > *'], { opacity: 0, y: 30 });

  function heroIntro() {
    const tl = gsap.timeline();
    tl.to('.hero__title .line > span', { yPercent: 0, rotate: 0, duration: 1.5, ease: 'expo.out', stagger: 0.11 })
      .to('.hero__eyebrow', { opacity: 1, y: 0, duration: 1, ease: 'expo.out' }, 0.15)
      .to(['.hero__sub', '.hero__ctas'], { opacity: 1, y: 0, duration: 1.2, ease: 'expo.out', stagger: 0.1 }, 0.45)
      .to('.hero__hud > *', { opacity: 1, y: 0, duration: 1, ease: 'expo.out', stagger: 0.06 }, 0.65)
      .fromTo('.nav', { yPercent: -100 }, { yPercent: 0, duration: 1.2, ease: 'expo.out', clearProps: 'transform' }, 0.2);
    window.FT3D && window.FT3D.intro();
  }

  function setupScroll() {
    gsap.to('.hero__content', { yPercent: -18, opacity: 0, ease: 'none', scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom 20%', scrub: true } });
    gsap.to('.atmos', { opacity: 0.35, ease: 'none', scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true } });

    $$('[data-split]').forEach(el => {
      const w = splitWords(el);
      gsap.from(w, { yPercent: 115, duration: 1.2, ease: 'expo.out', stagger: 0.05, scrollTrigger: { trigger: el, start: 'top 86%' } });
    });
    $$('[data-words]').forEach(el => {
      const w = splitWords(el, 'w');
      gsap.to(w, { opacity: 1, ease: 'none', stagger: 0.1, scrollTrigger: { trigger: el, start: 'top 78%', end: 'bottom 42%', scrub: true } });
    });

    gsap.set('[data-reveal]', { opacity: 0, y: 40 });
    ScrollTrigger.batch('[data-reveal]', { start: 'top 90%', once: true, onEnter: b => gsap.to(b, { opacity: 1, y: 0, duration: 1.1, ease: 'expo.out', stagger: 0.08 }) });

    gsap.set('.btile', { opacity: 0, y: 50 });
    ScrollTrigger.batch('.btile', { start: 'top 92%', once: true, onEnter: b => gsap.to(b, { opacity: 1, y: 0, duration: 1, ease: 'expo.out', stagger: 0.06 }) });
    gsap.set('.card', { opacity: 0, y: 70 });
    ScrollTrigger.batch('.card', { start: 'top 94%', once: true, onEnter: b => gsap.to(b, { opacity: 1, y: 0, duration: 1.1, ease: 'expo.out', stagger: 0.06 }) });

    const mm = gsap.matchMedia();
    const artEls = $$('.sector__art *').filter(e => e.tagName !== 'g');
    artEls.forEach(e => { e.setAttribute('pathLength', '1'); e.style.strokeDasharray = '1'; e.style.strokeDashoffset = '1'; });
    mm.add('(min-width: 900px)', () => {
      const track = $('.sectors__track'), sec = $('.sectors'), bar = $('.sectors__progress i');
      const dist = () => track.scrollWidth - innerWidth;
      const tw = gsap.to(track, {
        x: () => -dist(), ease: 'none',
        scrollTrigger: { trigger: sec, start: 'top top', end: () => '+=' + dist(), pin: true, anticipatePin: 1, scrub: 0.7, invalidateOnRefresh: true, onUpdate: s => { bar.style.transform = 'scaleX(' + s.progress + ')'; } }
      });
      $$('.sector:not(.sector--intro)').forEach(p => {
        const els = $$('.sector__art *', p).filter(e => e.tagName !== 'g');
        gsap.to(els, { strokeDashoffset: 0, ease: 'none', stagger: 0.015, scrollTrigger: { trigger: p, containerAnimation: tw, start: 'left 100%', end: 'left 82%', scrub: true } });
        gsap.from($$('h3, p, .tags', p), { y: 50, opacity: 0, stagger: 0.08, duration: 1.1, ease: 'expo.out', scrollTrigger: { trigger: p, containerAnimation: tw, start: 'left 92%' } });
        gsap.fromTo($('.sector__num', p), { x: 160 }, { x: -80, ease: 'none', scrollTrigger: { trigger: p, containerAnimation: tw, start: 'left right', end: 'right left', scrub: true } });
      });
    });
    mm.add('(max-width: 899px)', () => {
      $$('.sector:not(.sector--intro)').forEach(p => {
        const els = $$('.sector__art *', p).filter(e => e.tagName !== 'g');
        gsap.to(els, { strokeDashoffset: 0, duration: 1.4, ease: 'power2.out', stagger: 0.01, scrollTrigger: { trigger: $('.sector__art', p), start: 'top 92%', once: true } });
      });
    });

    const steps = $$('.anatomy__steps p');
    ScrollTrigger.create({
      trigger: '#anatomy', start: 'top top', end: '+=240%', pin: true, anticipatePin: 1,
      onUpdate: s => {
        const p = s.progress;
        window.FT3D && window.FT3D.setAnatomy(p);
        const idx = p < 0.22 ? 0 : p < 0.62 ? 1 : 2;
        steps.forEach((x, i) => x.classList.toggle('is-active', i === idx));
        const e = clamp((p - 0.1) / 0.5, 0, 1);
        $('#explodeVal').textContent = Math.round(100 - e * 100) + '%';
        $('#explodeBar').style.transform = 'scaleX(' + (1 - e) + ')';
      }
    });

    const cards = $$('.why__card');
    cards.forEach(c => { const sh = document.createElement('i'); sh.className = 'why__shade'; c.appendChild(sh); });
    cards.forEach((card, i) => {
      if (i === cards.length - 1) return;
      gsap.to(card, { scale: 0.9 + i * 0.025, ease: 'none',
        scrollTrigger: { trigger: cards[i + 1], start: 'top 85%', end: 'top 25%', scrub: true } });
      gsap.to($('.why__shade', card), { opacity: 0.5, ease: 'none',
        scrollTrigger: { trigger: cards[i + 1], start: 'top 85%', end: 'top 25%', scrub: true } });
    });

    gsap.fromTo('.pipe__fill', { scaleY: 0 }, { scaleY: 1, ease: 'none', scrollTrigger: { trigger: '.timeline', start: 'top 65%', end: 'bottom 65%', scrub: true } });
    $$('.ms').forEach(m => ScrollTrigger.create({ trigger: m, start: 'top 65%', onEnter: () => m.classList.add('is-on'), onLeaveBack: () => m.classList.remove('is-on') }));

    gsap.from('.contact__grid > *', { y: 60, opacity: 0, duration: 1.2, ease: 'expo.out', stagger: 0.12, scrollTrigger: { trigger: '.contact__grid', start: 'top 85%' } });
  }

  /* ---------------- Anchors ---------------- */
  function bindAnchors() {
    $$('[data-scroll]').forEach(a => a.addEventListener('click', e => {
      e.preventDefault();
      const href = a.getAttribute('href');
      closeMenu(); closeMega(); hardCloseShowroom();
      setTimeout(() => scrollToEl(href), 60);
    }));
  }

  /* ---------------- Loader ---------------- */
  function runLoader() {
    const L = $('#loader');
    const finish = () => {
      L && L.remove();
      document.body.classList.remove('is-loading');
      lenis && lenis.start();
      ScrollTrigger.refresh();
    };
    if (reduce || !L) { heroIntro(); finish(); return; }
    lenis && lenis.stop();
    const num = $('#loaderNum'), bar = $('#loaderBar');
    const o = { v: 0 };
    gsap.timeline()
      .from('.loader__mark', { scale: 0.4, rotate: -45, opacity: 0, duration: 1.3, ease: 'expo.out' }, 0)
      .to(o, { v: 100, duration: 2.3, ease: 'power2.inOut', onUpdate: () => {
        num.textContent = String(Math.round(o.v)).padStart(3, '0');
        bar.style.transform = 'scaleX(' + o.v / 100 + ')';
      } }, 0)
      .to('.loader__inner', { opacity: 0, y: -24, duration: 0.5, ease: 'power2.in' }, 2.45)
      .add(() => L.classList.add('is-open'), 2.6)
      .to('.loader__half--top', { yPercent: -100, duration: 1.25, ease: 'expo.inOut' }, 2.75)
      .to('.loader__half--bot', { yPercent: 100, duration: 1.25, ease: 'expo.inOut' }, 2.75)
      .add(heroIntro, 3.05)
      .add(finish, 4.0);
  }

  /* ---------------- Boot ---------------- */
  applyLinks(document);
  syncRfq(false);
  bindAnchors();
  setupScroll();
  runLoader();
  const deep = location.hash.match(/^#products\/(.+)$/);
  if (deep) {
    const di = CATS.findIndex(c => c.slug === deep[1]);
    if (di > -1) setTimeout(() => openShowroom(di, null, false), reduce ? 0 : 4100);
  }
  const fontsReady = document.fonts && document.fonts.ready ? document.fonts.ready : Promise.resolve();
  fontsReady.then(() => { setupTapes(); ScrollTrigger.refresh(); });
  let rsT; window.addEventListener('resize', () => { clearTimeout(rsT); rsT = setTimeout(() => { setupTapes(); }, 200); });
  window.addEventListener('load', () => ScrollTrigger.refresh());
})();
