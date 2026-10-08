// Quote list: saved in this browser only, shown in the drawer, sent by phone, copy or (optionally) email/WhatsApp.
import { SITE } from '../data.js';
import { $, $$, BASE, esc, local, copyText, toast, dialog } from './util.js';

const KEY = 'ft-quote';
const MAX = 9999;
let list = local.get(KEY, []);
if (!Array.isArray(list)) list = [];
const subs = new Set();

const save = () => {
  local.set(KEY, list);
  subs.forEach((f) => f(list));
};
export const getList = () => list;
export const onChange = (f) => subs.add(f);
const clamp = (n) => Math.max(1, Math.min(MAX, Math.round(Number(n) || 1)));
const find = (slug) => list.find((x) => x.slug === slug);

export function listText(items = list) {
  return items.map((x, i) => `${i + 1}. Ref ${x.ref} · ${x.name} × ${x.qty}`).join('\n');
}

const MINUS = '<svg class="i" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" aria-hidden="true"><path d="M5 12h14"/></svg>';
const PLUS = '<svg class="i" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" aria-hidden="true"><path d="M12 5v14M5 12h14"/></svg>';

export function initQuote() {
  const drawerEl = $('[data-drawer]');
  if (!drawerEl) return;
  const ul = $('[data-quote-list]', drawerEl);
  const empty = $('[data-quote-empty]', drawerEl);
  const foot = $('[data-quote-foot]', drawerEl);
  const mail = $('[data-quote-mail]', drawerEl);
  const wa = $('[data-quote-wa]', drawerEl);
  const drawer = dialog(drawerEl, '[data-quote-close]', { onOpen: renderList });

  function renderList() {
    ul.innerHTML = list
      .map(
        (x) => `
<li class="qitem" data-slug="${esc(x.slug)}">
  <img src="${BASE}${esc(x.img)}" alt="" width="56" height="56" loading="lazy">
  <div class="qitem__meta"><small>Ref ${esc(x.ref)}</small><a href="${BASE}products/${esc(x.slug)}.html">${esc(x.name)}</a></div>
  <div class="qitem__ctl">
    <div class="qty qty--sm">
      <button type="button" data-q-dec aria-label="Decrease quantity of ${esc(x.name)}">${MINUS}</button>
      <input type="number" min="1" max="${MAX}" inputmode="numeric" value="${x.qty}" aria-label="Quantity of ${esc(x.name)}" data-q-input>
      <button type="button" data-q-inc aria-label="Increase quantity of ${esc(x.name)}">${PLUS}</button>
    </div>
    <button type="button" class="rmbtn" data-q-rm>Remove</button>
  </div>
</li>`
      )
      .join('');
    const has = list.length > 0;
    ul.hidden = !has;
    empty.hidden = has;
    foot.hidden = !has;
    links();
  }

  function links() {
    const body = `Quote request for ${SITE.name}\n\n${listText()}`;
    if (mail && SITE.email) mail.href = `mailto:${SITE.email}?subject=${encodeURIComponent('Quote request')}&body=${encodeURIComponent(body)}`;
    if (wa && SITE.whatsapp) wa.href = `https://wa.me/${SITE.whatsapp}?text=${encodeURIComponent(body)}`;
  }

  // Badges and add buttons reflect the list on every page.
  function sync(bump) {
    const n = list.length;
    for (const b of $$('[data-quote-count]')) {
      b.textContent = n;
      b.parentElement.classList.toggle('has-items', n > 0);
      if (bump) {
        b.classList.remove('bump');
        void b.offsetWidth;
        b.classList.add('bump');
      }
    }
    for (const btn of $$('[data-quote-add]')) {
      const item = find(btn.dataset.slug);
      btn.classList.toggle('is-added', !!item);
      const lab = $('[data-add-label]', btn);
      if (!lab) continue;
      if ('withQty' in btn.dataset) lab.textContent = item ? `Add more · ${item.qty} in list` : 'Add to quote';
      else lab.textContent = item ? 'In quote list' : 'Add to quote';
    }
  }

  onChange(() => sync(false));

  function add(btn) {
    const d = btn.dataset;
    let qty = 1;
    if ('withQty' in d) {
      const inp = $('[data-qty-input]', btn.closest('.buy') || document);
      qty = clamp(inp && inp.value);
    }
    const item = find(d.slug);
    if (item && !('withQty' in d)) return drawer.open();
    if (item) item.qty = clamp(item.qty + qty);
    else list.push({ slug: d.slug, name: d.name, ref: d.ref, cat: d.cat, img: d.img, qty });
    save();
    sync(true);
    toast(qty > 1 ? `Added ${qty} × ${d.name}` : `Added ${d.name}`, { label: 'View list', run: drawer.open });
  }

  document.addEventListener('click', (e) => {
    const addBtn = e.target.closest('[data-quote-add]');
    if (addBtn) return add(addBtn);
    if (e.target.closest('[data-quote-open]')) return drawer.open();
  });

  // Drawer controls
  ul.addEventListener('click', (e) => {
    const li = e.target.closest('.qitem');
    if (!li) return;
    const item = find(li.dataset.slug);
    if (!item) return;
    const inp = $('[data-q-input]', li);
    if (e.target.closest('[data-q-dec]')) item.qty = clamp(item.qty - 1);
    else if (e.target.closest('[data-q-inc]')) item.qty = clamp(item.qty + 1);
    else if (e.target.closest('[data-q-rm]')) {
      const at = list.indexOf(item);
      list.splice(at, 1);
      save();
      renderList();
      sync(false);
      toast(`Removed ${item.name}`, { label: 'Undo', run: () => { list.splice(at, 0, item); save(); renderList(); sync(false); } });
      return;
    } else return;
    inp.value = item.qty;
    save();
    links();
  });
  ul.addEventListener('change', (e) => {
    const inp = e.target.closest('[data-q-input]');
    if (!inp) return;
    const item = find(inp.closest('.qitem').dataset.slug);
    item.qty = clamp(inp.value);
    inp.value = item.qty;
    save();
    links();
  });

  $('[data-quote-copy]', drawerEl).addEventListener('click', async () => {
    const ok = await copyText(`Quote request for ${SITE.name}\n\n${listText()}`);
    toast(ok ? 'Quote list copied' : 'Copy failed: select the list and copy it manually');
  });
  $('[data-quote-clear]', drawerEl).addEventListener('click', () => {
    const old = list.slice();
    list = [];
    save();
    renderList();
    sync(false);
    toast('Quote list cleared', { label: 'Undo', run: () => { list = old; save(); renderList(); sync(false); } });
  });

  // Keep tabs in step
  addEventListener('storage', (e) => {
    if (e.key !== KEY) return;
    const next = local.get(KEY, []);
    list = Array.isArray(next) ? next : [];
    sync(false);
    if (drawer.isOpen()) renderList();
  });

  renderList();
  sync(false);
}
