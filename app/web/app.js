/* =========================================================
   Fakhri Tools catalogue app
   One page; every screen is a "view" stacked inside its tab, like a native app.
   The product list is the website's own js/data.js (window.FT_CATS).
   ========================================================= */
/* Older phones (built-in browser before 2020) ignore "gap" between items in a row.
   There, the same space is added as margins instead. Newer phones skip this. */
(() => {
  const t = document.createElement('div');
  t.style.cssText = 'display:flex;flex-direction:column;row-gap:1px;position:absolute;visibility:hidden';
  t.appendChild(document.createElement('div')); t.appendChild(document.createElement('div'));
  document.documentElement.appendChild(t); const ok = t.scrollHeight === 1; t.remove();
  if (ok) return;
  const px = v => parseFloat(v) || 0;
  let queued = false;
  const fix = () => {
    queued = false;
    const all = document.body.getElementsByTagName('*');
    for (let i = 0; i < all.length; i++) {
      const el = all[i]; if (el.__gapDone) continue;
      const cs = getComputedStyle(el); el.__gapDone = true;
      if (cs.display !== 'flex' && cs.display !== 'inline-flex') continue;
      const cg = px(cs.columnGap), rg = px(cs.rowGap); if (!cg && !rg) continue;
      const col = cs.flexDirection.indexOf('column') === 0, wrap = cs.flexWrap !== 'nowrap';
      el.__gapFix = () => {
        const kids = [].filter.call(el.children, k => getComputedStyle(k).position !== 'absolute' && getComputedStyle(k).display !== 'none');
        kids.forEach((k, j) => {
          const last = j === kids.length - 1;
          if (col) { if (!last && rg) k.style.marginBottom = rg + 'px'; }
          else { if ((!last || wrap) && cg) k.style.marginRight = cg + 'px'; if (wrap && rg) k.style.marginBottom = rg + 'px'; }
        });
        if (!col && wrap && rg) el.style.marginBottom = (px(cs.marginBottom) - rg) + 'px';
      };
      el.__gapFix();
    }
  };
  const later = () => { if (!queued) { queued = true; requestAnimationFrame(fix); } };
  const go = () => { new MutationObserver(ms => { ms.forEach(m => { if (m.target.__gapFix) m.target.__gapFix(); }); later(); }).observe(document.body, { childList: true, subtree: true }); later(); };
  if (document.body) go(); else document.addEventListener('DOMContentLoaded', go);
})();

(() => {
  'use strict';
  const N = window.FTNative || null;                 // the phone (null when opened in a browser)
  const CFG = window.FT_CONFIG || {};
  const CATS = (window.FT_CATS || []).filter(c => c && Array.isArray(c.items));
  const FAMS = window.FT_FAMILIES || [];
  const BRANDS = window.FT_BRANDS || [];
  if (!CATS.length) { if (N && N.resetData) N.resetData(); return; }   // a broken download never strands the app

  const IMG = 'p/';
  const WA = CFG.whatsappDigits || '971522767034';
  const WA_SHOW = CFG.whatsappDisplay || '+971 52 276 7034';
  const PHONE = CFG.phoneDisplay || '+971 4 285 0135';
  const PHONE_LINK = CFG.phoneLink || 'tel:+97142850135';
  const MAPS = CFG.mapsUrl || CFG.mapsSearchUrl || '';
  const SHOP_NAME = 'Fakhri Tools & Workshop Materials Trading LLC';
  const ADDRESS = 'Warehouse 8, 8th Street, Al Quoz Industrial Area 3, Dubai';
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]));
  const h = html => { const t = document.createElement('template'); t.innerHTML = html.trim(); return t.content.firstElementChild; };
  const store = {
    get(k, d) { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : d; } catch (e) { return d; } },
    set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} }
  };
  const buzz = () => { try { N && N.vibrate && N.vibrate(); } catch (e) {} };
  const nfmt = n => n.toLocaleString('en-US');

  /* ================= icons ================= */
  const I = {
    pdf: '<svg viewBox="0 0 24 24" class="ico"><path d="M6 2h9l5 5v15H6z"/><path d="M14 2v6h6"/><path d="M9 13h6M9 17h6"/></svg>',
    back: '<svg viewBox="0 0 24 24" class="ico"><path d="M15 5l-7 7 7 7"/></svg>',
    chev: '<svg viewBox="0 0 24 24" class="ico"><path d="M9 5l7 7-7 7"/></svg>',
    down: '<svg viewBox="0 0 24 24" class="ico"><path d="M6 9l6 6 6-6"/></svg>',
    plus: '<svg viewBox="0 0 24 24" class="ico"><path d="M12 5v14M5 12h14"/></svg>',
    check: '<svg viewBox="0 0 24 24" class="ico"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>',
    x: '<svg viewBox="0 0 24 24" class="ico"><path d="M6 6l12 12M18 6L6 18"/></svg>',
    search: '<svg viewBox="0 0 24 24" class="ico"><circle cx="10.5" cy="10.5" r="6.5"/><path d="m15.5 15.5 5 5"/></svg>',
    share: '<svg viewBox="0 0 24 24" class="ico"><circle cx="18" cy="5.5" r="2.5"/><circle cx="6" cy="12" r="2.5"/><circle cx="18" cy="18.5" r="2.5"/><path d="m8.2 10.8 7.6-4.1M8.2 13.2l7.6 4.1"/></svg>',
    play: '<svg viewBox="0 0 24 24" class="ico"><rect x="3" y="4" width="18" height="13" rx="2"/><path d="M8 21h8M12 17v4"/></svg>',
    zoom: '<svg viewBox="0 0 24 24" class="ico"><path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5"/></svg>',
    wa: '<svg viewBox="0 0 24 24" class="ico-f"><path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2zm0 18.2c-1.6 0-3.1-.4-4.4-1.2l-.3-.2-3 .8.8-2.9-.2-.3A8.2 8.2 0 1 1 12 20.2zm4.5-6.1c-.2-.1-1.5-.7-1.7-.8-.2-.1-.4-.1-.6.1l-.8 1c-.1.2-.3.2-.5.1a6.7 6.7 0 0 1-3.3-2.9c-.2-.4.2-.4.7-1.3.1-.2 0-.3 0-.4l-.8-1.8c-.2-.5-.4-.4-.6-.4h-.5c-.2 0-.4.1-.7.3-.2.2-.9.9-.9 2.2s.9 2.6 1.1 2.7c.1.2 1.8 2.8 4.4 3.9 1.6.7 2.3.8 3.1.6.5-.1 1.5-.6 1.7-1.2.2-.6.2-1.1.1-1.2l-.7-.3z"/></svg>',
    phone: '<svg viewBox="0 0 24 24" class="ico"><path d="M5 3h3.5l1.8 4.5-2.3 1.4a11 11 0 0 0 5.1 5.1l1.4-2.3L19 13.5V17a2 2 0 0 1-2 2A15 15 0 0 1 3 5a2 2 0 0 1 2-2z"/></svg>',
    pin: '<svg viewBox="0 0 24 24" class="ico"><path d="M12 21s-7-6.3-7-11.5a7 7 0 0 1 14 0C19 14.7 12 21 12 21z"/><circle cx="12" cy="9.5" r="2.5"/></svg>',
    user: '<svg viewBox="0 0 24 24" class="ico"><circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/></svg>',
    copy: '<svg viewBox="0 0 24 24" class="ico"><rect x="8" y="8" width="12" height="12" rx="2"/><path d="M16 8V5a1 1 0 0 0-1-1H5a1 1 0 0 0-1 1v10a1 1 0 0 0 1 1h3"/></svg>',
    trash: '<svg viewBox="0 0 24 24" class="ico"><path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3"/></svg>',
    save: '<svg viewBox="0 0 24 24" class="ico"><path d="M5 4h11l3 3v13H5z"/><path d="M8 4v5h7V4M8 20v-6h8v6"/></svg>',
    sync: '<svg viewBox="0 0 24 24" class="ico"><path d="M20 11a8 8 0 0 0-14.3-4.9L4 8M4 4v4h4M4 13a8 8 0 0 0 14.3 4.9L20 16M20 20v-4h-4"/></svg>',
    truck: '<svg viewBox="0 0 24 24" class="ico"><path d="M2 6h12v10H2zM14 9h4l4 4v3h-8z"/><circle cx="6" cy="18" r="2"/><circle cx="18" cy="18" r="2"/></svg>',
    thread: '<svg viewBox="0 0 24 24" class="ico"><path d="M3 9h12v6H3zM15 10.5h6M15 13.5h6M6 9v6M9 9v6M12 9v6"/></svg>',
    cut: '<svg viewBox="0 0 24 24" class="ico"><circle cx="6" cy="7" r="3"/><circle cx="6" cy="17" r="3"/><path d="M8.5 8.5 20 18M8.5 15.5 20 6"/></svg>',
    crimp: '<svg viewBox="0 0 24 24" class="ico"><path d="M2 12h6M16 12h6M8 8h8v8H8zM10 5v3M14 5v3M10 16v3M14 16v3"/></svg>',
    box: '<svg viewBox="0 0 24 24" class="ico"><path d="M3 7.5 12 3l9 4.5v9L12 21l-9-4.5z"/><path d="M3 7.5 12 12l9-4.5M12 12v9"/></svg>'
  };
  const FAM_ART = {
    valves: '<svg viewBox="0 0 64 64"><circle cx="32" cy="12" r="8"/><path d="M32 20v10M24 12h16M32 4v16"/><path d="M14 34h36v14H14z"/><path d="M6 38h8v6H6zM50 38h8v6h-8z"/><path d="M26 30h12v4H26z"/></svg>',
    couplings: '<svg viewBox="0 0 64 64"><path d="M4 26h18v14H4zM42 26h18v14H42z"/><path d="M22 23h20v20H22z"/><path d="M30 23l-8-12h-4M34 43l8 12h4"/></svg>',
    fittings: '<svg viewBox="0 0 64 64"><path d="M6 14h22a18 18 0 0 1 18 18v26"/><path d="M6 28h18a8 8 0 0 1 8 8v22"/><path d="M6 10v22M32 54h18"/></svg>',
    sealing: '<svg viewBox="0 0 64 64"><circle cx="32" cy="32" r="24"/><circle cx="32" cy="32" r="12"/><circle cx="32" cy="13" r="2.5"/><circle cx="32" cy="51" r="2.5"/><circle cx="13" cy="32" r="2.5"/><circle cx="51" cy="32" r="2.5"/></svg>'
  };

  /* ================= products ================= */
  const MATS = [['Bronze', /bronze/i], ['Brass', /brass/i], ['Stainless', /\bS\.S\b|\bSS(?:3\d\d\w*)?\b|[Ss]tainless/], ['Carbon steel', /\bC\.S\b|\bCS\b|[Ff]orged [Ss]teel/], ['Cast iron', /\bC\.I\b|\bCI\b|[Cc]ast [Ii]ron/], ['Ductile iron', /\bD\.I\b|\bDI\b|[Dd]uctile/], ['Galvanised', /\bG\.I\b|\bGI\b|[Gg]alvani[sz]ed/], ['Mild steel', /\bM\.S\b|\bMS\b|[Mm]ild [Ss]teel/], ['Aluminium', /alumin/i], ['Rubber', /rubber|neoprene|EPDM|NBR/i], ['PVC', /\bPVC\b/], ['Acrylic', /acrylic/i]];
  function materialOf(name) {
    let best = null, at = 1e9;
    MATS.forEach(([m, r]) => { const k = String(name).search(r); if (k > -1 && k < at) { at = k; best = m; } });
    return best;
  }
  const P = [], byId = new Map();
  CATS.forEach(c => {
    c.items.forEach((it, i) => {
      const o = { id: c.slug + ':' + i, c, i, name: it[0], specs: it[1] || [], size: it[2] || '', img: it[3] ? IMG + it[3] : '', matSet: it[4] || '' };
      o.mat = o.matSet && o.matSet !== 'Other' ? o.matSet : (materialOf(o.name) || '');
      o.group = materialOf(o.mat) || materialOf(o.name) || (o.mat ? o.mat.split(/[(,&]/)[0].trim() : '');
      P.push(o); byId.set(o.id, o);
    });
    c.coverImg = c.cover ? IMG + c.cover : (c.items.find(it => it[3]) ? IMG + c.items.find(it => it[3])[3] : '');
  });
  const catBy = s => CATS.find(c => c.slug === s);
  const famName = id => (FAMS.find(f => f.id === id) || {}).name || '';
  const nice = s => String(s).replace(/\s+/g, ' ').trim();
  // messages say the material when the name doesn't
  const fullName = o => o.mat && !materialOf(o.name) ? o.name + ' – ' + o.mat : o.name;
  const countWord = (n, w) => n + ' ' + w + (n === 1 ? '' : 's');

  /* ================= sizes (same rules as the website's size picker) ================= */
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
    else if (/ – any size$/.test(s)) { const l = ladder(s.split(' – ')[0], 'any', o.c.fam); if (l) sp = { t: 'sel', opts: l }; }
    else if ((m = s.match(RX_PAIR)) && m[1] === m[2] && m[3] === m[4]) { const l = ladder(m[1], m[3], o.c.fam); if (l) sp = { t: 'sel', opts: l }; }
    else if (m) {
      const L = ladder(m[1], m[3], o.c.fam), S = ladder(m[2], m[4], o.c.fam);
      if (L && S) sp = { t: 'pair', L, S, lt: rung(m[1]) > rung(m[2]) && rung(m[3]) > rung(m[4]) };
    }
    else if ((m = s.match(RX_RANGEX))) {
      const l = ladder(m[1], m[2], o.c.fam);
      if (l && rung(m[3]) > -1 && rung(m[3]) < rung(m[2])) sp = { t: 'sel', opts: l.concat(m[2] + ' × ' + m[3]) };
      else if (l) { sp = { t: 'sel', opts: l }; len = 'up to ' + m[3]; }
    }
    else if ((m = s.match(RX_RANGE))) { const l = ladder(m[1], m[2], o.c.fam); if (l) sp = { t: 'sel', opts: l }; }
    else if (/, | \/ /.test(s)) sp = { t: 'sel', opts: s.replace(/ bottom connection$/, '').split(/, | \/ /) };
    else if (!/–|TO/.test(s)) sp = { t: 'one', v: s };
    if (!sp) sp = { t: 'text', hint: s };
    sp.len = len; sp.note = note;
    SPEC.set(o.id, sp);
    return sp;
  }
  const sizeCount = o => { const sp = sizeSpec(o); return sp.t === 'sel' ? sp.opts.length : sp.t === 'pair' ? sp.L.length : sp.t === 'one' ? 1 : 0; };
  function sizeWords(pick, o) {
    if (!pick) return '';
    const [base, len] = String(pick).split(' · ');
    const b = base === '?' ? 'size to confirm' + (o && o.size ? ', range ' + o.size.split(' · ')[0] : '') : base.replace(/\?/g, 'size to confirm');
    return [b, len ? 'length ' + len : ''].filter(Boolean).join(', ');
  }

  /* ================= specs & ratings and material choices (the website's js/choices.js) ================= */
  const CH = window.FT_CHOICES || { specOpts: c => [...new Set(c || [])], matOpts: x => ({ opts: x ? [x] : [], note: '', full: x || '' }) };
  const SPECS = new Map();
  const specOpts = o => { if (!SPECS.has(o.id)) SPECS.set(o.id, CH.specOpts(o.specs)); return SPECS.get(o.id); };
  const matOpts = o => CH.matOpts(o.mat);
  const hasChoices = o => { const sp = sizeSpec(o); return sp.t === 'sel' || sp.t === 'pair' || (sp.t === 'text' && !!o.size) || !!sp.len || specOpts(o).length > 1 || matOpts(o).opts.length > 1; };

  /* ================= the cart ================= */
  // a line remembers the product by section + name + material, so it survives list updates
  let lines = store.get('ft-list', []).filter(l => l && l.n);
  let cust = store.get('ft-cust', {});
  const lineKey = l => [l.k, l.n, l.m, l.s, (l.sp || []).join('¦'), l.mt || ''].join('|');
  function lineProduct(l) {
    const c = catBy(l.k);
    const hit = (c ? c.items.map((it, i) => byId.get(c.slug + ':' + i)) : []).find(o => o.name === l.n && o.matSet === l.m) || P.find(o => o.name === l.n && o.matSet === l.m) || P.find(o => o.name === l.n);
    return hit || null;
  }
  const saveLines = () => { store.set('ft-list', lines); updateBadge(); };
  const inList = o => lines.some(l => l.k === o.c.slug && l.n === o.name && l.m === o.matSet);
  function addLines(o, pick, q) {
    const l = { k: o.c.slug, n: o.name, m: o.matSet, s: pick.s, sp: pick.sp, mt: pick.mt, q };
    const ex = lines.find(x => lineKey(x) === lineKey(l));
    if (ex) ex.q = Math.min(99999, ex.q + q); else lines.push(l);
    saveLines();
    refreshMarks();
  }
  // a line written out the website's way: anything not chosen reads "to confirm" with the options
  function describe(l, o) {
    const sp = o ? sizeSpec(o) : { t: 'text' }, m = o ? matOpts(o) : { opts: l.m ? [l.m] : [], note: '', full: l.m || '' }, specs = o ? specOpts(o) : [];
    let size = '';
    if ((o && o.size) || (l.s && l.s !== '?')) {
      const [base, len] = String(l.s || '?').split(' · ');
      size = !base || base === '?' ? 'to confirm' + (o && o.size && sp.t !== 'one' ? ' (we offer ' + o.size.split(' · ')[0] + ')' : '') : base.replace(/\?/g, 'to confirm');
      if (len) size += ', length ' + len;
    }
    const sps = (l.sp || []).filter(x => x !== '?');   // "?" = Not sure: reads "to confirm (options)", like the size
    const spec = sps.length ? sps.join(', ') : specs.length === 1 ? specs[0] : specs.length ? 'to confirm' + (specs.length <= 6 ? ' (' + specs.join(' / ') + ')' : '') : '';
    const mat = !m.opts.length ? '' : m.opts.length === 1 ? m.full : l.mt && m.opts.includes(l.mt) ? l.mt + (m.note ? ' (' + m.note + ')' : '') : 'to confirm (' + m.opts.join(' / ') + ')';
    return { size, spec, mat };
  }
  // only what was chosen, for short lists: (2" · PN16 · SS316)
  const shortOf = l => { const o = lineProduct(l), d = describe(l, o), x = [d.size && !/^to confirm/.test(d.size) ? d.size : '', (l.sp || []).filter(x => x !== '?').join(', '), l.mt !== '?' && l.mt].filter(Boolean).join(' · '); return x ? ' <em>(' + esc(x) + ')</em>' : ''; };
  const groupOfLine = (l, o) => o ? o.c.name : ((catBy(l.k) || {}).name || '');
  function itemBlock(l, n, plain) {
    const o = lineProduct(l), d = describe(l, o), b = plain ? '' : '*';
    return [b + (n ? n + '. ' : '') + l.n + b, 'Group: ' + groupOfLine(l, o), d.size && 'Size: ' + d.size, d.spec && 'Specs & ratings: ' + d.spec, d.mat && 'Material: ' + d.mat, 'Quantity: ' + l.q].filter(Boolean).join('\n');
  }
  const itemsText = (ls, plain) => ls.map((l, i) => itemBlock(l, ls.length > 1 ? i + 1 : 0, plain)).join('\n\n');
  // the chosen parts on a cart line: Size / Specs / Material, "to confirm" in amber
  function lineParts(l, o) {
    const d = describe(l, o), part = (k, v) => v ? '<span class="lp"><i>' + k + '</i> ' + (/^to confirm/.test(v) ? '<u>' + esc(v) + '</u>' : esc(v)) + '</span>' : '';
    return part('Size', d.size) + part('Specs', d.spec) + part('Material', d.mat);
  }
  /* ================= the order form PDF (orderform.js) ================= */
  function orderPdfData(x) {
    return {
      no: x.no, at: x.at, cust: x.cust,
      rows: x.lines.map(l => { const o = lineProduct(l), d = describe(l, o); return { n: l.n, group: groupOfLine(l, o), img: o ? o.img : '', size: d.size, spec: d.spec, mat: d.mat, q: l.q }; }),
      shop: { name: SHOP_NAME, address: ADDRESS, city: 'Al Quoz, Dubai', phone: PHONE, wa: WA_SHOW, email: CFG.email || 'dxbsales@ftools.com', logo: 'img/logo-lockup.png' }
    };
  }
  let pdfBusy = false;
  // to = 'shop' (Mr Hussain's WhatsApp), a customer's phone, or '' for the phone's share menu
  async function sharePdf(x, to) {
    if (pdfBusy) return; pdfBusy = true;
    toast('Making the order form…');
    try {
      const b64 = await window.FT_ORDER_PDF(orderPdfData(x));
      const name = 'Order-form-' + x.no + '.pdf', cap = 'Order form ' + x.no + (x.cust.name ? ' · ' + x.cust.name : '');
      if (N && N.shareFile) N.shareFile(b64, name, 'application/pdf', cap, to === 'shop' ? WA : (to ? phoneDigits(to) : ''));
      else { const a = document.createElement('a'); a.href = 'data:application/pdf;base64,' + b64; a.download = name; document.body.appendChild(a); a.click(); a.remove(); }
      window.__lastPdf = b64;
      toast('Order form ready');
    } catch (e) { toast('Could not make the order form. Try again.'); }
    pdfBusy = false;
  }
  const today = () => new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
  const PAY = ['Cash', 'Card', 'Bank transfer', 'Cheque', 'Credit account'];
  function orderMsg(x) {
    const c = x.cust, out = ['NEW ORDER ' + x.no, 'Date: ' + new Date(x.at).toLocaleString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })];
    if (c.name) out.push('Customer: ' + c.name);
    if (c.person) out.push('Contact: ' + c.person);
    if (c.phone) out.push('Phone: ' + c.phone);
    if (c.site) out.push('Location: ' + c.site);
    out.push('Delivery: ' + (c.delivery === 'deliver' ? 'Deliver to the customer' : 'Customer collects from the Al Quoz shop'));
    if (c.by) out.push('Needed by: ' + new Date(c.by + 'T12:00:00').toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' }));
    if (c.pay) out.push('Payment: ' + c.pay);
    return out.join('\n') + '\n\nItems (' + x.lines.length + '):\n\n' + itemsText(x.lines) + (c.note ? '\n\nNote: ' + c.note : '') + '\n\nPlease confirm price and stock.';
  }
  function orderMsgCustomer(x) {
    return 'Hello' + (x.cust.person ? ' ' + x.cust.person : '') + ', thank you for your order with Fakhri Tools.\nOrder number: ' + x.no + '\n\n' +
      itemsText(x.lines) +
      '\n\nWe will confirm the price and stock on WhatsApp. Questions: WhatsApp ' + WA_SHOW + ' or call ' + PHONE + '.\n' + SHOP_NAME + '\n' + ADDRESS;
  }
  function listMsgCustomer() {
    return 'Hello, here is the list from Fakhri Tools:\n\n' + itemsText(lines) +
      '\n\nFor prices and stock, message us on WhatsApp ' + WA_SHOW + ' or call ' + PHONE + '.\n' + SHOP_NAME + '\n' + ADDRESS;
  }
  function productText(o) {
    const sp = sizeSpec(o);
    const sizes = sp.t === 'sel' ? sp.opts.join(', ') : o.size;
    return o.name + '\n' + (o.mat ? 'Material: ' + o.mat + '\n' : '') + (o.specs.length ? 'Rating / type: ' + o.specs.join(', ') + '\n' : '') + (sizes ? 'Sizes: ' + sizes + '\n' : '') +
      '\nFakhri Tools, Al Quoz, Dubai\nWhatsApp ' + WA_SHOW + ' · Call ' + PHONE;
  }
  const waLink = (digits, text) => 'https://wa.me/' + (digits || '') + '?text=' + encodeURIComponent(text);
  function phoneDigits(p) {
    let d = String(p || '').replace(/\D/g, '');
    if (d.startsWith('00')) d = d.slice(2);
    if (d.startsWith('0')) d = '971' + d.slice(1);
    else if (/^5\d{8}$/.test(d)) d = '971' + d;
    return d.length >= 9 ? d : '';
  }
  function open(url) { if (N && N.open) N.open(url); else window.open(url, '_blank'); }
  function share(title, text, img) {
    if (N && img && N.sharePhoto) return N.sharePhoto(img, title, text);
    if (N && N.share) return N.share(title, text);
    if (navigator.share) navigator.share({ title, text }).catch(() => {});
    else copy(text);
  }
  function copy(text) {
    const done = () => toast('Copied. Paste it anywhere.');
    if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(text).then(done, () => oldCopy(text, done));
    else oldCopy(text, done);
  }
  function oldCopy(text, done) { const t = document.createElement('textarea'); t.value = text; document.body.appendChild(t); t.select(); try { document.execCommand('copy'); } catch (e) {} t.remove(); done(); }

  /* ================= recent ================= */
  let recent = store.get('ft-recent', []);
  function seen(o) { recent = [o.id].concat(recent.filter(x => x !== o.id)).slice(0, 14); store.set('ft-recent', recent); }

  /* ================= toast ================= */
  let toastT;
  function toast(msg, act, fn, ms) {
    const t = $('#toast');
    t.innerHTML = '<span>' + esc(msg) + '</span>' + (act ? '<button>' + esc(act) + '</button>' : '');
    if (act) $('button', t).onclick = () => { t.classList.remove('is-on'); fn(); };
    t.classList.add('is-on');
    clearTimeout(toastT); toastT = setTimeout(() => t.classList.remove('is-on'), ms || (act ? 6000 : 2600));
  }

  /* ================= pieces of UI ================= */
  // a photo on its paper background, fading in once loaded
  function photo(src, alt, extra) {
    return '<div class="ph' + (src ? ' is-loading' : ' ph--none') + (extra ? ' ' + extra : '') + '">' + (src ? '<img src="' + esc(src) + '" alt="' + esc(alt || '') + '" decoding="async" loading="lazy">' : '') + '</div>';
  }
  function wirePhotos(root) {
    $$('.ph img', root).forEach(img => {
      const done = () => { img.classList.add('is-in'); img.parentNode.classList.remove('is-loading'); };
      if (img.complete && img.naturalWidth) done();
      else { img.addEventListener('load', done, { once: true }); img.addEventListener('error', () => { img.parentNode.classList.remove('is-loading'); img.parentNode.classList.add('ph--none'); img.remove(); }, { once: true }); }
    });
  }
  const catCard = (c, d) => '<button class="ccard tile" style="animation-delay:' + d + 'ms" data-go="c/' + c.slug + '">' + photo(c.coverImg, c.name) +
    '<div class="ccard__t"><b>' + esc(c.name) + '</b><span>' + countWord(c.items.length, 'product') + '</span></div></button>';
  // a category on Home: its photo and its name, like a shop's category tiles
  const catTile = (c, d) => '<button class="ctile tile" style="animation-delay:' + d + 'ms" data-go="c/' + c.slug + '">' + photo(c.coverImg, c.name) + '<b>' + esc(c.name) + '</b><span>' + countWord(c.items.length, 'item') + '</span></button>';
  const sizeShort = o => { const s = (o.size || '').split(' · ')[0]; return s.length > 26 ? s.slice(0, 24) + '…' : s; };
  const prodCard = (o, d) => '<div class="pcard tile" style="animation-delay:' + d + 'ms" data-go="p/' + o.id.replace(':', '/') + '" role="button" tabindex="0">' +
    (inList(o) ? '<span class="listtag">In cart</span>' : '') +
    '<button class="qadd' + (inList(o) ? ' is-in' : '') + '" data-add="' + o.id + '" aria-label="Add to cart">' + (inList(o) ? I.check : I.plus) + '</button>' +
    photo(o.img, o.name) + '<div class="pcard__t"><small>' + esc(o.c.name) + '</small><b>' + esc(o.name) + '</b></div></div>';
  const prodRow = (o, mark) => '<button class="prow" data-go="p/' + o.id.replace(':', '/') + '">' + photo(o.img, o.name) +
    '<div><small>' + esc(o.c.name) + '</small><b>' + (mark ? mark(o.name) : esc(o.name)) + '</b></div></button>';
  const bar = (title, right) => '<header class="bar"><button class="ib" data-back aria-label="Back">' + I.back + '</button><div class="bar__t">' + esc(title) + '</div>' + (right || '') + '</header>';

  // keep "In list" marks in step everywhere
  function refreshMarks() {
    $$('.pcard').forEach(card => {
      const id = $('[data-add]', card).dataset.add, o = byId.get(id); if (!o) return;
      const on = inList(o), b = $('[data-add]', card);
      b.classList.toggle('is-in', on); b.innerHTML = on ? I.check : I.plus;
      const tag = $('.listtag', card);
      if (on && !tag) card.insertAdjacentHTML('afterbegin', '<span class="listtag">In cart</span>'); else if (!on && tag) tag.remove();
    });
    const cont = $('#homeCont'); if (cont) cont.replaceWith(contCard());
    const cv = stacks.cart && stacks.cart[0]; if (cv && tab !== 'cart') cv.dirty = true;
    const ov = stacks.orders && stacks.orders[0]; if (ov && ov.onShow && tab === 'orders') ov.onShow();
  }
  function updateBadge(pop) {
    const b = $('#badge'), n = lines.length;
    b.hidden = !n; b.textContent = n > 99 ? '99+' : n;
    if (pop) { b.classList.remove('pop'); void b.offsetWidth; b.classList.add('pop'); }
  }

  /* ================= views and tabs ================= */
  const stage = $('#stage');
  const TABS = ['home', 'orders', 'cart'];
  const stacks = { home: [], orders: [], cart: [] };
  let tab = 'home', busy = false;
  const top = () => stacks[tab][stacks[tab].length - 1];

  function build(route) {
    const [kind, a, b] = route.split('/');
    let v;
    if (kind === 'home') v = viewHome();
    else if (kind === 'cats') v = viewCats(a);
    else if (kind === 'c') v = viewCat(a);
    else if (kind === 'p') v = viewProduct(a + ':' + b);
    else if (kind === 'search') v = viewSearch(a ? decodeURIComponent(a) : '');
    else if (kind === 'cart') v = viewCart();
    else if (kind === 'orders') v = viewOrders();
    else if (kind === 'order') v = viewOrder();
    if (!v) v = viewHome();
    v.el.classList.add('view');
    v.route = route;
    wirePhotos(v.el);
    return v;
  }
  function show(v, on) { v.el.style.visibility = on ? '' : 'hidden'; v.el.classList.toggle('is-under', !on); if (on && v.onShow) v.onShow(); if (!on && v.onHide) v.onHide(); }

  let fromImg = null;   // the photo that was tapped, for the zoom-into-place animation
  function go(route, opts = {}) {
    if (busy) return;
    const st = stacks[tab], prev = top();
    const v = build(route);
    stage.appendChild(v.el);
    st.push(v);
    saveRoutes();
    if (opts.instant || reduce) { if (prev) show(prev, false); show(v, true); fromImg = null; return; }
    busy = true;
    const hero = fromImg && $('[data-hero]', v.el);
    const ease = 'cubic-bezier(.16,1,.3,1)';
    let anim, prevAnim;
    if (hero && fromImg.isConnected) {
      anim = v.el.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 380, easing: 'ease-out' });
      flyHero(fromImg, hero);
      if (prev) prevAnim = prev.el.animate([{ opacity: 1, transform: 'none' }, { opacity: .2, transform: 'scale(.96)' }], { duration: 420, easing: ease, fill: 'forwards' });
    } else {
      anim = v.el.animate([{ transform: 'translateX(100%)', boxShadow: '-30px 0 60px rgba(0,0,0,.6)' }, { transform: 'none', boxShadow: '0 0 0 rgba(0,0,0,0)' }], { duration: 460, easing: ease });
      if (prev) prevAnim = prev.el.animate([{ transform: 'none', opacity: 1 }, { transform: 'translateX(-26%)', opacity: .35 }], { duration: 460, easing: ease, fill: 'forwards' });
    }
    show(v, true);
    fromImg = null;
    anim.onfinish = () => { busy = false; if (prev) { if (prevAnim) prevAnim.cancel(); show(prev, false); } };
  }
  function flyHero(src, dst) {
    const a = src.getBoundingClientRect(), img = $('img', dst);
    if (!img || !a.width) return;
    const g = h('<div class="ghost"><img src="' + esc(src.getAttribute('src')) + '" alt=""></div>');
    const r0 = getComputedStyle(src.closest('.ph') || src).borderRadius;
    Object.assign(g.style, { left: a.left + 'px', top: a.top + 'px', width: a.width + 'px', height: a.height + 'px', borderRadius: r0 });
    $('img', g).style.padding = getComputedStyle(src).padding;
    document.body.appendChild(g);
    dst.style.visibility = 'hidden';
    requestAnimationFrame(() => {
      const b = dst.getBoundingClientRect();
      const ip = getComputedStyle(img).padding;
      const an = g.animate([
        { left: a.left + 'px', top: a.top + 'px', width: a.width + 'px', height: a.height + 'px', borderRadius: r0 },
        { left: b.left + 'px', top: b.top + 'px', width: b.width + 'px', height: b.height + 'px', borderRadius: getComputedStyle(dst).borderRadius }
      ], { duration: 520, easing: 'cubic-bezier(.2,.9,.2,1)', fill: 'forwards' });
      $('img', g).animate([{ padding: getComputedStyle(src).padding }, { padding: ip }], { duration: 520, easing: 'cubic-bezier(.2,.9,.2,1)', fill: 'forwards' });
      an.onfinish = () => { dst.style.visibility = ''; const di = $('img', dst); if (di) { di.classList.add('is-in'); dst.classList.remove('is-loading'); } g.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 160 }).onfinish = () => g.remove(); };
    });
  }
  function pop(instant) {
    const st = stacks[tab];
    if (st.length < 2 || busy) return false;
    const v = st.pop(), prev = top();
    saveRoutes();
    show(prev, true);
    if (prev.dirty && prev.refresh) prev.refresh();
    if (instant || reduce) { v.el.remove(); if (v.onHide) v.onHide(); return true; }
    busy = true;
    const ease = 'cubic-bezier(.16,1,.3,1)';
    prev.el.animate([{ transform: 'translateX(-26%)', opacity: .35 }, { transform: 'none', opacity: 1 }], { duration: 420, easing: ease });
    if (v.onHide) v.onHide();
    v.el.animate([{ transform: 'none' }, { transform: 'translateX(100%)' }], { duration: 420, easing: ease }).onfinish = () => { v.el.remove(); busy = false; };
    return true;
  }
  function switchTab(t, route) {
    if (busy) return;
    $$('#tabs [data-tab]').forEach(b => b.classList.toggle('is-on', b.dataset.tab === t));
    $('#tabInk').style.transform = 'translateX(' + (TABS.indexOf(t) * 100) + '%)';
    if (t === tab && !route) {
      const st = stacks[tab];
      if (st.length > 1) { while (st.length > 2) { const v = st.splice(st.length - 2, 1)[0]; v.el.remove(); } pop(); }
      else if (st[0]) { st[0].el.scrollTo({ top: 0, behavior: 'smooth' }); if (st[0].onRetap) st[0].onRetap(); }
      return;
    }
    const was = top();
    tab = t;
    if (!stacks[t].length) { const v = build(route || t); stage.appendChild(v.el); stacks[t].push(v); }
    else if (route) { go(route); }
    const v = top();
    if (was && was !== v) show(was, false);
    show(v, true);
    if (v.dirty && v.refresh) v.refresh();
    if (!reduce) v.el.animate([{ opacity: 0, transform: 'translateY(14px) scale(.985)' }, { opacity: 1, transform: 'none' }], { duration: 380, easing: 'cubic-bezier(.16,1,.3,1)' });
    saveRoutes();
  }
  function saveRoutes() { try { sessionStorage.setItem('ft-routes', JSON.stringify({ tab, st: Object.fromEntries(TABS.map(t => [t, stacks[t].map(v => v.route)])) })); } catch (e) {} }

  // Android back button: close what is open, then step back, then go Home; false = leave the app
  function back() {
    if (!$('#zoom').hidden) { closeZoom(); return true; }
    if (!$('#present').hidden) { closePresent(); return true; }
    if (!$('#sheet').hidden) { closeSheet(); return true; }
    if (busy) return true;
    if (pop()) return true;
    if (tab !== 'home') { switchTab('home'); return true; }
    return false;
  }

  // one tap handler for everything
  document.addEventListener('click', e => {
    const t = e.target;
    const add = t.closest('[data-add]');
    if (add) { e.stopPropagation(); quickAdd(byId.get(add.dataset.add), add); return; }
    const goEl = t.closest('[data-go]');
    if (goEl) { fromImg = $('.ph img.is-in', goEl) || null; if (goEl.closest('#sheet')) closeSheet(); go(goEl.dataset.go); return; }
    if (t.closest('[data-back]')) { back(); return; }
    const tb = t.closest('[data-tab]');
    if (tb) { switchTab(tb.dataset.tab); return; }
    const ext = t.closest('[data-open]');
    if (ext) { open(ext.dataset.open); return; }
  });
  // sticky bars turn solid once the page scrolls under them
  function solidBar(v, at) {
    const b = $('.bar', v.el); if (!b) return;
    v.el.addEventListener('scroll', () => b.classList.toggle('is-solid', v.el.scrollTop > at), { passive: true });
  }

  /* ================= HOME ================= */
  const SHOWCASE = (() => {
    const out = [], seenCat = new Set();
    P.forEach(o => { if (o.img && !seenCat.has(o.c.slug) && out.length < 12) { seenCat.add(o.c.slug); out.push(o); } });
    return out;
  })();
  const SIZES_TOTAL = P.reduce((n, o) => n + sizeCount(o), 0);
  function openNow() {
    const now = new Date(Date.now() + 4 * 3600e3);          // Dubai time
    const d = now.getUTCDay(), hr = now.getUTCHours() + now.getUTCMinutes() / 60;
    const days = CFG.openDays || [1, 2, 3, 4, 5, 6], from = CFG.openFrom || 7.5, to = CFG.openTo || 18;
    return days.includes(d) && hr >= from && hr < to;
  }
  const hoursText = () => 'Mon – Sat · 7:30 am – 6:00 pm · Sunday closed';
  function contCard() {
    if (!lines.length) return h('<div id="homeCont"></div>');
    const n = lines.reduce((s, l) => s + l.q, 0);
    return h('<button id="homeCont" class="cont tile" data-tab="cart"><span class="cont__n">' + lines.length + '</span><div><b>Cart in progress</b><span>' +
      countWord(lines.length, 'item') + ' · ' + nfmt(n) + ' pcs · tap to place the order</span></div>' + I.chev + '</button>');
  }
  function shopCard() {
    const on = openNow();
    return '<div class="shopcard"><span class="open' + (on ? ' is-open' : '') + '"><i></i>' + (on ? 'Open now' : 'Closed now') + '</span>' +
      '<h3>Fakhri Tools<br>Al Quoz</h3><p>' + esc(ADDRESS) + '. Next to Ajyad Traditional Kitchen.</p><p class="hrs">' + hoursText() + '</p>' +
      '<div class="shopbtns"><button data-open="' + esc(waLink(WA, 'Hello Fakhri Tools, ')) + '">' + I.wa + 'WhatsApp</button><button data-open="' + esc(PHONE_LINK) + '">' + I.phone + 'Call</button><button data-open="' + esc(MAPS) + '">' + I.pin + 'Directions</button></div></div>';
  }
  // Home, Noon style: the logo, search, then every category as a photo tile
  function viewHome() {
    const el = h('<section class="home">' +
      '<div class="top"><img class="top__logo" src="img/logo-lockup.png" alt="Fakhri Tools &amp; Workshop Materials Trading LLC"></div>' +
      '<div class="sbar2"><button class="searchbox" data-go="search">' + I.search + '<span>Search ' + nfmt(P.length) + ' products</span></button></div>' +
      '<div class="view__pad">' +
        '<div id="homeCont"></div>' +
        '<div class="sec"><h2>Product <em>categories</em></h2><span>' + CATS.length + ' ranges · ' + nfmt(P.length) + ' products</span></div>' +
        '<div class="cats">' + CATS.map((c, i) => catTile(c, Math.min(i, 12) * 30)).join('') + '</div>' +
        '<div class="sec"><h2>The <em>shop</em></h2></div>' + shopCard() +
        '<div class="sec"><h2>Catalogue</h2></div><div id="catBox"></div>' +
        '<div class="foot" id="homeFoot"></div>' +
      '</div></section>');
    const v = { el };
    v.onShow = () => { stamp(); refreshNet(); };
    v.refresh = () => { const c = $('#homeCont', el); if (c) c.replaceWith(contCard()); v.dirty = false; };
    v.intro = () => {};
    setTimeout(() => { v.refresh(); stamp(); }, 0);
    function stamp() {
      const cb = $('#catBox', el); if (cb && !$('.spin', cb)) cb.innerHTML = catalogueBox();
      const f = $('#homeFoot', el); if (!f) return;
      f.innerHTML = 'Prices are never shown. The shop sends prices on WhatsApp.<br>' + esc(SHOP_NAME) + (N && N.version ? '<br>App version ' + esc(N.version()) : '');
    }
    return v;
  }
  function countUp(root) {
    $$('[data-count]', root).forEach(b => {
      const to = +b.dataset.count, t0 = performance.now(), dur = 1400;
      const tick = t => { const p = Math.min(1, (t - t0) / dur), e = 1 - Math.pow(1 - p, 4); b.textContent = nfmt(Math.round(to * e)); if (p < 1) requestAnimationFrame(tick); };
      if (reduce) b.textContent = nfmt(to); else requestAnimationFrame(tick);
    });
  }
  function when(ms) {
    const d = (Date.now() - ms) / 1000;
    if (d < 90) return 'just now';
    if (d < 3600) return Math.round(d / 60) + ' min ago';
    if (d < 86400) return Math.round(d / 3600) + ' h ago';
    return new Date(ms).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
  }

  /* ================= ALL RANGES ================= */
  function viewCats() {
    const el = h('<section>' + bar('All categories') + '<div class="view__pad"><div class="sec" style="margin-top:6px"><h2>Product <em>categories</em></h2><span>' + CATS.length + ' ranges · ' + nfmt(P.length) + ' products</span></div>' +
      '<div class="cats">' + CATS.map((c, i) => catTile(c, Math.min(i, 12) * 30)).join('') + '</div></div></section>');
    return { el };
  }

  /* ================= ONE RANGE ================= */
  function viewCat(slug) {
    const c = catBy(slug);
    if (!c) return null;
    const items = c.items.map((_, i) => byId.get(c.slug + ':' + i));
    const groups = [...new Set(items.map(o => o.group).filter(Boolean))];
    let cur = '';
    const el = h('<section>' + bar(c.name, '<button class="ib" data-present aria-label="Show the customer">' + I.play + '</button>') +
      '<div class="view__pad"><div class="chead2"><p>' + countWord(items.length, 'product') + '</p><button class="present-btn" data-present>' + I.play + 'Show customer</button></div>' +
      (groups.length > 1 ? '<div class="mats">' + [''].concat(groups).map(g => '<button class="chip' + (g === cur ? ' is-on' : '') + '" data-g="' + esc(g) + '">' + esc(g || 'All') + ' <b>' + (g ? items.filter(o => o.group === g).length : items.length) + '</b></button>').join('') + '</div>' : '') +
      '<div class="pgrid" id="pgrid"></div></div></section>');
    const v = { el };
    const shown = () => items.filter(o => !cur || o.group === cur);
    function fill() { const g = $('#pgrid', el); g.innerHTML = shown().map((o, i) => prodCard(o, Math.min(i, 8) * 40)).join(''); wirePhotos(g); }
    fill();
    $('.mats', el) && $('.mats', el).addEventListener('click', e => {
      const b = e.target.closest('[data-g]'); if (!b) return;
      cur = b.dataset.g; $$('.mats .chip', el).forEach(x => x.classList.toggle('is-on', x === b)); fill();
    });
    $$('[data-present]', el).forEach(b => b.addEventListener('click', () => present(shown(), 0, c.name)));
    v.refresh = () => { refreshMarks(); v.dirty = false; };
    return v;
  }

  /* ================= ONE PRODUCT ================= */
  // the faded Fakhri logo sits on photos only in the opened product (cards stay clean), like the website
  const WM = '<img class="wm" src="img/logo-stacked.png" alt="" aria-hidden="true" draggable="false">';
  function viewProduct(id) {
    const o = byId.get(id);
    if (!o) return null;
    seen(o);
    const sp = sizeSpec(o);
    const sibs = o.c.items.map((_, i) => byId.get(o.c.slug + ':' + i)).filter(x => x !== o);
    const el = h('<section>' + bar(o.name, '<button class="ib" data-share aria-label="Share">' + I.share + '</button>') +
      '<div class="phero"><div data-hero class="ph-wrap">' + photo(o.img, o.name) + '</div>' + (o.img ? WM : '') + (o.img ? '<button class="phero__zoom" data-zoom aria-label="Zoom">' + I.zoom + '</button>' : '') + '</div>' +
      '<div class="pbody">' +
        '<button class="crumb" data-go="c/' + o.c.slug + '">' + esc(o.c.name) + ' ' + I.chev + '</button>' +
        '<h1>' + esc(o.name) + '</h1>' +
        '<div id="pk"></div>' +
        '<div class="addrow"><div class="qty" id="qty"></div><button class="btn btn--red" id="addBtn">' + I.plus + 'Add to cart</button></div>' +
        '<div class="prow2"><button class="btn btn--wa" id="askShop">' + I.wa + 'Ask the shop</button><button class="btn btn--ghost" data-share>' + I.share + 'Share</button></div>' +
        '<button class="btn btn--ghost btn--full" style="margin-top:10px" id="showBtn">' + I.play + 'Show this to the customer</button>' +
        (sibs.length ? '<div class="h-sec"><h2>More in this range</h2><button data-go="c/' + o.c.slug + '">All ' + o.c.items.length + ' ' + I.chev + '</button></div><div class="rail">' + sibs.slice(0, 12).map(x => '<button class="mini" data-go="p/' + x.id.replace(':', '/') + '">' + photo(x.img, x.name) + '<b>' + esc(x.name) + '</b></button>').join('') + '</div>' : '') +
      '</div></section>');
    const hw = $('.ph-wrap', el); hw.style.cssText = 'position:absolute;top:0;right:0;bottom:0;left:0;border-radius:0 0 34px 34px;overflow:hidden';
    const v = { el };
    const pk = picker(o); $('#pk', el).appendChild(pk.el);
    const q = qtyBox(1); $('#qty', el).replaceWith(q.el);
    $('#addBtn', el).addEventListener('click', () => {
      if (!pk.check()) return;
      addLines(o, pk.read(), q.get());
      flyToList($('.phero .ph img', el) || $('.phero .ph', el));
      toast('Added to the cart', 'Open cart', () => switchTab('cart'));
      pk.reset(); q.set(1);
    });
    $('#askShop', el).addEventListener('click', () => {
      const p = pk.read(), l = { k: o.c.slug, n: o.name, m: o.matSet, s: p.s, sp: p.sp, mt: p.mt, q: q.get() };
      open(waLink(WA, 'Hello Fakhri Tools, please send me a price for:\n\n' + itemBlock(l) + '\n\nThank you.'));
    });
    $$('[data-share]', el).forEach(b => b.addEventListener('click', () => share(o.name, productText(o), o.img)));
    $('#showBtn', el).addEventListener('click', () => { const all = o.c.items.map((_, i) => byId.get(o.c.slug + ':' + i)); present(all, all.indexOf(o), o.c.name); });
    const z = $('[data-zoom]', el); if (z) z.addEventListener('click', () => zoom(o.img));
    $('.phero .ph', el).addEventListener('click', () => o.img && zoom(o.img));
    const hero = $('.phero', el);
    el.addEventListener('scroll', () => { const y = el.scrollTop; if (y < 600) hero.style.transform = 'translateY(' + (y * .35) + 'px)'; }, { passive: true });
    solidBar(v, 300);
    return v;
  }

  /* choice buttons, same rules as the website's product window: one size, any specs & ratings, one material.
     Anything left open is sent as "to confirm". */
  function picker(o, cur) {
    const sp = sizeSpec(o), specs = specOpts(o), m = matOpts(o);
    const el = h('<div class="pk"></div>');
    let s = sp.t === 'one' ? sp.v : '', a = '', b = '', sps = new Set(specs.length === 1 ? specs : []), mt = '';
    const hdr = (t, x) => '<div class="pk__h"><b>' + t + '</b>' + (x ? '<span>' + esc(x) + '</span>' : '') + '</div>';
    const chip = (row, v, on, extra) => '<button class="sz' + (on ? ' is-on' : '') + (extra || '') + '" data-row="' + row + '" data-v="' + esc(v) + '">' + esc(v === '?' ? 'Not sure' : v) + '</button>';
    function draw() {
      let x = '';
      if (sp.t === 'one') x = '<div class="pkg">' + hdr('Size') + '<div class="sizes">' + chip('one', sp.v, true) + '</div></div>';
      else if (sp.t === 'sel') x = '<div class="pkg" data-g="size">' + hdr('Size', 'choose one') + '<div class="sizes">' + sp.opts.map(v => chip('s', v, s === v)).join('') + chip('s', '?', s === '?', ' sz--ask') + '</div></div>';
      else if (sp.t === 'pair') {
        const lim = sp.lt && a && a !== '?' ? rung(a) : 99;
        x = '<div class="pkg" data-g="size">' + hdr('Size', sp.lt ? 'big end, then small end' : 'both ends') +
          '<p class="pk__sub">' + (sp.lt ? 'Big end' : 'First end') + '</p><div class="sizes">' + sp.L.map(v => chip('a', v, a === v)).join('') + chip('a', '?', a === '?', ' sz--ask') + '</div>' +
          '<p class="pk__sub">' + (sp.lt ? 'Small end' : 'Second end') + '</p><div class="sizes">' + sp.S.map(v => chip('b', v, b === v, sp.lt && rung(v) >= lim ? ' is-off' : '')).join('') + chip('b', '?', b === '?', ' sz--ask') + '</div></div>';
      } else if (o.size || sp.len) x = '<div class="pkg">' + hdr('Size', sp.hint ? 'we offer ' + sp.hint : '') + '<input class="field" data-t maxlength="40" placeholder="' + esc(sp.hint ? 'Type the size (' + sp.hint + ')' : 'Size, if the customer knows it') + '"></div>';
      if (sp.len) x += '<p class="pk__sub">Length</p><input class="field" data-len maxlength="30" placeholder="Length (' + esc(sp.len) + ')">';
      if (sp.note) x += '<p class="note">' + esc(sp.note) + '</p>';
      if (specs.length) x += '<div class="pkg" data-g="specs">' + hdr('Specs & ratings', specs.length > 1 ? 'tap the ones you need' : '') + '<div class="sizes">' + specs.map(v => chip('sp', v, sps.has(v))).join('') + (specs.length > 1 ? chip('sp', '?', sps.has('?'), ' sz--ask') : '') + '</div></div>';
      if (m.opts.length) x += '<div class="pkg" data-g="mat">' + hdr('Material', m.opts.length > 1 ? 'choose one' : '') + (m.opts.length > 1 ? '<div class="sizes">' + m.opts.map(v => chip('mt', v, mt === v)).join('') + chip('mt', '?', mt === '?', ' sz--ask') + '</div>' : '<p class="pk__fixed">' + esc(m.full) + '</p>') + (m.note && m.opts.length > 1 ? '<p class="pk__n">' + esc(m.note) + '</p>' : '') + '</div>';
      const keep = { t: $('[data-t]', el) && $('[data-t]', el).value, len: $('[data-len]', el) && $('[data-len]', el).value };
      el.innerHTML = x;
      if (keep.t && $('[data-t]', el)) $('[data-t]', el).value = keep.t;
      if (keep.len && $('[data-len]', el)) $('[data-len]', el).value = keep.len;
    }
    el.addEventListener('click', e => {
      const c = e.target.closest('.sz'); if (!c) return;
      const row = c.dataset.row, val = c.dataset.v;
      if (row === 'one') return;
      if (row === 's') s = s === val ? '' : val;
      else if (row === 'a') { a = a === val ? '' : val; if (sp.lt && a && a !== '?' && b && b !== '?' && rung(b) >= rung(a)) b = ''; }
      else if (row === 'b') b = b === val ? '' : val;
      else if (row === 'sp') { if (sps.has(val)) sps.delete(val); else { if (val === '?') sps.clear(); else sps.delete('?'); sps.add(val); } }   // "Not sure" or specs, not both
      else if (row === 'mt') mt = mt === val ? '' : val;
      buzz(); draw();
    });
    if (cur) {
      const [base, len] = String(cur.s || '').split(' · ');
      if (sp.t === 'sel' && (sp.opts.includes(base) || base === '?')) s = base;
      if (sp.t === 'pair' && base) { const [x, y] = base === '?' ? ['?', '?'] : base.split(' × '); a = x || ''; b = y || ''; }
      sps = new Set((cur.sp || []).filter(v => v === '?' ? specs.length > 1 : specs.includes(v)));
      mt = m.opts.includes(cur.mt) || (cur.mt === '?' && m.opts.length > 1) ? cur.mt : '';
      draw();
      const t = $('[data-t]', el); if (t && base && base !== '?') t.value = base;
      const l = $('[data-len]', el); if (l && len) l.value = len;
    } else draw();
    function read() {
      let size = '';
      if (sp.t === 'one') size = sp.v;
      else if (sp.t === 'sel') size = s || (o.size ? '?' : '');
      else if (sp.t === 'pair') size = !a && !b ? '?' : (a === '?' || !a) && (b === '?' || !b) ? '?' : (sp.L.length === 1 ? sp.L[0] : a || '?') + ' × ' + (b || '?');
      else { const t = $('[data-t]', el); size = (t ? t.value.replace(/[|·¦]/g, ' ').trim() : '') || (o.size ? '?' : ''); }
      const l = $('[data-len]', el), len = l ? l.value.replace(/[|·¦]/g, ' ').trim() : '';
      if (len) size = (size || '?') + ' · ' + len;
      return { s: size, sp: specs.filter(v => sps.has(v)).concat(sps.has('?') ? ['?'] : []), mt: m.opts.length > 1 ? mt : '' };
    }
    // like the website: a size, the specs and the material (when there are several) need a pick or "Not sure" first
    function check() {
      const miss = (sp.t === 'sel' && !s) || (sp.t === 'pair' && (a === '?' ? false : !(sp.L.length === 1 || a) || !b)) ? 'size' : specs.length > 1 && !sps.size ? 'specs' : m.opts.length > 1 && !mt ? 'mat' : '';
      if (!miss) return true;
      const g = $('[data-g="' + miss + '"]', el);
      if (g) { g.scrollIntoView({ block: 'center', behavior: 'smooth' }); if (!reduce) g.animate([{ transform: 'translateX(0)' }, { transform: 'translateX(-8px)' }, { transform: 'translateX(8px)' }, { transform: 'none' }], { duration: 300 }); g.classList.remove('is-miss'); void g.offsetWidth; g.classList.add('is-miss'); }
      buzz();
      toast({ size: 'Choose a size, or tap Not sure', specs: 'Choose the specs & ratings, or tap Not sure', mat: 'Choose a material, or tap Not sure' }[miss]);
      return false;
    }
    function reset() { s = sp.t === 'one' ? sp.v : ''; a = ''; b = ''; mt = ''; sps = new Set(specs.length === 1 ? specs : []); const t = $('[data-t]', el); if (t) t.value = ''; const l = $('[data-len]', el); if (l) l.value = ''; draw(); }
    return { el, read, reset, check };
  }
  function qtyBox(start, onChange) {
    let n = start;
    const el = h('<div class="qty"><button aria-label="Less">−</button><input inputmode="numeric" aria-label="Quantity" value="' + n + '"><button aria-label="More">+</button></div>');
    const [m, inp, p] = [$$('button', el)[0], $('input', el), $$('button', el)[1]];
    const set = v => { n = Math.max(1, Math.min(99999, v)); inp.value = n; onChange && onChange(n); };
    m.onclick = () => { set(n - 1); buzz(); }; p.onclick = () => { set(n + 1); buzz(); };
    inp.addEventListener('change', () => { const d = String(inp.value).replace(/[\s,']/g, '').match(/\d+/); set(d ? +d[0] : n); });
    inp.addEventListener('focus', () => inp.select());
    return { el, get: () => n, set };
  }
  function flyToList(src) {
    updateBadge(true); buzz();
    if (!src || reduce) return;
    const a = src.getBoundingClientRect(), t = $('#tabs [data-tab="cart"]').getBoundingClientRect();
    const s = Math.min(a.width, a.height, 160);
    const f = h('<div class="fly"><img src="' + esc(src.getAttribute && src.getAttribute('src') || '') + '" alt=""></div>');
    Object.assign(f.style, { left: (a.left + a.width / 2 - s / 2) + 'px', top: (a.top + a.height / 2 - s / 2) + 'px', width: s + 'px', height: s + 'px' });
    document.body.appendChild(f);
    const dx = t.left + t.width / 2 - (a.left + a.width / 2), dy = t.top + 12 - (a.top + a.height / 2);
    f.animate([
      { transform: 'translate(0,0) scale(1)', opacity: 1 },
      { transform: 'translate(' + dx * .35 + 'px,' + (dy * .2 - 80) + 'px) scale(.7)', opacity: 1, offset: .4 },
      { transform: 'translate(' + dx + 'px,' + dy + 'px) scale(.12)', opacity: .5 }
    ], { duration: 750, easing: 'cubic-bezier(.5,0,.3,1)' }).onfinish = () => { f.remove(); updateBadge(true); };
  }
  // the + on a card: products with one size go straight in, others ask for the size first
  function quickAdd(o, btn) {
    if (!o) return;
    const card = btn.closest('.pcard');
    if (!hasChoices(o)) {
      addLines(o, picker(o).read(), 1);
      flyToList(card && $('.ph img', card));
      toast('Added: ' + o.name, 'Open cart', () => switchTab('cart'));
      return;
    }
    const pk = picker(o), q = qtyBox(1);
    const body = h('<div><div class="shead">' + photo(o.img, o.name) + '<div><span class="mono" style="color:var(--steel)">' + esc(o.c.name) + '</span><b>' + esc(o.name) + '</b></div></div><div id="spk"></div>' +
      '<div class="addrow"><div id="sq"></div><button class="btn btn--red" id="sadd">' + I.plus + 'Add to cart</button></div>' +
      '<button class="btn btn--ghost btn--full" style="margin-top:10px" data-go="p/' + o.id.replace(':', '/') + '">See full details</button></div>');
    $('#spk', body).appendChild(pk.el); $('#sq', body).replaceWith(q.el);
    $('#sadd', body).addEventListener('click', () => {
      if (!pk.check()) return;
      addLines(o, pk.read(), q.get());
      const src = card && $('.ph img', card);
      closeSheet();
      setTimeout(() => flyToList(src), 120);
      toast('Added: ' + o.name, 'Open cart', () => switchTab('cart'));
    });
    openSheet(body);
  }

  /* ================= SEARCH ================= */
  const FRAC = [['1-1/2', '1½'], ['1 1/2', '1½'], ['1-1/4', '1¼'], ['1 1/4', '1¼'], ['2-1/2', '2½'], ['2 1/2', '2½'], ['3-1/2', '3½'], ['1/2', '½'], ['3/4', '¾'], ['1/4', '¼'], ['3/8', '⅜'], ['1/8', '⅛']];
  function norm(s) {
    s = ' ' + String(s).toLowerCase() + ' ';
    FRAC.forEach(([a, b]) => { s = s.split(a).join(b); });
    return s.replace(/(\d[½¼¾⅜⅛]?)\s*(?:inch|in|'')(?=\W)/g, '$1"')
      .replace(/\bs\.s\.?/g, 'ss').replace(/\bc\.s\.?/g, 'cs').replace(/\bg\.i\.?/g, 'gi').replace(/\bm\.s\.?/g, 'ms').replace(/\bc\.i\.?/g, 'ci').replace(/\bd\.i\.?/g, 'di')
      .replace(/\bss\s?(304|316)l?\b/g, 'ss $1').replace(/(\d)\s*#/g, '$1 lb').replace(/\bnrv\b/g, 'non return check')
      .replace(/stainless( steel)?/g, 'stainless ss').replace(/carbon steel/g, 'carbon cs').replace(/galvani[sz]ed/g, 'galvanised gi').replace(/mild steel/g, 'mild ms').replace(/cast iron/g, 'cast ci').replace(/ductile( iron)?/g, 'ductile di')
      .replace(/[^\w"½¼¾⅜⅛ ]+/g, ' ').replace(/\s+/g, ' ').trim();
  }
  const HAY = new Map();
  function hay(o) {
    if (HAY.has(o.id)) return HAY.get(o.id);
    const sp = sizeSpec(o);
    const sizes = new Set((sp.t === 'sel' ? sp.opts : sp.t === 'pair' ? sp.L.concat(sp.S) : sp.t === 'one' ? [sp.v] : []).map(s => s.replace(/\s/g, '')));
    const x = { name: norm(o.name).split(' '), rest: norm([o.mat, o.specs.join(' '), o.c.name, famName(o.c.fam)].join(' ')).split(' '), sizes, raw: o.size.replace(/\s/g, '') };
    HAY.set(o.id, x); return x;
  }
  function search(q) {
    const toks = norm(q).split(' ').filter(Boolean);
    if (!toks.length) return [];
    const out = [];
    P.forEach((o, idx) => {
      const hh = hay(o); let score = 0;
      for (const t of toks) {
        const isSize = /^\d+[½¼¾⅜⅛]?"$|^[½¼¾⅜⅛]"$/.test(t);
        if (isSize) { if (hh.sizes.has(t) || hh.raw.includes(t)) { score += 1; continue; } return; }
        if (hh.name.some(w => w.startsWith(t))) score += 3;
        else if (hh.rest.some(w => w.startsWith(t))) score += 1;
        else if (/^\d+$/.test(t) && (hh.sizes.has(t + '"') || hh.raw.includes(t + '"'))) score += 1;
        else return;
      }
      out.push({ o, score, idx });
    });
    return out.sort((x, y) => y.score - x.score || x.idx - y.idx).map(x => x.o);
  }
  // typing mistakes ("camlok", "flang", "gaskit"): a word one or two letters off still counts
  function near(a, b) {
    if (Math.abs(a.length - b.length) > 2) return 99;
    const d = Array.from({ length: a.length + 1 }, (_, i) => [i]);
    for (let j = 1; j <= b.length; j++) d[0][j] = j;
    for (let i = 1; i <= a.length; i++) for (let j = 1; j <= b.length; j++) d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
    return d[a.length][b.length];
  }
  function fuzzy(q) {
    const toks = norm(q).split(' ').filter(Boolean);
    if (!toks.length || toks.every(t => t.length < 4)) return [];
    return P.filter(o => {
      const hh = hay(o), words = hh.name.concat(hh.rest);
      return toks.every(t => t.length < 4 ? words.some(w => w.startsWith(t)) || hh.raw.includes(t) : words.some(w => w.startsWith(t) || near(t, w.slice(0, t.length + 1)) <= (t.length > 6 ? 2 : 1) || near(t, w) <= (t.length > 6 ? 2 : 1)));
    });
  }
  let recentQ = store.get('ft-searches', []);
  function viewSearch(q0) {
    const el = h('<section><div class="sbar" style="display:flex;gap:6px;align-items:center;padding-left:6px"><button class="ib" data-back aria-label="Back">' + I.back + '</button><label class="sfield" style="flex:1">' + I.search + '<input type="search" enterkeyhint="search" autocomplete="off" placeholder="Gate valve, camlock, 2&quot; elbow, ss316…"><button class="ib" data-clear aria-label="Clear" hidden>' + I.x + '</button></label></div><div class="view__pad" id="sres"></div></section>');
    const v = { el }, inp = $('input', el), res = $('#sres', el), clr = $('[data-clear]', el);
    let t = null;
    const ideas = ['Gate valve', 'Ball valve', 'Camlock', 'Flange', 'Elbow', 'Y strainer', 'Hammer union', 'Gasket', 'SS316', '2"'];
    function idle() {
      res.innerHTML = (recentQ.length ? '<div class="h-sec" style="margin-top:14px"><h2>Recent</h2><button data-clr>Clear</button></div><div class="sugg">' + recentQ.map(s => '<button class="chip" data-q="' + esc(s) + '">' + esc(s) + '</button>').join('') + '</div>' : '') +
        '<div class="h-sec" style="margin-top:' + (recentQ.length ? 30 : 14) + 'px"><h2>Try</h2></div><div class="sugg">' + ideas.map(s => '<button class="chip" data-q="' + esc(s) + '">' + esc(s) + '</button>').join('') + '</div>' +
        '<div class="h-sec"><h2>Jump to a range</h2></div><div class="plist">' + CATS.map(c => '<button class="prow" data-go="c/' + c.slug + '">' + photo(c.coverImg, c.name) + '<div><b>' + esc(c.name) + '</b><span>' + countWord(c.items.length, 'product') + '</span></div></button>').join('') + '</div>';
      wirePhotos(res);
    }
    function run(remember) {
      const q = inp.value.trim();
      clr.hidden = !q;
      if (!q) return idle();
      let r = search(q), fz = false;
      if (!r.length) { r = fuzzy(q); fz = r.length > 0; }
      const toks = q.toLowerCase().split(/\s+/).filter(x => x.length > 0).map(x => x.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
      const rx = toks.length ? new RegExp('(' + toks.join('|') + ')', 'gi') : null;
      const mark = s => rx && !fz ? esc(s).replace(rx, '<mark>$1</mark>') : esc(s);
      res.innerHTML = '<p class="scount">' + (r.length ? countWord(r.length, 'product') + (fz ? ' with a similar spelling' : ' found') : '') + '</p>' + (r.length ? '<div class="plist">' + r.slice(0, 120).map(o => prodRow(o, mark)).join('') + '</div>' :
        '<div class="empty">' + I.search.replace('<svg', '<svg width="56" height="56"') + '<b>Nothing found for "' + esc(q) + '"</b>Try a shorter word, or ask the shop on WhatsApp.<br><br><button class="btn btn--wa" data-open="' + esc(waLink(WA, 'Do you have: ' + q + '?')) + '">' + I.wa + 'Ask the shop</button></div>');
      wirePhotos(res);
      if (remember && r.length) { recentQ = [q].concat(recentQ.filter(x => x.toLowerCase() !== q.toLowerCase())).slice(0, 8); store.set('ft-searches', recentQ); }
    }
    inp.addEventListener('input', () => { clearTimeout(t); t = setTimeout(() => run(false), 120); });
    inp.addEventListener('keydown', e => { if (e.key === 'Enter') { run(true); inp.blur(); } });
    res.addEventListener('click', e => {
      const c = e.target.closest('[data-q]'); if (c) { inp.value = c.dataset.q; run(true); return; }
      if (e.target.closest('[data-clr]')) { recentQ = []; store.set('ft-searches', []); idle(); return; }
      if (e.target.closest('[data-go]') && inp.value.trim()) { const q = inp.value.trim(); recentQ = [q].concat(recentQ.filter(x => x.toLowerCase() !== q.toLowerCase())).slice(0, 8); store.set('ft-searches', recentQ); }
    });
    clr.addEventListener('click', e => { e.preventDefault(); inp.value = ''; run(false); inp.focus(); });
    el.addEventListener('scroll', () => { if (document.activeElement === inp) inp.blur(); }, { passive: true });
    inp.value = q0 || ''; run(false);
    v.onShow = () => { if (!inp.value) setTimeout(() => inp.focus(), 380); };
    v.onRetap = () => { inp.focus(); inp.select(); };
    return v;
  }

  /* ================= CART ================= */
  function viewCart() {
    const el = h('<section></section>');
    const v = { el };
    function count() { return lines.reduce((s, l) => s + l.q, 0); }
    function draw() {
      el.innerHTML = '<header class="bar bar--fixed" style="padding-left:var(--pad)"><div class="bar__t">Cart</div>' + (lines.length ? '<button class="ib" data-clearall aria-label="Empty the cart">' + I.trash + '</button>' : '') + '</header>' +
        '<div class="view__pad"><div class="ptitle" style="padding:0"><p class="mono eyebrow" id="cartCount">' + (lines.length ? countWord(lines.length, 'item') + ' · ' + nfmt(count()) + ' pcs' : 'Empty') + '</p><h1 style="margin-top:10px">Cart</h1></div>' +
        (lines.length ? '<div class="lines">' + lines.map((l, i) => {
          const o = lineProduct(l);
          return '<div class="line" data-i="' + i + '"><div class="line__top">' + photo(o ? o.img : '', l.n) + '<div class="line__t"' + (o ? ' data-go="p/' + o.id.replace(':', '/') + '"' : '') + '><small>' + esc(groupOfLine(l, o)) + '</small><b>' + esc(l.n) + '</b>' + lineParts(l, o) + (o ? '' : '<span class="lp" style="color:var(--amber)">No longer in the catalogue</span>') + '</div></div>' +
            '<div class="line__bot"><div class="line__q" data-q="' + i + '"></div>' + (o && hasChoices(o) ? '<button class="chg" data-chg="' + i + '">Change</button>' : '') + '</div><button class="line__x" data-del="' + i + '" aria-label="Remove">' + I.x + '</button></div>';
        }).join('') + '</div>' +
        '<button class="btn btn--ghost btn--full" style="margin-top:12px" data-browse>' + I.plus + 'Add more products</button>' +
        '<div class="sendbar"><button class="btn btn--red btn--full" data-checkout>' + I.box + 'Place order</button><div class="prow2"><button class="btn btn--wa" data-k="ask">' + I.wa + 'Price check</button><button class="btn btn--ghost" data-k="cust">' + I.share + 'To customer</button></div></div>'
        : '<div class="empty">' + I.box.replace('<svg', '<svg width="56" height="56"') + '<b>Your cart is empty</b>Open any product and tap "Add to cart". When the customer is ready, place the order from here.<br><br><button class="btn btn--red" data-browse>Browse products</button></div>') +
        '</div>';
      $$('[data-q]', el).forEach(box => {
        const i = +box.dataset.q;
        box.appendChild(qtyBox(lines[i].q, n2 => { lines[i].q = n2; saveLines(); $('#cartCount', el).textContent = countWord(lines.length, 'item') + ' · ' + nfmt(count()) + ' pcs'; }).el);
      });
      wirePhotos(el);
      v.dirty = false;
    }
    el.addEventListener('click', e => {
      const t = e.target;
      const d = t.closest('[data-del]');
      if (d) {
        const i = +d.dataset.del, row = d.closest('.line'), gone = lines[i];
        row.classList.add('is-gone');
        setTimeout(() => { lines.splice(i, 1); saveLines(); refreshMarks(); draw(); toast('Removed ' + gone.n, 'Undo', () => { lines.splice(i, 0, gone); saveLines(); refreshMarks(); draw(); }); }, 280);
        return;
      }
      if (t.closest('[data-clearall]')) { confirmSheet('Empty the cart?', 'All ' + countWord(lines.length, 'item') + ' will be removed from the cart.', 'Empty cart', () => { lines = []; saveLines(); refreshMarks(); draw(); }); return; }
      if (t.closest('[data-checkout]')) { go('order'); return; }
      const cg = t.closest('[data-chg]');
      if (cg) {
        const i = +cg.dataset.chg, l = lines[i], o = lineProduct(l); if (!o) return;
        const pk = picker(o, l);
        const body = h('<div><div class="shead">' + photo(o.img, o.name) + '<div><span class="mono" style="color:var(--steel)">' + esc(o.c.name) + '</span><b>' + esc(o.name) + '</b></div></div><div id="spk"></div><button class="btn btn--red btn--full" style="margin-top:18px" id="ssave">' + I.check + 'Save changes</button></div>');
        $('#spk', body).appendChild(pk.el);
        $('#ssave', body).onclick = () => {
          if (!pk.check()) return;
          const pick = pk.read(), nl = Object.assign({}, l, { s: pick.s, sp: pick.sp, mt: pick.mt });
          const dup = lines.findIndex((x, j) => j !== i && lineKey(x) === lineKey(nl));
          if (dup > -1) { lines[dup].q = Math.min(99999, lines[dup].q + l.q); lines.splice(i, 1); } else lines[i] = nl;
          saveLines(); refreshMarks(); closeSheet(); draw(); toast('Changed');
        };
        openSheet(body);
        return;
      }
      const k = t.closest('[data-k]');
      if (k && k.dataset.k === 'ask') { open(waLink(WA, 'Hello Fakhri Tools, please send me a price for ' + (lines.length === 1 ? 'this item' : 'these ' + lines.length + ' items') + ':\n\n' + itemsText(lines) + '\n\nThank you.')); return; }
      if (k && k.dataset.k === 'cust') { sendTo('Send the list to the customer', listMsgCustomer(), cust.phone); return; }
    });
    draw();
    v.refresh = draw;
    v.onShow = () => { if (v.dirty) draw(); };
    return v;
  }
  // a WhatsApp chat with the customer, or any app, or copy
  function sendTo(title, msg, phone) {
    const d = phoneDigits(phone);
    const body = h('<div><h3>' + esc(title) + '</h3><p class="sub">No prices are included. The shop\'s WhatsApp and phone are at the end.</p>' +
      (d ? '<button class="choice" data-k="wa"><i style="background:#1fa855">' + I.wa + '</i><div><b>WhatsApp ' + esc(phone) + '</b><span>Opens the chat with the message typed in</span></div></button>' : '') +
      '<button class="choice" data-k="wa0"><i style="background:#1fa855">' + I.wa + '</i><div><b>WhatsApp, choose the chat</b><span>Pick the customer in WhatsApp</span></div></button>' +
      '<button class="choice" data-k="share"><i style="background:var(--navy)">' + I.share + '</i><div><b>Share with any app</b><span>SMS, email and more</span></div></button>' +
      '<button class="choice" data-k="copy"><i style="background:var(--ink-5)">' + I.copy + '</i><div><b>Copy the text</b><span>Paste it anywhere</span></div></button></div>');
    body.addEventListener('click', e => {
      const c = e.target.closest('[data-k]'); if (!c) return;
      closeSheet();
      const k = c.dataset.k;
      if (k === 'wa') open(waLink(d, msg)); else if (k === 'wa0') open(waLink('', msg)); else if (k === 'share') share('Fakhri Tools', msg); else copy(msg);
    });
    openSheet(body);
  }

  /* ================= ORDER FORM ================= */
  function nextOrderNo() {
    const d = new Date(Date.now() + 4 * 3600e3), stamp = String(d.getUTCDate()).padStart(2, '0') + String(d.getUTCMonth() + 1).padStart(2, '0') + String(d.getUTCFullYear()).slice(2);
    const n = store.get('ft-orders', []).filter(o => o.no.indexOf('AQ-' + stamp) === 0).length + 1;
    return 'AQ-' + stamp + '-' + String(n).padStart(2, '0');
  }
  function viewOrder() {
    const el = h('<section></section>');
    const v = { el };
    if (!cust.delivery) cust.delivery = 'pickup';
    const opt = (key, val, label) => '<button class="seg' + (cust[key] === val ? ' is-on' : '') + '" data-opt="' + key + '" data-val="' + esc(val) + '">' + esc(label) + '</button>';
    function draw() {
      const n = lines.reduce((s, l) => s + l.q, 0);
      el.innerHTML = bar('New order') + '<div class="view__pad"><div class="ptitle" style="padding:0"><p class="mono eyebrow">Order form</p><h1 style="margin-top:10px">New order</h1></div>' +
        (!lines.length ? '<div class="empty">' + I.box.replace('<svg', '<svg width="56" height="56"') + '<b>The cart is empty</b>Add the products first, then come back to place the order.<br><br><button class="btn btn--red" data-browse>Browse products</button></div></div>' :
        '<div class="form">' +
          '<p class="flabel">1 · Customer</p>' +
          '<input class="field" data-c="name" placeholder="Company or workshop *" value="' + esc(cust.name || '') + '">' +
          '<input class="field" data-c="person" placeholder="Contact person" value="' + esc(cust.person || '') + '">' +
          '<input class="field" data-c="phone" inputmode="tel" placeholder="Phone / WhatsApp *" value="' + esc(cust.phone || '') + '">' +
          '<input class="field" data-c="site" placeholder="Location or site (area, building)" value="' + esc(cust.site || '') + '">' +
          '<p class="flabel">2 · Delivery</p><div class="segs2">' + opt('delivery', 'pickup', 'Collect from shop') + opt('delivery', 'deliver', 'Deliver') + '</div>' +
          (cust.delivery === 'deliver' ? '<p class="note" style="margin-top:0">Delivery anywhere in the UAE is for orders from AED 5,000. The shop confirms it with the price.</p>' : '') +
          '<label class="flab2">Needed by (optional)<input class="field" type="date" data-c="by" value="' + esc(cust.by || '') + '"></label>' +
          '<p class="flabel">3 · Payment</p><div class="segs2 segs2--wrap">' + PAY.map(p => opt('pay', p, p)).join('') + '</div>' +
          '<p class="flabel">4 · Note</p><textarea class="field" data-c="note" placeholder="Anything the shop should know (threading, cut lengths, timing)">' + esc(cust.note || '') + '</textarea>' +
          '<p class="flabel">5 · Items</p>' +
          '<div class="kv osum">' + lines.map(l => '<div><span style="color:var(--hd)">' + esc(l.n) + shortOf(l) + '</span><b>× ' + nfmt(l.q) + '</b></div>').join('') + '<div><span>Total</span><b>' + countWord(lines.length, 'item') + ' · ' + nfmt(n) + ' pcs</b></div></div>' +
          '<button class="btn btn--ghost btn--full" style="margin-top:10px" data-tab="cart">Change items in the cart</button>' +
        '</div>' +
        '<div class="sendbar"><button class="btn btn--wa btn--full" data-place>' + I.wa + 'Send order to the shop</button><p class="fine">Opens WhatsApp to Mr Hussain (' + esc(WA_SHOW) + ') with the order typed in. Press send there.</p></div></div>');
      wirePhotos(el);
    }
    el.addEventListener('input', e => { const f = e.target.closest('[data-c]'); if (!f) return; cust[f.dataset.c] = f.value; f.classList.remove('is-bad'); store.set('ft-cust', cust); });
    el.addEventListener('click', e => {
      const o = e.target.closest('[data-opt]');
      if (o) { const k = o.dataset.opt; cust[k] = cust[k] === o.dataset.val && k === 'pay' ? '' : o.dataset.val; store.set('ft-cust', cust); buzz(); const y = el.scrollTop; draw(); el.scrollTop = y; return; }
      if (e.target.closest('[data-place]')) place();
    });
    function place() {
      const bad = [['name', !String(cust.name || '').trim()], ['phone', !phoneDigits(cust.phone)]].filter(x => x[1]).map(x => x[0]);
      if (bad.length) {
        bad.forEach(k => { const f = $('[data-c="' + k + '"]', el); f.classList.add('is-bad'); f.animate([{ transform: 'translateX(0)' }, { transform: 'translateX(-8px)' }, { transform: 'translateX(8px)' }, { transform: 'none' }], { duration: 300 }); });
        $('[data-c="' + bad[0] + '"]', el).scrollIntoView({ block: 'center', behavior: 'smooth' });
        toast(bad[0] === 'name' ? 'Type the customer\'s company or name' : 'Type a phone number the shop can call');
        return;
      }
      const x = { id: Date.now().toString(36), no: nextOrderNo(), at: Date.now(), cust: Object.assign({}, cust), lines: lines.map(l => Object.assign({}, l)), status: 'sent' };
      const all = store.get('ft-orders', []); all.unshift(x); store.set('ft-orders', all.slice(0, 200));
      open(waLink(WA, orderMsg(x)));
      lines = []; saveLines(); refreshMarks();
      cust = { delivery: 'pickup' }; store.set('ft-cust', cust);
      const ov = stacks.orders[0]; if (ov) ov.dirty = true;
      setTimeout(() => success(x), 400);
    }
    draw();
    v.refresh = draw;
    return v;
  }
  function success(x) {
    const body = h('<div class="done"><div class="done__tick"><svg viewBox="0 0 52 52"><circle cx="26" cy="26" r="24"/><path d="M15 27l7 7 15-16"/></svg></div><h3>Order ' + esc(x.no) + ' sent</h3><p class="sub">It is saved in Orders. If WhatsApp did not open, use "Send again" there.</p>' +
      '<button class="btn btn--wa btn--full" data-k="pdfshop">' + I.pdf + 'Send the order form (PDF) to the shop</button>' +
      '<div class="prow2"><button class="btn btn--ghost" data-k="pdfcust">' + I.pdf + 'PDF to customer</button><button class="btn btn--ghost" data-k="pdf">' + I.share + 'Share or save</button></div>' +
      '<button class="btn btn--ghost btn--full" style="margin-top:10px" data-k="cust">' + I.share + 'Send the customer a text copy</button><button class="btn btn--red btn--full" style="margin-top:10px" data-k="orders">See all orders</button></div>');
    body.addEventListener('click', e => {
      const k = e.target.closest('[data-k]'); if (!k) return;
      if (k.dataset.k === 'pdfshop') sharePdf(x, 'shop');
      else if (k.dataset.k === 'pdfcust') sharePdf(x, x.cust.phone);
      else if (k.dataset.k === 'pdf') sharePdf(x, '');
      else if (k.dataset.k === 'cust') { closeSheet(); setTimeout(() => sendTo('Send a copy to the customer', orderMsgCustomer(x), x.cust.phone), 380); }
      else { closeSheet(); switchTab('orders'); }
    });
    openSheet(body);
    buzz();
    // back on the cart, which is now empty
    while (stacks[tab].length > 1) pop(true);
    const cv = stacks.cart[0]; if (cv) cv.refresh();
  }

  /* ================= ORDERS ================= */
  function ordersHTML(list) {
    if (!list.length) return '<div class="empty">' + I.box.replace('<svg', '<svg width="56" height="56"') + '<b>No orders yet</b>Orders you send to the shop are kept here, so you can send them again or repeat them.</div>';
    let last = '';
    return list.map(x => {
      const day = new Date(x.at).toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' });
      const head = day !== last ? '<p class="oday">' + esc(day) + '</p>' : ''; last = day;
      const pcs = x.lines.reduce((s, l) => s + l.q, 0);
      return head + '<button class="order tile" data-order="' + x.id + '"><div class="order__top"><b>' + esc(x.cust.name || 'No name') + '</b><span class="pill">' + esc(x.no) + '</span></div>' +
        '<span>' + countWord(x.lines.length, 'item') + ' · ' + nfmt(pcs) + ' pcs · ' + (x.cust.delivery === 'deliver' ? 'Delivery' : 'Collect') + ' · ' + new Date(x.at).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }) + '</span>' +
        '<div class="order__thumbs">' + x.lines.slice(0, 5).map(l => { const o = lineProduct(l); return photo(o ? o.img : '', l.n); }).join('') + (x.lines.length > 5 ? '<i>+' + (x.lines.length - 5) + '</i>' : '') + '</div></button>';
    }).join('');
  }
  function viewOrders() {
    const el = h('<section></section>');
    const v = { el };
    let q = '';
    function draw() {
      const all = store.get('ft-orders', []);
      const list = q ? all.filter(x => (x.no + ' ' + x.cust.name + ' ' + x.cust.person + ' ' + x.cust.phone + ' ' + x.lines.map(l => l.n).join(' ')).toLowerCase().includes(q.toLowerCase())) : all;
      const week = all.filter(x => Date.now() - x.at < 7 * 864e5).length;
      el.innerHTML = '<header class="bar bar--fixed" style="padding-left:var(--pad)"><div class="bar__t">Orders</div></header><div class="view__pad">' +
        '<div class="ptitle" style="padding:0"><p class="mono eyebrow">' + countWord(all.length, 'order') + ' · ' + week + ' this week</p><h1 style="margin-top:10px">Orders</h1></div>' +
        '<button class="newo" data-new><span class="newo__i">' + I.plus + '</span><div><b>New order</b><span>' + (lines.length ? 'Cart has ' + countWord(lines.length, 'item') + '. Fill in the customer and send.' : 'Add products to the cart, then fill the form') + '</span></div>' + I.chev + '</button>' +
        (all.length > 3 ? '<label class="sfield" style="margin-top:14px;height:50px">' + I.search + '<input type="search" placeholder="Find an order: customer, number, product" value="' + esc(q) + '"></label>' : '') +
        '<div class="orders" id="olist">' + ordersHTML(list) + '</div></div>';
      wirePhotos(el);
      const inp = $('input', el);
      if (inp) inp.addEventListener('input', () => { q = inp.value; const ol = $('#olist', el); const all2 = store.get('ft-orders', []); ol.innerHTML = ordersHTML(q ? all2.filter(x => (x.no + ' ' + x.cust.name + ' ' + x.cust.person + ' ' + x.cust.phone + ' ' + x.lines.map(l => l.n).join(' ')).toLowerCase().includes(q.toLowerCase())) : all2); wirePhotos(ol); });
      v.dirty = false;
    }
    el.addEventListener('click', e => {
      if (e.target.closest('[data-new]')) { if (lines.length) go('order'); else { toast('Add products to the cart first'); switchTab('home'); setTimeout(() => { if (!stacks.home.some(v => v.route === 'cats')) go('cats'); }, 520); } return; }
      const o = e.target.closest('[data-order]'); if (o) openOrder(o.dataset.order);
    });
    draw();
    v.refresh = draw;
    v.onShow = () => { if (v.dirty) draw(); else { const n = $('.newo span:not(.newo__i)', el); if (n) n.textContent = lines.length ? 'Cart has ' + countWord(lines.length, 'item') + '. Fill in the customer and send.' : 'Add products to the cart, then fill the form'; } };
    return v;
  }
  function openOrder(id) {
    const x = store.get('ft-orders', []).find(z => z.id === id); if (!x) return;
    const c = x.cust;
    const body = h('<div><p class="mono" style="color:var(--red-2)">' + esc(x.no) + '</p><h3 style="margin-top:6px">' + esc(c.name || 'Order') + '</h3><p class="sub">' + new Date(x.at).toLocaleString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) + '</p>' +
      '<div class="kv">' + [['Contact', c.person], ['Phone', c.phone], ['Location', c.site], ['Delivery', c.delivery === 'deliver' ? 'Deliver' : 'Collect from shop'], ['Needed by', c.by], ['Payment', c.pay], ['Note', c.note]].filter(r => r[1]).map(r => '<div><span>' + r[0] + '</span><b>' + esc(r[1]) + '</b></div>').join('') + '</div>' +
      '<div class="kv osum">' + x.lines.map(l => '<div><span style="color:var(--hd)">' + esc(l.n) + shortOf(l) + '</span><b>× ' + nfmt(l.q) + '</b></div>').join('') + '</div>' +
      '<button class="btn btn--red btn--full" style="margin-top:16px" data-k="pdf">' + I.pdf + 'Order form (PDF)</button>' +
      '<div class="prow2"><button class="btn btn--ghost" data-k="pdfshop">' + I.pdf + 'PDF to shop</button><button class="btn btn--ghost" data-k="pdfcust">' + I.pdf + 'PDF to customer</button></div>' +
      '<div class="prow2"><button class="btn btn--wa" data-k="wa">' + I.wa + 'Send again</button><button class="btn btn--ghost" data-k="cust">' + I.share + 'Text to customer</button></div>' +
      '<div class="prow2"><button class="btn btn--ghost" data-k="repeat">' + I.sync + 'Repeat order</button><button class="btn btn--ghost" data-k="del">' + I.trash + 'Delete</button></div></div>');
    body.addEventListener('click', e => {
      const b = e.target.closest('[data-k]'); if (!b) return;
      const k = b.dataset.k;
      if (k === 'wa') open(waLink(WA, orderMsg(x)));
      else if (k === 'pdf') sharePdf(x, '');
      else if (k === 'pdfshop') sharePdf(x, 'shop');
      else if (k === 'pdfcust') sharePdf(x, c.phone);
      else if (k === 'cust') { closeSheet(); setTimeout(() => sendTo('Send a copy to the customer', orderMsgCustomer(x), c.phone), 380); }
      else if (k === 'repeat') {
        const load = () => { lines = x.lines.map(l => Object.assign({}, l)); cust = Object.assign({}, c, { by: '', note: '' }); store.set('ft-cust', cust); saveLines(); refreshMarks(); closeSheet(); switchTab('cart'); const cv = stacks.cart[0]; cv && cv.refresh(); toast('Order copied into the cart. Change anything, then place it.'); };
        if (lines.length) { closeSheet(); setTimeout(() => confirmSheet('Replace the cart?', 'The cart already has ' + countWord(lines.length, 'item') + '. They will be replaced by this order.', 'Replace', load), 380); } else load();
      }
      else if (k === 'del') { closeSheet(); setTimeout(() => confirmSheet('Delete order ' + x.no + '?', 'It is only removed from this phone. The WhatsApp message stays.', 'Delete', () => { store.set('ft-orders', store.get('ft-orders', []).filter(z => z.id !== id)); const ov = stacks.orders[0]; if (ov) ov.refresh(); toast('Order deleted'); }), 380); }
    });
    openSheet(body);
  }

  /* catalogue status and updates, shown at the end of Home */
  function catalogueBox() {
    const ch = N && N.lastChange ? +N.lastChange() : 0, ck = N && N.lastCheck ? +N.lastCheck() : 0;
    return '<div class="kv"><div><span>Products</span><b>' + nfmt(P.length) + ' in ' + CATS.length + ' ranges</b></div><div><span>List</span><b>' + (ch ? 'Updated from the website ' + when(ch) : 'As packed in the app') + '</b></div><div><span>Last check</span><b>' + (ck ? when(ck) : 'Not yet') + '</b></div><div><span>Works offline</span><b>Yes, all products and photos</b></div></div>' +
      '<button class="btn btn--ghost btn--full" style="margin-top:12px" id="syncBtn">' + I.sync + 'Check for new products</button>';
  }

  /* ================= sheet ================= */
  function openSheet(body) {
    const s = $('#sheet');
    $('#toast').classList.remove('is-on');
    $('#sheetBody').innerHTML = ''; $('#sheetBody').appendChild(body); wirePhotos(body);
    s.hidden = false; $('.sheet__panel', s).scrollTop = 0;
    requestAnimationFrame(() => requestAnimationFrame(() => s.classList.add('is-open')));
  }
  function closeSheet() {
    const s = $('#sheet'); if (s.hidden) return;
    s.classList.remove('is-open');
    if (document.activeElement && s.contains(document.activeElement)) document.activeElement.blur();
    setTimeout(() => { if (!s.classList.contains('is-open')) s.hidden = true; }, 420);
  }
  $('#sheet').addEventListener('click', e => { if (e.target.closest('[data-close]')) closeSheet(); });
  // drag the sheet down to close it
  (() => {
    const p = $('.sheet__panel'); let y0 = null, dy = 0;
    p.addEventListener('touchstart', e => { if (p.scrollTop <= 0) { y0 = e.touches[0].clientY; dy = 0; } }, { passive: true });
    p.addEventListener('touchmove', e => { if (y0 === null) return; dy = Math.max(0, e.touches[0].clientY - y0); if (dy > 0) { p.style.transition = 'none'; p.style.transform = 'translateY(' + dy + 'px)'; } }, { passive: true });
    p.addEventListener('touchend', () => { if (y0 === null) return; p.style.transition = ''; p.style.transform = ''; if (dy > 110) closeSheet(); y0 = null; });
  })();
  function confirmSheet(title, text, act, fn) {
    const b = h('<div><h3>' + esc(title) + '</h3><p class="sub">' + esc(text) + '</p><div class="prow2"><button class="btn btn--ghost" data-close>Cancel</button><button class="btn btn--red" data-ok>' + esc(act) + '</button></div></div>');
    $('[data-ok]', b).onclick = () => { closeSheet(); fn(); };
    $('[data-close]', b).onclick = closeSheet;
    openSheet(b);
  }

  /* ================= zoom (pinch, drag, double-tap) ================= */
  let zs = 1, zx = 0, zy = 0;
  const zimg = $('#zoom img');
  function zoom(src) {
    const z = $('#zoom'); zimg.src = src; zs = 1; zx = 0; zy = 0; apply();
    z.hidden = false; $('.zoom__hint', z).style.opacity = 1;
    setTimeout(() => { $('.zoom__hint', z).style.opacity = 0; }, 2200);
    if (!reduce) z.animate([{ opacity: 0, transform: 'scale(.92)' }, { opacity: 1, transform: 'none' }], { duration: 320, easing: 'cubic-bezier(.16,1,.3,1)' });
  }
  function closeZoom() { const z = $('#zoom'); if (reduce) { z.hidden = true; return; } z.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 200 }).onfinish = () => { z.hidden = true; }; }
  function apply() { zimg.style.transformOrigin = 'center'; zimg.style.transform = 'translate(' + zx + 'px,' + zy + 'px) scale(' + zs + ')'; }
  (() => {
    const z = $('#zoom'); const pts = new Map(); let d0 = 0, s0 = 1, last = 0, px = 0, py = 0;
    z.addEventListener('click', e => { if (e.target.closest('[data-close]')) closeZoom(); });
    z.addEventListener('pointerdown', e => { if (e.target.closest('[data-close]')) return; z.setPointerCapture(e.pointerId); pts.set(e.pointerId, [e.clientX, e.clientY]);
      if (pts.size === 2) { const [a, b] = [...pts.values()]; d0 = Math.hypot(a[0] - b[0], a[1] - b[1]); s0 = zs; }
      if (pts.size === 1) { const now = Date.now(); if (now - last < 300) { zs = zs > 1.2 ? 1 : 2.6; if (zs === 1) { zx = 0; zy = 0; } zimg.style.transition = 'transform .35s cubic-bezier(.16,1,.3,1)'; apply(); setTimeout(() => zimg.style.transition = '', 360); } last = now; px = e.clientX; py = e.clientY; }
    });
    z.addEventListener('pointermove', e => { if (!pts.has(e.pointerId)) return; pts.set(e.pointerId, [e.clientX, e.clientY]);
      if (pts.size === 2) { const [a, b] = [...pts.values()]; zs = Math.max(1, Math.min(5, s0 * Math.hypot(a[0] - b[0], a[1] - b[1]) / d0)); apply(); }
      else if (pts.size === 1 && zs > 1) { zx += e.clientX - px; zy += e.clientY - py; px = e.clientX; py = e.clientY; apply(); }
    });
    const up = e => { pts.delete(e.pointerId); if (zs <= 1.02) { zs = 1; zx = 0; zy = 0; apply(); } };
    z.addEventListener('pointerup', up); z.addEventListener('pointercancel', up);
  })();

  /* ================= show the customer: full-screen swipe through a range ================= */
  function present(list, start, title) {
    if (!list.length) return;
    const p = $('#present');
    p.innerHTML = '<div class="pr__top"><span class="mono">' + esc(title) + ' · <b id="prN">1</b> / ' + list.length + '</span><button class="ib" data-close aria-label="Close">' + I.x + '</button></div><div class="pr__prog"><i></i></div>' +
      '<div class="pr__track">' + list.map(o => '<div class="pr__s">' + photo(o.img, o.name) + (o.img ? WM : '') + '<div class="pr__info"><small>' + esc(o.c.name) + '</small><b>' + esc(o.name) + '</b></div></div>').join('') + '</div>' +
      '<div class="pr__bot"><button class="btn btn--red" data-padd>' + I.plus + 'Add to cart</button><button class="btn btn--ghost" style="background:var(--ink)" data-pshare>' + I.share + 'Send</button></div>';
    $('#toast').classList.remove('is-on');
    p.hidden = false; document.body.classList.add('is-nobar', 'is-presenting'); p.classList.remove('is-clean');
    wirePhotos(p);
    const tr = $('.pr__track', p);
    let cur = start;
    const upd = () => { const i = Math.round(tr.scrollLeft / tr.clientWidth); { cur = Math.max(0, Math.min(list.length - 1, i)); $('#prN', p).textContent = cur + 1; $('.pr__prog i', p).style.transform = 'scaleX(' + ((cur + 1) / list.length) + ')'; } };
    requestAnimationFrame(() => { tr.scrollLeft = start * tr.clientWidth; upd(); });
    tr.addEventListener('scroll', () => requestAnimationFrame(upd), { passive: true });
    p.onclick = e => {
      if (e.target.closest('[data-close]')) return closePresent();
      if (e.target.closest('[data-padd]')) { quickAddFromPresent(list[cur]); return; }
      if (e.target.closest('[data-pshare]')) { const o = list[cur]; share(o.name, productText(o), o.img); return; }
      if (e.target.closest('.pr__s')) p.classList.toggle('is-clean');
    };
    if (!reduce) p.animate([{ opacity: 0, transform: 'scale(1.04)' }, { opacity: 1, transform: 'none' }], { duration: 420, easing: 'cubic-bezier(.16,1,.3,1)' });
  }
  function quickAddFromPresent(o) {
    if (!hasChoices(o)) { addLines(o, picker(o).read(), 1); updateBadge(true); buzz(); toast('Added: ' + o.name); return; }
    const pk = picker(o), q = qtyBox(1);
    const body = h('<div><div class="shead">' + photo(o.img, o.name) + '<div><span class="mono" style="color:var(--steel)">' + esc(o.c.name) + '</span><b>' + esc(o.name) + '</b></div></div><div id="spk"></div><div class="addrow"><div id="sq"></div><button class="btn btn--red" id="sadd">' + I.plus + 'Add to cart</button></div></div>');
    $('#spk', body).appendChild(pk.el); $('#sq', body).replaceWith(q.el);
    $('#sadd', body).onclick = () => { if (!pk.check()) return; addLines(o, pk.read(), q.get()); updateBadge(true); buzz(); closeSheet(); toast('Added: ' + o.name); };
    openSheet(body);
  }
  function closePresent() {
    const p = $('#present');
    document.body.classList.remove('is-nobar', 'is-presenting');
    const done = () => { p.hidden = true; p.innerHTML = ''; };
    if (reduce) return done();
    p.animate([{ opacity: 1, transform: 'none' }, { opacity: 0, transform: 'scale(.97)' }], { duration: 260, easing: 'ease-in' }).onfinish = done;
  }

  /* ================= online / updates ================= */
  let syncing = false;
  function refreshNet(sync) {
    if (sync !== undefined) syncing = sync;
    const n = $('#net'); if (!n) return;
    const on = N && N.online ? N.online() : navigator.onLine;
    n.className = 'net' + (syncing ? ' is-sync' : on ? ' is-on' : '');
    $('em', n).textContent = syncing ? 'Updating' : on ? 'Online' : 'Offline';
  }
  addEventListener('online', () => refreshNet()); addEventListener('offline', () => refreshNet());
  function reloadKeepingPlace() { try { sessionStorage.setItem('ft-reload', '1'); } catch (e) {} location.reload(); }
  let asked = false;
  const FT = window.FT = {
    back,
    pdfData: id => { const x = store.get('ft-orders', []).find(z => z.id === id); return x ? orderPdfData(x) : null; },   // used by the automated test
    onSync(r) {
      refreshNet(false);
      const cb = $('#catBox'); if (cb) cb.innerHTML = catalogueBox();
      if (r === 'updated' || r === 'updated-partial') toast('New products from the shop are ready', 'Refresh', reloadKeepingPlace, 12000);
      else if (r === 'same' && asked) toast('You already have the newest list');
      else if (r === 'offline') toast('No internet. The saved catalogue still works.');
      else if (r === 'failed' && asked) toast('Could not reach the website. Try again later.');
      asked = false;
    }
  };
  document.addEventListener('click', e => {
    const b = e.target.closest('#syncBtn'); if (!b) return;
    if (!N || !N.syncNow) { toast('Updates work in the phone app'); return; }
    asked = true; b.innerHTML = '<span class="spin"></span>Checking…'; refreshNet(true); N.syncNow();
  });
  // "Browse products" from the cart or the order form goes to Home > All ranges
  document.addEventListener('click', e => { if (e.target.closest('[data-browse]')) { if (!$('#sheet').hidden) closeSheet(); switchTab('home'); setTimeout(() => { if (!stacks.home.some(v => v.route === 'cats')) go('cats'); }, 520); } });
  // keyboard up (the page gets much shorter): hide the tab bar so the form has room
  let tallest = innerHeight, wide = innerWidth;
  addEventListener('resize', () => {
    if (innerWidth !== wide) { wide = innerWidth; tallest = innerHeight; }
    tallest = Math.max(tallest, innerHeight);
    document.body.classList.toggle('is-typing', innerHeight < tallest * .78);
  });

  /* ================= start ================= */
  updateBadge();
  let restore = null;
  try { if (sessionStorage.getItem('ft-reload')) { restore = JSON.parse(sessionStorage.getItem('ft-routes') || 'null'); sessionStorage.removeItem('ft-reload'); } } catch (e) {}
  if (restore && restore.st) {
    TABS.forEach(t => (restore.st[t] || []).forEach((r, i) => { tab = t; try { const v = build(r); stage.appendChild(v.el); stacks[t].push(v); show(v, false); } catch (e) {} }));
    tab = restore.tab && stacks[restore.tab].length ? restore.tab : 'home';
    if (!stacks.home.length) { const v = build('home'); stage.appendChild(v.el); stacks.home.push(v); show(v, false); }
    const t0 = tab; tab = ''; switchTab(t0);
    $('#splash').remove(); document.body.classList.remove('is-booting');
    toast('Catalogue updated: ' + nfmt(P.length) + ' products');
  } else {
    const hv = build('home'); stage.appendChild(hv.el); stacks.home.push(hv); show(hv, true);
    $('#tabInk').style.transform = 'translateX(0)';
    splash(() => hv.intro());
  }

  function splash(done) {
    const s = $('#splash');
    if (reduce) { s.remove(); document.body.classList.remove('is-booting'); done(); return; }
    const ease = 'cubic-bezier(.16,1,.3,1)';
    $('.sp__glow', s).animate([{ opacity: 0, transform: 'scale(.3)' }, { opacity: 1, transform: 'scale(1)' }], { duration: 1200, easing: ease, fill: 'forwards' });
    $('.sp__mark', s).animate([{ transform: 'none' }, { transform: 'translateY(-46px) scale(.82) rotate(0deg)' }], { duration: 900, delay: 120, easing: ease, fill: 'forwards' });
    $('.sp__line span', s).animate([{ transform: 'translateY(110%)' }, { transform: 'none' }], { duration: 800, delay: 380, easing: ease, fill: 'forwards' });
    $('.sp__sub span', s).animate([{ transform: 'translateY(120%)' }, { transform: 'none' }], { duration: 800, delay: 520, easing: ease, fill: 'forwards' });
    $('.sp__word', s).animate([{ transform: 'translateY(0)' }, { transform: 'translateY(-46px)' }], { duration: 900, delay: 120, easing: ease, fill: 'forwards' });
    $('.sp__bar i', s).animate([{ transform: 'scaleX(0)' }, { transform: 'scaleX(1)' }], { duration: 1100, delay: 200, easing: 'cubic-bezier(.65,0,.35,1)', fill: 'forwards' });
    setTimeout(() => {
      document.body.classList.remove('is-booting');
      done();
      s.animate([{ opacity: 1, clipPath: 'inset(0 0 0 0)' }, { opacity: 1, clipPath: 'inset(0 0 100% 0)' }], { duration: 750, easing: 'cubic-bezier(.76,0,.24,1)', fill: 'forwards' }).onfinish = () => s.remove();
    }, 1550);
  }
})();
