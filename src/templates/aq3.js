import { SITE, CATEGORIES, PRODUCTS } from '../data.js';
import { OFFER } from '../campaign.js';
import { I } from './icons.js';
import { page, pageHead, esc, btn, label, storeSchema } from './layout.js';
import { productCard, visit } from './shared.js';

// Campaign landing page ("The Downtime Desk") for ads and printed codes: aq3.html?src=GADS etc.
// Kept out of Google (noindex) and the sitemap: it repeats the shop's own pages for paid and printed traffic.

const bySlug = (s) => PRODUCTS.find((p) => p.slug === s);

// Lines a maintenance team reaches for when something leaks, bursts or stops reading.
const PICKS = ['hydraulic-hoses', 'rubber-air-hose', 'ss-camlocks', 'epdm-nbr-cut-gaskets-sheets', 'pressure-gauges', 'threaded-socked-welded-valves', 'y-strainers', 'gi-threaded-fittings'];

function ways() {
  const wa = SITE.whatsapp ? `https://wa.me/${SITE.whatsapp}` : '';
  const items = wa
    ? [
        [I.list, 'Send the ref numbers', 'Every product on this site has a ref, like 08.07. Send the refs and quantities on WhatsApp, or build a quote list and tap <b>WhatsApp list</b>.'],
        [I.whatsapp, 'No ref? Send a photo', 'Photograph the broken part next to a tape or ruler and send it on WhatsApp. We match it from the counter.'],
        [I.phone, 'Or call the counter', `Call <a href="tel:${SITE.tel}">${esc(SITE.phone)}</a> and read out the refs. We confirm stock and price before you collect.`],
      ]
    : [
        [I.list, 'Find the ref number', 'Every product on this site has a ref, like 08.07. Search for the part or browse the categories below.'],
        [I.phone, 'Call and read out the refs', `Call <a href="tel:${SITE.tel}">${esc(SITE.phone)}</a> with the refs and quantities, or add them to a quote list and copy it.`],
        [I.check, 'We confirm before you come', 'We check availability, sizes and ratings against your list and confirm the price before you collect.'],
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

export default function aq3() {
  const picks = PICKS.map(bySlug).filter(Boolean);
  const ctas = [
    SITE.whatsapp ? btn(`https://wa.me/${SITE.whatsapp}`, 'WhatsApp the counter', { kind: 'red', icon: I.whatsapp, attrs: 'target="_blank" rel="noopener"' }) : '',
    btn(`tel:${SITE.tel}`, `Call ${SITE.phone}`, { kind: SITE.whatsapp ? 'navy' : 'red', icon: I.phone }),
    btn(SITE.maps, 'Get directions', { kind: 'line', icon: I.directions, attrs: 'target="_blank" rel="noopener"' }),
  ].join('');
  const offer = OFFER ? `<div class="offer" role="note"><div class="wrap"><p>${esc(OFFER)}</p></div></div>` : '';
  const body = `
${offer}
${pageHead({
  title: 'Something broke? <span>Get the part from Al Quoz.</span>',
  lead: `Pipes, fittings, valves, hoses, gaskets and gauges from the counter at Warehouse 8, 8th Street, Al Quoz Industrial Area 3. Open Monday to Saturday from 7:30am.`,
  crumbs: [['Order by ref']],
  extra: `<div class="about__ctas">${ctas}</div>`,
})}
<section class="sec sec--tight">
  <div class="wrap">
    <div class="sec__head"><div>${label('How to order')}<h2 class="h2">Three ways to get your part</h2></div></div>
    ${ways()}
  </div>
</section>

<section class="sec sec--grey">
  <div class="wrap">
    <div class="sec__head">
      <div>${label('Breakdown parts')}<h2 class="h2">Hoses, seals, gauges and valves</h2></div>
      ${btn('products.html', `All ${PRODUCTS.length} products`, { kind: 'line' })}
    </div>
    <div class="pgrid">${picks.map((p) => productCard(p)).join('')}</div>
  </div>
</section>

<section class="sec">
  <div class="wrap">
    <div class="sec__head"><div>${label('Range')}<h2 class="h2">All ${CATEGORIES.length} categories</h2></div></div>
    <ul class="stock">
      ${CATEGORIES.map((c) => `<li><a href="products.html#${c.slug}"><span class="stock__n">${String(c.n).padStart(2, '0')}</span><span class="stock__t">${esc(c.name)}<small>${esc(c.blurb)}</small></span><b>${c.count}</b></a></li>`).join('')}
    </ul>
  </div>
</section>

${visit({ heading: 'Find the counter: Warehouse 8, 8th Street' })}`;
  return page({
    id: 'aq3',
    title: 'Order Parts by Ref | Fakhri Tools, Al Quoz Industrial Area 3',
    path: 'aq3.html',
    robots: 'noindex, follow',
    schema: [storeSchema()],
    desc: `Pipes, fittings, valves, hoses, gaskets and gauges from ${SITE.name}, Warehouse 8, Al Quoz Industrial Area 3, Dubai. Call ${SITE.phone}.`,
    body,
  });
}
