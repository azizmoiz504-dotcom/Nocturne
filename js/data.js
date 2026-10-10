/* Fakhri Tools — product catalogue (18 categories, 116 products). Product photos are stored locally in assets/products/.
   Each product is [name, [specs], size range, photo]. "cover" is the photo shown for the whole category. */
window.FT_IMG = 'assets/products/';

window.FT_FAMILIES = [
  { id: 'valves', name: 'Valves' },
  { id: 'couplings', name: 'Couplings & Connectors' },
  { id: 'fittings', name: 'Pipe, Fittings & Flanges' },
  { id: 'sealing', name: 'Sealing & Instrumentation' }
];

window.FT_CATS = [
  { slug: 'gate-valves', name: 'Gate Valves', fam: 'valves',
    desc: 'Full-bore isolation for on/off service — bronze, stainless, cast iron and carbon steel, screwed or flanged.',
    cover: 'gate-valves/5.jpg',
    items: [
      ['Stainless Steel Gate Valve', ['CL150', 'F/T'], '½" – 10"', 'gate-valves/5.jpg'],
      ['C.I Gate Valve, Resilient Sealing', ['PN16', 'F/T'], '1" – 12"', 'gate-valves/6.jpg'],
      ['C.S Gate Valve', ['CL150', 'CL300', 'F/T'], '½" – 14"', 'gate-valves/7.jpg'],
      ['C.I Gate Valve, Resilient Sealing', ['CL150', 'F/T'], '1½" – 12"', 'gate-valves/8.jpg'],
      ['Bronze Gate Valve', ['NPT', 'BSPT'], '¼" – 5"', 'gate-valves/1.jpg'],
      ['S.S & Forged Steel Gate Valve', ['SW', 'NPT'], '½" – 2"', 'gate-valves/2.jpg'],
      ['Stainless Steel Low Pressure Gate Valve', ['200#', 'NPT', 'BSPT'], '½" – 4"', 'gate-valves/3.jpg'],
      ['Bronze Gate Valve, Undrilled', ['F/T'], '½" – 4"', 'gate-valves/4.jpg'],
      ['Knife Edge Gate Valve', [], '2" – 12"', 'gate-valves/9.jpg']
    ] },
  { slug: 'globe-valves', name: 'Globe Valves', fam: 'valves',
    desc: 'Throttling and flow regulation — bronze, S.S, C.S and C.I bodies from ¼" to 12".',
    cover: 'globe-valves/3.jpg',
    items: [
      ['S.S Globe Valve', ['CL150', 'CF8', 'F/T'], '½" – 6"', 'globe-valves/3.jpg'],
      ['C.S Globe Valve', ['WCB', 'CL150', 'CL300', 'F/T'], '½" – 12"', 'globe-valves/6.jpg'],
      ['C.I Globe Valve', ['PN16', 'F/T'], '½" – 12"', 'globe-valves/7.jpg'],
      ['C.I Globe Valve', ['CL150', 'F/T'], '½" – 12"', 'globe-valves/8.jpg'],
      ['Bronze Globe Valve', ['NPT', 'BSPT'], '¼" – 4"', 'globe-valves/1.jpg'],
      ['Bronze Globe Valve, Undrilled', ['F/T'], '½" – 4"', 'globe-valves/2.jpg'],
      ['S.S Low Pressure Globe Valve', ['200#', 'NPT', 'BSPT'], '½" – 4"', 'globe-valves/4.jpg'],
      ['S.S Forged Steel Valve', ['800#', 'SW', 'NPT'], '½" – 2"', 'globe-valves/ss-forged-steel.jpg'],
      ['M.S Forged Steel Valve', ['800#', 'SW', 'NPT'], '½" – 2"', 'globe-valves/5.jpg']
    ] },
  { slug: 'check-valves', name: 'Check Valves', fam: 'valves',
    desc: 'Non-return protection — swing, lift, spring, wafer and dual-disc non-slam designs.',
    cover: 'check-valves/13.jpg',
    items: [
      ['Bronze Check Valve, Swing Type', ['NPT', 'BSPT'], '½" – 4"', 'check-valves/1.jpg'],
      ['Bronze Check Valve, Lift Type', ['NPT'], '½" – 4"', 'check-valves/2.jpg'],
      ['C.I Swing Check Valve', ['CL150', 'F/T'], '½" – 10"', 'check-valves/ci-swing-check.jpg'],
      ['Bronze Spring Check Valve, Vertical', ['NPT', 'BSPT'], '½" – 4"', 'check-valves/4.jpg'],
      ['S.S Low Pressure Swing Check Valve', ['NPT', 'BSPT'], '½" – 4"', 'check-valves/5.jpg'],
      ['S.S Forged Steel Check Valve', ['NPT', 'SW'], '½" – 2"', 'check-valves/ss-forged-steel-check.jpg'],
      ['M.S Forged Steel Check Valve', ['NPT', 'SW'], '½" – 2"', 'check-valves/6.jpg'],
      ['S.S Double Disc Non-Slam Check Valve', ['CF8'], '½" – 6"', 'check-valves/7.jpg'],
      ['S.S Wafer Type Check Valve', ['CL150'], '½" – 12"', 'check-valves/8.jpg'],
      ['C.S Wafer Type Check Valve', ['CL150'], '½" – 12"', 'check-valves/10.jpg'],
      ['C.S Check Valve', ['CL150', 'CL300', 'F/T'], '½" – 12"', 'check-valves/cs-check.jpg'],
      ['C.I Swing Check Valve', ['PN16', 'F/T'], '1" – 12"', 'check-valves/12.jpg'],
      ['S.S Swing Check Valve', ['CL150', 'F/T'], '1" – 12"', 'check-valves/13.jpg']
    ] },
  { slug: 'ball-valves', name: 'Ball Valves', fam: 'valves',
    desc: 'Quarter-turn shut-off from 600 to 3000 WOG — 1PC, 2PC and 3PC designs in bronze, brass, S.S, C.S and C.I.',
    cover: 'ball-valves/1.jpg',
    items: [
      ['Bronze Ball Valve', ['600 WOG', 'NPT'], '¼" – 4"', 'ball-valves/1.jpg'],
      ['Brass Ball Valve', ['600 WOG', 'NPT', 'BSPT'], '¼" – 4"', 'ball-valves/2.jpg'],
      ['S.S Ball Valve XDS', ['800 WOG', 'NPT', 'BSPT'], '¼" – 4"', 'ball-valves/3.jpg'],
      ['S.S Ball Valve, HEX Body R/B 1PC', ['1000 WOG', 'CF8M', 'NPT'], '¼" – 2"', 'ball-valves/4.jpg'],
      ['S.S Ball Valve, 2PC F/B', ['1000 WOG', 'CF8M', 'NPT', 'BSPT'], '¼" – 4"', 'ball-valves/5.jpg'],
      ['S.S Ball Valve, 3PC F/B', ['1000 WOG', 'CF8M', 'NPT', 'BSPT', 'BW', 'SW'], '¼" – 4"', 'ball-valves/6.jpg'],
      ['S.S Ball Valve, 2PC F/B', ['3000 WOG', 'CF8M', 'NPT'], '¼" – 2"', 'ball-valves/7.jpg'],
      ['S.S Ball Valve, 2PC F/T', ['PN16', 'CL150', 'CF8M'], '¼" – 10"', 'ball-valves/8.jpg'],
      ['C.S Ball Valve, 2PC', ['CL150', 'F/T'], '½" – 12"', 'ball-valves/9.jpg'],
      ['C.S Ball Valve, 3PC', ['CL150', 'F/T'], '½" – 6"', 'ball-valves/10.jpg'],
      ['C.S Ball Valve XDS', ['800 WOG', 'NPT', 'BSPT'], '½" – 4"', 'ball-valves/11.jpg'],
      ['C.S Ball Valve, 2PC', ['3000 WOG', 'NPT'], '½" – 2"', 'ball-valves/12.jpg'],
      ['C.S F.S Ball Valve, 3PC', ['1000#', 'NPT', 'BSPT'], '½" – 4"', 'ball-valves/13.jpg'],
      ['S.S Ball Valve, 3PC', ['3000#', 'NPT'], '¼" – 2"', 'ball-valves/14.jpg'],
      ['C.S Hydraulic Ball Valve', ['600#', 'NPT'], '¼" – 2"', 'ball-valves/15.jpg'],
      ['C.I Ball Valve, 2PC', ['CL150', 'F/T', 'NPT'], '¼" – 8"', 'ball-valves/16.jpg'],
      ['C.I Ball Valve, 2PC', ['PN16', 'F/T'], '½" – 8"', 'ball-valves/17.jpg']
    ] },
  { slug: 'y-strainers', name: 'Y Strainers', fam: 'valves',
    desc: 'Line protection for pumps, meters and valves — screwed and flanged, ½" to 12".',
    cover: 'y-strainers/1.jpg',
    items: [
      ['Bronze Y Strainer', ['NPT'], '½" – 2"', 'y-strainers/1.jpg'],
      ['S.S Y Strainer', ['200#', 'NPT', 'BSPT'], '½" – 4"', 'y-strainers/2.jpg'],
      ['S.S Y Strainer', ['CL150', 'CF8', 'F/T'], '½" – 6"', 'y-strainers/3.jpg'],
      ['C.S Y Strainer', ['CL150', 'F/T'], '1½" – 8"', 'y-strainers/4.jpg'],
      ['C.I Y Strainer', ['PN16', 'F/T'], '1½" – 12"', 'y-strainers/5.jpg'],
      ['C.I Y Strainer', ['CL150', 'F/T'], '1½" – 8"', 'y-strainers/6.jpg']
    ] },
  { slug: 'safety-valves', name: 'Safety Valves', fam: 'valves',
    desc: 'Bronze pressure-relief valves, 10 and 20 bar, with or without lever.',
    cover: 'safety-valves/1.jpg',
    items: [
      ['Bronze Safety Valve, with & without lever', ['20 BAR', 'NPT'], '1½" – 2"', 'safety-valves/1.jpg'],
      ['Bronze Safety Valve, with & without lever', ['10 BAR', 'NPT'], '1½" – 2"', 'safety-valves/2.jpg']
    ] },
  { slug: 'butterfly-valves', name: 'Butterfly Valves', fam: 'valves',
    desc: 'Compact large-bore control — lever, gear and lug-type bodies up to 24".',
    cover: 'butterfly-valves/1.jpg',
    items: [
      ['C.I Butterfly Valve, Ductile Iron Disc', ['LOCK & LEVER'], '1½" – 12"', 'butterfly-valves/1.jpg'],
      ['C.I Butterfly Valve, S.S Disc', ['LOCK & LEVER'], '1½" – 12"', 'butterfly-valves/2.jpg'],
      ['C.I Butterfly Valve, Ductile Iron Disc', ['GEAR', 'CL150'], '2" – 24"', 'butterfly-valves/3.jpg'],
      ['C.I Butterfly Valve, S.S Disc, Lug Type', ['PN16', 'CL150'], '1½" – 12"', 'butterfly-valves/5.jpg']
    ] },
  { slug: 'quick-couplings', name: 'Quick Couplings', fam: 'couplings',
    desc: 'Bauer, Miller, Storz and camlock couplings for fast, secure hose connections.',
    cover: 'quick-couplings/1.jpg',
    items: [
      ['Bauer Couplings', [], '2" – 8"', 'quick-couplings/1.jpg'],
      ['Miller Couplings', [], '2" – 8"', 'quick-couplings/2.jpg'],
      ['Aluminium Storz Hose Coupling', [], '1½" – 4"', 'quick-couplings/3.jpg'],
      ['Aluminium Storz Female Coupling', ['BSPT'], '1½" – 4"', 'quick-couplings/4.jpg'],
      ['Aluminium Storz Cap', [], '1½" – 4"', 'quick-couplings/5.jpg'],
      ['Camlock Couplings, Aluminium', ['NPT', 'BSPT'], '½" – 6"', 'quick-couplings/6.jpg'],
      ['Camlock Couplings, Brass', ['NPT', 'BSPT'], '½" – 6"', 'quick-couplings/7.jpg'],
      ['Camlock Couplings, Stainless Steel', ['NPT', 'BSPT'], '½" – 6"', 'quick-couplings/8.jpg'],
      ['Aluminium Camlock Reducing Coupling', [], '', 'quick-couplings/9.jpg'],
      ['Brass Camlock Leg', [], '2" – 6"', 'quick-couplings/10.jpg']
    ] },
  { slug: 'qrc-couplings-ludecke', name: 'QRC Couplings — Ludecke', fam: 'couplings',
    desc: 'Precision brass quick-release couplings from Ludecke, Germany.',
    cover: 'qrc-couplings-ludecke/1.jpg',
    items: [
      ['Brass QRC Hose Body', ['LUDECKE'], '¼", 5/16", ⅜", 10 mm, ½"', 'qrc-couplings-ludecke/1.jpg'],
      ['Brass QRC Male Body', ['LUDECKE'], '¼", ⅜", ½"', 'qrc-couplings-ludecke/2.jpg'],
      ['Brass QRC Hose Plug', ['LUDECKE'], '¼", 5/16", ⅜", 10 mm, ½"', 'qrc-couplings-ludecke/3.jpg'],
      ['Brass QRC Female Plug', ['LUDECKE'], '¼", ⅜", ½"', 'qrc-couplings-ludecke/4.jpg'],
      ['Brass QRC Female Body', ['LUDECKE'], '¼", ⅜", ½"', 'qrc-couplings-ludecke/5.jpg'],
      ['Brass QRC Male Plug', ['LUDECKE'], '¼", ⅜", ½"', 'qrc-couplings-ludecke/6.jpg'],
      ['Double Bolt Clamp', [], 'SL 29 – SL 675', 'qrc-couplings-ludecke/7.jpg']
    ] },
  { slug: 'union-flexible-connectors', name: 'Union & Flexible Connectors', fam: 'couplings',
    desc: 'Galvanised flexible unions and single-bellow flange connectors that absorb movement and vibration.',
    cover: 'union-flexible-connectors/1.jpg',
    items: [
      ['G.I Flexible Union Connector', [], '½" – 3"', 'union-flexible-connectors/1.jpg'],
      ['G.I Flexible Flange Connector, Single Bellow', ['CL150', 'PN16'], '1" – 24"', 'union-flexible-connectors/2.jpg']
    ] },
  { slug: 'hammer-union', name: 'Hammer Union', fam: 'couplings',
    desc: 'Wing-nut hammer unions, blanking unions and hose connectors for high-pressure oilfield lines.',
    cover: 'hammer-union-spares/hammer-union/1.jpg',
    items: [
      ['Hammer Union', ['OILFIELD'], '', 'hammer-union-spares/hammer-union/1.jpg'],
      ['Blanking Union', ['OILFIELD'], '', 'hammer-union-spares/blanking-union/2.jpg'],
      ['Hose Connector', ['OILFIELD'], '', 'hammer-union-spares/hose-connector/3.jpg']
    ] },
  { slug: 'ms-forged-low-pressure-bw-fittings', name: 'M.S Forged, Low Pressure & B/W Fittings', fam: 'fittings',
    desc: 'Carbon steel forged, low-pressure and butt-weld fittings, pipe, tubing and nipples.',
    cover: 'ms-forged-low-pressure-bw-fittings/1.jpg',
    items: [
      ['M.S Pipe Fitting, Low Pressure', ['1000#', 'BSPT'], '¼" – 2"', 'ms-forged-low-pressure-bw-fittings/1.jpg'],
      ['M.S Forged Pipe Fitting', ['A105', '2000#', '3000#', '6000#', 'NPT', 'SW'], '⅛" – 4"', 'ms-forged-low-pressure-bw-fittings/2.jpg'],
      ['M.S Pipe & Tubing, SMLS & ERW', ['SCH STD', 'SCH40', 'SCH80', 'SCH160', 'XS', 'XXS'], '¼" – 24" · 6 m / DRL', 'ms-forged-low-pressure-bw-fittings/3.jpg'],
      ['M.S B/W Pipe Fitting, SMLS', ['WPB', 'SCH40', 'SCH80', 'SCH160'], '¼" – 24"', 'ms-forged-low-pressure-bw-fittings/4.jpg'],
      ['M.S Swage Nipples', ['1000#', '3000#', 'NPT'], '¾" × ½" – 8" × 6"', 'ms-forged-low-pressure-bw-fittings/5.jpg'],
      ['M.S Long & Close Nipple', ['A105', 'SMLS', 'ERW', 'SCH40', 'SCH80', 'SCH160'], '¼" – 6" × 8"', 'ms-forged-low-pressure-bw-fittings/6.jpg']
    ] },
  { slug: 'ss-forged-low-pressure-bw-fittings', name: 'S.S Forged, Low Pressure & B/W Fittings', fam: 'fittings',
    desc: '316L / 304L forged, low-pressure, block and butt-weld fittings, pipe and nipples.',
    cover: 'ss-forged-low-pressure-bw-fittings/1.jpg',
    items: [
      ['S.S Low Pressure Pipe Fittings', ['CL150', '316', 'NPT', 'BSPT'], '⅛" – 4"', 'ss-forged-low-pressure-bw-fittings/1.jpg'],
      ['S.S Forged Steel Pipe Fitting', ['A182 316L', '3000#', 'NPT', 'SW'], '¼" – 4"', 'ss-forged-low-pressure-bw-fittings/2.jpg'],
      ['S.S Block Pipe Fitting', ['A182 316L', '10000#', 'NPT'], '¼" – ½"', 'ss-forged-low-pressure-bw-fittings/3.jpg'],
      ['S.S B/W Pipe Fitting', ['A403 316L', 'SMLS', 'ERW', 'SCH10', 'SCH40', 'SCH80'], '½" – 24"', 'ss-forged-low-pressure-bw-fittings/4.jpg'],
      ['S.S Pipe & Tubing', ['316L', '304L', 'SMLS', 'ERW', 'SCH10', 'SCH40', 'SCH80'], '⅛" – 12" · 6 m', 'ss-forged-low-pressure-bw-fittings/5.jpg'],
      ['S.S Long & Close Pipe Nipple', ['A182 316L', 'ERW', 'SMLS', 'SCH10', 'SCH40', 'SCH80'], '¼" – 4" × 6"', 'ss-forged-low-pressure-bw-fittings/6.jpg']
    ] },
  { slug: 'gaskets-caf-canf-sheets', name: 'Gaskets & CAF / CNAF Sheets', fam: 'sealing',
    desc: 'CAF, CNAF, neoprene, spiral wound and RTJ — plus gland packing and coupling washers.',
    cover: 'gaskets-caf-canf-sheets/1.jpg',
    items: [
      ['CAF / CNAF Rubber Gasket, Ring & Full Face', ['1.5 MM', '3 MM', 'CL150–CL600', 'PN16–PN40'], '½" – any size', 'gaskets-caf-canf-sheets/1.jpg'],
      ['CAF, CNAF & Metallic Gasket Sheet', ['1 – 6 MM'], '1.5 m × 1.5 m', 'gaskets-caf-canf-sheets/2.jpg'],
      ['Neoprene Rubber Sheet', ['1 – 16 MM'], '1.2 m × 10 m', 'gaskets-caf-canf-sheets/3.jpg'],
      ['Spiral Wound Gasket', ['GRAPHITE', 'CAF', 'PTFE', 'CL150–CL1500'], '½" – 24"', 'gaskets-caf-canf-sheets/4.jpg'],
      ['Graphited Gland Packing', [], '6 mm – 25 mm', 'gaskets-caf-canf-sheets/5.jpg'],
      ['Rubber Washers for Chicago, Camlock, Storz, Bauer & Miller', [], '', 'gaskets-caf-canf-sheets/6.jpg'],
      ['RTJ Ring Gaskets', ['STAINLESS', 'SOFT IRON'], '', 'gaskets-caf-canf-sheets/7.jpg']
    ] },
  { slug: 'ss-ms-flanges-forging-casting', name: 'S.S & M.S Flanges', fam: 'fittings',
    desc: 'S.S A182 316L and M.S A105 flanges — forged or cast, SORF, WNRF, blind and screwed.',
    cover: 'ss-ms-flanges-forging-casting/1.jpg',
    items: [
      ['S.S Flanges, Forged', ['A182 316L', 'SORF', 'SWRF', 'WNRF', 'BLIND', 'SCREWED', 'PN16', 'CL150–CL600', '5K/10K/16K'], '½" – 24"', 'ss-ms-flanges-forging-casting/1.jpg'],
      ['M.S Flanges, Forging & Casting', ['A105', 'SORF', 'SWRF', 'WNRF', 'BLIND', 'PN10–PN25', 'CL150–CL2500', '5K/10K/16K'], '½" – 24"', 'ss-ms-flanges-forging-casting/2.jpg']
    ] },
  { slug: 'chicago-couplings-fittings', name: 'Chicago Couplings & Fittings', fam: 'couplings',
    desc: 'Galvanised claw couplings, king nipples, menders and bolt clamps for air and water hose.',
    cover: 'chicago-couplings-fittings/1.jpg',
    items: [
      ['G.I Chicago Hose End', [], '¼" – 2"', 'chicago-couplings-fittings/1.jpg'],
      ['G.I Chicago Female End', [], '¼" – 2"', 'chicago-couplings-fittings/3.jpg'],
      ['G.I Chicago 3-Way', [], '', 'chicago-couplings-fittings/4.jpg'],
      ['Safety Pin', [], '', 'chicago-couplings-fittings/6.jpg'],
      ['G.I King Nipple', ['NPT', 'BSPT'], '½" – 12"', 'chicago-couplings-fittings/7.jpg'],
      ['G.I Hose Mender', [], '½" – 8"', 'chicago-couplings-fittings/8.jpg'],
      ['Double Bolt Clamp', [], 'SL 22 – SL 1275', 'chicago-couplings-fittings/9.jpg'],
      ['Four Bolt Clamp', [], '½" – 3"', 'chicago-couplings-fittings/10.jpg']
    ] },
  { slug: 'instrumentation-fittings-pressure-gas', name: 'Instrumentation & Pressure Gauges', fam: 'sealing',
    desc: 'S.S compression fittings, needle valves to 10,000# and liquid-filled pressure gauges.',
    cover: 'instrumentation-fittings-pressure-gas/1.jpg',
    items: [
      ['S.S Compression Fitting, Nut & Ferrule', ['6 – 12 MM'], '¼" – ½"', 'instrumentation-fittings-pressure-gas/1.jpg'],
      ['S.S Needle Valve', ['1000#', '3000#', '6000#', '10000#', 'F/F', 'M/F', 'NPT'], '¼" – 1"', 'instrumentation-fittings-pressure-gas/2.jpg'],
      ['Pressure Gauge, Full S.S Body, Liquid Filled', ['4" DIAL', '2½" DIAL', '0–15,000 PSI'], '½" / ¼" bottom connection', 'instrumentation-fittings-pressure-gas/3.jpg']
    ] },
  { slug: 'universal-couplings-flange-adapter', name: 'Universal Couplings & Flange Adapters', fam: 'couplings',
    desc: 'Universal joining couplings and PN16 flange adapters, 2" to 24".',
    cover: 'universal-couplings-flange-adapter/1.jpg',
    items: [
      ['Universal Pipe Joining Coupling', [], '2" – 24"', 'universal-couplings-flange-adapter/1.jpg'],
      ['Universal Flange Adapter', ['PN16'], '2" – 24"', 'universal-couplings-flange-adapter/2.jpg']
    ] }
];

/* Oilfield brands we offer.
   To show a brand's real logo, save the logo file in assets/brands/ and type its file name in `logo`,
   for example  logo: 'assets/brands/benkan.png'.  While `logo` is empty, the brand name is shown instead. */
window.FT_BRANDS = [
  { name: 'Benkan', logo: '' },
  { name: 'Viraj', logo: '' },
  { name: 'Maass Global Group', logo: '' },
  { name: 'YC Inox', logo: '' },
  { name: 'Valve-tek', logo: '' },
  { name: 'S.A. Brand', logo: '' },
  { name: 'Mega', logo: '' },
  { name: 'Both-Well', logo: '' },
  { name: 'Lintas', logo: '' }
];
