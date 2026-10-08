import { SITE, CATEGORIES, MAP } from '../data.js';
import { I } from './icons.js';
import { esc, btn, hoursTable, status, label } from './layout.js';

export const catOf = (slug) => CATEGORIES.find((c) => c.slug === slug);

export function addButton(p, { cls = 'pc__add', withQty = false, text = 'Add to quote' } = {}) {
  const c = catOf(p.cat);
  return `<button class="${cls}" type="button" data-quote-add${withQty ? ' data-with-qty' : ''} data-slug="${p.slug}" data-name="${esc(p.name)}" data-ref="${p.ref}" data-cat="${esc(c.short)}" data-img="${p.img}">
    <span class="pc__add-ic pc__add-ic--plus">${I.plus}</span><span class="pc__add-ic pc__add-ic--check">${I.check}</span><span data-add-label>${esc(text)}</span>
  </button>`;
}

export function productCard(p, b = '', { lazy = true } = {}) {
  const c = catOf(p.cat);
  const hay = `${p.name} ${c.name} ${p.ref} ${p.desc}`.toLowerCase();
  return `
<article class="pc" data-pc data-cat="${p.cat}" data-search="${esc(hay)}">
  <a class="pc__link" href="${b}products/${p.slug}.html">
    <span class="pc__img"><img src="${b}${p.img}" alt="${esc(p.name)}" width="300" height="300" ${lazy ? 'loading="lazy"' : ''} decoding="async"></span>
    <span class="pc__ref">Ref ${p.ref}</span>
    <span class="pc__name">${esc(p.name)}</span>
    <span class="pc__cat">${esc(c.name)}</span>
  </a>
  ${addButton(p)}
</article>`;
}

export function categoryTile(c, b = '') {
  return `
<a class="ct" href="${b}products.html#${c.slug}">
  <span class="ct__img"><img src="${b}${c.img}" alt="" width="480" height="197" loading="lazy" decoding="async"></span>
  <span class="ct__body">
    <span class="ct__n">${String(c.n).padStart(2, '0')}</span>
    <span class="ct__name">${esc(c.name)}</span>
    <span class="ct__count">${c.count} lines ${I.arrow}</span>
  </span>
</a>`;
}

// A strip of measuring tape: 1 cm = 40 px, numbered every centimetre.
export function tape() {
  const nums = Array.from({ length: 64 }, (_, i) => `<span style="left:${(i + 1) * 40}px">${i + 1}</span>`).join('');
  return `<div class="tape" aria-hidden="true"><div class="tape__track">${nums}</div></div>`;
}

export function steps({ b = '' } = {}) {
  const items = [
    [I.list, 'Build your quote list', 'Browse the catalogue, tap <b>Add to quote</b> and set quantities. Every line has a ref number for easy ordering.'],
    [I.phone, 'Call or visit the counter', `Call <a href="tel:${SITE.tel}">${esc(SITE.phone)}</a> and read out your refs, or show the list on your phone at our Al Quoz counter.`],
    [I.check, 'We confirm stock and price', 'We check availability, sizes and ratings against your list and confirm the price before you collect.'],
  ];
  return `
<ol class="steps">
  ${items.map(([ic, t, d], i) => `
  <li class="step">
    <span class="step__n">${i + 1}</span>
    <span class="step__ic">${ic}</span>
    <h3>${t}</h3>
    <p>${d}</p>
  </li>`).join('')}
</ol>`;
}

export function storeMap() {
  const { w, h, land, places, store } = MAP;
  const grid = [];
  for (let x = 0; x <= w; x += 50) grid.push(`<line x1="${x}" y1="0" x2="${x}" y2="${h}"/>`);
  for (let y = 0; y <= h; y += 50) grid.push(`<line x1="0" y1="${y}" x2="${w}" y2="${y}"/>`);
  return `
<figure class="smap">
  <svg viewBox="0 0 ${w} ${h}" data-map="${w} ${h} ${store.x} ${store.y}" role="img" aria-label="Map of Dubai showing Fakhri Tools in Al Quoz Industrial Area 3">
    <rect class="smap__sea" width="${w}" height="${h}"/>
    <g class="smap__grid">${grid.join('')}</g>
    <path class="smap__land" d="${land}"/>
    <text class="smap__water" x="${w * 0.2}" y="${h * 0.3}">ARABIAN GULF</text>
    ${places.map((p) => `<g class="smap__place" transform="translate(${p.x} ${p.y})"><circle r="5"/><text x="11" y="5">${esc(p.name)}</text></g>`).join('')}
    <g class="smap__store" transform="translate(${store.x} ${store.y})"><g class="smap__mark">
      <circle class="smap__halo" r="34"/>
      <path class="smap__pin" d="M0 0c-4-10-16-18-16-30a16 16 0 0 1 32 0c0 12-12 20-16 30z"/>
      <circle class="smap__dot" cy="-30" r="6"/>
      <g transform="translate(26 -58)">
        <rect class="smap__tag" width="236" height="56" rx="6"/>
        <text class="smap__tag-k" x="14" y="24">FAKHRI TOOLS</text>
        <text class="smap__tag-v" x="14" y="44">Wh #8 · Al Quoz Ind. Area 3</text>
      </g>
    </g></g>
  </svg>
  <figcaption>Map is approximate. Use <b>Get directions</b> for turn-by-turn navigation.</figcaption>
</figure>`;
}

export function visit({ b = '', heading = 'Visit the counter', h = 'h2', id = 'visit' } = {}) {
  return `
<section class="visit" id="${id}">
  <div class="wrap visit__grid">
    <div class="visit__info">
      ${label('Store')}
      <${h} class="h2">${heading}</${h}>
      ${status('status--big')}
      <address class="visit__addr">${SITE.address.map(esc).join('<br>')}</address>
      <div class="visit__ctas">
        ${btn(SITE.maps, 'Get directions', { kind: 'red', icon: I.directions, attrs: 'target="_blank" rel="noopener"' })}
        ${btn(`tel:${SITE.tel}`, SITE.phone, { kind: 'line', icon: I.phone })}
      </div>
      ${hoursTable()}
      <p class="visit__clock">Dubai time now <b data-clock>--:--</b> (GST, UTC+4)</p>
    </div>
    <div class="visit__map">${storeMap()}</div>
  </div>
</section>`;
}
