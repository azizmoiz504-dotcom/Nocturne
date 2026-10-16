// Taps through the catalogue app on a real Android phone (emulator) and saves a screenshot of each step.
import { _android as android } from 'playwright';
const PKG = 'com.fakhritools.catalogue', out = 'out';
const wait = ms => new Promise(r => setTimeout(r, ms));
const log = (...a) => console.log(new Date().toISOString().slice(11, 19), ...a);
const fails = [];
const check = (ok, what) => { log((ok ? 'PASS ' : 'FAIL ') + what); if (!ok) fails.push(what); };

const [d] = await android.devices();
log('device', d.model(), d.serial());
const shot = async n => { await d.screenshot({ path: `${out}/${n}.png` }); log('shot', n); };
const key = async k => { await d.shell('input keyevent ' + k); await wait(900); };

async function launch() {
  await d.shell('am force-stop ' + PKG);
  await d.shell('am start -n ' + PKG + '/.MainActivity');
  await wait(900);
  const wv = await d.webView({ pkg: PKG }, { timeout: 60000 });
  const pg = await wv.page();
  pg.on('pageerror', e => { log('PAGE ERROR', e.message); fails.push('page error: ' + e.message); });
  pg.on('console', m => { if (m.type() === 'error') log('console error', m.text()); });
  return pg;
}

let pg = await launch();
await shot('00-opening');
await wait(1000); await shot('01-opening-2');
await wait(2500); await shot('02-home');
const top = () => pg.evaluate(() => { const v = [...document.querySelectorAll('.view')].filter(x => x.style.visibility !== 'hidden').pop(); return v ? v.scrollTop : -1; });
const scroll = y => pg.evaluate(y => { const v = [...document.querySelectorAll('.view')].filter(x => x.style.visibility !== 'hidden').pop(); v.scrollTo(0, y); }, y);
const tap = async (sel, ms = 900) => { await pg.locator(sel).first().click(); await wait(ms); };
const L = '.view:last-child ';

check(await pg.evaluate(() => window.FT_CATS.length > 20 && document.querySelectorAll('.ccard').length > 5), 'home shows the ranges');
const imgsOk = await pg.evaluate(() => [...document.querySelectorAll('.ph img')].filter(i => i.complete && i.naturalWidth > 0).length);
check(imgsOk > 4, 'photos load from inside the app (' + imgsOk + ')');
await scroll(800); await wait(900); await shot('03-home-ranges');
await scroll(1700); await wait(900); await shot('04-home-shop');
await scroll(99999); await wait(900); await shot('05-home-end');
await scroll(0); await wait(500);

// search
await tap('.searchbox', 1200);
await pg.locator(L + 'input[type=search]').fill('2" elbow');
await wait(800); await shot('06-search');
check(await pg.evaluate(() => document.querySelectorAll('.view:last-child .prow').length > 0), 'search finds 2" elbows');
await key(4);   // back closes the keyboard
await key(4);   // back leaves search
check(await pg.evaluate(() => !document.querySelector('.view:last-child input[type=search]')), 'phone Back button leaves search');

// ranges -> range -> product
await tap('.view:last-child [data-go="cats"]', 1200); await shot('07-ranges');
await tap(L + '[data-go="c/ball-valves"]', 1300); await shot('08-range');
await scroll(420); await wait(800); await shot('09-range-products');
await tap(L + '.pcard', 1400); await shot('10-product');
await scroll(420); await wait(700);
await tap(L + '.sz >> nth=1', 300); await tap(L + '.sz >> nth=3', 300);
await shot('11-sizes');
await tap(L + '#addBtn', 1200); await shot('12-added');
check(await pg.evaluate(() => JSON.parse(localStorage.getItem('ft-list') || '[]').length === 2), 'two sizes went into the cart');

// zoom
await scroll(0); await wait(500);
await tap(L + '[data-zoom]', 900); await shot('13-zoom');
await key(4);
check(await pg.evaluate(() => document.getElementById('zoom').hidden), 'Back closes the zoom');

// share a product (photo + text) opens the phone's share sheet
await tap(L + '.bar [data-share]', 2500); await shot('14-share-sheet');
await key(4); await wait(800);
pg = await (await d.webView({ pkg: PKG })).page();

// show the customer
await key(4); await wait(600);
await tap(L + '.chead [data-present]', 1200); await shot('15-show-customer');
await pg.evaluate(() => { const t = document.querySelector('.pr__track'); t.scrollTo({ left: t.clientWidth * 2 }); }); await wait(1000); await shot('16-show-customer-3');
await key(4);

// quick add with the + on a card
await tap(L + '.pcard >> nth=2 >> [data-add]', 1000); await shot('17-quick-add');
await tap('#sheet .sz >> nth=0', 300); await tap('#sheet #sadd', 1500);

// cart -> order form -> send
await tap('#tabs [data-tab="cart"]', 1200); await shot('18-cart');
await tap(L + '[data-checkout]', 1200); await shot('19-order-form');
await pg.locator(L + '[data-c="name"]').fill('Test Workshop');
await pg.locator(L + '[data-c="phone"]').fill('050 000 0000');
await key(4);
await tap(L + '[data-val="deliver"]', 500); await tap(L + '[data-val="Cash"]', 500);
await scroll(600); await wait(600); await shot('20-order-form-filled');
await tap(L + '[data-place]', 3500); await shot('21-after-send');   // WhatsApp is not on the emulator: the browser or a message shows
await key(4); await wait(1500);
pg = await (await d.webView({ pkg: PKG })).page();
await wait(800); await shot('22-order-sent');
check(await pg.evaluate(() => JSON.parse(localStorage.getItem('ft-orders') || '[]').length === 1), 'order saved in Orders');
check(await pg.evaluate(() => JSON.parse(localStorage.getItem('ft-list') || '[]').length === 0), 'cart empty after the order');
await tap('#sheet [data-k="orders"]', 1300); await shot('23-orders');
await tap(L + '[data-order]', 1000); await shot('24-order-details');
await key(4);

// nothing sticks out sideways on any open screen
const wide = await pg.evaluate(() => [...document.querySelectorAll('.view')].filter(v => v.scrollWidth > v.clientWidth + 1).map(v => v.className).length);
check(wide === 0, 'no screen scrolls sideways');

// the live list check ran (the emulator is online)
await wait(4000);
const lc = await pg.evaluate(() => window.FTNative ? +FTNative.lastCheck() : 0);
check(lc > 0, 'checked the website for a newer list');

// Back from the root of Home leaves the app
await tap('#tabs [data-tab="home"]', 900); await tap('#tabs [data-tab="home"]', 900);
for (let i = 0; i < 4; i++) await key(4);
const fg = await d.shell('dumpsys activity activities | grep -E "mResumedActivity|topResumedActivity"');
check(!String(fg).includes(PKG), 'Back on Home leaves the app');

// offline: everything still works
await d.shell('svc wifi disable'); await d.shell('svc data disable'); await wait(2000);
pg = await launch();
await wait(4000); await shot('25-offline-home');
await tap('.view:last-child [data-go="cats"]', 1200);
await tap(L + '[data-go="c/camlock-couplings"]', 1500); await shot('26-offline-range');
const offImgs = await pg.evaluate(() => [...document.querySelectorAll('.view:last-child .ph img')].filter(i => i.complete && i.naturalWidth > 0).length);
check(offImgs > 3, 'photos show with no internet (' + offImgs + ')');
check(await pg.evaluate(() => JSON.parse(localStorage.getItem('ft-orders') || '[]').length === 1), 'orders kept after closing the app');
await d.shell('svc wifi enable'); await d.shell('svc data enable');

log(fails.length ? 'FAILED: ' + fails.join(' | ') : 'ALL CHECKS PASSED');
await d.close();
process.exit(fails.length ? 1 : 0);
