import { SITE, CATEGORIES } from '../data.js';
import { I, mark } from './icons.js';

export const esc = (s) =>
  String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

const NAV = [
  ['home', 'index.html', 'Home'],
  ['about', 'about.html', 'About'],
  ['products', 'products.html', 'Products'],
  ['downloads', 'downloads.html', 'Downloads'],
  ['contact', 'contact.html', 'Contact'],
];

// Text that rolls up on hover: two stacked copies of the label.
export const roll = (t) => `<span class="roll" data-text="${esc(t)}"><span>${esc(t)}</span></span>`;

export const eyebrow = (n, t) => `<p class="eyebrow"><span class="eyebrow__n">${n}</span>${esc(t)}</p>`;

export function btn(href, label, { variant = 'solid', icon = I.arrow, attrs = '' } = {}) {
  return `<a class="btn btn--${variant}" href="${href}" data-magnetic ${attrs}><span class="btn__fill"></span>${roll(label)}<span class="btn__icon">${icon}</span></a>`;
}

function header(b, page) {
  const links = NAV.map(
    ([id, href, label]) =>
      `<a class="hdr__link" href="${b}${href}"${id === page ? ' aria-current="page"' : ''}>${roll(label)}</a>`,
  ).join('');
  return `
<a class="skip" href="#main">Skip to content</a>
<header class="hdr" data-hdr>
  <a class="hdr__brand" href="${b}index.html" aria-label="AQM Oilfield Equipments Trading — home">
    ${mark('hm')}
    <span class="hdr__brandtxt"><b>AQM Oilfield</b><small>Equipments Trading F.Z.C</small></span>
  </a>
  <nav class="hdr__nav" aria-label="Primary">${links}</nav>
  <div class="hdr__actions">
    <button class="rfq-btn" type="button" data-rfq-open aria-label="Open enquiry list">
      ${I.list}<span class="rfq-btn__label">Enquiry</span><span class="rfq-btn__count" data-rfq-count>0</span>
    </button>
    <a class="btn btn--solid btn--sm hdr__cta" href="${b}contact.html" data-magnetic><span class="btn__fill"></span>${roll("Let's talk")}</a>
    <button class="menu-btn" type="button" data-menu-toggle aria-expanded="false" aria-controls="menu" aria-label="Menu"><span></span><span></span></button>
  </div>
  <div class="hdr__progress" aria-hidden="true"><i data-progress></i></div>
</header>

<div class="menu" id="menu" data-menu aria-hidden="true">
  <div class="menu__bg"></div>
  <nav class="menu__nav" aria-label="Mobile">
    ${NAV.map(([id, href, label], i) => `<a class="menu__link" href="${b}${href}"${id === page ? ' aria-current="page"' : ''}><span class="menu__n">0${i + 1}</span>${esc(label)}</a>`).join('')}
  </nav>
  <div class="menu__foot">
    <a href="tel:${SITE.tel}">${I.phone}${esc(SITE.phone)}</a>
    <a href="mailto:${SITE.email}">${I.mail}${esc(SITE.email)}</a>
    <span class="status" data-status><i></i><span>Ajman office</span></span>
  </div>
</div>`;
}

function footer(b) {
  const cats = CATEGORIES.map((c) => `<li><a href="${b}products.html#${c.slug}">${esc(c.name)}</a></li>`).join('');
  return `
<footer class="ftr" data-footer>
  <div class="ftr__cta wrap">
    ${eyebrow('(→)', 'Start a project')}
    <h2 class="ftr__title" data-split>Let’s build something that <em>holds pressure.</em></h2>
    <div class="ftr__ctas">
      ${btn(`${b}contact.html`, 'Request a quotation')}
      ${btn(`https://wa.me/${SITE.whatsapp}`, 'WhatsApp us', { variant: 'ghost', icon: I.whatsapp, attrs: 'target="_blank" rel="noopener"' })}
    </div>
  </div>

  <div class="ftr__grid wrap">
    <div class="ftr__col ftr__col--about">
      <a class="ftr__brand" href="${b}index.html" aria-label="Home">${mark('fm')}</a>
      <p>AQM Oilfield Equipments Trading FZC supplies industrial piping materials including pipes, flanges, fittings, and valves for oil &amp; gas, construction, marine, and industrial sectors across the UAE and international markets.</p>
      <div class="ftr__social">
        <a href="#" aria-label="Facebook" data-social>${I.facebook}</a>
        <a href="#" aria-label="Instagram" data-social>${I.instagram}</a>
        <a href="#" aria-label="X (Twitter)" data-social>${I.x}</a>
        <a href="#" aria-label="YouTube" data-social>${I.youtube}</a>
      </div>
    </div>
    <div class="ftr__col">
      <h3 class="ftr__h">Products</h3>
      <ul class="ftr__list ftr__list--cols">${cats}</ul>
    </div>
    <div class="ftr__col">
      <h3 class="ftr__h">Contact</h3>
      <ul class="ftr__list">
        <li><a href="tel:${SITE.tel}">${esc(SITE.phone)}</a></li>
        <li><a href="mailto:${SITE.email}">${esc(SITE.email)}</a></li>
        <li><a href="https://wa.me/${SITE.whatsapp}" target="_blank" rel="noopener">WhatsApp</a></li>
      </ul>
      <h3 class="ftr__h">Visit</h3>
      <address>${SITE.address.map(esc).join('<br>')}</address>
    </div>
    <div class="ftr__col">
      <h3 class="ftr__h">Opening hours</h3>
      <dl class="hours">
        <div><dt>Monday – Saturday</dt><dd>8:00am – 6:30pm</dd></div>
        <div><dt>Sunday &amp; holidays</dt><dd>Closed</dd></div>
      </dl>
      <p class="status status--block" data-status><i></i><span>Ajman office</span></p>
      <p class="ftr__clock">Local time in Ajman <b data-clock>--:--</b></p>
    </div>
  </div>

  <div class="ftr__mega" aria-hidden="true"><span data-mega>AQM</span></div>

  <div class="ftr__base wrap">
    <p>© 2026 ${esc(SITE.name)}</p>
    <nav class="ftr__legal" aria-label="Legal">
      <a href="${b}legal.html#terms">Terms of use</a><a href="${b}legal.html#trademark">Trademark</a>
      <a href="${b}legal.html#cookies">Cookie policy</a><a href="${b}legal.html#privacy">Privacy policy</a>
    </nav>
    <button class="totop" type="button" data-totop aria-label="Back to top">${I.arrowUp}</button>
  </div>
</footer>`;
}

function overlays(b) {
  return `
<aside class="drawer" data-drawer aria-hidden="true" aria-label="Enquiry list">
  <div class="drawer__scrim" data-rfq-close></div>
  <div class="drawer__panel" role="dialog" aria-modal="true" aria-labelledby="drawer-title">
    <div class="drawer__head">
      <p class="eyebrow"><span class="eyebrow__n">RFQ</span>Request for quotation</p>
      <h2 id="drawer-title">Your enquiry list</h2>
      <button class="icon-btn" type="button" data-rfq-close aria-label="Close">${I.close}</button>
    </div>
    <ol class="drawer__list" data-rfq-list></ol>
    <div class="drawer__empty" data-rfq-empty>
      <p>Your list is empty.</p>
      <p class="muted">Add products from the catalogue and send one consolidated enquiry — by email, WhatsApp or the contact form.</p>
      ${btn(`${b}products.html`, 'Browse the catalogue', { variant: 'ghost' })}
    </div>
    <div class="drawer__foot" data-rfq-foot>
      <a class="btn btn--solid btn--block" href="${b}contact.html#form" data-magnetic><span class="btn__fill"></span>${roll('Continue to enquiry form')}<span class="btn__icon">${I.arrow}</span></a>
      <div class="drawer__alt">
        <a class="btn btn--ghost" href="#" data-rfq-wa target="_blank" rel="noopener"><span class="btn__fill"></span>${roll('WhatsApp')}<span class="btn__icon">${I.whatsapp}</span></a>
        <a class="btn btn--ghost" href="#" data-rfq-mail><span class="btn__fill"></span>${roll('Email')}<span class="btn__icon">${I.mail}</span></a>
      </div>
      <button class="link-btn" type="button" data-rfq-clear>Clear list</button>
    </div>
  </div>
</aside>

<a class="wa-fab" href="https://wa.me/${SITE.whatsapp}" target="_blank" rel="noopener" aria-label="Chat on WhatsApp" data-magnetic>
  ${I.whatsapp}<span>Chat on WhatsApp</span>
</a>

<div class="toast" data-toast role="status" aria-live="polite"></div>

<div class="shutter" data-shutter aria-hidden="true">
  <div class="shutter__gate shutter__gate--top"></div>
  <div class="shutter__gate shutter__gate--bot"></div>
  <div class="shutter__mark">${mark('sm')}</div>
</div>

<div class="cursor" data-cursor-el aria-hidden="true"><span class="cursor__ring"></span><span class="cursor__dot"></span><span class="cursor__label" data-cursor-label></span></div>
<div class="grain" aria-hidden="true"></div>`;
}

function preloader() {
  // Pressure gauge: 0–100 dial, the needle sweeps as the page warms up.
  const ticks = [];
  for (let i = 0; i <= 50; i++) {
    const a = (-225 + (i / 50) * 270) * (Math.PI / 180);
    const major = i % 5 === 0;
    const r1 = major ? 78 : 83;
    ticks.push(
      `<line x1="${(100 + Math.cos(a) * r1).toFixed(2)}" y1="${(100 + Math.sin(a) * r1).toFixed(2)}" x2="${(100 + Math.cos(a) * 90).toFixed(2)}" y2="${(100 + Math.sin(a) * 90).toFixed(2)}" class="${major ? 'maj' : ''}${i >= 40 ? ' red' : ''}"/>`,
    );
  }
  const nums = [0, 20, 40, 60, 80, 100]
    .map((v, i) => {
      const a = (-225 + (i / 5) * 270) * (Math.PI / 180);
      return `<text x="${(100 + Math.cos(a) * 64).toFixed(1)}" y="${(100 + Math.sin(a) * 64 + 3.5).toFixed(1)}">${v}</text>`;
    })
    .join('');
  return `
<div class="loader" data-loader aria-hidden="true">
  <div class="loader__inner">
    <svg class="gauge" viewBox="0 0 200 200">
      <circle class="gauge__rim" cx="100" cy="100" r="97"/>
      <circle class="gauge__face" cx="100" cy="100" r="93"/>
      <path class="gauge__arc" d="M 36.36 163.64 A 90 90 0 1 1 163.64 163.64" pathLength="100" data-gauge-arc/>
      <g class="gauge__ticks">${ticks.join('')}</g>
      <g class="gauge__nums">${nums}</g>
      <text class="gauge__unit" x="100" y="138">BAR</text>
      <g class="gauge__needle" data-gauge-needle><path d="M100 104 L97.6 100 L100 24 L102.4 100 Z"/><circle cx="100" cy="100" r="7"/></g>
    </svg>
    <div class="loader__meta">
      <span>Pressure test</span>
      <span class="loader__num"><b data-loader-num>000</b>%</span>
    </div>
    <p class="loader__brand">AQM Oilfield Equipments Trading F.Z.C</p>
  </div>
</div>`;
}

export function page({ title, desc, id, body, base = '', preload = false, scripts = [] }) {
  const b = base;
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>${esc(title)}</title>
<meta name="description" content="${esc(desc)}">
<meta name="theme-color" content="#05080f">
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(desc)}">
<meta property="og:type" content="website">
<link rel="icon" href="${b}assets/img/brand/favicon.svg" type="image/svg+xml">
<link rel="stylesheet" href="${b}assets/css/main.css">
<script>(function(h){h.classList.add('js');try{if(sessionStorage.getItem('aqm-nav'))h.classList.add('is-entering');if(sessionStorage.getItem('aqm-seen'))h.classList.add('seen')}catch(e){}if(matchMedia('(prefers-reduced-motion: reduce)').matches)h.classList.add('seen')})(document.documentElement)</script>
</head>
<body data-page="${id}" data-base="${b}">
${preload ? preloader() : ''}
${header(b, id)}
<main id="main">
${body}
</main>
${footer(b)}
${overlays(b)}
${scripts.map((s) => `<script src="${b}assets/js/${s}.js" defer></script>`).join('\n')}
<script src="${b}assets/js/app.js" defer></script>
</body>
</html>
`;
}

// Shared page hero for interior pages.
export function pageHero({ eyebrowText, title, lead, crumbs = [], media = '', cls = '', b = '' }) {
  const trail = [['Home', `${b}index.html`], ...crumbs]
    .map(([t, h], i, a) => (i < a.length - 1 && h ? `<a href="${h}">${esc(t)}</a>` : `<span aria-current="page">${esc(t)}</span>`))
    .join('<i>/</i>');
  return `
<section class="phero ${cls}" data-phero>
  ${media}
  <div class="phero__inner wrap">
    <nav class="crumbs" aria-label="Breadcrumb">${trail}</nav>
    ${eyebrowText ? `<p class="eyebrow"><span class="eyebrow__n">●</span>${esc(eyebrowText)}</p>` : ''}
    <h1 class="phero__title" data-split="chars">${title}</h1>
    ${lead ? `<p class="phero__lead" data-reveal>${lead}</p>` : ''}
  </div>
  <div class="phero__rule" aria-hidden="true"><span></span></div>
</section>`;
}
