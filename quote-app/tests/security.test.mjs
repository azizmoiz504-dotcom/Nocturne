// Security check: no staff route or staff page may ever give out cost_price, unit_cost, total_cost, profit, margin or markup.
//
// Part 1 (always): reads the source of every staff route and the staff page.
// Part 2 (when BASE is set): talks to a RUNNING copy of the app with a TEST database. It changes settings and
// prices, so never point it at the real shop database.
//   BASE=http://localhost:3100 OWNER_PASSWORD=... npm test
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve(import.meta.dirname, '..');
const FORBIDDEN_KEYS = ['cost_price', 'unit_cost', 'total_cost', 'line_cost', 'profit', 'margin_pct', 'markup_pct', 'markup_fixed', 'won_profit'];

function walk(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? walk(path.join(dir, e.name)) : [path.join(dir, e.name)]));
}

test('staff routes and the staff page never name a cost/profit field', () => {
  const files = [
    ...walk(path.join(ROOT, 'app/api/staff')),
    path.join(ROOT, 'components/QuoteApp.tsx'),
    path.join(ROOT, 'components/ProductSearch.tsx'),
    path.join(ROOT, 'app/quote/page.tsx'),
  ];
  for (const f of files) {
    const src = fs.readFileSync(f, 'utf8');
    for (const k of FORBIDDEN_KEYS) assert.ok(!src.includes(k), `${path.relative(ROOT, f)} mentions "${k}"`);
    assert.ok(!/toOwner(Product|Quote)/.test(src), `${path.relative(ROOT, f)} uses an owner view`);
  }
});

test('staff views are built field by field (no spreading of database rows)', () => {
  const p = fs.readFileSync(path.join(ROOT, 'lib/products.ts'), 'utf8');
  const q = fs.readFileSync(path.join(ROOT, 'lib/quotes.ts'), 'utf8');
  const body = (src, fn) => src.slice(src.indexOf('export function ' + fn), src.indexOf('\n}\n', src.indexOf('export function ' + fn)));
  for (const [src, fn] of [[p, 'toStaffProduct'], [q, 'toStaffLine'], [q, 'toStaffQuote']]) {
    const b = body(src, fn);
    assert.ok(b.length > 20, fn + ' not found');
    assert.ok(!b.includes('...'), fn + ' copies a whole object');
    for (const k of FORBIDDEN_KEYS) assert.ok(!b.includes(k), `${fn} includes ${k}`);
  }
  // the customer PDF gets the staff view only
  const pdfRoute = fs.readFileSync(path.join(ROOT, 'app/api/staff/quotes/[id]/pdf/route.ts'), 'utf8');
  assert.match(pdfRoute, /buildQuotePdf\(toStaffQuote\(q\)/);
  // the AI never gets prices
  const ai = fs.readFileSync(path.join(ROOT, 'lib/ai.ts'), 'utf8');
  const cat = ai.slice(ai.indexOf('function catalogueText'), ai.indexOf('const RULES'));
  for (const k of ['cost_price', 'sell_price', 'markup']) assert.ok(!cat.includes(k), 'AI catalogue includes ' + k);
});

const BASE = process.env.BASE;
const OWNER_PASSWORD = process.env.OWNER_PASSWORD;

function findForbidden(x, where = '') {
  const out = [];
  if (Array.isArray(x)) x.forEach((v, i) => out.push(...findForbidden(v, `${where}[${i}]`)));
  else if (x && typeof x === 'object') {
    for (const [k, v] of Object.entries(x)) {
      if (FORBIDDEN_KEYS.includes(k) || /cost|profit|margin|markup/i.test(k)) out.push(`${where}.${k}`);
      out.push(...findForbidden(v, `${where}.${k}`));
    }
  }
  return out;
}

class Client {
  jar = new Map();
  async req(method, url, json) {
    const headers = { cookie: [...this.jar].map(([k, v]) => `${k}=${v}`).join('; ') };
    if (json !== undefined) headers['content-type'] = 'application/json';
    const r = await fetch(BASE + url, { method, headers, body: json === undefined ? undefined : JSON.stringify(json), redirect: 'manual' });
    for (const c of r.headers.getSetCookie?.() || []) {
      const [kv] = c.split(';');
      const [k, v] = kv.split('=');
      if (v) this.jar.set(k, v); else this.jar.delete(k);
    }
    const ct = r.headers.get('content-type') || '';
    return { status: r.status, ct, body: ct.includes('json') ? await r.json() : await r.arrayBuffer() };
  }
}

test('live app: staff responses never contain costs; staff cannot use owner routes', { skip: !BASE || !OWNER_PASSWORD }, async () => {
  const owner = new Client();
  assert.equal((await owner.req('POST', '/api/owner/login', { password: OWNER_PASSWORD })).status, 200);
  assert.equal((await owner.req('PUT', '/api/owner/settings', { staff_names: ['Test Staff'], new_staff_pin: '4321' })).status, 200);

  // give 30 products a cost, and let the default markup make their sell price
  const list = (await owner.req('GET', '/api/owner/products')).body.products;
  const pick = list.slice(0, 30);
  const csv = 'name,size,material_spec,cost_price\n' + pick.map((p, i) => [p.name, p.size, p.material_spec, (11.37 + i).toFixed(2)].map((v) => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n');
  const imp = await owner.req('POST', '/api/owner/import', { csv, commit: true, give_default: true });
  assert.equal(imp.status, 200, JSON.stringify(imp.body));
  const priced = (await owner.req('GET', '/api/owner/products')).body.products.filter((p) => p.cost_price != null && p.sell_price != null);
  assert.ok(priced.length >= 30, 'products got prices');
  const costs = new Set(priced.map((p) => p.cost_price));

  const staff = new Client();
  // not logged in: no access
  for (const u of ['/api/staff/products?q=valve', '/api/staff/quotes']) assert.equal((await staff.req('GET', u)).status, 401, u);
  assert.equal((await staff.req('POST', '/api/staff/login', { name: 'Test Staff', pin: '0000' })).status, 401);
  assert.equal((await staff.req('POST', '/api/staff/login', { name: 'Test Staff', pin: '4321' })).status, 200);

  const responses = [];
  const keep = async (m, u, j) => {
    const r = await staff.req(m, u, j);
    responses.push([m + ' ' + u, r]);
    return r;
  };
  await keep('GET', '/api/staff/me');
  const s1 = await keep('GET', '/api/staff/products?q=' + encodeURIComponent(priced[0].name));
  assert.equal(s1.status, 200);
  assert.ok(s1.body.products.some((p) => p.sell_price != null), 'staff sees selling prices');
  await keep('GET', '/api/staff/products?q=');
  const made = await keep('POST', '/api/staff/quotes', {
    customer_name: 'Security Test', lines: [
      { product_id: priced[0].id, qty: 3 }, { product_id: priced[1].id, qty: 2 }, { product_id: null, description: 'Special item', qty: 1 },
    ],
  });
  assert.equal(made.status, 200, JSON.stringify(made.body));
  await keep('GET', '/api/staff/quotes');
  // price sent from the browser is ignored
  const fake = await keep('POST', '/api/staff/quotes', { lines: [{ product_id: priced[0].id, qty: 1, unit_sell: 0.01 }] });
  assert.equal(fake.body.quote.lines[0].unit_sell, priced[0].sell_price);

  for (const [what, r] of responses) {
    assert.ok(r.ct.includes('json'), what);
    assert.deepEqual(findForbidden(r.body), [], `${what} leaks a cost field`);
    const text = JSON.stringify(r.body);
    for (const c of costs) {
      // a cost value may only appear if it is also a selling price somewhere (cannot be told apart)
      if (priced.some((p) => p.sell_price === c)) continue;
      assert.ok(!new RegExp(`[:\\[,]${c}[,\\]}]`).test(text), `${what} contains cost value ${c}`);
    }
  }

  const pdf = await staff.req('GET', `/api/staff/quotes/${made.body.quote.id}/pdf`);
  assert.equal(pdf.status, 200);
  assert.ok(pdf.ct.includes('application/pdf'));

  // every owner route says no to staff
  const ownerRoutes = [
    ['GET', '/api/owner/products'], ['POST', '/api/owner/products', { name: 'x' }], ['PUT', `/api/owner/products/${priced[0].id}`, { cost_price: 1 }],
    ['DELETE', `/api/owner/products/${priced[0].id}`], ['POST', '/api/owner/products/bulk', { ids: [priced[0].id], markup_pct: 1 }],
    ['GET', '/api/owner/products/export'], ['POST', '/api/owner/import', { csv: 'name,cost_price\nx,1' }],
    ['GET', '/api/owner/quotes'], ['GET', `/api/owner/quotes/${made.body.quote.id}`], ['PUT', `/api/owner/quotes/${made.body.quote.id}`, { status: 'Won' }],
    ['GET', '/api/owner/settings'], ['PUT', '/api/owner/settings', { trn: 'x' }],
  ];
  for (const [m, u, j] of ownerRoutes) assert.equal((await staff.req(m, u, j)).status, 401, `staff got into ${m} ${u}`);
  const st = await staff.req('GET', '/api/owner/login');
  assert.equal(st.body.owner, false);

  // the owner does see cost and profit
  const oq = await owner.req('GET', `/api/owner/quotes/${made.body.quote.id}`);
  assert.ok(oq.body.quote.total_cost > 0 && 'profit' in oq.body.quote);
});
