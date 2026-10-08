import { SITE } from '../data.js';
import { page, pageHero, esc } from './layout.js';

const SECTIONS = [
  ['terms', 'Terms of use'],
  ['trademark', 'Trademark'],
  ['cookies', 'Cookie policy'],
  ['privacy', 'Privacy policy'],
];

export default function legal() {
  const body = `
${pageHero({ eyebrowText: 'Legal', title: 'Policies &amp; <em>terms.</em>', crumbs: [['Legal']], cls: 'phero--short' })}
<section class="legal">
  <div class="wrap legal__grid">
    <nav class="legal__toc" aria-label="On this page">
      ${SECTIONS.map(([id, t], i) => `<a href="#${id}"><span>0${i + 1}</span>${esc(t)}</a>`).join('')}
    </nav>
    <div class="legal__body">
      ${SECTIONS.map(([id, t], i) => `
      <article class="legal__sec" id="${id}">
        <p class="legal__n">0${i + 1}</p>
        <h2>${esc(t)}</h2>
        <p class="legal__todo">Placeholder — the live site lists “${esc(t)}” in its footer but does not publish the text. ${esc(SITE.name)} to supply final wording before launch.</p>
      </article>`).join('')}
    </div>
  </div>
</section>`;
  return page({ id: 'legal', title: 'Legal — AQM Oilfield', desc: 'Terms of use, trademark, cookie and privacy policies.', body });
}
