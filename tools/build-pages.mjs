// Renders every page to static HTML. Run via `npm run build`.
import { mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { PRODUCTS } from '../src/data.js';
import home from '../src/templates/home.js';
import about from '../src/templates/about.js';
import products from '../src/templates/products.js';
import product from '../src/templates/product.js';
import pipeChart from '../src/templates/pipe-chart.js';
import contact from '../src/templates/contact.js';
import legal from '../src/templates/legal.js';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const out = (file, html) => {
  const p = join(root, file);
  mkdirSync(dirname(p), { recursive: true });
  writeFileSync(p, html);
};

out('index.html', home());
out('about.html', about());
out('products.html', products());
out('pipe-chart.html', pipeChart());
out('contact.html', contact());
out('legal.html', legal());
rmSync(join(root, 'products'), { recursive: true, force: true });
for (const p of PRODUCTS) out(`products/${p.slug}.html`, product(p));
console.log(`pages: 6 + ${PRODUCTS.length} product pages`);
