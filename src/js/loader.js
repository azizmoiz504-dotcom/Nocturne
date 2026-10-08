import { gsap, html, $, $$, reduced } from './env.js';

// ---------------------------------------------------------------------------
// Preloader: a pressure gauge that sweeps to full scale while the page warms up.
// Shown once per session on the home page.
// ---------------------------------------------------------------------------
export function runLoader(ready) {
  const el = $('[data-loader]');
  let seen = false;
  try { seen = !!sessionStorage.getItem('aqm-seen'); } catch (e) { /* storage blocked */ }
  if (!el) return ready;
  if (seen || reduced || html.classList.contains('is-entering')) {
    el.remove();
    return ready;
  }
  try { sessionStorage.setItem('aqm-seen', '1'); } catch (e) { /* ignore */ }

  const needle = $('[data-gauge-needle]', el);
  const arc = $('[data-gauge-arc]', el);
  const num = $('[data-loader-num]', el);
  const state = { v: 0 };
  const draw = () => {
    gsap.set(needle, { rotation: -135 + state.v * 2.7, svgOrigin: '100 100' });
    arc.style.strokeDashoffset = 100 - state.v;
    num.textContent = String(Math.round(state.v)).padStart(3, '0');
  };
  gsap.from($('.loader__inner', el), { autoAlpha: 0, y: 20, duration: 1, ease: 'power3.out' });
  const warm = gsap.to(state, { v: 78, duration: 1.6, ease: 'power2.inOut', onUpdate: draw, delay: 0.2 });

  return Promise.all([ready, warm.then()]).then(
    () =>
      new Promise((resolve) => {
        const tl = gsap.timeline({ onComplete: () => { el.remove(); } });
        tl.to(state, { v: 100, duration: 0.7, ease: 'back.out(2.2)', onUpdate: draw })
          .to($$('.gauge, .loader__meta, .loader__brand', el), { scale: 0.92, autoAlpha: 0, duration: 0.6, ease: 'power3.in', stagger: 0.04 }, '+=0.15')
          .to(el, { clipPath: 'inset(0 0 100% 0)', duration: 1.1, ease: 'expo.inOut' }, '-=0.25')
          .add(resolve, '-=0.75');
      }),
  );
}

// ---------------------------------------------------------------------------
// Page transitions: a gate valve closes over the page, then opens on the next.
// ---------------------------------------------------------------------------
export function initTransitions() {
  const sh = $('[data-shutter]');
  if (!sh) return { open: () => Promise.resolve() };
  const top = $('.shutter__gate--top', sh), bot = $('.shutter__gate--bot', sh), mk = $('.shutter__mark', sh);

  const close = (href) => {
    try { sessionStorage.setItem('aqm-nav', '1'); } catch (e) { /* ignore */ }
    sh.style.pointerEvents = 'auto';
    gsap.timeline({ onComplete: () => (location.href = href) })
      .to(top, { yPercent: 0, y: 0, duration: 0.75, ease: 'expo.inOut' }, 0)
      .to(bot, { yPercent: 0, y: 0, duration: 0.75, ease: 'expo.inOut' }, 0)
      .fromTo(mk, { autoAlpha: 0, scale: 0.9 }, { autoAlpha: 1, scale: 1, duration: 0.5 }, 0.45);
  };

  const open = () =>
    new Promise((resolve) => {
      if (!html.classList.contains('is-entering')) return resolve();
      try { sessionStorage.removeItem('aqm-nav'); } catch (e) { /* ignore */ }
      gsap.set([top, bot], { y: 0, yPercent: 0 });
      gsap.set(mk, { autoAlpha: 1 });
      html.classList.remove('is-entering');
      gsap.timeline({ onComplete: () => { sh.style.pointerEvents = 'none'; } })
        .to(mk, { autoAlpha: 0, scale: 1.08, duration: 0.4, ease: 'power2.in' }, 0)
        .to(top, { yPercent: -101, duration: 1, ease: 'expo.inOut' }, 0.15)
        .to(bot, { yPercent: 101, duration: 1, ease: 'expo.inOut' }, 0.15)
        .add(resolve, 0.45);
    });

  if (!reduced) {
    document.addEventListener('click', (e) => {
      const a = e.target.closest('a[href]');
      if (!a || e.defaultPrevented || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return;
      if (a.target === '_blank' || a.hasAttribute('download')) return;
      const url = new URL(a.href, location.href);
      if (url.origin !== location.origin || !/^https?:|^file:/.test(url.protocol)) return;
      if (url.pathname === location.pathname && url.search === location.search) return; // same page / hash
      e.preventDefault();
      close(url.href);
    });
  }
  // Back/forward cache: make sure we never come back to a closed gate.
  addEventListener('pageshow', (e) => {
    if (e.persisted) {
      gsap.set(top, { y: 0, yPercent: -101 });
      gsap.set(bot, { y: 0, yPercent: 101 });
      gsap.set(mk, { autoAlpha: 0 });
      sh.style.pointerEvents = 'none';
    }
  });
  // Resting state when not entering.
  if (!html.classList.contains('is-entering')) {
    gsap.set(top, { y: 0, yPercent: -101 });
    gsap.set(bot, { y: 0, yPercent: 101 });
  }
  return { open };
}
