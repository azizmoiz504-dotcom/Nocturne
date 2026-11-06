// Draws the Modern Electric category pictures (they have no photos yet): one line drawing per main category,
// in their blue and orange, as app/me/covers/<category>.png (600 x 600). A real photo can replace any of them
// in the product editor ("Change category picture").
//   node app/tools/me_covers.mjs [app/me]
import { createRequire } from 'module';
import { writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
const require = createRequire(import.meta.url);
const { chromium } = require('playwright');
const out = join(process.argv[2] || join(dirname(fileURLToPath(import.meta.url)), '..', 'me'), 'covers');

const B = '#0a3fa6', O = '#f39019';
const s = (d, w = 9) => `<path d="${d}" fill="none" stroke="${B}" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round"/>`;
const o = (d, w = 9) => `<path d="${d}" fill="none" stroke="${O}" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round"/>`;
const ICONS = {
  'cables-wires':   // a cable drum with the end of the cable and its copper cores
    `<circle cx="88" cy="92" r="56" fill="none" stroke="${B}" stroke-width="9"/><circle cx="88" cy="92" r="18" fill="none" stroke="${B}" stroke-width="9"/>` +
    s('M50 70a44 44 0 0 1 22-18M126 114a44 44 0 0 1-22 18') + s('M88 148c0 18 18 22 44 22h20') + o('M152 162h14M152 178h14', 7) + s('M150 156v28', 9),
  'lugs-connectors-terminals':   // a copper cable lug on the end of a cable
    `<circle cx="56" cy="100" r="26" fill="none" stroke="${O}" stroke-width="10"/><circle cx="56" cy="100" r="9" fill="${O}"/>` +
    o('M80 88h44v24H80') + s('M124 84h20v32h-20zM144 92h40M144 108h40', 9),
  'cable-glands':   // a brass cable gland: hex nut, body and thread
    s('M58 70h84l14 20-14 20H58L44 90z') + s('M70 110v26h60v-26M76 136v34h48v-34') + o('M76 148h48M76 160h48', 6) + s('M90 70V34h20v36'),
  'cable-ties-markers-sleeves':   // a bundle of three cables held by a tie
    `<circle cx="84" cy="88" r="20" fill="none" stroke="${B}" stroke-width="9"/><circle cx="120" cy="88" r="20" fill="none" stroke="${B}" stroke-width="9"/><circle cx="102" cy="120" r="20" fill="none" stroke="${B}" stroke-width="9"/>` +
    o('M58 104c-6-30 14-52 44-52s52 22 46 52c-6 30-26 44-46 44-14 0-26-6-34-16l-18 26h-14', 9),
  'conduits-fittings':   // a conduit bend between two straight lengths
    s('M30 62h70a52 52 0 0 1 52 52v58M30 98h70a16 16 0 0 1 16 16v58') + o('M78 56v48M134 150h44', 9) + s('M30 56v48M110 172h48', 9),
  'cable-tray-trunking-supports':   // a perforated cable tray seen from the end
    s('M14 72l40 30h104l-40-30zM14 72v40l40 30h104v-40M54 102v40') + o('M72 120h12M96 120h12M120 120h12M140 120h8', 8) + s('M38 150v28M146 150v28', 8),
  'boxes-enclosures':   // a junction box with its knockouts and screws
    s('M46 46h108a10 10 0 0 1 10 10v88a10 10 0 0 1-10 10H46a10 10 0 0 1-10-10V56a10 10 0 0 1 10-10z') +
    `<circle cx="100" cy="100" r="22" fill="none" stroke="${O}" stroke-width="9"/>` + s('M100 154v26M100 20v26M10 100h26M164 100h26', 10) +
    `<circle cx="58" cy="66" r="5" fill="${B}"/><circle cx="142" cy="66" r="5" fill="${B}"/><circle cx="58" cy="134" r="5" fill="${B}"/><circle cx="142" cy="134" r="5" fill="${B}"/>`,
  'switches-sockets-plugs':   // a wall socket with its switch
    s('M40 40h120a12 12 0 0 1 12 12v96a12 12 0 0 1-12 12H40a12 12 0 0 1-12-12V52a12 12 0 0 1 12-12z') +
    `<rect x="66" y="70" width="10" height="26" rx="3" fill="${O}"/><rect x="96" y="112" width="26" height="10" rx="3" fill="${O}"/><rect x="66" y="112" width="26" height="10" rx="3" fill="${O}" transform="translate(-6 0)"/>` +
    s('M134 66h14v30h-14z', 7),
  'earthing-lightning-protection':   // the earth sign with a lightning bolt
    o('M104 22l-26 52h26l-16 46', 9) + s('M100 120v24M58 146h84M72 164h56M88 182h24'),
  'tools-testers':   // pliers
    s('M84 30c-8 22-2 42 14 56M116 30c8 22 2 42-14 56') + `<circle cx="100" cy="100" r="13" fill="none" stroke="${B}" stroke-width="9"/>` +
    o('M92 112c-14 18-26 40-30 64M108 112c14 18 26 40 30 64', 14),
  'lighting-general-electrical':   // a light bulb with its glow
    s('M100 40a42 42 0 0 0-26 75c8 7 10 14 10 22h32c0-8 2-15 10-22a42 42 0 0 0-26-75zM84 150h32M88 166h24') + o('M92 120l8-30 8 30', 7) +
    o('M100 14v12M40 44l9 9M160 44l-9 9M22 90h12M166 90h12', 8)
};

const page = name => `<!doctype html><html><body style="margin:0;background:#fff">
<svg xmlns="http://www.w3.org/2000/svg" width="600" height="600" viewBox="0 0 600 600">
  <rect width="600" height="600" fill="#fff"/>
  <circle cx="300" cy="300" r="250" fill="#eef3fc"/>
  <circle cx="300" cy="300" r="250" fill="none" stroke="#dce6f8" stroke-width="6"/>
  <g transform="translate(90 90) scale(2.1)">${ICONS[name]}</g>
</svg></body></html>`;

const browser = await chromium.launch();
const pg = await browser.newPage({ viewport: { width: 600, height: 600 } });
for (const name of Object.keys(ICONS)) {
  await pg.setContent(page(name));
  writeFileSync(join(out, name + '.png'), await pg.screenshot({ clip: { x: 0, y: 0, width: 600, height: 600 } }));
}
await browser.close();
console.log(Object.keys(ICONS).length + ' pictures in ' + out);
