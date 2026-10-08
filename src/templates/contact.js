import { SITE, UAEMAP } from '../data.js';
import { I } from './icons.js';
import { page, pageHero, esc, eyebrow, btn } from './layout.js';
import { form } from './shared.js';

function map() {
  const { w, h, paths, places } = UAEMAP;
  const hq = places.find((p) => p.hq);
  const labels = places
    .filter((p) => !p.hq)
    .map((p) => `<g class="umap__place" transform="translate(${p.x} ${p.y})"><circle r="3.2"/><text x="9" y="4">${esc(p.name)}</text></g>`)
    .join('');
  return `
<svg class="umap" viewBox="0 0 ${w} ${h}" role="img" aria-label="Map of the northern Emirates showing AQM's office in Ajman Free Zone" data-umap>
  <defs>
    <pattern id="umdots" width="9" height="9" patternUnits="userSpaceOnUse"><circle cx="1.5" cy="1.5" r="1.1" fill="#6f8fd0" opacity=".38"/></pattern>
    <radialGradient id="umglow"><stop offset="0" stop-color="#ff8a3d" stop-opacity=".55"/><stop offset="1" stop-color="#ff8a3d" stop-opacity="0"/></radialGradient>
  </defs>
  <g class="umap__grid">${Array.from({ length: 11 }, (_, i) => `<line x1="${(i * w) / 10}" y1="0" x2="${(i * w) / 10}" y2="${h}"/>`).join('')}${Array.from({ length: 8 }, (_, i) => `<line x1="0" y1="${(i * h) / 7}" x2="${w}" y2="${(i * h) / 7}"/>`).join('')}</g>
  <path class="umap__land umap__land--other" d="${paths.oman}${paths.iran}"/>
  <path class="umap__land" d="${paths.uae}" fill="url(#umdots)"/>
  <path class="umap__coast" d="${paths.uae}" pathLength="1"/>
  <text class="umap__sea" x="${w * 0.17}" y="${h * 0.36}">ARABIAN GULF</text>
  <text class="umap__sea" x="${w * 0.84}" y="${h * 0.62}">GULF OF OMAN</text>
  ${labels}
  <g class="umap__hq" transform="translate(${hq.x} ${hq.y})">
    <circle r="90" fill="url(#umglow)"/>
    <circle class="umap__pulse" r="10"/><circle class="umap__pulse umap__pulse--2" r="10"/>
    <circle class="umap__pin" r="7"/>
    <line x1="0" y1="0" x2="-150" y2="-150" class="umap__leader"/>
    <g transform="translate(-150 -150)">
      <rect x="-210" y="-58" width="210" height="58" rx="4" class="umap__tag"/>
      <text x="-196" y="-34" class="umap__tag-k">AQM OILFIELD</text>
      <text x="-196" y="-14" class="umap__tag-v">C1 Tower · Ajman Free Zone</text>
    </g>
  </g>
</svg>`;
}

export default function contact() {
  const body = `
${pageHero({
  eyebrowText: 'Contact us',
  title: 'Start the <em>conversation.</em>',
  lead: 'Start the conversation to establish a good relationship and business. Call, message or visit — we’ll be in touch shortly.',
  crumbs: [['Contact us']],
  cls: 'phero--contact',
})}

<section class="reach">
  <div class="wrap">
    <div class="reach__grid" data-stagger>
      <a class="rc" href="tel:${SITE.tel}" data-cursor="Call">
        <span class="rc__icon">${I.phone}</span><small>Call us</small><b>${esc(SITE.phone)}</b><span class="rc__go">${I.arrowUR}</span>
      </a>
      <a class="rc rc--wa" href="https://wa.me/${SITE.whatsapp}" target="_blank" rel="noopener" data-cursor="Chat">
        <span class="rc__icon">${I.whatsapp}</span><small>WhatsApp</small><b>Message sales</b><span class="rc__go">${I.arrowUR}</span>
      </a>
      <a class="rc" href="mailto:${SITE.email}" data-cursor="Write">
        <span class="rc__icon">${I.mail}</span><small>Email us</small><b>${esc(SITE.email)}</b><span class="rc__go">${I.arrowUR}</span>
      </a>
      <a class="rc" href="${SITE.maps}" target="_blank" rel="noopener" data-cursor="Directions">
        <span class="rc__icon">${I.pin}</span><small>Address</small><b>C1 Tower, First Floor, Ajman Free Zone</b><span class="rc__go">${I.arrowUR}</span>
      </a>
    </div>
  </div>
</section>

<section class="talk talk--page" id="message">
  <div class="wrap talk__grid">
    <div class="talk__copy">
      ${eyebrow('(01)', 'Send a message')}
      <h2 class="h2" data-split>Have other <em>questions?</em></h2>
      <p class="lead" data-reveal>Share sizes, ratings, materials and quantities — or attach your enquiry list from the catalogue — and our sales team will respond with availability and pricing.</p>
      <div class="hours-card" data-reveal>
        <p class="status status--block" data-status><i></i><span>Ajman office</span></p>
        <dl class="hours hours--lg" data-hours>
          ${['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map((d, i) => `<div data-day="${(i + 1) % 7}"><dt>${d}</dt><dd>${i < 6 ? '8:00am – 6:30pm' : 'Closed'}</dd></div>`).join('')}
        </dl>
        <p class="ftr__clock">Local time in Ajman <b data-clock>--:--</b> <span class="muted">(GST, UTC+4)</span></p>
      </div>
    </div>
    ${form()}
  </div>
</section>

<section class="visit" id="visit">
  <div class="wrap visit__grid">
    <div class="visit__copy">
      ${eyebrow('(02)', 'Visit us')}
      <h2 class="h2" data-split>Ajman <em>Free Zone.</em></h2>
      <address class="visit__addr" data-reveal>${SITE.address.map(esc).join('<br>')}</address>
      <p class="coords" data-reveal><span>25.40° N</span><span>55.44° E</span></p>
      <div class="visit__ctas">
        ${btn(SITE.maps, 'Open in Google Maps', { icon: I.external, attrs: 'target="_blank" rel="noopener"' })}
      </div>
      <div class="visit__social">
        <p class="eyebrow"><span class="eyebrow__n">●</span>Follow our social media</p>
        <div class="ftr__social">
          <a href="#" aria-label="Facebook" data-social>${I.facebook}</a>
          <a href="#" aria-label="Instagram" data-social>${I.instagram}</a>
          <a href="#" aria-label="X (Twitter)" data-social>${I.x}</a>
          <a href="#" aria-label="YouTube" data-social>${I.youtube}</a>
        </div>
      </div>
    </div>
    <div class="visit__map">${map()}</div>
  </div>
</section>
`;
  return page({
    id: 'contact',
    title: 'Contact Us — AQM Oilfield Equipments Trading F.Z.C',
    desc: 'Call +971 52 725 1355, email Sales@aqmoilfield.com or visit C1 Tower, First Floor, Ajman Free Zone. Open Monday to Saturday, 8:00am – 6:30pm.',
    body,
  });
}
