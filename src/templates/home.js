import { SITE, CATEGORIES, PRODUCTS, PARTNERS, INDUSTRIES, WHY, SOURCING, DOWNLOADS } from '../data.js';
import { I } from './icons.js';
import { page, esc, eyebrow, btn, roll } from './layout.js';
import { partnersBlock, talkBlock, blueprint } from './shared.js';

const WHY_ICONS = [I.truck, I.seal, I.tag, I.network];

function hero() {
  return `
<section class="hero" data-hero>
  <div class="hero__pin" data-hero-pin>
    <div class="hero__bg" aria-hidden="true"><div class="hero__glow hero__glow--a"></div><div class="hero__glow hero__glow--b"></div><div class="hero__grid"></div></div>
    ${blueprint()}
    <canvas class="hero__gl" data-hero-canvas aria-hidden="true"></canvas>
    <img class="hero__fallback" src="assets/img/cat/flanges.webp" alt="" aria-hidden="true">
    <div class="hero__veil" data-hero-veil aria-hidden="true"></div>

    <div class="hero__frame" aria-hidden="true"><i></i><i></i><i></i><i></i></div>

    <div class="hero__copy hero__copy--a wrap" data-hero-a>
      <p class="eyebrow hero__eyebrow"><span class="eyebrow__n">●</span>Oilfield &amp; industrial equipment — Ajman Free Zone, UAE</p>
      <h1 class="hero__title" aria-label="Built for pressure.">
        <span class="hero__line"><span data-hero-word>Built</span> <span data-hero-word>for</span></span>
        <span class="hero__line hero__line--em"><em data-hero-word>pressure.</em></span>
      </h1>
      <div class="hero__row">
        <p class="hero__lead" data-hero-lead>Pipes, flanges, fittings, valves and industrial materials — sourced from trusted manufacturers worldwide and delivered across the UAE, GCC and Africa.</p>
        <div class="hero__ctas" data-hero-ctas>
          ${btn('products.html', 'Explore the catalogue')}
          ${btn('contact.html', 'Request a quote', { variant: 'ghost', icon: I.arrowUR })}
        </div>
      </div>
    </div>

    <div class="hero__copy hero__copy--b wrap" data-hero-b aria-hidden="true">
      <p class="eyebrow"><span class="eyebrow__n">●</span>Pipes · Flanges · Fittings · Valves</p>
      <p class="hero__statement">Every connection,<br><em>engineered to hold.</em></p>
    </div>

    <div class="hero__copy hero__copy--c" data-hero-c aria-hidden="true">
      <p class="hero__into">Into the line<span>.</span></p>
    </div>

    <dl class="hud" data-hud aria-hidden="true">
      <div><dt>Assembly</dt><dd>WN flange · RF · spiral-wound gasket</dd></div>
      <div><dt>Bolt-up sequence</dt><dd class="hud__seq" data-hud-seq>${[1, 5, 3, 7, 2, 6, 4, 8].map((n) => `<span>${n}</span>`).join('')}</dd></div>
      <div><dt>Torque</dt><dd><b data-hud-torque>000</b>%</dd></div>
      <div><dt>Status</dt><dd data-hud-status>Exploded view</dd></div>
    </dl>

    <div class="hero__scroll" data-hero-scroll aria-hidden="true"><span>Scroll to assemble</span><i></i></div>
  </div>
</section>`;
}

function intro() {
  const figs = [
    [CATEGORIES.length, 'Product families'],
    [PRODUCTS.length, 'Product lines'],
    [PARTNERS.length, 'Manufacturer partners'],
    [SOURCING.length, 'Sourcing countries'],
    [3, 'Regions served'],
  ];
  return `
<section class="intro" id="who">
  <div class="wrap intro__grid">
    <div class="intro__side">
      ${eyebrow('(01)', 'Who we are')}
      <div class="intro__media" data-clip>
        <img src="assets/img/photo/yard.webp" alt="Pipes, flanges and hoses laid out for dispatch at an industrial supply yard" loading="lazy" data-parallax-img>
      </div>
    </div>
    <div class="intro__main">
      <p class="intro__text" data-scrub-words>A UAE-based supplier of pipes, flanges, fittings, valves and industrial materials — partnering with leading manufacturers from Germany, the UK, China, Taiwan, Singapore, Malaysia and India to keep oil &amp; gas, marine, construction and fabrication moving across the UAE, GCC and Africa.</p>
      <div class="intro__foot">
        <p class="intro__small" data-reveal>We support oil &amp; gas companies, marine contractors, construction firms and fabrication industries with reliable sourcing and fast delivery across the UAE.</p>
        ${btn('about.html', 'About AQM', { variant: 'ghost' })}
      </div>
    </div>
  </div>
  <dl class="figures wrap" data-stagger>
    ${figs.map(([n, t]) => `<div class="fig"><dt>${esc(t)}</dt><dd><span data-count="${n}">${n}</span>${n === PRODUCTS.length ? '<sup>+</sup>' : ''}</dd></div>`).join('')}
  </dl>
</section>`;
}

function range() {
  const cards = CATEGORIES.map((c) => {
    const samples = PRODUCTS.filter((p) => p.cat === c.slug).slice(0, 3);
    return `
    <a class="rcard" href="products.html#${c.slug}" data-cursor="Explore" style="--i:${c.n}">
      <span class="rcard__n">${String(c.n).padStart(2, '0')}</span>
      <div class="rcard__img"><span class="rcard__halo"></span><img src="${c.img}" alt="${esc(c.name)}" loading="lazy" draggable="false"></div>
      <div class="rcard__body">
        <h3 class="rcard__title">${esc(c.name)}</h3>
        <p class="rcard__text">${esc(c.blurb)}</p>
        <ul class="rcard__list">${samples.map((p) => `<li>${esc(p.name)}</li>`).join('')}</ul>
        <div class="rcard__foot"><span class="rcard__count">${c.count} product lines</span><span class="rcard__go">${roll('Explore')}${I.arrow}</span></div>
      </div>
    </a>`;
  }).join('');
  return `
<section class="range" id="range" data-range>
  <div class="range__pin" data-range-pin>
    <div class="range__head wrap">
      <div>
        ${eyebrow('(02)', 'Our industrial product range')}
        <h2 class="h2" data-split>Twelve families. <em>One dependable source.</em></h2>
      </div>
      <div class="range__meta">
        <p class="range__counter"><b data-range-index>01</b><span>/ ${String(CATEGORIES.length).padStart(2, '0')}</span></p>
        <div class="range__bar"><i data-range-bar></i></div>
      </div>
    </div>
    <div class="range__viewport" data-range-viewport>
      <div class="range__track" data-range-track>
        <div class="range__pipe" aria-hidden="true"><i data-range-flow></i></div>
        ${cards}
        <a class="rcard rcard--end" href="products.html" data-cursor="View all">
          <span class="rcard__n">${PRODUCTS.length}</span>
          <div class="rcard__body">
            <h3 class="rcard__title">The complete catalogue</h3>
            <p class="rcard__text">Browse all ${PRODUCTS.length} product lines, filter by family, and build a single enquiry list for your project.</p>
            <span class="btn btn--solid"><span class="btn__fill"></span>${roll('Open the catalogue')}<span class="btn__icon">${I.arrow}</span></span>
          </div>
        </a>
      </div>
    </div>
  </div>
</section>`;
}

function supply() {
  return `
<section class="supply" id="supply" data-supply>
  <div class="supply__pin" data-supply-pin>
    <canvas class="supply__globe" data-globe aria-label="Globe showing supply lines from seven sourcing countries into Ajman and out to the GCC and Africa" role="img"></canvas>
    <div class="supply__copy wrap">
      ${eyebrow('(03)', 'Global supply lines')}
      <div class="supply__steps">
        <div class="sstep is-active" data-sstep>
          <h2 class="h2">Sourced from <em>seven countries.</em></h2>
          <p>We partner with leading manufacturers from Germany, the UK, China, Taiwan, Singapore, Malaysia, India and other global markets — products that meet international standards and project requirements.</p>
          <ul class="codes">${SOURCING.map((s) => `<li data-code="${s.code}"><b>${s.code}</b>${esc(s.name)}</li>`).join('')}</ul>
        </div>
        <div class="sstep" data-sstep>
          <h2 class="h2">Coordinated from <em>Ajman.</em></h2>
          <p>From our office in the Ajman Free Zone we focus on sourcing certified materials and reliable logistics within the UAE — responsive, dependable and consistent supply for project and operational requirements.</p>
          <p class="coords"><span>25.40° N</span><span>55.44° E</span><span>Ajman Free Zone</span></p>
        </div>
        <div class="sstep" data-sstep>
          <h2 class="h2">Delivered across the UAE, GCC <em>&amp; Africa.</em></h2>
          <p>Quality, timely delivery and professional service for clients across the UAE, the wider GCC and African markets.</p>
          <ul class="codes codes--out"><li><b>AE</b>UAE</li><li><b>GCC</b>Gulf region</li><li><b>AF</b>Africa</li></ul>
        </div>
      </div>
      <ol class="supply__dots" aria-hidden="true"><li class="is-active"></li><li></li><li></li></ol>
    </div>
    <div class="supply__legend" aria-hidden="true"><span class="lg lg--in">Inbound sourcing</span><span class="lg lg--out">Outbound delivery</span></div>
  </div>
</section>`;
}

function industries() {
  return `
<section class="inds" id="industries" data-inds>
  <div class="inds__pin" data-inds-pin>
    <div class="inds__media" aria-hidden="true">
      ${INDUSTRIES.map((x, i) => `<div class="inds__img${i === 0 ? ' is-active' : ''}" data-ind-img><img src="assets/img/ind/${x.slug}.webp" alt="" loading="${i ? 'lazy' : 'eager'}"></div>`).join('')}
      <div class="inds__shade"></div>
    </div>
    <div class="inds__inner wrap">
      <div class="inds__head">
        ${eyebrow('(04)', 'Our markets')}
        <h2 class="h2">Industries <em>we serve.</em></h2>
      </div>
      <ol class="inds__list">
        ${INDUSTRIES.map((x, i) => `<li class="ind${i === 0 ? ' is-active' : ''}" data-ind><button type="button" data-ind-btn="${i}"><span class="ind__n">0${i + 1}</span><span class="ind__name">${esc(x.name)}</span></button></li>`).join('')}
      </ol>
      <div class="inds__desc">
        ${INDUSTRIES.map((x, i) => `<p class="${i === 0 ? 'is-active' : ''}" data-ind-desc>${esc(x.text)}</p>`).join('')}
        <p class="inds__count"><b data-ind-count>01</b> / 0${INDUSTRIES.length}</p>
      </div>
    </div>
  </div>
</section>`;
}

function why() {
  return `
<section class="why" id="why">
  <div class="wrap">
    <div class="why__head">
      ${eyebrow('(05)', 'Our value')}
      <h2 class="h2" data-split>Why choose <em>AQM Oilfield?</em></h2>
      <p class="lead" data-reveal>Reliable industrial supply for the oil &amp; gas, construction and industrial sectors — high-quality materials, fast delivery and trusted sourcing from approved manufacturers.</p>
    </div>
    <div class="why__grid" data-stagger>
      ${WHY.map((w, i) => `
      <article class="wcard">
        <div class="wcard__top"><span class="wcard__icon">${WHY_ICONS[i]}</span><span class="wcard__n">0${i + 1}</span></div>
        <h3>${esc(w.t)}</h3>
        <p>${esc(w.d)}</p>
        <span class="wcard__line" aria-hidden="true"></span>
      </article>`).join('')}
    </div>
  </div>
  <blockquote class="pledge wrap">
    <p data-scrub-words>“${esc(SITE.tagline)}”</p>
  </blockquote>
</section>`;
}

function library() {
  const n = DOWNLOADS.length;
  return `
<section class="libt" id="library">
  <div class="wrap libt__grid">
    <div class="libt__copy">
      ${eyebrow('(07)', 'Technical library')}
      <h2 class="h2" data-split>The engineer’s <em>desk.</em></h2>
      <p class="lead" data-reveal>Our 2026 brochure, flange dimension charts across ASME, EN and JIS standards, and pipe schedule tables from SCH 5 to SCH 160 — ${n} documents, free to view and download. Plus an interactive pipe schedule explorer.</p>
      <ul class="libt__stats" data-stagger>
        <li><b>7</b><span>ASME B16.5 classes</span></li>
        <li><b>4</b><span>EN 1092-1 PN ratings</span></li>
        <li><b>4</b><span>JIS B2220 ratings</span></li>
        <li><b>11</b><span>Pipe schedules</span></li>
      </ul>
      <div class="libt__ctas">
        ${btn('downloads.html', 'Open the library')}
        ${btn('downloads.html#explorer', 'Pipe schedule explorer', { variant: 'ghost', icon: I.gauge })}
      </div>
    </div>
    <div class="libt__visual" data-xsec-demo aria-hidden="true">
      <svg viewBox="0 0 400 400" class="xsec">
        <defs>
          <radialGradient id="xsg" cx=".5" cy=".5" r=".5"><stop offset=".6" stop-color="#ff8a3d" stop-opacity="0"/><stop offset="1" stop-color="#ff8a3d" stop-opacity=".18"/></radialGradient>
          <linearGradient id="xsm" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#e9eef8"/><stop offset=".5" stop-color="#7f93bd"/><stop offset="1" stop-color="#c9d4ea"/></linearGradient>
        </defs>
        <g class="xsec__grid">${Array.from({ length: 9 }, (_, i) => `<line x1="${i * 50}" y1="0" x2="${i * 50}" y2="400"/><line x1="0" y1="${i * 50}" x2="400" y2="${i * 50}"/>`).join('')}</g>
        <circle cx="200" cy="200" r="170" fill="url(#xsg)"/>
        <path class="xsec__wall" data-xs-wall fill="url(#xsm)" fill-rule="evenodd" d=""/>
        <line class="xsec__axis" x1="20" y1="200" x2="380" y2="200"/><line class="xsec__axis" x1="200" y1="20" x2="200" y2="380"/>
        <g class="xsec__dim"><line data-xs-od x1="0" y1="372" x2="0" y2="372"/><text data-xs-odt x="200" y="392">OD</text></g>
      </svg>
      <dl class="xsec__read">
        <div><dt>NPS</dt><dd data-xs-nps>6″</dd></div>
        <div><dt>Schedule</dt><dd data-xs-sch>40</dd></div>
        <div><dt>Wall</dt><dd data-xs-wt>7.11 mm</dd></div>
        <div><dt>Weight</dt><dd data-xs-kg>28.26 kg/m</dd></div>
      </dl>
    </div>
  </div>
</section>`;
}

export default function home() {
  const body = `
${hero()}
${intro()}
${range()}
${supply()}
${industries()}
${why()}
${partnersBlock({ n: '(06)' })}
${library()}
${talkBlock({ n: '(08)' })}
`;
  return page({
    id: 'home',
    title: 'AQM Oilfield Equipments Trading F.Z.C — Built for pressure',
    desc: 'Trusted supplier of oilfield & industrial equipment in the UAE — pipes, flanges, fittings, valves, hoses, gaskets, gauges and structural steel from Ajman Free Zone to the UAE, GCC and Africa.',
    body,
    preload: true,
    scripts: ['hero'],
  });
}
