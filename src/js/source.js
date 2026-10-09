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

export const withCode = (text) => {
  const c = sourceCode();
  return c ? `${text}\n\nCode: ${c}` : text;
};

export function initSource() {
  const c = sourceCode();
  if (c && typeof window.gtag === 'function') window.gtag('set', 'user_properties', { source_code: c });
}
