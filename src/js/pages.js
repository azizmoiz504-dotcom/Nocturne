// Page-specific behaviour: catalogue filters, product gallery, enquiry form, pipe explorer.
import { SITE, PIPE } from '../data.js';
import { $, $$, norm, session, copyText, toast, reduced } from './util.js';
import { getList, onChange, listText } from './quote.js';
import { weight, toIn, ring } from './pipe.js';
import { track } from './track.js';

/* ---------- catalogue ---------- */
export function initCatalogue() {
  const root = $('[data-catalogue]');
  if (!root) return;
  const input = $('[data-cat-search]', root);
  const shown = $('[data-shown]', root);
  const reset = $('[data-reset]', root);
  const empty = $('[data-empty]', root);
  const chips = $('[data-chips]', root);
  const groups = $$('[data-group]', root).map((g) => ({
    g,
    slug: g.dataset.group,
    cards: $$('[data-pc]', g).map((c) => ({ c, hay: norm(c.dataset.search) })),
  }));
  const slugs = new Set(groups.map((x) => x.slug));
  let cat = 'all';
  let q = '';

  function scrollToList() {
    const top = root.getBoundingClientRect().top + scrollY - 8;
    if (scrollY > top || root.getBoundingClientRect().top > innerHeight * 0.6) scrollTo({ top, behavior: reduced() ? 'auto' : 'smooth' });
  }

  function apply({ scroll = false, hash = true } = {}) {
    const toks = norm(q).split(' ').filter(Boolean);
    let n = 0;
    for (const { g, slug, cards } of groups) {
      const inCat = cat === 'all' || cat === slug;
      let vis = 0;
      for (const { c, hay } of cards) {
        const ok = inCat && toks.every((t) => hay.includes(t));
        c.hidden = !ok;
        if (ok) vis++;
      }
      g.hidden = vis === 0;
      n += vis;
    }
    shown.textContent = n;
    empty.hidden = n > 0;
    reset.hidden = cat === 'all' && !q;
    for (const b of $$('[data-filter]', root)) {
      const on = b.dataset.filter === cat;
      b.classList.toggle('is-on', on);
      b.setAttribute('aria-pressed', String(on));
    }
    for (const a of $$('[data-cat-link]')) {
      if (a.dataset.catLink === cat) a.setAttribute('aria-current', 'true');
      else a.removeAttribute('aria-current');
    }
    const chip = chips && $(`[data-filter="${cat}"]`, chips);
    if (chip) chips.scrollTo({ left: chip.offsetLeft - chips.clientWidth / 2 + chip.offsetWidth / 2, behavior: 'smooth' });
    if (hash) {
      try {
        history.replaceState(null, '', cat === 'all' ? location.pathname + location.search : `#${cat}`);
      } catch {}
    }
    if (scroll) scrollToList();
  }

  root.addEventListener('click', (e) => {
    const f = e.target.closest('[data-filter]');
    if (f) {
      cat = f.dataset.filter;
      apply({ scroll: true });
    } else if (e.target.closest('[data-reset]')) {
      cat = 'all';
      q = input.value = '';
      apply({ scroll: true });
    }
  });
  let t = 0;
  input.addEventListener('input', () => {
    clearTimeout(t);
    t = setTimeout(() => {
      q = input.value;
      apply({ hash: false });
    }, 80);
  });
  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') input.blur();
  });

  // Header search on this page filters in place
  addEventListener('ft:search', (e) => {
    q = input.value = e.detail;
    cat = 'all';
    apply({ scroll: true });
  });
  // Category links in the header bar and menu
  addEventListener('hashchange', () => {
    const h = decodeURIComponent(location.hash.slice(1));
    if (slugs.has(h) && h !== cat) {
      cat = h;
      apply({ scroll: true, hash: false });
    }
  });

  // Initial state: #category from links, ?q= or a query handed over from another page's search
  const h = decodeURIComponent(location.hash.slice(1));
  if (slugs.has(h)) cat = h;
  let handed = session.get('ft-q', '');
  session.del('ft-q');
  try {
    handed = new URLSearchParams(location.search).get('q') || handed;
  } catch {}
  if (handed) {
    q = input.value = handed;
    cat = 'all';
  }
  if (cat !== 'all' || q) {
    apply({ hash: false });
    requestAnimationFrame(() => scrollTo(0, 0));
  }
}

/* ---------- product page ---------- */
export function initProduct() {
  const pdp = $('[data-pdp]');
  if (!pdp) return;
  const frame = $('[data-zoom]', pdp);
  const img = $('[data-main-img]', pdp);
  const cap = $('[data-main-cap]', pdp);

  const thumbs = $('[data-thumbs]', pdp);
  if (thumbs) {
    thumbs.addEventListener('click', (e) => {
      const b = e.target.closest('.thumb');
      if (!b || b.classList.contains('is-on')) return;
      for (const t of $$('.thumb', thumbs)) {
        t.classList.toggle('is-on', t === b);
        t.setAttribute('aria-pressed', String(t === b));
      }
      frame.classList.remove('is-zoom');
      img.classList.add('is-swap');
      const next = new Image();
      next.onload = next.onerror = () => {
        img.src = b.dataset.src;
        cap.textContent = b.dataset.cap;
        requestAnimationFrame(() => img.classList.remove('is-swap'));
      };
      next.src = b.dataset.src;
    });
  }

  // Tap or click to zoom 2×, the zoom follows the pointer
  frame.addEventListener('click', (e) => {
    frame.classList.toggle('is-zoom');
    origin(e);
  });
  const origin = (e) => {
    const r = frame.getBoundingClientRect();
    img.style.transformOrigin = `${((e.clientX - r.left) / r.width) * 100}% ${((e.clientY - r.top) / r.height) * 100}%`;
  };
  frame.addEventListener('pointermove', (e) => frame.classList.contains('is-zoom') && origin(e));
  frame.addEventListener('pointerleave', (e) => e.pointerType === 'mouse' && frame.classList.remove('is-zoom'));

  const qty = $('[data-qty]', pdp);
  if (qty) {
    const inp = $('[data-qty-input]', qty);
    const set = (n) => (inp.value = Math.max(1, Math.min(9999, Math.round(Number(n) || 1))));
    qty.addEventListener('click', (e) => {
      if (e.target.closest('[data-qty-dec]')) set(Number(inp.value) - 1);
      if (e.target.closest('[data-qty-inc]')) set(Number(inp.value) + 1);
    });
    inp.addEventListener('change', () => set(inp.value));
  }
}

/* ---------- enquiry form ---------- */
export function initContact() {
  const form = $('[data-form]');
  if (!form) return;
  const listBox = $('[data-form-list]', form);
  const done = $('[data-form-done]', form);
  const msg = $('[data-form-msg]', form);
  const mail = $('[data-form-mail]', form);
  const wa = $('[data-form-wa]', form);

  function showList(list) {
    listBox.hidden = !list.length;
    $('[data-form-count]', form).textContent = list.length;
    $('[data-form-items]', form).innerHTML = list
      .map((x) => `<li><b>${x.ref}</b><span></span></li>`)
      .join('');
    $$('[data-form-items] li span', form).forEach((s, i) => (s.textContent = `${list[i].name} × ${list[i].qty}`));
  }
  showList(getList());
  onChange(showList);

  const field = (name) => form.elements[name];
  function flag(name, text) {
    const wrap = field(name).closest('.field');
    wrap.classList.toggle('is-bad', !!text);
    let err = $('.field__err', wrap);
    if (text && !err) {
      err = document.createElement('p');
      err.className = 'field__err';
      err.id = `err-${name}`;
      wrap.appendChild(err);
      field(name).setAttribute('aria-describedby', err.id);
    }
    if (err) err.textContent = text || '';
    field(name).setAttribute('aria-invalid', text ? 'true' : 'false');
  }
  function validate() {
    const v = (n) => field(n).value.trim();
    const bad = [];
    const check = (n, ok, text) => {
      flag(n, ok ? '' : text);
      if (!ok) bad.push(n);
    };
    check('name', v('name').length >= 2, 'Please enter your name.');
    check('phone', v('phone').replace(/\D/g, '').length >= 7, 'Please enter a phone number we can call back.');
    const email = v('email');
    check('email', !email || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email), 'That email address doesn’t look right.');
    check('message', v('message').length >= 3 || getList().length > 0, 'Tell us what you need, or add items to your quote list.');
    return bad;
  }
  form.addEventListener('input', (e) => {
    const f = e.target.closest('.field.is-bad');
    if (f) validate();
  });

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const bad = validate();
    if (bad.length) {
      field(bad[0]).focus();
      return;
    }
    const v = (n) => field(n).value.trim();
    const list = getList();
    const text = [
      `Enquiry for ${SITE.name}`,
      '',
      `Name: ${v('name')}`,
      v('company') ? `Company: ${v('company')}` : null,
      `Phone: ${v('phone')}`,
      v('email') ? `Email: ${v('email')}` : null,
      v('message') ? `\nMessage:\n${v('message')}` : null,
      list.length ? `\nQuote list (${list.length} ${list.length === 1 ? 'item' : 'items'}):\n${listText(list)}` : null,
    ]
      .filter((x) => x !== null)
      .join('\n');
    msg.textContent = text;
    if (mail && SITE.email) mail.href = `mailto:${SITE.email}?subject=${encodeURIComponent(`Enquiry from ${v('name')}`)}&body=${encodeURIComponent(text)}`;
    if (wa && SITE.whatsapp) wa.href = `https://wa.me/${SITE.whatsapp}?text=${encodeURIComponent(text)}`;
    form.classList.add('is-done');
    done.hidden = false;
    // The form only prepares text; nothing reaches the shop until the visitor sends or calls, so this is not a lead.
    track('prepare_enquiry', { items: list.length });
    form.scrollIntoView({ behavior: reduced() ? 'auto' : 'smooth', block: 'start' });
  });
  $('[data-form-copy]', form).addEventListener('click', async () => {
    const ok = await copyText(msg.textContent);
    toast(ok ? 'Enquiry copied' : 'Copy failed: select the text and copy it manually');
  });
  $('[data-form-edit]', form).addEventListener('click', () => {
    form.classList.remove('is-done');
    done.hidden = true;
    field('message').focus();
  });
}

/* ---------- pipe schedule explorer ---------- */
export function initPipe() {
  const ex = $('[data-explorer]');
  if (!ex) return;
  const q = (k) => $(`[data-ex-${k}]`, ex);
  const table = $('[data-ptable]');
  const C = 300;
  const R = 230;
  let nps = PIPE.findIndex(([n]) => n === '6″');
  let sch = '40';
  let cur = null;
  let raf = 0;

  const values = () => {
    const [name, od, w] = PIPE[nps];
    if (!w[sch]) sch = Object.keys(w)[0];
    const wt = w[sch];
    return { name, od, wt, id: od - 2 * wt, kg: weight(od, wt) };
  };

  function draw(v) {
    const ri = R * (v.id / v.od);
    q('wall').setAttribute('d', ring(C, C, R, Math.max(ri, 0.5)));
    const y = C + R + 22;
    for (const [k, x1, x2] of [['dim-od', C - R, C + R], ['tick-l', C - R, C - R], ['tick-r', C + R, C + R]]) {
      const l = q(k);
      l.setAttribute('x1', x1);
      l.setAttribute('x2', x2);
      l.setAttribute('y1', k === 'dim-od' ? y : y - 10);
      l.setAttribute('y2', k === 'dim-od' ? y : y + 10);
    }
    const t = q('dim-odt');
    t.setAttribute('y', y + 26);
    t.textContent = `Ø ${v.od.toFixed(1)} mm`;
    const wl = q('dim-wt');
    wl.setAttribute('x1', C + ri);
    wl.setAttribute('x2', C + R);
  }

  function readout(v) {
    q('nps-label').textContent = v.name;
    q('od').textContent = v.od.toFixed(1);
    q('od-in').textContent = `${toIn(v.od)} in`;
    q('wt').textContent = v.wt.toFixed(2);
    q('wt-in').textContent = `${toIn(v.wt)} in`;
    q('id').textContent = v.id.toFixed(2);
    q('id-in').textContent = `${toIn(v.id)} in`;
    q('kg').textContent = v.kg.toFixed(2);
    q('lb').textContent = `${(v.kg * 0.671969).toFixed(2)} lb/ft`;
  }

  function highlight() {
    if (!table) return;
    for (const tr of $$('[data-row]', table)) {
      const on = Number(tr.dataset.row) === nps;
      tr.classList.toggle('is-row', on);
      for (const td of $$('[data-sch]', tr)) td.classList.toggle('is-col', td.dataset.sch === sch);
    }
    for (const td of $$('td[data-sch]', table)) td.classList.toggle('is-col', td.dataset.sch === sch);
  }

  function update() {
    const v = values();
    for (const b of $$('[data-nps]', ex)) {
      const on = Number(b.dataset.nps) === nps;
      b.classList.toggle('is-on', on);
      b.setAttribute('aria-pressed', String(on));
    }
    for (const b of $$('.seg--sch [data-sch]', ex)) {
      const on = b.dataset.sch === sch;
      const avail = !!PIPE[nps][2][b.dataset.sch];
      b.classList.toggle('is-on', on);
      b.setAttribute('aria-pressed', String(on));
      b.disabled = !avail;
    }
    readout(v);
    highlight();
    cancelAnimationFrame(raf);
    if (!cur || reduced()) {
      cur = v;
      return draw(v);
    }
    // Tween only the drawing ratio so the ring eases between sizes
    const from = { ...cur };
    const t0 = performance.now();
    const step = (now) => {
      const k = Math.min(1, (now - t0) / 420);
      const e = 1 - Math.pow(1 - k, 3);
      const mix = (a, b) => a + (b - a) * e;
      cur = { ...v, id: mix(from.id / from.od, v.id / v.od) * v.od };
      draw({ ...cur, od: v.od });
      if (k < 1) raf = requestAnimationFrame(step);
      else cur = v;
    };
    raf = requestAnimationFrame(step);
  }

  ex.addEventListener('click', (e) => {
    const n = e.target.closest('[data-nps]');
    const s = e.target.closest('.seg--sch [data-sch]');
    if (n) nps = Number(n.dataset.nps);
    else if (s) sch = s.dataset.sch;
    else return;
    update();
  });
  if (table) {
    table.addEventListener('click', (e) => {
      const tr = e.target.closest('[data-row]');
      if (!tr) return;
      nps = Number(tr.dataset.row);
      const td = e.target.closest('td[data-sch]');
      if (td) sch = td.dataset.sch;
      update();
      ex.scrollIntoView({ behavior: reduced() ? 'auto' : 'smooth', block: 'start' });
    });
  }
  update();
}
