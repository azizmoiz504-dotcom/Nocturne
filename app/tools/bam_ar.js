// Step 3 of importing the Bait Al Maqdis catalogue: their old app's English -> Arabic word list
// (i18n.js), saved as app/bam/ar.js for the merged app.   node bam_ar.js <i18n.js> <out.js>
'use strict';
const fs = require('fs'), vm = require('vm');
const [src, dst] = process.argv.slice(2);
const node = () => ({ style: {}, setAttribute() {}, appendChild() {}, addEventListener() {}, classList: { add() {}, remove() {}, toggle() {} } });
const sandbox = {
  localStorage: { getItem: () => null, setItem() {} },
  document: { documentElement: node(), body: node(), head: node(), createElement: node, querySelectorAll: () => [], querySelector: () => null, addEventListener() {}, readyState: 'complete' },
  addEventListener() {}, setTimeout() {}, MutationObserver: function () { this.observe = () => {}; }
};
sandbox.window = sandbox;
vm.runInNewContext(fs.readFileSync(src, 'utf8'), sandbox, { filename: 'i18n.js' });
const L = sandbox.BAM_LANG;
if (!L || !L.dict) throw new Error('no BAM_LANG.dict in ' + src);
const text = fs.readFileSync(src, 'utf8');
const m = text.match(/var SPEC_WORDS = (\{[\s\S]*?\n {2}\});/);
if (!m) throw new Error('no SPEC_WORDS in ' + src);
const spec = vm.runInNewContext('(' + m[1] + ')');
fs.writeFileSync(dst, '/* Bait Al Maqdis English -> Arabic, from their old app (made by app/tools/import-bam.sh) */\nwindow.BAM_AR = ' +
  JSON.stringify({ dict: L.dict, spec }) + ';\n');
console.log('arabic: ' + Object.keys(L.dict).length + ' phrases, ' + Object.keys(spec).length + ' size words');
