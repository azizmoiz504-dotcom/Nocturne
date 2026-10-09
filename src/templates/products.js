import { CATEGORIES, PRODUCTS, SITE } from '../data.js';
import { I } from './icons.js';
import { page, pageHead, esc, btn } from './layout.js';
import { productCard } from './shared.js';

export default function products() {
  const side = `
  <aside class="cside" aria-label="Filter by category">
    <p class="cside__h">Categories</p>
    <div class="cside__list" role="group" data-filters>
      <button class="cfilter is-on" type="button" data-filter="all" aria-pressed="true"><span>All products</span><b>${PRODUCTS.length}</b></button>
      ${CATEGORIES.map((c) => `<button class="cfilter" type="button" data-filter="${c.slug}" aria-pressed="false"><span>${esc(c.name)}</span><b>${c.count}</b></button>`).join('')}
    </div>
    <div class="cside__help">
      <p><b>Can't find a size or grade?</b> We source to specification. Call the counter.</p>
      <a href="tel:${SITE.tel}">${I.phone}${esc(SITE.phone)}</a>
    </div>
  </aside>`;

  const groups = CATEGORIES.map((c) => {
    const items = PRODUCTS.filter((p) => p.cat === c.slug);
    return `
    <section class="cgroup" id="${c.slug}" data-group="${c.slug}">
      <header class="cgroup__head">
        <img src="${c.img}" alt="" width="240" height="98" loading="lazy">
        <div>
          <h2><span>${String(c.n).padStart(2, '0')}</span>${esc(c.name)}</h2>
          <p>${esc(c.blurb)}</p>
        </div>
      </header>
      <div class="pgrid">${items.map((p, i) => productCard(p, '', { lazy: c.n > 1 || i > 3 })).join('')}</div>
    </section>`;
  }).join('');

  const body = `
${pageHead({ title: 'Products', lead: `${PRODUCTS.length} product lines in ${CATEGORIES.length} categories. Tap <b>Add to quote</b> to build a list for the counter.`, crumbs: [['Products']] })}
<div class="catalogue wrap" data-catalogue>
  ${side}
  <div class="cmain">
    <div class="ctools" data-ctools>
      <label class="csearch">
        ${I.search}
        <span class="sr">Search the catalogue</span>
        <input type="search" placeholder="Search by name, size or grade" autocomplete="off" enterkeyhint="search" data-cat-search>
      </label>
      <div class="cchips" role="group" aria-label="Filter by category" data-chips>
        <button class="chip is-on" type="button" data-filter="all" aria-pressed="true">All <b>${PRODUCTS.length}</b></button>
        ${CATEGORIES.map((c) => `<button class="chip" type="button" data-filter="${c.slug}" aria-pressed="false">${esc(c.short)} <b>${c.count}</b></button>`).join('')}
      </div>
      <p class="ccount" aria-live="polite">Showing <b data-shown>${PRODUCTS.length}</b> of ${PRODUCTS.length}<button class="linkbtn" type="button" data-reset hidden>Clear filters</button></p>
    </div>
    ${groups}
    <div class="empty" data-empty hidden>
      <p class="empty__t">No matching products</p>
      <p>Try another word or a size like “2 inch” or “PN16”. If it isn't listed, we can usually source it.</p>
      ${btn(`tel:${SITE.tel}`, `Call ${SITE.phone}`, { kind: 'red', icon: I.phone })}
    </div>
  </div>
</div>`;
  return page({
    id: 'products',
    title: 'Pipes, Fittings, Valves & Hoses Catalogue | Fakhri Tools',
    path: 'products.html',
    crumbs: [['Products', 'products.html']],
    desc: `Pipes, butt-weld and threaded fittings, GI and MI fittings, flanges, valves, camlocks, hoses, gaskets, steel and gauges. Quotes from Al Quoz, Dubai.`,
    body,
  });
}
