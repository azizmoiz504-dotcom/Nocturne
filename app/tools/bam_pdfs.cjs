#!/usr/bin/env node
/* Makes one printable catalogue (A4 PDF) for every Bait Al Maqdis group, from the private list in app/bam/.
 *   usage: node app/tools/bam_pdfs.cjs [group id ...]
 *   writes app/bam/catalogues/<group>.pdf, <group>.jpg (its cover, for the app's PDFs screen) and app/bam/pdfs.js (the list
 *   the app shows). No prices: the catalogues are made to send to customers. Run it again after every change to the list
 *   (app/build.sh refuses a list that is newer than its catalogues).
 *   needs: Playwright with Chromium (require('playwright')), ImageMagick (convert).
 */
const fs = require('fs'), path = require('path'), { execFileSync } = require('child_process');
const { chromium } = require('playwright');

const APP = path.resolve(__dirname, '..'), BAM = path.join(APP, 'bam'), OUT = path.join(BAM, 'catalogues');
const WORK = path.join(APP, 'build', 'catalogue-work');
global.window = {};
require(path.join(BAM, 'data.js'));
const DATA = window.BAM_DATA;

// the same order as the app's home screen: SGS first, Kapusi second, then the rest as listed
const FIRST = ['sgs', 'kapusi'];
const ordered = cats => FIRST.map(id => cats.find(c => c.id === id)).filter(Boolean).concat(cats.filter(c => FIRST.indexOf(c.id) < 0));
// a group's name on its catalogue (the list calls Kapusi "Bait Al Maqdis" and writes some in capitals)
const TITLE = { kapusi: 'Kapusi Hand Tools', sgs: 'SGS Range', formwork: 'Formwork', 'nails-fasteners': 'Nails & Fasteners' };
const titleOf = c => TITLE[c.id] || c.title || c.name;
const SHOP = {
  name: 'Bait Al Maqdis Building Materials Trading LLC',
  line: 'Importer, stockist and distributor of hand tools, power tools, safety products, welding equipment, fasteners, electrical, sanitary and marine material.',
  address: 'Exhibition Showroom No.06, Jurf Industrial Zone 1, Ajman, UAE', phone: '+971 6 529 4533', email: 'baitalmaqdisuae@gmail.com'
};
const WIDE = 10;   // a product with more sizes than this gets the whole width of the page, its sizes in three columns

const esc = s => String(s == null ? '' : s).replace(/[&<>"]/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[ch]);
const fileUrl = p => 'file://' + p.split(path.sep).map(encodeURIComponent).join('/');
function newer(src, dst) { try { return fs.statSync(src).mtimeMs > fs.statSync(dst).mtimeMs; } catch (e) { return true; } }
// photos made lighter for print (a product photo is printed about 5 cm wide)
function small(rel, size, q) {
  const src = path.join(BAM, rel), dst = path.join(WORK, String(size), rel.replace(/\.(png|webp|jpeg)$/i, '.jpg'));
  if (!fs.existsSync(src)) return '';
  if (newer(src, dst)) {
    fs.mkdirSync(path.dirname(dst), { recursive: true });
    execFileSync('convert', [src + '[0]', '-background', 'white', '-flatten', '-resize', size + 'x' + size + '>', '-strip', '-quality', String(q), dst]);
  }
  return dst;
}

function pageHTML(c) {
  const fonts = [400, 500, 600, 700, 800].map(w => '@font-face{font-family:P;font-weight:' + w + ';src:url(' + fileUrl(path.join(BAM, 'fonts', 'poppins-' + w + '.woff2')) + ')}').join('');
  const ink = path.join(WORK, 'logo-ink.png');
  if (newer(path.join(BAM, 'logo.png'), ink)) { fs.mkdirSync(WORK, { recursive: true }); execFileSync('convert', [path.join(BAM, 'logo.png'), '-fill', '#042a5d', '-colorize', '100', ink]); }
  const secs = c.secs.map(s => ({
    n: s.n,
    items: s.items.map(it => ({ n: it.n, img: it.img ? fileUrl(small(it.img, 420, 80)) : '', r: it.r.map(r => [r[0] || '', r[1] || '']) }))
  }));
  const cover = c.cover ? fileUrl(small(c.cover, 1100, 86)) : (secs[0] && secs[0].items[0] ? secs[0].items[0].img : '');
  const now = new Date(), edition = now.toLocaleString('en-GB', { month: 'long' }) + ' ' + now.getFullYear();
  const job = { title: titleOf(c), lede: c.lede || '', cover, edition, logo: fileUrl(ink), logoWhite: fileUrl(path.join(BAM, 'logo.png')), shop: SHOP, wide: WIDE, secs };
  return '<!doctype html><html><head><meta charset="utf-8"><style>' + fonts + CSS + '</style></head><body><script>const JOB=' +
    JSON.stringify(job).replace(/</g, '\\u003c') + ';</script><script>' + PAGINATE + '</script></body></html>';
}

const CSS = `
@page{size:A4;margin:0}
*{box-sizing:border-box;margin:0;padding:0}
html,body{background:#fff;-webkit-print-color-adjust:exact;print-color-adjust:exact}
body{font-family:P,Arial,sans-serif;color:#15161a;font-size:9pt;line-height:1.35}
:root{--o:#f5821f;--o2:#fff1e4;--ink:#15161a;--g:#6d7079;--l:#e6e3de;--l2:#f1efeb;--paper:#f6f4f0}
.page{position:relative;width:210mm;height:297mm;overflow:hidden;break-after:page;page-break-after:always;background:#fff}
.page:last-child{break-after:auto;page-break-after:auto}

/* ---- cover ---- */
.cv__top{position:absolute;left:14mm;right:14mm;top:12mm;display:flex;align-items:center;justify-content:space-between}
.cv__top img{height:13mm}
.cv__ed{text-align:right;font-size:7.4pt;letter-spacing:.22em;text-transform:uppercase;color:var(--g);line-height:1.6}
.cv__ed b{display:block;color:var(--ink);font-weight:700;letter-spacing:.24em}
.cv__hero{position:absolute;left:14mm;right:14mm;top:32mm;height:var(--hh);border-radius:5mm;background:var(--paper);overflow:hidden}
.cv__hero img{position:absolute;left:50%;top:50%;width:var(--iw);height:var(--iw);margin:calc(var(--iw) / -2) 0 0 calc(var(--iw) / -2);object-fit:contain;mix-blend-mode:multiply}
.cv__hero::after{content:"";position:absolute;right:0;bottom:0;width:38mm;height:4mm;background:var(--o)}
.cv__tag{position:absolute;left:6mm;top:6mm;z-index:2;padding:1.6mm 3.4mm;border-radius:2mm;background:var(--ink);color:#fff;font-size:7.4pt;font-weight:600;letter-spacing:.16em;text-transform:uppercase}
.cv__tag i{font-style:normal;color:var(--o)}
.cv__title{position:absolute;left:14mm;right:14mm;top:var(--ty)}
.cv__title small{display:block;font-size:8pt;font-weight:600;letter-spacing:.3em;text-transform:uppercase;color:var(--o)}
.cv__title h1{margin-top:2mm;font-size:var(--ts);line-height:1;font-weight:800;letter-spacing:-.025em}
.cv__title p{margin-top:4mm;max-width:150mm;font-size:10pt;line-height:1.5;color:#43464e}
.cv__stats{display:flex;margin-top:6mm;border-top:.35mm solid var(--ink)}
.cv__stats div{flex:1;padding-top:3mm}
.cv__stats b{display:block;font-size:22pt;font-weight:700;line-height:1;color:var(--ink)}
.cv__stats span{display:block;margin-top:1.4mm;font-size:6.8pt;font-weight:600;letter-spacing:.18em;text-transform:uppercase;color:var(--g)}
.cv__toc{margin-top:7mm}
.cv__toc h4{font-size:7pt;font-weight:600;letter-spacing:.24em;text-transform:uppercase;color:var(--g);margin-bottom:2mm}
.cv__toc ol{list-style:none;columns:var(--cols);column-gap:10mm}
.cv__toc li{display:flex;align-items:baseline;break-inside:avoid;padding:1.05mm 0;border-bottom:.2mm solid var(--l);font-size:8.4pt}
.cv__toc li em{font-style:normal;width:7mm;font-weight:700;color:var(--o);font-size:7.4pt}
.cv__toc li span{flex:1;min-width:0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.cv__toc li b{margin-left:2mm;font-weight:600;color:var(--g);font-size:7.6pt}
.cv__foot{position:absolute;left:0;right:0;bottom:0;height:30mm;background:var(--ink);color:#fff;display:flex;align-items:center;padding:0 14mm;gap:10mm}
.cv__foot::before{content:"";position:absolute;left:0;right:0;top:0;height:1.6mm;background:var(--o)}
.cv__foot .a{flex:1.25;min-width:0}
.cv__foot .a b{display:block;font-size:9pt;font-weight:700}
.cv__foot .a span{display:block;margin-top:1.2mm;font-size:6.9pt;line-height:1.45;color:#b9bac0}
.cv__foot .c{flex:1;font-size:7.8pt;line-height:1.45}
.cv__foot .c div{display:flex;padding:.5mm 0}
.cv__foot .c i{font-style:normal;flex:none;width:15mm;padding-top:.3mm;color:var(--o);font-weight:600;font-size:6.6pt;letter-spacing:.14em;text-transform:uppercase}

/* ---- inside pages ---- */
.hd{position:absolute;left:14mm;right:14mm;top:9mm;height:10mm;display:flex;align-items:center;gap:4mm;border-bottom:.3mm solid var(--l)}
.hd img{height:6.6mm}
.hd .k{padding-left:4mm;border-left:.3mm solid var(--l);font-size:7.6pt;font-weight:600;letter-spacing:.14em;text-transform:uppercase}
.hd .s{margin-left:auto;font-size:7.4pt;color:var(--g);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:90mm}
.ft{position:absolute;left:14mm;right:14mm;bottom:8mm;display:flex;align-items:center;gap:3mm;font-size:6.8pt;color:var(--g)}
.ft::before{content:"";width:5mm;height:1.2mm;background:var(--o)}
.ft .pg{margin-left:auto;font-weight:700;color:var(--ink);font-size:7.6pt;letter-spacing:.06em}
.ft .pg i{font-style:normal;color:var(--g);font-weight:500}
.bd{position:absolute;left:14mm;right:14mm;top:24mm;bottom:17mm}
.sec{display:flex;align-items:flex-end;gap:3.5mm;margin:1mm 0 4mm;padding-bottom:2.4mm;border-bottom:.35mm solid var(--ink)}
.sec .no{font-size:24pt;font-weight:800;line-height:.82;color:var(--o);letter-spacing:-.02em}
.sec h2{font-size:14pt;font-weight:700;line-height:1.05;letter-spacing:-.01em}
.sec h2 small{display:block;font-size:6.6pt;font-weight:600;letter-spacing:.2em;text-transform:uppercase;color:var(--g);margin-bottom:1mm}
.sec .n{margin-left:auto;padding:1mm 2.6mm;border-radius:5mm;background:var(--o2);color:#b4560a;font-size:7pt;font-weight:600;white-space:nowrap}
.sec--more{margin-top:0}
.sec--more .no{font-size:14pt}
.sec--more h2{font-size:10.5pt}
.row{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:4mm;margin-bottom:4mm;align-items:start}
.card{border:.3mm solid var(--l);border-radius:2.6mm;overflow:hidden;background:#fff;break-inside:avoid}
.card .ph{position:relative;height:39mm;padding:3mm;background:#fff;border-bottom:.3mm solid var(--l2);display:flex;align-items:center;justify-content:center}
.card .ph img{max-width:100%;max-height:100%;object-fit:contain}
.card .ph .nn{position:absolute;left:2mm;top:2mm;font-size:6pt;font-weight:600;color:#a7a39b;letter-spacing:.06em}
.card .t{padding:2.4mm 2.8mm 2.6mm}
.card h3{font-size:8.4pt;font-weight:600;line-height:1.24}
.card .k{margin-top:.6mm;font-size:6.2pt;font-weight:600;letter-spacing:.14em;text-transform:uppercase;color:var(--o)}
table{width:100%;border-collapse:collapse;margin-top:1.8mm;font-size:6.9pt;line-height:1.25}
th{font-size:5.5pt;font-weight:600;letter-spacing:.14em;text-transform:uppercase;color:var(--g);text-align:left;padding:0 1.2mm 1mm;border-bottom:.3mm solid var(--ink)}
td{padding:.8mm 1.2mm;border-bottom:.2mm solid var(--l2);vertical-align:top}
tr:nth-child(even) td{background:#faf8f5}
td.pn{font-weight:600;white-space:nowrap}
th:last-child,td:last-child{text-align:right}
th:only-child,td:only-child{text-align:left}
.card--wide{grid-column:1 / -1;display:flex}
.card--wide .ph{width:50mm;height:auto;min-height:44mm;flex:none;border-bottom:0;border-right:.3mm solid var(--l2)}
.card--wide .t{flex:1;min-width:0;padding:3mm 3.4mm}
.card--wide .tbls{display:flex;gap:4mm}
.card--wide .tbls table{flex:1}
`;

/* runs inside the page: lays the products out page by page, then writes the cover with the page of each section */
const PAGINATE = `
(async () => {
  const J = JOB, el = (tag, cls, html) => { const e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; };
  const esc = s => String(s == null ? '' : s).replace(/[&<>"]/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[ch]);
  const two = n => (n < 10 ? '0' : '') + n;
  await document.fonts.ready;
  const cover = el('div', 'page cv'); document.body.appendChild(cover);
  const pages = [];
  let body = null;
  function newPage() {
    const p = el('div', 'page in', '<div class="hd"><img src="' + J.logo + '" alt=""><span class="k">' + esc(J.title) + '</span><span class="s"></span></div><div class="bd"></div>' +
      '<div class="ft"><span>' + esc(J.shop.phone) + ' &nbsp;·&nbsp; ' + esc(J.shop.email) + ' &nbsp;·&nbsp; Jurf Industrial Zone 1, Ajman</span><span class="pg"></span></div>');
    document.body.appendChild(p); pages.push(p); body = p.querySelector('.bd'); p.__secs = []; return p;
  }
  const fits = () => body.scrollHeight <= body.clientHeight + 1;
  const imgs = [];
  function table(rows) {
    const code = rows.some(r => r[0]), size = rows.some(r => r[1]);
    return '<table><tr>' + (size ? '<th>Size</th>' : '') + (code ? '<th>Part no.</th>' : '') + '</tr>' +
      rows.map(r => '<tr>' + (size ? '<td>' + esc(r[1] || '–') + '</td>' : '') + (code ? '<td class="pn">' + esc(r[0] || '–') + '</td>' : '') + '</tr>').join('') + '</table>';
  }
  function card(it) {
    const wide = it.r.length > J.wide;
    let t;
    if (wide) { const per = Math.ceil(it.r.length / 3), parts = [0, 1, 2].map(i => it.r.slice(i * per, i * per + per)).filter(x => x.length); t = '<div class="tbls">' + parts.map(table).join('') + '</div>'; }
    else t = table(it.r);
    const c = el('div', 'card' + (wide ? ' card--wide' : ''), '<div class="ph">' + (it.img ? '<img src="' + it.img + '" alt="">' : '') + '</div>' +
      '<div class="t"><h3>' + esc(it.n) + '</h3><div class="k">' + (it.r.length > 1 ? it.r.length + ' sizes' : '&nbsp;') + '</div>' + t + '</div>');
    return c;
  }
  function rowsOf(items) {
    const out = []; let cur = null;
    items.forEach(it => {
      if (it.r.length > J.wide) { cur = null; const r = el('div', 'row'); r.appendChild(card(it)); out.push(r); return; }
      if (!cur || cur.children.length === 3) { cur = el('div', 'row'); out.push(cur); }
      cur.appendChild(card(it));
    });
    return out;
  }
  const secHead = (s, i, more) => el('div', 'sec' + (more ? ' sec--more' : ''), '<span class="no">' + two(i + 1) + '</span><h2>' + (more ? '<small>continued</small>' : '<small>Section ' + two(i + 1) + '</small>') + esc(s.n) + '</h2>' +
    (more ? '' : '<span class="n">' + s.items.length + (s.items.length === 1 ? ' product' : ' products') + '</span>'));
  const starts = [];
  newPage();
  J.secs.forEach((s, i) => {
    let head = secHead(s, i, false);
    body.appendChild(head);
    const rows = rowsOf(s.items);
    rows.forEach((r, k) => {
      body.appendChild(r);
      if (fits()) return;
      body.removeChild(r);
      if (k === 0) { body.removeChild(head); newPage(); body.appendChild(head); }
      else { newPage(); body.appendChild(secHead(s, i, true)); }
      body.appendChild(r);
    });
    starts.push(pages.indexOf(head.closest('.page')) + 2);
  });
  // a page's header names the sections on it
  pages.forEach((p, i) => {
    const names = [...p.querySelectorAll('.sec h2')].map(h => h.lastChild.textContent);
    p.querySelector('.hd .s').textContent = [...new Set(names)].join(' · ');
    p.querySelector('.pg').innerHTML = two(i + 2) + ' <i>/ ' + two(pages.length + 1) + '</i>';
  });
  // the cover: the group's own picture, its name, the numbers and what is inside
  const n = J.secs.reduce((a, s) => a + s.items.length, 0), parts = J.secs.reduce((a, s) => a + s.items.reduce((b, it) => b + it.r.length, 0), 0);
  const many = J.secs.length > 8, cols = many ? 2 : 1;
  const tocRows = Math.ceil(J.secs.length / cols);
  const heroH = Math.max(82, Math.min(128, 150 - tocRows * 6.2 - (J.lede.length > 120 ? 6 : 0)));
  const ts = J.title.length > 22 ? 34 : J.title.length > 14 ? 40 : 48;
  cover.style.setProperty('--hh', heroH + 'mm'); cover.style.setProperty('--iw', (heroH - 12) + 'mm');
  cover.style.setProperty('--ty', (32 + heroH + 9) + 'mm'); cover.style.setProperty('--ts', ts + 'pt'); cover.style.setProperty('--cols', cols);
  cover.innerHTML = '<div class="cv__top"><img src="' + J.logo + '" alt=""><div class="cv__ed"><b>Product catalogue</b>' + esc(J.edition) + '</div></div>' +
    '<div class="cv__hero">' + (J.cover ? '<img src="' + J.cover + '" alt="">' : '') + '<span class="cv__tag"><i>●</i> ' + n + (n === 1 ? ' product' : ' products') + '</span></div>' +
    '<div class="cv__title"><small>Bait Al Maqdis</small><h1>' + esc(J.title) + '</h1>' + (J.lede ? '<p>' + esc(J.lede) + '</p>' : '') +
      '<div class="cv__stats"><div><b>' + n + '</b><span>Products</span></div><div><b>' + parts + '</b><span>Sizes &amp; part nos.</span></div><div><b>' + J.secs.length + '</b><span>' + (J.secs.length === 1 ? 'Section' : 'Sections') + '</span></div><div><b>' + (pages.length + 1) + '</b><span>Pages</span></div></div>' +
      '<div class="cv__toc"><h4>Inside</h4><ol>' + J.secs.map((s, i) => '<li><em>' + two(i + 1) + '</em><span>' + esc(s.n) + '</span><b>p. ' + starts[i] + '</b></li>').join('') + '</ol></div></div>' +
    '<div class="cv__foot"><div class="a"><b>' + esc(J.shop.name) + '</b><span>' + esc(J.shop.line) + '</span></div>' +
      '<div class="c"><div><i>Visit</i>' + esc(J.shop.address) + '</div><div><i>Call</i>' + esc(J.shop.phone) + '</div><div><i>Email</i>' + esc(J.shop.email) + '</div></div></div>';
  await Promise.all([...document.images].map(i => i.complete ? 0 : new Promise(r => { i.onload = i.onerror = r; })));
  const title = cover.querySelector('.cv__title'), foot = cover.querySelector('.cv__foot');
  window.__done = { pages: pages.length + 1, overlap: title.getBoundingClientRect().bottom > foot.getBoundingClientRect().top - 8, n, parts };
})();
`;

(async () => {
  const want = process.argv.slice(2);
  const cats = ordered(DATA.cats).filter(c => !want.length || want.indexOf(c.id) >= 0);
  fs.mkdirSync(OUT, { recursive: true }); fs.mkdirSync(WORK, { recursive: true });
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 794, height: 1123 } });
  for (const c of cats) {
    const html = path.join(WORK, c.id + '.html');
    fs.writeFileSync(html, pageHTML(c));
    await page.goto(fileUrl(html));
    await page.waitForFunction(() => window.__done, null, { timeout: 120000 });
    const done = await page.evaluate(() => window.__done);
    if (done.overlap) console.warn('  ! ' + c.id + ': the cover is too full');
    await page.pdf({ path: path.join(OUT, c.id + '.pdf'), format: 'A4', printBackground: true, preferCSSPageSize: true });
    // the cover as a small picture for the app
    const png = path.join(WORK, c.id + '-cover.png');
    await page.locator('.page.cv').screenshot({ path: png });
    execFileSync('convert', [png, '-resize', '420x', '-strip', '-quality', '82', path.join(OUT, c.id + '.jpg')]);
    const mb = fs.statSync(path.join(OUT, c.id + '.pdf')).size / 1048576;
    console.log(c.id.padEnd(16) + String(done.pages).padStart(3) + ' pages ' + String(done.n).padStart(4) + ' products ' + mb.toFixed(2) + ' MB');
  }
  await browser.close();
  // the list the app shows, in the home screen's order (every group, whatever was made this time)
  const list = ordered(DATA.cats).filter(c => fs.existsSync(path.join(OUT, c.id + '.pdf'))).map(c => {
    const n = c.secs.reduce((a, s) => a + s.items.length, 0), f = path.join(OUT, c.id + '.pdf');
    const pages = (fs.readFileSync(f, 'latin1').match(/\/Type\s*\/Page[^s]/g) || []).length;
    return { id: c.id, file: 'catalogues/' + c.id + '.pdf', cover: 'catalogues/' + c.id + '.jpg', title: titleOf(c), n, pages, mb: Math.round(fs.statSync(f).size / 104857.6) / 10 };
  });
  fs.writeFileSync(path.join(BAM, 'pdfs.js'), '/* the Bait Al Maqdis catalogues packed in the app: made by app/tools/bam_pdfs.cjs */\nwindow.BAM_PDFS = ' + JSON.stringify(list) + ';\n');
  console.log(list.length + ' catalogues listed in app/bam/pdfs.js');
})().catch(e => { console.error(e); process.exit(1); });
