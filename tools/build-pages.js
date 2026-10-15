/* Builds one plain, fast page per product category (products/<slug>.html) plus products/index.html,
   straight from js/data.js, so search engines can read every product name, size and spec.
   Also writes sitemap.xml, robots.txt and 404.html, and refreshes the search-engine parts of index.html
   (store details for Google and the footer category links), so they never drift from the product list.
   Hand-written titles, descriptions and buyer guides per category live in tools/seo-content.json.
   Run from the site folder after any product change:  node tools/build-pages.js
   (tools/apply-edits.js runs it automatically.) */
const vm = require('vm'), fs = require('fs'), path = require('path');

// Keep "noindex" until the site has its own domain; then set INDEX = true and SITE to the domain.
const INDEX = false;
const SITE = 'https://azizmoiz504-dotcom.github.io/Nocturne/';

const ctx = { window: {} };
vm.runInNewContext(fs.readFileSync('js/config.js', 'utf8'), ctx);
vm.runInNewContext(fs.readFileSync('js/data.js', 'utf8'), ctx);
const CFG = ctx.window.FT_CONFIG, FAMS = ctx.window.FT_FAMILIES, CATS = ctx.window.FT_CATS, IMG = ctx.window.FT_IMG;
// Optional hand-written SEO copy per category: { "<slug>": { title, desc, h1, intro: [paragraphs], faq: [[q, a], ...] } }
const SEO = fs.existsSync('tools/seo-content.json') ? JSON.parse(fs.readFileSync('tools/seo-content.json', 'utf8')) : {};
const total = CATS.reduce((a, c) => a + c.items.length, 0);
// size typos stop the size picker working on the site, so flag them here (e.g. 1/2" instead of ½", 2"-12" without spaces)
CATS.forEach(c => c.items.forEach(it => {
  const sz = it[2] || '';
  if (/(^|[^\d/])1\/2"|\b11\/2"|\d"-\d|\d" - \d|\d" –\d|\d–\d"|,\S/.test(sz)) console.warn('Size typo? ' + c.slug + ' / ' + it[0] + ': ' + sz);
}));

const esc = s => String(s).replace(/[&<>"]/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[ch]));
const wa = text => 'https://wa.me/' + CFG.whatsappDigits + '?text=' + encodeURIComponent(text);
const famName = id => FAMS.find(f => f.id === id).name;
const nProducts = n => n + (n === 1 ? ' product' : ' products');
// Material, worked out the same way as the cards on the home page (js/main.js materialOf, matText, fullName):
// the material set in the editor (item[4]) wins, otherwise it is read from the name.
const MATS = [['Bronze', /bronze/i], ['Brass', /brass/i], ['Stainless', /\bS\.S\b|\bSS(?:3\d\d\w*)?\b|[Ss]tainless/], ['Carbon steel', /\bC\.S\b|\bCS\b|[Ff]orged [Ss]teel/], ['Cast iron', /\bC\.I\b|\bCI\b/], ['Galvanised', /\bG\.I\b|\bGI\b/], ['Mild steel', /\bM\.S\b|\bMS\b/], ['Aluminium', /alumin/i], ['Rubber', /rubber|neoprene/i], ['PVC', /\bPVC\b/]];
function materialOf(name) {
  let best = null, at = 1e9;
  MATS.forEach(([m, r]) => { const k = name.search(r); if (k > -1 && k < at) { at = k; best = m; } });
  return best;
}
const ownMat = it => it[4] && it[4] !== 'Other' ? it[4] : '';
const matText = it => ownMat(it) || (/^C\.S & S\.S/.test(it[0]) ? 'Carbon steel, Stainless' : materialOf(it[0]) || '');
const fullName = it => ownMat(it) && !materialOf(it[0]) ? it[0] + ' – ' + it[4] : it[0];
// Page addresses: a few categories get a shorter address with the words people search for.
// The category's slug in js/data.js (and the editor) stays the same; only the page file name changes.
// The old address keeps working: it becomes a small page that forwards to the new one.
const PAGE_URL = {
  'ms-forged-low-pressure-bw-fittings': 'carbon-steel-pipes-fittings',
  'ss-forged-low-pressure-bw-fittings': 'stainless-steel-pipes-fittings',
  'gi-pipe-fittings': 'gi-pipes-fittings',
  'ss-ms-flanges-forging-casting': 'flanges',
  'qrc-couplings-ludecke': 'qrc-couplings',
  'instrumentation-fittings-pressure-gas': 'instrumentation-fittings',
  'universal-couplings-flange-adapter': 'pressure-gauges'
};
const PG = c => PAGE_URL[c.slug] || c.slug;
// a category without a main photo shows its first product's photo (as the catalogue does)
const COV = c => c.cover || (c.items[0] && c.items[0][3]) || '';
// Old addresses of extra pages that moved
const MOVED = { 'products/valves-hub.html': 'products/valves.html',
  // 2026-10-14: the gauge got its own section and the universal couplings moved in with the flexible connectors
  'products/instrumentation-pressure-gauges.html': 'products/instrumentation-fittings.html',
  'products/universal-couplings-flange-adapter.html': 'products/union-flexible-connectors.html' };
// First option that fits Google's ~60-character title width; cut() shortens at a word for descriptions.
const fit = (...opts) => opts.find(o => o.length <= 60) || opts[opts.length - 1];
const cut = (s, n) => s.length <= n ? s : s.slice(0, s.lastIndexOf(' ', n - 1)).replace(/[,;:.—-]$/, '') + '…';
require('./zoom-css.js');   // computer copies of the stylesheets (75% size)
const ver = fs.statSync('css/pages.css').mtimeMs.toString(36).slice(-6);
const WA_SVG = '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2zm0 18.2a8.2 8.2 0 0 1-4.2-1.1l-.3-.2-3 .8.8-2.9-.2-.3A8.2 8.2 0 1 1 12 20.2zm4.5-6.1c-.2-.1-1.5-.7-1.7-.8s-.4-.1-.6.1-.7.8-.8 1-.3.2-.5.1a6.7 6.7 0 0 1-3.3-2.9c-.3-.4.3-.4.7-1.3.1-.2 0-.3 0-.4l-.8-1.8c-.2-.5-.4-.4-.6-.4h-.5a1 1 0 0 0-.7.3 3 3 0 0 0-.9 2.2 5.2 5.2 0 0 0 1.1 2.7 11.8 11.8 0 0 0 4.5 4c1.7.7 2.3.8 3.2.6a2.7 2.7 0 0 0 1.8-1.3 2.2 2.2 0 0 0 .2-1.3c-.1-.1-.3-.2-.5-.3z"/></svg>';

// Google Analytics 4: off until js/config.js has a ga4 ID (starts with G-). Then it counts page views and
// clicks on WhatsApp, call, directions and email links, so we can see which pages bring enquiries.
const GA4 = /^G-[A-Z0-9]+$/.test(CFG.ga4 || '') ? CFG.ga4 : '';
const GA_TAG = !GA4 ? '' : '<script async src="https://www.googletagmanager.com/gtag/js?id=' + GA4 + '"></script>\n<script>window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments)}gtag("js",new Date());gtag("config","' + GA4 + '");' +
  'document.addEventListener("click",function(e){var a=e.target.closest&&e.target.closest("a[href]");if(!a)return;var h=a.href,n=/wa\\.me\\//.test(h)?"click_whatsapp":/^tel:/.test(h)?"click_call":/^mailto:/.test(h)?"click_email":/google\\.[a-z.]+\\/maps|share\\.google|maps\\.app/.test(h)?"click_directions":"";if(n)gtag("event",n,{link_url:h,page_path:location.pathname})},true)</script>\n';
// Arabic pages: drafted in tools/ar-content.json. They stay hidden from Google (noindex, no sitemap, no hreflang)
// until a native speaker has checked them and "ready": true is set in that file.
const AR = fs.existsSync('tools/ar-content.json') ? JSON.parse(fs.readFileSync('tools/ar-content.json', 'utf8')) : { pages: [] };
const AR_READY = AR.ready === true;
const AR_OF = Object.fromEntries((AR.pages || []).map(p => [p.en, p.path]));
const alt = (en, ar) => !AR_READY || !ar ? '' : '<link rel="alternate" hreflang="en" href="' + SITE + en + '">\n<link rel="alternate" hreflang="ar" href="' + SITE + ar + '">\n<link rel="alternate" hreflang="x-default" href="' + SITE + en + '">\n';

function shell({ title, desc, canon, body, ld, depth, noindex = false, abs = false, lang = 'en', alts = '' }) {
  // abs: links from the site root (404.html is served at any depth, so it cannot use relative links)
  const up = abs ? SITE : depth ? '../' : '';
  return '<!doctype html>\n<html lang="' + lang + '"' + (lang === 'ar' ? ' dir="rtl"' : '') + '>\n<head>\n<meta charset="utf-8">\n<meta name="viewport" content="width=device-width,initial-scale=1">\n' +
    '<meta name="robots" content="' + (INDEX && !noindex ? 'index, follow' : 'noindex, nofollow') + '">\n' +
    '<title>' + esc(title) + '</title>\n<meta name="description" content="' + esc(desc) + '">\n' +
    (canon !== null ? '<link rel="canonical" href="' + SITE + canon + '">\n<meta property="og:url" content="' + SITE + canon + '">\n' : '') + alts + GA_TAG +
    '<meta property="og:type" content="website">\n<meta property="og:site_name" content="Fakhri Tools">\n' +
    '<meta property="og:title" content="' + esc(title) + '">\n<meta property="og:description" content="' + esc(desc) + '">\n<meta property="og:image" content="' + SITE + 'assets/share.jpg">\n<meta name="twitter:card" content="summary_large_image">\n' +
    '<meta name="theme-color" content="#040c13">\n<link rel="icon" type="image/png" sizes="96x96" href="' + up + 'assets/favicon-96.png">\n<link rel="icon" type="image/png" sizes="64x64" href="' + up + 'assets/favicon-64.png">\n<link rel="apple-touch-icon" href="' + up + 'assets/apple-touch-icon.png">\n' +
    '<link rel="stylesheet" href="' + up + 'fonts/fonts.css">\n<link rel="stylesheet" href="' + up + 'css/pages.css?v=' + ver + '" media="(max-width:899.98px)">\n<link rel="stylesheet" href="' + up + 'css/pages-75.css?v=' + ver + '" media="(min-width:900px)">\n' +
    (ld ? '<script type="application/ld+json">' + JSON.stringify(ld).replace(/</g, '\\u003c') + '</script>\n' : '') + '</head>\n<body>\n' +
    '<header class="top"><div class="wrap top__in">' +
      '<a class="top__logo" href="' + up + 'index.html"><img src="' + up + 'assets/logo-lockup.png" alt="Fakhri Tools &amp; Workshop Materials Trading LLC" width="320" height="58"></a>' +
      '<nav class="top__nav"><a href="' + up + 'products/index.html">All products</a><a class="hide-sm" href="' + up + 'index.html#how">How to buy</a><a class="hide-sm" href="' + up + 'index.html#network">Find us</a></nav>' +
      '<a class="btn btn--call" href="' + CFG.phoneLink + '" aria-label="Call ' + esc(CFG.phoneDisplay) + '"><svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M6.6 10.8a15.1 15.1 0 0 0 6.6 6.6l2.2-2.2a1 1 0 0 1 1-.25 11.4 11.4 0 0 0 3.6.57 1 1 0 0 1 1 1V20a1 1 0 0 1-1 1A17 17 0 0 1 3 4a1 1 0 0 1 1-1h3.5a1 1 0 0 1 1 1c0 1.25.2 2.45.57 3.57a1 1 0 0 1-.25 1z"/></svg></a>' +
      '<a class="btn btn--wa" href="' + wa('Hello Fakhri Tools, I would like a quote.') + '" target="_blank" rel="noopener" aria-label="WhatsApp ' + esc(CFG.whatsappDisplay) + '">' + WA_SVG + '<span>WhatsApp</span></a>' +
    '</div></header>\n<main>' + body + '</main>\n' +
    '<footer class="foot"><div class="wrap foot__in">' +
      '<div><b>Fakhri Tools &amp; Workshop Materials Trading LLC</b><span>B2B trade counter · Warehouse 8, 8th Street, Al Quoz Industrial Area 3, Dubai</span><span>Landmark: Ajyad Traditional Kitchen, at the start of our row</span></div>' +
      '<div><span>Monday to Saturday, 7:30am to 6:00pm · Sunday closed</span><a href="' + CFG.phoneLink + '">Call ' + esc(CFG.phoneDisplay) + '</a><a href="' + wa('Hello Fakhri Tools, I would like a quote.') + '" target="_blank" rel="noopener">WhatsApp ' + esc(CFG.whatsappDisplay) + '</a></div>' +
    '</div></footer>\n</body>\n</html>\n';
}

// The shop, as search engines should read it. Facts from the owner-confirmed fact sheet only.
// No map coordinates (we have none from GPS) and no ratings (we show none).
const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const hhmm = h => String(Math.floor(h)).padStart(2, '0') + ':' + String(Math.round((h % 1) * 60)).padStart(2, '0');
const STORE = { '@type': 'HardwareStore', '@id': SITE + '#store',
  name: 'Fakhri Tools & Workshop Materials Trading LLC', alternateName: 'Fakhri Tools',
  description: 'B2B trade counter for pipes, pipe fittings, flanges, valves, camlocks and couplings, industrial hoses, gaskets and gauges in Al Quoz Industrial Area 3, Dubai.',
  url: SITE, image: SITE + 'assets/share.jpg', logo: SITE + 'assets/logo-stacked.png',
  telephone: CFG.phoneLink.replace('tel:', ''),
  contactPoint: [{ '@type': 'ContactPoint', contactType: 'sales', telephone: '+' + CFG.whatsappDigits, availableLanguage: ['English', 'Arabic', 'Hindi', 'Urdu'] }],
  address: { '@type': 'PostalAddress', streetAddress: 'Warehouse 8, 8th Street, Al Quoz Industrial Area 3', addressLocality: 'Dubai', addressRegion: 'Dubai', addressCountry: 'AE' },
  openingHoursSpecification: [{ '@type': 'OpeningHoursSpecification', dayOfWeek: CFG.openDays.map(d => DAYS[d]), opens: hhmm(CFG.openFrom), closes: hhmm(CFG.openTo) }],
  areaServed: { '@type': 'Country', name: 'United Arab Emirates' },
  paymentAccepted: 'Cash, Credit Card, Bank Transfer, Cheque' };

function catPage(c, idx) {
  const s = SEO[c.slug] || {};
  const items = c.items.map((it, i) => {
    const [name, specs, size, img] = it, mat = matText(it);
    const sizeTxt = size ? ' (' + size + ')' : '';
    return '<article class="p">' +
      '<div class="p__img">' + (img ? '<img src="../' + IMG + img + '" alt="' + esc(name) + '" loading="' + (i < 6 ? 'eager' : 'lazy') + '" decoding="async" width="400" height="400">' : '<span class="p__np">Photo on WhatsApp</span>') + '</div>' +
      '<div class="p__body"><h2>' + esc(name) + '</h2>' +
        (mat ? '<p class="p__size p__mat"><span>Material</span>' + esc(mat) + '</p>' : '') +
        (size ? '<p class="p__size"><span>Sizes</span>' + esc(size) + '</p>' : '') +
        (specs.length ? '<ul class="p__specs">' + specs.map(s => '<li>' + esc(s) + '</li>').join('') + '</ul>' : '') + '</div>' +
      '<div class="p__foot"><a class="btn btn--dark" href="../index.html#products/' + c.slug + '"><span class="lg">Pick size &amp; add</span><span class="sm">Add</span> to quote</a>' +
        '<a class="btn btn--wa btn--round" href="' + wa('Hello Fakhri Tools, please send me a price for: ' + fullName(it) + sizeTxt + '. Size and quantity: ') + '" target="_blank" rel="noopener" aria-label="Ask the price of ' + esc(name) + ' on WhatsApp">' + WA_SVG + '</a></div>' +
    '</article>';
  }).join('');
  const others = CATS.filter(o => o.slug !== c.slug);
  const body =
    '<div class="wrap">' +
      '<nav class="crumbs" aria-label="Breadcrumb"><a href="../index.html">Home</a><i>/</i><a href="index.html">Products</a><i>/</i><span>' + esc(c.name) + '</span></nav>' +
      '<header class="hero"><p class="eyebrow">' + esc(famName(c.fam)) + ' · ' + nProducts(c.items.length) + '</p>' +
        '<h1>' + esc(s.h1 || c.name + ' in Al Quoz, Dubai') + '</h1>' +
        '<p class="lead">' + esc(c.desc) + ' Ask Fakhri Tools for a quote on WhatsApp, by phone or at our trade counter in Al Quoz Industrial Area 3.</p>' +
        '<ul class="points"><li>Overnight WhatsApp messages answered by 7:30am</li><li>UAE-wide delivery on orders from AED 5,000</li><li>Pipe threading, hose cutting and hydraulic hose crimping at the counter</li></ul></header>' +
      '<section class="grid" aria-label="' + esc(c.name) + '">' + items + '</section>' +
      (s.intro && s.intro.length ? '<section class="guide"><h2>' + esc(s.guideTitle || 'Choosing ' + c.name.toLowerCase()) + '</h2>' + s.intro.map(p => '<p>' + esc(p) + '</p>').join('') + '</section>' : '') +
      (s.faq && s.faq.length ? '<section class="faq"><h2>Questions buyers ask</h2>' + s.faq.map(([q, a]) => '<details><summary>' + esc(q) + '</summary><p>' + esc(a) + '</p></details>').join('') + '</section>' : '') +
      tiles(s.cats, s.catsTitle, '../') +
      '<section class="ask"><div><h2>Can’t find your size or part?</h2><p>Send a photo of it, or its nameplate, on WhatsApp and we will tell you if we have it.</p></div>' +
        '<a class="btn btn--wa" href="' + wa('Hello Fakhri Tools, I am looking for this part (' + c.name + '): ') + '" target="_blank" rel="noopener">' + WA_SVG + '<span>Send on WhatsApp</span></a></section>' +
      '<section class="more"><h2>More products</h2><div class="more__list">' + others.map(o => '<a href="' + PG(o) + '.html">' + esc(o.name) + ' <em>' + o.items.length + '</em></a>').join('') + '</div>' +
        (PAGES.length ? '<h2 class="more__h">Services &amp; guides</h2><div class="more__list">' + PAGES.map(pg => '<a href="../' + pg.path + '">' + esc(pg.crumb || pg.h1) + '</a>').join('') + '</div>' : '') + '</section>' +
    '</div>';
  const title = s.title || fit(c.name + ' in Al Quoz, Dubai | Fakhri Tools', c.name + ' Dubai | Fakhri Tools', c.name + ' | Fakhri Tools');
  const desc = s.desc || cut(c.name + ' at our trade counter in Al Quoz Industrial Area 3, Dubai. ' + c.desc + ' Get a quote on WhatsApp.', 155);
  const ld = { '@context': 'https://schema.org', '@graph': [
    { '@type': 'BreadcrumbList', itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: SITE },
      { '@type': 'ListItem', position: 2, name: 'Products', item: SITE + 'products/index.html' },
      { '@type': 'ListItem', position: 3, name: c.name, item: SITE + 'products/' + PG(c) + '.html' }] },
    { '@type': 'ItemList', name: c.name, numberOfItems: c.items.length, itemListElement: c.items.map((it, i) => ({ '@type': 'ListItem', position: i + 1, name: it[0] })) },
    STORE] };
  return shell({ title, desc, canon: 'products/' + PG(c) + '.html', body, ld, depth: 1, alts: alt('products/' + PG(c) + '.html', AR_OF['products/' + PG(c) + '.html']) });
}

function hubPage() {
  const body = '<div class="wrap">' +
    '<nav class="crumbs" aria-label="Breadcrumb"><a href="../index.html">Home</a><i>/</i><span>Products</span></nav>' +
    '<header class="hero"><p class="eyebrow">' + total + ' products · ' + CATS.length + ' categories</p><h1>Pipes, fittings, flanges and valves in Al Quoz, Dubai</h1>' +
      '<p class="lead">Every product we offer at our B2B trade counter in Al Quoz Industrial Area 3. Open a category to see sizes and specs, then ask for a quote on WhatsApp.</p></header>' +
    FAMS.map(f => '<section class="fam"><h2>' + esc(f.name) + '</h2><div class="cats">' +
      CATS.filter(c => c.fam === f.id).map(c => '<a class="cat" href="' + PG(c) + '.html"><span class="cat__img">' + (COV(c) ? '<img src="../' + IMG + COV(c) + '" alt="" loading="lazy" decoding="async" width="300" height="300">' : '') + '</span><b>' + esc(c.name) + '</b><em>' + nProducts(c.items.length) + '</em></a>').join('') +
    '</div></section>').join('') + '</div>';
  const ld = { '@context': 'https://schema.org', '@graph': [
    { '@type': 'BreadcrumbList', itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: SITE },
      { '@type': 'ListItem', position: 2, name: 'Products', item: SITE + 'products/index.html' }] },
    { '@type': 'ItemList', name: 'Product categories', itemListElement: CATS.map((c, i) => ({ '@type': 'ListItem', position: i + 1, name: c.name, url: SITE + 'products/' + PG(c) + '.html' })) }, STORE] };
  return shell({ title: (SEO._hub && SEO._hub.title) || 'Pipe Fittings, Flanges & Valves Dubai | Fakhri Tools',
    desc: (SEO._hub && SEO._hub.desc) || 'All ' + total + ' products at our Al Quoz Industrial Area 3 trade counter: valves, flanges, pipe fittings, camlocks, hoses, gaskets and gauges. Quote on WhatsApp.',
    canon: 'products/index.html', body, ld, depth: 1 });
}

// Extra pages from tools/seo-content.json "_pages": services, guides, hubs, delivery and contact.
// Same look as the category pages; text is written in that file, never generated.
const PAGES = SEO._pages || [];
// Category tiles (photo, name, count) linking to related category pages
function tiles(slugs, heading, up) {
  const cats = (slugs || []).map(s => CATS.find(c => c.slug === s)).filter(Boolean);
  return !cats.length ? '' : '<section class="fam"><h2>' + esc(heading || 'Shop these categories') + '</h2><div class="cats">' + cats.map(c =>
    '<a class="cat" href="' + up + 'products/' + PG(c) + '.html"><span class="cat__img">' + (COV(c) ? '<img src="' + up + IMG + COV(c) + '" alt="" loading="lazy" decoding="async" width="300" height="300">' : '') + '</span><b>' + esc(c.name) + '</b><em>' + nProducts(c.items.length) + '</em></a>').join('') + '</div></section>';
}
const UI = {
  en: { home: 'Home', faq: 'Questions buyers ask', ask: 'Send us your list', askP: 'Sizes, rating, end connection and quantity. We reply with stock and a price.', send: 'Send on WhatsApp', products: 'Products', shop: 'Shop these categories', hello: 'Hello Fakhri Tools, I would like a quote.' },
  ar: { home: 'الرئيسية', faq: 'أسئلة يطرحها المشترون', ask: 'أرسل لنا قائمتك', askP: 'المقاس والضغط ونوع الطرف والكمية، ونرد عليك بالتوفر والسعر.', send: 'أرسل على واتساب', products: 'المنتجات', shop: 'تصفح هذه الأقسام', hello: 'مرحباً فخري للعدد، أريد عرض سعر.' }
};
function extraPage(pg, lang = 'en') {
  const T = UI[lang];
  const depth = pg.path.includes('/') ? 1 : 0, up = depth ? '../' : '';
  const table = tb => '<div class="tbl"><table>' + (tb.caption ? '<caption>' + esc(tb.caption) + '</caption>' : '') +
    '<thead><tr>' + tb.head.map(h => '<th scope="col">' + esc(h) + '</th>').join('') + '</tr></thead><tbody>' +
    tb.rows.map(r => '<tr>' + r.map((c, i) => i ? '<td>' + esc(c) + '</td>' : '<th scope="row">' + esc(c) + '</th>').join('') + '</tr>').join('') + '</tbody></table></div>';
  const body = '<div class="wrap">' +
    '<nav class="crumbs" aria-label="Breadcrumb"><a href="' + (lang === 'ar' ? '' : up) + 'index.html">' + T.home + '</a><i>/</i><span>' + esc(pg.crumb || pg.h1) + '</span></nav>' +
    '<header class="hero">' + (pg.eyebrow ? '<p class="eyebrow">' + esc(pg.eyebrow) + '</p>' : '') + '<h1>' + esc(pg.h1) + '</h1>' +
      (pg.lead ? '<p class="lead">' + esc(pg.lead) + '</p>' : '') + '</header>' +
    (pg.sections || []).map(s => '<section class="guide">' + (s.h2 ? '<h2>' + esc(s.h2) + '</h2>' : '') +
      (s.p || []).map(x => '<p>' + esc(x) + '</p>').join('') +
      (s.list && s.list.length ? '<ul>' + s.list.map(x => '<li>' + esc(x) + '</li>').join('') + '</ul>' : '') +
      (s.table ? table(s.table) : '') + '</section>').join('') +
    tiles(pg.cats, pg.catsTitle || T.shop, up) +
    (pg.faq && pg.faq.length ? '<section class="faq"><h2>' + T.faq + '</h2>' + pg.faq.map(([q, a]) => '<details><summary>' + esc(q) + '</summary><p>' + esc(a) + '</p></details>').join('') + '</section>' : '') +
    '<section class="ask"><div><h2>' + esc(pg.askTitle || T.ask) + '</h2><p>' + T.askP + '</p></div>' +
      '<a class="btn btn--wa" href="' + wa(pg.wa || T.hello) + '" target="_blank" rel="noopener">' + WA_SVG + '<span>' + T.send + '</span></a></section>' +
    '<section class="more"><h2>' + T.products + '</h2><div class="more__list">' + CATS.map(o => '<a href="' + up + 'products/' + PG(o) + '.html">' + esc(o.name) + ' <em>' + o.items.length + '</em></a>').join('') + '</div></section>' +
    '</div>';
  const ld = { '@context': 'https://schema.org', '@graph': [
    { '@type': 'BreadcrumbList', itemListElement: [
      { '@type': 'ListItem', position: 1, name: T.home, item: lang === 'ar' ? SITE + 'ar/index.html' : SITE },
      { '@type': 'ListItem', position: 2, name: pg.crumb || pg.h1, item: SITE + pg.path }] },
    STORE] };
  const alts = lang === 'ar' ? alt(pg.en, pg.path) : alt(pg.path, AR_OF[pg.path]);
  return shell({ title: pg.title, desc: pg.desc, canon: pg.path, body, ld, depth, lang, alts, noindex: lang === 'ar' && !AR_READY });
}

fs.mkdirSync('products', { recursive: true });
for (const f of fs.readdirSync('products')) if (f.endsWith('.html')) fs.unlinkSync(path.join('products', f));
CATS.forEach((c, i) => fs.writeFileSync(path.join('products', PG(c) + '.html'), catPage(c, i)));
fs.writeFileSync(path.join('products', 'index.html'), hubPage());
for (const dir of ['services', 'guides']) if (fs.existsSync(dir)) for (const f of fs.readdirSync(dir)) if (f.endsWith('.html')) fs.unlinkSync(path.join(dir, f));
for (const pg of PAGES) { fs.mkdirSync(path.dirname(pg.path), { recursive: true }); fs.writeFileSync(pg.path, extraPage(pg)); }
if (fs.existsSync('ar')) for (const f of fs.readdirSync('ar')) if (f.endsWith('.html')) fs.unlinkSync(path.join('ar', f));
for (const pg of AR.pages || []) { fs.mkdirSync(path.dirname(pg.path), { recursive: true }); fs.writeFileSync(pg.path, extraPage(pg, 'ar')); }
// Forwarding pages for old addresses (old links and bookmarks keep working; Google follows the canonical)
const forward = (from, to) => {
  const rel = path.relative(path.dirname(from), to).split(path.sep).join('/');
  fs.writeFileSync(from, '<!doctype html>\n<html lang="en">\n<head>\n<meta charset="utf-8">\n<title>Moved | Fakhri Tools</title>\n' +
    '<link rel="canonical" href="' + SITE + to + '">\n<meta http-equiv="refresh" content="0; url=' + rel + '">\n<script>location.replace("' + rel + '" + location.hash)</script>\n</head>\n<body><p>This page has moved: <a href="' + rel + '">' + SITE + to + '</a></p></body>\n</html>\n');
};
CATS.forEach(c => { if (PG(c) !== c.slug) forward('products/' + c.slug + '.html', 'products/' + PG(c) + '.html'); });
Object.entries(MOVED).forEach(([from, to]) => forward(from, to));

// 404 page: GitHub Pages shows it for any missing address, so its links start from the site root.
fs.writeFileSync('404.html', shell({ title: 'Page not found | Fakhri Tools', desc: 'This page could not be found.', canon: null, ld: null, noindex: true, abs: true,
  body: '<div class="wrap"><header class="hero"><p class="eyebrow">404</p><h1>That page is not here</h1>' +
    '<p class="lead">It may have moved. Pick a category below, or send us the part name or a photo on WhatsApp and we will tell you if we have it.</p></header>' +
    '<section class="more"><h2>Products</h2><div class="more__list">' + CATS.map(o => '<a href="' + SITE + 'products/' + PG(o) + '.html">' + esc(o.name) + ' <em>' + o.items.length + '</em></a>').join('') + '</div></section></div>' }));

// Sitemap and robots: only real pages. Helper pages (edit, photo pickers) and 404 stay out.
const urls = ['', 'products/index.html', ...CATS.map(c => 'products/' + PG(c) + '.html'), ...PAGES.map(pg => pg.path), ...(AR_READY ? AR.pages.map(pg => pg.path) : [])];
fs.writeFileSync('sitemap.xml', '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' +
  urls.map(u => '  <url><loc>' + SITE + u + '</loc></url>').join('\n') + '\n</urlset>\n');
fs.writeFileSync('robots.txt', 'User-agent: *\nAllow: /\n\nSitemap: ' + SITE + 'sitemap.xml\n');

// index.html: refresh the store details for Google and the footer category links (also there without JavaScript).
const between = (html, a, b, inner) => {
  const i = html.indexOf(a), j = html.indexOf(b, i + a.length);
  if (i < 0 || j < 0) throw new Error('index.html is missing the marker ' + a);
  // (markers: <!-- seo:head -->, <!-- seo:ld -->, <div id="footCats">, <div id="footGuides">)
  return html.slice(0, i + a.length) + inner + html.slice(j);
};
let home = fs.readFileSync('index.html', 'utf8');
const homeLd = { '@context': 'https://schema.org', '@graph': [STORE,
  { '@type': 'WebSite', '@id': SITE + '#site', name: 'Fakhri Tools', alternateName: 'Fakhri Tools & Workshop Materials Trading LLC', url: SITE, inLanguage: 'en' }] };
home = between(home, '<!-- seo:ld -->', '<!-- /seo:ld -->', '<script type="application/ld+json">' + JSON.stringify(homeLd).replace(/</g, '\\u003c') + '</script>');
home = between(home, '<!-- seo:head -->', '<!-- /seo:head -->',
  '<meta name="robots" content="' + (INDEX ? 'index, follow' : 'noindex, nofollow') + '">\n<link rel="canonical" href="' + SITE + '">\n<meta property="og:url" content="' + SITE + '">\n' +
  alt('', AR_OF['index.html']) + GA_TAG + '<script>window.FT_PAGE_URL=' + JSON.stringify(PAGE_URL) + '</script>\n');
home = between(home, '<div id="footCats">', '</div>', CATS.map(c => '<a href="products/' + PG(c) + '.html" data-cat="' + c.slug + '">' + esc(c.name) + '</a>').join('') + '<a href="products/index.html" data-cat=""><b>All products</b></a>');
if (home.includes('<div id="footGuides">')) home = between(home, '<div id="footGuides">', '</div>', PAGES.map(pg => '<a href="' + pg.path + '">' + esc(pg.crumb || pg.h1) + '</a>').join(''));
fs.writeFileSync('index.html', home);

console.log('Built', CATS.length, 'category pages + products/index.html (' + total + ' products), 404.html, sitemap.xml (' + urls.length + ' URLs), robots.txt, index.html store details');
