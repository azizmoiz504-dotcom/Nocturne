/* Text for each product page, built from the product's own name, sizes, specs and material (js/data.js).
   Used by tools/build-pages.js. Every sentence here is a general trade fact about a product type, a material
   standard or a rating that the owner listed for that product. Nothing here adds a brand, price, stock level,
   delivery time or a standard the owner did not list. To change a sentence, edit it here and run the build. */

// Standard pipe sizes in order (same ladder as the size picker in js/main.js), and their DN (nominal size) numbers.
const LADDER = ['⅛"', '¼"', '⅜"', '½"', '¾"', '1"', '1¼"', '1½"', '2"', '2½"', '3"', '3½"', '4"', '5"', '6"', '8"', '10"', '12"', '14"', '16"', '18"', '20"', '22"', '24"'];
const DN = { '⅛"': 6, '¼"': 8, '⅜"': 10, '½"': 15, '¾"': 20, '1"': 25, '1¼"': 32, '1½"': 40, '2"': 50, '2½"': 65, '3"': 80, '3½"': 90, '4"': 100, '5"': 125, '6"': 150, '8"': 200, '10"': 250, '12"': 300, '14"': 350, '16"': 400, '18"': 450, '20"': 500, '22"': 550, '24"': 600 };

// The single sizes a product comes in, when its size is a plain range ("½" – 4"") or a list ("½", ¾", 1"").
// Reducing sizes (2" × 1½") and mm ranges are left out: their page keeps the range as written.
function sizeList(size) {
  const s = (size || '').split(' · ')[0].trim();
  let m = s.match(/^(\S+") – (\S+")$/);
  if (m) {
    const i = LADDER.indexOf(m[1]), j = LADDER.indexOf(m[2]);
    if (i < 0 || j <= i) return [];
    return LADDER.slice(i, j + 1).filter(t => t !== '3½"');
  }
  if (/^(\S+", )+\S+"$/.test(s)) return s.split(', ').filter(t => LADDER.includes(t));
  return [];
}

// What the product is, by type. First match wins, so the more specific types come first.
const TYPES = [
  [/Washer/, 'A replacement sealing washer for the coupling.'],
  [/Needle Valve/, 'A needle valve has a fine, tapered stem, so it can set flow very precisely on small lines such as instrument and gauge lines.'],
  [/Hydraulic High Pressure Ball Valve/, 'A high-pressure ball valve for hydraulic and other high-pressure lines. A quarter turn of the handle opens or closes it.'],
  [/Ball Valve 3-Way/, 'A 3-way ball valve has a third port, so one valve can divert flow from one line to another or bring two lines together.'],
  [/Ball Valve/, 'A ball valve opens and closes with a quarter turn of the handle. The bored ball gives a straight path through the valve, so it is the usual choice for quick, tight shut-off.'],
  [/Knife Edge Gate Valve/, 'A knife gate valve closes with a sharp-edged blade that cuts through thick media such as slurry, sludge and wastewater.'],
  [/Grooved Gate Valve/, 'A gate valve with grooved ends, joined to the pipe with grooved couplings instead of flanges.'],
  [/Gate Valve/, 'A gate valve opens or closes a line by raising or lowering a gate (wedge). Fully open, it leaves almost no restriction, so it is used to isolate a line, not to regulate flow.'],
  [/Globe Valve/, 'A globe valve closes by pressing a disc onto a seat, so it can regulate (throttle) flow as well as shut it off. It causes more pressure drop than a gate valve.'],
  [/Dual-Disk/i, 'A dual-plate (dual-disk) check valve has two spring-loaded half discs that close quickly when flow stops. Its wafer body fits between two flanges and is much shorter than a swing check valve.'],
  [/Disk Check Valve Wafer/, 'A wafer disc check valve has a single spring-loaded disc and a short body that fits between two flanges.'],
  [/Check Valve Wafer/, 'A wafer check valve lets flow pass one way only. Its thin body fits between two pipe flanges, which saves space.'],
  [/Piston/, 'A piston (lift) check valve has a piston that lifts with the flow and drops back onto its seat when flow stops or reverses.'],
  [/Spring/, 'A spring check valve has a spring-loaded disc that closes as soon as flow stops, which limits backflow and water hammer.'],
  [/Swing/, 'A swing check valve has a hinged disc that swings open with the flow and closes against reverse flow. It causes little pressure drop.'],
  [/Grooved Check Valve/, 'A check (non-return) valve with grooved ends, joined to the pipe with grooved couplings instead of flanges.'],
  [/Check Valve/, 'A check (non-return) valve lets flow pass one way only and closes by itself against reverse flow, which protects pumps and equipment.'],
  [/Y Strainer/, 'A Y-strainer catches dirt, scale and welding debris in a mesh screen before they reach pumps, valves and meters. The screen comes out through the cap for cleaning.'],
  [/Safety Valve With Lever/i, 'A safety (relief) valve opens by itself when the pressure passes its set point and closes again when it falls. The lever lets you lift the valve by hand to test it.'],
  [/Safety Valve/, 'A safety (relief) valve opens by itself when the pressure passes its set point and closes again when it falls.'],
  [/Air Vent/, 'An automatic air vent lets out air trapped at the high points of a water system.'],
  [/Butterfly Valve/, 'A butterfly valve opens and closes by turning a disc a quarter turn. It is lighter and shorter than a gate valve of the same size.'],
  [/Foot Valve/, 'A foot valve fits at the bottom of a pump’s suction pipe. Its non-return flap keeps the pipe full so the pump stays primed, and its strainer keeps debris out.'],
  [/Float Valve/, 'A float valve lets water into a tank and shuts off when the float rises to the set level.'],
  [/Solenoid Valve/, 'A solenoid valve opens and closes electrically, for automatic on/off control of a line.'],
  [/Blanking Union/, 'A blanking cap closes the end of a line that uses hammer unions. Hammer union figure numbers must match, so check the figure on your line.'],
  [/Hammer Union/i, 'A hammer union joins two pipe ends with a wing nut that is tightened with a hammer, so lines can be connected and broken quickly. The figure (Fig) number sets the pressure rating, and both halves must have the same figure.'],
  [/Camlock Type A\b/, 'Camlock (cam and groove) Type A is a male adaptor with a female thread. Camlocks connect and release hoses in seconds by closing two cam arms.'],
  [/Camlock Type B\b/, 'Camlock (cam and groove) Type B is a female coupler with a male thread. Camlocks connect and release hoses in seconds by closing two cam arms.'],
  [/Camlock Type C\b/, 'Camlock (cam and groove) Type C is a female coupler with a hose shank. Camlocks connect and release hoses in seconds by closing two cam arms.'],
  [/Camlock Type D\b/, 'Camlock (cam and groove) Type D is a female coupler with a female thread. Camlocks connect and release hoses in seconds by closing two cam arms.'],
  [/Camlock Type E\b/, 'Camlock (cam and groove) Type E is a male adaptor with a hose shank. Camlocks connect and release hoses in seconds by closing two cam arms.'],
  [/Camlock Type F\b/, 'Camlock (cam and groove) Type F is a male adaptor with a male thread. Camlocks connect and release hoses in seconds by closing two cam arms.'],
  [/Camlock Type DC\b/, 'Camlock Type DC is a dust cap that closes a male adaptor when no hose is connected.'],
  [/Camlock Type DP\b/, 'Camlock Type DP is a dust plug that closes a female coupler when no hose is connected.'],
  [/^Camlock|Tank Truck Adaptor/, 'Camlock (cam and groove) couplings connect and release hoses in seconds by closing two cam arms.'],
  [/QRC/, 'A quick release coupling (QRC) for air lines: push the plug in to connect, and pull back the sleeve to release it.'],
  [/Storz/, 'Storz couplings lock with a quarter turn of their lugs, which makes them quick to connect on water and fire hoses.'],
  [/Bauer/, 'Bauer couplings are ball-and-socket hose couplings with a lever lock. The joint allows some angle between the two pipes.'],
  [/Universal Pipe Joining Coupling/, 'A universal coupling joins two plain-ended pipes without threading or welding, and takes a range of pipe outside diameters.'],
  [/Universal Flange Adapter/, 'A universal flange adapter connects a plain-ended pipe to a flanged valve or fitting without welding.'],
  [/Chicago/, 'Chicago (universal) couplings are used on air hoses. Matching lugged halves twist together with a quarter turn.'],
  [/Flexible Connector/, 'A flexible connector absorbs vibration and small pipe movements, for example at pump connections.'],
  [/Slip On Flange/i, 'A slip-on flange slides over the pipe and is welded inside and out. It is easy to line up.'],
  [/Weld Neck Flange/i, 'A weld neck flange is butt-welded to the pipe through its tapered hub, which suits higher pressures.'],
  [/Blind Flange/, 'A blind flange closes the end of a pipe, valve or vessel opening.'],
  [/Threaded Flange/, 'A threaded flange screws onto threaded pipe, so no welding is needed.'],
  [/Socket Weld Flange/, 'A socket weld flange takes the pipe into a socket and is welded around the outside. It is used on smaller sizes.'],
  [/Pipes? Seamless/, 'Seamless pipe is made without a welded seam, so it is the usual choice for higher pressures.'],
  [/Pipes? ERW/, 'ERW (electric resistance welded) pipe is rolled from steel strip and welded along its length. It usually costs less than seamless pipe.'],
  [/GI Pipes/, 'GI (galvanised iron) pipe is steel pipe coated with zinc against rust, widely used for water lines.'],
  [/Long Nipple/, 'A long nipple is a short length of pipe threaded at both ends, for joining fittings at a set distance.'],
  [/Female King Nipple/, 'A female king nipple has a hose tail on one end and a female thread on the other, to connect a hose to a male-threaded outlet.'],
  [/King Nipple/, 'A king nipple has a hose tail on one end and a male thread on the other, to connect a hose to a threaded fitting.'],
  [/Swage Nipple/, 'A swage nipple steps a line down from one pipe size to a smaller one over a longer length than a reducer.'],
  [/M\/F Reducing Nipple/, 'A male-female reducing nipple has a male thread on one end and a female thread of a different size on the other.'],
  [/Hex Nipple|Reducing Nipple/, 'A hex nipple joins two female-threaded fittings. The hex in the middle takes a spanner.'],
  [/Elbow 180°/, 'A 180° elbow (return bend) turns a line back the way it came.'],
  [/Street Elbow/, 'A street elbow has a male thread on one end and a female thread on the other, so it screws straight into another fitting.'],
  [/Elbow.*Long Radius/, 'A long radius elbow bends over 1.5 times the pipe size, which gives smoother flow and less pressure drop.'],
  [/Elbow.*Short Radius/, 'A short radius elbow bends over 1 times the pipe size, which saves space where room is tight.'],
  [/Elbow/, 'An elbow changes the direction of a line.'],
  [/Cross/, 'A cross joins four lines at one point.'],
  [/Reduc\w* Tee/, 'A reducing tee has a branch smaller than the run, so a smaller line can come off a larger one.'],
  [/Tee/, 'A tee makes a branch at 90° from a line.'],
  [/Eccentric Reducer/, 'An eccentric reducer joins two pipe sizes and keeps one side flat. At a pump suction it is fitted flat side up so no air pocket forms.'],
  [/Concentric Reducer/, 'A concentric reducer joins two pipe sizes on the same centre line.'],
  [/End Cap|Cap$/, 'An end cap closes the end of a pipe.'],
  [/Plug/, 'A plug closes a female-threaded or socket end.'],
  [/Reduc\w* Bush/, 'A reducing bush screws into a female thread to take a smaller size.'],
  [/Reduc\w* (Socket|Coupling)/, 'A reducing socket joins two pipes of different sizes.'],
  [/Half Coupling/, 'A half coupling is welded onto a pipe or vessel to make a branch connection.'],
  [/\bSocket\b(?!-Weld)|Full Coupling/, 'A socket (coupling) joins two pipes of the same size.'],
  [/Union/, 'A union joins two pipes and can be undone with a spanner without turning the pipe, which makes maintenance easier.'],
  [/Threadolet/, 'A threadolet is welded onto a run pipe to give a threaded branch outlet.'],
  [/Hose Mender/, 'A hose mender joins two hose ends, or repairs a damaged hose.'],
  [/Spiral Wound Gaskets/, 'A spiral wound gasket is a metal winding with a soft filler, with guide rings, for flanges under higher pressure and temperature.'],
  [/Ring Gaskets/, 'A ring gasket seals between two flanges. RF (raised face) gaskets sit inside the bolts; FF (full face) gaskets cover the whole flange face.'],
  [/Gasket Sheet/, 'Gasket sheet is cut to make gaskets of any shape or size.'],
  [/Gland Packing/, 'Gland packing seals around valve stems and pump shafts.'],
  [/Composite Hose/, 'Composite hose is built from layers of film and fabric held between wire helices, which keeps it light and flexible for transfer work.'],
  [/Suction/, 'A suction and discharge hose has a built-in helix, so it does not collapse when pumping.'],
  [/Air Hose/, 'Rubber air hose for compressed air lines.'],
  [/Braided Hose/, 'PVC hose reinforced with braided fibre for pressure.'],
  [/Clear Level Hose/, 'Clear PVC hose, so the liquid inside can be seen.'],
  [/Steel Wire Hose/, 'PVC hose reinforced with a steel wire spiral, so it holds its shape under suction.'],
  [/Lay Flat Hose/, 'Lay flat hose rolls flat when empty, which makes it easy to store and carry. It is used for discharge.'],
  [/Pneumatic Hose/, 'Pneumatic tube for air lines and push-in fittings.'],
  [/Hose Clip/, 'A hose clip tightens with a screw to clamp a hose onto a fitting.'],
  [/Bolt Clamp/, 'A bolt clamp grips a hose or pipe firmly onto a fitting and is tightened with bolts.'],
  [/Compression Fitting/, 'A compression fitting seals on the outside of a tube: tightening the nut presses the ferrule onto the tube, with no welding.'],
  [/Pressure Gauge/, 'A liquid-filled pressure gauge: the fill steadies the needle when a pump or machine vibrates.'],
  [/Acrylic Tube Connector/, 'A connector that joins an acrylic level tube to its fittings.'],
  [/Acrylic Tube/, 'Clear acrylic tube, used for example as a sight glass to see the level in a tank.'],
  [/Tank Level Cock/, 'A level cock holds a sight tube on the side of a tank and can be shut off.'],
  [/Tank Connector/, 'A tank connector makes a threaded outlet through the wall of a tank.'],
  [/Test Point/, 'A test point lets you insert a pressure or temperature probe into a line.']
];
const ENDS = [
  [/, Flanged\b/, 'It has flanged ends that bolt to matching pipe flanges.'],
  [/Butterfly.*Wafer/, 'The wafer body is held between two pipe flanges by the flange bolts.'],
  [/Butterfly.*Lug/, 'The lug body has threaded bolt holes, so it can stay in place when the pipe on one side is removed.'],
  [/Gear Operated/, 'A gearbox with a handwheel makes the larger sizes easy to turn.'],
  [/1-Piece|1PCS/, 'The one-piece body is compact.'],
  [/2-Piece/, 'The body is made in two parts.'],
  [/3-Piece/, 'The centre section can be swung out for cleaning or new seats without cutting the pipe.'],
  [/\(Socket-Weld\)/, 'Socket-weld fittings take the pipe into a socket and are welded around the outside. They are used on small, high-pressure lines.'],
  [/^Carbon Steel Threaded (?!Flange)/, 'Threaded fittings screw onto threaded pipe, so no welding is needed.']
];
// Material and rating notes: only for what the product's own material or specs mention.
const NOTES = [
  [/A216|WCB/, 'ASTM A216 WCB is cast carbon steel, a common body material for steel valves.'],
  [/A351|CF8/, 'ASTM A351 covers cast stainless steel: CF8 is the cast form of 304 and CF8M the cast form of 316.'],
  [/A182|F304|F316/, 'ASTM A182 covers forged stainless steel, in grades such as F304 and F316.'],
  [/A105/, 'ASTM A105 is forged carbon steel, the usual material for steel flanges and forged fittings.'],
  [/A126|GJL/, 'ASTM A126 and EN-GJL-250 are grades of grey cast iron.'],
  [/A536|GJS/, 'ASTM A536 and EN-GJS-400-15 are grades of ductile iron, which is tougher and less brittle than grey cast iron.'],
  [/B124/, 'ASTM B124 covers forged copper alloys such as brass.'],
  [/B62/, 'ASTM B62 covers bronze castings for valves and fittings.'],
  [/A106/, 'ASTM A106 Grade B is seamless carbon steel pipe for higher temperatures.'],
  [/A53\b/, 'ASTM A53 covers welded and seamless steel pipe.'],
  [/A234|WPB/, 'ASTM A234 WPB is the carbon steel grade for butt-weld fittings.'],
  [/A403/, 'ASTM A403 covers stainless steel butt-weld fittings.'],
  [/316/, 'Grade 316 has added molybdenum, which resists chlorides such as seawater and salty air better than 304; 304 is the general-purpose grade.'],
  [/GALVANI[SZ]ED/i, 'It is galvanised (zinc coated) against rust.'],
  [/\bPN\d/, 'PN is the nominal pressure in bar: PN16 means 16 bar.'],
  [/\bCL(150|300|600)\b/, 'CL150, CL300 and CL600 are ASME pressure classes.'],
  [/\bCL(1000|2000|3000|6000)\b/, 'The class number (CL1000 to CL6000) sets the wall thickness and pressure rating of the fitting.'],
  [/\b\d+K\b/, '5K, 10K and 16K are Japanese (JIS) flange ratings.'],
  [/WOG/, 'WOG is the rated pressure in psi for water, oil and gas.'],
  [/NSCWP/, 'NSCWP means non-shock cold working pressure.'],
  [/\bS[C]?H[- ]?(STD|\d)/, 'The schedule (SCH) sets the wall thickness: the higher the number, the thicker the wall.'],
  [/CLASS 800/, 'Class 800 is a pressure class for small forged steel valves.'],
  [/\bBSPT?\b.*\bNPT\b|\bNPT\b.*\bBSPT?\b/, 'BSP (British) and NPT (American) threads look alike but do not seal together, so tell us which thread your line uses.'],
  [/\bSW\b/, 'SW means socket-weld ends.']
];

const SERVICE = [
  [/Pipes?( ERW| Seamless|$)/, 'Can you thread the pipe?', 'Yes. We thread pipe at our trade counter in Al Quoz Industrial Area 3, so the pipe you buy can be threaded before you collect it. See our [pipe threading service](PIPE).'],
  [/\bHose$|Composite Hose/, 'Can you cut the hose to length?', 'Yes. We cut hose to length at our counter in Al Quoz Industrial Area 3, and crimp fittings onto hydraulic hose. See our [hose crimping service](HOSE).']
];

function about(name, specs, mat) {
  const t = TYPES.find(([r]) => r.test(name)), e = ENDS.filter(([r]) => r.test(name)).map(x => x[1]);
  const facts = (specs.join(' ') + ' ' + mat).toUpperCase();
  const n = NOTES.filter(([r]) => r.test(facts)).map(x => x[1]);
  const p = [];
  if (t || e.length) p.push([t && t[1]].concat(e).filter(Boolean).join(' '));
  if (n.length) p.push(n.join(' '));
  return p;
}

// up = path to the site root from the page; fmt links in the answers use it
function faq(name, sizeText, specs, up) {
  const f = [];
  if (sizeText) f.push(['Which sizes of ' + name + ' do you supply?', sizeText + '. Send the size and quantity on WhatsApp and we will reply with a price.']);
  if (specs.length) f.push(['Which ratings and specs can I choose?', specs.join(', ') + '. Not sure which one you need? Send a photo of the old part or its nameplate on WhatsApp.']);
  SERVICE.forEach(([r, q, a]) => { if (r.test(name)) f.push([q, a.replace('PIPE', up + 'services/pipe-threading.html').replace('HOSE', up + 'services/hydraulic-hose-crimping.html')]); });
  f.push(['Do you deliver in the UAE?', 'Yes, UAE-wide on orders from AED 5,000. You can also collect from our trade counter at Warehouse 8, 8th Street, Al Quoz Industrial Area 3, Dubai, right next to Ajyad Traditional Kitchen, on its right.']);
  return f;
}

module.exports = { sizeList, DN, about, faq };
