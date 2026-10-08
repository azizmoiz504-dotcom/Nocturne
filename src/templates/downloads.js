import { DOWNLOADS, PIPE } from '../data.js';
import { I } from './icons.js';
import { page, pageHero, esc, eyebrow, btn, roll } from './layout.js';
import { mark } from './icons.js';

const GROUPS = [
  ['all', 'All documents'],
  ['asme', 'Flanges · ASME B16.5'],
  ['en', 'Flanges · EN 1092-1'],
  ['jis', 'Flanges · JIS B2220'],
  ['schedule', 'Pipe schedules'],
];

export default function downloads() {
  const brochure = DOWNLOADS.find((d) => d.id === 'brochure');
  const rows = DOWNLOADS.filter((d) => d.id !== 'brochure')
    .map(
      (d, i) => `
      <li class="doc" data-doc="${d.group}">
        <span class="doc__i">${String(i + 1).padStart(2, '0')}</span>
        <span class="doc__code">${esc(d.code)}</span>
        <span class="doc__title">${esc(d.title)}</span>
        <span class="doc__std">${esc(d.std)}</span>
        <span class="doc__fmt">PDF</span>
        <span class="doc__act">
          <a href="${d.url}" target="_blank" rel="noopener" class="doc__btn" aria-label="View ${esc(d.title)}">${I.external}<span>View</span></a>
          <a href="${d.url}" download class="doc__btn doc__btn--dl" aria-label="Download ${esc(d.title)}">${I.download}</a>
        </span>
      </li>`,
    )
    .join('');

  const sizes = PIPE.map(([n], i) => `<button type="button" class="seg__b${n === '6″' ? ' is-active' : ''}" data-nps="${i}">${n}</button>`).join('');
  const body = `
${pageHero({
  eyebrowText: `${DOWNLOADS.length} documents · free to view & download`,
  title: 'Technical <em>library.</em>',
  lead: 'Our 2026 brochure, flange dimension charts across ASME, EN and JIS standards, and pipe schedule tables — plus an interactive explorer for wall thickness and weight.',
  crumbs: [['Downloads']],
  cls: 'phero--lib',
})}

<section class="brochure" id="brochure">
  <div class="wrap brochure__grid">
    <div class="brochure__stage" data-brochure aria-hidden="true">
      <div class="bk">
        <div class="bk__cover">
          <img class="bk__logo" src="assets/img/brand/aqm-logo.png" alt="">
          <div class="bk__photo"><img src="assets/img/photo/plant-blue-hour.webp" alt=""></div>
          <p class="bk__k">Product brochure</p>
          <p class="bk__y">2026</p>
          <p class="bk__f">Pipes · Flanges · Fittings · Valves · Industrial materials</p>
        </div>
        <div class="bk__spine"></div>
        <div class="bk__pages"></div>
      </div>
      <div class="bk__shadow"></div>
    </div>
    <div class="brochure__copy">
      ${eyebrow('(01)', 'Featured')}
      <h2 class="h2" data-split>${esc(brochure.title.replace(' 2026', ''))} <em>2026.</em></h2>
      <p class="lead" data-reveal>The full AQM range in one document — product families, materials and the industries we serve. Ideal for procurement teams and project engineers.</p>
      <div class="brochure__ctas">
        ${btn(brochure.url, 'View brochure', { icon: I.external, attrs: 'target="_blank" rel="noopener"' })}
        ${btn(brochure.url, 'Download PDF', { variant: 'ghost', icon: I.download, attrs: 'download' })}
      </div>
    </div>
  </div>
</section>

<section class="explorer" id="explorer" data-explorer>
  <div class="wrap">
    <div class="explorer__head">
      ${eyebrow('(02)', 'Interactive tool')}
      <h2 class="h2" data-split>Pipe schedule <em>explorer.</em></h2>
      <p class="lead" data-reveal>Pick a nominal pipe size and schedule to see the true-to-scale wall, inside diameter and weight per metre.</p>
    </div>
    <div class="explorer__ui">
      <div class="explorer__controls">
        <div class="ctrl">
          <p class="ctrl__h">Nominal pipe size <b data-ex-nps-label>6″</b></p>
          <div class="seg seg--nps" role="group" aria-label="Nominal pipe size">${sizes}</div>
        </div>
        <div class="ctrl">
          <p class="ctrl__h">Schedule</p>
          <div class="seg seg--sch" role="group" aria-label="Schedule">
            ${['40', '80', '160', 'XXS'].map((s) => `<button type="button" class="seg__b${s === '40' ? ' is-active' : ''}" data-sch="${s}">${s === 'XXS' ? 'XXS' : 'SCH ' + s}</button>`).join('')}
          </div>
        </div>
        <dl class="readout">
          <div><dt>Outside Ø</dt><dd><b data-ex-od>168.3</b> mm<small data-ex-od-in>6.625 in</small></dd></div>
          <div><dt>Wall thickness</dt><dd><b data-ex-wt>7.11</b> mm<small data-ex-wt-in>0.280 in</small></dd></div>
          <div><dt>Inside Ø</dt><dd><b data-ex-id>154.08</b> mm<small data-ex-id-in>6.066 in</small></dd></div>
          <div><dt>Weight</dt><dd><b data-ex-kg>28.26</b> kg/m<small data-ex-lb>18.99 lb/ft</small></dd></div>
        </dl>
        <p class="explorer__note">Carbon steel, ASME B36.10M. Weight = 0.02466 × (OD − WT) × WT. Indicative — always confirm against the published chart.</p>
      </div>
      <div class="explorer__viz">
        <svg viewBox="0 0 600 600" class="exsvg" aria-label="Pipe cross-section" role="img">
          <defs>
            <linearGradient id="exm" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#f2f5fb"/><stop offset=".45" stop-color="#8396be"/><stop offset=".55" stop-color="#5b709e"/><stop offset="1" stop-color="#d9e1f1"/></linearGradient>
            <pattern id="exh" width="8" height="8" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><line x1="0" y1="0" x2="0" y2="8" stroke="#0b1120" stroke-width="1.2" opacity=".35"/></pattern>
          </defs>
          <g class="exsvg__grid">${Array.from({ length: 13 }, (_, i) => `<line x1="${i * 50}" y1="0" x2="${i * 50}" y2="600"/><line x1="0" y1="${i * 50}" x2="600" y2="${i * 50}"/>`).join('')}</g>
          <path data-ex-wall fill="url(#exm)" fill-rule="evenodd" d=""/>
          <path data-ex-hatch fill="url(#exh)" fill-rule="evenodd" d=""/>
          <circle data-ex-glow cx="300" cy="300" r="0" class="exsvg__glow"/>
          <line class="exsvg__axis" x1="30" y1="300" x2="570" y2="300"/><line class="exsvg__axis" x1="300" y1="30" x2="300" y2="570"/>
          <g class="exsvg__dim">
            <line data-ex-dim-od x1="0" y1="560" x2="0" y2="560"/><line data-ex-tick-l x1="0" y1="550" x2="0" y2="570"/><line data-ex-tick-r x1="0" y1="550" x2="0" y2="570"/>
            <text x="300" y="586" data-ex-dim-odt>Ø 168.3</text>
            <line data-ex-dim-wt x1="0" y1="300" x2="0" y2="300" class="exsvg__wt"/>
            <text data-ex-dim-wtt x="0" y="0" class="exsvg__wtt">WT</text>
          </g>
        </svg>
        <p class="explorer__scale" data-ex-scale>Wall shown true to diameter</p>
      </div>
    </div>
  </div>
</section>

<section class="index" id="index" data-index>
  <div class="wrap">
    <div class="index__head">
      ${eyebrow('(03)', 'Dimension charts & tables')}
      <h2 class="h2" data-split>Every chart, <em>one place.</em></h2>
    </div>
    <div class="tabs" role="toolbar" aria-label="Filter documents" data-tabs>
      ${GROUPS.map(([id, label], i) => `<button type="button" class="tab${i === 0 ? ' is-active' : ''}" data-tab="${id}" aria-pressed="${i === 0}">${esc(label)}<span>${id === 'all' ? DOWNLOADS.length - 1 : DOWNLOADS.filter((d) => d.group === id && d.id !== 'brochure').length}</span></button>`).join('')}
    </div>
    <ol class="docs" data-docs>
      <li class="docs__head" aria-hidden="true"><span>#</span><span>Code</span><span>Document</span><span>Standard</span><span>Format</span><span></span></li>
      ${rows}
    </ol>
  </div>
</section>
`;
  return page({
    id: 'downloads',
    title: 'Downloads & Technical Library — AQM Oilfield',
    desc: 'AQM Oilfield brochure 2026, flange dimension charts (ASME B16.5 Class 150–2500, EN 1092-1 PN6–PN25, JIS B2220 5K–20K) and pipe schedule tables SCH 5–160.',
    body,
  });
}
