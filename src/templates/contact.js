import { SITE } from '../data.js';
import { I } from './icons.js';
import { page, pageHead, esc, btn, label, hoursTable, status, storeSchema } from './layout.js';
import { storeMap } from './shared.js';

function form() {
  const f = (id, lab, type = 'text', attrs = '') => `
      <div class="field">
        <label for="f-${id}">${lab}</label>
        <input id="f-${id}" name="${id}" type="${type}" ${attrs}>
      </div>`;
  return `
  <form class="eform" id="enquiry" data-form novalidate>
    <div class="eform__grid">
      ${f('name', 'Name <em>*</em>', 'text', 'required autocomplete="name"')}
      ${f('company', 'Company', 'text', 'autocomplete="organization"')}
      ${f('phone', 'Phone <em>*</em>', 'tel', 'required autocomplete="tel" inputmode="tel"')}
      ${f('email', 'Email', 'email', 'autocomplete="email"')}
      <div class="field field--full">
        <label for="f-message">What do you need? <em>*</em></label>
        <textarea id="f-message" name="message" rows="5" required placeholder="Item, size, rating or grade, quantity, and when you need it"></textarea>
      </div>
    </div>
    <div class="eform__list" data-form-list hidden>
      <p>${I.list}<span>Your quote list is attached</span><b data-form-count>0</b></p>
      <ul data-form-items></ul>
    </div>
    <div class="eform__foot">
      <button class="btn btn--red" type="submit"><span>Prepare my enquiry</span>${I.arrow}</button>
      <p class="eform__hint"><em>*</em> Required</p>
    </div>
    <div class="eform__done" data-form-done hidden>
      <p class="eform__done-t">${I.check}<span>Your enquiry is ready</span></p>
      <pre class="eform__msg" data-form-msg></pre>
      <div class="eform__done-ctas">
        <button class="btn btn--red" type="button" data-form-copy>${I.copy}<span>Copy enquiry</span></button>
        <a class="btn btn--navy" href="tel:${SITE.tel}">${I.phone}<span>Call ${esc(SITE.phone)}</span></a>
        ${SITE.email ? `<a class="btn btn--line" href="#" data-form-mail>${I.mail}<span>Send by email</span></a>` : ''}
        ${SITE.whatsapp ? `<a class="btn btn--line" href="#" data-form-wa target="_blank" rel="noopener">${I.whatsapp}<span>Send on WhatsApp</span></a>` : ''}
      </div>
      <button class="linkbtn" type="button" data-form-edit>Edit enquiry</button>
    </div>
  </form>`;
}

export default function contact() {
  const body = `
${pageHead({ title: 'Contact &amp; visit', lead: 'Call the counter, visit us in Al Quoz, or write down what you need and we’ll format it for you.', crumbs: [['Contact']] })}
<section class="sec sec--tight">
  <div class="wrap reach">
    <div class="rcard rcard--call">
      <span class="rcard__ic">${I.phone}</span>
      <p class="rcard__k">Call the counter</p>
      <a class="rcard__v" href="tel:${SITE.tel}">${esc(SITE.phone)}</a>
      <div class="rcard__ctas">
        ${btn(`tel:${SITE.tel}`, 'Call now', { kind: 'red', icon: I.phone })}
        <button class="btn btn--line" type="button" data-copy="${esc(SITE.phone)}">${I.copy}<span>Copy number</span></button>
      </div>
    </div>
    <div class="rcard">
      <span class="rcard__ic">${I.pin}</span>
      <p class="rcard__k">Visit</p>
      <address class="rcard__v rcard__v--addr">${SITE.address.map(esc).join('<br>')}</address>
      <div class="rcard__ctas">
        ${btn(SITE.maps, 'Get directions', { kind: 'navy', icon: I.directions, attrs: 'target="_blank" rel="noopener"' })}
        <button class="btn btn--line" type="button" data-copy="${esc(SITE.name + ', ' + SITE.address.join(', '))}">${I.copy}<span>Copy address</span></button>
      </div>
    </div>
    <div class="rcard">
      <span class="rcard__ic">${I.clock}</span>
      <p class="rcard__k">Opening hours</p>
      ${status('status--big')}
      ${hoursTable()}
      <p class="visit__clock">Dubai time now <b data-clock>--:--</b></p>
    </div>
  </div>
</section>

<section class="sec sec--grey" id="write">
  <div class="wrap contact">
    <div class="contact__copy">
      ${label('Enquiry')}
      <h2 class="h2">Write down what you need</h2>
      <p>Fill this in and we'll turn it into a clear enquiry with your quote list attached. Copy it and read it out when you call, or keep it on your phone for the counter.</p>
      <ul class="ticks">
        <li>${I.check}Include sizes, ratings or grades</li>
        <li>${I.check}Add quantities for each item</li>
        <li>${I.check}Mention when you need it</li>
      </ul>
    </div>
    ${form()}
  </div>
</section>

<section class="sec">
  <div class="wrap">
    <div class="sec__head"><div>${label('Location')}<h2 class="h2">Find us in Al Quoz</h2></div>${btn(SITE.maps, 'Open in Google Maps', { kind: 'line', icon: I.directions, attrs: 'target="_blank" rel="noopener"' })}</div>
    ${storeMap()}
  </div>
</section>`;
  return page({
    id: 'contact',
    title: 'Contact & Directions | Fakhri Tools, Al Quoz Dubai',
    path: 'contact.html',
    crumbs: [['Contact', 'contact.html']],
    schema: [storeSchema()],
    desc: `Call ${SITE.phone} or visit Wh #8, 8th Street, Al Quoz Industrial Area 3, Dubai. Open Monday to Saturday, 7:30am to 6:00pm.`,
    body,
  });
}
