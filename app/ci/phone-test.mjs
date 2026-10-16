// Taps through the catalogue app on a real Android phone (emulator) and saves a screenshot of each step.
// Talks to the phone with adb and to the app's pages over the WebView's debugging connection.
import { execSync } from 'child_process';
import fs from 'fs';
const PKG = 'com.fakhritools.catalogue', out = 'out';
const wait = ms => new Promise(r => setTimeout(r, ms));
const log = (...a) => console.log(new Date().toISOString().slice(11, 19), ...a);
const fails = [];
const check = (ok, what) => { log((ok ? 'PASS ' : 'FAIL ') + what); if (!ok) fails.push(what); };
setTimeout(() => { log('WATCHDOG: test took too long'); process.exit(2); }, 18 * 60 * 1000);
const sh = (c, t = 30000) => { try { return execSync('adb ' + c, { timeout: t, encoding: 'utf8' }); } catch (e) { log('adb failed: ' + c + ' ' + e.message.split('\n')[0]); return ''; } };
const d = { shell: async c => sh('shell ' + JSON.stringify(c)) };
const shot = async n => { try { fs.writeFileSync(`${out}/${n}.png`, execSync('adb exec-out screencap -p', { timeout: 30000, maxBuffer: 64e6 })); log('shot', n); } catch (e) { log('shot failed', n); } };
const key = async k => { sh('shell input keyevent ' + k); await wait(900); };

/* A tiny driver over the WebView's DevTools connection (Runtime.evaluate only). */
function page(ws) {
  let id = 0; const pending = new Map();
  ws.onmessage = ev => {
    const m = JSON.parse(ev.data);
    if (m.id && pending.has(m.id)) { pending.get(m.id)(m); pending.delete(m.id); }
    if (m.method === 'Runtime.exceptionThrown') { const t = m.params.exceptionDetails; const msg = (t.exception && t.exception.description) || t.text; log('PAGE ERROR', msg); fails.push('page error: ' + msg); }
  };
  const send = (method, params) => new Promise((res, rej) => { const i = ++id; pending.set(i, res); ws.send(JSON.stringify({ id: i, method, params })); setTimeout(() => { if (pending.has(i)) { pending.delete(i); rej(new Error('timeout ' + method)); } }, 20000); });
  send('Runtime.enable', {});
  async function evaluate(fn, arg) {
    const expr = typeof fn === 'function' ? '(' + fn.toString() + ')(' + JSON.stringify(arg === undefined ? null : arg) + ')' : fn;
    const r = await send('Runtime.evaluate', { expression: expr, awaitPromise: true, returnByValue: true });
    if (r.result && r.result.exceptionDetails) throw new Error('evaluate: ' + JSON.stringify(r.result.exceptionDetails).slice(0, 300));
    return r.result && r.result.result ? r.result.result.value : undefined;
  }
  // "css >> nth=2 >> css" (the subset the test uses)
  const finder = sel => `(() => { let els = [document]; for (const part of ${JSON.stringify(sel)}.split(' >> ')) { const m = part.match(/^nth=(\\d+)$/); if (m) els = els[+m[1]] ? [els[+m[1]]] : []; else els = els.flatMap(e => [...e.querySelectorAll(part)]); } return els[0] || null; })()`;
  const locator = sel => {
    const one = {
      first: () => one,
      async click() {
        for (let i = 0; i < 20; i++) {
          const ok = await evaluate(`(() => { const el = ${finder(sel)}; if (!el) return false; el.scrollIntoView({ block: 'center' }); el.click(); return true; })()`);
          if (ok) return; await wait(500);
        }
        throw new Error('not found: ' + sel);
      },
      async fill(v) {
        const ok = await evaluate(`(() => { const el = ${finder(sel)}; if (!el) return false; el.focus(); el.value = ${JSON.stringify(v)}; el.dispatchEvent(new Event('input', { bubbles: true })); el.dispatchEvent(new Event('change', { bubbles: true })); return true; })()`);
        if (!ok) throw new Error('not found: ' + sel);
      },
      async blur() { await evaluate('document.activeElement && document.activeElement.blur()'); }
    };
    return one;
  };
  return { evaluate, locator, waitForTimeout: wait };
}
async function attach() {
  for (let i = 0; i < 30; i++) {
    const pid = sh('shell pidof ' + PKG).trim();
    if (pid) {
      sh('forward --remove-all');
      sh('forward tcp:9222 localabstract:webview_devtools_remote_' + pid);
      try {
        const list = await (await fetch('http://127.0.0.1:9222/json')).json();
        const t = list.find(x => String(x.url).includes('app.fakhri.local')) || list[0];
        if (t && t.webSocketDebuggerUrl) {
          const ws = new WebSocket(t.webSocketDebuggerUrl);
          await new Promise((res, rej) => { ws.onopen = res; ws.onerror = rej; });
          const pg = page(ws);
          await pg.evaluate('1');
          return pg;
        }
      } catch (e) { log('attach retry', String(e.message || e).split('\n')[0]); }
    }
    await wait(2000);
  }
  throw new Error('could not reach the app');
}
async function launch() {
  sh('shell am force-stop ' + PKG);
  sh('shell am start -n ' + PKG + '/.MainActivity');
  await wait(900);
  return attach();
}
log('devices', sh('devices').replace(/\s+/g, ' '));
log('boot', sh('shell getprop sys.boot_completed').trim());
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
await pg.locator('body').blur(); await wait(500);
await key(4);   // back leaves search
check(await pg.evaluate(() => !document.querySelector('.view:last-child input[type=search]')), 'phone Back button leaves search');

// ranges -> range -> product
await tap('.view:last-child [data-go="cats"]', 1200); await shot('07-ranges');
await tap(L + '[data-go="c/ball-valves"]', 1300); await shot('08-range');
await scroll(420); await wait(800); await shot('09-range-products');
await tap(L + '.pcard', 1400); await shot('10-product');
await scroll(420); await wait(700);
await tap(L + '.sz[data-row="s"] >> nth=3', 300); await tap(L + '.sz[data-row="sp"] >> nth=0', 300);
await shot('11-sizes');
await tap(L + '#addBtn', 1200); await shot('12-added');
check(await pg.evaluate(() => JSON.parse(localStorage.getItem('ft-list') || '[]').length === 1), 'product went into the cart');

// zoom
await scroll(0); await wait(500);
await tap(L + '[data-zoom]', 900); await shot('13-zoom');
await key(4);
check(await pg.evaluate(() => document.getElementById('zoom').hidden), 'Back closes the zoom');

// share a product (photo + text) opens the phone's share sheet
await tap(L + '.bar [data-share]', 2500); await shot('14-share-sheet');
await key(4); await wait(800);
pg = await attach();

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
await pg.locator('body').blur(); await wait(500);
await tap(L + '[data-val="deliver"]', 500); await tap(L + '[data-val="Cash"]', 500);
await scroll(600); await wait(600); await shot('20-order-form-filled');
await tap(L + '[data-place]', 3500); await shot('21-after-send');   // WhatsApp is not on the emulator: the browser or a message shows
await key(4); await wait(1500);
pg = await attach();
await wait(800); await shot('22-order-sent');
check(await pg.evaluate(() => JSON.parse(localStorage.getItem('ft-orders') || '[]').length === 1), 'order saved in Orders');
check(await pg.evaluate(() => JSON.parse(localStorage.getItem('ft-list') || '[]').length === 0), 'cart empty after the order');
await tap('#sheet [data-k="orders"]', 1300); await shot('23-orders');
await tap(L + '[data-order]', 1000); await shot('24-order-details');
await key(4);

// nothing sticks out sideways on any open screen
const wide = await pg.evaluate(() => [...document.querySelectorAll('.view')].filter(v => v.style.visibility !== 'hidden' && v.scrollWidth > v.clientWidth + 1).map(v => v.className).length);
check(wide === 0, 'no screen scrolls sideways');

// the live list check ran (the emulator is online)
await wait(4000);
const lc = await pg.evaluate(() => window.FTNative ? +FTNative.lastCheck() : 0);
check(lc > 0, 'checked the website for a newer list');

// Back from the root of Home leaves the app
await tap('#tabs [data-tab="home"]', 900); await tap('#tabs [data-tab="home"]', 900);
for (let i = 0; i < 4; i++) await key(4);
const fg = sh('shell dumpsys activity activities').split('\n').filter(l => /ResumedActivity/.test(l)).join(' ');
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
process.exit(fails.length ? 1 : 0);
