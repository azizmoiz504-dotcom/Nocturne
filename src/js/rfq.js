import { gsap, html, $, $$, base, stopScroll, startScroll } from './env.js';

// ---------------------------------------------------------------------------
// Enquiry list (RFQ builder). Persists per browser; sent by email, WhatsApp or the form.
// ---------------------------------------------------------------------------
const KEY = 'aqm-rfq';
const EMAIL = 'Sales@aqmoilfield.com';
const WA = '971527251355';
const escHTML = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);

let items = [];
const load = () => { try { items = JSON.parse(localStorage.getItem(KEY)) || []; } catch (e) { items = []; } };
const save = () => { try { localStorage.setItem(KEY, JSON.stringify(items)); } catch (e) { /* storage blocked */ } };

export const rfqItems = () => items.slice();

export function rfqText(extra = '') {
  const lines = items.map((it, i) => `${i + 1}. ${it.name} (${it.cat}) — Qty: ${it.qty}`);
  return ['Hello AQM Oilfield team,', '', lines.length ? "I'd like a quotation for the following:" : '', ...lines, extra ? `\n${extra}` : '', '', 'Thank you.']
    .filter((l, i, a) => !(l === '' && a[i - 1] === ''))
    .join('\n');
}
export const waLink = (text) => `https://wa.me/${WA}?text=${encodeURIComponent(text)}`;
export const mailLink = (subject, text) => `mailto:${EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(text)}`;

export function initRFQ(toast) {
  load();
  const drawer = $('[data-drawer]');
  const list = $('[data-rfq-list]');
  const empty = $('[data-rfq-empty]');
  const foot = $('[data-rfq-foot]');
  const btn = $('[data-rfq-open]');
  let lastFocus = null;

  const render = () => {
    const n = items.reduce((a, b) => a + 1, 0);
    $$('[data-rfq-count]').forEach((el) => (el.textContent = n));
    btn?.classList.toggle('has-items', n > 0);
    $$('[data-rfq-add]:not([data-with-qty])').forEach((b) => {
      const on = items.some((i) => i.slug === b.dataset.slug);
      b.classList.toggle('is-added', on);
      const l = b.querySelector('.pcard__add-label');
      if (l) l.textContent = on ? 'In your enquiry' : 'Add to enquiry';
    });
    if (list) {
      list.innerHTML = items.map((it) => `
        <li class="drawer__item" data-slug="${escHTML(it.slug)}">
          <div class="drawer__thumb"><img src="${base}${escHTML(it.img)}" alt=""></div>
          <div class="drawer__meta"><small>${escHTML(it.cat)}</small><b><a href="${base}products/${escHTML(it.slug)}.html">${escHTML(it.name)}</a></b></div>
          <div class="drawer__ctl">
            <div class="qty"><button type="button" data-dq="-1" aria-label="Decrease">−</button><input type="number" min="1" value="${it.qty}" aria-label="Quantity" data-qi><button type="button" data-dq="1" aria-label="Increase">+</button></div>
            <button class="drawer__rm" type="button" data-rm aria-label="Remove ${escHTML(it.name)}"><svg class="i" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M6 6l12 12M18 6 6 18"/></svg></button>
          </div>
        </li>`).join('');
    }
    empty && (empty.hidden = n > 0);
    foot && (foot.hidden = n === 0);
    list && (list.hidden = n === 0);
    const wa = $('[data-rfq-wa]'), mail = $('[data-rfq-mail]');
    if (wa) wa.href = waLink(rfqText());
    if (mail) mail.href = mailLink('Request for quotation', rfqText());
    // Contact form attachment
    const fr = $('[data-form-rfq]');
    if (fr) {
      fr.hidden = n === 0;
      $('[data-form-rfq-count]', fr).textContent = n;
      $('[data-form-rfq-list]', fr).innerHTML = items.map((it) => `<li>${escHTML(it.name)} × ${it.qty}</li>`).join('');
    }
  };

  const add = (d, qty = 1) => {
    const ex = items.find((i) => i.slug === d.slug);
    if (ex) ex.qty += qty;
    else items.push({ slug: d.slug, name: d.name, cat: d.cat, img: d.img, qty });
    save(); render();
    btn?.classList.remove('bump'); void btn?.offsetWidth; btn?.classList.add('bump');
    toast(`Added — ${d.name}`, { label: 'View list', fn: open });
  };
  const remove = (slug) => { items = items.filter((i) => i.slug !== slug); save(); render(); };
  const setQty = (slug, q) => { const it = items.find((i) => i.slug === slug); if (it) { it.qty = Math.max(1, q | 0 || 1); save(); render(); } };

  const open = () => {
    if (!drawer) return;
    lastFocus = document.activeElement;
    drawer.classList.add('is-open');
    drawer.setAttribute('aria-hidden', 'false');
    html.classList.add('has-drawer');
    stopScroll();
    setTimeout(() => $('.drawer__head .icon-btn', drawer)?.focus(), 400);
  };
  const close = () => {
    if (!drawer?.classList.contains('is-open')) return;
    drawer.classList.remove('is-open');
    drawer.setAttribute('aria-hidden', 'true');
    html.classList.remove('has-drawer');
    startScroll();
    lastFocus?.focus?.();
  };

  document.addEventListener('click', (e) => {
    const a = e.target.closest('[data-rfq-add]');
    if (a) {
      e.preventDefault();
      if (a.hasAttribute('data-with-qty')) {
        const q = +($('[data-qty-input]')?.value || 1);
        add(a.dataset, Math.max(1, q));
      } else if (items.some((i) => i.slug === a.dataset.slug)) {
        remove(a.dataset.slug);
      } else add(a.dataset);
      return;
    }
    if (e.target.closest('[data-rfq-open]')) return open();
    if (e.target.closest('[data-rfq-close]')) return close();
    if (e.target.closest('[data-rfq-clear]')) { items = []; save(); render(); return; }
    const row = e.target.closest('.drawer__item');
    if (row) {
      const s = row.dataset.slug;
      if (e.target.closest('[data-rm]')) {
        gsap.to(row, { x: 40, autoAlpha: 0, duration: 0.4, ease: 'power2.in', onComplete: () => remove(s) });
      } else if (e.target.closest('[data-dq]')) {
        const it = items.find((i) => i.slug === s);
        setQty(s, it.qty + +e.target.closest('[data-dq]').dataset.dq);
      }
    }
  });
  list?.addEventListener('change', (e) => {
    const row = e.target.closest('.drawer__item');
    if (row && e.target.matches('[data-qi]')) setQty(row.dataset.slug, +e.target.value);
  });
  addEventListener('keydown', (e) => e.key === 'Escape' && close());
  addEventListener('storage', (e) => { if (e.key === KEY) { load(); render(); } });

  // Product page quantity stepper
  const qi = $('[data-qty-input]');
  if (qi) {
    $('[data-qty-dec]')?.addEventListener('click', () => (qi.value = Math.max(1, +qi.value - 1)));
    $('[data-qty-inc]')?.addEventListener('click', () => (qi.value = +qi.value + 1));
  }
  render();
  return { open, close, render };
}

// ---------------------------------------------------------------------------
// Contact form — validates, then prepares the message for email / WhatsApp.
// (No backend in the prototype; wire `data-form` to the real endpoint at launch.)
// ---------------------------------------------------------------------------
export function initForms() {
  $$('[data-form]').forEach((form) => {
    const done = $('[data-form-done]', form);
    const fieldOf = (name) => form.elements[name]?.closest('.field');
    form.addEventListener('input', (e) => e.target.closest('.field')?.classList.remove('is-invalid'));
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const v = Object.fromEntries(new FormData(form));
      const bad = [];
      if (!v.name?.trim()) bad.push('name');
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.email || '')) bad.push('email');
      if (!v.message?.trim()) bad.push('message');
      bad.forEach((n) => fieldOf(n)?.classList.add('is-invalid'));
      if (bad.length) {
        gsap.fromTo(form, { x: -8 }, { x: 0, duration: 0.6, ease: 'elastic.out(1, 0.3)' });
        form.elements[bad[0]]?.focus();
        return;
      }
      const details = [
        v.message.trim(), '',
        `Name: ${v.name}`, v.company && `Company: ${v.company}`, v.phone && `Phone: ${v.phone}`, `Email: ${v.email}`,
      ].filter(Boolean).join('\n');
      const text = rfqItems().length ? rfqText(details) : `Hello AQM Oilfield team,\n\n${details}\n\nThank you.`;
      const subject = v.subject?.trim() || (rfqItems().length ? 'Request for quotation' : 'Website enquiry');
      $('[data-done-mail]', form).href = mailLink(subject, text);
      $('[data-done-wa]', form).href = waLink(text);
      done.hidden = false;
      gsap.from(done, { autoAlpha: 0, duration: 0.6 });
      gsap.from($$('h3, p, .form__done-ctas, .link-btn', done), { y: 20, autoAlpha: 0, stagger: 0.07, duration: 0.9, delay: 0.2 });
    });
    $('[data-form-reset]', form)?.addEventListener('click', () => { form.reset(); done.hidden = true; });
  });
}
