import { PIPE, SITE } from '../data.js';
import { I } from './icons.js';
import { page, pageHead, esc, btn, label } from './layout.js';
import { weight } from '../js/pipe.js';

const SCH = ['40', '80', '160', 'XXS'];

export default function pipeChart() {
  const sizes = PIPE.map(([n], i) => `<button type="button" class="seg__b${n === '6″' ? ' is-on' : ''}" data-nps="${i}" aria-pressed="${n === '6″'}">${n}</button>`).join('');
  const table = `
  <div class="tscroll" tabindex="0" role="region" aria-label="Pipe schedule table">
    <table class="ptable" data-ptable>
      <caption>Carbon steel pipe, ASME B36.10M. Wall thickness in mm, weight in kg/m.</caption>
      <thead>
        <tr><th rowspan="2" scope="col">NPS</th><th rowspan="2" scope="col">OD mm</th>${SCH.map((s) => `<th colspan="2" scope="colgroup">${s === 'XXS' ? 'XXS' : 'SCH ' + s}</th>`).join('')}</tr>
        <tr>${SCH.map(() => '<th scope="col">Wall</th><th scope="col">kg/m</th>').join('')}</tr>
      </thead>
      <tbody>
        ${PIPE.map(([n, od, w], i) => `<tr data-row="${i}"><th scope="row">${n}</th><td>${od.toFixed(1)}</td>${SCH.map((s) => (w[s] ? `<td data-sch="${s}">${w[s].toFixed(2)}</td><td data-sch="${s}">${weight(od, w[s]).toFixed(2)}</td>` : '<td>–</td><td>–</td>')).join('')}</tr>`).join('')}
      </tbody>
    </table>
  </div>`;

  const body = `
${pageHead({ title: 'Pipe schedule chart', lead: 'Outside diameter, wall thickness, bore and weight per metre for carbon steel pipe from ½″ to 24″.', crumbs: [['Pipe chart']] })}
<section class="sec sec--tight" id="explorer" data-explorer>
  <div class="wrap explorer">
    <div class="explorer__ctl">
      <div class="ctl">
        <p class="ctl__h" id="nps-h">Nominal pipe size <b data-ex-nps-label>6″</b></p>
        <div class="seg seg--nps" role="group" aria-labelledby="nps-h">${sizes}</div>
      </div>
      <div class="ctl">
        <p class="ctl__h" id="sch-h">Schedule</p>
        <div class="seg seg--sch" role="group" aria-labelledby="sch-h">
          ${SCH.map((s) => `<button type="button" class="seg__b${s === '40' ? ' is-on' : ''}" data-sch="${s}" aria-pressed="${s === '40'}">${s === 'XXS' ? 'XXS' : 'SCH ' + s}</button>`).join('')}
        </div>
      </div>
      <dl class="readout" aria-live="polite">
        <div><dt>Outside Ø</dt><dd><b data-ex-od>168.3</b> mm<small data-ex-od-in>6.626 in</small></dd></div>
        <div><dt>Wall</dt><dd><b data-ex-wt>7.11</b> mm<small data-ex-wt-in>0.280 in</small></dd></div>
        <div><dt>Inside Ø</dt><dd><b data-ex-id>154.08</b> mm<small data-ex-id-in>6.066 in</small></dd></div>
        <div><dt>Weight</dt><dd><b data-ex-kg>28.26</b> kg/m<small data-ex-lb>18.99 lb/ft</small></dd></div>
      </dl>
    </div>
    <figure class="explorer__viz">
      <svg viewBox="0 0 600 600" role="img" aria-label="Pipe cross-section">
        <g class="xs__grid">${Array.from({ length: 13 }, (_, i) => `<line x1="${i * 50}" y1="0" x2="${i * 50}" y2="600"/><line x1="0" y1="${i * 50}" x2="600" y2="${i * 50}"/>`).join('')}</g>
        <path class="xs__wall" data-ex-wall fill-rule="evenodd" d=""/>
        <line class="xs__axis" x1="30" y1="300" x2="570" y2="300"/><line class="xs__axis" x1="300" y1="30" x2="300" y2="570"/>
        <g class="xs__dim">
          <line data-ex-dim-od x1="0" y1="560" x2="0" y2="560"/><line data-ex-tick-l x1="0" y1="550" x2="0" y2="570"/><line data-ex-tick-r x1="0" y1="550" x2="0" y2="570"/>
          <text x="300" y="590" data-ex-dim-odt>Ø 168.3 mm</text>
        </g>
        <line class="xs__wt" data-ex-dim-wt x1="0" y1="300" x2="0" y2="300"/>
      </svg>
      <figcaption data-ex-scale>Wall shown true to diameter</figcaption>
    </figure>
  </div>
</section>

<section class="sec sec--grey">
  <div class="wrap">
    <div class="sec__head"><div>${label('Reference')}<h2 class="h2">Full schedule table</h2></div></div>
    ${table}
    <p class="note">Weight = 0.02466 × (OD − wall) × wall, in kg/m. Values are for reference: confirm against the mill certificate or the published standard before ordering. Need stainless (SCH 5S–80S) sizes? Call <a href="tel:${SITE.tel}">${esc(SITE.phone)}</a>.</p>
  </div>
</section>`;
  return page({
    id: 'pipe-chart',
    title: 'Pipe Schedule Chart | Fakhri Tools',
    desc: 'Carbon steel pipe schedule chart, ½″ to 24″: outside diameter, wall thickness, inside diameter and weight per metre for SCH 40, 80, 160 and XXS.',
    body,
  });
}
