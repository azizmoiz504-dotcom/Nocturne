/* Applies a "fakhri-product-changes.json" file saved from edit.html to js/data.js.
   Usage (from the site folder): node tools/apply-edits.js path/to/fakhri-product-changes.json */
const vm = require('vm'), fs = require('fs'), path = require('path');
const edits = JSON.parse(fs.readFileSync(process.argv[2], 'utf8'));
if (edits.kind !== 'fakhri-product-edits') throw new Error('Not a product changes file');
const src = fs.readFileSync('js/data.js', 'utf8');
const ctx = { window: {} }; vm.runInNewContext(src, ctx);
const W = ctx.window;

// Save new photos next to the category's other photos
const saved = {};
for (const [id, url] of Object.entries(edits.images || {})) {
  const m = /^new:([a-z0-9-]+)-([a-z0-9]+)$/.exec(id), d = /^data:image\/jpeg;base64,(.+)$/.exec(url);
  if (!m || !d || !W.FT_CATS.some(c => c.slug === m[1])) throw new Error('Bad photo ' + id);
  const rel = m[1] + '/edit-' + m[2] + '.jpg';
  fs.writeFileSync(path.join('assets/products', rel), Buffer.from(d[1], 'base64'));
  saved[id] = rel;
}
const photo = p => saved[p] || p;
const str = v => { if (typeof v !== 'string') throw new Error('Bad value'); return v.trim(); };
for (const e of edits.cats) {
  const c = W.FT_CATS.find(c => c.slug === e.slug);
  if (!c) throw new Error('Unknown category ' + e.slug);
  c.items = e.items.map(it => [str(it[0]), it[1].map(str), str(it[2]), photo(str(it[3]))]);
  c.cover = photo(e.cover);
  for (const p of [c.cover, ...c.items.map(it => it[3])]) if (!fs.existsSync(path.join('assets/products', p))) throw new Error('Missing photo ' + p);
}

const q = s => "'" + String(s).replace(/\\/g, '\\\\').replace(/'/g, "\\'") + "'";
const total = W.FT_CATS.reduce((a, c) => a + c.items.length, 0);
let out = '/* Fakhri Tools — product catalogue (' + W.FT_CATS.length + ' categories, ' + total + ' products). Product photos are stored locally in assets/products/.\n   Each product is [name, [specs], size range, photo]. "cover" is the photo shown for the whole category. */\n';
out += 'window.FT_IMG = ' + q(W.FT_IMG) + ';\n\n';
out += 'window.FT_FAMILIES = [\n' + W.FT_FAMILIES.map(f => '  { id: ' + q(f.id) + ', name: ' + q(f.name) + ' }').join(',\n') + '\n];\n\n';
out += 'window.FT_CATS = [\n' + W.FT_CATS.map(c =>
  '  { slug: ' + q(c.slug) + ', name: ' + q(c.name) + ', fam: ' + q(c.fam) + ',\n' +
  '    desc: ' + q(c.desc) + ',\n' +
  '    cover: ' + q(c.cover) + ',\n' +
  '    items: [\n' + c.items.map(it => '      [' + q(it[0]) + ', [' + it[1].map(q).join(', ') + '], ' + q(it[2]) + ', ' + q(it[3]) + ']').join(',\n') + '\n    ] }').join(',\n') + '\n];\n\n';
out += src.slice(src.indexOf('/* Oilfield brands'));
fs.writeFileSync('js/data.js', out);
fs.writeFileSync('index.html', fs.readFileSync('index.html', 'utf8').replace(/\d+ products\.<br>/, total + ' products.<br>'));
console.log('Applied:', total, 'products,', Object.keys(saved).length, 'new photos');
