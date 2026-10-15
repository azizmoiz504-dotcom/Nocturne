/* Fakhri Tools — page orchestration */
(function () {
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const CATS = window.FT_CATS, FAMS = window.FT_FAMILIES, IMG = window.FT_IMG || '', CFG = window.FT_CONFIG;
  // category page file name (a few have a shorter address; see tools/build-pages.js PAGE_URL)
  const pageOf = c => (window.FT_PAGE_URL && window.FT_PAGE_URL[c.slug]) || c.slug;
  // Category photos: the cover first, then each product's own photo.
  CATS.forEach(c => { c.imgs = [...new Set([c.cover || (c.items[0] || [])[3]].concat(c.items.map(it => it[3])).filter(Boolean))]; });
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
    // the enquiry form is not a full section, so it stops just below the header instead of under it
    const off = target === '#form' ? -(parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--nav-h')) || 100) - 12 : 0;
    if (lenis) lenis.scrollTo(el, { offset: off, duration: 1.8, easing: t => 1 - Math.pow(1 - t, 4), force: true });   // force: works even while an overlay is still closing
    else if (el === 0) window.scrollTo({ top: 0, behavior: 'smooth' });
    else if (off) window.scrollTo({ top: el.getBoundingClientRect().top + scrollY + off, behavior: 'smooth' });
    else el.scrollIntoView({ behavior: 'smooth' });
  }

  /* ================= Shop: helpers ================= */
  const catBySlug = s => CATS.find(c => c.slug === s);
  const famName = id => FAMS.find(f => f.id === id).name;
  // a quote line is "slug:index|size" — the part after | is the size the customer picked
  // category links that were renamed keep working
  const SLUG_ALIAS = { 'gaskets-caf-canf-sheets': 'gaskets-sheets' };
  const slugAlias = s => SLUG_ALIAS[s] || s;
  function itemOf(key) {
    const k = String(key), bar = k.indexOf('|');
    let [slug, i] = (bar < 0 ? k : k.slice(0, bar)).split(':');
    slug = slugAlias(slug);   // old names, still in some saved quotes and links
    const c = catBySlug(slug);
    if (!c || !c.items[+i]) return null;
    const it = c.items[+i], id = slug + ':' + (+i);
    return { id, c, i: +i, name: it[0], chips: it[1], size: it[2], img: it[3] ? IMG + it[3] : '', matSet: it[4] || '', pick: bar < 0 ? null : k.slice(bar + 1) };
  }
  const coverOf = c => c.imgs[0] ? IMG + c.imgs[0] : '';
  const imgTag = (src, alt) => src ? '<img data-ph src="' + src + '" alt="' + (alt || '').replace(/"/g, '&quot;') + '" loading="lazy" decoding="async" >' : PH;
  // names are written both ways ("S.S" and "SS316L", "C.I" and "CI"); forged steel A105 is carbon steel
  const MATS = [['Bronze', /bronze/i], ['Brass', /brass/i], ['Stainless', /\bS\.S\b|\bSS(?:3\d\d\w*)?\b|[Ss]tainless/], ['Carbon steel', /\bC\.S\b|\bCS\b|[Ff]orged [Ss]teel/], ['Cast iron', /\bC\.I\b|\bCI\b/], ['Galvanised', /\bG\.I\b|\bGI\b/], ['Mild steel', /\bM\.S\b|\bMS\b/], ['Aluminium', /alumin/i], ['Rubber', /rubber|neoprene/i], ['PVC', /\bPVC\b/]];
  function materialOf(name) {
    let best = null, at = 1e9;
    MATS.forEach(([m, r]) => { const k = name.search(r); if (k > -1 && k < at) { at = k; best = m; } });
    return best;
  }
  // the material the owner set in the editor wins; otherwise it is read from the name
  const matOf = o => o.matSet || materialOf(o.name);
  // a typed material ("Stainless Steel CF8M (316)", "F304/304L, F316/316L") goes under the plain filter line it belongs to
  const GRADES = [['Stainless', /\b(?:F?3[01]\d[LH]?|CF[38]M?|A403|A182|A312)\b/i], ['Carbon steel', /\b(?:WCB|A105N?|A234|A106)\b/i]];
  const matGroups = s => [...new Set(s.split(/\s*(?:,|&)\s*/).filter(Boolean).map(p => materialOf(p) || (GRADES.find(([, r]) => r.test(p)) || [])[0] || p))];
  const groupOf = it => it[4] ? matGroups(it[4])[0] : materialOf(it[0]);
  // the material as shown on the card and in quick view
  const ownMat = o => o.matSet !== 'Other' ? o.matSet : '';
  const matText = o => ownMat(o) || (/^C\.S & S\.S/.test(o.name) ? 'Carbon steel, Stainless' : materialOf(o.name) || '');
  // quote lines and WhatsApp messages carry the material when the product name doesn't say it ("Gate Valve F/T – Cast iron")
  const fullName = o => ownMat(o) && !materialOf(o.name) ? o.name + ' – ' + o.matSet : o.name;
  const chipsHTML = arr => arr.length ? '<div class="prow__chips">' + arr.map(s => '<span>' + esc(s) + '</span>').join('') + '</div>' : '';
  const esc = s => String(s).replace(/[&<>"]/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[ch]));

  /* ================= Sizes: every product gets a proper size picker ================= */
  // standard pipe sizes in order, so a range like ½" – 24" lists every size in between (2½" included)
  const LADDER = ['⅛"', '¼"', '⅜"', '½"', '¾"', '1"', '1¼"', '1½"', '2"', '2½"', '3"', '3½"', '4"', '5"', '6"', '8"', '10"', '12"', '14"', '16"', '18"', '20"', '22"', '24"', '26"', '28"', '30"', '32"', '34"', '36"', '40"', '42"', '48"'];
  const rung = t => LADDER.indexOf(t);
  const IN = '(\\d*[⅛¼⅜½¾]?"|\\d+\\/\\d+")';
  const RX_RANGE = new RegExp('^' + IN + ' – ' + IN + '$'), RX_PAIR = new RegExp('^' + IN + ' × ' + IN + ' – ' + IN + ' × ' + IN + '$'), RX_RANGEX = new RegExp('^' + IN + ' – ' + IN + ' × ' + IN + '$');
  function ladder(a, b, fam) {
    const i = rung(a), j = b === 'any' ? LADDER.length - 1 : rung(b);
    if (i < 0 || j < i) return null;
    // 3½" pipe sizes exist for pipe and fittings only
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
    else if ((m = s.match(RX_PAIR)) && m[1] === m[2] && m[3] === m[4]) {   // 1½" × 1½" – 4" × 4": both ends are always the same size
      const l = ladder(m[1], m[3], o.c.fam); if (l) sp = { t: 'sel', opts: l, ph: m[1] + ' – ' + m[3] };
    }
    else if (m) {
      const L = ladder(m[1], m[3], o.c.fam), S = ladder(m[2], m[4], o.c.fam);
      if (L && S) sp = { t: 'pair', L, S, lt: rung(m[1]) > rung(m[2]) && rung(m[3]) > rung(m[4]) };
    }
    else if ((m = s.match(RX_RANGEX))) {
      const l = ladder(m[1], m[2], o.c.fam);
      if (l && rung(m[3]) > -1 && rung(m[3]) < rung(m[2])) sp = { t: 'sel', opts: l.concat(m[2] + ' × ' + m[3]), ph: m[1] + ' – ' + m[2] };   // e.g. 1" – 4" plus the 4" × 3" reducer
      else if (l) { sp = { t: 'sel', opts: l, ph: m[1] + ' – ' + m[2] }; len = 'up to ' + m[3]; }                                                // nipples: size, then length
    }
    else if ((m = s.match(RX_RANGE))) { const l = ladder(m[1], m[2], o.c.fam); if (l) sp = { t: 'sel', opts: l, ph: m[1] + ' – ' + m[2] }; }
    else if (/, | \/ /.test(s)) sp = { t: 'sel', opts: s.replace(/ bottom connection$/, '').split(/, | \/ /) };
    else if (!/–|TO/.test(s)) sp = { t: 'one', v: s };
    if (!sp) sp = { t: 'text', hint: s };
    sp.len = len; sp.note = note;
    SPEC.set(o.id, sp);
    return sp;
  }
  // the size a product gets when the customer has not chosen yet ("?" = size to confirm)
  const defaultPick = o => { const sp = sizeSpec(o); return sp.t === 'one' ? sp.v : (o.size ? '?' : ''); };
  const fixedSize = o => { const sp = sizeSpec(o); return sp.t === 'one' && !sp.len; };
  const needsPick = o => { const t = sizeSpec(o).t; return t === 'sel' || t === 'pair'; };
  function sizeWords(o, pick) {
    if (pick === null || pick === undefined) return o.size;
    const [base, len] = pick.split(' · ');
    const b = base === '?' ? 'size to confirm' + (o.size ? ', range ' + o.size.split(' · ')[0] : '') : base.replace(/\?/g, 'size to confirm');
    return [b, len ? 'length ' + len : ''].filter(Boolean).join(', ');
  }
  // the controls (dropdowns / boxes) for one product; cur = a size already chosen
  function pickerHTML(o, cur) {
    const sp = sizeSpec(o);
    const [base, len] = (cur || '').split(' · ');
    const opt = (v, on, lab) => '<option value="' + esc(v) + '"' + (on ? ' selected' : '') + '>' + esc(lab || v) + '</option>';
    const sel = (key, opts, val, ph, lab) => '<select data-pk="' + key + '" aria-label="' + lab + '">' + '<option value="" disabled' + (val ? '' : ' selected') + '>' + esc(ph) + '</option>' +
      opts.map(v => opt(v, v === val)).join('') + opt('?', val === '?', 'Not sure, ask me') + '</select>';
    let h = '';
    if (sp.t === 'one') h = '<span class="pk__one">' + esc(sp.v) + '</span>';
    else if (sp.t === 'sel') h = sel('a', sp.opts, base, sp.ph ? (innerWidth < 600 ? sp.ph.replace(' – ', '–') : 'Choose size (' + sp.ph + ')') : 'Choose size', 'Size');
    else if (sp.t === 'pair') {
      const [a, b] = base && base !== '?' ? base.split(' × ') : [base === '?' ? '?' : '', base === '?' ? '?' : ''];
      h = '<span class="pk__pair">' + (sp.L.length === 1 ? '<span class="pk__one">' + esc(sp.L[0]) + '</span>' : sel('a', sp.L, a, sp.lt ? 'Big end' : 'Choose', sp.lt ? 'Big end size' : 'First size')) + '<i>×</i>' + sel('b', sp.S, b, sp.lt ? 'Small end' : 'Choose', sp.lt ? 'Small end size' : 'Second size') + '</span>';
    } else h = '<input data-pk="t" type="text" maxlength="40" value="' + esc(base && base !== '?' ? base : '') + '" placeholder="' + esc(sp.hint ? 'Type size (' + sp.hint + ')' : 'Size, if you know it') + '" aria-label="Size">';
    if (sp.len) h += '<input data-pk="len" type="text" maxlength="30" value="' + esc(len || '') + '" placeholder="Length (' + esc(sp.len) + ')" aria-label="Length">';
    return '<div class="pk pk--' + sp.t + (sp.len ? ' pk--len' : '') + '"><span class="pk__lab mono">Size</span><div class="pk__ctl">' + h + '</div>' + (sp.note ? '<small class="pk__note">' + esc(sp.note) + '</small>' : '') + '</div>';
  }
  // keep "small end" smaller than "big end" on reducers
  function tidyPair(root, o) {
    const sp = sizeSpec(o); if (sp.t !== 'pair' || !sp.lt) return;
    const a = $('[data-pk="a"]', root), b = $('[data-pk="b"]', root); if (!b) return;
    const big = a ? a.value : sp.L[0];
    const lim = big && big !== '?' ? rung(big) : 99;
    $$('option', b).forEach(op => { if (op.value && op.value !== '?') op.disabled = rung(op.value) >= lim; });
    if (b.value && b.value !== '?' && rung(b.value) >= lim) b.value = '';
  }
  // what the customer picked: {ok, v}; ok = false while a dropdown is still empty
  function readPick(root, o) {
    const sp = sizeSpec(o), g = k => { const el = root && $('[data-pk="' + k + '"]', root); return el ? el.value.trim() : ''; };
    let v;
    if (sp.t === 'one') v = sp.v;
    else if (sp.t === 'sel') { v = g('a'); if (!v) return { ok: false }; }
    else if (sp.t === 'pair') {
      const a = sp.L.length === 1 ? sp.L[0] : g('a'), b = g('b');
      if (!a || !b) return { ok: false };
      v = a === '?' && b === '?' ? '?' : a + ' × ' + b;   // one end can stay 'not sure'
    } else v = g('t').replace(/[|·]/g, ' ').trim() || (o.size ? '?' : '');
    const len = g('len').replace(/[|·]/g, ' ').trim();
    if (len) v = (v || '?') + ' · ' + len;
    return { ok: true, v };
  }
  const keyOf = (o, v) => o.id + '|' + v;
  function flagPick(root) {
    const el = $$('select', root).find(x => !x.value) || $('select', root);
    root.classList.remove('pk-err'); void root.offsetWidth; root.classList.add('pk-err');
    if (el) el.focus({ preventScroll: true });
    toast('Choose a size first');
  }

  /* ================= Quote basket (line key -> qty) ================= */
  const rfq = new Map();
  // a saved size the product no longer offers becomes "size to confirm", so the list never shows one size and sends another
  function cleanPick(o, pick) {
    const sp = sizeSpec(o), [base, len] = String(pick).split(' · ');
    let b = base;
    if (sp.t === 'one') b = sp.v;
    else if (sp.t === 'sel') { if (/^(.+) × \1$/.test(b)) b = b.split(' × ')[0]; if (b !== '?' && !sp.opts.includes(b)) b = '?'; }
    else if (sp.t === 'pair' && b !== '?') { const [x, y] = b.split(' × '); if (!(x === '?' || sp.L.includes(x)) || !(y === '?' || sp.S.includes(y))) b = '?'; }
    return len && sp.len ? (b || '?') + ' · ' + len : b;
  }
  // the product list gets edited: a saved line follows its product by name and material (nearest to its old place,
  // because several products share a name), first in its own section, then anywhere
  function findSaved(k, name, mat) {
    const o = itemOf(k);
    if (!name || (o && o.name === name && (mat === undefined || o.matSet === mat))) return o;
    const bar = k.indexOf('|'), pick = bar < 0 ? '' : k.slice(bar), head = (bar < 0 ? k : k.slice(0, bar)).split(':');
    const slug = slugAlias(head[0]), was = +head[1] || 0, home = catBySlug(slug);
    for (const strict of [true, false]) {
      for (const c of [home].concat(CATS.filter(x => x !== home))) {
        if (!c) continue;
        let best = -1;
        c.items.forEach((it, i) => { if (it[0] === name && (!strict || mat === undefined || (it[4] || '') === mat) && (best < 0 || Math.abs(i - was) < Math.abs(best - was))) best = i; });
        if (best > -1) return itemOf(c.slug + ':' + best + pick);
      }
    }
    return null;
  }
  let lostLines = 0;
  try {
    (JSON.parse(localStorage.getItem('ft-rfq') || '[]')).forEach(([k, q, name, mat]) => {
      const o = findSaved(String(k), name, mat);
      if (!o) { lostLines++; return; }
      const key = keyOf(o, o.pick === null ? defaultPick(o) : cleanPick(o, o.pick));
      rfq.set(key, Math.min(99999, (rfq.get(key) || 0) + Math.max(1, Math.round(+q) || 1)));
    });
  } catch (e) {}
  const saveRfq = () => { try { localStorage.setItem('ft-rfq', JSON.stringify([...rfq].map(([k, q]) => { const o = itemOf(k); return [k, q, o ? o.name : '', o ? o.matSet : '']; }))); } catch (e) {} };
  if (rfq.size || lostLines) saveRfq();   // older saved quotes get product names added, so they survive list changes
  if (lostLines) setTimeout(() => toast((lostLines === 1 ? '1 product' : lostLines + ' products') + ' in your saved quote changed on our list, please add ' + (lostLines === 1 ? 'it' : 'them') + ' again'), 4600);
  const hasAny = id => [...rfq.keys()].some(k => k.startsWith(id + '|'));
  const sizeOfLine = o => { const w = sizeWords(o, o.pick); return w ? ' (' + w + ')' : ''; };
  const lineText = (o, q) => '• ' + fullName(o) + sizeOfLine(o) + ' × ' + q;
  function quoteMessage() {
    if (!rfq.size) return 'Hello Fakhri Tools, I would like a quote.';
    return 'Hello Fakhri Tools, I would like a quote for:\n' + [...rfq].map(([k, q]) => lineText(itemOf(k), q)).join('\n');
  }

  // "1,000", "1 000" and "10 pcs" all count; a box with no number in it keeps the old quantity
  const parseQty = v => { const m = String(v).replace(/[\s,']/g, '').match(/\d+/); return m ? +m[0] : null; };
  function setQty(key, q, typed) {
    if (typeof q !== 'number') q = parseQty(q);
    if (q === null) { syncRfq(false); return; }
    q = Math.round(q);
    if (q <= 0) rfq.delete(key); else rfq.set(key, Math.min(99999, q));
    saveRfq(); syncRfq(false, typed && q > 0);
  }
  // change the size of a line that is already in the quote (keeps its place in the list)
  function reKey(oldKey, newKey) {
    if (oldKey === newKey || !rfq.has(oldKey)) return;
    const q = rfq.get(oldKey), next = new Map();
    rfq.forEach((v, k) => { if (k === oldKey) next.set(newKey, (rfq.get(newKey) || 0) + q); else if (k !== newKey) next.set(k, v); });
    rfq.clear(); next.forEach((v, k) => rfq.set(k, v));
    saveRfq(); syncRfq(false);
  }
  function toggleRfq(key, srcEl) {
    const o = itemOf(key); if (!o) return;
    const added = !rfq.has(key);
    if (added) rfq.set(key, 1); else rfq.delete(key);
    saveRfq(); syncRfq(true);
    toast((added ? 'Added to quote — ' : 'Removed — ') + fullName(o) + sizeOfLine(o));
    if (added && srcEl) requestAnimationFrame(() => flyToBar(srcEl));
  }
  function addAll(c, srcEl) {
    let n = 0;
    c.items.forEach((_, i) => { const o = itemOf(c.slug + ':' + i); if (!hasAny(o.id)) { rfq.set(keyOf(o, defaultPick(o)), 1); n++; } });
    saveRfq(); syncRfq(true);
    toast(n ? 'Added ' + n + ' products from ' + c.name + ' — pick sizes in your quote' : 'The full ' + c.name + ' range is already in your quote');
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

  // state of an "Add to quote" button: on a card with a size picker it follows the picked size
  function addState(b) {
    const root = b.closest('[data-pick-root]'), o = itemOf(b.dataset.add);
    if (!o) return false;
    if (!root) return hasAny(o.id);
    const p = readPick(root, o);
    return p.ok && rfq.has(keyOf(o, p.v));
  }
  function paintAdd(b) {
    const on = addState(b);
    b.classList.toggle('is-added', on);
    // only rewrite the label when it changes: replacing it under the mouse would swallow the click
    const l = $('.lbl', b); if (l && l.dataset.on !== String(on)) { l.dataset.on = on; l.innerHTML = on ? 'Added' : 'Add<span class="lbl__x"> to quote</span>'; }
  }
  function syncRfq(bump, keepSheet) {
    const n = rfq.size;
    $('#rfqCount').textContent = n; $$('.js-rfq-n').forEach(e => { e.textContent = n; });
    if (bump) { const b = $('#rfqBtn'); b.classList.remove('bump'); void b.offsetWidth; b.classList.add('bump'); }
    $$('[data-add]').forEach(paintAdd);
    // contact form list
    $('#formRfq').hidden = n === 0;
    const list = $('#rfqList'); list.innerHTML = '';
    rfq.forEach((q, k) => {
      const o = itemOf(k);
      const li = document.createElement('li');
      li.innerHTML = '<span></span><button type="button" aria-label="Remove">×</button>';
      li.firstChild.textContent = fullName(o) + sizeOfLine(o) + ' × ' + q;
      li.lastChild.addEventListener('click', () => setQty(k, 0));
      list.appendChild(li);
    });
    $('#qsWa').dataset.waMsg = quoteMessage(); applyLinks($('.qs__foot'));
    // floating quote bar
    const bar = $('#qbar');
    bar.classList.toggle('is-on', n > 0);
    document.body.classList.toggle('has-quote', n > 0);
    $('#qbarCount').textContent = n + (n === 1 ? ' item' : ' items');
    $('#qbarThumbs').innerHTML = [...rfq.keys()].slice(-4).reverse().map(k => '<i>' + imgTag(itemOf(k).img) + '</i>').join('');
    if (qs.classList.contains('is-open')) { if (keepSheet) $$('#qsList .qs__row').forEach(r => { const i = $('.qty input', r); if (i && rfq.has(r.dataset.id)) i.value = rfq.get(r.dataset.id); }); else renderSheet(); }
    if (qvId) syncQV();
  }
  document.addEventListener('click', e => {
    const b = e.target.closest('[data-add]');
    if (!b) return;
    e.preventDefault(); e.stopPropagation();
    const o = itemOf(b.dataset.add); if (!o) return;
    const root = b.closest('[data-pick-root]');
    if (!root) {
      // lists without a size box: products with several sizes open the quick view to pick one
      if (needsPick(o)) return openQV(o.id);
      return toggleRfq(keyOf(o, defaultPick(o)), b);
    }
    const p = readPick(root, o);
    if (!p.ok) return flagPick(root);
    toggleRfq(keyOf(o, p.v), b);
  });
  // a size was picked on a card, in the quick view or in the quote list
  function onPick(e) {
    const el = e.target; if (!el.dataset || !el.dataset.pk) return;
    const root = el.closest('[data-pick-root]'); if (!root) return;
    root.classList.remove('pk-err');
    const o = itemOf(root.dataset.pickRoot); if (!o) return;
    if (el.dataset.pk === 'a') tidyPair(root, o);
    let p = readPick(root, o);
    // in the quote list a new big end must never leave the old size in the quote: take the next smaller size
    if (!p.ok && el.dataset.pk === 'a' && root.classList.contains('qs__row')) {
      const b = $('[data-pk="b"]', root), ok = b && $$('option', b).filter(op => op.value && op.value !== '?' && !op.disabled);
      if (ok && ok.length) { b.value = ok[ok.length - 1].value; p = readPick(root, o); }
    }
    if (root.classList.contains('qs__row')) { if (p.ok && e.type === 'change') reKey(root.dataset.id, keyOf(o, p.v)); return; }
    if (root.id === 'qvPick') { syncQV(); return; }
    $$('[data-add]', root).forEach(paintAdd);
    const wa = $('[data-wa-msg]', root);
    if (wa) { wa.dataset.waMsg = waPrice(o, p.ok ? p.v : null); applyLinks(root); }
  }
  document.addEventListener('change', onPick);
  document.addEventListener('input', e => { if (e.target.tagName === 'INPUT') onPick(e); });
  $('#rfqClear').addEventListener('click', () => { rfq.clear(); saveRfq(); syncRfq(true); });


  // the Back button closes an open window (quick view, quote list, filters, phone menu) instead of leaving the site:
  // each window adds a history step when it opens, and takes it away again when it is closed any other way
  function ovOpen(name) {
    if (history.state && history.state.ov === name) return;
    try { history.scrollRestoration = 'manual'; } catch (e) {}   // going back must not jump the page
    history.pushState({ ov: name }, '');
  }
  function ovClosed(name) { if (history.state && history.state.ov === name) history.back(); }
  // page scrolling comes back only when no overlay, menu or filter sheet is still open
  function unlock() {
    if (!lenis) return;
    const b = document.body.classList;
    if ($('#qv').classList.contains('is-open') || $('#qs').classList.contains('is-open') || $('#showroom').classList.contains('is-open') || b.contains('is-menu') || b.contains('is-filtering') || b.contains('is-loading')) return;
    lenis.start();
  }
  // dialogs: focus moves into them and goes back to the button that opened them
  const focusBack = new Map();
  function focusIn(box, sel) { if (!focusBack.has(box)) focusBack.set(box, document.activeElement); const el = $(sel, box); if (el) setTimeout(() => el.focus({ preventScroll: true }), 60); }
  // Tab and Shift+Tab stay inside an open quick view or quote list
  document.addEventListener('keydown', e => {
    if (e.key !== 'Tab') return;
    const box = $('#qv.is-open .qv__card') || $('#qs.is-open .qs__panel'); if (!box) return;
    const f = $$('a[href],button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea', box).filter(el => el.getClientRects().length && !el.closest('[hidden]'));
    if (!f.length) return;
    const i = f.indexOf(document.activeElement);
    if (e.shiftKey && i <= 0) { e.preventDefault(); f[f.length - 1].focus(); }
    else if (!e.shiftKey && (i === -1 || i === f.length - 1)) { e.preventDefault(); f[0].focus(); }
  });
  function focusOut(box) { const el = focusBack.get(box); focusBack.delete(box); if (el && el.focus && document.contains(el)) el.focus({ preventScroll: true }); }

  /* ================= Quote review sheet ================= */
  const qs = $('#qs');
  function renderSheet() {
    const n = rfq.size;
    const a = document.activeElement, was = a && a.closest && a.closest('#qsList .qs__row');
    const back = was && { id: was.dataset.id, i: $$('#qsList .qs__row').indexOf(was), sel: a.dataset.q ? '[data-q="' + a.dataset.q + '"]' : a.dataset.pk ? '[data-pk="' + a.dataset.pk + '"]' : a.classList.contains('qs__rm') ? '.qs__rm' : a.classList.contains('qs__img') ? '.qs__img' : '.qty input' };
    $('#qsCount').textContent = n;
    $('#qsList').innerHTML = n ? [...rfq].map(([k, q]) => {
      const o = itemOf(k);
      return '<div class="qs__row" data-id="' + esc(k) + '" data-pick-root="' + o.id + '">' +
        '<button class="qs__img" data-qv="' + esc(k) + '">' + imgTag(o.img) + '</button>' +
        '<div class="qs__info"><span class="mono">' + esc(o.c.name) + '</span><b>' + esc(o.name) + '</b>' +
          (fixedSize(o) ? (o.size ? '<small>' + esc(o.size) + '</small>' : '') : pickerHTML(o, o.pick)) + '</div>' +
        '<div class="qty"><button type="button" data-q="-1" aria-label="Less">−</button><input type="text" inputmode="numeric" value="' + q + '" aria-label="Quantity"><button type="button" data-q="1" aria-label="More">+</button></div>' +
        '<button class="qs__rm" type="button" aria-label="Remove">×</button></div>';
    }).join('') : '<div class="qs__empty"><b>Your quote is empty.</b><p>Browse the catalogue, pick a size and tap “Add to quote”. Quantities can be changed here.</p><div class="qs__empty-btns"><button class="btn btn--red" id="qsBrowse" type="button">Browse the catalogue</button><a class="btn btn--ghost" href="tel:+97142850135">Call +971 4 285 0135</a></div></div>';
    $$('.qs__row', $('#qsList')).forEach(r => tidyPair(r, itemOf(r.dataset.id)));
    $('.qs__foot').hidden = n === 0;
    if (back) {
      const rows = $$('#qsList .qs__row'), r = rows.find(x => x.dataset.id === back.id) || rows[Math.min(back.i, rows.length - 1)];
      const el = r ? $(back.sel, r) || $('.qs__rm', r) : $('.qv__close', qs);
      if (el) el.focus({ preventScroll: true });
    }
  }
  function openSheet() {
    closeMenu();
    $('#toast').classList.remove('is-on');   // the message would sit over the list's close button
    renderSheet();
    qs.classList.add('is-open'); qs.setAttribute('aria-hidden', 'false');
    lenis && lenis.stop();
    ovOpen('qs');
    focusIn(qs, '.qv__close');
    gsap.fromTo('.qs__row', { y: 24, opacity: 0 }, { y: 0, opacity: 1, duration: 0.7, ease: 'expo.out', stagger: 0.04, delay: 0.15 });
  }
  function closeSheet(fromBack) {
    if (!qs.classList.contains('is-open')) return;
    qs.classList.remove('is-open'); qs.setAttribute('aria-hidden', 'true');
    unlock(); focusOut(qs);
    if (fromBack !== true) ovClosed('qs');
  }
  $$('[data-qs-close]', qs).forEach(b => b.addEventListener('click', closeSheet));
  $('#qsList').addEventListener('click', e => {
    if (e.target.closest('#qsBrowse')) { afterShowroom(() => scrollToEl('#catalogue')); return; }
    const row = e.target.closest('.qs__row'); if (!row) return;
    const id = row.dataset.id;
    const step = e.target.closest('[data-q]');
    if (step) setQty(id, Math.max(1, (rfq.get(id) || 0) + (+step.dataset.q)));   // − stops at 1; × removes the line
    if (e.target.closest('.qs__rm')) setQty(id, 0);
  });
  $('#qsList').addEventListener('change', e => {
    const row = e.target.closest('.qs__row'); if (row && e.target.tagName === 'INPUT' && !e.target.dataset.pk) setQty(row.dataset.id, e.target.value, true);
  });
  // if a showroom was open, scroll once it has finished closing (the page underneath is measured then)
  const afterShowroom = fn => { const was = sr.classList.contains('is-open'); closeSheet(); hardCloseShowroom(); setTimeout(fn, was && !reduce ? 950 : 80); };
  $('#qsForm').addEventListener('click', () => afterShowroom(() => scrollToEl('#form')));
  $('#qbarOpen').addEventListener('click', openSheet);
  $('#rfqBtn').addEventListener('click', openSheet);

  /* ================= Quick view ================= */
  const qv = $('#qv');
  let qvId = null;
  function qvKey() { const o = itemOf(qvId), p = readPick($('#qvPick'), o); return p.ok ? keyOf(o, p.v) : null; }
  function syncQV() {
    const o = itemOf(qvId); if (!o) return;
    const key = qvKey(), on = key && rfq.has(key);
    const btn = $('#qvAdd');
    btn.classList.toggle('is-added', !!on);
    $('span', btn).textContent = on ? 'Update quantity' : 'Add to quote';
    const lines = [...rfq].filter(([k]) => k.startsWith(o.id + '|'));
    $('#qvState').hidden = !lines.length;
    if (lines.length) $('#qvState b').textContent = 'In your quote: ' + lines.map(([k, q]) => (sizeWords(o, itemOf(k).pick) || o.name) + ' × ' + q).join(' · ');
    const p = readPick($('#qvPick'), o);
    $('#qvWa').dataset.waMsg = 'Hello Fakhri Tools, please send me a quote for: ' + fullName(o) + (p.ok && sizeWords(o, p.v) ? ' (' + sizeWords(o, p.v) + ')' : (o.size ? ' (' + o.size + ')' : '')) + '.'; applyLinks(qv);
  }
  function fillQV(key) {
    const o = itemOf(key); if (!o) return;
    qvId = o.id;
    const mat = matText(o), sp = sizeSpec(o);
    $('#qvMedia').innerHTML = imgTag(o.img, o.name);
    $('#qvCat').textContent = famName(o.c.fam) + ' / ' + o.c.name;
    $('#qvName').textContent = o.name;
    $('#qvRange').textContent = o.size ? (sp.t === 'one' ? 'Size' : 'Sizes we offer: ' + o.size) : 'Size';
    const pk = $('#qvPick');
    pk.dataset.pickRoot = o.id;
    pk.innerHTML = pickerHTML(o, o.pick !== null ? o.pick : (sp.t === 'one' ? sp.v : ''));
    tidyPair(pk, o);
    $('#qvSpecs').innerHTML =
      '<div><dt class="mono">Material</dt><dd>' + (mat ? esc(mat) : 'See specification') + '</dd></div>' +
      '<div><dt class="mono">Specs & ratings</dt><dd>' + (o.chips.length ? chipsHTML(o.chips) : 'Standard') + '</dd></div>' +
      '<div><dt class="mono">How to buy</dt><dd>Pick the size, add it to your quote, then send by WhatsApp or email — or call the counter</dd></div>';
    $('#qvQty').value = (o.pick !== null && rfq.get(key)) || 1;
    $('#qvPos').textContent = pad(o.i + 1) + ' / ' + pad(o.c.items.length);
    syncQV();
  }
  function openQV(key) {
    const wasOpen = qv.classList.contains('is-open');
    fillQV(key);
    $('.qv__card', qv).scrollTop = 0;   // each product starts at its photo and name
    qv.classList.add('is-open'); qv.setAttribute('aria-hidden', 'false');
    lenis && lenis.stop();
    if (!wasOpen) ovOpen('qv');
    if (!wasOpen) focusIn(qv, '.qv__close');
    if (!wasOpen) gsap.fromTo('.qv__card', { y: 40, scale: 0.96, opacity: 0 }, { y: 0, scale: 1, opacity: 1, duration: 0.7, ease: 'expo.out' });
    gsap.fromTo('#qvMedia img', { scale: 0.8, rotate: -6, opacity: 0 }, { scale: 1, rotate: 0, opacity: 1, duration: 0.9, ease: 'expo.out' });
  }
  function closeQV(fromBack) {
    if (!qv.classList.contains('is-open')) return;
    qv.classList.remove('is-open'); qv.setAttribute('aria-hidden', 'true'); qvId = null;
    unlock(); focusOut(qv);
    if (fromBack !== true) ovClosed('qv');
  }
  function stepQV(d) { const o = itemOf(qvId); if (o) openQV(o.c.slug + ':' + ((o.i + d + o.c.items.length) % o.c.items.length)); }
  $$('[data-qv-close]', qv).forEach(b => b.addEventListener('click', closeQV));
  $('#qvPrev').addEventListener('click', () => stepQV(-1));
  $('#qvNext').addEventListener('click', () => stepQV(1));
  $$('.qv [data-step]').forEach(b => b.addEventListener('click', () => { const i = $('#qvQty'); i.value = Math.min(99999, Math.max(1, (parseQty(i.value) || 1) + (+b.dataset.step))); }));
  $('#qvAdd').addEventListener('click', () => {
    const o = itemOf(qvId), p = readPick($('#qvPick'), o);
    if (!p.ok) return flagPick($('#qvPick'));
    const key = keyOf(o, p.v), q = Math.max(1, Math.min(99999, parseQty($('#qvQty').value) || 1));
    const isNew = !rfq.has(key);
    rfq.set(key, q); saveRfq(); syncRfq(isNew);
    toast((isNew ? 'Added to quote — ' : 'Updated — ') + fullName(o) + sizeOfLine(itemOf(key)) + ' × ' + q);
    if (isNew) requestAnimationFrame(() => flyToBar($('#qvMedia')));
  });
  document.addEventListener('click', e => {
    const b = e.target.closest('[data-qv]');
    if (b) { e.preventDefault(); openQV(b.dataset.qv); }
  });

  /* ================= Product markup ================= */
  function rowHTML(c, i, withCat) {
    const o = itemOf(c.slug + ':' + i), on = hasAny(o.id);
    return '<div class="prow" data-fly>' +
      '<button class="prow__img" data-qv="' + o.id + '">' + imgTag(o.img) + '</button>' +
      '<button class="prow__main" data-qv="' + o.id + '">' + (withCat ? '<span class="prow__cat">' + esc(c.name) + '</span>' : '') + '<h4>' + esc(o.name) + '</h4>' +
      (o.size ? '<div class="prow__size">' + esc(o.size) + '</div>' : '') + chipsHTML(o.chips) + '</button>' +
      '<button class="add' + (on ? ' is-added' : '') + '" data-add="' + o.id + '"><span class="plus">+</span><span class="lbl">' + (on ? 'Added' : 'Add<span class="lbl__x"> to quote</span>') + '</span></button>' +
      '</div>';
  }
  function cardHTML(c, i) {
    const o = itemOf(c.slug + ':' + i), on = hasAny(o.id), mat = groupOf(c.items[i]);
    return '<article class="pc" data-fly data-mat="' + esc(mat || '') + '" data-specs="' + esc(o.chips.join('|')) + '">' +
      '<button class="pc__media" data-qv="' + o.id + '" data-cursor="View"><span class="pc__no mono">' + pad(i + 1) + '</span>' +
      (mat ? '<span class="pc__mat mono">' + esc(mat) + '</span>' : '') + imgTag(o.img, o.name) + '</button>' +
      '<div class="pc__body"><h4>' + esc(o.name) + '</h4>' + (o.size ? '<div class="pc__size">' + esc(o.size) + '</div>' : '') + chipsHTML(o.chips) + '</div>' +
      '<div class="pc__foot"><button class="pc__quick mono" data-qv="' + o.id + '">Quick view</button>' +
      '<button class="add' + (on ? ' is-added' : '') + '" data-add="' + o.id + '"><span class="plus">+</span><span class="lbl">' + (on ? 'Added' : 'Add<span class="lbl__x"> to quote</span>') + '</span></button></div>' +
      '</article>';
  }

  /* ================= Category showroom (full screen) ================= */
  const sr = $('#showroom'), srScroll = $('#srScroll'), srContent = $('#srContent');
  const RELATED = {
    valves: ['gaskets-sheets', 'ss-ms-flanges-forging-casting', 'ss-forged-low-pressure-bw-fittings', 'instrumentation-fittings-pressure-gas'],
    couplings: ['gaskets-sheets', 'quick-couplings', 'chicago-couplings-fittings', 'hammer-union'],
    fittings: ['ss-ms-flanges-forging-casting', 'gaskets-sheets', 'ball-valves', 'gate-valves'],
    sealing: ['ss-ms-flanges-forging-casting', 'ball-valves', 'gate-valves', 'instrumentation-fittings-pressure-gas']
  };
  let srIdx = -1;
  const filt = { mat: 'all', spec: 'all' };

  $('#srTabs').innerHTML = CATS.map(c => '<button data-cat="' + c.slug + '">' + esc(c.name) + '</button>').join('');

  function renderShowroom(idx) {
    srIdx = idx;
    const c = CATS[idx];
    filt.mat = 'all'; filt.spec = 'all';
    const mats = [...new Set(c.items.map(groupOf).filter(Boolean))];
    const specCount = new Map();
    c.items.forEach(it => it[1].forEach(s => specCount.set(s, (specCount.get(s) || 0) + 1)));
    const specs = [...specCount].sort((a, b) => b[1] - a[1]).map(x => x[0]).slice(0, 10);
    const next = CATS[(idx + 1) % CATS.length];
    const related = RELATED[c.fam].filter(s => s !== c.slug).slice(0, 3).map(catBySlug);
    const fchips = (key, list) => '<button class="chip is-on" data-f="' + key + '" data-v="all">All</button>' + list.map(v => '<button class="chip" data-f="' + key + '" data-v="' + esc(v) + '">' + esc(v) + '</button>').join('');

    srContent.innerHTML =
      '<header class="sr__hero">' +
        '<div class="sr__copy">' +
          '<div class="sr__crumbs mono"><button data-sr-close>Catalogue</button><i>/</i><span>' + famName(c.fam) + '</span><i>/</i><b>' + pad(idx + 1) + ' of ' + CATS.length + '</b></div>' +
          '<h2 class="sr__title">' + esc(c.name) + '</h2>' +
          '<p class="sr__desc">' + c.desc + '</p>' +
          '<div class="sr__facts"><div><b>' + pad(c.items.length) + '</b><small class="mono">Products</small></div>' +
            '<div><b>' + pad(Math.max(1, mats.length)) + '</b><small class="mono">Materials</small></div>' +
            '<div><b>' + pad(specCount.size) + '</b><small class="mono">Specs & ratings</small></div></div>' +
          '<div class="sr__ctas" data-fly><img class="sr__flysrc" src="' + coverOf(c) + '" alt="" >' +
            '<button class="btn btn--red magnetic" data-addall>Quote the full range <svg><use href="#arrow"/></svg></button>' +
            '<a class="btn btn--ghost magnetic" href="#" data-wa-link data-wa-msg="Hello Fakhri Tools, I would like a quote for your ' + esc(c.name) + '."><svg><use href="#wa"/></svg> Ask on WhatsApp</a></div>' +
        '</div>' +
        '<div class="sr__stage">' +
          '<div class="sr__orb"><svg class="sr__ring" viewBox="0 0 200 200"><defs><path id="srRing" d="M100,100 m-90,0 a90,90 0 1,1 180,0 a90,90 0 1,1 -180,0"/></defs><text><textPath href="#srRing">Fakhri Tools · Al Quoz Industrial Area 3 · Dubai · Get a quote · Call · WhatsApp ·</textPath></text></svg>' +
          '<div class="sr__plate" id="srPlate">' + imgTag(coverOf(c), c.name) + '</div></div>' +
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
      '<section class="sr__related"><div class="sr__rel-head"><span class="mono">Complete the line</span><h3>Everything that goes with ' + esc(c.name.toLowerCase().replace(/ — .*/, '')) + '.</h3><p>Gaskets, flanges, fittings and instruments — ask for them all in one quote.</p></div>' +
        '<div class="sr__rel-grid">' + related.map(r => '<button class="rel" data-cat="' + r.slug + '"><span class="rel__img">' + imgTag(coverOf(r), r.name) + '</span><span class="mono">' + pad(r.items.length) + ' products</span><b>' + r.name + '</b><i><svg><use href="#arrow"/></svg></i></button>').join('') + '</div>' +
      '</section>' +
      '<button class="sr__next" data-cat="' + next.slug + '"><span class="mono">Next category — ' + pad(((idx + 1) % CATS.length) + 1) + '</span><b>' + esc(next.name) + '</b><span class="sr__next-img">' + imgTag(coverOf(next), next.name) + '</span></button>';

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
      unlock();
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
    // going back removes the showroom's own history step (popstate then closes it)
    if (history.state && history.state.sr) history.back();
    else doCloseShowroom();
  }
  const closeDrawer = hardCloseShowroom;
  window.addEventListener('popstate', () => {
    const m = location.hash.match(/^#products\/(.+)$/);
    const ms = m && slugAlias(m[1]);
    if (ms && catBySlug(ms)) showCat(ms); else doCloseShowroom();
  });
  // every category link (top menu, footer, old #products/<slug> links) opens that category in the one product list on the page
  document.addEventListener('click', e => {
    const b = e.target.closest('[data-cat]');
    if (!b || e.ctrlKey || e.metaKey || e.shiftKey) return;
    e.preventDefault(); closeQV(); showCat(b.dataset.cat);
  });
  function closeTop() {
    if (qv.classList.contains('is-open')) return closeQV();
    if (qs.classList.contains('is-open')) return closeSheet();
    if (sr.classList.contains('is-open')) return closeShowroom();
    closeMega(); closeMenu();
  }
  document.addEventListener('keydown', e => {
    if (!qv.classList.contains('is-open') || /INPUT|SELECT|TEXTAREA/.test(e.target.tagName)) return;
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
    '<div><h6>' + esc(f.name) + '</h6>' + CATS.filter(c => c.fam === f.id).map(c =>
      '<button data-cat="' + c.slug + '">' + esc(c.name) + '<small>' + pad(c.items.length) + '</small></button>').join('') + '</div>').join('') +
    '<div class="mega__feature"><b>Get a quote</b><p>Call, WhatsApp or visit the counter in Al Quoz. Mon–Sat 7:30am–6:00pm, Sunday closed.</p><a href="#contact" data-scroll>Get a quote <svg><use href="#arrow"/></svg></a></div>';
  // footer links go to the plain product pages (products/<slug>.html) so search engines can follow them
  $('#footCats').innerHTML = CATS.map(c => '<a href="products/' + pageOf(c) + '.html" data-cat="' + c.slug + '">' + esc(c.name) + '</a>').join('') + '<a href="products/index.html" data-cat=""><b>All products</b></a>';

  const megaBtn = $('#megaBtn');
  function openMega() { nav.classList.add('is-mega'); megaBtn.setAttribute('aria-expanded', 'true'); }
  function closeMega() { nav.classList.remove('is-mega'); megaBtn.setAttribute('aria-expanded', 'false'); }
  // with a mouse the menu opens on hover and closes when the pointer leaves, so a click only opens it
  megaBtn.addEventListener('click', () => nav.classList.contains('is-mega') && !fine ? closeMega() : openMega());
  if (fine) {
    let megaT;
    megaBtn.addEventListener('mouseenter', () => { clearTimeout(megaT); openMega(); });
    nav.addEventListener('mouseenter', () => clearTimeout(megaT));
    nav.addEventListener('mouseleave', () => { clearTimeout(megaT); megaT = setTimeout(closeMega, 400); });
  }

  /* ---------------- Mobile menu ---------------- */
  function closeMenu(fromBack) { if (document.body.classList.contains('is-menu')) { document.body.classList.remove('is-menu'); $('#burger').setAttribute('aria-expanded', 'false'); unlock(); if (fromBack !== true) ovClosed('menu'); } }
  $('#burger').addEventListener('click', () => {
    const on = document.body.classList.toggle('is-menu');
    $('#burger').setAttribute('aria-expanded', String(on));
    if (on) { lenis && lenis.stop(); ovOpen('menu'); } else { unlock(); ovClosed('menu'); }
  });

  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') closeTop();
    if (e.key === '/' && !/INPUT|TEXTAREA|SELECT/.test(document.activeElement.tagName) && !$('#qv.is-open, #qs.is-open, #showroom.is-open') && !document.body.classList.contains('is-menu') && !document.body.classList.contains('is-filtering')) {
      e.preventDefault(); scrollToEl('#catalogue'); setTimeout(() => $('#search').focus({ preventScroll: true }), 900);
    }
  });

  /* ---------------- Catalogue: filters on the left, every product on the right ---------------- */
  // search text is matched in one plain form: 1/2 = ½, 1-1/2 or 1 1/2 = 1½, C.S = CS, aluminum = aluminium
  const FRAC = { '1/8': '⅛', '1/4': '¼', '3/8': '⅜', '1/2': '½', '3/4': '¾' };
  const qn = s => String(s).toLowerCase().replace(/[”″“]/g, '"')
    .replace(/(^|\s)(\d{1,2})[\s-]+(1\/8|1\/4|3\/8|1\/2|3\/4)/g, (m, sp, n, f) => sp + n + FRAC[f])
    .replace(/(^|[^\d\/])(1\/8|1\/4|3\/8|1\/2|3\/4)/g, (m, sp, f) => sp + FRAC[f])
    .replace(/([\d⅛¼⅜½¾])"?\s*[x×*]\s*(?=[\d⅛¼⅜½¾])/g, '$1×')   // 4x3, 4" x 3" and 4" × 3" are written the same way
    .replace(/([a-z])\.(?=[a-z])/g, '$1').replace(/aluminum/g, 'aluminium')
    .replace(/([a-z])-(?=[a-z])/g, '$1 ')                     // y-strainer = y strainer, butt-weld = butt weld
    .replace(/(^|[^a-z])(ss|cs|ms|gi|ci)(?=\d)/g, '$1$2 ')     // ss316 = ss 316
    .replace(/(\d)#/g, '$1')                                  // 150# = 150 (finds CL150)
    .replace(/(^|[^a-z0-9])dn ?(\d{2,3})(?!\d)/g, (m, sp, d) => sp + (DN[d] || 'dn' + d));   // DN50 = 2"
  // metric pipe sizes (DN) and the inch size they are sold as
  const DN = { 15: '½"', 20: '¾"', 25: '1"', 32: '1¼"', 40: '1½"', 50: '2"', 65: '2½"', 80: '3"', 100: '4"', 125: '5"', 150: '6"', 200: '8"', 250: '10"', 300: '12"', 350: '14"', 400: '16"', 450: '18"', 500: '20"', 600: '24"' };
  // a size or number is matched whole: ½ doesn't find 1½ or 2½, and 2 doesn't find 2½ or 24
  const NUM = '0-9⅛¼⅜½¾', reEsc = t => t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const tokTest = t => /^[0-9⅛¼⅜½¾]/.test(t) || /[0-9⅛¼⅜½¾]$/.test(t)
    ? (r => h => r.test(h))(new RegExp((/^[0-9⅛¼⅜½¾]/.test(t) ? '(?:^|[^' + NUM + '])' : '') + reEsc(t) + (/[0-9⅛¼⅜½¾]$/.test(t) ? '(?![' + NUM + '])' : '')))
    : (r => h => r.test(h))(new RegExp('(?:^|[^a-z0-9])' + reEsc(t)));
  // every size in a range (½" – 4" also finds 1½"), so searching a size finds the product
  const sizesOf = o => { const sp = sizeSpec(o); return (sp.opts || []).concat(sp.L || [], sp.S || []).join(' '); };
  const ALL = [];
  CATS.forEach(c => c.items.forEach((it, i) => {
    const o = itemOf(c.slug + ':' + i);
    o.mat = matOf(o) || 'Other';
    // a product can be in more than one material ("Brass, Stainless"): it shows under each of them
    o.mats = o.matSet ? matGroups(o.matSet) : /^C\.S & S\.S/.test(o.name) ? ['Carbon steel', 'Stainless'] : [o.mat];
    o.hay = qn(o.name + ' ' + o.chips.join(' ') + ' ' + o.size + ' ' + c.name + ' ' + famName(c.fam) + ' ' + o.mats.join(' ') + ' ' + o.matSet + ' ' + sizesOf(o));
    o.nameQ = qn(o.name); o.specQ = qn(o.chips.join(' ') + ' ' + o.matSet + ' ' + o.size + ' ' + sizesOf(o));
    o.rank = ALL.length;
    ALL.push(o);
  }));
  $('#search').placeholder = 'Search ' + ALL.length + ' products' + (innerWidth > 700 ? ': try "camlock", "CL150" or "316L"' : '');
  const MAT_ORDER = ['Stainless', 'Carbon steel', 'Mild steel', 'Cast iron', 'Galvanised', 'Bronze', 'Brass', 'Aluminium', 'Rubber', 'Other'];
  // materials the owner typed in the editor get their own filter line, just above "Other"
  const matList = () => {
    const used = new Set(ALL.flatMap(o => o.mats)), own = [...used].filter(m => !MAT_ORDER.includes(m)).sort();
    return MAT_ORDER.filter(m => m !== 'Other' && used.has(m)).concat(own, used.has('Other') ? ['Other'] : []);
  };
  const specFreq = new Map();
  ALL.forEach(o => o.chips.forEach(s => specFreq.set(s, (specFreq.get(s) || 0) + 1)));
  const SPECS = [...specFreq].filter(([, n]) => n >= 3).sort((a, b) => b[1] - a[1]).slice(0, 16).map(([s]) => s);
  const SPEC_LABEL = { 'F/T': 'Flanged (F/T)', SW: 'Socket weld (SW)', BW: 'Butt weld (BW)', NPT: 'NPT thread', BSPT: 'BSPT thread' };
  const PAGE = 24;
  const navOff = () => (parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--nav-h')) || 100) + 8;
  // an exact page position, so a filter row appearing or disappearing above the list can't throw it off
  const scrollKat = () => { const el = $('.kat-main'); if (lenis) lenis.scrollTo(el.getBoundingClientRect().top + scrollY - navOff(), { duration: 1.2, force: true }); else window.scrollTo({ top: el.getBoundingClientRect().top + scrollY - navOff(), behavior: 'smooth' }); };
  const kf = { cats: new Set(), mats: new Set(), specs: new Set(), q: '', sort: 'rec', limit: PAGE };
  const kGrid = $('#katGrid'), kSide = $('#katSide');
  const waPrice = (o, v) => { const w = v !== undefined && v !== null ? sizeWords(o, v) : o.size; return 'Hello Fakhri Tools, please send me a price for: ' + fullName(o) + (w ? ' (' + w + ')' : '') + '. Quantity: '; };

  // what passes every filter except the one named in `skip` (so each group shows honest counts)
  function pass(o, skip) {
    if (skip !== 'all' && skip !== 'cats' && kf.cats.size && !kf.cats.has(o.c.slug)) return false;
    if (skip !== 'all' && skip !== 'mats' && kf.mats.size && !o.mats.some(m => kf.mats.has(m))) return false;
    if (skip !== 'all' && skip !== 'specs' && kf.specs.size && ![...kf.specs].every(s => o.chips.includes(s))) return false;
    if (kf.q) { if (kf.qT !== kf.q) { kf.qT = kf.q; kf.qTests = kf.q.split(/\s+/).filter(Boolean).map(tokTest); } if (!kf.qTests.every(f => f(o.hay))) return false; }
    return true;
  }
  // ticking a filter clears the others (one filter at a time), so each count says what that click will show: only the search narrows it
  const countBy = (skip, key) => { const m = new Map(); ALL.forEach(o => { if (pass(o, 'all')) [].concat(key(o)).forEach(k => m.set(k, (m.get(k) || 0) + 1)); }); return m; };

  // category rail with photos
  // real links to each category page (search engines follow them); a click filters the list on this page instead
  $('#katRail').innerHTML = '<a class="kr is-on" href="products/index.html" data-pick=""><span class="kr__img kr__img--all"><b>' + ALL.length + '</b></span><span class="kr__name">All products</span></a>' +
    CATS.map(c => '<a class="kr" href="products/' + pageOf(c) + '.html" data-pick="' + c.slug + '"><span class="kr__img">' + imgTag(coverOf(c), '') + '</span><span class="kr__name">' + esc(c.name) + '</span><span class="kr__n mono">' + c.items.length + '</span></a>').join('');
  $('#katRail').addEventListener('click', e => {
    const b = e.target.closest('[data-pick]'); if (!b || e.ctrlKey || e.metaKey || e.shiftKey || e.button) return;
    e.preventDefault();
    kf.cats.clear(); kf.mats.clear(); kf.specs.clear(); if (b.dataset.pick) kf.cats.add(b.dataset.pick);
    kf.limit = PAGE; renderKat(true);
    const top = $('.kat-main').getBoundingClientRect().top;
    if (top < 0 || top > innerHeight * 0.6) scrollKat();
  });

  const kOpenG = new Map();
  // one filter group open at a time on laptops, so the filter column stays short and never has to scroll on its own
  $('#katFacets').addEventListener('click', e => {
    const sm = e.target.closest('summary'); if (!sm) return;
    const d = sm.parentNode, opening = !d.open;
    kOpenG.set(d.dataset.g, opening);
    if (opening && deskQ.matches) $$('#katFacets details[open]').forEach(x => { if (x !== d) { x.open = false; kOpenG.set(x.dataset.g, false); } });
  });
  function facetsHTML() {
    const cc = countBy('cats', o => o.c.slug), mc = countBy('mats', o => o.mats), sc = countBy('specs', o => o.chips);
    const box = (group, val, label, n) => '<label class="kf' + (n ? '' : ' is-zero') + '"><input type="checkbox" data-g="' + group + '" value="' + esc(val) + '"' + (kf[group].has(val) ? ' checked' : '') + '><i></i><span>' + label + '</span><em class="mono">' + (n || 0) + '</em></label>';
    let h = '';
    FAMS.forEach(f => {
      const cs = CATS.filter(c => c.fam === f.id);
      const open = cs.some(c => kf.cats.has(c.slug));
      h += '<details class="kgroup" data-g="' + f.id + '"' + ((kOpenG.has(f.id) ? kOpenG.get(f.id) : open) ? ' open' : '') + '><summary>' + esc(f.name) + '<em class="mono">' + cs.reduce((a, c) => a + (cc.get(c.slug) || 0), 0) + '</em></summary><div class="kgroup__list">' +
        cs.map(c => box('cats', c.slug, esc(c.name), cc.get(c.slug))).join('') + '</div></details>';
    });
    h += '<details class="kgroup" data-g="mat"' + ((kOpenG.has('mat') ? kOpenG.get('mat') : kf.mats.size > 0) ? ' open' : '') + '><summary>Material</summary><div class="kgroup__list">' +
      matList().map(m => box('mats', m, esc(m), mc.get(m))).join('') + '</div></details>';
    h += '<details class="kgroup" data-g="spec"' + ((kOpenG.has('spec') ? kOpenG.get('spec') : kf.specs.size > 0) ? ' open' : '') + '><summary>Connection &amp; rating</summary><div class="kgroup__chips">' +
      SPECS.map(s => '<button class="kchip' + (kf.specs.has(s) ? ' is-on' : '') + (sc.get(s) ? '' : ' is-zero') + '" data-spec="' + esc(s) + '">' + esc(SPEC_LABEL[s] || s) + ' <em>' + (sc.get(s) || 0) + '</em></button>').join('') + '</div></details>';
    return h;
  }

  function noPhoto(o) {
    const base = o.name.replace(/^(C\.S & S\.S|G\.I|M\.S|S\.S|C\.I|Aluminium|Brass|PP|Clear)\s+/, '');
    const [head, ...rest] = base.split(', ');
    return '<span class="kc__np"><b>' + esc(head) + '</b>' + (rest.length ? '<em>' + esc(rest.join(', ')) + '</em>' : '') + '<span class="mono">Photo on WhatsApp</span></span>';
  }
  function kcardHTML(o, cur) {
    const one = fixedSize(o), on = one && rfq.has(keyOf(o, sizeSpec(o).v)), mat = matText(o);
    return '<article class="kc" data-fly data-pick-root="' + o.id + '">' +
      '<button class="kc__media" data-qv="' + o.id + '" data-cursor="View" aria-label="Quick view: ' + esc(o.name) + '">' +
        (o.img ? imgTag(o.img, o.name) : noPhoto(o)) + '<span class="kc__peek mono">Quick view</span></button>' +
      '<div class="kc__body"><span class="kc__cat mono">' + esc(o.c.name) + '</span>' +
        '<h3 class="kc__name"><button data-qv="' + o.id + '">' + esc(o.name) + '</button></h3>' +
        (mat ? '<div class="kc__size kc__material"><span class="mono">Material</span> ' + esc(mat) + '</div>' : '') +
        (one ? '<div class="kc__size"><span class="mono">Size</span> ' + esc(o.size) + '</div>' : pickerHTML(o, cur)) +
        (o.chips.length ? '<div class="kc__chips">' + o.chips.slice(0, 4).map(s => '<span>' + esc(s) + '</span>').join('') + (o.chips.length > 4 ? '<span>+' + (o.chips.length - 4) + '</span>' : '') + '</div>' : '') +
      '</div>' +
      '<div class="kc__foot"><button class="add kc__add' + (on ? ' is-added' : '') + '" data-add="' + o.id + '"><span class="plus">+</span><span class="lbl">' + (on ? 'Added' : 'Add<span class="lbl__x"> to quote</span>') + '</span></button>' +
        '<a class="kc__wa" href="#" data-wa-link data-wa-msg="' + esc(waPrice(o)) + '" aria-label="Ask the price of ' + esc(o.name) + ' on WhatsApp" title="Ask the price on WhatsApp"><svg><use href="#wa"/></svg></a></div>' +
      '</article>';
  }
  const promoHTML = () => '<aside class="kc kc--promo"><span class="mono">Trade counter · Al Quoz</span><b>Message tonight.<br>Priced by 7:30am.</b>' +
    '<p>Send your list or a photo on WhatsApp. We reply with prices before the counter opens.</p>' +
    '<a class="btn btn--red" href="#" data-wa-link data-wa-msg="Hello Fakhri Tools, please price this list for me:"><svg><use href="#wa"/></svg> Send my list</a></aside>';

  const kMoreBar = (hits, shown) => {
    $('#katMore').innerHTML = hits.length > shown.length ?
      '<div class="kat-more__bar"><i style="width:' + (shown.length / hits.length * 100) + '%"></i></div><span class="mono">Showing ' + shown.length + ' of ' + hits.length + '</span><button class="btn btn--dark" data-kmore>Show ' + Math.min(PAGE, hits.length - shown.length) + ' more product' + (hits.length - shown.length === 1 ? '' : 's') + '</button>' :
      (hits.length > PAGE ? '<span class="mono">That’s all ' + hits.length + ' products</span>' : '');
  };
  let kFirst = true;
  const kPicks = new Map();
  // more = "Show more": the cards already on screen stay as they are and only the new ones are added
  function renderKat(animate, more) {
    const hits = ALL.filter(o => pass(o));
    if (kf.sort === 'az') hits.sort((a, b) => a.name.localeCompare(b.name));
    else if (kf.sort === 'za') hits.sort((a, b) => b.name.localeCompare(a.name));
    else if (kf.q) {   // Recommended + a search: products whose own name has the words first, then their specs, then the rest
      // a size on its own (2, ½", 4×3) doesn't reorder the list: "2" must not put "2PC" valves first
      const words = kf.q.split(/\s+/).filter(Boolean), sz = /^[\d⅛¼⅜½¾×"]+$/;
      const sc = o => kf.qTests.reduce((n, f, i) => n + (sz.test(words[i]) ? 0 : f(o.nameQ) ? 3 : f(o.specQ) ? 1 : 0), 0);
      hits.forEach(o => { o.qs = sc(o); });
      hits.sort((a, b) => b.qs - a.qs || a.rank - b.rank);
    }
    const shown = hits.slice(0, kf.limit);
    const pageH = document.documentElement.scrollHeight;
    const had = more ? $$('.kc:not(.kc--promo)', kGrid).length : 0;
    if (more && had >= 7 && had < shown.length) {
      const kids = kGrid.children.length;
      kGrid.insertAdjacentHTML('beforeend', shown.slice(had).map(o => kcardHTML(o)).join(''));
      [...kGrid.children].slice(kids).forEach(applyLinks); kMoreBar(hits, shown); applyLinks($('#katMore'));
      if (document.documentElement.scrollHeight !== pageH) ScrollTrigger.refresh();
      return;
    }
    // sizes already picked on cards survive "Show more", filters, sort and search,
    // also when the card was out of the list for a while (kPicks remembers them)
    $$('[data-pick-root]', kGrid).forEach(r => {
      const o = itemOf(r.dataset.pickRoot); if (!o) return;
      const p = $$('[data-pk]', r).some(el => el.value) && readPick(r, o);
      if (p && p.ok) kPicks.set(o.id, p.v); else kPicks.delete(o.id);
    });
    const keep = new Map(shown.filter(o => kPicks.has(o.id)).map(o => [o.id, kPicks.get(o.id)]));
    let html = shown.map(o => kcardHTML(o, keep.get(o.id)));
    if (shown.length >= 7) html.splice(7, 0, promoHTML());
    kGrid.innerHTML = hits.length ? html.join('') :
      '<div class="kat-empty"><b>Nothing matches that yet.</b><p>Clear a filter, or send us a photo of the part on WhatsApp and we’ll check our stock.</p>' +
      '<div class="kat-empty__btns"><button class="btn btn--ghost-dk" data-kclear>Clear filters</button><a class="btn btn--red" href="#" data-wa-link data-wa-msg="Hello Fakhri Tools, I’m looking for: "><svg><use href="#wa"/></svg> Ask on WhatsApp</a></div></div>';
    $('#katCount').textContent = hits.length === ALL.length ? 'All ' + ALL.length + ' products' : hits.length + ' of ' + ALL.length + ' products';
    $('#katApplyN').textContent = hits.length;
    kMoreBar(hits, shown);
    $('#katFacets').innerHTML = facetsHTML();
    // active filter pills
    const pills = [];
    kf.cats.forEach(s => pills.push(['cats', s, catBySlug(s).name]));
    kf.mats.forEach(m => pills.push(['mats', m, m]));
    kf.specs.forEach(s => pills.push(['specs', s, SPEC_LABEL[s] || s]));
    if (kf.q) pills.push(['q', '', '“' + kf.q + '”']);
    $('#katActive').innerHTML = pills.map(p => '<button class="kpill" data-pg="' + p[0] + '" data-pv="' + esc(p[1]) + '">' + esc(p[2]) + '<span aria-hidden="true">×</span></button>').join('') +
      (pills.length > 1 ? '<button class="kpill kpill--clear mono" data-kclear>Clear all</button>' : '');
    const nf = kf.cats.size + kf.mats.size + kf.specs.size;
    const fn = $('#katFilterN'); fn.hidden = !nf; fn.textContent = nf;
    $$('.kr', $('#katRail')).forEach(b => b.classList.toggle('is-on', kf.cats.size ? kf.cats.size === 1 && kf.cats.has(b.dataset.pick) : !b.dataset.pick));
    keep.forEach((v, id) => {
      const r = $('[data-pick-root="' + id + '"]', kGrid); if (!r) return;
      const o = itemOf(id); tidyPair(r, o); $$('[data-add]', r).forEach(paintAdd);
      const wa = $('[data-wa-msg]', r); if (wa) wa.dataset.waMsg = waPrice(o, v);
    });
    applyLinks(kGrid); applyLinks($('#katMore'));
    if (animate && !reduce && !kFirst) gsap.fromTo($$('.kc', kGrid).slice(0, 12), { y: 26, opacity: 0 }, { y: 0, opacity: 1, duration: 0.6, ease: 'expo.out', stagger: 0.03 });
    kFirst = false;
    // the sections below only need their scroll positions worked out again if the page got longer or shorter
    if (document.documentElement.scrollHeight !== pageH) ScrollTrigger.refresh();
  }

  // after a filter change the list gets shorter; if you were further down, go back to the top of the list so the results are in view
  const toListTop = () => { if (!kSide.classList.contains('is-open') && $('.kat-main').getBoundingClientRect().top < navOff() - 20) scrollKat(); };
  $('#katFacets').addEventListener('change', e => {
    const t = e.target; if (!t.dataset.g) return;
    const had = document.activeElement === t, g = t.dataset.g, val = t.value;
    // one filter at a time: ticking a new one clears the one before
    if (t.checked) { kf.cats.clear(); kf.mats.clear(); kf.specs.clear(); kf[g].add(val); } else kf[g].delete(val);
    kf.limit = PAGE; renderKat(true); toListTop();
    // keyboard users keep their place in the filter list
    if (had) { const el = $$('#katFacets input[data-g="' + g + '"]').find(x => x.value === val); if (el) el.focus({ preventScroll: true }); }
  });
  $('#katFacets').addEventListener('click', e => {
    const b = e.target.closest('[data-spec]'); if (!b) return;
    const s = b.dataset.spec; if (kf.specs.has(s)) kf.specs.delete(s); else { kf.cats.clear(); kf.mats.clear(); kf.specs.clear(); kf.specs.add(s); }
    kf.limit = PAGE; renderKat(true); toListTop();
  });
  // open one category in the product list (empty slug = all products) and bring the list into view
  function showCat(slug) {
    closeMega(); closeMenu();
    kf.cats.clear(); kf.mats.clear(); kf.specs.clear(); kf.q = ''; $('#search').value = ''; kf.limit = PAGE;
    if (slug && catBySlug(slug)) kf.cats.add(slug);
    kOpenG.clear();
    renderKat(true);
    afterShowroom(scrollKat);
  }
  function clearKat() { kf.cats.clear(); kf.mats.clear(); kf.specs.clear(); kf.q = ''; $('#search').value = ''; kf.limit = PAGE; renderKat(true); toListTop(); }
  $('#katReset').addEventListener('click', clearKat);
  $('#catalogue').addEventListener('click', e => {
    if (e.target.closest('[data-kclear]')) return clearKat();
    if (e.target.closest('[data-kmore]')) { kf.limit += PAGE; const n = $$('.kc:not(.kc--promo)', kGrid).length; renderKat(false, true); if (!reduce) gsap.fromTo($$('.kc:not(.kc--promo)', kGrid).slice(n), { y: 26, opacity: 0 }, { y: 0, opacity: 1, duration: 0.6, ease: 'expo.out', stagger: 0.025 }); return; }
    const p = e.target.closest('[data-pg]');
    if (p) { if (p.dataset.pg === 'q') { kf.q = ''; $('#search').value = ''; } else kf[p.dataset.pg].delete(p.dataset.pv); kf.limit = PAGE; renderKat(true); toListTop(); }
  });
  let kT;
  $('#search').addEventListener('input', e => { clearTimeout(kT); kT = setTimeout(() => { kf.q = qn(e.target.value.trim().replace(/[<>&"]/g, '')); kf.limit = PAGE; renderKat(true); }, 140); });
  $('#katSort').addEventListener('change', e => { kf.sort = e.target.value; renderKat(true); });

  // laptops: the filter column scrolls with the page and then sticks once its bottom is in view (no scroll box inside a scroll box)
  const deskQ = matchMedia('(min-width: 900px)');   // computers get the 75% stylesheet, where the side filter column starts at 826px
  function fitSide() {
    if (!deskQ.matches) { kSide.style.top = ''; return; }
    const navH = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--nav-h')) || 80;
    const room = innerHeight - navH - 24;
    kSide.style.top = (kSide.offsetHeight <= room ? navH + 24 : innerHeight - kSide.offsetHeight - 20) + 'px';
  }
  if ('ResizeObserver' in window) new ResizeObserver(fitSide).observe(kSide);
  addEventListener('resize', fitSide);

  // phones: filters slide up as a sheet
  // the phone sheet scrolls on its own; on laptops the wheel always scrolls the page smoothly, even over the filters
  const kOpen = (on, fromBack) => {
    const was = document.body.classList.contains('is-filtering');
    kSide.toggleAttribute('data-lenis-prevent', on); kSide.classList.toggle('is-open', on); $('#katScrim').classList.toggle('is-on', on); document.body.classList.toggle('is-filtering', on);
    if (on) { lenis && lenis.stop(); if (!was) ovOpen('filt'); } else { unlock(); if (was && fromBack !== true) ovClosed('filt'); }
  };
  $('#katFilterBtn').addEventListener('click', () => kOpen(true));
  $('#katSideClose').addEventListener('click', () => kOpen(false));
  $('#katApply').addEventListener('click', () => { kOpen(false); scrollKat(); });
  $('#katScrim').addEventListener('click', () => kOpen(false));
  document.addEventListener('keydown', e => { if (e.key === 'Escape' && kSide.classList.contains('is-open')) kOpen(false); });
  renderKat(false);

  // Business details for search engines are written into index.html by tools/build-pages.js (<!-- seo:ld -->), so they are there without JavaScript.

  /* ---------------- Brands ---------------- */
  const BRANDS = window.FT_BRANDS || [];
  $('#brandsGrid').innerHTML = BRANDS.map((b, i) =>
    '<button class="btile" data-brand="' + esc(b.name) + '" data-cursor="Quote">' +
      '<span class="btile__no mono">' + pad(i + 1) + '</span>' +
      '<span class="btile__mark">' + (b.logo ? '<img src="' + esc(b.logo) + '" alt="' + esc(b.name) + '" loading="lazy" decoding="async" referrerpolicy="no-referrer">' : '<span class="btile__word' + (b.name.length > 12 ? ' is-long' : '') + '">' + esc(b.name).replace(/-/g, '‑') + '</span>') + '</span>' +
      '<span class="btile__foot"><span class="mono">' + (b.logo ? esc(b.name) : 'Brand') + '</span><b>Get a quote <svg><use href="#arrow"/></svg></b></span>' +
    '</button>').join('') +
    '<a class="btile btile--ask" href="#" data-wa-link data-wa-msg="Hello Fakhri Tools, do you supply this brand: "><span class="btile__no mono">Not listed?</span>' +
      '<span class="btile__mark"><span class="btile__word is-long">Ask for your brand</span></span>' +
      '<span class="btile__foot"><span class="mono">On WhatsApp</span><b>Ask now <svg><use href="#arrow"/></svg></b></span></a>';
  // a logo that will not load (moved or blocked by its website) falls back to the brand name
  $$('#brandsGrid .btile__mark img').forEach(img => {
    const toWord = () => {
      const t = img.closest('.btile'), n = t.dataset.brand;
      img.parentNode.innerHTML = '<span class="btile__word' + (n.length > 12 ? ' is-long' : '') + '">' + esc(n).replace(/-/g, '‑') + '</span>';
      $('.btile__foot .mono', t).textContent = 'Brand';
    };
    // very wide logos (long company names) may use the whole tile width, or they come out tiny on phones
    const shape = () => img.classList.toggle('is-wide', img.naturalWidth > img.naturalHeight * 4);
    if (img.complete && !img.naturalWidth) toWord(); else { img.addEventListener('error', toWord, { once: true }); if (img.complete) shape(); else img.addEventListener('load', shape, { once: true }); }
  });
  applyLinks($('#brandsGrid'));
  $('#brandsGrid').addEventListener('click', e => {
    const t = e.target.closest('[data-brand]'); if (!t) return;
    const msg = $('#fMsg');
    const line = 'Quote request — ' + t.dataset.brand + ': ';
    if (!msg.value.includes(line)) msg.value = (msg.value ? msg.value.trim() + String.fromCharCode(10) : '') + line;
    toast(t.dataset.brand + ' added to your enquiry');
    scrollToEl('#form');
  });

  /* ---------------- Gauges ---------------- */
  const gCats = $$('.gauge').find(g => /categories/i.test(g.dataset.label));
  if (gCats) { gCats.dataset.value = CATS.length; gCats.dataset.scale = Math.ceil((CATS.length + 2) / 5) * 5; gCats.dataset.majors = gCats.dataset.scale / 5; }
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
  // rebuilt only when the width changes (on phones the address bar coming and going changes just the height),
  // and each strip carries on from where it was instead of jumping
  let tapesW = 0;
  function setupTapes(force) {
    if (!force && innerWidth === tapesW) return;
    tapesW = innerWidth;
    const was = tapes;
    tapes = [];
    $$('.tape').forEach((t, i) => {
      const tr = $('.tape__track', t);
      if (!tr._unit) tr._unit = tr.innerHTML;
      tr.innerHTML = tr._unit;
      const uw = tr.scrollWidth;
      const n = Math.ceil(innerWidth * 1.3 / uw) + 1;
      tr.innerHTML = tr._unit.repeat(n + 1);
      tapes.push({ t, tr, uw, x: was[i] && uw ? was[i].x % uw : -Math.random() * uw, sp: +t.dataset.speed, dir: +t.dataset.dir });
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
  // a field marked red turns back to normal as soon as it is corrected
  form.addEventListener('input', e => { const f = e.target.closest('.field'); if (f) f.classList.remove('is-err'); });
  function formMessage() {
    const v = id => $(id).value.trim();
    const lines = ['Hello Fakhri Tools, I would like a quote.', '', 'Name: ' + v('#fName'), 'Mobile: ' + v('#fMobile')];
    if (v('#fCompany')) lines.push('Company: ' + v('#fCompany'));
    if (v('#fEmail')) lines.push('Email: ' + v('#fEmail'));
    if (v('#fMsg')) lines.push('', v('#fMsg'));
    if (rfq.size) lines.push('', 'Items:', ...[...rfq].map(([id, q]) => lineText(itemOf(id), q)));
    return lines.join('\n');
  }
  // the floating Call / WhatsApp buttons step aside while product cards or the form sit under them (every card has its own WhatsApp button)
  (() => {
    const zones = [$('#katRail'), $('.kat'), $('#form')].filter(Boolean);
    if (!$('#fabs') || !zones.length || !('IntersectionObserver' in window)) return;
    const on = new Set();
    const io = new IntersectionObserver(es => {
      es.forEach(e => e.isIntersecting ? on.add(e.target) : on.delete(e.target));
      document.body.classList.toggle('fabs-off', on.size > 0);
      // the quote bar also steps aside over the form: the form lists the quote items itself, and the bar covered its send button
      document.body.classList.toggle('at-form', on.has($('#form')));
    }, { rootMargin: '-45% 0px 0px 0px' });
    zones.forEach(z => io.observe(z));
  })();
  function validForm() {
    // a mobile typed in Arabic digits (٠٥٠…) or with dots (050.123.4567) is fine: digits are written the plain way first
    const mob = $('#fMobile', form);
    if (mob) mob.value = mob.value.replace(/[٠-٩]/g, d => d.charCodeAt(0) - 0x660).replace(/[۰-۹]/g, d => d.charCodeAt(0) - 0x6F0);
    const checks = [['#fName', v => v.trim().length > 1], ['#fMobile', v => /^\+?[\d\s().\-]{7,20}$/.test(v.trim()) && v.replace(/\D/g, '').length >= 7], ['#fEmail', v => !v.trim() || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim())]];
    let first = null;
    checks.forEach(([s, fn]) => {
      const el = $(s, form); if (!el) return;
      const field = el.closest('.field');
      field.classList.remove('is-err'); void field.offsetWidth;
      if (!fn(el.value)) { field.classList.add('is-err'); first = first || el; }
    });
    if (first) {
      toast(first.id === 'fEmail' ? 'Please check your email address, or leave it empty' : 'Please add your name and mobile number');
      scrollToEl('#form'); setTimeout(() => first.focus({ preventScroll: true }), 700);
    }
    return !first;
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
    // "reduce motion" is on: no pinned sections and no scroll-linked animation; everything is simply shown
    if (reduce) {
      steps0();
      ScrollTrigger.create({ trigger: '#anatomy', start: 'top 70%', end: 'bottom 30%', onToggle: s => { window.FT3D && window.FT3D.setAnatomy(s.isActive ? 0.9 : 0); } });
      $$('.ms').forEach(m => m.classList.add('is-on'));
      gsap.set('.pipe__fill', { scaleY: 1 });
      return;
    }
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
    gsap.set('.kr', { opacity: 0, x: 40 });
    ScrollTrigger.batch('.kr', { start: 'top 96%', once: true, onEnter: b => gsap.to(b, { opacity: 1, x: 0, duration: 0.9, ease: 'expo.out', stagger: 0.04 }) });

    const mm = gsap.matchMedia();
    const artEls = $$('.sector__art *').filter(e => e.tagName !== 'g' && !e.closest('defs') && !e.classList.contains('flow'));
    artEls.forEach(e => { e.setAttribute('pathLength', '1'); e.style.strokeDasharray = '1'; e.style.strokeDashoffset = '1'; });
    // the moving red "flow" dashes appear once a drawing has finished drawing itself
    gsap.set('.sector__art .flow', { opacity: 0 });
    const showFlow = p => { if (!p.flowOn) { p.flowOn = true; gsap.to($$('.sector__art .flow', p), { opacity: 1, duration: 0.8 }); } };
    mm.add('(min-width: 900px)', () => {
      const track = $('.sectors__track'), sec = $('.sectors'), bar = $('.sectors__progress i');
      const dist = () => track.scrollWidth - innerWidth;
      const tw = gsap.to(track, {
        x: () => -dist(), ease: 'none',
        scrollTrigger: { trigger: sec, start: 'top top', end: () => '+=' + dist(), pin: true, anticipatePin: 1, scrub: 0.7, invalidateOnRefresh: true, onUpdate: s => { bar.style.transform = 'scaleX(' + s.progress + ')'; } }
      });
      $$('.sector:not(.sector--intro)').forEach(p => {
        const els = $$('.sector__art *', p).filter(e => e.tagName !== 'g' && !e.closest('defs') && !e.classList.contains('flow'));
        gsap.to(els, { strokeDashoffset: 0, ease: 'none', stagger: 0.015, onUpdate() { if (this.progress() > 0.95) showFlow(p); }, scrollTrigger: { trigger: p, containerAnimation: tw, start: 'left 100%', end: 'left 82%', scrub: true } });
        gsap.from($$('h3, p, .tags', p), { y: 50, opacity: 0, stagger: 0.08, duration: 1.1, ease: 'expo.out', scrollTrigger: { trigger: p, containerAnimation: tw, start: 'left 92%' } });
        gsap.fromTo($('.sector__num', p), { x: 160 }, { x: -80, ease: 'none', scrollTrigger: { trigger: p, containerAnimation: tw, start: 'left right', end: 'right left', scrub: true } });
      });
    });
    mm.add('(max-width: 899px)', () => {
      $$('.sector:not(.sector--intro)').forEach(p => {
        const els = $$('.sector__art *', p).filter(e => e.tagName !== 'g' && !e.closest('defs') && !e.classList.contains('flow'));
        gsap.to(els, { strokeDashoffset: 0, duration: 1.4, ease: 'power2.out', stagger: 0.01, onComplete: () => showFlow(p), scrollTrigger: { trigger: $('.sector__art', p), start: 'top 92%', once: true } });
      });
    });

    // the Industries drawings only animate while they are on screen (no work for the computer anywhere else on the page)
    if ('IntersectionObserver' in window) {
      const artIO = new IntersectionObserver(es => es.forEach(e => e.target.classList.toggle('is-idle', !e.isIntersecting)));
      $$('.sector__art, .sectors__hint').forEach(a => artIO.observe(a));
    }

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

    gsap.from('.why__card', { y: 50, opacity: 0, duration: 1, ease: 'expo.out', stagger: 0.1, scrollTrigger: { trigger: '.why__cards', start: 'top 85%' } });

    gsap.fromTo('.pipe__fill', { scaleY: 0 }, { scaleY: 1, ease: 'none', scrollTrigger: { trigger: '.timeline', start: 'top 65%', end: 'bottom 65%', scrub: true } });
    $$('.ms').forEach(m => ScrollTrigger.create({ trigger: m, start: 'top 65%', onEnter: () => m.classList.add('is-on'), onLeaveBack: () => m.classList.remove('is-on') }));

    gsap.from('.contact__grid > *', { y: 60, opacity: 0, duration: 1.2, ease: 'expo.out', stagger: 0.12, scrollTrigger: { trigger: '.contact__grid', start: 'top 85%' } });
  }

  // reduced motion: the anatomy section shows its last step and the fully exploded valve
  function steps0() {
    $$('.anatomy__steps p').forEach((x, i, all) => x.classList.toggle('is-active', i === all.length - 1));
    $('#explodeVal').textContent = '0%'; $('#explodeBar').style.transform = 'scaleX(0)';
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
  // The intro plays at 3x speed (about 1.3 s) and only on the first page view of a visit,
  // so buyers reach the products fast and Google measures a quick page.
  const LOADER_SPEED = 3;
  let loaderSeen = false;
  try { loaderSeen = sessionStorage.getItem('ft-intro') === '1'; sessionStorage.setItem('ft-intro', '1'); } catch (e) {}
  function runLoader() {
    const L = $('#loader');
    const finish = () => {
      L && L.remove();
      document.body.classList.remove('is-loading');
      lenis && lenis.start();
      ScrollTrigger.refresh();
    };
    if (reduce || !L || loaderSeen) { heroIntro(); finish(); return; }
    lenis && lenis.stop();
    const num = $('#loaderNum'), bar = $('#loaderBar');
    const o = { v: 0 };
    gsap.timeline().timeScale(LOADER_SPEED)
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

  // Back pressed (or a window closed itself): close every window above the step we are now on
  window.addEventListener('popstate', () => {
    const cur = history.state && history.state.ov;
    if (cur !== 'qv') closeQV(true);
    if (cur !== 'qs') closeSheet(true);
    if (cur !== 'filt' && document.body.classList.contains('is-filtering')) kOpen(false, true);
    if (cur !== 'menu') closeMenu(true);
    if (!cur) try { history.scrollRestoration = 'auto'; } catch (e) {}
  });

  /* ---------------- Boot ---------------- */
  applyLinks(document);
  syncRfq(false);
  bindAnchors();
  setupScroll();
  runLoader();
  // #products/<slug> opens a category; #products/<slug>/<n> (the "Add to quote" buttons on the product pages) also opens that product
  const deep = location.hash.match(/^#products\/([^/]+)(?:\/(\d+))?$/);
  if (deep) {
    const ds = slugAlias(deep[1]), wait = reduce || loaderSeen ? 0 : Math.round(4100 / LOADER_SPEED);
    if (catBySlug(ds)) setTimeout(() => showCat(ds), wait);
    if (catBySlug(ds) && deep[2] && itemOf(ds + ':' + deep[2])) setTimeout(() => openQV(ds + ':' + deep[2]), wait + 1300);
    // the link has done its job: a reload (or a shared address) must not bring that category back after other filters
    history.replaceState(history.state, '', location.pathname + location.search);
  }
  const fontsReady = document.fonts && document.fonts.ready ? document.fonts.ready : Promise.resolve();
  fontsReady.then(() => { setupTapes(true); ScrollTrigger.refresh(); });
  let rsT; window.addEventListener('resize', () => { clearTimeout(rsT); rsT = setTimeout(() => { setupTapes(); }, 200); });
  window.addEventListener('load', () => ScrollTrigger.refresh());
})();
