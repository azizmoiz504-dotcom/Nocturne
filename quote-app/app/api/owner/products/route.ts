import { HttpError, requireOwner } from '@/lib/auth';
import { body, num, route } from '@/lib/http';
import { db } from '@/lib/db';
import { allProducts, toOwnerProduct, type ProductRow } from '@/lib/products';
import { sellFromMarkup } from '@/lib/money';
import { getSettings } from '@/lib/settings';

export const GET = route(async () => {
  await requireOwner();
  const s = await getSettings();
  return {
    products: (await allProducts()).map(toOwnerProduct),
    default_markup_pct: s.default_markup_pct,
    min_margin_warning_pct: s.min_margin_warning_pct,
  };
});

// add a product
export const POST = route(async (req: Request) => {
  await requireOwner();
  const b = await body<Record<string, unknown>>(req);
  const name = String(b.name || '').trim();
  if (!name) throw new HttpError(400, 'Name is needed.');
  const cost = num(b.cost_price);
  const markup = num(b.markup_pct);
  const sell = markup != null ? sellFromMarkup(cost, markup) : num(b.sell_price);
  const d = await db();
  const [p] = await d`insert into products ${d({
    name,
    aliases: String(b.aliases || '').split(';').map((x) => x.trim()).filter(Boolean),
    size: String(b.size || '').trim(),
    material_spec: String(b.material_spec || '').trim(),
    options: String(b.options || '').trim(),
    unit: String(b.unit || 'pc').trim() || 'pc',
    category: String(b.category || '').trim(),
    cost_price: cost, markup_pct: markup, sell_price: sell,
  } as never)} returning *`;
  return { product: toOwnerProduct(p as unknown as ProductRow) };
});
