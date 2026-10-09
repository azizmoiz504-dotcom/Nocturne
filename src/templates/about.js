import { SITE, CATEGORIES, PRODUCTS } from '../data.js';
import { I } from './icons.js';
import { page, pageHead, esc, btn, label, storeSchema } from './layout.js';
import { steps, visit } from './shared.js';

export default function about() {
  const body = `
${pageHead({ title: 'About Fakhri Tools', crumbs: [['About']] })}
<section class="sec sec--tight">
  <div class="wrap about">
    <div class="about__copy">
      <p class="about__lead">${esc(SITE.name)} supplies pipes, fittings, flanges, valves and workshop materials from our warehouse counter in Al Quoz Industrial Area 3, Dubai.</p>
      <p>We keep ${PRODUCTS.length} product lines across ${CATEGORIES.length} categories: carbon and stainless steel pipe and fittings, GI and MI fittings, flanges, valves and strainers, camlocks and couplings, hoses and flexible connectors, gaskets, structural steel, insulation, and pressure and temperature gauges.</p>
      <p>Workshops, contractors and maintenance teams can browse the full range online, put together a quote list with quantities, and call or walk in to confirm stock and price. Every product has a ref number, so a phone order is quick and clear.</p>
      <div class="about__ctas">
        ${btn('products.html', 'Browse products', { kind: 'red' })}
        ${btn(`tel:${SITE.tel}`, SITE.phone, { kind: 'line', icon: I.phone })}
      </div>
    </div>
    <figure class="about__logo"><img src="assets/img/brand/logo-stacked.svg" alt="Fakhri Tools &amp; Workshop Materials Trading LLC logo" width="484" height="309"></figure>
  </div>
</section>

<section class="sec sec--grey">
  <div class="wrap">
    <div class="sec__head"><div>${label('Range')}<h2 class="h2">What we stock</h2></div></div>
    <ul class="stock">
      ${CATEGORIES.map((c) => `<li><a href="products.html#${c.slug}"><span class="stock__n">${String(c.n).padStart(2, '0')}</span><span class="stock__t">${esc(c.name)}<small>${esc(c.blurb)}</small></span><b>${c.count}</b></a></li>`).join('')}
    </ul>
  </div>
</section>

<section class="sec">
  <div class="wrap">
    <div class="sec__head"><div>${label('Ordering')}<h2 class="h2">How ordering works</h2></div></div>
    ${steps()}
  </div>
</section>

${visit()}`;
  return page({
    id: 'about',
    title: 'About Fakhri Tools | Workshop Materials, Al Quoz Dubai',
    path: 'about.html',
    crumbs: [['About', 'about.html']],
    schema: [storeSchema()],
    desc: `${SITE.name}: pipes, fittings, flanges, valves and workshop materials from Al Quoz Industrial Area 3, Dubai.`,
    body,
  });
}
