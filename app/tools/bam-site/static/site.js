/* Bait Al Maqdis website: light or dark, the moving arches, search, the product window and your list.
   The pages only know part numbers and sizes. There are no prices anywhere on this website. */
(() => {
  'use strict';
  const d = document, html = d.documentElement;
  const CFG = JSON.parse(d.getElementById('site-config').textContent);
  const T = CFG.t, AR = CFG.lang === 'ar', ROOT = CFG.root, HOME = CFG.home || './';
  const $ = (s, el) => (el || d).querySelector(s);
  const $$ = (s, el) => Array.prototype.slice.call((el || d).querySelectorAll(s));
  const ESC = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
  const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ESC[c]);
  const fill = (s, o) => String(s).replace(/\{(\w+)\}/g, (m, k) => (o[k] != null ? o[k] : m));
  const ico = (n, cls) => '<svg class="ico ico--' + n + (cls ? ' ' + cls : '') + '" viewBox="0 0 24 24" aria-hidden="true" focusable="false">' + CFG.icons[n] + '</svg>';
  const mq = q => !!(window.matchMedia && matchMedia(q).matches);
  const reduce = mq('(prefers-reduced-motion: reduce)');
  const finePointer = mq('(hover: hover) and (pointer: fine)');
  const smooth = () => (reduce ? 'auto' : 'smooth');
  const nm = n => (n && (AR ? n.ar || n.en : n.en)) || '';
  const altName = n => { const a = n && (AR ? n.en : n.ar); return a && a !== nm(n) ? a : ''; };
  const count = (n, one, many) => (n === 1 ? T[one] : fill(T[many], { n: n }));
  const get = k => { try { return JSON.parse(localStorage.getItem(k)); } catch (e) { return null; } };
  const put = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} };
  const focus = el => { if (el && el.focus && d.contains(el)) { try { el.focus({ preventScroll: true }); } catch (e) { el.focus(); } } };

  /* while a window is open the page behind it stays still */
  let locks = 0;
  const lock = on => { locks = Math.max(0, locks + (on ? 1 : -1)); html.classList.toggle('is-locked', locks > 0); };

  /* ---------- small message at the bottom ---------- */
  const toastEl = $('#toast');
  let toastTimer = 0;
  function toast(msg, label, fn) {
    toastEl.innerHTML = '<span>' + esc(msg) + '</span>' + (label ? '<button type="button">' + esc(label) + '</button>' : '');
    if (label) toastEl.querySelector('button').onclick = () => { hideToast(); fn(); };
    toastEl.classList.add('on');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(hideToast, label ? 5200 : 2600);
  }
  function hideToast() { toastEl.classList.remove('on'); }

  /* ---------- light or dark ---------- */
  function setTheme(dark) {
    html.setAttribute('data-theme', dark ? 'dark' : 'light');
    const m = $('#themeColor');
    if (m) m.content = dark ? '#1c1812' : '#f3ede1';
    try { localStorage.setItem('bam-site-theme', dark ? 'dark' : 'light'); } catch (e) {}
  }

  /* ---------- top bar: solid once you scroll, out of the way while you read down ---------- */
  const bar = $('#bar');
  let lastY = window.scrollY, holdBar = 0, spy = null, ticking = false;
  function showBar() { bar.classList.remove('is-hidden'); html.style.removeProperty('--stick'); syncFab(); }
  function hideBar() { bar.classList.add('is-hidden'); html.style.setProperty('--stick', '0px'); syncFab(); }
  function onScroll() {
    ticking = false;
    const y = Math.max(0, window.scrollY), delta = y - lastY;
    bar.classList.toggle('is-stuck', y > 6);
    if (y < 220 || locks) { showBar(); lastY = y; }
    else if (Date.now() < holdBar) lastY = y;
    else if (Math.abs(delta) > 6) {
      if (delta > 0) hideBar(); else showBar();
      lastY = y;
    }
    if (spy) spy();
  }
  addEventListener('scroll', () => { if (!ticking) { ticking = true; requestAnimationFrame(onScroll); } }, { passive: true });

  /* ---------- menu on small screens ---------- */
  const menu = $('#menu'), menuBtn = $('[data-menu]');
  function setMenu(open) {
    if (!menu || open === !menu.hidden) return;
    menu.hidden = !open;
    menuBtn.setAttribute('aria-expanded', String(open));
    lock(open);
    if (open) showBar();
  }
  if (menuBtn) menuBtn.addEventListener('click', () => setMenu(menu.hidden));
  if (menu) menu.addEventListener('click', e => { if (e.target.closest('a')) setMenu(false); });

  /* English or Arabic: the other language opens on the same product or group */
  $$('[data-lang-link]').forEach(a => a.addEventListener('click', () => {
    const base = a.getAttribute('href').split('#')[0];
    if (location.hash) a.setAttribute('href', base + location.hash);
  }));
  $$('[data-top]').forEach(a => a.addEventListener('click', e => { e.preventDefault(); window.scrollTo({ top: 0, behavior: smooth() }); }));

  /* ---------- things that rise into view, numbers that count up ---------- */
  const reveals = $$('.reveal'), counters = $$('[data-count]');
  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver(es => es.forEach(en => {
      if (en.isIntersecting) { en.target.classList.add('is-in'); io.unobserve(en.target); }
    }), { rootMargin: '0px 0px -6% 0px', threshold: 0.06 });
    reveals.forEach(el => io.observe(el));
    const co = new IntersectionObserver(es => es.forEach(en => {
      if (en.isIntersecting) { countUp(en.target); co.unobserve(en.target); }
    }), { threshold: 0.5 });
    counters.forEach(el => co.observe(el));
  } else reveals.forEach(el => el.classList.add('is-in'));
  function countUp(el) {
    const end = +el.getAttribute('data-count');
    if (!end || reduce) return;
    const t0 = performance.now(), dur = 1600;
    const step = now => {
      const p = Math.min(1, (now - t0) / dur), e = 1 - Math.pow(1 - p, 4);
      el.textContent = Math.round(end * e).toLocaleString('en-US');
      if (p < 1) requestAnimationFrame(step);
    };
    el.textContent = '0';
    requestAnimationFrame(step);
  }

  /* ---------- the arcade: each arch shows their products in turn ---------- */
  const arcade = $('#arcade');
  if (arcade && !reduce) {
    let visible = true;
    if ('IntersectionObserver' in window) new IntersectionObserver(es => { visible = es[0].isIntersecting; }).observe(arcade);
    $$('.arch', arcade).forEach((a, i) => {
      let photos;
      try { photos = JSON.parse(a.getAttribute('data-photos')); } catch (e) { return; }
      if (!photos || photos.length < 2) return;
      const imgs = a.querySelectorAll('img');
      let k = 0, cur = 0;
      const next = () => {
        if (!visible || d.hidden) { setTimeout(next, 1500); return; }
        k = (k + 1) % photos.length;
        const nx = imgs[1 - cur], url = ROOT + photos[k];
        nx.onload = () => { nx.onload = null; nx.classList.add('on'); imgs[cur].classList.remove('on'); cur = 1 - cur; setTimeout(next, 4600); };
        nx.onerror = () => { nx.onerror = null; setTimeout(next, 4600); };
        if (nx.getAttribute('src') === url && nx.complete) nx.onload(); else nx.src = url;
      };
      setTimeout(next, 3400 + i * 950);
    });
  }

  /* ---------- the index: a little arch follows the pointer with the group's photo ---------- */
  const peek = $('#peek');
  if (peek && finePointer) {
    const pimg = peek.querySelector('img');
    let px = 0, py = 0, raf = 0;
    const place = () => { raf = 0; peek.style.left = px + 'px'; peek.style.top = py + 'px'; };
    $$('[data-peek]').forEach(a => {
      a.addEventListener('mouseenter', e => { pimg.src = a.getAttribute('data-peek'); px = e.clientX; py = e.clientY; place(); peek.classList.add('on'); });
      a.addEventListener('mousemove', e => { px = e.clientX; py = e.clientY; if (!raf) raf = requestAnimationFrame(place); });
      a.addEventListener('mouseleave', () => peek.classList.remove('on'));
    });
    addEventListener('scroll', () => peek.classList.remove('on'), { passive: true });
  }

  /* ---------- your list: kept in this browser only ---------- */
  const LIST = 'bam-site-list', CUST = 'bam-site-cust';
  const clean = v => (Array.isArray(v) ? v.filter(l => l && l.id && l.s && l.r && l.n) : []).map(l => {
    l.q = Math.max(1, Math.min(99999, parseInt(l.q, 10) || 1));
    return l;
  });
  let list = clean(get(LIST));
  const lineId = (r, s, i) => r + '/' + s + '#' + i;
  const findLine = id => { for (let i = 0; i < list.length; i++) if (list[i].id === id) return list[i]; return null; };
  const pcs = () => list.reduce((a, l) => a + l.q, 0);
  const lineHref = l => HOME + 'range/' + l.r + '/#p=' + l.s;
  const lineSize = l => (AR ? l.szAr || l.sz : l.sz) || '';
  const lineName = l => nm(l.n) + (AR && l.n.en && l.n.en !== nm(l.n) ? ' (' + l.n.en + ')' : '');
  function saveList(redraw) {
    put(LIST, list);
    syncCounts();
    if (redraw && drawerOpen()) renderDrawer();
  }
  function addLine(r, s, p, i, q) {
    const z = p.z[i], id = lineId(r, s, i);
    let l = findLine(id);
    if (l) l.q = q;
    else list.push({ id: id, r: r, s: s, n: p.n, i: p.i || '', pn: z[0] || '', sz: z[1] || '', szAr: z[2] || '', q: q });
    saveList();
    bump();
  }
  function removeLine(id) { list = list.filter(l => l.id !== id); saveList(); }
  function setQty(id, q) { const l = findLine(id); if (l) { l.q = q; saveList(); updateDrawerMeta(); } }
  /* the round list button shows while the top bar, with its own list button, is out of view */
  function syncFab() {
    const fab = $('.fab');
    if (fab) fab.classList.toggle('is-on', list.length > 0 && !drawerOpen() && bar.classList.contains('is-hidden'));
  }
  function bump() {
    $$('[data-list-count]').forEach(b => {
      const el = b.classList.contains('badge') ? b : b.parentNode;
      el.classList.remove('bump'); void el.offsetWidth; el.classList.add('bump');
    });
  }
  function syncCounts() {
    const n = list.length;
    $$('[data-list-count]').forEach(b => { b.textContent = n; if (b.classList.contains('badge')) b.hidden = !n; });
    syncFab();
    if (RD) {
      const inl = {};
      list.forEach(l => { if (l.r === RD.id) inl[l.s] = 1; });
      $$('.card[data-p]').forEach(c => c.classList.toggle('in-list', !!inl[c.getAttribute('data-p')]));
    }
    if (sheetSlug) syncSheetRows();
  }
  const stepper = q => '<span class="stepper"><button type="button" data-step="-1" aria-label="−1">−</button>' +
    '<input type="text" inputmode="numeric" pattern="[0-9]*" maxlength="5" value="' + q + '" aria-label="' + esc(T.qty) + '">' +
    '<button type="button" data-step="1" aria-label="+1">+</button></span>';
  const readQty = input => Math.max(1, Math.min(99999, parseInt(String(input.value).replace(/[^\d]/g, ''), 10) || 1));
  function step(btn) {
    const input = btn.parentNode.querySelector('input');
    const q = Math.max(1, Math.min(99999, readQty(input) + (+btn.getAttribute('data-step'))));
    input.value = q;
    return input;
  }

  /* ---------- the list drawer ---------- */
  const drawer = $('#drawer'), dBody = $('#drawerBody'), dMeta = $('#drawerMeta');
  let drawerLast = null;
  function drawerOpen() { return !!drawer && !drawer.hidden && drawer.classList.contains('is-open'); }
  function updateDrawerMeta() {
    dMeta.textContent = list.length ? count(list.length, 'one_line', 'n_lines') + ' · ' + fill(T.n_pcs, { n: pcs() }) : '';
    drawer.classList.toggle('is-empty', !list.length);
  }
  function renderDrawer() {
    updateDrawerMeta();
    if (!list.length) {
      dBody.innerHTML = '<div class="drawer__empty"><div class="empty__arch">' + ico('list') + '</div><h3>' + esc(T.list_empty) + '</h3><p>' +
        esc(T.list_empty_sub) + '</p><a class="btn btn--primary" href="' + esc(HOME) + '#ranges">' + esc(T.browse) + ico('arrow') + '</a></div>';
      return;
    }
    dBody.innerHTML = list.map((l, i) => {
      const href = esc(lineHref(l)), sz = lineSize(l);
      return '<div class="line" data-id="' + esc(l.id) + '" style="animation-delay:' + Math.min(i, 10) * 0.035 + 's">' +
        '<a class="line__win" href="' + href + '" tabindex="-1" aria-hidden="true">' + (l.i ? '<img src="' + esc(ROOT + l.i) + '" alt="" loading="lazy">' : '') + '</a>' +
        '<div><a class="line__n" href="' + href + '"><bdi>' + esc(nm(l.n)) + '</bdi></a><span class="line__s">' +
        (sz ? '<bdi>' + esc(sz) + '</bdi>' : '') + (sz && l.pn ? ' · ' : '') + (l.pn ? '<span class="line__pn" dir="ltr">' + esc(l.pn) + '</span>' : '') + '</span></div>' +
        '<div class="line__ctl">' + stepper(l.q) + '<button class="line__x" type="button" data-remove>' + esc(T.remove) + '</button></div></div>';
    }).join('');
  }
  function openDrawer() {
    if (!drawer || drawerOpen()) return;
    hideToast();
    drawerLast = d.activeElement;
    renderDrawer();
    $('#drawerWarn').hidden = true;
    drawer.hidden = false;
    void drawer.offsetWidth;
    drawer.classList.add('is-open');
    lock(true);
    syncCounts();
    setTimeout(() => focus($('.drawer__head .iconbtn', drawer)), 80);
  }
  function closeDrawer() {
    if (!drawerOpen()) return;
    drawer.classList.remove('is-open');
    lock(false);
    setTimeout(() => { if (!drawer.classList.contains('is-open')) drawer.hidden = true; }, 560);
    syncCounts();
    focus(drawerLast);
  }
  if (drawer) {
    dBody.addEventListener('click', e => {
      const t = e.target;
      if (t.closest('a')) { closeDrawer(); return; }
      const row = t.closest('.line');
      if (!row) return;
      const id = row.getAttribute('data-id');
      const st = t.closest('[data-step]');
      if (st) { setQty(id, readQty(step(st))); return; }
      if (t.closest('[data-remove]')) {
        const at = list.findIndex(l => l.id === id), was = list[at];
        removeLine(id);
        row.classList.add('is-out');
        setTimeout(() => { row.remove(); if (!list.length) renderDrawer(); else updateDrawerMeta(); }, 260);
        toast(T.removed, T.undo, () => {
          if (findLine(id)) return;
          list.splice(Math.min(at, list.length), 0, was);
          saveList(true);
        });
      }
    });
    dBody.addEventListener('change', e => {
      const input = e.target.closest('.stepper input'), row = e.target.closest('.line');
      if (input && row) { input.value = readQty(input); setQty(row.getAttribute('data-id'), +input.value); }
    });
    const cust = get(CUST) || {};
    $$('[data-cust]').forEach(f => {
      const k = f.getAttribute('data-cust');
      if (cust[k]) f.value = cust[k];
      f.addEventListener('input', () => { cust[k] = f.value; put(CUST, cust); });
    });
  }
  function custNow() {
    const c = {};
    $$('[data-cust]').forEach(f => { c[f.getAttribute('data-cust')] = f.value.trim(); });
    return c;
  }

  /* the list as words, for email, WhatsApp and copying */
  function listText() {
    const out = [T.mail_hello, '', T.mail_ask, ''];
    list.forEach((l, i) => {
      const bits = [lineName(l)];
      if (l.sz) bits.push(T.size + ': ' + l.sz);
      if (l.pn) bits.push(T.part + ': ' + l.pn);
      bits.push(T.qty + ': ' + l.q);
      out.push((i + 1) + '. ' + bits.join(' — '));
    });
    const c = custNow(), who = [];
    if (c.name) who.push(T.f_name + ': ' + c.name);
    if (c.company) who.push(T.f_company + ': ' + c.company);
    if (c.phone) who.push(T.f_phone + ': ' + c.phone);
    if (c.note) who.push(T.f_note + ': ' + c.note);
    if (who.length) out.push('', ...who);
    out.push('', T.mail_thanks);
    return out.join('\n');
  }
  function send(kind) {
    if (kind === 'clear') {
      if (!list.length) return;
      const before = list.slice();
      list = [];
      saveList(true);
      toast(T.cleared, T.undo, () => { list = before; saveList(true); });
      return;
    }
    if (!list.length) return;
    const text = listText();
    if (kind === 'email') {
      const subj = fill(T.mail_subject, { n: count(list.length, 'one_line', 'n_lines') });
      const url = 'mailto:' + CFG.contact.email + '?subject=' + encodeURIComponent(subj) + '&body=' + encodeURIComponent(text);
      $('#drawerWarn').hidden = url.length < 1900;
      location.href = url;
    } else if (kind === 'wa' && CFG.contact.whatsapp) {
      window.open('https://wa.me/' + CFG.contact.whatsapp + '?text=' + encodeURIComponent(text), '_blank', 'noopener');
    } else if (kind === 'copy') copyText(text, T.copied);
    else if (kind === 'print') printList();
  }
  function copyText(text, msg) {
    const legacy = () => {
      const ta = d.createElement('textarea');
      ta.value = text; ta.setAttribute('readonly', ''); ta.style.cssText = 'position:fixed;top:0;left:0;opacity:0';
      (topModal() || d.body).appendChild(ta);
      ta.select();
      let ok = false;
      try { ok = d.execCommand('copy'); } catch (e) {}
      ta.remove();
      if (ok) toast(msg);
    };
    if (navigator.clipboard && window.isSecureContext) navigator.clipboard.writeText(text).then(() => toast(msg), legacy);
    else legacy();
  }
  function printList() {
    const po = $('#printout'), c = custNow(), now = new Date();
    const two = n => (n < 10 ? '0' : '') + n;
    const date = two(now.getDate()) + '/' + two(now.getMonth() + 1) + '/' + now.getFullYear();
    const from = [c.name, c.company, c.phone].filter(Boolean).join(' · ');
    po.innerHTML = '<div class="po" dir="' + (AR ? 'rtl' : 'ltr') + '" lang="' + CFG.lang + '">' +
      '<div class="po__head"><div class="po__brand"><img src="' + esc(ROOT) + 'assets/logo.png" alt=""><div><b>' + esc(T.brand) + '</b><small>' + esc(T.legal) + '</small></div></div>' +
      '<div class="po__contact">' + esc(T.address1) + '<br>' + esc(T.address2) + '<br><span dir="ltr">' + esc(CFG.contact.phone) + '</span><br>' + esc(CFG.contact.email) + '</div></div>' +
      '<h1 class="po__title">' + esc(T.print_title) + '</h1>' +
      '<div class="po__meta"><span>' + esc(T.print_date) + ': ' + date + '</span>' + (from ? '<span>' + esc(T.print_from) + ': ' + esc(from) + '</span>' : '') +
      '<span>' + esc(count(list.length, 'one_line', 'n_lines')) + ' · ' + esc(fill(T.n_pcs, { n: pcs() })) + '</span></div>' +
      '<table><thead><tr><th>#</th><th>' + esc(T.print_product) + '</th><th>' + esc(T.size) + '</th><th>' + esc(T.part) + '</th><th>' + esc(T.qty) + '</th></tr></thead><tbody>' +
      list.map((l, i) => '<tr><td>' + (i + 1) + '</td><td>' + esc(nm(l.n)) + (AR && l.n.en && l.n.en !== nm(l.n) ? '<br><small>' + esc(l.n.en) + '</small>' : '') + '</td>' +
        '<td><bdi>' + esc(lineSize(l)) + '</bdi></td><td><bdi>' + esc(l.pn) + '</bdi></td><td class="q">' + l.q + '</td></tr>').join('') +
      '</tbody></table>' + (c.note ? '<p class="po__note"><b>' + esc(T.f_note) + ':</b> ' + esc(c.note) + '</p>' : '') +
      '<p class="po__foot">' + esc(T.print_foot) + '</p></div>';
    const img = po.querySelector('img');
    let done = false;
    const go = () => { if (!done) { done = true; window.print(); } };
    if (img.complete) go(); else { img.onload = img.onerror = go; setTimeout(go, 1500); }
  }

  /* ---------- a range page ---------- */
  const rdEl = $('#range-data');
  const RD = rdEl ? JSON.parse(rdEl.textContent) : null;
  const rfind = $('#rfind');
  let filterOn = false, shown = {};

  /* searching: lower case, one kind of alef, ya and ta marbuta, no tashkeel, inches as " and part numbers without dashes */
  function norm(s) {
    return String(s || '').toLowerCase()
      .replace(/[ً-ٰٟـ]/g, '')
      .replace(/[أإآٱ]/g, 'ا').replace(/ة/g, 'ه').replace(/ى/g, 'ي').replace(/ؤ/g, 'و').replace(/ئ/g, 'ي')
      .replace(/[٠-٩]/g, c => String(c.charCodeAt(0) - 0x660)).replace(/[۰-۹]/g, c => String(c.charCodeAt(0) - 0x6F0))
      .replace(/[“”″〃]/g, '"').replace(/[‘’′`]/g, "'").replace(/×/g, 'x')
      .replace(/(\d)\s*(?:inches|inch|in\.|انش|بوصه)/g, '$1"')
      .replace(/\s+/g, ' ').trim();
  }
  const ALNUM = /[^a-z0-9ء-ي]/g;
  const compact = s => norm(s).replace(ALNUM, '');
  const tokens = q => norm(q).split(' ').filter(Boolean);
  const isWordStart = (h, at) => at === 0 || !/[a-z0-9ء-ي]/.test(h.charAt(at - 1));
  /* how well one product matches every word typed: 0 = not at all */
  function score(p, toks) {
    let sc = 0;
    for (let i = 0; i < toks.length; i++) {
      const t = toks[i], ct = /\d/.test(t) ? t.replace(ALNUM, '') : '';
      let s = 0;
      const at = p.hn.indexOf(t);
      if (at === 0) s = 30; else if (at > 0) s = isWordStart(p.hn, at) ? 22 : 12;
      if (ct.length >= 3) {
        if ((' ' + p.hc + ' ').indexOf(' ' + ct + ' ') >= 0) s = Math.max(s, 70);
        else if (p.hc.indexOf(ct) >= 0) s = Math.max(s, 36);
      }
      if (!s && p.hz.indexOf(t) >= 0) s = 10;
      if (!s && p.hg.indexOf(t) >= 0) s = 5;
      if (!s) return 0;
      sc += s;
    }
    return sc;
  }
  function prepProduct(p, groupNames) {
    p.hn = norm(p.n.en + ' ' + (p.n.ar || ''));
    p.hc = p.z.map(z => compact(z[0])).filter(Boolean).join(' ');
    p.hz = norm(p.z.map(z => (z[1] || '') + ' ' + (z[2] || '')).join(' '));
    p.hg = norm(groupNames);
    return p;
  }

  if (RD) {
    RD.order.forEach(s => { const p = RD.items[s]; const g = RD.groups[p.g] || { n: {} }; prepProduct(p, (g.n.en || '') + ' ' + (g.n.ar || '')); });
    const products = $('#products'), rbar = $('#rbar'), chipsEl = $('#chips'), grps = $$('.grp');
    const applyFilter = q => {
      const toks = tokens(q);
      filterOn = toks.length > 0;
      shown = {};
      let n = 0;
      $$('.card[data-p]').forEach(c => {
        const s = c.getAttribute('data-p'), ok = !filterOn || score(RD.items[s], toks) > 0;
        c.classList.toggle('is-off', !ok);
        if (ok) { shown[s] = 1; n++; }
      });
      grps.forEach(g => {
        const any = !!g.querySelector('.card:not(.is-off)');
        g.classList.toggle('is-off', !any);
        const chip = $('.chip[data-g="' + g.getAttribute('data-g') + '"]', chipsEl);
        if (chip) chip.classList.toggle('is-empty', !any);
      });
      $('#rcount').textContent = filterOn ? fill(T.shown, { n: n }) : '';
      const none = $('#rnone');
      none.hidden = n > 0;
      if (!n) none.querySelector('p').textContent = fill(T.none_here, { name: nm(RD.name), q: q.trim() });
      /* bring the first match up under the bar if the reader is further down */
      const stick = bar.classList.contains('is-hidden') ? 0 : bar.offsetHeight;
      const top = products.getBoundingClientRect().top + window.scrollY - rbar.offsetHeight - stick;
      if (window.scrollY > top + 2) window.scrollTo(0, top);
      if (spy) spy();
    };
    if (rfind) {
      rfind.addEventListener('input', () => applyFilter(rfind.value));
      rfind.addEventListener('keydown', e => {
        if (e.key === 'Enter') { e.preventDefault(); rfind.blur(); }
        if (e.key === 'Escape' && rfind.value) { e.stopPropagation(); rfind.value = ''; applyFilter(''); }
      });
      if (rfind.value) applyFilter(rfind.value);
    }
    /* the group you are looking at lights up in the row of groups */
    let curG = null;
    const centerChip = chip => {
      const cr = chip.getBoundingClientRect(), br = chipsEl.getBoundingClientRect();
      const delta = (cr.left + cr.width / 2) - (br.left + br.width / 2);
      if (Math.abs(delta) > 4) chipsEl.scrollBy({ left: delta, behavior: smooth() });
    };
    spy = () => {
      const line = rbar.getBoundingClientRect().bottom + 110;
      let cur = '';
      for (let i = 0; i < grps.length; i++) {
        const g = grps[i];
        if (g.classList.contains('is-off')) continue;
        if (g.getBoundingClientRect().top <= line) cur = g.getAttribute('data-g'); else break;
      }
      if (cur === curG) return;
      curG = cur;
      $$('.chip.is-on', chipsEl).forEach(c => c.classList.remove('is-on'));
      const chip = cur && $('.chip[data-g="' + cur + '"]', chipsEl);
      if (chip) { chip.classList.add('is-on'); centerChip(chip); }
    };
    chipsEl.addEventListener('click', e => {
      const c = e.target.closest('.chip');
      if (!c) return;
      e.preventDefault();
      goGroup(c.getAttribute('data-g'));
    });
  }
  function goGroup(s) {
    let g = d.getElementById('g-' + s);
    if (!g) return;
    if (g.classList.contains('is-off') && rfind) { rfind.value = ''; rfind.dispatchEvent(new Event('input')); }
    holdBar = Date.now() + 2500;
    showBar();
    g.scrollIntoView({ behavior: smooth(), block: 'start' });
    history.replaceState(null, '', '#g-' + s);
  }

  /* ---------- the product window ---------- */
  const sheet = $('#sheet');
  let sheetSlug = '', sheetPushed = false, sheetLast = null, afterClose = null, backPending = false;
  const sheetOrder = () => {
    const vis = filterOn ? RD.order.filter(s => shown[s]) : RD.order;
    return vis.indexOf(sheetSlug) >= 0 ? vis : RD.order;
  };
  function renderSheet(slug) {
    const p = RD.items[slug], g = RD.groups[p.g] || { s: '', n: { en: '', ar: '' } };
    sheetSlug = slug;
    const order = sheetOrder(), at = order.indexOf(slug);
    const prev = at > 0 ? order[at - 1] : '', next = at >= 0 && at < order.length - 1 ? order[at + 1] : '';
    const alt = altName(p.n), name = nm(p.n);
    const rows = p.z.map((z, i) => {
      const l = findLine(lineId(RD.id, slug, i)), size = AR ? z[2] || z[1] : z[1];
      return '<tr data-row="' + i + '"' + (l ? ' class="is-in"' : '') + '>' +
        '<td class="sz">' + (size ? '<bdi>' + esc(size) + '</bdi>' : '<span aria-hidden="true">—</span>') + (z[0] ? '<small dir="ltr">' + esc(z[0]) + '</small>' : '') + '</td>' +
        '<td class="pn" dir="ltr">' + esc(z[0] || '—') + '</td>' +
        '<td class="ctl">' + stepper(l ? l.q : 1) + '<button class="addrow" type="button" data-add title="' + esc(l ? T.remove : T.add_to_list) + '">' + ico('plus') + ico('check') +
        '<span>' + esc(l ? T.added : T.add) + '</span></button></td></tr>';
    }).join('');
    const more = g.s ? RD.order.filter(s => s !== slug && RD.items[s].g === p.g).slice(0, 16) : [];
    const subj = fill(T.mail_subject, { n: name });
    const body = [T.mail_hello, '', T.mail_ask, '', name + (AR && p.n.en && p.n.en !== name ? ' (' + p.n.en + ')' : '')]
      .concat(p.z.slice(0, 40).map(z => '- ' + [z[1], z[0]].filter(Boolean).join(' — '))).concat(['', T.mail_thanks]).join('\n');
    sheet.innerHTML =
      '<div class="sheet__scrim" data-close-sheet></div>' +
      '<article class="sheet__box" role="dialog" aria-modal="true" aria-labelledby="sheetName" tabindex="-1">' +
        '<div class="sheet__grab" aria-hidden="true"></div>' +
        '<div class="sheet__nav">' +
          '<button class="iconbtn" type="button" data-go="' + esc(prev) + '"' + (prev ? '' : ' disabled') + ' aria-label="' + esc(T.prev) + '">' + ico('arrow', 'ico--back') + '</button>' +
          '<button class="iconbtn" type="button" data-go="' + esc(next) + '"' + (next ? '' : ' disabled') + ' aria-label="' + esc(T.next) + '">' + ico('arrow') + '</button>' +
          '<button class="iconbtn" type="button" data-close-sheet aria-label="' + esc(T.close) + '">' + ico('x') + '</button>' +
        '</div>' +
        '<div class="sheet__media">' +
          (p.i ? '<button class="sheet__plate" type="button" data-zoom="' + esc(ROOT + p.i) + '" aria-label="' + esc(T.zoom) + '"><img src="' + esc(ROOT + p.i) + '" alt="' + esc(name) + '" width="' + p.w + '" height="' + p.h + '"></button>'
               : '<div class="sheet__plate"><span class="card__nophoto">' + ico('dome') + '<small>' + esc(T.no_photo) + '</small></span></div>') +
          (p.sp && p.sp.length ? '<div class="sheet__specs"><h3>' + esc(T.specs) + '</h3>' + p.sp.map(s => '<button type="button" data-zoom="' + esc(ROOT + s) + '" aria-label="' + esc(T.specs) + '"><img src="' + esc(ROOT + s) + '" alt="" loading="lazy"></button>').join('') + '</div>' : '') +
        '</div>' +
        '<div class="sheet__info">' +
          '<nav class="sheet__where"><a href="#" data-to-top>' + esc(nm(RD.name)) + '</a>' + (g.s ? '<span aria-hidden="true">/</span><a href="#g-' + esc(g.s) + '" data-to-group="' + esc(g.s) + '">' + esc(nm(g.n)) + '</a>' : '') + '</nav>' +
          '<h2 class="sheet__name" id="sheetName"><bdi>' + esc(name) + '</bdi></h2>' +
          (alt ? '<p class="sheet__alt" lang="' + (AR ? 'en' : 'ar') + '"><bdi>' + esc(alt) + '</bdi></p>' : '') +
          '<p class="sheet__count">' + esc(count(p.z.length, 'one_size', 'n_sizes')) + '</p>' +
          '<table class="sizes"><thead><tr><th>' + esc(T.size) + '</th><th>' + esc(T.part) + '</th><th class="ctl">' + esc(T.qty) + '</th></tr></thead><tbody>' + rows + '</tbody></table>' +
          '<p class="sheet__note">' + ico('info') + '<span>' + esc(T.price_note) + '</span></p>' +
          '<div class="sheet__acts">' +
            '<a class="btn btn--primary" href="mailto:' + esc(CFG.contact.email) + '?subject=' + esc(encodeURIComponent(subj)) + '&amp;body=' + esc(encodeURIComponent(body)) + '">' + ico('mail') + esc(T.ask) + '</a>' +
            '<button class="btn btn--ghost" type="button" data-copy-link>' + ico('copy') + esc(T.copy_link) + '</button>' +
            (navigator.share ? '<button class="btn btn--ghost" type="button" data-share>' + esc(T.share) + '</button>' : '') +
          '</div>' +
        '</div>' +
        (more.length ? '<div class="sheet__more"><h3>' + esc(fill(T.more_in, { g: nm(g.n) })) + '</h3><div class="more">' + more.map(s => {
          const m = RD.items[s];
          return '<a href="#p=' + esc(s) + '"><span class="more__win">' + (m.i ? '<img src="' + esc(ROOT + m.i) + '" alt="" loading="lazy">' : '') + '</span><span><bdi>' + esc(nm(m.n)) + '</bdi></span></a>';
        }).join('') + '</div></div>' : '') +
      '</article>';
  }
  function syncSheetRows() {
    $$('.sizes tr[data-row]', sheet).forEach(tr => {
      const l = findLine(lineId(RD.id, sheetSlug, +tr.getAttribute('data-row'))), btn = tr.querySelector('[data-add]'), input = tr.querySelector('input');
      tr.classList.toggle('is-in', !!l);
      btn.querySelector('span').textContent = l ? T.added : T.add;
      btn.title = l ? T.remove : T.add_to_list;
      if (l && d.activeElement !== input) input.value = l.q;
    });
  }
  function openSheet(slug, pushed) {
    if (!RD || !sheet || !RD.items[slug]) return;
    const was = !!sheetSlug;
    if (!was) sheetLast = d.activeElement;
    renderSheet(slug);
    const box = $('.sheet__box', sheet);
    if (was) box.classList.add('is-swap');
    else {
      sheet.classList.remove('is-closing');
      sheet.hidden = false;
      lock(true);
      sheetPushed = !!pushed;
    }
    focus(box);
  }
  function runAfter() {
    const f = afterClose;
    afterClose = null;
    if (f) f(); else focus(sheetLast);
  }
  function closeSheet(fromHash) {
    if (!sheetSlug) return;
    sheetSlug = '';
    sheet.classList.add('is-closing');
    lock(false);
    setTimeout(() => { if (!sheetSlug) { sheet.hidden = true; sheet.innerHTML = ''; sheet.classList.remove('is-closing'); } }, 300);
    if (fromHash) runAfter();
    else if (sheetPushed) { backPending = true; history.back(); }
    else { history.replaceState(null, '', location.pathname + location.search); runAfter(); }
    sheetPushed = false;
  }
  function swapTo(s) { if (s && RD.items[s]) { history.replaceState(null, '', '#p=' + s); openSheet(s); } }
  function toggleRow(tr) {
    const p = RD.items[sheetSlug], i = +tr.getAttribute('data-row'), id = lineId(RD.id, sheetSlug, i), s = sheetSlug;
    if (findLine(id)) {
      const was = findLine(id);
      removeLine(id);
      toast(T.removed, T.undo, () => { if (!findLine(id)) { list.push(was); saveList(true); } });
    } else {
      addLine(RD.id, s, p, i, readQty(tr.querySelector('input')));
      toast(T.added_toast, T.open_list, openDrawer);
    }
  }
  if (sheet && RD) {
    sheet.addEventListener('click', e => {
      const t = e.target;
      if (t.closest('[data-close-sheet]')) { closeSheet(); return; }
      const go = t.closest('[data-go]');
      if (go) { swapTo(go.getAttribute('data-go')); return; }
      const more = t.closest('a[href^="#p="]');
      if (more) { e.preventDefault(); swapTo(more.getAttribute('href').slice(3)); return; }
      const tg = t.closest('[data-to-group]');
      if (tg) { e.preventDefault(); const s = tg.getAttribute('data-to-group'); afterClose = () => goGroup(s); closeSheet(); return; }
      if (t.closest('[data-to-top]')) { e.preventDefault(); afterClose = () => window.scrollTo({ top: 0, behavior: smooth() }); closeSheet(); return; }
      const z = t.closest('[data-zoom]');
      if (z) { openLightbox(z.getAttribute('data-zoom')); return; }
      const st = t.closest('[data-step]');
      if (st) {
        const input = step(st), tr = st.closest('tr'), id = lineId(RD.id, sheetSlug, +tr.getAttribute('data-row'));
        if (findLine(id)) setQty(id, +input.value);
        return;
      }
      const add = t.closest('[data-add]');
      if (add) { toggleRow(add.closest('tr')); return; }
      if (t.closest('[data-copy-link]')) { copyText(location.href, T.link_copied); return; }
      if (t.closest('[data-share]')) { navigator.share({ title: nm(RD.items[sheetSlug].n), url: location.href }).catch(() => {}); }
    });
    sheet.addEventListener('change', e => {
      const input = e.target.closest('.stepper input'), tr = e.target.closest('tr[data-row]');
      if (!input || !tr) return;
      input.value = readQty(input);
      const id = lineId(RD.id, sheetSlug, +tr.getAttribute('data-row'));
      if (findLine(id)) setQty(id, +input.value);
    });
    sheet.addEventListener('keydown', e => {
      if (e.key === 'Enter' && e.target.matches('.stepper input')) { e.preventDefault(); e.target.blur(); }
    });
    /* on a computer the photo magnifies under the pointer */
    if (finePointer) {
      sheet.addEventListener('mousemove', e => {
        const pl = e.target.closest('.sheet__plate[data-zoom]');
        if (!pl) return;
        const r = pl.getBoundingClientRect(), img = pl.querySelector('img');
        img.style.transformOrigin = ((e.clientX - r.left) / r.width * 100).toFixed(1) + '% ' + ((e.clientY - r.top) / r.height * 100).toFixed(1) + '%';
        pl.classList.add('is-zoom');
      });
      sheet.addEventListener('mouseout', e => {
        const pl = e.target.closest('.sheet__plate');
        if (pl && !pl.contains(e.relatedTarget)) pl.classList.remove('is-zoom');
      });
    }
  }
  addEventListener('hashchange', () => {
    const m = /^#p=([\w-]+)$/.exec(location.hash);
    if (backPending) { backPending = false; if (!m) { runAfter(); return; } }
    if (m && RD && RD.items[m[1]]) { if (m[1] !== sheetSlug) openSheet(m[1], true); }
    else if (sheetSlug) closeSheet(true);
  });

  /* ---------- pictures full size ---------- */
  const lightbox = $('#lightbox'), lbIn = $('#lightboxIn');
  let lbLast = null;
  function openLightbox(src) {
    lbLast = d.activeElement;
    lbIn.classList.remove('is-zoom');
    lbIn.innerHTML = '<img src="' + esc(src) + '" alt="">';
    lightbox.hidden = false;
    lock(true);
    focus($('.lightbox__x', lightbox));
  }
  function closeLightbox() {
    if (lightbox.hidden) return;
    lightbox.hidden = true;
    lbIn.innerHTML = '';
    lock(false);
    focus(lbLast);
  }
  lightbox.addEventListener('click', e => {
    if (e.target.closest('[data-close-lightbox]') || e.target === lightbox || e.target === lbIn) closeLightbox();
    else if (e.target.tagName === 'IMG') lbIn.classList.toggle('is-zoom');
  });

  /* ---------- search the whole catalogue ---------- */
  const palette = $('#palette'), pq = $('#pq'), pres = $('#pres');
  const hintHTML = pres.innerHTML;
  let IDX = null, idxLoading = null, sel = -1, palLast = null;
  function loadIndex() {
    if (IDX) return Promise.resolve(IDX);
    if (!idxLoading) {
      idxLoading = fetch(CFG.index).then(r => { if (!r.ok) throw new Error(r.status); return r.json(); }).then(j => {
        const R = j.r.map(r => ({ id: r[0], n: { en: r[1], ar: r[2] }, c: r[3] }));
        const G = j.g.map(g => ({ r: R[g[0]], s: g[1], n: { en: g[2], ar: g[3] }, c: g[4] }));
        const P = j.p.map((p, k) => {
          const g = G[p[1]];
          return prepProduct({ s: p[0], g: g, n: { en: p[2], ar: p[3] }, i: p[4], z: p[5], k: k }, g.n.en + ' ' + (g.n.ar || '') + ' ' + g.r.n.en + ' ' + (g.r.n.ar || ''));
        });
        G.forEach(g => { g.h = norm(g.n.en + ' ' + (g.n.ar || '')); });
        R.forEach(r => { r.h = norm(r.n.en + ' ' + (r.n.ar || '')); });
        IDX = { R: R, G: G, P: P };
        return IDX;
      }).catch(e => { idxLoading = null; throw e; });
    }
    return idxLoading;
  }
  function openPalette(q) {
    if (!palette.hidden) { pq.focus(); return; }
    palLast = d.activeElement;
    hideToast();
    palette.hidden = false;
    lock(true);
    if (q != null) pq.value = q;
    pq.focus();
    pq.select();
    runSearch();
    loadIndex().then(runSearch, () => { pres.innerHTML = '<p class="palette__hint">' + esc(T.offline) + '</p>'; });
  }
  function closePalette() {
    if (palette.hidden) return;
    palette.hidden = true;
    lock(false);
    focus(palLast);
  }
  /* marks the typed words inside a name */
  function hl(text, toks) {
    const low = String(text).toLowerCase(), marks = [];
    toks.forEach(t => { let i = low.indexOf(t); while (t && i >= 0) { marks.push([i, i + t.length]); i = low.indexOf(t, i + t.length); } });
    if (!marks.length) return esc(text);
    marks.sort((a, b) => a[0] - b[0]);
    const merged = [];
    marks.forEach(m => { const last = merged[merged.length - 1]; if (last && m[0] <= last[1]) last[1] = Math.max(last[1], m[1]); else merged.push(m.slice()); });
    let out = '', pos = 0;
    merged.forEach(m => { out += esc(text.slice(pos, m[0])) + '<mark>' + esc(text.slice(m[0], m[1])) + '</mark>'; pos = m[1]; });
    return out + esc(text.slice(pos));
  }
  const rangeHref = r => HOME + 'range/' + r.id + '/';
  function sizeLine(p, toks) {
    const cts = toks.filter(t => /\d/.test(t)).map(t => t.replace(ALNUM, '')).filter(t => t.length >= 3);
    let z = null;
    if (cts.length) z = p.z.filter(r => r[0] && cts.some(ct => compact(r[0]).indexOf(ct) >= 0))[0] || null;
    if (!z && p.z.length === 1) z = p.z[0];
    const bdi = s => '<bdi>' + esc(s) + '</bdi>';
    if (z) {
      const size = AR ? z[2] || z[1] : z[1];
      return [size ? bdi(size) : '', z[0] ? '<bdi dir="ltr">' + hl(z[0], cts.length ? toks : []) + '</bdi>' : ''].filter(Boolean).join(' · ') +
        (p.z.length > 1 ? ' · ' + esc(fill(T.n_sizes, { n: p.z.length })) : '');
    }
    const codes = p.z.map(r => r[0]).filter(Boolean);
    return esc(fill(T.n_sizes, { n: p.z.length })) + (codes.length ? ' · <bdi dir="ltr">' + esc(codes[0]) + (codes.length > 1 ? ' – ' + esc(codes[codes.length - 1]) : '') + '</bdi>' : '');
  }
  function runSearch() {
    const q = pq.value, toks = tokens(q);
    sel = -1;
    pq.removeAttribute('aria-activedescendant');
    if (!toks.length) {
      pres.innerHTML = hintHTML + (IDX ? '<p class="pr__h"><span>' + esc(T.res_ranges) + '</span><span>' + IDX.R.length + '</span></p>' + IDX.R.map((r, i) =>
        '<a class="pr pr--r" role="option" id="pr' + i + '" href="' + esc(rangeHref(r)) + '"><span class="pr__win">' + ico('dome') + '</span><span><span class="pr__n">' + esc(nm(r.n)) +
        '</span><span class="pr__w">' + esc(count(r.c, 'one_product', 'n_products')) + '</span></span><span class="pr__go">' + ico('arrow') + '</span></a>').join('') : '');
      return;
    }
    if (!IDX) { pres.innerHTML = '<p class="palette__hint">' + esc(T.loading) + '</p>'; return; }
    const hit = (h, t) => h.indexOf(t) >= 0;
    const rs = IDX.R.filter(r => toks.every(t => hit(r.h, t))).slice(0, 3);
    const gs = IDX.G.filter(g => toks.every(t => hit(g.h, t))).slice(0, 6);
    const scored = [];
    IDX.P.forEach(p => { const s = score(p, toks); if (s) scored.push([s, p]); });
    scored.sort((a, b) => b[0] - a[0] || a[1].k - b[1].k);
    const ps = scored.slice(0, 40).map(x => x[1]);
    if (!rs.length && !gs.length && !ps.length) { pres.innerHTML = '<p class="palette__hint">' + esc(fill(T.no_results, { q: q.trim() })) + '</p>'; return; }
    let n = 0, out = '';
    if (ps.length) {
      out += '<p class="pr__h"><span>' + esc(T.res_products) + '</span><span>' + (scored.length > ps.length ? ps.length + ' / ' + scored.length : scored.length) + '</span></p>';
      out += ps.map(p => '<a class="pr" role="option" id="pr' + (n++) + '" href="' + esc(rangeHref(p.g.r) + '#p=' + p.s) + '" data-r="' + esc(p.g.r.id) + '" data-p="' + esc(p.s) + '">' +
        '<span class="pr__win">' + (p.i ? '<img src="' + esc(ROOT + p.i) + '" alt="" loading="lazy">' : ico('dome')) + '</span>' +
        '<span><span class="pr__n"><bdi>' + hl(nm(p.n), toks) + '</bdi></span><span class="pr__w">' + esc(nm(p.g.r.n)) + ' · ' + esc(nm(p.g.n)) + '</span><span class="pr__z">' + sizeLine(p, toks) + '</span></span>' +
        '<span class="pr__go">' + ico('arrow') + '</span></a>').join('');
    }
    if (gs.length) {
      out += '<p class="pr__h"><span>' + esc(T.res_groups) + '</span><span>' + gs.length + '</span></p>';
      out += gs.map(g => '<a class="pr pr--g" role="option" id="pr' + (n++) + '" href="' + esc(rangeHref(g.r) + '#g-' + g.s) + '" data-r="' + esc(g.r.id) + '" data-g="' + esc(g.s) + '">' +
        '<span class="pr__win">' + ico('list') + '</span><span><span class="pr__n">' + hl(nm(g.n), toks) + '</span><span class="pr__w">' + esc(nm(g.r.n)) + ' · ' + esc(count(g.c, 'one_product', 'n_products')) + '</span></span>' +
        '<span class="pr__go">' + ico('arrow') + '</span></a>').join('');
    }
    if (rs.length) {
      out += '<p class="pr__h"><span>' + esc(T.res_ranges) + '</span><span>' + rs.length + '</span></p>';
      out += rs.map(r => '<a class="pr pr--r" role="option" id="pr' + (n++) + '" href="' + esc(rangeHref(r)) + '"><span class="pr__win">' + ico('dome') + '</span>' +
        '<span><span class="pr__n">' + hl(nm(r.n), toks) + '</span><span class="pr__w">' + esc(count(r.c, 'one_product', 'n_products')) + '</span></span><span class="pr__go">' + ico('arrow') + '</span></a>').join('');
    }
    pres.innerHTML = out;
    pres.scrollTop = 0;
  }
  function markSel(rows) {
    rows.forEach((r, i) => r.classList.toggle('is-sel', i === sel));
    const r = rows[sel];
    if (r) { r.scrollIntoView({ block: 'nearest' }); pq.setAttribute('aria-activedescendant', r.id); }
  }
  pq.addEventListener('input', runSearch);
  pq.addEventListener('keydown', e => {
    const rows = $$('.pr', pres);
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault();
      if (!rows.length) return;
      sel = (sel + (e.key === 'ArrowDown' ? 1 : -1) + rows.length) % rows.length;
      markSel(rows);
    } else if (e.key === 'Enter') {
      const r = rows[sel] || rows[0];
      if (r) { e.preventDefault(); r.click(); }
    }
  });
  pres.addEventListener('click', e => {
    const a = e.target.closest('.pr');
    if (!a) return;
    /* a product or group on this same page opens here, without loading the page again */
    const r = a.getAttribute('data-r');
    if (RD && r === RD.id) {
      e.preventDefault();
      closePalette();
      const s = a.getAttribute('data-p'), g = a.getAttribute('data-g');
      if (s) { if (sheetSlug) swapTo(s); else location.hash = 'p=' + s; }
      else if (g) goGroup(g);
      return;
    }
    closePalette();
  });

  /* ---------- clicks and keys anywhere ---------- */
  d.addEventListener('click', e => {
    const t = e.target;
    if (!t.closest) return;
    if (t.closest('[data-theme-toggle]')) { setTheme(html.getAttribute('data-theme') !== 'dark'); return; }
    if (t.closest('[data-open-search]')) { e.preventDefault(); openPalette(t.closest('#rnone') && rfind ? rfind.value : null); return; }
    if (t.closest('[data-close-search]')) { closePalette(); return; }
    if (t.closest('[data-open-list]')) { openDrawer(); return; }
    if (t.closest('[data-close-list]')) { closeDrawer(); return; }
    const snd = t.closest('[data-send]');
    if (snd) { send(snd.getAttribute('data-send')); return; }
    const quick = t.closest('[data-quick]');
    if (quick && RD) {
      e.preventDefault();
      const s = quick.getAttribute('data-quick'), p = RD.items[s];
      if (!p) return;
      if (p.z.length === 1 && !findLine(lineId(RD.id, s, 0))) { addLine(RD.id, s, p, 0, 1); toast(T.added_toast, T.open_list, openDrawer); }
      else location.hash = 'p=' + s;
    }
  });
  function topModal() {
    if (!lightbox.hidden) return lightbox;
    if (!palette.hidden) return $('.palette__box', palette);
    if (drawerOpen()) return $('.drawer__panel', drawer);
    if (sheetSlug) return $('.sheet__box', sheet);
    if (menu && !menu.hidden) return menu;
    return null;
  }
  function trap(e, box) {
    const f = $$('a[href],button:not([disabled]),input,textarea,summary,[tabindex]:not([tabindex="-1"])', box)
      .filter(el => el.offsetWidth || el.offsetHeight || el === d.activeElement);
    if (!f.length) return;
    const first = f[0], last = f[f.length - 1], a = d.activeElement;
    if (e.shiftKey && (a === first || !box.contains(a))) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && (a === last || !box.contains(a))) { e.preventDefault(); first.focus(); }
  }
  d.addEventListener('keydown', e => {
    const k = e.key, tag = e.target.tagName || '', typing = /^(INPUT|TEXTAREA|SELECT)$/.test(tag) || e.target.isContentEditable;
    if ((k === 'k' || k === 'K') && (e.metaKey || e.ctrlKey)) { e.preventDefault(); if (palette.hidden) openPalette(); else closePalette(); return; }
    if (k === '/' && !typing && palette.hidden && !e.metaKey && !e.ctrlKey && !e.altKey) { e.preventDefault(); openPalette(); return; }
    if (k === 'Escape') {
      if (!lightbox.hidden) closeLightbox();
      else if (!palette.hidden) closePalette();
      else if (drawerOpen()) closeDrawer();
      else if (sheetSlug) closeSheet();
      else if (menu && !menu.hidden) { setMenu(false); focus(menuBtn); }
      return;
    }
    if (k === 'Tab') {
      const m = topModal();
      if (m && m !== menu) trap(e, m);
      return;
    }
    if ((k === 'ArrowLeft' || k === 'ArrowRight') && sheetSlug && !typing && topModal() === $('.sheet__box', sheet)) {
      const fwd = (k === 'ArrowRight') !== AR, b = $$('.sheet__nav [data-go]', sheet)[fwd ? 1 : 0];
      if (b && !b.disabled) { e.preventDefault(); b.click(); }
    }
  });

  /* another tab, or coming back to this page, may have changed the list */
  addEventListener('storage', e => { if (e.key === LIST) { list = clean(get(LIST)); syncCounts(); if (drawerOpen()) renderDrawer(); } });
  addEventListener('pageshow', e => { if (e.persisted) { list = clean(get(LIST)); syncCounts(); if (drawerOpen()) renderDrawer(); } });

  /* ---------- start ---------- */
  syncCounts();
  if (RD && /^#p=[\w-]+$/.test(location.hash)) openSheet(location.hash.slice(3), false);
  onScroll();
})();
