import { gsap, ScrollTrigger, $, $$, reduced, finePointer, scrollTo } from '../env.js';
import { PIPE } from '../../data.js';
import { ring, weight, toIn } from '../pipe.js';

// ---------------------------------------------------------------------------
// Products — filter chips, live search, deep links (#flanges).
// ---------------------------------------------------------------------------
export function initCatalogue() {
  const root = $('[data-catalogue]');
  if (!root) return;
  const cards = $$('[data-pcard]', root), groups = $$('[data-group]', root), chips = $$('[data-filter]', root);
  const input = $('[data-search]', root), shown = $('[data-count-shown]'), empty = $('[data-empty]');
  let cat = 'all', q = '';

  const apply = (animate = true) => {
    const terms = q.toLowerCase().split(/\s+/).filter(Boolean);
    let total = 0;
    const visible = [];
    groups.forEach((g) => {
      let n = 0;
      const inCat = cat === 'all' || g.dataset.group === cat;
      $$('[data-pcard]', g).forEach((c) => {
        const ok = inCat && terms.every((t) => c.dataset.search.includes(t));
        c.classList.toggle('is-hidden', !ok);
        if (ok) { n++; visible.push(c); }
      });
      g.classList.toggle('is-hidden', n === 0);
      $('[data-group-count]', g).textContent = n;
      total += n;
    });
    shown.textContent = total;
    empty.hidden = total > 0;
    chips.forEach((c) => { const on = c.dataset.filter === cat; c.classList.toggle('is-active', on); c.setAttribute('aria-pressed', on); });
    if (animate && !reduced) gsap.fromTo(visible.slice(0, 16), { autoAlpha: 0, y: 24 }, { autoAlpha: 1, y: 0, duration: 0.8, stagger: 0.03, ease: 'expo.out', clearProps: 'transform,opacity,visibility' });
    ScrollTrigger.refresh();
  };
  const toTop = () => scrollTo(root, { offset: -2 });

  chips.forEach((c) => c.addEventListener('click', () => {
    cat = c.dataset.filter;
    history.replaceState(null, '', cat === 'all' ? location.pathname : `#${cat}`);
    apply();
    toTop();
    c.scrollIntoView({ inline: 'center', block: 'nearest', behavior: 'smooth' });
  }));
  let t;
  input.addEventListener('input', () => { clearTimeout(t); t = setTimeout(() => { q = input.value.trim(); apply(); }, 140); });
  addEventListener('keydown', (e) => {
    if (e.key === '/' && document.activeElement !== input && !/input|textarea/i.test(document.activeElement?.tagName)) { e.preventDefault(); input.focus(); }
  });
  const fromHash = () => {
    const h = decodeURIComponent(location.hash.slice(1));
    if (h && chips.some((c) => c.dataset.filter === h)) { cat = h; apply(false); setTimeout(toTop, 300); }
  };
  addEventListener('hashchange', fromHash);
  fromHash();
}

// ---------------------------------------------------------------------------
// Product detail — inspect-on-hover zoom.
// ---------------------------------------------------------------------------
export function initProduct() {
  const frame = $('[data-zoom]');
  if (!frame || !finePointer) return;
  frame.addEventListener('pointerenter', () => frame.classList.add('is-zoom'));
  frame.addEventListener('pointerleave', () => frame.classList.remove('is-zoom'));
  frame.addEventListener('pointermove', (e) => {
    const r = frame.getBoundingClientRect();
    frame.style.setProperty('--zx', `${((e.clientX - r.left) / r.width) * 100}%`);
    frame.style.setProperty('--zy', `${((e.clientY - r.top) / r.height) * 100}%`);
  });
}

// ---------------------------------------------------------------------------
// Downloads — document filters, brochure tilt, pipe schedule explorer.
// ---------------------------------------------------------------------------
export function initDownloads() {
  const tabs = $$('[data-tab]'), docs = $$('[data-doc]');
  tabs.forEach((t) => t.addEventListener('click', () => {
    const g = t.dataset.tab;
    tabs.forEach((x) => { x.classList.toggle('is-active', x === t); x.setAttribute('aria-pressed', x === t); });
    const vis = [];
    docs.forEach((d) => { const on = g === 'all' || d.dataset.doc === g; d.classList.toggle('is-hidden', !on); if (on) vis.push(d); });
    if (!reduced) gsap.fromTo(vis, { autoAlpha: 0, x: -16 }, { autoAlpha: 1, x: 0, duration: 0.7, stagger: 0.025, ease: 'expo.out' });
    ScrollTrigger.refresh();
  }));

  const stage = $('[data-brochure]');
  if (stage && finePointer && !reduced) {
    const bk = $('.bk', stage);
    stage.addEventListener('pointermove', (e) => {
      const r = stage.getBoundingClientRect();
      const px = (e.clientX - r.left) / r.width - 0.5, py = (e.clientY - r.top) / r.height - 0.5;
      bk.style.setProperty('--ry', `${-18 + px * 30}deg`);
      bk.style.setProperty('--rx', `${6 - py * 16}deg`);
    });
    stage.addEventListener('pointerleave', () => { bk.style.removeProperty('--ry'); bk.style.removeProperty('--rx'); });
  }
  if (stage && !reduced) gsap.from($('.bk', stage), { rotateY: -70, rotateX: 20, y: 80, autoAlpha: 0, duration: 2, ease: 'expo.out', scrollTrigger: { trigger: stage, start: 'top 80%', once: true } });

  initExplorer();
}

function initExplorer() {
  const root = $('[data-explorer]');
  if (!root) return;
  const q = (s) => $(s, root);
  const wall = q('[data-ex-wall]'), hatch = q('[data-ex-hatch]'), glow = q('[data-ex-glow]');
  const dimOD = q('[data-ex-dim-od]'), tl = q('[data-ex-tick-l]'), tr = q('[data-ex-tick-r]'), odt = q('[data-ex-dim-odt]');
  const dimWT = q('[data-ex-dim-wt]'), wtt = q('[data-ex-dim-wtt]');
  const npsBtns = $$('[data-nps]', root), schBtns = $$('[data-sch]', root);
  const out = (k) => q(`[data-ex-${k}]`);
  const MAXR = 250; // px radius for the largest pipe (24″)
  const maxOD = PIPE[PIPE.length - 1][1];
  let ni = PIPE.findIndex((p) => p[0] === '6″'), sch = '40';
  const st = { ro: 0, ri: 0 };
  const vals = { od: 0, wt: 0, inner: 0, kg: 0 }; // note: `id` is reserved by GSAP

  const draw = () => {
    const { ro, ri } = st;
    wall.setAttribute('d', ring(300, 300, ro, ri));
    hatch.setAttribute('d', ring(300, 300, ro, ri));
    glow.setAttribute('r', ro + 14);
    dimOD.setAttribute('x1', 300 - ro); dimOD.setAttribute('x2', 300 + ro);
    tl.setAttribute('x1', 300 - ro); tl.setAttribute('x2', 300 - ro);
    tr.setAttribute('x1', 300 + ro); tr.setAttribute('x2', 300 + ro);
    dimWT.setAttribute('x1', 300 + ri); dimWT.setAttribute('x2', 300 + ro);
    dimWT.setAttribute('y1', 300); dimWT.setAttribute('y2', 300);
    wtt.setAttribute('x', 300 + ro + 10); wtt.setAttribute('y', 296);
  };
  const paint = () => {
    out('od').textContent = vals.od.toFixed(1);
    out('wt').textContent = vals.wt.toFixed(2);
    out('id').textContent = vals.inner.toFixed(2);
    out('kg').textContent = vals.kg.toFixed(2);
    out('od-in').textContent = `${toIn(vals.od)} in`;
    out('wt-in').textContent = `${toIn(vals.wt)} in`;
    out('id-in').textContent = `${toIn(vals.inner)} in`;
    out('lb').textContent = `${(vals.kg * 0.671969).toFixed(2)} lb/ft`;
  };
  const update = (instant) => {
    const [nps, od, walls] = PIPE[ni];
    if (!walls[sch]) sch = '160';
    const wt = walls[sch];
    // Sizes are compressed so ½″ and 24″ both read; the wall-to-diameter ratio stays exact.
    const ro = MAXR * Math.pow(od / maxOD, 0.42);
    const scale = ro / (od / 2);
    const target = { ro, ri: (od / 2 - wt) * scale };
    const tv = { od, wt, inner: od - 2 * wt, kg: weight(od, wt) };
    const d = instant || reduced ? 0 : 1.1;
    gsap.to(st, { ...target, duration: d, ease: 'expo.inOut', onUpdate: draw });
    gsap.to(vals, { ...tv, duration: d * 0.8, ease: 'power3.out', onUpdate: paint });
    odt.textContent = `Ø ${od.toFixed(1)} mm`;
    wtt.textContent = `WT ${wt.toFixed(2)}`;
    q('[data-ex-nps-label]').textContent = nps;
    q('[data-ex-scale]').textContent = `Wall shown true to diameter · ${(wt / od * 100).toFixed(1)}% of OD`;
    npsBtns.forEach((b, i) => b.classList.toggle('is-active', i === ni));
    schBtns.forEach((b) => { b.classList.toggle('is-active', b.dataset.sch === sch); b.disabled = !walls[b.dataset.sch]; });
  };
  npsBtns.forEach((b, i) => b.addEventListener('click', () => { ni = i; update(); }));
  schBtns.forEach((b) => b.addEventListener('click', () => { sch = b.dataset.sch; update(); }));
  update(true);
  if (!reduced) {
    st.ro = 0; st.ri = 0;
    ScrollTrigger.create({ trigger: root, start: 'top 70%', once: true, onEnter: () => update() });
  }
}

// ---------------------------------------------------------------------------
// Contact — map draws its coastline when it scrolls in.
// ---------------------------------------------------------------------------
export function initContact() {
  const m = $('[data-umap]');
  if (!m) return;
  ScrollTrigger.create({ trigger: m, start: 'top 80%', once: true, onEnter: () => m.classList.add('is-in') });
  if (!reduced) gsap.from($$('.umap__place, .umap__hq, .umap__sea', m), { autoAlpha: 0, y: 10, stagger: 0.08, duration: 1, delay: 0.8, scrollTrigger: { trigger: m, start: 'top 80%', once: true } });
}
