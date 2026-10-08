import { CATEGORIES, PRODUCTS } from '../data.js';
import { I } from './icons.js';
import { page, pageHero, esc, btn } from './layout.js';
import { productCard } from './shared.js';

export default function products() {
  const media = `
  <div class="phero__float" aria-hidden="true">
    <img src="assets/img/cat/flanges.webp" alt="" data-float="1">
    <img src="assets/img/cat/valves.webp" alt="" data-float="2">
    <img src="assets/img/cat/butt-welded-fittings.webp" alt="" data-float="3">
  </div>`;
  const chips = [`<button class="chip is-active" type="button" data-filter="all" aria-pressed="true">All<span>${PRODUCTS.length}</span></button>`]
    .concat(CATEGORIES.map((c) => `<button class="chip" type="button" data-filter="${c.slug}" aria-pressed="false">${esc(c.name)}<span>${c.count}</span></button>`))
    .join('');
  const groups = CATEGORIES.map((c) => {
    const items = PRODUCTS.filter((p) => p.cat === c.slug);
    return `
  <section class="cgroup" id="${c.slug}" data-group="${c.slug}">
    <header class="cgroup__head">
      <span class="cgroup__n">${String(c.n).padStart(2, '0')}</span>
      <div class="cgroup__title"><h2>${esc(c.name)}</h2><p>${esc(c.blurb)}</p></div>
      <div class="cgroup__img" aria-hidden="true"><img src="${c.img}" alt="" loading="lazy"></div>
      <span class="cgroup__count"><b data-group-count>${items.length}</b> / ${items.length} lines</span>
    </header>
    <div class="pgrid">${items.map((p, i) => productCard(p, '', { lazy: c.n > 1 || i > 3 })).join('')}</div>
  </section>`;
  }).join('');

  const body = `
${pageHero({
  eyebrowText: `${PRODUCTS.length} product lines · ${CATEGORIES.length} families`,
  title: 'Our <em>products.</em>',
  lead: 'Pipes, fittings, flanges, valves, hoses, couplings, gaskets, insulation, instrumentation and structural steel — built to international standards. Add items to your enquiry list and request one consolidated quotation.',
  crumbs: [['Products']],
  media,
  cls: 'phero--products',
})}

<div class="catalogue" data-catalogue>
  <div class="toolbar" data-toolbar>
    <div class="toolbar__inner wrap">
      <label class="search">
        ${I.search}
        <input type="search" placeholder="Search — try “PN16”, “duplex”, “camlock”" aria-label="Search products" data-search>
        <kbd>/</kbd>
      </label>
      <div class="chips" role="toolbar" aria-label="Filter by product family" data-chips>${chips}</div>
      <p class="toolbar__count" aria-live="polite"><b data-count-shown>${PRODUCTS.length}</b> of ${PRODUCTS.length}</p>
    </div>
  </div>
  <div class="wrap catalogue__groups">
    ${groups}
    <div class="empty" data-empty hidden>
      <p class="empty__title">No matches — but we can likely source it.</p>
      <p>Our catalogue lists our core range. Send us the specification and we'll check availability with our manufacturer partners.</p>
      ${btn('contact.html', 'Ask our sales team')}
    </div>
  </div>
</div>

<section class="sourcing-cta">
  <div class="wrap sourcing-cta__inner">
    <p class="sourcing-cta__k">Can’t see the exact size, rating or material?</p>
    <h2 class="h2" data-split>We source to <em>your specification.</em></h2>
    <div class="sourcing-cta__ctas">
      ${btn('contact.html', 'Send a specification')}
      ${btn('downloads.html', 'Technical library', { variant: 'ghost', icon: I.file })}
    </div>
  </div>
</section>
`;
  return page({
    id: 'products',
    title: 'Products — AQM Oilfield Equipments Trading F.Z.C',
    desc: `${PRODUCTS.length} product lines across ${CATEGORIES.length} families: pipes & tubings, flanges, butt-welded and threaded fittings, valves, hoses, camlocks, gaskets, insulation, gauges and structural steel.`,
    body,
  });
}
