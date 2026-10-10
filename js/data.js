/* Fakhri Tools — product catalogue (18 categories, 114 products). Product photos are stored locally in assets/products/. */
window.FT_IMG = 'assets/products/';

window.FT_FAMILIES = [
  { id: 'valves',   name: 'Valves' },
  { id: 'couplings', name: 'Couplings & Connectors' },
  { id: 'fittings', name: 'Pipe, Fittings & Flanges' },
  { id: 'sealing',  name: 'Sealing & Instrumentation' }
];

window.FT_CATS = [
  { slug: 'gate-valves', name: 'Gate Valves', fam: 'valves',
    desc: 'Full-bore isolation for on/off service — bronze, stainless, cast iron and carbon steel, screwed or flanged.',
    imgs: [1,2,3,4,5,6,7,8,9].map(n => 'gate-valves/' + n + '.jpg'),
    items: [
      ['Bronze Gate Valve', ['NPT', 'BSPT'], '¼" – 5"'],
      ['S.S & Forged Steel Gate Valve', ['SW', 'NPT'], '½" – 2"'],
      ['Stainless Steel Low Pressure Gate Valve', ['200#', 'NPT', 'BSPT'], '½" – 4"'],
      ['Bronze Gate Valve, Undrilled', ['F/T'], '½" – 4"'],
      ['Stainless Steel Gate Valve', ['CL150', 'F/T'], '½" – 10"'],
      ['C.I Gate Valve, Resilient Sealing', ['PN16', 'F/T'], '1" – 24"'],
      ['C.S Gate Valve', ['CL150', 'CL300', 'F/T'], '½" – 14"'],
      ['C.I Gate Valve, Resilient Sealing', ['CL150', 'F/T'], '1½" – 12"'],
      ['Knife Edge Gate Valve', [], '2" – 12"']
    ] },
  { slug: 'globe-valves', name: 'Globe Valves', fam: 'valves',
    desc: 'Throttling and flow regulation — bronze, S.S, C.S and C.I bodies from ¼" to 12".',
    imgs: [1,2,3,4,5,6,7,8].map(n => 'globe-valves/' + n + '.jpg'),
    items: [
      ['Bronze Globe Valve', ['NPT', 'BSPT'], '¼" – 4"'],
      ['Bronze Globe Valve, Undrilled', ['F/T'], '½" – 4"'],
      ['S.S Globe Valve', ['CL150', 'CF8', 'F/T'], '½" – 6"'],
      ['S.S Low Pressure Globe Valve', ['200#', 'NPT', 'BSPT'], '½" – 4"'],
      ['S.S & M.S Forged Steel Valve', ['800#', 'SW', 'NPT'], '½" – 2"'],
      ['C.S Globe Valve', ['WCB', 'CL150', 'CL300', 'F/T'], '½" – 12"'],
      ['C.I Globe Valve', ['PN16', 'F/T'], '½" – 12"'],
      ['C.I Globe Valve', ['CL150', 'F/T'], '½" – 12"']
    ] },
  { slug: 'check-valves', name: 'Check Valves', fam: 'valves',
    desc: 'Non-return protection — swing, lift, spring, wafer and dual-disc non-slam designs.',
    imgs: [1,2,3,4,5,6,7,8,10,11,12,13].map(n => 'check-valves/' + n + '.jpg'),
    items: [
      ['Bronze Check Valve, Swing Type', ['NPT', 'BSPT'], '½" – 4"'],
      ['Bronze Check Valve, Lift Type', ['NPT'], '½" – 4"'],
      ['C.I Swing Check Valve', ['CL150', 'F/T'], '½" – 10"'],
      ['Bronze Spring Check Valve, Vertical', ['NPT', 'BSPT'], '½" – 4"'],
      ['S.S Low Pressure Swing Check Valve', ['NPT', 'BSPT'], '½" – 4"'],
      ['S.S & M.S Forged Steel Check Valve', ['NPT', 'SW'], '½" – 2"'],
      ['S.S Double Disc Non-Slam Check Valve', ['CF8'], '½" – 6"'],
      ['S.S Wafer Type Check Valve', ['CL150'], '½" – 12"'],
      ['C.S Wafer Type Check Valve', ['CL150'], '½" – 12"'],
      ['C.S Check Valve', ['CL150', 'CL300', 'F/T'], '½" – 12"'],
      ['C.I Swing Check Valve', ['PN16', 'F/T'], '1" – 12"'],
      ['S.S Swing Check Valve', ['CL150', 'F/T'], '1" – 12"']
    ] },
  { slug: 'ball-valves', name: 'Ball Valves', fam: 'valves',
    desc: 'Quarter-turn shut-off from 600 to 3000 WOG — 1PC, 2PC and 3PC designs in bronze, brass, S.S, C.S and C.I.',
    imgs: Array.from({ length: 17 }, (_, i) => 'ball-valves/' + (i + 1) + '.jpg'),
    items: [
      ['Bronze Ball Valve', ['600 WOG', 'NPT'], '¼" – 2"'],
      ['Brass Ball Valve', ['600 WOG', 'NPT', 'BSPT'], '¼" – 4"'],
      ['S.S Ball Valve XDS', ['800 WOG', 'NPT', 'BSPT'], '¼" – 4"'],
      ['S.S Ball Valve, HEX Body R/B 1PC', ['1000 WOG', 'CF8M', 'NPT'], '¼" – 2"'],
      ['S.S Ball Valve, 2PC F/B', ['1000 WOG', 'CF8M', 'NPT', 'BSPT'], '¼" – 4"'],
      ['S.S Ball Valve, 3PC F/B', ['1000 WOG', 'CF8M', 'NPT', 'BSPT', 'BW', 'SW'], '¼" – 4"'],
      ['S.S Ball Valve, 2PC F/B', ['3000 WOG', 'CF8M', 'NPT'], '¼" – 2"'],
      ['S.S Ball Valve, 2PC F/T', ['PN16', 'CL150', 'CF8M'], '¼" – 10"'],
      ['C.S Ball Valve, 2PC', ['CL150', 'F/T'], '½" – 12"'],
      ['C.S Ball Valve, 3PC', ['CL150', 'F/T'], '½" – 6"'],
      ['C.S Ball Valve XDS', ['800 WOG', 'NPT', 'BSPT'], '½" – 4"'],
      ['C.S Ball Valve, 2PC', ['3000 WOG', 'NPT'], '½" – 2"'],
      ['C.S F.S Ball Valve, 3PC', ['1000#', 'NPT', 'BSPT'], '½" – 4"'],
      ['S.S Ball Valve, 3PC', ['3000#', 'NPT'], '¼" – 2"'],
      ['C.S Hydraulic Ball Valve', ['600#', 'NPT'], '¼" – 2"'],
      ['C.I Ball Valve, 2PC', ['CL150', 'F/T', 'NPT'], '¼" – 8"'],
      ['C.I Ball Valve, 2PC', ['PN16', 'F/T'], '½" – 8"']
    ] },
  { slug: 'y-strainers', name: 'Y Strainers', fam: 'valves',
    desc: 'Line protection for pumps, meters and valves — screwed and flanged, ½" to 12".',
    imgs: [1,2,3,4,5,6].map(n => 'y-strainers/' + n + '.jpg'),
    items: [
      ['Bronze Y Strainer', ['NPT'], '½" – 2"'],
      ['S.S Y Strainer', ['200#', 'NPT', 'BSPT'], '½" – 4"'],
      ['S.S Y Strainer', ['CL150', 'CF8', 'F/T'], '½" – 6"'],
      ['C.S Y Strainer', ['CL150', 'F/T'], '1½" – 8"'],
      ['C.I Y Strainer', ['PN16', 'F/T'], '1½" – 12"'],
      ['C.I Y Strainer', ['CL150', 'F/T'], '1½" – 8"']
    ] },
  { slug: 'safety-valves', name: 'Safety Valves', fam: 'valves',
    desc: 'Bronze pressure-relief valves, 10 and 20 bar, with or without lever.',
    imgs: ['safety-valves/1.jpg', 'safety-valves/2.jpg'],
    items: [
      ['Bronze Safety Valve, with & without lever', ['20 BAR', 'NPT'], '1½" – 2"'],
      ['Bronze Safety Valve, with & without lever', ['10 BAR', 'NPT'], '1½" – 2"']
    ] },
  { slug: 'butterfly-valves', name: 'Butterfly Valves', fam: 'valves',
    desc: 'Compact large-bore control — lever, gear and lug-type bodies up to 24".',
    imgs: [1,2,3,5].map(n => 'butterfly-valves/' + n + '.jpg'),
    items: [
      ['C.I Butterfly Valve, Ductile Iron Disc', ['LOCK & LEVER'], '1½" – 12"'],
      ['C.I Butterfly Valve, S.S Disc', ['LOCK & LEVER'], '1½" – 12"'],
      ['C.I Butterfly Valve, Ductile Iron Disc', ['GEAR', 'CL150'], '2" – 24"'],
      ['C.I Butterfly Valve, S.S Disc, Lug Type', ['PN16', 'CL150'], '1½" – 12"']
    ] },
  { slug: 'quick-couplings', name: 'Quick Couplings', fam: 'couplings',
    desc: 'Bauer, Miller, Storz and camlock couplings for fast, secure hose connections.',
    imgs: Array.from({ length: 10 }, (_, i) => 'quick-couplings/' + (i + 1) + '.jpg'),
    items: [
      ['Bauer Couplings', [], '2" – 8"'],
      ['Miller Couplings', [], '2" – 8"'],
      ['Aluminium Storz Hose Coupling', [], '1½" – 4"'],
      ['Aluminium Storz Female Coupling', ['BSPT'], '1½" – 4"'],
      ['Aluminium Storz Cap', [], '1½" – 4"'],
      ['Camlock Couplings, Aluminium', ['NPT', 'BSPT'], '½" – 6"'],
      ['Camlock Couplings, Brass', ['NPT', 'BSPT'], '½" – 6"'],
      ['Camlock Couplings, Stainless Steel', ['NPT', 'BSPT'], '½" – 6"'],
      ['Aluminium Camlock Reducing Coupling', [], ''],
      ['Brass Camlock Leg', [], '2" – 6"']
    ] },
  { slug: 'qrc-couplings-ludecke', name: 'QRC Couplings — Ludecke', fam: 'couplings',
    desc: 'Precision brass quick-release couplings from Ludecke, Germany.',
    imgs: [1,2,3,4,5,6,7].map(n => 'qrc-couplings-ludecke/' + n + '.jpg'),
    items: [
      ['Brass QRC Hose Body', ['LUDECKE'], '¼", 5/16", ⅜", 10 mm, ½"'],
      ['Brass QRC Male Body', ['LUDECKE'], '¼", ⅜", ½"'],
      ['Brass QRC Hose Plug', ['LUDECKE'], '¼", 5/16", ⅜", 10 mm, ½"'],
      ['Brass QRC Female Plug', ['LUDECKE'], '¼", ⅜", ½"'],
      ['Brass QRC Female Body', ['LUDECKE'], '¼", ⅜", ½"'],
      ['Brass QRC Male Plug', ['LUDECKE'], '¼", ⅜", ½"'],
      ['Double Bolt Clamp', [], 'SL 29 – SL 675']
    ] },
  { slug: 'union-flexible-connectors', name: 'Union & Flexible Connectors', fam: 'couplings',
    desc: 'Galvanised flexible unions and single-bellow flange connectors that absorb movement and vibration.',
    imgs: ['union-flexible-connectors/1.jpg', 'union-flexible-connectors/2.jpg'],
    items: [
      ['G.I Flexible Union Connector', [], '½" – 3"'],
      ['G.I Flexible Flange Connector, Single Bellow', ['CL150', 'PN16'], '1" – 24"']
    ] },
  { slug: 'hammer-union', name: 'Hammer Union', fam: 'couplings',
    desc: 'Wing-nut hammer unions, blanking unions and hose connectors for high-pressure oilfield lines.',
    imgs: ['hammer-union-spares/hammer-union/1.jpg', 'hammer-union-spares/blanking-union/2.jpg', 'hammer-union-spares/hose-connector/3.jpg'],
    items: [
      ['Hammer Union', ['OILFIELD'], ''],
      ['Blanking Union', ['OILFIELD'], ''],
      ['Hose Connector', ['OILFIELD'], '']
    ] },
  { slug: 'ms-forged-low-pressure-bw-fittings', name: 'M.S Forged, Low Pressure & B/W Fittings', fam: 'fittings',
    desc: 'Carbon steel forged, low-pressure and butt-weld fittings, pipe, tubing and nipples.',
    imgs: [1,2,3,4,5,6].map(n => 'ms-forged-low-pressure-bw-fittings/' + n + '.jpg'),
    items: [
      ['M.S Pipe Fitting, Low Pressure', ['1000#', 'BSPT'], '¼" – 2"'],
      ['M.S Forged Pipe Fitting', ['A105', '2000#', '3000#', '6000#', 'NPT', 'SW'], '⅛" – 4"'],
      ['M.S Pipe & Tubing, SMLS & ERW', ['SCH STD', 'SCH40', 'SCH80', 'SCH160', 'XS', 'XXS'], '¼" – 24" · 6 m / DRL'],
      ['M.S B/W Pipe Fitting, SMLS', ['WPB', 'SCH40', 'SCH80', 'SCH160'], '¼" – 24"'],
      ['M.S Swage Nipples', ['1000#', '3000#', 'NPT'], '¾" × ½" – 8" × 6"'],
      ['M.S Long & Close Nipple', ['A105', 'SMLS', 'ERW', 'SCH40', 'SCH80', 'SCH160'], '¼" – 6" × 8"']
    ] },
  { slug: 'ss-forged-low-pressure-bw-fittings', name: 'S.S Forged, Low Pressure & B/W Fittings', fam: 'fittings',
    desc: '316L / 304L forged, low-pressure, block and butt-weld fittings, pipe and nipples.',
    imgs: [1,2,3,4,5,6].map(n => 'ss-forged-low-pressure-bw-fittings/' + n + '.jpg'),
    items: [
      ['S.S Low Pressure Pipe Fittings', ['CL150', '316', 'NPT', 'BSPT'], '⅛" – 4"'],
      ['S.S Forged Steel Pipe Fitting', ['A182 316L', '3000#', 'NPT', 'SW'], '¼" – 4"'],
      ['S.S Block Pipe Fitting', ['A182 316L', '10000#', 'NPT'], '¼" – ½"'],
      ['S.S B/W Pipe Fitting', ['A403 316L', 'SMLS', 'ERW', 'SCH10', 'SCH40', 'SCH80'], '½" – 24"'],
      ['S.S Pipe & Tubing', ['316L', '304L', 'SMLS', 'ERW', 'SCH10', 'SCH40', 'SCH80'], '⅛" – 12" · 6 m'],
      ['S.S Long & Close Pipe Nipple', ['A182 316L', 'ERW', 'SMLS', 'SCH10', 'SCH40', 'SCH80'], '¼" – 4" × 6"']
    ] },
  { slug: 'gaskets-caf-canf-sheets', name: 'Gaskets & CAF / CNAF Sheets', fam: 'sealing',
    desc: 'CAF, CNAF, neoprene, spiral wound and RTJ — plus gland packing and coupling washers.',
    imgs: [1,2,3,4,5,6,7].map(n => 'gaskets-caf-canf-sheets/' + n + '.jpg'),
    items: [
      ['CAF / CNAF Rubber Gasket, Ring & Full Face', ['1.5 MM', '3 MM', 'CL150–CL600', 'PN16–PN40'], '½" – any size'],
      ['CAF, CNAF & Metallic Gasket Sheet', ['1 – 6 MM'], '1.5 m × 1.5 m'],
      ['Neoprene Rubber Sheet', ['1 – 16 MM'], '1.2 m × 10 m'],
      ['Spiral Wound Gasket', ['GRAPHITE', 'CAF', 'PTFE', 'CL150–CL1500'], '½" – 24"'],
      ['Graphited Gland Packing', [], '6 mm – 25 mm'],
      ['Rubber Washers for Chicago, Camlock, Storz, Bauer & Miller', [], ''],
      ['RTJ Ring Gaskets', ['STAINLESS', 'SOFT IRON'], '']
    ] },
  { slug: 'ss-ms-flanges-forging-casting', name: 'S.S & M.S Flanges', fam: 'fittings',
    desc: 'S.S A182 316L and M.S A105 flanges — forged or cast, SORF, WNRF, blind and screwed.',
    imgs: ['ss-ms-flanges-forging-casting/1.jpg', 'ss-ms-flanges-forging-casting/2.jpg'],
    items: [
      ['S.S Flanges, Forged', ['A182 316L', 'SORF', 'SWRF', 'WNRF', 'BLIND', 'SCREWED', 'PN16', 'CL150–CL600', '5K/10K/16K'], '½" – 24"'],
      ['M.S Flanges, Forging & Casting', ['A105', 'SORF', 'SWRF', 'WNRF', 'BLIND', 'PN10–PN25', 'CL150–CL2500', '5K/10K/16K'], '½" – 24"']
    ] },
  { slug: 'chicago-couplings-fittings', name: 'Chicago Couplings & Fittings', fam: 'couplings',
    desc: 'Galvanised claw couplings, king nipples, menders and bolt clamps for air and water hose.',
    imgs: [1,3,4,6,7,8,9,10].map(n => 'chicago-couplings-fittings/' + n + '.jpg'),
    items: [
      ['G.I Chicago Hose End', [], '¼" – 2"'],
      ['G.I Chicago Female End', [], '¼" – 2"'],
      ['G.I Chicago 3-Way', [], ''],
      ['Safety Pin', [], ''],
      ['G.I King Nipple', ['NPT', 'BSPT'], '½" – 12"'],
      ['G.I Hose Mender', [], '½" – 8"'],
      ['Double Bolt Clamp', [], 'SL 22 – SL 1275'],
      ['Four Bolt Clamp', [], '½" – 3"']
    ] },
  { slug: 'instrumentation-fittings-pressure-gas', name: 'Instrumentation & Pressure Gauges', fam: 'sealing',
    desc: 'S.S compression fittings, needle valves to 10,000# and liquid-filled pressure gauges.',
    imgs: [1,2,3].map(n => 'instrumentation-fittings-pressure-gas/' + n + '.jpg'),
    items: [
      ['S.S Compression Fitting, Nut & Ferrule', ['6 – 12 MM'], '¼" – ½"'],
      ['S.S Needle Valve', ['1000#', '3000#', '6000#', '10000#', 'F/F', 'M/F', 'NPT'], '¼" – 1"'],
      ['Pressure Gauge, Full S.S Body, Liquid Filled', ['4" DIAL', '2½" DIAL', '0–15,000 PSI'], '½" / ¼" bottom connection']
    ] },
  { slug: 'universal-couplings-flange-adapter', name: 'Universal Couplings & Flange Adapters', fam: 'couplings',
    desc: 'Universal joining couplings and PN16 flange adapters, 2" to 24".',
    imgs: ['universal-couplings-flange-adapter/1.jpg', 'universal-couplings-flange-adapter/2.jpg'],
    items: [
      ['Universal Pipe Joining Coupling', [], '2" – 24"'],
      ['Universal Flange Adapter', ['PN16'], '2" – 24"']
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
