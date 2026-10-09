import { SITE, CATEGORIES, PRODUCTS, PIPE } from '../data.js';
import { I } from './icons.js';
import { page, esc, btn, label, status, storeSchema, abs } from './layout.js';
import { productCard, categoryTile, tape, steps, visit } from './shared.js';
import { weight } from '../js/pipe.js';

const bySlug = (s) => PRODUCTS.find((p) => p.slug === s);

function hero() {
  const picks = ['cs-flanges', 'butterfly-valves', 'ss-threaded-fittings-class-150', 'pressure-gauges'].map(bySlug);
  return `
<section class="hero">
  <div class="wrap hero__grid">
    <div class="hero__copy">
      ${label('Al Quoz Industrial Area 3 · Dubai', 'label--red')}
      <h1 class="hero__t">Pipes, fittings, valves <span>&amp; workshop materials</span></h1>
      <p class="hero__lead">${PRODUCTS.length} product lines across ${CATEGORIES.length} categories, from flanges and fittings to hoses, gaskets, structural steel and gauges. Build a quote list here, then call or visit our counter.</p>
      <div class="hero__ctas">
        ${btn('products.html', 'Browse products', { kind: 'red' })}
        ${btn(`tel:${SITE.tel}`, SITE.phone, { kind: 'navy', icon: I.phone })}
      </div>
      <ul class="hero__facts">
        <li>${status()}</li>
        <li>${I.clock}<span>Mon–Sat 7:30am – 6:00pm · Sun closed</span></li>
        <li>${I.pin}<a href="${SITE.maps}" target="_blank" rel="noopener">Wh #8, 8th Street, Al Quoz Ind. 3</a></li>
      </ul>
    </div>
    <div class="hero__board" aria-label="Featured products">
      ${picks.map((p) => `
      <a class="peg" href="products/${p.slug}.html">
        <span class="peg__hook" aria-hidden="true"></span>
        <img src="${p.img}" alt="" width="300" height="300" fetchpriority="high">
        <span class="peg__ref">Ref ${p.ref}</span>
        <span class="peg__name">${esc(p.name)}</span>
      </a>`).join('')}
    </div>
  </div>
</section>
${tape()}`;
}

function categories() {
  return `
<section class="sec" id="categories">
  <div class="wrap">
    <div class="sec__head">
      <div>${label('Shop by category')}<h2 class="h2">What we stock</h2></div>
      ${btn('products.html', `All ${PRODUCTS.length} products`, { kind: 'line' })}
    </div>
    <div class="ctgrid">${CATEGORIES.map((c) => categoryTile(c)).join('')}</div>
  </div>
</section>`;
}

function featured() {
  const picks = ['ss-flanges', 'flange-end-valves', 'y-strainers', 'spiral-wound-gaskets', 'cs-butt-welded-seamless-fittings',
    'long-barrel-nipples', 'grooved-firefighting-couplings', 'hydraulic-hoses'].map(bySlug);
  return `
<section class="sec sec--grey" id="featured">
  <div class="wrap">
    <div class="sec__head">
      <div>${label('From the catalogue')}<h2 class="h2">Flanges, fittings &amp; valves</h2></div>
      ${btn('products.html', 'See the full range', { kind: 'line' })}
    </div>
    <div class="rail" data-rail>${picks.map((p) => productCard(p)).join('')}</div>
  </div>
</section>`;
}

function howTo() {
  return `
<section class="sec" id="how">
  <div class="wrap">
    <div class="sec__head">
      <div>${label('Ordering')}<h2 class="h2">How ordering works</h2></div>
    </div>
    ${steps()}
  </div>
</section>`;
}

function pipeBand() {
  const rows = ['2″', '4″', '6″', '8″'].map((n) => PIPE.find((p) => p[0] === n));
  return `
<section class="band">
  <div class="wrap band__grid">
    <div>
      ${label('Free tool', 'label--light')}
      <h2 class="h2 h2--light">Pipe schedule chart</h2>
      <p class="band__lead">Check outside diameter, wall thickness, bore and weight per metre for ½″ to 24″ pipe in SCH 40, 80, 160 and XXS before you order.</p>
      ${btn('pipe-chart.html', 'Open the pipe chart', { kind: 'red', icon: I.ruler })}
    </div>
    <div class="band__table">
      <table class="mini">
        <caption>Carbon steel, SCH 40 (ASME B36.10M)</caption>
        <thead><tr><th>NPS</th><th>OD mm</th><th>Wall mm</th><th>kg/m</th></tr></thead>
        <tbody>${rows.map(([n, od, w]) => `<tr><th>${n}</th><td>${od.toFixed(1)}</td><td>${w['40'].toFixed(2)}</td><td>${weight(od, w['40']).toFixed(2)}</td></tr>`).join('')}</tbody>
      </table>
    </div>
  </div>
</section>`;
}

export default function home() {
  return page({
    id: 'home',
    title: 'Fakhri Tools Al Quoz | Pipes, Fittings & Valves in Dubai',
    path: '',
    schema: [storeSchema(), { '@context': 'https://schema.org', '@type': 'WebSite', name: SITE.short, alternateName: SITE.name, url: abs() }],
    desc: `Pipes, fittings, flanges, valves, hoses, gaskets, steel and gauges at our counter in Al Quoz Industrial Area 3, Dubai. Call ${SITE.phone} for a quote.`,
    body: `${hero()}${categories()}${featured()}${howTo()}${pipeBand()}${visit()}`,
  });
}
