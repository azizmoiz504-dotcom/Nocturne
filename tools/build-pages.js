/* Builds one plain, fast page per product category (products/<slug>.html) plus products/index.html,
   straight from js/data.js, so search engines can read every product name, size and spec.
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
const total = CATS.reduce((a, c) => a + c.items.length, 0);

const esc = s => String(s).replace(/[&<>"]/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[ch]));
const wa = text => 'https://wa.me/' + CFG.whatsappDigits + '?text=' + encodeURIComponent(text);
const famName = id => FAMS.find(f => f.id === id).name;
const ver = fs.statSync('css/pages.css').mtimeMs.toString(36).slice(-6);
const WA_SVG = '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2zm0 18.2a8.2 8.2 0 0 1-4.2-1.1l-.3-.2-3 .8.8-2.9-.2-.3A8.2 8.2 0 1 1 12 20.2zm4.5-6.1c-.2-.1-1.5-.7-1.7-.8s-.4-.1-.6.1-.7.8-.8 1-.3.2-.5.1a6.7 6.7 0 0 1-3.3-2.9c-.3-.4.3-.4.7-1.3.1-.2 0-.3 0-.4l-.8-1.8c-.2-.5-.4-.4-.6-.4h-.5a1 1 0 0 0-.7.3 3 3 0 0 0-.9 2.2 5.2 5.2 0 0 0 1.1 2.7 11.8 11.8 0 0 0 4.5 4c1.7.7 2.3.8 3.2.6a2.7 2.7 0 0 0 1.8-1.3 2.2 2.2 0 0 0 .2-1.3c-.1-.1-.3-.2-.5-.3z"/></svg>';

function shell({ title, desc, canon, body, ld, depth }) {
  const up = depth ? '../' : '';
  return '<!doctype html>\n<html lang="en">\n<head>\n<meta charset="utf-8">\n<meta name="viewport" content="width=device-width,initial-scale=1">\n' +
    '<meta name="robots" content="' + (INDEX ? 'index, follow' : 'noindex, nofollow') + '">\n' +
    '<title>' + esc(title) + '</title>\n<meta name="description" content="' + esc(desc) + '">\n' +
    (INDEX ? '<link rel="canonical" href="' + SITE + canon + '">\n' : '') +
    '<meta property="og:title" content="' + esc(title) + '">\n<meta property="og:description" content="' + esc(desc) + '">\n<meta property="og:image" content="' + SITE + 'assets/share.jpg">\n' +
    '<meta name="theme-color" content="#040c13">\n<link rel="icon" type="image/png" href="' + up + 'assets/favicon-64.png">\n' +
    '<link rel="stylesheet" href="' + up + 'fonts/fonts.css">\n<link rel="stylesheet" href="' + up + 'css/pages.css?v=' + ver + '">\n' +
    '<script type="application/ld+json">' + JSON.stringify(ld).replace(/</g, '\\u003c') + '</script>\n</head>\n<body>\n' +
    '<header class="top"><div class="wrap top__in">' +
      '<a class="top__logo" href="' + up + 'index.html"><img src="' + up + 'assets/logo-lockup.png" alt="Fakhri Tools &amp; Workshop Materials Trading LLC" width="320" height="58"></a>' +
      '<nav class="top__nav"><a href="' + up + 'products/index.html">All products</a><a class="hide-sm" href="' + up + 'index.html#how">How to buy</a><a class="hide-sm" href="' + up + 'index.html#network">Find us</a></nav>' +
      '<a class="btn btn--wa" href="' + wa('Hello Fakhri Tools, I would like a quote.') + '" target="_blank" rel="noopener">' + WA_SVG + '<span>WhatsApp</span></a>' +
    '</div></header>\n<main>' + body + '</main>\n' +
    '<footer class="foot"><div class="wrap foot__in">' +
      '<div><b>Fakhri Tools &amp; Workshop Materials Trading LLC</b><span>B2B trade counter · Warehouse 8, 8th Street, Al Quoz Industrial Area 3, Dubai</span><span>Landmark: Ajyad Traditional Kitchen, at the start of our row</span></div>' +
      '<div><span>Monday to Saturday, 7:30am to 6:00pm · Sunday closed</span><a href="' + CFG.phoneLink + '">Call ' + esc(CFG.phoneDisplay) + '</a><a href="' + wa('Hello Fakhri Tools, I would like a quote.') + '" target="_blank" rel="noopener">WhatsApp ' + esc(CFG.whatsappDisplay) + '</a></div>' +
    '</div></footer>\n</body>\n</html>\n';
}

const STORE = { '@type': 'HardwareStore', name: 'Fakhri Tools & Workshop Materials Trading LLC', telephone: '+97142850135',
  address: { '@type': 'PostalAddress', streetAddress: 'Warehouse 8, 8th Street, Al Quoz Industrial Area 3', addressLocality: 'Dubai', addressCountry: 'AE' } };

function catPage(c, idx) {
  const items = c.items.map((it, i) => {
    const [name, specs, size, img] = it;
    const sizeTxt = size ? ' (' + size + ')' : '';
    return '<article class="p">' +
      '<div class="p__img">' + (img ? '<img src="../' + IMG + img + '" alt="' + esc(name) + '" loading="' + (i < 6 ? 'eager' : 'lazy') + '" decoding="async" width="400" height="400">' : '<span class="p__np">Photo on WhatsApp</span>') + '</div>' +
      '<div class="p__body"><h2>' + esc(name) + '</h2>' +
        (size ? '<p class="p__size"><span>Sizes</span>' + esc(size) + '</p>' : '') +
        (specs.length ? '<ul class="p__specs">' + specs.map(s => '<li>' + esc(s) + '</li>').join('') + '</ul>' : '') + '</div>' +
      '<div class="p__foot"><a class="btn btn--dark" href="../index.html#products/' + c.slug + '">Pick size &amp; add to quote</a>' +
        '<a class="btn btn--wa btn--round" href="' + wa('Hello Fakhri Tools, please send me a price for: ' + name + sizeTxt + '. Size and quantity: ') + '" target="_blank" rel="noopener" aria-label="Ask the price of ' + esc(name) + ' on WhatsApp">' + WA_SVG + '</a></div>' +
    '</article>';
  }).join('');
  const others = CATS.filter(o => o.slug !== c.slug);
  const body =
    '<div class="wrap">' +
      '<nav class="crumbs" aria-label="Breadcrumb"><a href="../index.html">Home</a><i>/</i><a href="index.html">Products</a><i>/</i><span>' + esc(c.name) + '</span></nav>' +
      '<header class="hero"><p class="eyebrow">' + esc(famName(c.fam)) + ' · ' + c.items.length + ' products</p>' +
        '<h1>' + esc(c.name) + ' in Al Quoz, Dubai</h1>' +
        '<p class="lead">' + esc(c.desc) + ' Ask Fakhri Tools for a quote on WhatsApp, by phone or at our trade counter in Al Quoz Industrial Area 3.</p>' +
        '<ul class="points"><li>Overnight WhatsApp messages answered by 7:30am</li><li>UAE-wide delivery on orders from AED 5,000</li><li>Pipe threading, hose cutting and hydraulic hose crimping at the counter</li></ul></header>' +
      '<section class="grid" aria-label="' + esc(c.name) + '">' + items + '</section>' +
      '<section class="ask"><div><h2>Can’t find your size or part?</h2><p>Send a photo of it, or its nameplate, on WhatsApp and we will tell you if we have it.</p></div>' +
        '<a class="btn btn--wa" href="' + wa('Hello Fakhri Tools, I am looking for this part (' + c.name + '): ') + '" target="_blank" rel="noopener">' + WA_SVG + '<span>Send on WhatsApp</span></a></section>' +
      '<section class="more"><h2>More products</h2><div class="more__list">' + others.map(o => '<a href="' + o.slug + '.html">' + esc(o.name) + ' <em>' + o.items.length + '</em></a>').join('') + '</div></section>' +
    '</div>';
  const title = c.name + ' in Al Quoz, Dubai | Fakhri Tools';
  const desc = c.name + ' from Fakhri Tools, a B2B trade counter in Al Quoz Industrial Area 3, Dubai: ' + c.items.slice(0, 4).map(it => it[0]).join(', ') + (c.items.length > 4 ? ' and more' : '') + '. Get a quote on WhatsApp.';
  const ld = { '@context': 'https://schema.org', '@graph': [
    { '@type': 'BreadcrumbList', itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: SITE },
      { '@type': 'ListItem', position: 2, name: 'Products', item: SITE + 'products/index.html' },
      { '@type': 'ListItem', position: 3, name: c.name, item: SITE + 'products/' + c.slug + '.html' }] },
    { '@type': 'ItemList', name: c.name, numberOfItems: c.items.length, itemListElement: c.items.map((it, i) => ({ '@type': 'ListItem', position: i + 1, name: it[0] })) },
    STORE] };
  return shell({ title, desc: desc.length > 300 ? desc.slice(0, 297) + '…' : desc, canon: 'products/' + c.slug + '.html', body, ld, depth: 1 });
}

function hubPage() {
  const body = '<div class="wrap">' +
    '<nav class="crumbs" aria-label="Breadcrumb"><a href="../index.html">Home</a><i>/</i><span>Products</span></nav>' +
    '<header class="hero"><p class="eyebrow">' + total + ' products · ' + CATS.length + ' categories</p><h1>Pipes, fittings, flanges and valves in Al Quoz, Dubai</h1>' +
      '<p class="lead">Every product we offer at our B2B trade counter in Al Quoz Industrial Area 3. Open a category to see sizes and specs, then ask for a quote on WhatsApp.</p></header>' +
    FAMS.map(f => '<section class="fam"><h2>' + esc(f.name) + '</h2><div class="cats">' +
      CATS.filter(c => c.fam === f.id).map(c => '<a class="cat" href="' + c.slug + '.html"><span class="cat__img">' + (c.cover ? '<img src="../' + IMG + c.cover + '" alt="" loading="lazy" decoding="async" width="300" height="300">' : '') + '</span><b>' + esc(c.name) + '</b><em>' + c.items.length + ' products</em></a>').join('') +
    '</div></section>').join('') + '</div>';
  const ld = { '@context': 'https://schema.org', '@graph': [
    { '@type': 'ItemList', name: 'Product categories', itemListElement: CATS.map((c, i) => ({ '@type': 'ListItem', position: i + 1, name: c.name, url: SITE + 'products/' + c.slug + '.html' })) }, STORE] };
  return shell({ title: 'Pipes, Fittings, Flanges & Valves in Al Quoz, Dubai | Fakhri Tools',
    desc: 'All ' + total + ' products from Fakhri Tools in Al Quoz Industrial Area 3, Dubai: valves, camlocks and couplings, pipe fittings and flanges, hoses, gaskets and gauges. Get a quote on WhatsApp.',
    canon: 'products/index.html', body, ld, depth: 1 });
}

fs.mkdirSync('products', { recursive: true });
for (const f of fs.readdirSync('products')) if (f.endsWith('.html')) fs.unlinkSync(path.join('products', f));
CATS.forEach((c, i) => fs.writeFileSync(path.join('products', c.slug + '.html'), catPage(c, i)));
fs.writeFileSync(path.join('products', 'index.html'), hubPage());
console.log('Built', CATS.length, 'category pages +', 'products/index.html (' + total + ' products)');
