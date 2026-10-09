import { SITE, PRODUCTS } from '../data.js';
import { I } from './icons.js';
import { page, esc, btn } from './layout.js';
import { productCard, addButton, catOf } from './shared.js';

// Specs for the original catalogue lines are read from their own descriptions, never invented.
export function facts(p) {
  if (p.specs) return p.specs;
  const d = p.desc;
  const out = [];
  let m = d.match(/sizes? from ([^\s,]+(?: ?mm)?) to ([^\s,]+(?: ?mm)?)/i);
  if (m) out.push(['Size range', `${m[1]} – ${m[2]}`]);
  m = d.match(/(?:ratings?|classes) including ([^.]*?)(?:,? and higher|\. |\.$| We )/i);
  if (m) out.push(['Ratings', (/^\d/.test(m[1]) ? 'Class ' : '') + m[1]]);
  else if ((m = d.match(/Available in ((?:\d{3,4} PSI,? ?(?:and )?)+)/i))) out.push(['Ratings', m[1].replace(/,? and /, ', ').trim()]);
  m = d.match(/types? \(([^)]+)\)/i);
  if (m) out.push(['Types', m[1]]);
  m = d.match(/(?:such as|including) ((?:[A-Z][\w-]*(?: [A-Z][\w-]*)?, )+(?:and )?[A-Z][\w-]*(?: [A-Z][\w-]*)?) (?:types|flanges)/);
  if (m) out.push(['Types', m[1].replace(', and ', ', ')]);
  const g = [...new Set(d.match(/\b(?:304L?|316L?|321|310S?|904L|Super Duplex|Duplex|EN8)\b/g) || [])];
  if (g.length) out.push(['Grades', g.join(' · ')]);
  return out;
}

// Lines kept out of Google until the owner confirms them (asbestos products are restricted in the UAE).
export const UNLISTED = new Set(['asbestos-cut-gaskets-sheets']);

// Shorten at a word boundary for meta descriptions.
const cut = (s, n) => (s.length <= n ? s : `${s.slice(0, s.lastIndexOf(' ', n)).replace(/[,;:.]$/, '')}…`);

const QUOTE = `Ask for a quote at our Al Quoz, Dubai counter: ${SITE.phone}.`;

export default function product(p) {
  const b = '../';
  const c = catOf(p.cat);
  const siblings = PRODUCTS.filter((x) => x.cat === p.cat);
  const idx = PRODUCTS.indexOf(p);
  const prev = PRODUCTS[(idx - 1 + PRODUCTS.length) % PRODUCTS.length];
  const next = PRODUCTS[(idx + 1) % PRODUCTS.length];
  const related = siblings.filter((x) => x !== p).slice(0, 4);
  const f = facts(p);
  const gallery = p.range && p.range.length > 1;

  const body = `
<section class="pdp" data-pdp>
  <div class="wrap">
    <nav class="crumbs" aria-label="Breadcrumb">
      <a href="${b}index.html">Home</a><i aria-hidden="true">/</i><a href="${b}products.html">Products</a><i aria-hidden="true">/</i><a href="${b}products.html#${c.slug}">${esc(c.name)}</a><i aria-hidden="true">/</i><span aria-current="page">${esc(p.name)}</span>
    </nav>
    <div class="pdp__grid">
      <div class="pdp__media">
        <figure class="pdp__frame" data-zoom>
          <img src="${b}${p.img}" alt="${esc(p.name)}" width="600" height="600" fetchpriority="high" data-main-img>
          <figcaption class="pdp__cap" data-main-cap>${gallery ? esc(p.range[0].name) : ''}</figcaption>
        </figure>
        ${gallery ? `
        <div class="thumbs" role="group" aria-label="Items in this range" data-thumbs>
          ${p.range.map((r, i) => `<button class="thumb${i === 0 ? ' is-on' : ''}" type="button" data-src="${b}${r.img}" data-cap="${esc(r.name)}" aria-pressed="${i === 0}"><img src="${b}${r.img}" alt="" width="96" height="96" loading="lazy"><span>${esc(r.name)}</span></button>`).join('')}
        </div>` : ''}
      </div>
      <div class="pdp__info">
        <a class="pdp__cat" href="${b}products.html#${c.slug}">${esc(c.name)}</a>
        <h1 class="pdp__t">${esc(p.name)}</h1>
        <p class="pdp__ref">Ref <b>${p.ref}</b> <span>Quote this ref when you call</span></p>
        <p class="pdp__desc">${esc(p.desc)}</p>
        ${f.length ? `<table class="specs"><caption class="sr">Specifications</caption><tbody>${f.map(([k, v]) => `<tr><th scope="row">${esc(k)}</th><td>${esc(v)}</td></tr>`).join('')}</tbody></table>` : ''}
        <div class="buy">
          <div class="qty" data-qty>
            <button type="button" data-qty-dec aria-label="Decrease quantity">${I.minus}</button>
            <input id="qty" type="number" min="1" value="1" inputmode="numeric" aria-label="Quantity" data-qty-input>
            <button type="button" data-qty-inc aria-label="Increase quantity">${I.plus}</button>
          </div>
          ${addButton(p, { cls: 'btn btn--red buy__add', withQty: true })}
        </div>
        <div class="callbox">
          ${I.phone}
          <div><p>Order or check stock</p><a href="tel:${SITE.tel}">${esc(SITE.phone)}</a><small>Mon–Sat 7:30am – 6:00pm</small></div>
          <button class="btn btn--line btn--sm" type="button" data-copy="${esc(SITE.phone)}">${I.copy}<span>Copy</span></button>
        </div>
        <p class="pdp__note">Sizes, ratings and grades depend on current stock. We confirm them with you before you collect.</p>
      </div>
    </div>
  </div>
</section>

${related.length ? `
<section class="sec sec--grey">
  <div class="wrap">
    <div class="sec__head">
      <div><p class="label">Same category</p><h2 class="h2">More ${esc(c.name.toLowerCase())}</h2></div>
      ${btn(`${b}products.html#${c.slug}`, `All ${c.count} lines`, { kind: 'line' })}
    </div>
    <div class="rail">${related.map((x) => productCard(x, b)).join('')}</div>
  </div>
</section>` : ''}

<nav class="pnav wrap" aria-label="Previous and next product">
  <a href="${b}products/${prev.slug}.html">${I.arrowL}<span><small>Previous</small>${esc(prev.name)}</span></a>
  <a href="${b}products/${next.slug}.html"><span><small>Next</small>${esc(next.name)}</span>${I.arrow}</a>
</nav>`;
  return page({
    id: 'product',
    base: b,
    title: `${p.name} in Dubai | Fakhri Tools`.length <= 60 ? `${p.name} in Dubai | Fakhri Tools` : `${p.name} | Fakhri Tools`,
    desc: `${cut(p.desc, 158 - QUOTE.length)} ${QUOTE}`,
    robots: UNLISTED.has(p.slug) ? 'noindex, follow' : '',
    path: `products/${p.slug}.html`,
    crumbs: [['Products', 'products.html'], [p.name, `products/${p.slug}.html`]],
    body,
  });
}
