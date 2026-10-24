// Taps through the sales catalogue app (Bait Al Maqdis + Fakhri Tools) on a real Android phone (emulator)
// and saves a screenshot of each step.
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
          // a tap while a screen slides in or out is ignored by the app, as on a phone: wait for the slide to end
          const ok = await evaluate(`(() => { const el = ${finder(sel)}; if (!el) return false;
            if (${i} < 8 && document.getAnimations && document.getAnimations().some(a => a.playState === 'running' && !(window.CSSAnimation && a instanceof CSSAnimation) && !(window.CSSTransition && a instanceof CSSTransition))) return false;
            el.scrollIntoView({ block: 'center' }); el.click(); return true; })()`);
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
  // the way a salesman opens it: the home-screen icon (whichever branch's icon is switched on)
  sh('shell monkey -p ' + PKG + ' -c android.intent.category.LAUNCHER 1');
  await wait(900);
  return attach();
}
// which home-screen icons the app shows right now (".MainActivity" = Fakhri Tools, ".BrandBam" = Bait Al Maqdis)
const icons = () => sh('shell cmd package query-activities --brief -a android.intent.action.MAIN -c android.intent.category.LAUNCHER').split('\n').filter(l => l.includes(PKG)).map(l => l.trim().split('/').pop()).join(' ');
const resumed = () => sh('shell dumpsys activity activities').split('\n').filter(l => /ResumedActivity/.test(l)).join(' ');
const ls = (k, n) => pg.evaluate(([k, n]) => JSON.parse(localStorage.getItem(k) || '[]').length === n, [k, n]);
log('devices', sh('devices').replace(/\s+/g, ' '));
log('boot', sh('shell getprop sys.boot_completed').trim());
log('icons after install:', icons());
let pg = await launch();
await shot('00-opening');
await wait(2500); await shot('01-pick-branch');
const top = () => pg.evaluate(() => { const v = FT.top && FT.top(); return v ? v.scrollTop : -1; });
const scroll = y => pg.evaluate(y => { const v = FT.top(); v.scrollTo(0, y); }, y);
const tap = async (sel, ms = 900) => { await pg.locator(sel).first().click(); await wait(ms); };
const L = '#stage > .view:not(.is-under) ';   // the screen on top
// picks the first option in every size / specs / material group still open (the app asks for a pick or Not sure)
const pickRest = scope => pg.evaluate(async scope => { for (let i = 0; i < 6; i++) { const r = [...document.querySelectorAll(scope + ' .pkg[data-g] .sizes')].find(r => !r.querySelector('.sz.is-on')); if (!r) return; r.querySelector('.sz:not(.is-off)').click(); await new Promise(r => setTimeout(r, 250)); } }, scope);

/* ---------- first start: pick Bait Al Maqdis ---------- */
check(await pg.evaluate(() => document.querySelectorAll('#first .bcard').length === 2), 'first start asks which branch');
await tap('#first .bcard--bam', 3500);
pg = await attach(); await wait(1500);
check(await pg.evaluate(() => FTNative.brand() === 'bam' && document.documentElement.dataset.brand === 'bam' && document.documentElement.dataset.theme === 'light'), 'Bait Al Maqdis picked: the app turns orange, light look');
await shot('02-bam-home');
check(await pg.evaluate(() => { const t = [...document.querySelectorAll('.ctile--fk')], first = t[0] && t[0].getAttribute('data-go'); return t.length >= 40 && /^c\/b-/.test(first) && !document.querySelector('.ctile--img, .sech--more'); }), 'home shows one list of categories, Bait Al Maqdis first, then Fakhri Tools');
await scroll(99999); await wait(900); await shot('03-bam-home-end');
await scroll(0); await wait(500);
const imgsOk = await pg.evaluate(() => [...document.querySelectorAll('.ctile img')].filter(i => i.complete && i.naturalWidth > 0).length);
check(imgsOk > 4, 'category pictures load from inside the app (' + imgsOk + ')');

// leave the app: the home-screen icon becomes Bait Al Maqdis
await key(3); await wait(3000);
const ic1 = icons(); log('icons after picking Bait Al Maqdis:', ic1);
check(ic1.includes('BrandBam') && !ic1.includes('MainActivity'), 'home-screen icon and name switched to Bait Al Maqdis');
pg = await launch(); await wait(2500);
check(await pg.evaluate(() => FTNative.brand() === 'bam' && !document.getElementById('first')), 'the Bait Al Maqdis icon opens the app');
await shot('04-bam-reopened');

/* ---------- a Bait Al Maqdis product: flip card with prices ---------- */
await tap(L + '[data-go="c/b-kapusi"]', 1500);
for (let i = 0; i < 20 && !(await pg.evaluate(() => FT.top().querySelectorAll('.ph img').length >= 250)); i++) await wait(500);
await shot('05-bam-category');
// a big category: scroll to the end one screen at a time (each step its own short call), every photo must be drawn
for (let y = 0, h = 1; y <= h; y += 600) { h = await pg.evaluate(y => { const v = FT.top(); v.scrollTo(0, y); return v.scrollHeight; }, y); await wait(200); }
await wait(2000);
const drawn = await pg.evaluate(() => { const im = [...FT.top().querySelectorAll('.ph img')]; return [im.filter(i => i.complete && i.naturalWidth > 0 && i.classList.contains('is-in')).length, im.length]; });
await shot('05b-bam-category-end');
check(drawn[1] >= 250 && drawn[0] === drawn[1], 'every photo in a 250-product category shows (' + drawn.join(' of ') + ')');
await scroll(0); await wait(800);
await tap(L + '.flip [data-flip]', 1000); await shot('06-flip-prices');
await tap(L + '.flip.is-flipped [data-radd]', 900); await shot('07-flip-added');
check(await ls('bam-list', 1), 'a size went into the cart from the flip card');
const rowQ = () => pg.evaluate(() => { const r = document.querySelector('#stage > .view:not(.is-under) .flip.is-flipped .row'); const i = r && r.querySelector('input'); return [i ? i.value : 'add', (JSON.parse(localStorage.getItem('bam-list') || '[]')[0] || {}).q]; });
check((await rowQ()).join() === '1,1', 'after + Add the card shows − 1 + (' + (await rowQ()) + ')');
await tap(L + '.flip.is-flipped .row [data-st="1"]', 600); await tap(L + '.flip.is-flipped .row [data-st="1"]', 600);
check((await rowQ()).join() === '3,3', '+ twice shows 3 and the cart has 3 (' + (await rowQ()) + ')');
await tap(L + '.flip.is-flipped .row [data-st="-1"]', 600); await tap(L + '.flip.is-flipped .row [data-st="-1"]', 600);
check((await rowQ()).join() === '1,1', '− twice goes back to 1 (' + (await rowQ()) + ')');
await shot('07b-flip-stepper');
await key(4);
check(await pg.evaluate(() => !document.querySelector('.flip.is-flipped')), 'phone Back turns the card back first');
await key(4);

/* ---------- a Fakhri Tools product inside the Bait Al Maqdis app ---------- */
await tap(L + '[data-go="c/ball-valves"]', 1500); await shot('08-fakhri-category-in-bam');
await tap(L + '.pcard', 1400); await shot('09-fakhri-product');
await scroll(420); await wait(700);
await tap(L + '#addBtn', 900);
check(await ls('bam-list', 1) && await pg.evaluate(() => document.querySelector('#stage > .view:not(.is-under) .pkg.is-miss') !== null), 'Add asks for the size first');
await tap(L + '.sz[data-row2="s"] >> nth=3', 300); await pickRest('#stage > .view:not(.is-under)');
await tap(L + '#addBtn', 1200); await shot('10-fakhri-added');
check(await ls('bam-list', 2), 'Fakhri Tools product went into the same cart');
await scroll(0); await wait(500);
await tap(L + '[data-zoom]', 900); await shot('11-zoom');
await key(4);
check(await pg.evaluate(() => document.getElementById('zoom').hidden), 'Back closes the zoom');
await key(4); await key(4);

/* ---------- search by part number ---------- */
await tap('#tabs [data-tab="home"]', 700); await tap('#tabs [data-tab="home"]', 700);
await tap('.searchbox', 1200);
await pg.locator(L + 'input[type=search]').fill('K-0026');
await wait(800); await shot('12-search-part-no');
check(await pg.evaluate(() => document.querySelectorAll('#stage > .view:not(.is-under) .prow').length === 1), 'search finds part number K-0026');
await pg.locator('body').blur(); await wait(400);
await tap(L + '.prow', 1100); await shot('13-item-sheet');
await key(4);
check(await pg.evaluate(() => document.getElementById('sheet').hidden), 'Back closes the sizes sheet');
await key(4);

/* ---------- cart -> checkout -> placed (no WhatsApp needed) ---------- */
await tap('#tabs [data-tab="cart"]', 1200); await shot('14-cart');
await tap(L + '[data-checkout]', 1200); await shot('15-checkout');
await pg.locator(L + '[data-c="name"]').fill('Test Customer');
await pg.locator('body').blur(); await wait(500);
await tap(L + '[data-place]', 2500); await shot('16-placed');
check(await ls('bam-orders', 1) && await ls('bam-list', 0), 'order saved and cart emptied, without WhatsApp');
check(resumed().includes(PKG), 'placing the order stays in the app');
const oid = await pg.evaluate(() => JSON.parse(localStorage.getItem('bam-orders'))[0].id);
const pdfLen = await pg.evaluate(id => window.FT_ORDER_PDF(FT.pdfData(id)).then(b => b.slice(0, 4) === 'JVBE' ? b.length : -1, () => -2), oid);
check(pdfLen > 20000, 'order form PDF is made (' + pdfLen + ' chars)');
await tap(L + '[data-k="pdf"]', 5000); await shot('17-pdf-open');
check(await pg.evaluate(() => (window.__lastPdf || '').length > 20000), 'Order form button hands the PDF to the phone');
log('after PDF:', resumed());
await key(4); await wait(1500);
pg = await attach();
await tap(L + '[data-k="wa"]', 4000); await shot('18-send-whatsapp');   // WhatsApp is not on the emulator: the share menu shows
await key(4); await wait(1500);
pg = await attach();

/* ---------- PDFs ---------- */
await tap('#tabs [data-tab="pdfs"]', 1200); await shot('19-pdfs');
check(await pg.evaluate(() => document.querySelectorAll('#stage > .view:not(.is-under) [data-pdf]').length >= 6), 'PDFs tab lists the catalogues');
const bamPdf = await pg.evaluate(() => 'bam/' + window.BAM_DATA.pdfs[2].file);
await tap(L + '[data-pdf="2"][data-how="open"]', 5000); await shot('20-catalogue-open');
log('after catalogue:', resumed());
await key(4); await wait(1500);
pg = await attach();

/* ---------- orders ---------- */
await tap('#tabs [data-tab="orders"]', 1300); await shot('21-orders');
await tap(L + '[data-order]', 1000); await shot('22-order-details');
await key(4);

/* ---------- Arabic ---------- */
await tap('#tabs [data-tab="home"]', 700); await tap('#tabs [data-tab="home"]', 700);
await tap(L + '[data-lang]', 3000);
pg = await attach(); await wait(1000);
check(await pg.evaluate(() => document.documentElement.dir === 'rtl'), 'Arabic turns the screens right to left');
await shot('23-arabic');
await tap(L + '[data-lang]', 3000);
pg = await attach(); await wait(1000);

/* ---------- switch to Fakhri Tools in Settings ---------- */
await tap(L + '[data-go="settings"]', 1200); await shot('24-settings');
await tap(L + '[data-settheme="dark"]', 1200); await shot('24b-dark-look');
check(await pg.evaluate(() => document.documentElement.dataset.theme === 'dark' && JSON.parse(localStorage.getItem('app-theme')) === 'dark'), 'Settings turns on the dark look');
await tap(L + '[data-settheme="light"]', 900);
await tap(L + '.bcard--fakhri', 900); await shot('25-switch-confirm');
await tap('#sheet [data-ok]', 3500);
pg = await attach(); await wait(1500);
check(await pg.evaluate(() => FTNative.brand() === 'fakhri' && document.documentElement.dataset.brand === 'fakhri'), 'switched to Fakhri Tools: white and red');
await shot('26-fakhri-home');
check(await ls('ft-list', 0) && await ls('ft-orders', 0), 'each branch keeps its own cart and orders');
await scroll(99999); await wait(900); await shot('27-fakhri-home-end');
await key(3); await wait(3000);
const ic2 = icons(); log('icons after switching to Fakhri Tools:', ic2);
check(ic2.includes('MainActivity') && !ic2.includes('BrandBam'), 'home-screen icon and name switched to Fakhri Tools');
pg = await launch(); await wait(2500);
check(await pg.evaluate(() => FTNative.brand() === 'fakhri'), 'the Fakhri Tools icon opens the app');

/* ---------- Fakhri Tools order with a Bait Al Maqdis product ---------- */
await tap(L + '[data-go="c/b-kapusi"]', 1500);
await tap(L + '.flip [data-flip]', 900); await tap(L + '.flip.is-flipped [data-radd]', 900);
await key(4); await key(4);
await tap('#tabs [data-tab="cart"]', 1200); await shot('28-fakhri-cart');
await tap(L + '[data-checkout]', 1200);
await pg.locator(L + '[data-c="name"]').fill('Test Workshop');
await pg.locator('body').blur(); await wait(400);
await tap(L + '[data-place]', 900);
check(await ls('ft-orders', 0), 'Fakhri Tools asks for the phone number first');
await pg.locator(L + '[data-c="phone"]').fill('050 000 0000');
await pg.locator('body').blur(); await wait(400);
await tap(L + '[data-val="deliver"]', 500); await tap(L + '[data-val="Cash"]', 500);
await scroll(600); await wait(600); await shot('29-fakhri-checkout');
await tap(L + '[data-place]', 2500); await shot('30-fakhri-placed');
check(await ls('ft-orders', 1) && await ls('ft-list', 0), 'Fakhri Tools order saved, without WhatsApp');

// nothing sticks out sideways on any open screen
const wide = await pg.evaluate(() => [...document.querySelectorAll('.view')].filter(v => v.style.visibility !== 'hidden' && v.scrollWidth > v.clientWidth + 1).map(v => v.className).length);
check(wide === 0, 'no screen scrolls sideways');

// the live list check ran (the emulator is online)
await wait(4000);
const lc = await pg.evaluate(() => window.FTNative ? +FTNative.lastCheck() : 0);
check(lc > 0, 'checked the website for a newer Fakhri Tools list');

// Back from the root of Home leaves the app
await tap('#tabs [data-tab="home"]', 900); await tap('#tabs [data-tab="home"]', 900);
for (let i = 0; i < 4; i++) await key(4);
check(!resumed().includes(PKG), 'Back on Home leaves the app');

/* ---------- offline: everything still works ---------- */
await d.shell('svc wifi disable'); await d.shell('svc data disable'); await wait(2000);
pg = await launch();
await wait(4000); await shot('31-offline-home');
const photosIn = async () => { let n = 0; for (let i = 0; i < 10 && n <= 3; i++) { await wait(1000); n = await pg.evaluate(() => [...document.querySelectorAll('#stage > .view:not(.is-under) .ph img')].filter(i => i.complete && i.naturalWidth > 0).length); } return n; };
await tap(L + '[data-go="c/camlock-couplings"]', 2500);
let offImgs = await photosIn(); await shot('32-offline-fakhri');
check(offImgs > 3, 'Fakhri Tools photos show with no internet (' + offImgs + ')');
await key(4); await wait(800);
await tap(L + '[data-go="c/b-hammers"]', 2500);
offImgs = await photosIn(); await shot('33-offline-bam');
check(offImgs > 2, 'Bait Al Maqdis photos show with no internet (' + offImgs + ')');
check(await ls('ft-orders', 1) && await ls('bam-orders', 1), 'orders kept after closing the app');
await d.shell('svc wifi enable'); await d.shell('svc data enable');

/* ---------- PDF viewers and WhatsApp get whole files (many refuse a piece of one: "Not a whole file") ---------- */
// asks the app for the file the way such an app does; needs root on the phone, which test phones have
const fetchFile = rel => { try { return execSync('adb shell content read --uri content://' + PKG + '.photos/' + rel, { timeout: 60000, maxBuffer: 64e6 }); } catch (e) { log('read failed: ' + rel + ' ' + e.message.split('\n')[0]); return Buffer.alloc(0); } };
if (/restarting|already running/.test(sh('root'))) {
  sh('wait-for-device', 60000); await wait(4000);
  const made = sh('shell ls /data/data/' + PKG + '/cache/share').split(/\s+/).find(f => f.endsWith('.pdf'));
  for (const [rel, what] of [[bamPdf, 'a catalogue PDF'], [made && 'share/' + made, 'an order form PDF']]) {
    const b = rel ? fetchFile(rel) : Buffer.alloc(0);
    check(b.slice(0, 4).toString() === '%PDF', 'a PDF viewer can open ' + what + ' (' + (rel || 'not found') + ', ' + b.length + ' bytes)');
  }
} else log('SKIP whole-file check: no root on this phone');

log(fails.length ? 'FAILED: ' + fails.join(' | ') : 'ALL CHECKS PASSED');
process.exit(fails.length ? 1 : 0);
