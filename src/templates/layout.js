import { SITE, CATEGORIES, PRODUCTS } from '../data.js';
import { I } from './icons.js';

export const esc = (s) =>
  String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

const PAGES = [
  ['home', 'index.html', 'Home'],
  ['products', 'products.html', 'Products'],
  ['pipe-chart', 'pipe-chart.html', 'Pipe chart'],
  ['about', 'about.html', 'About'],
  ['contact', 'contact.html', 'Contact'],
];

export const label = (t, cls = '') => `<p class="label ${cls}">${esc(t)}</p>`;

export function btn(href, text, { kind = 'red', icon = I.arrow, attrs = '', cls = '' } = {}) {
  return `<a class="btn btn--${kind} ${cls}" href="${href}" ${attrs}><span>${esc(text)}</span>${icon || ''}</a>`;
}

// Hours rows, Monday first. data-day uses JS getDay() numbering (Sunday = 0).
export function hoursTable(cls = '') {
  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  return `<dl class="hours ${cls}" data-hours>${days
    .map((d, i) => `<div data-day="${(i + 1) % 7}"><dt>${d}</dt><dd>${i < 6 ? '7:30am – 6:00pm' : 'Closed'}</dd></div>`)
    .join('')}</dl>`;
}

export const status = (cls = '') => `<p class="status ${cls}" data-status><i></i><span>Mon–Sat 7:30am – 6:00pm</span></p>`;

function topbar() {
  return `
<div class="topbar">
  <div class="wrap topbar__in">
    ${status('status--light')}
    <a class="topbar__link topbar__addr" href="${SITE.maps}" target="_blank" rel="noopener">${I.pin}<span>${esc(SITE.addressLine)}</span></a>
    <a class="topbar__link" href="tel:${SITE.tel}">${I.phone}<span>${esc(SITE.phone)}</span></a>
  </div>
</div>`;
}

function header(b, page) {
  const cats = CATEGORIES.map((c) => `<a href="${b}products.html#${c.slug}" data-cat-link="${c.slug}">${esc(c.short)}</a>`).join('');
  const pages = PAGES.slice(2).map(([id, href, t]) => `<a href="${b}${href}"${id === page ? ' aria-current="page"' : ''}>${esc(t)}</a>`).join('');
  return `
<header class="hdr" data-hdr>
  <div class="wrap hdr__in">
    <a class="hdr__logo" href="${b}index.html"><img src="${b}assets/img/brand/logo-lockup.svg" alt="Fakhri Tools &amp; Workshop Materials Trading LLC" width="594" height="96"></a>
    <form class="search" role="search" action="${b}products.html" data-search>
      <label class="sr" for="q">Search products</label>
      <input id="q" type="search" placeholder="Search flanges, valves, PN16…" autocomplete="off" enterkeyhint="search" data-search-input>
      <button class="search__go" type="submit" aria-label="Search">${I.search}</button>
      <div class="search__pop" data-search-pop hidden></div>
    </form>
    <div class="hdr__act">
      <button class="qbtn" type="button" data-quote-open aria-label="Open quote list">${I.list}<span class="qbtn__t">Quote list</span><b class="badge" data-quote-count>0</b></button>
      <a class="btn btn--red hdr__call" href="tel:${SITE.tel}">${I.phone}<span>${esc(SITE.phone)}</span></a>
      <button class="menubtn" type="button" data-menu-open aria-label="Open menu" aria-controls="menu" aria-expanded="false">${I.menu}</button>
    </div>
  </div>
</header>
<nav class="catbar" aria-label="Product categories">
  <div class="wrap catbar__in">
    <div class="catbar__cats"><a href="${b}products.html" class="catbar__all"${page === 'products' ? ' aria-current="page"' : ''}>All products</a>${cats}</div>
    <div class="catbar__pages">${pages}</div>
  </div>
</nav>`;
}

function menu(b, page) {
  return `
<div class="menu" id="menu" data-menu hidden>
  <div class="menu__scrim" data-menu-close></div>
  <div class="menu__panel" role="dialog" aria-modal="true" aria-label="Menu">
    <div class="menu__head">
      <img src="${b}assets/img/brand/emblem.svg" alt="" width="40" height="40">
      <button class="iconbtn" type="button" data-menu-close aria-label="Close menu">${I.close}</button>
    </div>
    <nav class="menu__pages" aria-label="Pages">${PAGES.map(([id, href, t]) => `<a href="${b}${href}"${id === page ? ' aria-current="page"' : ''}>${esc(t)}${I.chev}</a>`).join('')}</nav>
    <p class="menu__h">Categories</p>
    <nav class="menu__cats" aria-label="Categories">${CATEGORIES.map((c) => `<a href="${b}products.html#${c.slug}">${esc(c.name)}<span>${c.count}</span></a>`).join('')}</nav>
    <div class="menu__foot">
      ${status()}
      <a class="btn btn--red btn--block" href="tel:${SITE.tel}">${I.phone}<span>Call ${esc(SITE.phone)}</span></a>
    </div>
  </div>
</div>`;
}

function drawer(b) {
  const extra = [
    SITE.email ? `<a class="btn btn--line" href="#" data-quote-mail>${I.mail}<span>Email list</span></a>` : '',
    SITE.whatsapp ? `<a class="btn btn--line" href="#" data-quote-wa target="_blank" rel="noopener">${I.whatsapp}<span>WhatsApp list</span></a>` : '',
  ].join('');
  return `
<div class="drawer" data-drawer hidden>
  <div class="drawer__scrim" data-quote-close></div>
  <section class="drawer__panel" role="dialog" aria-modal="true" aria-labelledby="dq-title">
    <header class="drawer__head">
      <div><p class="label">Quote list</p><h2 id="dq-title">Your quote list</h2></div>
      <button class="iconbtn" type="button" data-quote-close aria-label="Close quote list">${I.close}</button>
    </header>
    <ol class="drawer__list" data-quote-list></ol>
    <div class="drawer__empty" data-quote-empty>
      <p class="drawer__empty-t">Your list is empty.</p>
      <p>Add products from the catalogue with <b>Add to quote</b>, set quantities, then call us or bring the list to the counter.</p>
      ${btn(`${b}products.html`, 'Browse products', { kind: 'navy' })}
    </div>
    <footer class="drawer__foot" data-quote-foot>
      <p class="drawer__how">Call the counter and read out the refs and quantities, or show this list on your phone when you visit.</p>
      <a class="btn btn--red btn--block" href="tel:${SITE.tel}">${I.phone}<span>Call ${esc(SITE.phone)}</span></a>
      <div class="drawer__row">
        <button class="btn btn--line" type="button" data-quote-copy>${I.copy}<span>Copy list</span></button>
        <a class="btn btn--line" href="${b}contact.html#enquiry">${I.mail}<span>Add a message</span></a>
        ${extra}
      </div>
      <button class="linkbtn" type="button" data-quote-clear>Clear list</button>
    </footer>
  </section>
</div>`;
}

function mbar(b) {
  return `
<nav class="mbar" aria-label="Quick actions">
  <a href="tel:${SITE.tel}">${I.phone}<span>Call</span></a>
  <a href="${SITE.maps}" target="_blank" rel="noopener">${I.directions}<span>Directions</span></a>
  <button type="button" data-quote-open>${I.list}<span>Quote</span><b class="badge" data-quote-count>0</b></button>
  <a href="${b}products.html">${I.search}<span>Products</span></a>
</nav>`;
}

function footer(b) {
  const half = Math.ceil(CATEGORIES.length / 2);
  const catList = (list) => `<ul>${list.map((c) => `<li><a href="${b}products.html#${c.slug}">${esc(c.name)}</a></li>`).join('')}</ul>`;
  return `
<footer class="ftr">
  <div class="wrap ftr__grid">
    <div class="ftr__brand">
      <img src="${b}assets/img/brand/logo-lockup-white.svg" alt="Fakhri Tools &amp; Workshop Materials Trading LLC" width="594" height="96" loading="lazy">
      <p>Pipes, fittings, flanges, valves and workshop materials from our counter in Al Quoz Industrial Area 3, Dubai.</p>
      ${status('status--light')}
    </div>
    <div class="ftr__col ftr__col--cats"><h2 class="ftr__h">Products</h2><div class="ftr__cats">${catList(CATEGORIES.slice(0, half))}${catList(CATEGORIES.slice(half))}</div></div>
    <div class="ftr__col">
      <h2 class="ftr__h">Visit the counter</h2>
      <address>${SITE.address.map(esc).join('<br>')}</address>
      <a class="ftr__link" href="${SITE.maps}" target="_blank" rel="noopener">${I.directions}Get directions</a>
      <h2 class="ftr__h">Call</h2>
      <a class="ftr__tel" href="tel:${SITE.tel}">${esc(SITE.phone)}</a>
    </div>
    <div class="ftr__col">
      <h2 class="ftr__h">Opening hours</h2>
      ${hoursTable('hours--dark')}
      <p class="ftr__clock">Dubai time now <b data-clock>--:--</b></p>
    </div>
  </div>
  <div class="ftr__base">
    <div class="wrap ftr__base-in">
      <p>© 2026 ${esc(SITE.name)}</p>
      <nav aria-label="Site">${PAGES.map(([, href, t]) => `<a href="${b}${href}">${esc(t)}</a>`).join('')}<a href="${b}legal.html">Legal</a></nav>
    </div>
  </div>
</footer>`;
}

export function page({ title, desc, id, body, base = '' }) {
  const b = base;
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>${esc(title)}</title>
<meta name="description" content="${esc(desc)}">
<meta name="theme-color" content="#084767">
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(desc)}">
<meta property="og:type" content="website">
<link rel="icon" href="${b}assets/img/brand/favicon.svg" type="image/svg+xml">
<link rel="icon" href="${b}assets/img/brand/favicon-32.png" sizes="32x32" type="image/png">
<link rel="apple-touch-icon" href="${b}assets/img/brand/favicon-180.png">
<link rel="stylesheet" href="${b}assets/css/main.css">
<script>document.documentElement.classList.add('js')</script>
</head>
<body data-page="${id}" data-base="${b}">
<a class="skip" href="#main">Skip to content</a>
${topbar()}
${header(b, id)}
<main id="main">
${body}
</main>
${footer(b)}
${menu(b, id)}
${drawer(b)}
${mbar(b)}
<div class="toast" data-toast role="status" aria-live="polite"></div>
<script src="${b}assets/js/app.js" defer></script>
</body>
</html>
`;
}

// Compact page header for inner pages
export function pageHead({ title, lead = '', crumbs = [], b = '', extra = '' }) {
  const trail = [['Home', `${b}index.html`], ...crumbs]
    .map(([t, h], i, a) => (i < a.length - 1 && h ? `<a href="${h}">${esc(t)}</a>` : `<span aria-current="page">${esc(t)}</span>`))
    .join(`<i aria-hidden="true">/</i>`);
  return `
<section class="phead">
  <div class="wrap">
    <nav class="crumbs" aria-label="Breadcrumb">${trail}</nav>
    <h1 class="phead__t">${title}</h1>
    ${lead ? `<p class="phead__lead">${lead}</p>` : ''}
    ${extra}
  </div>
</section>`;
}
