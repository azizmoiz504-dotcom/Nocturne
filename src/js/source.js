// Remembers which campaign brought the visitor (?src=AQ3 or utm_campaign=AQ3) and adds it to the quote list and
// enquiry text, so the code reaches the counter even when the customer calls or walks in with the list on a phone.
import { CODES } from '../campaign.js';
import { local } from './util.js';

const KEY = 'ft-src';
const DAYS = 30;

function fromUrl() {
  const q = new URLSearchParams(location.search);
  const v = (q.get('src') || q.get('utm_campaign') || '').trim().toUpperCase();
  return CODES.includes(v) ? v : '';
}

// The latest campaign wins; a code is forgotten after 30 days.
export function sourceCode() {
  const now = fromUrl();
  if (now) {
    local.set(KEY, { code: now, at: Date.now() });
    return now;
  }
  const saved = local.get(KEY, null);
  if (saved && CODES.includes(saved.code) && Date.now() - saved.at < DAYS * 864e5) return saved.code;
  return '';
}

// Staff look for the code in square brackets, the same as in the printed QR messages: "Code: [GADS]".
export const withCode = (text) => {
  const c = sourceCode();
  return c ? `${text}\n\nCode: [${c}]` : text;
};

export function initSource() {
  const c = sourceCode();
  if (c && typeof window.gtag === 'function') window.gtag('set', 'user_properties', { source_code: c });
  // WhatsApp buttons marked data-wa-prefill open with the same greeting as the printed QR codes, plus the code.
  for (const a of document.querySelectorAll('a[data-wa-prefill]')) {
    const text = `Hi Fakhri Tools, Al Quoz${c ? ` [${c}]` : ''}. I need: `;
    a.href = `${a.href.split('?')[0]}?text=${encodeURIComponent(text)}`;
  }
}
