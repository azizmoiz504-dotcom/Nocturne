// Builds the starting product list for the quote app from the live Fakhri website data.
// Usage: node tools/build-products.mjs <folder with data.js and choices.js> > data/products.csv
// One row per product x size x material. Cost prices are left blank: only the owner knows them.
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';

const dir = process.argv[2];
const ctx = { window: {} };
vm.createContext(ctx);
vm.runInContext(fs.readFileSync(path.join(dir, 'data.js'), 'utf8'), ctx);
vm.runInContext(fs.readFileSync(path.join(dir, 'choices.js'), 'utf8'), ctx);
const CATS = ctx.window.FT_CATS;
const { matOpts, specOpts } = ctx.window.FT_CHOICES;

// same size ladder the website uses (js/main.js), so the sizes match what customers pick there
const LADDER = ['⅛"', '¼"', '⅜"', '½"', '¾"', '1"', '1¼"', '1½"', '2"', '2½"', '3"', '3½"', '4"', '5"', '6"', '8"', '10"', '12"', '14"', '16"', '18"', '20"', '22"', '24"', '26"', '28"', '30"', '32"', '34"', '36"', '40"', '42"', '48"'];
const rung = (t) => LADDER.indexOf(t);
const IN = '(\\d*[⅛¼⅜½¾]?"|\\d+\\/\\d+")';
const RX_RANGE = new RegExp('^' + IN + ' – ' + IN + '$');
const RX_PAIR = new RegExp('^' + IN + ' × ' + IN + ' – ' + IN + ' × ' + IN + '$');
const RX_RANGEX = new RegExp('^' + IN + ' – ' + IN + ' × ' + IN + '$');
function ladder(a, b, fam) {
  const i = rung(a), j = b === 'any' ? rung('24"') : rung(b);
  if (i < 0 || j < i) return null;
  return LADDER.slice(i, j + 1).filter((t) => t !== '3½"' || fam === 'fittings' || t === a || t === b);
}
// returns the list of sizes for one product, plus a note
function sizesOf(raw, fam) {
  let s = raw || '', note = '', m;
  const dot = s.split(' · ');
  if (dot.length > 1) { s = dot[0]; note = dot.slice(1).join(' · '); }
  if (!s) return { sizes: [''], note };
  if (/ – any size$/.test(s)) { const l = ladder(s.split(' – ')[0], 'any', fam); if (l) return { sizes: l, note }; }
  if ((m = s.match(RX_PAIR))) {
    const L = ladder(m[1], m[3], fam), S = ladder(m[2], m[4], fam);
    if (m[1] === m[2] && m[3] === m[4] && L) return { sizes: L, note };
    if (L && S) {
      const reducing = rung(m[1]) > rung(m[2]) && rung(m[3]) > rung(m[4]);
      // reducers: one row per big-end size; the small end is written on the quote line
      if (reducing) return { sizes: L.map((v) => v + ' × smaller'), note: (note ? note + ' · ' : '') + 'Reducing: price by big end' };
      const out = [];
      L.forEach((a) => S.forEach((b) => out.push(a + ' × ' + b)));
      return { sizes: out, note };
    }
  }
  if ((m = s.match(RX_RANGEX))) {
    const l = ladder(m[1], m[2], fam);
    if (l && rung(m[3]) > -1 && rung(m[3]) < rung(m[2])) return { sizes: l.concat(m[2] + ' × ' + m[3]), note };
    if (l) return { sizes: l, note: (note ? note + ' · ' : '') + 'Length up to ' + m[3] };
  }
  if ((m = s.match(RX_RANGE))) { const l = ladder(m[1], m[2], fam); if (l) return { sizes: l, note }; }
  if (/, | \/ /.test(s)) return { sizes: s.replace(/ bottom connection$/, '').split(/, | \/ /), note };
  return { sizes: [s], note }; // single size, or a range like "12 mm – 50 mm" kept as one row
}

// unit: a starting guess the owner can change in the Prices tab
function unitOf(name, cat) {
  if (/\bHOSE\b/i.test(name) && !/CLAMP|CLIP|COUPLING|FITTING|NIPPLE|CONNECTOR|ADAPTOR|ADAPTER/i.test(name)) return 'm';
  if (/GASKET SHEET|SHEETS?$/i.test(name)) return 'sheet';
  if (/\bPIPE\b/i.test(name) && !/FITTING|NIPPLE|CLAMP|UNION|COUPLING|ELBOW|TEE|PLUG|CAP|BUSH|SOCKET|REDUCER/i.test(name)) return 'length';
  if (/ACRYLIC TUBE$/i.test(name)) return 'length';
  return 'pc';
}

// other names customers and staff use (short trade words), added to every row of a product
function aliasesOf(name) {
  const a = new Set();
  const swaps = [
    [/\bS\.S\b/g, 'SS'], [/\bS\.S\b/g, 'stainless'], [/\bC\.S\b/g, 'CS'], [/\bC\.S\b/g, 'carbon steel'], [/\bM\.S\b/g, 'MS'],
    [/\bM\.S\b/g, 'mild steel'], [/\bG\.I\b/g, 'GI'], [/\bG\.I\b/g, 'galvanised'], [/\bC\.I\b/g, 'cast iron'], [/\bD\.I\b/g, 'ductile iron'],
    [/\bF\.S\b/g, 'forged steel'], [/\bF\/T\b/g, 'flanged'], [/\bSW\b/g, 'socket weld'], [/\bBW\b/g, 'butt weld'], [/\bNRV\b/g, 'non return valve'],
  ];
  for (const [rx, to] of swaps) if (rx.test(name)) a.add(name.replace(rx, to));
  if (/CHECK VALVE/i.test(name)) a.add(name.replace(/CHECK VALVE/i, 'NRV'));
  if (/ELBOW/i.test(name) && !/45/.test(name)) a.add(name.replace(/ELBOW/i, 'bend'));
  return [...a].map((x) => x.replace(/\s+/g, ' ').trim()).filter((x) => x.toLowerCase() !== name.toLowerCase());
}

const csv = (v) => { const s = String(v ?? ''); return /[",\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s; };
const header = ['name', 'aliases', 'size', 'material_spec', 'options', 'unit', 'category', 'cost_price', 'website_ref'];
const rows = [header.join(',')];
let count = 0;
for (const c of CATS) {
  c.items.forEach((it, i) => {
    const [name, chips, size, , mat] = it;
    const { sizes, note } = sizesOf(size, c.fam);
    const m = matOpts(mat);
    const mats = m.opts.length ? m.opts.map((o) => (m.opts.length > 1 && m.note ? o + ' (' + m.note + ')' : m.opts.length > 1 ? o : m.full)) : [''];
    const opts = specOpts(chips).join(' / ');
    const options = [opts, note].filter(Boolean).join(' · ');
    const aliases = aliasesOf(name).join('; ');
    for (const sz of sizes) for (const mt of mats) {
      rows.push([name, aliases, sz, mt, options, unitOf(name, c), c.name, '', c.slug + ':' + i].map(csv).join(','));
      count++;
    }
  });
}
process.stdout.write('﻿' + rows.join('\n') + '\n');
process.stderr.write(`${count} rows from ${CATS.reduce((n, c) => n + c.items.length, 0)} products\n`);
