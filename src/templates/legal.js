import { SITE } from '../data.js';
import { page, pageHead, esc } from './layout.js';

const SECTIONS = [['terms', 'Terms of use'], ['privacy', 'Privacy policy'], ['cookies', 'Cookie policy']];

export default function legal() {
  const body = `
${pageHead({ title: 'Legal', crumbs: [['Legal']] })}
<section class="sec sec--tight">
  <div class="wrap legal">
    <nav class="legal__toc" aria-label="On this page">${SECTIONS.map(([id, t]) => `<a href="#${id}">${esc(t)}</a>`).join('')}</nav>
    <div class="legal__body">
      ${SECTIONS.map(([id, t]) => `
      <article class="legal__sec" id="${id}">
        <h2>${esc(t)}</h2>
        <p class="legal__todo">Placeholder: ${esc(SITE.name)} to supply the final wording before launch.</p>
      </article>`).join('')}
      <p class="note">This site does not store your quote list or enquiry on a server. Your quote list is saved only in your own browser so it survives a page reload.</p>
    </div>
  </div>
</section>`;
  // Placeholder text: keep it out of Google until real terms are written.
  return page({ id: 'legal', title: 'Legal | Fakhri Tools', desc: 'Terms of use, privacy and cookie policy.', path: 'legal.html', robots: 'noindex, follow', body });
}
