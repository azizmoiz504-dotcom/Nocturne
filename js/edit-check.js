/* Checks a product changes file before it goes on the website.
   edit.html runs it when "Upload to website" is pressed (so the person sees what was tidied and what to look at),
   and tools/publish-upload.js runs it again on GitHub before applying the file.
   - fixes: safe tidying that never changes what a product is (typed fractions like 1/4", x and - in sizes, spaces,
     long nipples written as size × length) and asbestos, which never goes on the website.
   - warnings: things a person should look at, only for products that are new or changed (a size that would show a
     type-in box instead of size buttons, a name that looks like a size, the same name twice in a section, no photo).
   - errors: things that stop the upload (a product without a name).
   The size rules are the same as sizeSpec in js/main.js. */
(function (root) {
  const LADDER = ['⅛"', '¼"', '⅜"', '½"', '¾"', '1"', '1¼"', '1½"', '2"', '2½"', '3"', '3½"', '4"', '5"', '6"', '8"', '10"', '12"', '14"', '16"', '18"', '20"', '22"', '24"', '26"', '28"', '30"', '32"', '34"', '36"', '40"', '42"', '48"'];
  const rung = t => LADDER.indexOf(t);
  const IN = '(\\d*[⅛¼⅜½¾]?"|\\d+\\/\\d+")';
  const RX_RANGE = new RegExp('^' + IN + ' – ' + IN + '$'), RX_PAIR = new RegExp('^' + IN + ' × ' + IN + ' – ' + IN + ' × ' + IN + '$'), RX_RANGEX = new RegExp('^' + IN + ' – ' + IN + ' × ' + IN + '$');
  function ladder(a, b) { const i = rung(a), j = b === 'any' ? LADDER.length - 1 : rung(b); return i < 0 || j < i ? null : true; }
  // what the website shows for a size: 'text' = a type-in box instead of size buttons
  function sizeKind(size) {
    let s = size || '', m;
    s = s.split(' · ')[0];
    if (!s) return 'empty';
    if (/ – any size$/.test(s)) return ladder(s.split(' – ')[0], 'any') ? 'sel' : 'text';
    if ((m = s.match(RX_PAIR))) return ladder(m[1], m[3]) && (m[1] === m[2] && m[3] === m[4] || ladder(m[2], m[4])) ? 'pair' : 'text';
    if ((m = s.match(RX_RANGEX))) return ladder(m[1], m[2]) ? 'sel' : 'text';
    if ((m = s.match(RX_RANGE))) return ladder(m[1], m[2]) ? 'sel' : 'text';
    if (/, | \/ /.test(s)) return 'sel';
    if (!/–|TO/.test(s)) return 'one';
    return 'text';
  }

  const FR = { '1/8': '⅛', '1/4': '¼', '3/8': '⅜', '1/2': '½', '3/4': '¾' };
  const FRX = '(1\\/8|1\\/4|3\\/8|1\\/2|3\\/4)';
  const TOK = '[\\d⅛¼⅜½¾]';
  function tidySize(s, name) {
    let t = String(s).replace(/[”″“]|''/g, '"').replace(/\s+/g, ' ').trim();
    t = t.replace(new RegExp('(^|[^\\d/.])(\\d+?)[ .-]?' + FRX + '"', 'g'), (m, pre, whole, fr) => pre + whole + FR[fr] + '"');   // 1-1/2", 1 1/2", 2.1/2", 11/2" -> 1½"
    t = t.replace(new RegExp('(^|[^\\d/])' + FRX + '"', 'g'), (m, pre, fr) => pre + FR[fr] + '"');                                // 1/4" -> ¼"
    t = t.replace(/(\d)\s*mm\b/gi, '$1 mm');                                                                                      // 6MM -> 6 mm
    t = t.replace(new RegExp('(["\\d]|mm)\\s*[xX×*]\\s*(?=' + TOK + ')', 'g'), '$1 × ');                                         // 2"x1" -> 2" × 1"
    t = t.replace(/\s*[–—]\s*/g, ' – ').replace(new RegExp('\\s+-\\s+|"\\s*-\\s*(?=' + TOK + ')', 'g'), m => (m.trim()[0] === '"' ? '" – ' : ' – '));   // 1" - 4" -> 1" – 4"
    t = t.replace(/\s*·\s*/g, ' · ').replace(/\s+/g, ' ').trim();
    const dot = t.indexOf(' · ');   // ⅛" TO 2" -> ⅛" – 2" (not in a note after " · ")
    t = (dot < 0 ? t : t.slice(0, dot)).replace(new RegExp('"\\s+to\\s+(?=' + TOK + '+")', 'gi'), '" – ') + (dot < 0 ? '' : t.slice(dot));
    // long nipples typed as size × length ("¼" × 3" – 8" × 12"") show size buttons plus a length box
    const m = t.match(RX_PAIR);
    if (m && /nipple/i.test(name) && rung(m[1]) > -1 && rung(m[2]) > rung(m[1]) && rung(m[3]) > rung(m[1]) && rung(m[4]) > rung(m[3]) && rung(m[4]) > rung(m[2])) t = m[1] + ' – ' + m[3] + ' · ' + m[2] + ' – ' + m[4];
    return t;
  }
  const BAN = /asbestos/i;
  const one = s => String(s == null ? '' : s).replace(/\s+/g, ' ').trim();

  function run(file, siteCats) {
    const fixes = [], warnings = [], errors = [];
    const out = JSON.parse(JSON.stringify(file));
    const site = new Map((siteCats || []).map(c => [c.slug, c]));
    const label = (c, it) => (c.name || c.slug) + ': ' + (it[0] || '(no name)');
    for (const c of out.cats || []) {
      const was = site.get(c.slug);
      const known = new Set(was ? was.items.map(it => it[0] + '|' + it[2]) : []);
      const keep = [];
      for (const it of c.items) {
        // a product that is on the website exactly like this (same name and size) is left as it is
        const name0 = it[0], same = known.has(one(it[0]) + '|' + one(it[2]));
        it[0] = same ? one(it[0]) : one(it[0]).replace(/\s*,+$/, '');
        if (BAN.test(it[0])) { fixes.push(label(c, it) + ': left out (asbestos never goes on the website)'); continue; }
        if (it[0] !== one(name0)) fixes.push(label(c, it) + ': removed the comma at the end of the name');
        const specs = (it[1] || []).map(one).filter(Boolean);
        const clean = specs.filter(s => !BAN.test(s));
        if (clean.length < specs.length) fixes.push(label(c, it) + ': removed "' + specs.filter(s => BAN.test(s)).join(', ') + '" (asbestos never goes on the website)');
        it[1] = clean.filter((s, i) => clean.indexOf(s) === i);
        const size0 = one(it[2]);
        it[2] = same ? size0 : tidySize(size0, it[0]);
        if (it[2] !== size0) fixes.push(label(c, it) + ': size ' + size0 + '  →  ' + it[2]);
        it[3] = one(it[3]);
        if (it.length > 4) {
          const parts = String(it[4] || '').split(/,|&/).map(one).filter(Boolean), ok = parts.filter(p => !BAN.test(p));
          if (ok.length < parts.length) { it[4] = ok.join(', '); fixes.push(label(c, it) + ': removed asbestos from the material'); }
          if (!one(it[4])) it.length = 4;
        }
        keep.push(it);
        if (!it[0]) { errors.push((c.name || c.slug) + ': a product has no name. Type a name or delete the card.'); continue; }
        if (same) continue;   // the same as on the website: nothing to look at
        if (it[2] && sizeKind(it[2]) === 'text') warnings.push(label(c, it) + ': the size "' + it[2] + '" shows a type-in box on the website, not size buttons');
        if (/^[\d⅛¼⅜½¾\/]+"?\s*(×|x|–|-|")/i.test(it[0])) warnings.push(label(c, it) + ': the name looks like a size');
        if (!it[3]) warnings.push(label(c, it) + ': no photo yet (the website shows "Photo on WhatsApp")');
      }
      c.items = keep;
      if (!was && !keep.length) warnings.push((c.name || c.slug) + ': this new group has no products yet, so it does not show on the website');
      const seen = new Map();
      c.items.forEach(it => { const k = it[0].toLowerCase(); seen.set(k, (seen.get(k) || 0) + 1); });
      for (const [k, n] of seen) if (n > 1 && c.items.some(it => it[0].toLowerCase() === k && !known.has(it[0] + '|' + it[2]))) warnings.push((c.name || c.slug) + ': "' + c.items.find(it => it[0].toLowerCase() === k)[0] + '" is in this section ' + n + ' times');
    }
    return { file: out, fixes, warnings, errors };
  }

  // the web address name for a new section: from its name, never one the website uses now or used before
  // (old addresses forward to other pages: see PAGE_URL, MOVED in tools/build-pages.js and SLUG_ALIAS in js/main.js)
  const RESERVED = ['index', 'valves', 'valves-hub', 'oilfield-supplies', 'carbon-steel-pipes-fittings', 'stainless-steel-pipes-fittings', 'gi-pipes-fittings', 'flanges',
    'instrumentation-fittings', 'pressure-gauges', 'instrumentation-pressure-gauges', 'universal-couplings-flange-adapter', 'qrc-couplings', 'qrc-couplings-ludecke',
    'gaskets-caf-canf-sheets', 'socket-weld-fittings', 'threaded-forged-fittings', 'union-flexible-connectors', 'cock-valves', 'brass-fittings-valves'];
  function newSlug(name, taken) {
    const base = String(name).toLowerCase().replace(/&/g, ' and ').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 48).replace(/-+$/, '') || 'section';
    const used = new Set(RESERVED.concat(taken || []));
    let s = base, n = 2;
    while (used.has(s)) s = base + '-' + n++;
    return s;
  }

  const api = { run, tidySize, sizeKind, newSlug, RESERVED };
  if (typeof module === 'object' && module.exports) module.exports = api; else root.FT_EDIT_CHECK = api;
})(typeof window !== 'undefined' ? window : this);
