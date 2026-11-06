/* What a customer can choose for a product in the product window (also used by tools/build-pages.js for the WhatsApp messages
   on the product pages, so both say the same).
   Specs & ratings: every spec the owner typed is one button; a thread or body list like "(BSP & NPT)", "SW & NPT" or
   "(WAFER/LUG/FLANGE)" becomes one button each, so the customer can pick the one they need.
   Material: "SS304, SS316 (ASTM A182)" offers SS304 or SS316; the part in brackets goes with whichever is picked. */
(function () {
  const ONE_EACH = /^(?:BSPT?|NPT|SW|BW|WAFER|LUG|FLANGE|\d+K)$/;
  const clean = x => x.replace(/[|¦]/g, '/').trim();   // | and ¦ separate the parts of a saved quote line
  function specOpts(chips) {
    const out = [];
    (chips || []).forEach(t => {
      const m = t.match(/^(.*?)\s*\(([^()]*)\)\s*$/), parts = (m ? m[2] : t).split(/\s*(?:&|\/|,)\s*/).map(x => x.trim());
      if (parts.length > 1 && parts.every(x => ONE_EACH.test(x))) { if (m && m[1].trim()) out.push(m[1]); out.push(...parts); }
      else out.push(t);
    });
    return [...new Set(out.map(clean).filter(Boolean))];
  }
  const MAT_FIX = {
    'ASTM A403/ASME SA-403 304/304L, 316/316L': [['304/304L', '316/316L'], 'ASTM A403/ASME SA-403'],
    'FORGED SS304 & SS316 (ASTM A182)': [['SS304', 'SS316'], 'forged, ASTM A182'],
    'Brass, Copper': [['Brass, Copper'], '']   // a brass float valve with a copper ball: one material, not a choice
  };
  // s = the product's material as written; returns the buttons (opts), the note that goes with any of them, and the full text
  function matOpts(s) {
    s = (s || '').trim();
    if (!s) return { opts: [], note: '', full: '' };
    if (MAT_FIX[s]) return { opts: MAT_FIX[s][0], note: MAT_FIX[s][1], full: s };
    const notes = [], base = s.replace(/\s*\(([^()]*)\)/g, (x, n) => { notes.push(n.trim()); return ''; }).trim();
    let opts = base.split(/\s*,\s*|\s+&\s+/).filter(Boolean);
    if (opts.length === 1 && /^[A-Z]{1,3}(?:\/[A-Z]{1,3})+$/.test(opts[0])) opts = opts[0].split('/');   // CI/DI/CS/SS
    opts = [...new Set(opts.map(clean).filter(Boolean))];
    return opts.length > 1 ? { opts, note: notes.join('; '), full: s } : { opts: [clean(s)], note: '', full: s };
  }
  window.FT_CHOICES = { specOpts, matOpts };
})();
