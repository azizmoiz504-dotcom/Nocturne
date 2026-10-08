import { gsap, html, $, $$, onScroll, scrollTo, stopScroll, startScroll, lenis, finePointer, reduced } from './env.js';

// ---------------------------------------------------------------------------
// Header: glass on scroll, hides on the way down, returns on the way up.
// ---------------------------------------------------------------------------
export function initHeader() {
  const hdr = $('[data-hdr]');
  const bar = $('[data-progress]');
  if (!hdr) return;
  let hidden = false;
  let acc = 0;
  const set = (y, dir, dy) => {
    hdr.classList.toggle('is-scrolled', y > 30);
    acc = Math.sign(dy) === Math.sign(acc) ? acc + dy : dy;
    const shouldHide = y > 240 && dir > 0 && acc > 40 && !html.classList.contains('menu-open');
    const shouldShow = dir < 0 && acc < -24;
    if (shouldHide && !hidden) { hidden = true; hdr.classList.add('is-hidden'); }
    else if ((shouldShow || y < 120) && hidden) { hidden = false; hdr.classList.remove('is-hidden'); }
    html.classList.toggle('hdr-shown', !hidden && y > 30);
    const max = document.documentElement.scrollHeight - innerHeight;
    if (bar) bar.style.transform = `scaleX(${max > 0 ? y / max : 0})`;
  };
  let lastY = scrollY;
  onScroll((y) => { const dy = y - lastY; set(y, Math.sign(dy), dy); lastY = y; });
  set(scrollY, 0, 0);
}

// ---------------------------------------------------------------------------
// Mobile menu
// ---------------------------------------------------------------------------
export function initMenu() {
  const btn = $('[data-menu-toggle]');
  const menu = $('[data-menu]');
  if (!btn || !menu) return;
  const set = (open) => {
    html.classList.toggle('menu-open', open);
    btn.setAttribute('aria-expanded', open);
    menu.setAttribute('aria-hidden', !open);
    open ? stopScroll() : startScroll();
  };
  btn.addEventListener('click', () => set(!html.classList.contains('menu-open')));
  $$('a', menu).forEach((a) => a.addEventListener('click', () => set(false)));
  addEventListener('keydown', (e) => e.key === 'Escape' && html.classList.contains('menu-open') && set(false));
}

// ---------------------------------------------------------------------------
// Anchors, back-to-top, placeholder socials
// ---------------------------------------------------------------------------
export function initAnchors(toast) {
  document.addEventListener('click', (e) => {
    const a = e.target.closest('a[href]');
    if (!a) return;
    const href = a.getAttribute('href');
    if (a.hasAttribute('data-social')) {
      e.preventDefault();
      toast('Social profile links to be added by AQM');
      return;
    }
    const url = new URL(a.href, location.href);
    if (url.hash && url.pathname === location.pathname && href !== '#') {
      const target = document.getElementById(decodeURIComponent(url.hash.slice(1)));
      if (target) {
        e.preventDefault();
        history.replaceState(null, '', url.hash);
        scrollTo(target, { offset: -90 });
      }
    }
  });
  $('[data-totop]')?.addEventListener('click', () => scrollTo(0, { duration: 2 }));
}

// ---------------------------------------------------------------------------
// Toast
// ---------------------------------------------------------------------------
export function createToast() {
  const el = $('[data-toast]');
  let t;
  return (msg, action) => {
    if (!el) return;
    el.innerHTML = '';
    el.append(document.createTextNode(msg));
    if (action) {
      const b = document.createElement('button');
      b.type = 'button';
      b.textContent = action.label;
      b.addEventListener('click', () => { action.fn(); el.classList.remove('is-on'); });
      el.append(b);
    }
    el.classList.add('is-on');
    clearTimeout(t);
    t = setTimeout(() => el.classList.remove('is-on'), 3600);
  };
}

// ---------------------------------------------------------------------------
// Cursor + magnetic buttons (fine pointers only)
// ---------------------------------------------------------------------------
export function initCursor() {
  if (!finePointer || reduced) return;
  const c = $('[data-cursor-el]');
  if (!c) return;
  html.classList.add('has-cursor');
  const ring = $('.cursor__ring', c), dot = $('.cursor__dot', c), label = $('[data-cursor-label]', c);
  const rx = gsap.quickTo([ring, label], 'x', { duration: 0.55, ease: 'power3' });
  const ry = gsap.quickTo([ring, label], 'y', { duration: 0.55, ease: 'power3' });
  const dx = gsap.quickTo(dot, 'x', { duration: 0.12, ease: 'power3' });
  const dy = gsap.quickTo(dot, 'y', { duration: 0.12, ease: 'power3' });
  gsap.set(c, { autoAlpha: 0 });
  addEventListener('pointermove', (e) => {
    if (!seen) { seen = true; gsap.set([ring, label, dot], { x: e.clientX, y: e.clientY }); gsap.to(c, { autoAlpha: 1, duration: 0.4 }); }
    rx(e.clientX); ry(e.clientY); dx(e.clientX); dy(e.clientY);
  }, { passive: true });
  let seen = false;
  document.addEventListener('pointerleave', () => gsap.to(c, { autoAlpha: 0, duration: 0.3 }));
  document.addEventListener('pointerenter', () => seen && gsap.to(c, { autoAlpha: 1, duration: 0.3 }));
  document.addEventListener('pointerover', (e) => {
    const t = e.target.closest('[data-cursor], a, button, label, input, textarea');
    const lab = t?.closest('[data-cursor]')?.dataset.cursor;
    c.classList.toggle('is-label', !!lab);
    c.classList.toggle('is-hover', !!t && !lab && !t.matches('input, textarea'));
    if (lab) label.textContent = lab;
  });
}

export function initMagnetic() {
  if (!finePointer || reduced) return;
  $$('[data-magnetic]').forEach((el) => {
    const xTo = gsap.quickTo(el, 'x', { duration: 0.8, ease: 'elastic.out(1, 0.4)' });
    const yTo = gsap.quickTo(el, 'y', { duration: 0.8, ease: 'elastic.out(1, 0.4)' });
    el.addEventListener('pointermove', (e) => {
      const r = el.getBoundingClientRect();
      xTo((e.clientX - (r.left + r.width / 2)) * 0.22);
      yTo((e.clientY - (r.top + r.height / 2)) * 0.32);
    });
    el.addEventListener('pointerleave', () => { xTo(0); yTo(0); });
  });
}

// ---------------------------------------------------------------------------
// Live office status — Ajman runs on Gulf Standard Time (UTC+4), Mon–Sat 8:00–18:30.
// ---------------------------------------------------------------------------
const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const fmt = (h, m) => `${((h + 11) % 12) + 1}:${String(m).padStart(2, '0')} ${h < 12 ? 'AM' : 'PM'}`;

export function officeState(now = new Date()) {
  const t = new Date(now.getTime() + (now.getTimezoneOffset() + 240) * 60000);
  const d = t.getDay(), mins = t.getHours() * 60 + t.getMinutes();
  const workday = d >= 1 && d <= 6;
  const open = workday && mins >= 480 && mins < 1110;
  let text;
  if (open) text = `Open now · closes ${fmt(18, 30)}`;
  else if (workday && mins < 480) text = `Closed · opens today ${fmt(8, 0)}`;
  else {
    const next = d === 6 || d === 0 ? 1 : d + 1;
    text = `Closed · opens ${next === (d + 1) % 7 ? 'tomorrow' : DAYS[next]} ${fmt(8, 0)}`;
  }
  return { open, text, day: d, clock: fmt(t.getHours(), t.getMinutes()) };
}

export function initStatus() {
  const tick = () => {
    const s = officeState();
    $$('[data-status]').forEach((el) => {
      el.classList.toggle('is-open', s.open);
      el.classList.toggle('is-closed', !s.open);
      el.querySelector('span').textContent = s.text;
    });
    $$('[data-clock]').forEach((el) => (el.textContent = s.clock));
    $$('[data-hours] [data-day]').forEach((el) => el.classList.toggle('is-today', +el.dataset.day === s.day));
  };
  tick();
  setInterval(tick, 20000);
}
