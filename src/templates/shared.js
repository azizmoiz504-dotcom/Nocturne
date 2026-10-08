import { SITE, PARTNERS, CATEGORIES } from '../data.js';
import { I } from './icons.js';
import { esc, eyebrow, btn, roll } from './layout.js';

export const catName = (slug) => CATEGORIES.find((c) => c.slug === slug)?.name ?? '';

export function partnersBlock({ n = '(06)', b = '' } = {}) {
  const names = PARTNERS.map((p) => `<span>${esc(p.name)}</span><i>✦</i>`).join('');
  return `
<section class="partners" id="partners">
  <div class="marquee" data-marquee aria-hidden="true"><div class="marquee__track">${names}${names}</div></div>
  <div class="wrap partners__grid">
    <div class="partners__copy">
      ${eyebrow(n, 'Industrial supply')}
      <h2 class="h2" data-split>Reliable industrial <em>supply partner.</em></h2>
      <p class="lead" data-reveal>We supply high-quality industrial piping materials — pipes, fittings, flanges and valves — for oil &amp; gas, construction and industrial sectors across the UAE and international markets, working with manufacturers including:</p>
    </div>
    <ul class="logos" data-stagger>
      ${PARTNERS.map((p) => `
      <li class="logo" style="--bg:${p.bg}">
        <img class="logo__mono" src="${b}assets/img/partners/${p.slug}-mono.webp" alt="${esc(p.name)}" loading="lazy">
        <img class="logo__color" src="${b}assets/img/partners/${p.slug}.webp" alt="" aria-hidden="true" loading="lazy">
      </li>`).join('')}
    </ul>
  </div>
</section>`;
}

export function talkBlock({ n = '(08)', b = '', id = 'talk', title = 'Let’s start <em>talking.</em>' } = {}) {
  return `
<section class="talk" id="${id}">
  <div class="wrap talk__grid">
    <div class="talk__copy">
      ${eyebrow(n, 'Get in touch')}
      <h2 class="h2" data-split>${title}</h2>
      <p class="lead" data-reveal>Tell us what your project needs — sizes, ratings, materials and quantities. We'll come back with availability and a quotation.</p>
      <ul class="channels" data-stagger>
        <li><a href="tel:${SITE.tel}" class="channel"><span class="channel__icon">${I.phone}</span><span><small>Call us</small>${esc(SITE.phone)}</span>${I.arrowUR}</a></li>
        <li><a href="https://wa.me/${SITE.whatsapp}" target="_blank" rel="noopener" class="channel"><span class="channel__icon">${I.whatsapp}</span><span><small>WhatsApp</small>Chat with sales</span>${I.arrowUR}</a></li>
        <li><a href="mailto:${SITE.email}" class="channel"><span class="channel__icon">${I.mail}</span><span><small>Email us</small>${esc(SITE.email)}</span>${I.arrowUR}</a></li>
      </ul>
      <p class="status status--block" data-status><i></i><span>Ajman office</span></p>
    </div>
    ${form(b)}
  </div>
</section>`;
}

export function form(b = '') {
  const field = (name, label, type = 'text', extra = '') => `
      <label class="field">
        <input type="${type}" name="${name}" placeholder=" " ${extra}>
        <span class="field__label">${label}</span>
        <span class="field__line" aria-hidden="true"></span>
      </label>`;
  return `
    <form class="form" data-form novalidate id="form">
      <div class="form__head"><span class="eyebrow"><span class="eyebrow__n">→</span>Send a message</span><span class="form__req">* Required</span></div>
      <div class="form__grid">
        ${field('name', 'Name *', 'text', 'required autocomplete="name"')}
        ${field('company', 'Company', 'text', 'autocomplete="organization"')}
        ${field('phone', 'Phone', 'tel', 'autocomplete="tel"')}
        ${field('email', 'Email *', 'email', 'required autocomplete="email"')}
        <div class="field--full">${field('subject', 'Subject')}</div>
        <label class="field field--full field--area">
          <textarea name="message" rows="4" placeholder=" " required></textarea>
          <span class="field__label">Message *</span>
          <span class="field__line" aria-hidden="true"></span>
        </label>
      </div>
      <div class="form__rfq" data-form-rfq hidden>
        <p class="form__rfq-h">${I.list}<span>Attached enquiry list</span><b data-form-rfq-count>0</b></p>
        <ul data-form-rfq-list></ul>
      </div>
      <div class="form__foot">
        <button class="btn btn--solid" type="submit" data-magnetic><span class="btn__fill"></span>${roll('Send message')}<span class="btn__icon">${I.arrow}</span></button>
        <p class="form__note">Prototype form — on submit, your message is prepared for email or WhatsApp.</p>
      </div>
      <div class="form__done" data-form-done hidden>
        <span class="form__tick">${I.check}</span>
        <h3>Your message is ready.</h3>
        <p>Choose how to send it — your details and enquiry list are already filled in.</p>
        <div class="form__done-ctas">
          <a class="btn btn--solid" href="#" data-done-mail><span class="btn__fill"></span>${roll('Send by email')}<span class="btn__icon">${I.mail}</span></a>
          <a class="btn btn--ghost" href="#" data-done-wa target="_blank" rel="noopener"><span class="btn__fill"></span>${roll('Send on WhatsApp')}<span class="btn__icon">${I.whatsapp}</span></a>
        </div>
        <button class="link-btn" type="button" data-form-reset>Write another message</button>
      </div>
    </form>`;
}

export function productCard(p, b = '', { lazy = true } = {}) {
  return `
<article class="pcard" data-pcard data-cat="${p.cat}" data-slug="${p.slug}" data-name="${esc(p.name)}" data-search="${esc((p.name + ' ' + catName(p.cat) + ' ' + p.desc).toLowerCase())}">
  <a class="pcard__link" href="${b}products/${p.slug}.html" data-cursor="View">
    <div class="pcard__img"><img src="${b}${p.img}" alt="${esc(p.name)}" ${lazy ? 'loading="lazy"' : ''} decoding="async"></div>
    <div class="pcard__body">
      <p class="pcard__cat">${esc(catName(p.cat))}</p>
      <h3 class="pcard__title">${esc(p.name)}</h3>
    </div>
  </a>
  <button class="pcard__add" type="button" data-rfq-add data-slug="${p.slug}" data-name="${esc(p.name)}" data-cat="${esc(catName(p.cat))}" data-img="${p.img}" aria-label="Add ${esc(p.name)} to enquiry list">
    <span class="pcard__add-plus">${I.plus}</span><span class="pcard__add-check">${I.check}</span><span class="pcard__add-label">Add to enquiry</span>
  </button>
</article>`;
}

// Engineering drawing of a weld-neck flange (front view + half section) that draws itself behind the hero model.
export function blueprint() {
  const cx = 300, cy = 300;
  const holes = Array.from({ length: 8 }, (_, k) => {
    const a = (k / 8) * Math.PI * 2 + Math.PI / 8;
    const x = cx + Math.cos(a) * 158, y = cy + Math.sin(a) * 158;
    return `<circle class="bp" cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="13"/><path class="bp bp--c" d="M${(x - 20).toFixed(1)} ${y.toFixed(1)}h40M${x.toFixed(1)} ${(y - 20).toFixed(1)}v40"/>`;
  }).join('');
  return `
<svg class="hero__blueprint" viewBox="0 0 1200 600" preserveAspectRatio="xMidYMid meet" aria-hidden="true" data-blueprint>
  <g class="bp-g">
    <circle class="bp" cx="${cx}" cy="${cy}" r="196"/>
    <circle class="bp" cx="${cx}" cy="${cy}" r="132"/>
    <circle class="bp" cx="${cx}" cy="${cy}" r="96"/>
    <circle class="bp bp--c" cx="${cx}" cy="${cy}" r="158"/>
    <path class="bp bp--c" d="M${cx - 240} ${cy}h480M${cx} ${cy - 240}v480"/>
    ${holes}
    <path class="bp bp--dim" d="M${cx - 196} ${cy + 236}h392M${cx - 196} ${cy + 226}v20M${cx + 196} ${cy + 226}v20"/>
    <text class="bp-t" x="${cx}" y="${cy + 228}">Ø OD</text>
    <path class="bp bp--dim" d="M${cx - 158} ${cy - 222}h316M${cx - 158} ${cy - 232}v20M${cx + 158} ${cy - 232}v20"/>
    <text class="bp-t" x="${cx}" y="${cy - 230}">Ø BOLT CIRCLE</text>
    <text class="bp-t bp-t--l" x="${cx - 236}" y="${cy - 262}">FRONT VIEW</text>
  </g>
  <g class="bp-g">
    <path class="bp" d="M720 104v392h52V104z"/>
    <path class="bp" d="M772 168l18 0l100 74v116l-100 74h-18"/>
    <path class="bp" d="M890 242h170M890 358h170"/>
    <path class="bp" d="M712 168v264h8"/>
    <path class="bp bp--hatch" d="M720 120l52-16M720 150l52-16M720 180l52-16M720 440l52-16M720 470l52-16M720 496l52-16"/>
    <path class="bp bp--c" d="M680 300h420"/>
    <path class="bp bp--dim" d="M720 540h52M720 530v20M772 530v20"/>
    <text class="bp-t" x="746" y="532">T</text>
    <path class="bp bp--dim" d="M720 572h170M890 562v20"/>
    <text class="bp-t" x="805" y="564">L · HUB</text>
    <text class="bp-t bp-t--l" x="680" y="76">SECTION A–A</text>
  </g>
</svg>`;
}
