// Header behaviour, mobile menu, product search, copy buttons, tape and reveals.
import { SEARCH } from '../data.js';
import { $, $$, BASE, esc, norm, session, copyText, toast, dialog, reduced } from './util.js';

export function initHeader() {
  const hdr = $('[data-hdr]');
  if (!hdr) return;
  const root = document.documentElement;
  const search = $('.search', hdr);
  const setH = () => {
    root.style.setProperty('--hdr-h', `${hdr.offsetHeight}px`);
    root.style.setProperty('--hdr-row', `${Math.max(0, search.offsetTop - 8)}px`);
  };
  setH();
  if ('ResizeObserver' in window) new ResizeObserver(setH).observe(hdr);
  else addEventListener('resize', setH);

  let lastY = scrollY;
  let ticking = false;
  const update = () => {
    ticking = false;
    const y = scrollY;
    hdr.classList.toggle('is-stuck', hdr.getBoundingClientRect().top <= 0 && y > 0);
    // On phones the search row folds away while scrolling down and returns on the way up.
    const typing = hdr.contains(document.activeElement) && document.activeElement.matches('input');
    if (!typing && Math.abs(y - lastY) > 6) {
      const compact = y > lastY && y > 260;
      hdr.classList.toggle('is-compact', compact);
      root.classList.toggle('hdr-compact', compact);
      lastY = y;
    }
  };
  addEventListener('scroll', () => {
    if (!ticking) {
      ticking = true;
      requestAnimationFrame(update);
    }
  }, { passive: true });
  update();
}

export function initMenu() {
  const el = $('[data-menu]');
  const btn = $('[data-menu-open]');
  if (!el || !btn) return;
  const d = dialog(el, '[data-menu-close]', {
    onOpen: () => btn.setAttribute('aria-expanded', 'true'),
    onClose: () => btn.setAttribute('aria-expanded', 'false'),
  });
  btn.addEventListener('click', d.open);
  // Category links on the products page filter in place; close the menu so the result is visible.
  el.addEventListener('click', (e) => {
    if (e.target.closest('a[href*="#"]')) d.close();
  });
}

// Header search: instant suggestions from the catalogue index, Enter opens the filtered catalogue.
const INDEX = SEARCH.map(([slug, name, cat, ref]) => ({ slug, name, cat, ref, hay: norm(`${name} ${cat} ${ref} ${slug.replace(/-/g, ' ')}`) }));

function highlight(name, toks) {
  const low = name.toLowerCase();
  const marks = new Array(name.length).fill(false);
  for (const t of toks) {
    let i = low.indexOf(t);
    while (t && i !== -1) {
      for (let k = i; k < i + t.length; k++) marks[k] = true;
      i = low.indexOf(t, i + t.length);
    }
  }
  let out = '';
  let open = false;
  for (let k = 0; k < name.length; k++) {
    if (marks[k] !== open) {
      out += open ? '</mark>' : '<mark>';
      open = marks[k];
    }
    out += esc(name[k]);
  }
  return out + (open ? '</mark>' : '');
}

export function findProducts(q) {
  const toks = norm(q).split(' ').filter(Boolean);
  if (!toks.length) return { toks, hits: [] };
  const hits = INDEX.filter((p) => toks.every((t) => p.hay.includes(t)))
    .map((p) => {
      const n = p.name.toLowerCase();
      const i = n.indexOf(toks[0]);
      return { p, score: (i === 0 ? 0 : i > 0 ? 1 : 2) * 100 + p.name.length };
    })
    .sort((a, b) => a.score - b.score)
    .map((x) => x.p);
  return { toks, hits };
}

export function initSearch() {
  const form = $('form[data-search]');
  if (!form) return;
  const input = $('[data-search-input]', form);
  const pop = $('[data-search-pop]', form);
  let active = -1;

  const items = () => $$('.sugg', pop);
  const close = () => {
    pop.hidden = true;
    active = -1;
    input.setAttribute('aria-expanded', 'false');
  };
  const setActive = (i) => {
    const list = items();
    active = (i + list.length) % list.length;
    list.forEach((el, k) => el.classList.toggle('is-on', k === active));
    list[active] && list[active].scrollIntoView({ block: 'nearest' });
  };

  input.setAttribute('role', 'combobox');
  input.setAttribute('aria-autocomplete', 'list');
  input.setAttribute('aria-expanded', 'false');
  pop.id = 'search-pop';
  pop.setAttribute('role', 'listbox');
  input.setAttribute('aria-controls', pop.id);

  function render() {
    const q = input.value.trim();
    if (!q) return close();
    const { toks, hits } = findProducts(q);
    const top = hits.slice(0, 6);
    pop.innerHTML = top.length
      ? top
          .map((p) => `<a class="sugg" role="option" href="${BASE}products/${p.slug}.html"><span class="sugg__ref">${p.ref}</span><span class="sugg__name">${highlight(p.name, toks)}</span><span class="sugg__cat">${esc(p.cat)}</span></a>`)
          .join('') +
        `<a class="sugg sugg--all" role="option" href="${BASE}products.html" data-sugg-all><span>${hits.length > top.length ? `See all ${hits.length} results` : 'Show in catalogue'}</span><span aria-hidden="true">→</span></a>`
      : `<p class="sugg__none">No product called “${esc(q)}”. Try a shorter word, or call us: we can usually source it.</p>`;
    pop.hidden = false;
    active = -1;
    input.setAttribute('aria-expanded', 'true');
  }

  function go(q) {
    close();
    input.blur();
    if (document.body.dataset.page === 'products') {
      dispatchEvent(new CustomEvent('ft:search', { detail: q }));
    } else {
      session.set('ft-q', q);
      location.href = `${BASE}products.html`;
    }
  }

  input.addEventListener('input', render);
  input.addEventListener('focus', () => input.value.trim() && render());
  input.addEventListener('keydown', (e) => {
    if (pop.hidden) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActive(active + 1);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActive(active - 1);
    } else if (e.key === 'Escape') {
      close();
    } else if (e.key === 'Enter' && active >= 0) {
      e.preventDefault();
      items()[active].click();
    }
  });
  pop.addEventListener('click', (e) => {
    if (e.target.closest('[data-sugg-all]')) {
      e.preventDefault();
      go(input.value.trim());
    }
  });
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const q = input.value.trim();
    if (q) go(q);
    else input.focus();
  });
  form.addEventListener('focusout', (e) => {
    if (!form.contains(e.relatedTarget)) setTimeout(close, 120);
  });
}

export function initCopy() {
  document.addEventListener('click', async (e) => {
    const b = e.target.closest('[data-copy]');
    if (!b) return;
    const ok = await copyText(b.dataset.copy);
    toast(ok ? `Copied: ${b.dataset.copy}` : 'Copy failed: select the text and copy it manually');
  });
}

// The tape measure slides a little as the page scrolls.
export function initTape() {
  const tracks = $$('.tape__track');
  if (!tracks.length || reduced()) return;
  let ticking = false;
  const update = () => {
    ticking = false;
    for (const t of tracks) {
      const max = t.offsetWidth - t.parentElement.offsetWidth;
      t.style.transform = `translate3d(${-Math.min(max, scrollY * 0.35)}px,0,0)`;
    }
  };
  addEventListener('scroll', () => {
    if (!ticking) {
      ticking = true;
      requestAnimationFrame(update);
    }
  }, { passive: true });
}

// Gentle reveal for section furniture; content is visible without JS or with reduced motion.
export function initReveal() {
  if (reduced() || !('IntersectionObserver' in window)) return;
  const els = $$('.sec__head, .ct, .step, .stock li, .rcard, .visit__map, .band__table');
  const io = new IntersectionObserver((entries) => {
    for (const en of entries) {
      if (!en.isIntersecting) continue;
      en.target.classList.add('is-in');
      io.unobserve(en.target);
    }
  }, { rootMargin: '0px 0px -8% 0px' });
  const vh = innerHeight;
  els.forEach((el, i) => {
    if (el.getBoundingClientRect().top < vh) return; // already on screen: leave alone
    el.classList.add('rv');
    el.style.transitionDelay = `${(i % 4) * 50}ms`;
    io.observe(el);
  });
}

// On phones the store map zooms in around the pin so labels stay readable.
export function initMap() {
  const maps = $$('svg[data-map]');
  if (!maps.length) return;
  const fit = () => {
    for (const svg of maps) {
      const [w, h, x, y] = svg.dataset.map.split(' ').map(Number);
      const narrow = svg.parentElement.clientWidth < 600;
      const cw = 560;
      const ch = 470;
      const x0 = Math.max(0, Math.min(w - cw, x - cw * 0.28));
      const y0 = Math.max(0, Math.min(h - ch, y - ch * 0.55));
      svg.setAttribute('viewBox', narrow ? `${x0} ${y0} ${cw} ${ch}` : `0 0 ${w} ${h}`);
    }
  };
  fit();
  addEventListener('resize', fit);
}
