// Small DOM, storage and clipboard helpers shared by every module.
export const $ = (s, r = document) => r.querySelector(s);
export const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
export const BASE = document.body.dataset.base || '';
export const reduced = () => matchMedia('(prefers-reduced-motion: reduce)').matches;

export const esc = (s) =>
  String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

// Lower-case, inch marks to "in", punctuation to spaces: "2″ PN-16" -> "2 in pn 16"
export const norm = (s) =>
  String(s)
    .toLowerCase()
    .replace(/[″”“"]|\binch(es)?\b/g, ' in ')
    .replace(/[^a-z0-9½¼¾.#]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

// Storage can throw (private mode, blocked site data); never let it break the page.
const wrap = (area) => ({
  get(k, d) {
    try {
      const v = window[area].getItem(k);
      return v == null ? d : JSON.parse(v);
    } catch {
      return d;
    }
  },
  set(k, v) {
    try {
      window[area].setItem(k, JSON.stringify(v));
    } catch {}
  },
  del(k) {
    try {
      window[area].removeItem(k);
    } catch {}
  },
});
export const local = wrap('localStorage');
export const session = wrap('sessionStorage');

export async function copyText(text) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {}
  const ta = document.createElement('textarea');
  ta.value = text;
  ta.setAttribute('readonly', '');
  ta.style.cssText = 'position:fixed;top:0;left:0;opacity:0;pointer-events:none';
  document.body.appendChild(ta);
  ta.select();
  ta.setSelectionRange(0, text.length);
  let ok = false;
  try {
    ok = document.execCommand('copy');
  } catch {}
  ta.remove();
  return ok;
}

// Scroll lock that survives nested dialogs
let locks = 0;
export function lockScroll(on) {
  locks = Math.max(0, locks + (on ? 1 : -1));
  document.documentElement.style.overflow = locks ? 'hidden' : '';
}

const FOCUSABLE = 'a[href], button:not([disabled]), input:not([disabled]), textarea, select, [tabindex]:not([tabindex="-1"])';

// Modal shell for the menu and the quote drawer: Escape, focus trap, focus return.
export function dialog(root, closeSel, { onOpen, onClose } = {}) {
  let last = null;
  const panel = root.querySelector('[role="dialog"]') || root;
  const onKey = (e) => {
    if (e.key === 'Escape') return close();
    if (e.key !== 'Tab') return;
    const f = $$(FOCUSABLE, panel).filter((el) => el.offsetParent !== null);
    if (!f.length) return;
    const first = f[0];
    const end = f[f.length - 1];
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      end.focus();
    } else if (!e.shiftKey && document.activeElement === end) {
      e.preventDefault();
      first.focus();
    }
  };
  function open() {
    if (!root.hidden) return;
    last = document.activeElement;
    hideToast();
    root.hidden = false;
    lockScroll(true);
    document.addEventListener('keydown', onKey);
    onOpen && onOpen();
    requestAnimationFrame(() => {
      const f = $$(FOCUSABLE, panel).find((el) => el.offsetParent !== null);
      f && f.focus({ preventScroll: true });
    });
  }
  function close() {
    if (root.hidden) return;
    root.hidden = true;
    lockScroll(false);
    document.removeEventListener('keydown', onKey);
    onClose && onClose();
    if (last && last.focus) last.focus({ preventScroll: true });
  }
  root.addEventListener('click', (e) => {
    if (e.target.closest(closeSel)) close();
  });
  return { open, close, isOpen: () => !root.hidden };
}

// One toast at a time, with an optional action button.
let toastTimer = 0;
export function hideToast() {
  const el = $('[data-toast]');
  if (el) el.classList.remove('is-on');
}
export function toast(msg, action) {
  const el = $('[data-toast]');
  if (!el) return;
  el.textContent = '';
  const span = document.createElement('span');
  span.textContent = msg;
  el.appendChild(span);
  if (action) {
    const b = document.createElement('button');
    b.type = 'button';
    b.textContent = action.label;
    b.addEventListener('click', () => {
      el.classList.remove('is-on');
      action.run();
    });
    el.appendChild(b);
  }
  el.classList.add('is-on');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove('is-on'), action ? 4500 : 2600);
}
