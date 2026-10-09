// Counts the actions that turn into orders: calls, WhatsApp, email, directions, quote lists and enquiries.
// Events go to Google Analytics 4 when SITE.ga4 is set (layout.js loads gtag); otherwise this does nothing.
export function track(name, params = {}) {
  if (typeof window.gtag !== 'function') return;
  window.gtag('event', name, { page_type: document.body.dataset.page, ...params });
}

// Which part of the page the click came from, e.g. "hdr", "mbar", "drawer", "visit".
const where = (el) => {
  const box = el.closest('.topbar, .hdr, .menu, .drawer, .mbar, .ftr, .callbox, .visit, .hero, .cside, .empty, section');
  return box ? box.className.split(' ')[0] : 'page';
};

const RULES = [
  ['[data-quote-wa]', 'click_whatsapp'],
  ['[data-quote-mail]', 'click_email'],
  ['[data-quote-copy]', 'copy_quote_list'],
  ['[data-form-copy]', 'copy_enquiry'],
  ['[data-quote-add]', 'add_to_quote'],
  ['a[href^="tel:"]', 'click_call'],
  ['a[href*="wa.me/"]', 'click_whatsapp'],
  ['a[href^="mailto:"]', 'click_email'],
  ['a[href*="google.com/maps"]', 'click_directions'],
];

export function initTrack() {
  document.addEventListener(
    'click',
    (e) => {
      const el = e.target.closest('a, button');
      if (!el) return;
      const hit = RULES.find(([sel]) => el.matches(sel));
      if (!hit) return;
      const params = { link_location: where(el) };
      if (el.dataset.ref) params.item_ref = el.dataset.ref;
      track(hit[1], params);
    },
    true,
  );
}
