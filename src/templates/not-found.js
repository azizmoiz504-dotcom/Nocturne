import { SITE, CATEGORIES } from '../data.js';
import { I } from './icons.js';
import { page, pageHead, btn } from './layout.js';
import { categoryTile } from './shared.js';

// GitHub Pages serves this for any missing address, at any depth, so every link is absolute.
export default function notFound() {
  const b = SITE.url;
  const body = `
${pageHead({ title: 'Page not found', crumbs: [['Page not found']], lead: 'That page has moved or never existed. Search above, pick a category, or call the counter and we will find it for you.', b })}
<section class="sec">
  <div class="wrap">
    <div class="hero__ctas">
      ${btn(`${b}products.html`, 'Browse products', { kind: 'red' })}
      ${btn(`tel:${SITE.tel}`, SITE.phone, { kind: 'navy', icon: I.phone })}
    </div>
    <div class="ctgrid" style="margin-top:2rem">${CATEGORIES.map((c) => categoryTile(c, b)).join('')}</div>
  </div>
</section>`;
  return page({ id: '404', title: 'Page not found | Fakhri Tools', desc: 'This page could not be found.', base: b, path: '404.html', robots: 'noindex', body });
}
