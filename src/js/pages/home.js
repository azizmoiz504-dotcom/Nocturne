import { gsap, ScrollTrigger, $, $$, reduced, isDesktop, range, scrollTo, html } from '../env.js';
import { createGlobe } from '../globe.js';
import { PIPE } from '../../data.js';
import { ring, weight } from '../pipe.js';

let hero = null;

// ---------------------------------------------------------------------------
// HERO — 3D flange joint, scroll-scrubbed from exploded view to bolted joint,
// then a dolly through the bore into the rest of the page.
// ---------------------------------------------------------------------------
function initHero() {
  const canvas = $('[data-hero-canvas]');
  if (!canvas) return;
  try {
    if (!window.AQMHero) throw new Error('hero bundle missing');
    hero = window.AQMHero.create(canvas, { reduced, mobile: !isDesktop() });
  } catch (e) {
    console.warn('[hero] WebGL unavailable, using fallback', e);
    html.classList.add('no-webgl');
  }

  const pin = $('[data-hero-pin]');
  const a = $('[data-hero-a]'), b = $('[data-hero-b]'), c = $('[data-hero-c]');
  const veil = $('[data-hero-veil]'), bp = $('[data-blueprint]'), hud = $('[data-hud]');
  const torque = $('[data-hud-torque]'), status = $('[data-hud-status]'), seq = $$('[data-hud-seq] span');
  const scrollCue = $('[data-hero-scroll]');
  if (reduced) {
    hero?.setProgress(0.47); // assembled joint, three-quarter view
    torque.textContent = '100';
    seq.forEach((s) => s.classList.add('is-on'));
    status.textContent = 'Joint made · sealed';
    return;
  }

  const tl = gsap.timeline({ defaults: { ease: 'none' } });
  tl.to(a, { autoAlpha: 0, y: -80, duration: 0.14 }, 0.02)
    .to(scrollCue, { autoAlpha: 0, duration: 0.05 }, 0)
    .to(bp, { autoAlpha: 0, duration: 0.2 }, 0.04)
    .fromTo(b, { autoAlpha: 0, y: 60 }, { autoAlpha: 1, y: 0, duration: 0.1 }, 0.4)
    .to(b, { autoAlpha: 0, y: -60, duration: 0.1 }, 0.62)
    .to(hud, { autoAlpha: 0, duration: 0.08 }, 0.66)
    .fromTo(c, { autoAlpha: 0, scale: 0.9 }, { autoAlpha: 1, scale: 1, duration: 0.08 }, 0.8)
    .to(c, { autoAlpha: 0, scale: 1.25, duration: 0.07 }, 0.93)
    .to(veil, { opacity: 1, duration: 0.1 }, 0.9);

  const labels = [[0.04, 'Exploded view'], [0.4, 'Bolt-up · star pattern'], [0.5, 'Joint made · sealed'], [0.66, 'Aligning to bore'], [1.01, 'Entering the line']];
  ScrollTrigger.create({
    trigger: pin,
    start: 'top top',
    end: () => `+=${innerHeight * (isDesktop() ? 2.6 : 2)}`,
    pin: true,
    scrub: 0.6,
    animation: tl,
    onUpdate: (st) => {
      const p = st.progress;
      hero?.setProgress(p);
      const tq = range(p, 0.06, 0.44);
      torque.textContent = String(Math.round(tq * 100)).padStart(3, '0');
      seq.forEach((s, i) => s.classList.toggle('is-on', tq * 8 > i + 0.15));
      status.textContent = labels.find(([t]) => p < t)?.[1] ?? labels.at(-1)[1];
    },
  });
}

export function heroIntro() {
  const tl = gsap.timeline();
  if (reduced) return tl;
  const words = $$('[data-hero-word]');
  tl.from(words, { yPercent: 115, rotate: 4, duration: 1.6, stagger: 0.09, ease: 'expo.out' }, 0.1)
    .from('.hero__eyebrow, [data-hero-lead], [data-hero-ctas] > *', { autoAlpha: 0, y: 24, duration: 1.2, stagger: 0.08 }, 0.35)
    .from('[data-hud], [data-hero-scroll], .hero__frame i', { autoAlpha: 0, duration: 1.4, stagger: 0.05 }, 0.6)
    .from('.hero__glow', { scale: 0.6, autoAlpha: 0, duration: 2.6, ease: 'power2.out' }, 0);
  // Blueprint: the drawing sketches itself, then the steel arrives.
  $$('[data-blueprint] .bp:not(.bp--c)').forEach((el) => el.setAttribute('pathLength', '1'));
  tl.fromTo('[data-blueprint] .bp:not(.bp--c)', { strokeDasharray: 1, strokeDashoffset: 1 }, { strokeDashoffset: 0, duration: 2.4, stagger: 0.03, ease: 'power2.inOut' }, 0)
    .from('[data-blueprint] .bp--c, [data-blueprint] .bp-t', { autoAlpha: 0, duration: 1.2, stagger: 0.02 }, 0.8);
  if (hero) tl.add(() => hero.intro(), 0.25);
  return tl;
}

// ---------------------------------------------------------------------------
// RANGE — pinned horizontal pipeline of the 12 product families.
// ---------------------------------------------------------------------------
function initRange() {
  const pin = $('[data-range-pin]'), track = $('[data-range-track]'), vp = $('[data-range-viewport]');
  if (!pin) return;
  const cards = $$('.rcard', track);
  const idx = $('[data-range-index]'), bar = $('[data-range-bar]'), flow = $('[data-range-flow]');
  const n = cards.length - 1;
  const setMeta = (p) => {
    idx.textContent = String(Math.min(n, Math.round(p * (n - 1)) + 1)).padStart(2, '0');
    bar.style.transform = `scaleX(${0.08 + p * 0.92})`;
  };
  // flange joints in the gaps between cards
  const placeJoints = () => {
    $$('.range__joint', track).forEach((j) => j.remove());
    const pipe = $('.range__pipe', track);
    const imgBox = cards[0].querySelector('.rcard__img');
    const y = imgBox.offsetTop + imgBox.offsetHeight * 0.52;
    pipe.style.top = `${y - 9}px`;
    cards.slice(1).forEach((card, i) => {
      const prev = cards[i];
      const j = document.createElement('i');
      j.className = 'range__joint';
      j.style.left = `${(prev.offsetLeft + prev.offsetWidth + card.offsetLeft) / 2}px`;
      j.style.top = `${y - 22}px`;
      track.prepend(j);
    });
  };
  placeJoints();
  addEventListener('resize', placeJoints);

  ScrollTrigger.matchMedia({
    '(min-width: 861px)': () => {
      if (reduced) return;
      const dist = () => track.scrollWidth - innerWidth;
      const tween = gsap.to(track, { x: () => -dist(), ease: 'none' });
      ScrollTrigger.create({
        trigger: pin, start: 'top top', end: () => `+=${dist()}`, pin: true, scrub: 0.8, animation: tween, invalidateOnRefresh: true,
        onUpdate: (st) => { setMeta(st.progress); flow.style.transform = `translate(${st.progress * -900}px, -50%)`; },
      });
      cards.forEach((card) => {
        const img = card.querySelector('.rcard__img img');
        if (img) gsap.fromTo(img, { xPercent: 14, rotate: 3 }, { xPercent: -14, rotate: -3, ease: 'none',
          scrollTrigger: { trigger: card, containerAnimation: tween, start: 'left right', end: 'right left', scrub: true } });
      });
      return () => gsap.set(track, { x: 0 });
    },
    '(max-width: 860px)': () => {
      const on = () => setMeta(vp.scrollLeft / Math.max(1, vp.scrollWidth - vp.clientWidth));
      vp.addEventListener('scroll', on, { passive: true });
      return () => vp.removeEventListener('scroll', on);
    },
  });
}

// ---------------------------------------------------------------------------
// SUPPLY — dotted night-globe with inbound and outbound supply lines.
// ---------------------------------------------------------------------------
function initSupply() {
  const canvas = $('[data-globe]'), pin = $('[data-supply-pin]');
  if (!canvas) return;
  const globe = createGlobe(canvas);
  const steps = $$('[data-sstep]'), dots = $$('.supply__dots li'), codes = $$('[data-code]');
  let cur = 0;
  const setStep = (i) => {
    if (i === cur) return;
    cur = i;
    steps.forEach((s, k) => s.classList.toggle('is-active', k === i));
    dots.forEach((d, k) => d.classList.toggle('is-active', k === i));
  };
  const update = (p) => {
    globe.setProgress(p);
    setStep(p < 0.4 ? 0 : p < 0.64 ? 1 : 2);
    const lit = globe.litCodes(p);
    codes.forEach((c) => c.classList.toggle('is-lit', lit.has(c.dataset.code)));
  };
  if (reduced) { update(1); return; }
  ScrollTrigger.create({
    trigger: pin, start: 'top top', end: () => `+=${innerHeight * 2.2}`, pin: true, scrub: 0.8,
    onUpdate: (st) => update(st.progress),
    onToggle: (st) => (st.isActive ? globe.start() : globe.stop()),
  });
  ScrollTrigger.create({ trigger: pin, start: 'top bottom', end: 'bottom top', onToggle: (st) => (st.isActive ? globe.start() : globe.stop()) });
  update(0);
}

// ---------------------------------------------------------------------------
// INDUSTRIES — pinned, one sector per scroll step.
// ---------------------------------------------------------------------------
function initIndustries() {
  const pin = $('[data-inds-pin]');
  if (!pin) return;
  const imgs = $$('[data-ind-img]'), items = $$('[data-ind]'), descs = $$('[data-ind-desc]'), count = $('[data-ind-count]');
  const n = items.length;
  let cur = -1;
  const set = (i) => {
    if (i === cur) return;
    cur = i;
    [imgs, items, descs].forEach((g) => g.forEach((el, k) => el.classList.toggle('is-active', k === i)));
    count.textContent = String(i + 1).padStart(2, '0');
  };
  set(0);
  let st = null;
  if (!reduced) {
    st = ScrollTrigger.create({
      trigger: pin, start: 'top top', end: () => `+=${innerHeight * n * 0.6}`, pin: true,
      onUpdate: (s) => set(Math.min(n - 1, Math.floor(s.progress * n))),
    });
  }
  $$('[data-ind-btn]').forEach((b) => b.addEventListener('click', () => {
    const i = +b.dataset.indBtn;
    if (st) scrollTo(st.start + ((i + 0.5) / n) * (st.end - st.start));
    else set(i);
  }));
}

// ---------------------------------------------------------------------------
// LIBRARY teaser — a cross-section that cycles through sizes and schedules.
// ---------------------------------------------------------------------------
export function initXsecDemo(root = $('[data-xsec-demo]')) {
  if (!root) return;
  const wall = $('[data-xs-wall]', root), od = $('[data-xs-od]', root), odt = $('[data-xs-odt]', root);
  const out = { nps: $('[data-xs-nps]', root), sch: $('[data-xs-sch]', root), wt: $('[data-xs-wt]', root), kg: $('[data-xs-kg]', root) };
  const seq = [[10, '40'], [10, '80'], [10, '160'], [10, 'XXS'], [5, '80'], [12, '160'], [8, '40'], [15, '80']];
  const st = { ro: 150, ri: 140 };
  const draw = () => {
    wall.setAttribute('d', ring(200, 200, st.ro, st.ri));
    od.setAttribute('x1', 200 - st.ro); od.setAttribute('x2', 200 + st.ro);
  };
  let k = 0;
  const step = () => {
    const [i, sch] = seq[k++ % seq.length];
    const [nps, odmm, w] = PIPE[i];
    const wt = w[sch];
    const s = 165 / odmm;
    gsap.to(st, { ro: 165, ri: (odmm / 2 - wt) * 2 * s, duration: 1.2, ease: 'expo.inOut', onUpdate: draw });
    out.nps.textContent = nps; out.sch.textContent = sch === 'XXS' ? 'XXS' : `SCH ${sch}`;
    out.wt.textContent = `${wt.toFixed(2)} mm`; out.kg.textContent = `${weight(odmm, wt).toFixed(2)} kg/m`;
    odt.textContent = `Ø ${odmm.toFixed(1)} mm`;
  };
  draw();
  step();
  if (reduced) return;
  let t = null;
  ScrollTrigger.create({ trigger: root, start: 'top bottom', end: 'bottom top',
    onToggle: (s) => { clearInterval(t); if (s.isActive) t = setInterval(step, 2400); } });
}

export default function initHome() {
  initHero();
  initRange();
  initSupply();
  initIndustries();
  initXsecDemo();
  return { intro: heroIntro };
}
