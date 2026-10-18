/* Fakhri Tools: products-only site.
   The product list is read live from the main site (the same js/data.js the product editor saves), so every editor
   save shows up here too. If the main site can't be reached, the copy in this folder (js/data.js) is used.
   Size, specs & ratings and material choices work the same way as on the main site (js/choices.js and the size rules below). */
(function () {
  'use strict';
  const LIVE = 'https://azizmoiz504-dotcom.github.io/Nocturne/';
  const WA = '971522767034';
  const EMAIL = 'dxbsales@ftools.com';
  const OPEN = { days: [1, 2, 3, 4, 5, 6], from: 7.5, to: 18 };   // Monday to Saturday, 7:30am to 6:00pm, Dubai time
  const $ = (s, r) => (r || document).querySelector(s), $$ = (s, r) => [...(r || document).querySelectorAll(s)];
  const esc = s => String(s).replace(/[&<>"]/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[ch]));
  const waUrl = t => 'https://wa.me/' + WA + (t ? '?text=' + encodeURIComponent(t) : '');
  const mailUrl = (subject, body) => 'mailto:' + EMAIL + '?subject=' + encodeURIComponent(subject) + (body ? '&body=' + encodeURIComponent(body) : '');
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

  let toastT;
  function toast(msg) {
    const t = $('#toast'); t.textContent = msg; t.classList.add('is-on');
    clearTimeout(toastT); toastT = setTimeout(() => t.classList.remove('is-on'), 2600);
  }

  /* ---------- load the product list: live first, then the copy here ---------- */
  function load(src) {
    return new Promise((ok, no) => {
      const s = document.createElement('script');
      s.src = src; s.onload = ok; s.onerror = no;
      document.head.appendChild(s);
    });
  }
  const bust = Math.floor(Date.now() / 300000);   // a fresh copy every 5 minutes
  const live = f => load(LIVE + 'js/' + f + '?t=' + bust).then(() => true, () => load('js/' + f).then(() => false));
  Promise.all([live('data.js'), live('choices.js')])
    .then(start)
    .catch(() => { $('#loading').textContent = 'Products could not load. Please check your internet and refresh.'; });

  function start() {
    const IMG = LIVE + (window.FT_IMG || 'assets/products/');
    // never show asbestos products (banned in the UAE)
    const CATS = (window.FT_CATS || []).map(c => Object.assign({}, c, { items: c.items.filter(it => !/asbestos/i.test(it[0] + ' ' + (it[1] || []).join(' ') + ' ' + (it[4] || ''))) }))
      .filter(c => c.items.length);
    const CH = window.FT_CHOICES;
    const total = CATS.reduce((n, c) => n + c.items.length, 0);
    $('#statProducts').textContent = total;
    $('#statRanges').textContent = CATS.length;
    $('#loading').hidden = true;

    const catBy = s => CATS.find(c => c.slug === s);
    function itemOf(key) {
      const parts = String(key).split('|'), [slug, i] = parts[0].split(':'), c = catBy(slug);
      if (!c || !c.items[+i]) return null;
      const it = c.items[+i];
      return { id: slug + ':' + (+i), c, i: +i, name: it[0], chips: it[1] || [], size: it[2] || '', img: it[3] ? IMG + it[3] : '', matSet: it[4] || '',
        pick: parts.length > 1 ? parts[1] : null, specPick: parts[2] ? parts[2].split('¦') : [], matPick: parts[3] || '' };
    }
    const thumbOf = src => src.startsWith(IMG) ? LIVE + 'assets/thumbs/' + src.slice(IMG.length).replace(/\.\w+$/, '.webp') : src;
    const LOGO_PH = '<img class="noimg" src="assets/emblem.png" alt="">';
    // small photo in lists; if the small copy is missing, the full photo is used
    const thumbTag = (src, alt) => src ? '<img src="' + esc(thumbOf(src)) + '" data-full="' + esc(src) + '" alt="' + esc(alt) + '" loading="lazy" decoding="async">' : LOGO_PH;
    document.addEventListener('error', e => {
      const im = e.target;
      if (im.tagName !== 'IMG') return;
      if (im.dataset.full && im.src !== im.dataset.full) { im.src = im.dataset.full; return; }
      if (!im.classList.contains('noimg')) { im.removeAttribute('data-full'); im.className = 'noimg'; im.src = 'assets/emblem.png'; }
    }, true);

    /* ---------- material (same rules as the main site) ---------- */
    const MATS = [['Bronze', /bronze/i], ['Brass', /brass/i], ['Stainless', /\bS\.S\b|\bSS(?:3\d\d\w*)?\b|[Ss]tainless/], ['Carbon steel', /\bC\.S\b|\bCS\b|[Ff]orged [Ss]teel/], ['Cast iron', /\bC\.I\b|\bCI\b/], ['Galvanised', /\bG\.I\b|\bGI\b/], ['Mild steel', /\bM\.S\b|\bMS\b/], ['Aluminium', /alumin/i], ['Rubber', /rubber|neoprene/i], ['PVC', /\bPVC\b/]];
    function materialOf(name) {
      let best = null, at = 1e9;
      MATS.forEach(([m, r]) => { const k = name.search(r); if (k > -1 && k < at) { at = k; best = m; } });
      return best;
    }
    const ownMat = o => o.matSet !== 'Other' ? o.matSet : '';
    const matText = o => ownMat(o) || (/^C\.S & S\.S/.test(o.name) ? 'Carbon steel, Stainless' : materialOf(o.name) || '');

    /* ---------- sizes (same rules as the main site) ---------- */
    const LADDER = ['⅛"', '¼"', '⅜"', '½"', '¾"', '1"', '1¼"', '1½"', '2"', '2½"', '3"', '3½"', '4"', '5"', '6"', '8"', '10"', '12"', '14"', '16"', '18"', '20"', '22"', '24"', '26"', '28"', '30"', '32"', '34"', '36"', '40"', '42"', '48"'];
    const rung = t => LADDER.indexOf(t);
    const IN = '(\\d*[⅛¼⅜½¾]?"|\\d+\\/\\d+")';
    const RX_RANGE = new RegExp('^' + IN + ' – ' + IN + '$'), RX_PAIR = new RegExp('^' + IN + ' × ' + IN + ' – ' + IN + ' × ' + IN + '$'), RX_RANGEX = new RegExp('^' + IN + ' – ' + IN + ' × ' + IN + '$');
    function ladder(a, b, fam) {
      const i = rung(a), j = b === 'any' ? LADDER.length - 1 : rung(b);
      if (i < 0 || j < i) return null;
      return LADDER.slice(i, j + 1).filter(t => t !== '3½"' || fam === 'fittings' || t === a || t === b);
    }
    const SPEC = new Map();
    function sizeSpec(o) {
      if (SPEC.has(o.id)) return SPEC.get(o.id);
      let s = o.size || '', len = '', note = '', sp = null, m;
      const dot = s.split(' · ');
      if (dot.length > 1) { s = dot[0]; if (/–/.test(dot[1])) len = dot[1]; else note = dot[1]; }
      if (!s) sp = { t: 'text', hint: '' };
      else if (/ – any size$/.test(s)) { const l = ladder(s.split(' – ')[0], 'any', o.c.fam); if (l) sp = { t: 'sel', opts: l, ph: l[0] + ' – ' + l[l.length - 1] }; }
      else if ((m = s.match(RX_PAIR)) && m[1] === m[2] && m[3] === m[4]) { const l = ladder(m[1], m[3], o.c.fam); if (l) sp = { t: 'sel', opts: l, ph: m[1] + ' – ' + m[3] }; }
      else if (m) { const L = ladder(m[1], m[3], o.c.fam), S = ladder(m[2], m[4], o.c.fam); if (L && S) sp = { t: 'pair', L, S, lt: rung(m[1]) > rung(m[2]) && rung(m[3]) > rung(m[4]) }; }
      else if ((m = s.match(RX_RANGEX))) {
        const l = ladder(m[1], m[2], o.c.fam);
        if (l && rung(m[3]) > -1 && rung(m[3]) < rung(m[2])) sp = { t: 'sel', opts: l.concat(m[2] + ' × ' + m[3]), ph: m[1] + ' – ' + m[2] };
        else if (l) { sp = { t: 'sel', opts: l, ph: m[1] + ' – ' + m[2] }; len = 'up to ' + m[3]; }
      }
      else if ((m = s.match(RX_RANGE))) { const l = ladder(m[1], m[2], o.c.fam); if (l) sp = { t: 'sel', opts: l, ph: m[1] + ' – ' + m[2] }; }
      else if (/, | \/ /.test(s)) sp = { t: 'sel', opts: s.replace(/ bottom connection$/, '').split(/, | \/ /) };
      else if (!/–|TO/.test(s)) sp = { t: 'one', v: s };
      if (!sp) sp = { t: 'text', hint: s };
      sp.len = len; sp.note = note;
      SPEC.set(o.id, sp);
      return sp;
    }
    const defaultPick = o => { const sp = sizeSpec(o); return sp.t === 'one' ? sp.v : (o.size ? '?' : ''); };
    const btn = (attr, v, on, lab, dis) => '<button type="button" class="cho' + (on ? ' is-on' : '') + '" ' + attr + '="' + esc(v) + '" aria-pressed="' + !!on + '"' + (dis ? ' disabled' : '') + '>' + esc(lab || v) + '</button>';
    const fixed = v => '<span class="cho is-on is-fixed">' + esc(v) + '</span>';
    const group = (cls, lab, hint, body, note) => '<div class="chg chg--' + cls + '"><p class="chg__lab"><span class="lab">' + lab + '</span>' + (hint ? '<small>' + esc(hint) + '</small>' : '') + '</p>' +
      '<div class="chg__opts">' + body + '</div>' + (note ? '<small class="chg__note">' + esc(note) + '</small>' : '') + '</div>';
    function sizeChoiceHTML(o, cur) {
      const sp = sizeSpec(o), [base, len] = (cur || '').split(' · ');
      if (!o.size && sp.t === 'text') return '';
      let h = '', hint = '';
      if (sp.t === 'one') h = fixed(sp.v);
      else if (sp.t === 'sel') { hint = sp.ph || ''; h = sp.opts.map(v => btn('data-pk-a', v, v === base)).join('') + btn('data-pk-a', '?', base === '?', 'Not sure'); }
      else if (sp.t === 'pair') {
        const [a, b] = base && base !== '?' ? base.split(' × ') : ['', ''], lim = sp.lt && a ? rung(a) : 99;
        hint = sp.L[0] + ' × ' + sp.S[0] + ' – ' + sp.L[sp.L.length - 1] + ' × ' + sp.S[sp.S.length - 1];
        h = '<div class="chg__row"><span class="lab">' + (sp.lt ? 'Big end' : 'First') + '</span><div>' + sp.L.map(v => btn('data-pk-a', v, v === a || (sp.L.length === 1 && base !== '?'))).join('') + '</div></div>' +
          '<div class="chg__row"><span class="lab">' + (sp.lt ? 'Small end' : 'Second') + '</span><div>' + sp.S.map(v => btn('data-pk-b', v, v === b, '', sp.lt && rung(v) >= lim)).join('') + '</div></div>' +
          btn('data-pk-a', '?', base === '?', 'Not sure');
      } else h = '<input data-pk="t" type="text" maxlength="40" value="' + esc(base && base !== '?' ? base : '') + '" placeholder="' + esc('Type size (' + sp.hint + ')') + '" aria-label="Size">';
      if (sp.len) h += '<input data-pk="len" type="text" maxlength="30" value="' + esc(len || '') + '" placeholder="Length (' + esc(sp.len) + ')" aria-label="Length">';
      return group('size', 'Size', hint, h, sp.note);
    }
    const setOn = (b, on) => { b.classList.toggle('is-on', on); b.setAttribute('aria-pressed', on); };
    function tidyPair(root, o) {
      const sp = sizeSpec(o); if (sp.t !== 'pair' || !sp.lt) return;
      const a = $('[data-pk-a].is-on', root), big = sp.L.length === 1 ? sp.L[0] : a ? a.dataset.pkA : '', lim = big && big !== '?' ? rung(big) : 99;
      $$('[data-pk-b]', root).forEach(b => { b.disabled = rung(b.dataset.pkB) >= lim; if (b.disabled && b.classList.contains('is-on')) setOn(b, false); });
    }
    function readPick(root, o) {
      const sp = sizeSpec(o), g = k => { const el = $('[data-pk="' + k + '"]', root); return el ? el.value.trim() : ''; };
      const on = k => { const el = $('[data-pk-' + k + '].is-on', root); return el ? el.getAttribute('data-pk-' + k) : ''; };
      let v;
      if (sp.t === 'one') v = sp.v;
      else if (sp.t === 'sel') { v = on('a'); if (!v) return { ok: false }; }
      else if (sp.t === 'pair') {
        const a = on('a') === '?' ? '?' : sp.L.length === 1 ? sp.L[0] : on('a'), b = on('a') === '?' ? '?' : on('b');
        if (!a || !b) return { ok: false };
        v = a === '?' && b === '?' ? '?' : a + ' × ' + b;
      } else v = g('t').replace(/[|·¦]/g, ' ').trim() || (o.size ? '?' : '');
      const len = g('len').replace(/[|·¦]/g, ' ').trim();
      if (len) v = (v || '?') + ' · ' + len;
      return { ok: true, v };
    }
    const SPECS = new Map();
    const specOpts = o => { if (!SPECS.has(o.id)) SPECS.set(o.id, CH.specOpts(o.chips)); return SPECS.get(o.id); };
    const matOpts = o => CH.matOpts(ownMat(o) || matText(o));
    // specs and material with more than one option get a "Not sure" button ("?"), like the size
    function choicesHTML(o, cur) {
      const specs = specOpts(o), m = matOpts(o), pickedS = cur ? cur.specPick : specs.length === 1 ? specs : [], pickedM = cur ? cur.matPick : '';
      return sizeChoiceHTML(o, cur ? cur.pick : '') +
        (specs.length ? group('specs', 'Specs &amp; ratings', specs.length > 1 ? 'Tap the ones you need' : '', specs.map(v => btn('data-spec', v, pickedS.includes(v))).join('') + (specs.length > 1 ? btn('data-spec', '?', pickedS.includes('?'), 'Not sure') : '')) : '') +
        (m.opts.length ? group('mat', 'Material', m.opts.length > 1 ? 'Choose one' : '', m.opts.length > 1 ? m.opts.map(v => btn('data-mat', v, v === pickedM)).join('') + btn('data-mat', '?', pickedM === '?', 'Not sure') : fixed(m.full), m.note) : '');
    }
    const readSpecs = root => $$('[data-spec].is-on', root).map(b => b.dataset.spec);
    const readMat = (root, o) => { const m = matOpts(o), b = $('[data-mat].is-on', root); return m.opts.length > 1 && b ? b.dataset.mat : ''; };
    const keyOf = (o, v, specs, mat) => { specs = specs || []; return o.id + '|' + v + (specs.length || mat ? '|' + specs.join('¦') + '|' + (mat || '') : ''); };
    // like the size, specs and material with more than one option need a pick or "Not sure" before the line goes in
    const missingChoice = (root, o) => specOpts(o).length > 1 && !readSpecs(root).length ? 'specs' : matOpts(o).opts.length > 1 && !readMat(root, o) ? 'mat' : '';

    /* ---------- how a product reads in the quote list and on WhatsApp (same as the main site) ---------- */
    function describe(o) {
      const sp = sizeSpec(o), m = matOpts(o), specs = specOpts(o);
      let size = '';
      if (o.size || (o.pick && o.pick !== '?')) {
        const [base, len] = String(o.pick === null ? defaultPick(o) : o.pick).split(' · ');
        size = !base || base === '?' ? 'to confirm' + (o.size && sp.t !== 'one' ? ' (we offer ' + o.size.split(' · ')[0] + ')' : '') : base.replace(/\?/g, 'to confirm');
        if (len) size += ', length ' + len;
      }
      const picked = o.specPick.filter(x => x !== '?');   // "?" = Not sure: reads "to confirm (options)", like the size
      const spec = picked.length ? picked.join(', ') : specs.length === 1 && o.pick === null ? specs[0] : specs.length ? 'to confirm' + (specs.length <= 6 ? ' (' + specs.join(' / ') + ')' : '') : '';
      const mat = !m.opts.length ? '' : m.opts.length === 1 ? m.full : o.matPick && m.opts.includes(o.matPick) ? o.matPick + (m.note ? ' (' + m.note + ')' : '') : 'to confirm (' + m.opts.join(' / ') + ')';
      return { size, spec, mat };
    }
    // plain = for email (no WhatsApp *bold* marks)
    function itemBlock(o, q, n, plain) {
      const d = describe(o), b = plain ? '' : '*';
      return [b + (n ? n + '. ' : '') + o.name + b, 'Group: ' + o.c.name, d.size && 'Size: ' + d.size, d.spec && 'Specs & ratings: ' + d.spec, d.mat && 'Material: ' + d.mat, 'Quantity: ' + (q || '')].filter(Boolean).join('\n');
    }
    const HELLO = 'Hello Fakhri Tools, I would like a quote.';
    const priceMessage = (o, q, plain) => 'Hello Fakhri Tools, please send me a price for:\n\n' + itemBlock(o, q, 0, plain) + '\n\nThank you.';
    function quoteMessage(plain) {
      if (!quote.size) return HELLO;
      return 'Hello Fakhri Tools, please send me a quote for ' + (quote.size === 1 ? 'this item' : 'these ' + quote.size + ' items') + ':\n\n' +
        [...quote].map(([k, q], i) => itemBlock(itemOf(k), q, quote.size > 1 ? i + 1 : 0, plain)).join('\n\n') + '\n\nThank you.';
    }
    $$('[data-wa]').forEach(a => { a.href = waUrl(HELLO); a.target = '_blank'; a.rel = 'noopener'; });
    $$('[data-mail]').forEach(a => { a.href = mailUrl('Quote request — Fakhri Tools', HELLO); });

    /* ---------- quote list (saved on this phone) ---------- */
    const quote = new Map(), STORE = 'ft-products-quote';
    try {
      JSON.parse(localStorage.getItem(STORE) || '[]').forEach(([k, q, name]) => {
        const o = itemOf(k);
        if (o && o.name === name) quote.set(k, Math.max(1, Math.min(99999, Math.round(+q) || 1)));   // a product that changed on the list is dropped
      });
    } catch (e) {}
    const save = () => { try { localStorage.setItem(STORE, JSON.stringify([...quote].map(([k, q]) => [k, q, itemOf(k).name]))); } catch (e) {} };
    const parseQty = v => Math.max(1, Math.min(99999, Math.round(+v) || 1));

    function paintCount(bump) {
      const b = $('#quoteCount'), n = quote.size;
      b.hidden = !n; b.textContent = n;
      if (bump) { b.classList.remove('is-bump'); void b.offsetWidth; b.classList.add('is-bump'); }
      const ids = new Set([...quote.keys()].map(k => k.split('|')[0]));
      $$('.card').forEach(c => c.classList.toggle('is-in', ids.has(c.dataset.id)));
    }

    /* ---------- ranges + search + cards ---------- */
    let cat = 'all', q = '';
    const norm = s => s.toLowerCase().replace(/[.\-_/]/g, ' ').replace(/\s+/g, ' ').trim();
    const chips = $('#chips');
    chips.innerHTML = '<button class="chip is-on" type="button" data-cat="all">All<small>' + total + '</small></button>' +
      CATS.map(c => '<button class="chip" type="button" data-cat="' + esc(c.slug) + '">' + esc(c.name) + '<small>' + c.items.length + '</small></button>').join('');
    chips.addEventListener('click', e => {
      const b = e.target.closest('.chip'); if (!b) return;
      cat = b.dataset.cat;
      $$('.chip', chips).forEach(x => x.classList.toggle('is-on', x === b));
      b.scrollIntoView({ inline: 'center', block: 'nearest', behavior: reduce ? 'auto' : 'smooth' });
      render(true);
    });
    const qIn = $('#q');
    let qT;
    qIn.addEventListener('input', () => { clearTimeout(qT); qT = setTimeout(() => { q = qIn.value; $('#qClear').hidden = !q; render(true); }, 120); });
    qIn.addEventListener('keydown', e => { if (e.key === 'Enter') qIn.blur(); });
    $('#qClear').addEventListener('click', () => { qIn.value = q = ''; $('#qClear').hidden = true; render(true); qIn.focus(); });

    const card = (c, it, i) => '<button class="card" type="button" data-id="' + esc(c.slug + ':' + i) + '">' +
      '<span class="card__ph">' + thumbTag(it[3] ? IMG + it[3] : '', it[0]) + '</span>' +
      '<span class="card__tx"><span class="card__grp">' + esc(c.name) + '</span><span class="card__nm">' + esc(it[0]) + '</span><span class="card__go">View options</span></span></button>';

    let io = null;
    if ('IntersectionObserver' in window && !reduce) {
      document.documentElement.classList.add('js-reveal');
      io = new IntersectionObserver(es => es.forEach(en => {
        if (!en.isIntersecting) return;
        const el = en.target, row = $$('.card:not(.is-shown)', el.parentNode).indexOf(el);
        el.style.transitionDelay = Math.min(Math.max(row, 0), 6) * 50 + 'ms';
        el.classList.add('is-shown'); io.unobserve(el);
        setTimeout(() => { el.style.transitionDelay = ''; }, 900);
      }), { rootMargin: '0px 0px -40px 0px' });
    }
    function render(toTop) {
      const words = norm(q).split(' ').filter(Boolean);
      const hit = (c, it) => { if (!words.length) return true; const hay = norm(c.name + ' ' + it[0] + ' ' + (it[1] || []).join(' ') + ' ' + (it[4] || '')); return words.every(w => hay.includes(w)); };
      let n = 0, h = '';
      CATS.forEach(c => {
        if (cat !== 'all' && c.slug !== cat) return;
        const cards = c.items.map((it, i) => hit(c, it) ? (n++, card(c, it, i)) : '').join('');
        if (cards) h += '<section class="sec"><h2 class="sec__h">' + esc(c.name) + '<small>' + c.items.filter(it => hit(c, it)).length + '</small></h2><div class="grid">' + cards + '</div></section>';
      });
      $('#grid').innerHTML = h;
      $('#count').textContent = n + (n === 1 ? ' product' : ' products') + (words.length ? ' found' : '');
      $('#empty').hidden = !!n;
      if (!n) { $('#emptyQ').textContent = q; const a = $('#emptyWa'); a.href = waUrl('Hello Fakhri Tools, I’m looking for: ' + q); a.target = '_blank'; a.rel = 'noopener'; }
      if (io) $$('.card').forEach(c => io.observe(c));
      paintCount();
      if (toTop) {
        const top = $('#products').getBoundingClientRect().top + scrollY - $('.top').offsetHeight;
        if (scrollY > top) window.scrollTo({ top, behavior: 'auto' });
      }
    }
    render();
    $('#grid').addEventListener('click', e => { const c = e.target.closest('.card'); if (c) openPW(c.dataset.id); });

    /* ---------- product window ---------- */
    const pw = $('#pw'), pk = $('#pwPick');
    let pwId = null, pwLine = null, lastFocus = null;
    function lock(on) { document.body.classList.toggle('is-locked', on); }
    function show(el) {
      lastFocus = document.activeElement;
      el.hidden = false; lock(true);
      requestAnimationFrame(() => requestAnimationFrame(() => el.classList.add('is-open')));
    }
    function hide(el) {
      el.classList.remove('is-open');
      setTimeout(() => { el.hidden = true; if (pw.hidden && $('#ql').hidden) lock(false); }, reduce ? 0 : 380);
      if (lastFocus && lastFocus.focus) lastFocus.focus({ preventScroll: true });
    }
    function syncPW() {
      const o = itemOf(pwId), p = readPick(pk, o), key = p.ok ? keyOf(o, p.v, readSpecs(pk), readMat(pk, o)) : null;
      const editing = !!pwLine && quote.has(pwLine), on = editing || (key && quote.has(key));
      $('#pwAdd span').textContent = editing ? 'Save changes' : on ? 'Update quantity' : 'Add to quote';
      const lines = [...quote].filter(([k]) => k.startsWith(o.id + '|'));
      $('#pwState').hidden = !lines.length;
      if (lines.length) $('#pwState').textContent = 'In your quote: ' + lines.reduce((n, [, x]) => n + x, 0) + ' pcs';
      const now = Object.assign({}, o, { pick: p.ok ? p.v : null, specPick: readSpecs(pk), matPick: readMat(pk, o) });
      const a = $('#pwWa'); a.href = waUrl(priceMessage(now, parseQty($('#pwQty').value))); a.target = '_blank'; a.rel = 'noopener';
      $('#pwMail').href = mailUrl('Price request — ' + o.name, priceMessage(now, parseQty($('#pwQty').value), true));
    }
    function openPW(key) {
      const o = itemOf(key); if (!o) return;
      pwId = o.id; pwLine = o.pick !== null && quote.has(key) ? key : null;
      $('#pwMedia').innerHTML = o.img ? '<img class="ph" src="' + esc(o.img) + '" alt="' + esc(o.name) + '"><img class="wm" src="assets/logo-stacked.png" alt="" aria-hidden="true" draggable="false">' : LOGO_PH;
      $('#pwGrp').textContent = o.c.name;
      $('#pwName').textContent = o.name;
      pk.innerHTML = choicesHTML(o, pwLine ? o : null) || '<p class="chg__none">Nothing to choose: add it to your quote, or ask on WhatsApp.</p>';
      tidyPair(pk, o);
      $('#pwQty').value = (pwLine && quote.get(key)) || 1;
      syncPW();
      if (pw.hidden) show(pw);
      $('.pw__box').scrollTop = 0;
      setTimeout(() => $('.pw__x', pw).focus({ preventScroll: true }), 50);
    }
    pk.addEventListener('click', e => {
      const b = e.target.closest('button.cho'); if (!b || b.disabled) return;
      const o = itemOf(pwId);
      if (b.hasAttribute('data-spec')) {
        const was = b.classList.contains('is-on');
        setOn(b, !was);
        if (!was) $$('[data-spec]', pk).forEach(x => { if (x !== b && (b.dataset.spec === '?' || x.dataset.spec === '?')) setOn(x, false); });   // "Not sure" or specs, not both
      } else {
        const attr = b.hasAttribute('data-pk-a') ? 'data-pk-a' : b.hasAttribute('data-pk-b') ? 'data-pk-b' : 'data-mat';
        const was = b.classList.contains('is-on');
        $$('[' + attr + ']', pk).forEach(x => setOn(x, false));
        if (attr === 'data-pk-a' && b.dataset.pkA === '?') $$('[data-pk-b]', pk).forEach(x => setOn(x, false));
        if (attr === 'data-pk-b') $$('[data-pk-a="?"]', pk).forEach(x => setOn(x, false));
        setOn(b, attr === 'data-mat' ? !was : true);
        tidyPair(pk, o);
      }
      const g = b.closest('.chg'); if (g) g.classList.remove('pk-err');
      syncPW();
    });
    pk.addEventListener('input', syncPW);
    $('.pw__qty').addEventListener('click', e => { const b = e.target.closest('[data-q]'); if (!b) return; const i = $('#pwQty'); i.value = parseQty(+i.value + +b.dataset.q); syncPW(); });
    $('#pwQty').addEventListener('input', syncPW);
    $('#pwQty').addEventListener('blur', e => { e.target.value = parseQty(e.target.value); });
    $('#pwAdd').addEventListener('click', () => {
      const o = itemOf(pwId), p = readPick(pk, o);
      const miss = !p.ok ? 'size' : missingChoice(pk, o);
      if (miss) {
        const g = $('.chg--' + miss, pk); g.classList.remove('pk-err'); void g.offsetWidth; g.classList.add('pk-err');
        g.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
        toast({ size: 'Choose a size first (or tap “Not sure”)', specs: 'Choose the specs & ratings (or tap “Not sure”)', mat: 'Choose a material (or tap “Not sure”)' }[miss]);
        return;
      }
      const key = keyOf(o, p.v, readSpecs(pk), readMat(pk, o)), qty = parseQty($('#pwQty').value);
      if (pwLine && pwLine !== key) {   // changing a line: it keeps its place in the list
        const rows = [...quote].map(([k, x]) => k === pwLine ? [key, qty] : [k, x]).filter(([k], i, a) => a.findIndex(([j]) => j === k) === i);
        quote.clear(); rows.forEach(([k, x]) => quote.set(k, x));
      } else quote.set(key, qty);
      save(); paintCount(true); paintList();
      toast(pwLine ? 'Changes saved' : 'Added to your quote');
      hide(pw);
    });

    /* ---------- quote list window ---------- */
    const ql = $('#ql');
    function paintList() {
      const list = $('#qlList');
      if (!quote.size) {
        list.innerHTML = '<div class="ql__empty"><p>Your quote is empty.<br>Open a product and tap “Add to quote”.</p></div>';
        $('#qlSend').textContent = ''; $('#qlSend').insertAdjacentHTML('beforeend', '<svg><use href="#wa"/></svg>Ask on WhatsApp');
        $('#qlClear').hidden = true;
      } else {
        const part = (l, v) => v ? '<span' + (/^to confirm/.test(v) ? ' class="todo"' : '') + '><i>' + l + ':</i> ' + esc(v.replace(/^to confirm \(.*$/, 'to confirm')) + '</span>' : '';
        list.innerHTML = [...quote].map(([k, x]) => {
          const o = itemOf(k), d = describe(o);
          return '<div class="line" data-k="' + esc(k) + '"><div class="line__ph">' + thumbTag(o.img, o.name) + '</div><div>' +
            '<p class="line__grp">' + esc(o.c.name) + '</p><p class="line__nm">' + esc(o.name) + '</p>' +
            '<p class="line__ch">' + part('Size', d.size) + part('Specs & ratings', d.spec) + part('Material', d.mat) + '</p></div>' +
            '<div class="line__act"><div class="qty"><button type="button" data-lq="-1" aria-label="Less">−</button><input type="number" inputmode="numeric" min="1" max="99999" value="' + x + '" aria-label="Quantity"><button type="button" data-lq="1" aria-label="More">+</button></div>' +
            '<button class="lbtn" type="button" data-change>Change</button><button class="lbtn lbtn--rm" type="button" data-rm>Remove</button></div></div>';
        }).join('');
        $('#qlSend').textContent = ''; $('#qlSend').insertAdjacentHTML('beforeend', '<svg><use href="#wa"/></svg>Send quote on WhatsApp (' + quote.size + ')');
        $('#qlClear').hidden = false;
      }
      const a = $('#qlSend'); a.href = waUrl(quoteMessage()); a.target = '_blank'; a.rel = 'noopener';
      $('#qlMail').href = mailUrl('Quote request — Fakhri Tools', quoteMessage(true));
      $('#qlMail').lastChild.textContent = quote.size ? 'Send quote by email' : 'Email us';
    }
    $('#qlList').addEventListener('click', e => {
      const line = e.target.closest('.line'); if (!line) return;
      const k = line.dataset.k;
      if (e.target.closest('[data-rm]')) { quote.delete(k); save(); paintCount(); paintList(); toast('Removed'); }
      else if (e.target.closest('[data-change]')) { hide(ql); setTimeout(() => openPW(k), reduce ? 0 : 200); }
      else if (e.target.closest('[data-lq]')) { quote.set(k, parseQty(quote.get(k) + +e.target.closest('[data-lq]').dataset.lq)); save(); $('input', line).value = quote.get(k); paintList(); }
    });
    $('#qlList').addEventListener('change', e => { const line = e.target.closest('.line'); if (!line || e.target.tagName !== 'INPUT') return; quote.set(line.dataset.k, parseQty(e.target.value)); save(); paintList(); });
    $('#qlClear').addEventListener('click', () => { if (!confirm('Remove everything from your quote?')) return; quote.clear(); save(); paintCount(); paintList(); });
    $('#quoteBtn').addEventListener('click', () => { paintList(); show(ql); });

    [pw, ql].forEach(el => el.addEventListener('click', e => { if (e.target.closest('[data-close]')) hide(el); }));
    document.addEventListener('keydown', e => {
      if (e.key !== 'Escape') return;
      if (!pw.hidden) hide(pw); else if (!ql.hidden) hide(ql);
    });
    paintCount(); paintList();
  }

  /* ---------- page bits that don't need the product list ---------- */
  $$('[data-home]').forEach(a => a.addEventListener('click', e => { e.preventDefault(); window.scrollTo({ top: 0, behavior: reduce ? 'auto' : 'smooth' }); }));
  // entrance animation for the top block
  if (!reduce) $$('.hero__kick, .hero__title span, .hero__lead, .hero__btns, .hero__stats').forEach((el, i) => { el.classList.add('rise'); el.style.animationDelay = (0.08 + i * 0.09) + 's'; });
  // open now / closed (Dubai time)
  try {
    const p = {};
    new Intl.DateTimeFormat('en-GB', { timeZone: 'Asia/Dubai', hour: '2-digit', minute: '2-digit', weekday: 'short', hour12: false }).formatToParts(new Date()).forEach(x => { p[x.type] = x.value; });
    const dow = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].indexOf(p.weekday), h = (+p.hour % 24) + (+p.minute) / 60;
    const open = OPEN.days.includes(dow) && h >= OPEN.from && h < OPEN.to;
    $('#openDot').classList.toggle('is-open', open);
    $('#openText').textContent = (open ? 'Open now · ' : 'Closed now · ') + 'Monday to Saturday, 7:30am to 6:00pm';
  } catch (e) {}
})();
