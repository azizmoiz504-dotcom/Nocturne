import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { SplitText } from 'gsap/SplitText';
import Lenis from 'lenis';

gsap.registerPlugin(ScrollTrigger, SplitText);
gsap.defaults({ ease: 'expo.out', duration: 1.1 });
ScrollTrigger.config({ ignoreMobileResize: true });

export { gsap, ScrollTrigger, SplitText };

export const html = document.documentElement;
export const body = document.body;
export const base = body.dataset.base || '';
export const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
export const finePointer = matchMedia('(hover: hover) and (pointer: fine)').matches;
export const isDesktop = () => matchMedia('(min-width: 861px)').matches;

export const $ = (s, el = document) => el.querySelector(s);
export const $$ = (s, el = document) => [...el.querySelectorAll(s)];
export const clamp01 = (v) => Math.min(1, Math.max(0, v));
export const range = (p, a, b) => clamp01((p - a) / (b - a));

// ---------------------------------------------------------------------------
// Smooth scroll — Lenis drives the page, GSAP's ticker drives Lenis.
// ---------------------------------------------------------------------------
export let lenis = null;
const scrollSubs = new Set();
export const onScroll = (fn) => scrollSubs.add(fn);

export function initScroll() {
  if (!reduced) {
    lenis = new Lenis({ duration: 1.15, easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)), smoothWheel: true, wheelMultiplier: 0.95 });
    lenis.on('scroll', (e) => {
      ScrollTrigger.update();
      scrollSubs.forEach((fn) => fn(e.scroll, e.velocity, e.direction));
    });
    gsap.ticker.add((t) => lenis.raf(t * 1000));
    gsap.ticker.lagSmoothing(0);
  } else {
    let last = scrollY;
    addEventListener('scroll', () => {
      const y = scrollY;
      scrollSubs.forEach((fn) => fn(y, y - last, Math.sign(y - last)));
      last = y;
    }, { passive: true });
  }
}

export function scrollTo(target, opts = {}) {
  if (lenis) lenis.scrollTo(target, { offset: 0, duration: 1.4, ...opts });
  else {
    const y = typeof target === 'number' ? target : (typeof target === 'string' ? $(target) : target)?.getBoundingClientRect().top + scrollY + (opts.offset || 0);
    if (y != null && !Number.isNaN(y)) window.scrollTo({ top: y, behavior: reduced ? 'auto' : 'smooth' });
  }
}

export const stopScroll = () => (lenis ? lenis.stop() : (html.style.overflow = 'hidden'));
export const startScroll = () => (lenis ? lenis.start() : (html.style.overflow = ''));
