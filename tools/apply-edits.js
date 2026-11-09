/* Applies a "fakhri-product-changes.json" file saved from edit.html to js/data.js.
   Usage (from the site folder): node tools/apply-edits.js path/to/fakhri-product-changes.json [--force]
   The file replaces whole categories, so it must have been made from the website's CURRENT product list.
   A file made from an older list (or an "older changes" file) would silently undo later changes: it is refused
   unless --force is given (use --force only after merging such a file by hand). */
const vm = require('vm'), fs = require('fs'), path = require('path');
const args = process.argv.slice(2), force = args.includes('--force'), file = args.find(a => a !== '--force');
const edits = JSON.parse(fs.readFileSync(file, 'utf8'));
if (edits.kind !== 'fakhri-product-edits') throw new Error('Not a product changes file');
const src = fs.readFileSync('js/data.js', 'utf8');
const ctx = { window: {} }; vm.runInNewContext(src, ctx);
const W = ctx.window;
// the same fingerprint edit.html writes into the file ("ver")
const VER = (s => { let h = 0; for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0; return String(h); })(JSON.stringify(W.FT_CATS));
if (edits.older && !force) throw new Error('This is an "older changes" file (unsaved work the editor put aside). Merge it by hand against the list it started from, then run with --force.');
if (edits.ver && edits.ver !== VER && !force) throw new Error('This changes file was made from an older website product list (' + edits.ver + ', website is ' + VER + '). Applying it would undo the changes made since. Merge it by hand, then run with --force.');
if (!edits.ver) console.warn('Note: this file has no list fingerprint (made by an older editor). Compare it with js/data.js before publishing.');
const brandsAt = src.indexOf('/* Oilfield brands');
if (brandsAt < 0) throw new Error('Could not find the "/* Oilfield brands" comment in js/data.js, so the brand list would be lost');

// sections the editor made ("New group"): they need a name, a family and an address name the website never used
const NEW = new Set(edits.cats.filter(e => !W.FT_CATS.some(c => c.slug === e.slug)).map(e => {
  if (!/^[a-z0-9-]+$/.test(e.slug || '') || !e.name || !W.FT_FAMILIES.some(f => f.id === e.fam)) throw new Error('Unknown category ' + e.slug);
  if (fs.existsSync(path.join('products', e.slug + '.html'))) throw new Error('The new group "' + e.name + '" would use the web address products/' + e.slug + '.html, which the website already uses. Give the group another name.');
  return e.slug;
}));
// Save new photos next to the category's other photos
const saved = {};
for (const [id, url] of Object.entries(edits.images || {})) {
  const m = /^new:([a-z0-9-]+)-([a-z0-9]+)$/.exec(id), d = /^data:image\/jpeg;base64,(.+)$/.exec(url);
  if (!m || !d || !(W.FT_CATS.some(c => c.slug === m[1]) || NEW.has(m[1]))) throw new Error('Bad photo ' + id);
  const rel = m[1] + '/edit-' + m[2] + '.jpg';
  fs.mkdirSync(path.join('assets/products', m[1]), { recursive: true });
  fs.writeFileSync(path.join('assets/products', rel), Buffer.from(d[1], 'base64'));
  saved[id] = rel;
}
const photo = p => saved[p] || p;
// optional 5th field: the material the owner picked or typed in the editor (empty = read from the name).
// It is kept exactly as typed (the Material filter that needed fixed names is gone); a literal "other" means none.
const material = v => {
  if (typeof v !== 'string') return '';
  const t = v.replace(/[<>"`\\]/g, '').replace(/\s+/g, ' ').trim().replace(/\.+$/, '');
  return /^other$/i.test(t) ? 'Other' : t.slice(0, 40);
};
const str = v => { if (typeof v !== 'string') throw new Error('Bad value'); return v.replace(/\s+/g, ' ').trim(); };
// a section the owner emptied in the editor is removed, but only when every one of its products is still in another section
// (found by photo or name), so nothing is lost by accident
for (const e of edits.cats.filter(e => !e.items.length)) {
  const c = W.FT_CATS.find(c => c.slug === e.slug); if (!c) continue;
  const rest = edits.cats.filter(x => x !== e).flatMap(x => x.items), has = it => rest.some(r => photo(str(r[3])) === it[3] || str(r[0]) === it[0]);
  const lost = c.items.filter(it => !has(it));
  if (lost.length && !force) throw new Error('Section "' + c.name + '" was emptied but ' + lost.length + ' of its products are not in any other section (' + lost.map(it => it[0]).join('; ') + '). Check the file, then run with --force.');
  W.FT_CATS.splice(W.FT_CATS.indexOf(c), 1);
  console.log('Removed the emptied section "' + c.name + '" (its ' + c.items.length + ' products are in other sections)');
}
for (const e of edits.cats) {
  if (!e.items.length) continue;
  let c = W.FT_CATS.find(c => c.slug === e.slug);
  if (!c && e.name && e.fam && W.FT_FAMILIES.some(f => f.id === e.fam)) W.FT_CATS.push(c = { slug: e.slug, name: e.name, fam: e.fam, desc: e.desc || '' });
  if (!c) throw new Error('Unknown category ' + e.slug);
  c.items = e.items.map(it => { const row = [str(it[0]), it[1].map(str), str(it[2]), photo(str(it[3]))]; const m = material(it[4]); if (m) row.push(m); return row; });
  if (typeof e.name === 'string' && e.name.trim()) c.name = e.name.trim();
  c.cover = photo(e.cover);
  if (!/^[a-z0-9-]+$/.test(c.slug)) throw new Error('Bad slug ' + c.slug);
  if (!c.items.length) throw new Error('Category "' + c.name + '" has no products left. Move a product back into it, or remove the category from js/data.js by hand.');
  for (const p of [c.cover, ...c.items.map(it => it[3])]) if (p && !fs.existsSync(path.join('assets/products', p))) throw new Error('Missing photo ' + p);
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
  '    items: [\n' + c.items.map(it => '      [' + q(it[0]) + ', [' + it[1].map(q).join(', ') + '], ' + q(it[2]) + ', ' + q(it[3]) + (it[4] ? ', ' + q(it[4]) : '') + ']').join(',\n') + '\n    ] }').join(',\n') + '\n];\n\n';
out += src.slice(brandsAt);
fs.writeFileSync('js/data.js', out);
fs.writeFileSync('index.html', fs.readFileSync('index.html', 'utf8').replace(/\d+ products\.<br>\d+ categories\./, total + ' products.<br>' + W.FT_CATS.length + ' categories.'));
console.log('Applied:', total, 'products,', Object.keys(saved).length, 'new photos');
// keep the per-category product pages in step with the catalogue
require('child_process').execFileSync(process.execPath, [path.join(__dirname, 'build-pages.js')], { stdio: 'inherit' });
