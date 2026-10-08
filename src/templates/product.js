import { SITE, CATEGORIES, PRODUCTS, DOWNLOADS } from '../data.js';
import { I } from './icons.js';
import { page, esc, eyebrow, btn, roll } from './layout.js';
import { productCard } from './shared.js';

// "At a glance" facts — pulled only from the product's own description, never invented.
export function facts(p) {
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

const DOCS_FOR = {
  flanges: ['class-150', 'class-300', 'pn16', 'jis-10k'],
  'pipe-tubings': ['schedule-chart', 'sch-40', 'sch-80'],
  'butt-welded-fittings': ['schedule-chart', 'sch-40', 'sch-80'],
  'threaded-forged-fittings': ['schedule-chart', 'sch-80', 'sch-160'],
  valves: ['class-150', 'pn16'],
  'gaskets-sheets': ['class-150', 'pn16'],
};

export default function product(p) {
  const b = '../';
  const cat = CATEGORIES.find((c) => c.slug === p.cat);
  const siblings = PRODUCTS.filter((x) => x.cat === p.cat);
  const idx = PRODUCTS.indexOf(p);
  const prev = PRODUCTS[(idx - 1 + PRODUCTS.length) % PRODUCTS.length];
  const next = PRODUCTS[(idx + 1) % PRODUCTS.length];
  const code = `${String(cat.n).padStart(2, '0')}.${String(siblings.indexOf(p) + 1).padStart(2, '0')}`;
  const f = facts(p);
  const docs = ['brochure', ...(DOCS_FOR[p.cat] || [])].map((id) => DOWNLOADS.find((d) => d.id === id));
  const related = siblings.filter((x) => x !== p).slice(0, 4);
  const wa = `https://wa.me/${SITE.whatsapp}?text=${encodeURIComponent(`Hello AQM, I'd like a quotation for: ${p.name} (${cat.name}).`)}`;
  const mail = `mailto:${SITE.email}?subject=${encodeURIComponent(`Enquiry — ${p.name}`)}&body=${encodeURIComponent(`Hello AQM team,\n\nI'd like a quotation for: ${p.name} (${cat.name}).\n\nSize / rating / material:\nQuantity:\nDelivery location:\n\nThank you.`)}`;

  const body = `
<section class="pdp" data-pdp>
  <div class="wrap">
    <nav class="crumbs" aria-label="Breadcrumb">
      <a href="${b}index.html">Home</a><i>/</i><a href="${b}products.html">Products</a><i>/</i><a href="${b}products.html#${cat.slug}">${esc(cat.name)}</a><i>/</i><span aria-current="page">${esc(p.name)}</span>
    </nav>
    <div class="pdp__grid">
      <div class="pdp__media">
        <div class="pdp__frame" data-zoom>
          <img src="${b}${p.img}" alt="${esc(p.name)}" fetchpriority="high" data-zoom-img>
          <span class="pdp__code">No. ${code}</span>
          <span class="pdp__hint">${I.search}Hover to inspect</span>
        </div>
      </div>
      <div class="pdp__info">
        ${eyebrow(String(cat.n).padStart(2, '0'), cat.name)}
        <h1 class="pdp__title" data-split="chars">${esc(p.name)}</h1>
        <p class="pdp__desc" data-reveal>${esc(p.desc || 'Full specifications available on request — contact our sales team for sizes, ratings and materials.')}</p>
        <dl class="glance" data-stagger>
          <div><dt>Family</dt><dd><a href="${b}products.html#${cat.slug}">${esc(cat.name)}</a></dd></div>
          ${f.map(([k, v]) => `<div><dt>${esc(k)}</dt><dd>${esc(v)}</dd></div>`).join('')}
          <div><dt>Standards</dt><dd>As per international standards — confirm on enquiry</dd></div>
        </dl>
        <div class="pdp__buy" data-reveal>
          <div class="qty" data-qty>
            <button type="button" data-qty-dec aria-label="Decrease quantity">${I.minus}</button>
            <input type="number" min="1" value="1" inputmode="numeric" aria-label="Quantity" data-qty-input>
            <button type="button" data-qty-inc aria-label="Increase quantity">${I.plus}</button>
          </div>
          <button class="btn btn--solid pdp__add" type="button" data-rfq-add data-with-qty data-slug="${p.slug}" data-name="${esc(p.name)}" data-cat="${esc(cat.name)}" data-img="${p.img}" data-magnetic>
            <span class="btn__fill"></span>${roll('Add to enquiry')}<span class="btn__icon">${I.plus}</span>
          </button>
        </div>
        <div class="pdp__ask" data-reveal>
          <a class="channel channel--sm" href="${wa}" target="_blank" rel="noopener"><span class="channel__icon">${I.whatsapp}</span><span><small>Quick question?</small>Ask on WhatsApp</span>${I.arrowUR}</a>
          <a class="channel channel--sm" href="${mail}"><span class="channel__icon">${I.mail}</span><span><small>Prefer email?</small>${esc(SITE.email)}</span>${I.arrowUR}</a>
        </div>
        <div class="pdp__docs" data-reveal>
          <p class="pdp__docs-h">Technical documents</p>
          <ul>${docs.map((d) => `<li><a href="${d.url}" target="_blank" rel="noopener">${I.file}<span>${esc(d.title)}</span><small>${esc(d.std)} · PDF</small>${I.arrowUR}</a></li>`).join('')}</ul>
        </div>
      </div>
    </div>
  </div>
</section>

${related.length ? `
<section class="related">
  <div class="wrap">
    <div class="related__head">
      ${eyebrow('+', `More in ${cat.name}`)}
      ${btn(`${b}products.html#${cat.slug}`, `All ${cat.name.toLowerCase()}`, { variant: 'ghost' })}
    </div>
    <div class="pgrid pgrid--4">${related.map((x) => productCard(x, b)).join('')}</div>
  </div>
</section>` : ''}

<nav class="pnav wrap" aria-label="Product navigation">
  <a class="pnav__link" href="${b}products/${prev.slug}.html"><small>${I.arrow} Previous</small><b>${esc(prev.name)}</b></a>
  <a class="pnav__link pnav__link--next" href="${b}products/${next.slug}.html"><small>Next ${I.arrow}</small><b>${esc(next.name)}</b></a>
</nav>
`;
  return page({
    id: 'product',
    base: b,
    title: `${p.name} — ${cat.name} | AQM Oilfield`,
    desc: (p.desc || `${p.name} from AQM Oilfield Equipments Trading F.Z.C.`).slice(0, 158),
    body,
  });
}
