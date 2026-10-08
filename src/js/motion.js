import { gsap, ScrollTrigger, SplitText, $, $$, reduced, finePointer, onScroll } from './env.js';

// ---------------------------------------------------------------------------
// Generic scroll choreography, driven by data attributes in the markup.
// ---------------------------------------------------------------------------
export function initMotion() {
  splitHeadings();
  reveals();
  clips();
  counters();
  scrubWords();
  parallax();
  marquee();
  sectors();
  tilt();
  footerMega();
}

function splitHeadings() {
  $$('[data-split]').forEach((el) => {
    if (el.closest('[data-phero]') || el.closest('[data-pdp]')) return; // handled by page intros
    const split = SplitText.create(el, { type: 'lines', mask: 'lines', linesClass: 'split-line', autoSplit: true,
      onSplit: (self) => {
        el.classList.add('is-split');
        if (reduced) return;
        return gsap.from(self.lines, { yPercent: 110, duration: 1.3, stagger: 0.09, ease: 'expo.out',
          scrollTrigger: { trigger: el, start: 'top 88%', once: true } });
      } });
    void split;
  });
}

function reveals() {
  if (reduced) return;
  $$('[data-reveal]').forEach((el) => {
    gsap.to(el, { opacity: 1, y: 0, duration: 1.2, ease: 'expo.out', scrollTrigger: { trigger: el, start: 'top 90%', once: true } });
  });
  $$('[data-stagger]').forEach((el) => {
    gsap.to(el.children, { opacity: 1, y: 0, duration: 1.2, ease: 'expo.out', stagger: 0.08, scrollTrigger: { trigger: el, start: 'top 88%', once: true } });
  });
}

function clips() {
  if (reduced) return;
  $$('[data-clip]').forEach((el) => {
    const img = el.querySelector('img');
    const tl = gsap.timeline({ scrollTrigger: { trigger: el, start: 'top 85%', once: true } });
    tl.to(el, { clipPath: 'inset(0% 0% 0% 0% round 22px)', duration: 1.8, ease: 'expo.inOut' });
    if (img) tl.to(img, { scale: 1, duration: 2.2, ease: 'expo.out' }, 0);
  });
}

function counters() {
  $$('[data-count]').forEach((el) => {
    const to = +el.dataset.count;
    if (reduced) return;
    const o = { v: 0 };
    el.textContent = '0';
    gsap.to(o, { v: to, duration: 2, ease: 'power3.out', onUpdate: () => (el.textContent = Math.round(o.v)),
      scrollTrigger: { trigger: el, start: 'top 92%', once: true } });
  });
}

// Wrap words so they can be "lit" one by one as the paragraph scrolls past.
export function wrapWords(el) {
  const walk = (node) => {
    [...node.childNodes].forEach((n) => {
      if (n.nodeType === 3) {
        const frag = document.createDocumentFragment();
        n.textContent.split(/(\s+)/).forEach((part) => {
          if (!part) return;
          if (/^\s+$/.test(part)) frag.append(part);
          else { const s = document.createElement('span'); s.className = 'w'; s.textContent = part; frag.append(s); }
        });
        n.replaceWith(frag);
      } else if (n.nodeType === 1) walk(n);
    });
  };
  walk(el);
  return $$('.w', el);
}

function scrubWords() {
  $$('[data-scrub-words]').forEach((el) => {
    const words = wrapWords(el);
    if (reduced) { words.forEach((w) => (w.style.opacity = 1)); return; }
    gsap.to(words, { opacity: 1, ease: 'none', stagger: 0.12,
      scrollTrigger: { trigger: el, start: 'top 82%', end: 'bottom 45%', scrub: 0.6 } });
  });
}

function parallax() {
  if (reduced) return;
  $$('[data-parallax-img]').forEach((img) => {
    gsap.fromTo(img, { yPercent: -8 }, { yPercent: 6, ease: 'none', scrollTrigger: { trigger: img.parentElement, start: 'top bottom', end: 'bottom top', scrub: true } });
  });
  const ph = $('[data-phero-media] img');
  if (ph) gsap.to(ph, { yPercent: 14, ease: 'none', scrollTrigger: { trigger: '[data-phero]', start: 'top top', end: 'bottom top', scrub: true } });
  $$('[data-float]').forEach((img, i) => {
    gsap.to(img, { y: i % 2 ? 18 : -22, rotation: i % 2 ? 2 : -2, duration: 4 + i, ease: 'sine.inOut', yoyo: true, repeat: -1 });
    gsap.to(img, { yPercent: 30 + i * 18, ease: 'none', scrollTrigger: { trigger: '[data-phero]', start: 'top top', end: 'bottom top', scrub: true } });
  });
}

function marquee() {
  $$('[data-marquee]').forEach((el) => {
    const track = el.firstElementChild;
    if (reduced) return;
    const loop = gsap.to(track, { xPercent: -50, ease: 'none', duration: 46, repeat: -1 });
    let dir = 1;
    onScroll((y, v, d) => {
      if (d) dir = d;
      const boost = 1 + Math.min(6, Math.abs(v || 0) * 0.35);
      gsap.to(loop, { timeScale: boost * dir, duration: 0.4, overwrite: true });
    });
  });
}

function sectors() {
  const el = $('[data-sectors]');
  if (!el) return;
  const spans = $$('span', el);
  if (reduced) return spans.forEach((s) => s.classList.add('is-lit'));
  ScrollTrigger.create({
    trigger: el, start: 'top 80%', end: 'bottom 50%', scrub: true,
    onUpdate: (st) => spans.forEach((s, i) => s.classList.toggle('is-lit', st.progress * spans.length > i + 0.2)),
  });
}

function tilt() {
  if (!finePointer || reduced) return;
  $$('[data-tilt]').forEach((el) => {
    const rx = gsap.quickTo(el, 'rotationX', { duration: 0.8, ease: 'power3' });
    const ry = gsap.quickTo(el, 'rotationY', { duration: 0.8, ease: 'power3' });
    gsap.set(el, { transformPerspective: 900 });
    el.addEventListener('pointermove', (e) => {
      const r = el.getBoundingClientRect();
      const px = (e.clientX - r.left) / r.width, py = (e.clientY - r.top) / r.height;
      rx((0.5 - py) * 8); ry((px - 0.5) * 10);
      el.style.setProperty('--mx', `${px * 100}%`);
      el.style.setProperty('--my', `${py * 100}%`);
    });
    el.addEventListener('pointerleave', () => { rx(0); ry(0); });
  });
}

function footerMega() {
  const m = $('[data-mega]');
  if (!m || reduced) return;
  gsap.fromTo(m, { yPercent: 55 }, { yPercent: 6, ease: 'none', scrollTrigger: { trigger: m.parentElement, start: 'top bottom', end: 'bottom bottom', scrub: true } });
}

// Interior page hero entrance (also used by the product page title).
export function pageIntro() {
  const tl = gsap.timeline();
  const title = $('[data-phero] .phero__title, [data-pdp] .pdp__title');
  if (title) {
    const split = SplitText.create(title, { type: 'chars,words,lines', mask: 'lines', charsClass: 'ch', wordsClass: 'wd' });
    title.classList.add('is-split');
    if (!reduced) tl.from(split.chars, { yPercent: 115, duration: 1.4, stagger: 0.022, ease: 'expo.out' }, 0);
  }
  if (reduced) return tl;
  const bits = $$('[data-phero] .crumbs, [data-phero] .eyebrow, [data-pdp] .crumbs, [data-pdp] .eyebrow');
  tl.from(bits, { autoAlpha: 0, y: 16, duration: 1, stagger: 0.08 }, 0.1);
  const media = $('[data-phero-media]');
  if (media) tl.from(media, { scale: 1.12, autoAlpha: 0, duration: 2.2, ease: 'expo.out' }, 0);
  const floats = $$('[data-float]');
  if (floats.length) tl.from(floats, { autoAlpha: 0, y: 80, scale: 0.9, duration: 1.8, stagger: 0.12 }, 0.1);
  const frame = $('[data-pdp] .pdp__frame');
  if (frame) tl.from(frame, { clipPath: 'inset(12% 12% 12% 12% round 26px)', duration: 1.6, ease: 'expo.inOut' }, 0);
  return tl;
}
