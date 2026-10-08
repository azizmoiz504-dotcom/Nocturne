// AQM Oilfield — "Nocturne" prototype. Client entry.
import { gsap, ScrollTrigger, html, body, initScroll, reduced } from './js/env.js';
import { initHeader, initMenu, initAnchors, createToast, initCursor, initMagnetic, initStatus } from './js/chrome.js';
import { runLoader, initTransitions } from './js/loader.js';
import { initMotion, pageIntro } from './js/motion.js';
import { initRFQ, initForms } from './js/rfq.js';
import initHome from './js/pages/home.js';
import { initCatalogue, initProduct, initDownloads, initContact } from './js/pages/inner.js';

function boot() {
  const page = body.dataset.page;
  if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
  if (!location.hash) scrollTo(0, 0);

  initScroll();
  const toast = createToast();
  initStatus();
  initHeader();
  initMenu();
  initAnchors(toast);
  initRFQ(toast);
  initForms();
  initCursor();
  const shutter = initTransitions();

  let intro = pageIntro;
  if (page === 'home') intro = initHome().intro;
  if (page === 'products') initCatalogue();
  if (page === 'product') initProduct();
  if (page === 'downloads') initDownloads();
  if (page === 'contact') initContact();

  const fonts = document.fonts?.ready ?? Promise.resolve();
  const settle = new Promise((r) => (document.readyState === 'complete' ? r() : addEventListener('load', r, { once: true })));
  const ready = Promise.race([Promise.all([fonts, settle]), new Promise((r) => setTimeout(r, 3500))]);

  fonts.then(() => {
    initMotion();
    initMagnetic();
    ScrollTrigger.refresh();
  });

  runLoader(ready)
    .then(() => shutter.open())
    .then(() => {
      html.classList.add('is-ready');
      intro();
      if (location.hash) {
        const t = document.getElementById(decodeURIComponent(location.hash.slice(1)));
        if (t && page !== 'products') setTimeout(() => t.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth' }), 200);
      }
    });

  // Pause the grain/cursor work when the tab is hidden.
  document.addEventListener('visibilitychange', () => gsap.globalTimeline.paused(document.hidden));
}

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
else boot();
