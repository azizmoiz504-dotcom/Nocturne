import { SITE, CATEGORIES, PRODUCTS, PARTNERS, SOURCING, VALUES, OBJECTIVES, VISION, MISSION, TEAM } from '../data.js';
import { I } from './icons.js';
import { page, pageHero, esc, eyebrow, btn } from './layout.js';
import { partnersBlock } from './shared.js';

const SECTORS = ['Oil & gas', 'Marine', 'HVAC', 'Firefighting', 'Construction', 'Engineering', 'Refineries', 'Petrochemical plants'];
const VALUE_ICONS = [I.seal, I.check, I.network, I.clock, I.grid, I.gauge];

function flow() {
  // Source → hub → markets, drawn as a live supply-line diagram.
  const left = [...SOURCING.map((s) => [s.code, s.name]), ['+', 'Other global markets']];
  const right = [['AE', 'United Arab Emirates'], ['GCC', 'Gulf Cooperation Council'], ['AF', 'African markets']];
  const ly = (i) => 40 + i * (520 / (left.length - 1));
  const ry = (i) => 140 + i * 160;
  const paths = left
    .map((_, i) => `<path class="flow__line" d="M210 ${ly(i)} C 380 ${ly(i)}, 420 300, 560 300"/>`)
    .concat(right.map((_, i) => `<path class="flow__line flow__line--out" d="M640 300 C 780 300, 820 ${ry(i)}, 990 ${ry(i)}"/>`))
    .join('');
  return `
<section class="flow" id="network">
  <div class="wrap">
    <div class="flow__head">
      ${eyebrow('(02)', 'How we supply')}
      <h2 class="h2" data-split>Global sourcing, <em>local delivery.</em></h2>
    </div>
    <div class="flow__diagram" data-flow>
      <svg viewBox="0 0 1200 600" preserveAspectRatio="xMidYMid meet" aria-hidden="true">
        <g class="flow__paths">${paths}</g>
        <circle class="flow__hub-ring" cx="600" cy="300" r="74"/>
        <circle class="flow__hub-ring flow__hub-ring--2" cx="600" cy="300" r="104"/>
      </svg>
      <ul class="flow__col flow__col--l">${left.map(([c, n]) => `<li><b>${c}</b><span>${esc(n)}</span></li>`).join('')}</ul>
      <div class="flow__hub"><small>Hub</small><b>Ajman</b><span>Free Zone, UAE</span></div>
      <ul class="flow__col flow__col--r">${right.map(([c, n]) => `<li><b>${c}</b><span>${esc(n)}</span></li>`).join('')}</ul>
    </div>
  </div>
</section>`;
}

export default function about() {
  const media = `<div class="phero__media" data-phero-media><img src="assets/img/photo/office.webp" alt="" fetchpriority="high"></div>`;
  const figs = [
    [CATEGORIES.length, 'Product families'],
    [PRODUCTS.length, 'Product lines', '+'],
    [PARTNERS.length, 'Manufacturer partners'],
    [SOURCING.length, 'Sourcing countries', '+'],
  ];
  const body = `
${pageHero({
  eyebrowText: 'About AQM Oilfield',
  title: 'Dedicated to <em>quality.</em>',
  lead: 'A UAE-based trading company specialising in the supply of oilfield and industrial equipment to diverse sectors — built on certified materials, reliable logistics and long-term partnerships.',
  crumbs: [['About us']],
  media,
  cls: 'phero--media',
})}

<section class="story" id="introduction">
  <div class="wrap story__grid">
    <div class="story__copy">
      ${eyebrow('(01)', 'Introduction')}
      <h2 class="h2" data-split>AQM Oilfield Equipments <em>Trading F.Z.C</em></h2>
      <div class="story__text" data-stagger>
        <p class="lead">A UAE-based trading company specialising in the supply of oilfield and industrial equipment to diverse sectors. Partnering with leading manufacturers from Germany, the UK, China, Taiwan, Singapore, Malaysia, India, and other global markets, we provide products that meet international standards and project requirements.</p>
        <p>Our product line includes pipes, fittings, flanges, valves, hoses, camlock couplings, instrumentation items, firefighting equipment, and various industrial accessories — delivered with a focus on quality, timely delivery, and professional service to clients in the UAE, GCC, and African markets.</p>
        <p>With a focus on sourcing certified materials and reliable logistics within the UAE, we support our clients with responsive, dependable, and consistent supply solutions for both project and operational requirements.</p>
      </div>
    </div>
    <div class="story__media" data-clip><img src="assets/img/photo/yard.webp" alt="Industrial supply yard with pipes, flanges and hose reels ready for dispatch" loading="lazy" data-parallax-img></div>
  </div>
  <dl class="figures figures--4 wrap" data-stagger>
    ${figs.map(([n, t, sup]) => `<div class="fig"><dt>${esc(t)}</dt><dd><span data-count="${n}">${n}</span>${sup ? `<sup>${sup}</sup>` : ''}</dd></div>`).join('')}
  </dl>
</section>

${flow()}

<section class="sectors" id="sectors">
  <div class="wrap">
    ${eyebrow('(03)', 'Sectors we serve')}
    <p class="sectors__list" data-sectors>${SECTORS.map((s) => `<span>${esc(s)}</span>`).join(' <i>/</i> ')}</p>
  </div>
</section>

<section class="objectives" id="objectives">
  <div class="wrap objectives__grid">
    <div class="objectives__head">
      ${eyebrow('(04)', 'Our objectives')}
      <h2 class="h2" data-split>Where we’re <em>headed.</em></h2>
    </div>
    <ol class="olist" data-stagger>
      ${OBJECTIVES.map((o, i) => `<li><span class="olist__n">OBJ—0${i + 1}</span><span class="olist__t">${esc(o)}</span><span class="olist__bar" aria-hidden="true"></span></li>`).join('')}
    </ol>
  </div>
</section>

<section class="vm" id="vision">
  <div class="wrap vm__grid">
    <article class="vm__card" data-reveal>
      ${eyebrow('(05)', 'Vision')}
      <p class="vm__text">${esc(VISION)}</p>
    </article>
    <article class="vm__card" data-reveal>
      ${eyebrow('(06)', 'Mission')}
      <p class="vm__text">${esc(MISSION)}</p>
    </article>
  </div>
</section>

<section class="values" id="values">
  <div class="wrap">
    <div class="values__head">
      ${eyebrow('(07)', 'Our values')}
      <h2 class="h2" data-split>Six principles, <em>one standard.</em></h2>
    </div>
    <div class="values__grid" data-stagger>
      ${VALUES.map((v, i) => `
      <article class="vcard" data-tilt>
        <span class="vcard__icon">${VALUE_ICONS[i]}</span>
        <span class="vcard__n">0${i + 1}</span>
        <h3>${esc(v.t)}</h3>
        <p>${esc(v.d)}</p>
      </article>`).join('')}
    </div>
  </div>
</section>

<section class="team" id="team">
  <div class="wrap">
    <div class="team__head">
      ${eyebrow('(08)', 'Our leaders')}
      <h2 class="h2" data-split>The team <em>behind AQM.</em></h2>
    </div>
    <div class="team__grid" data-stagger>
      ${TEAM.map((t, i) => `
      <figure class="person${i === 0 ? ' person--lead' : ''}">
        <div class="person__img"><img src="assets/img/team/${t.slug}.webp" alt="${esc(t.name)}, ${esc(t.role)}" loading="lazy"></div>
        <figcaption><b>${esc(t.name)}</b><span>${esc(t.role)}</span></figcaption>
      </figure>`).join('')}
    </div>
  </div>
</section>

${partnersBlock({ n: '(09)' })}
`;
  return page({
    id: 'about',
    title: 'About Us — AQM Oilfield Equipments Trading F.Z.C',
    desc: 'UAE-based trading company supplying oilfield & industrial equipment, partnering with manufacturers from Germany, the UK, China, Taiwan, Singapore, Malaysia and India.',
    body,
  });
}
