import { HttpError, requireOwner } from '@/lib/auth';
import { body, num, route } from '@/lib/http';
import { db } from '@/lib/db';
import { toOwnerProduct, type ProductRow } from '@/lib/products';
import { roundUpHalf, sellFromMarkup } from '@/lib/money';

type Ctx = { params: Promise<{ id: string }> };

// edit a product. Send markup_pct -> sell price is worked out; send sell_price -> fixed price (markup worked out for display).
export const PUT = route(async (req: Request, ctx: Ctx) => {
  await requireOwner();
  const id = Number((await ctx.params).id);
  const b = await body<Record<string, unknown>>(req);
  const d = await db();
  const [cur] = (await d`select * from products where id = ${id}`) as unknown as ProductRow[];
  if (!cur) throw new HttpError(404, 'Product not found');
  const next = { ...cur };
  for (const k of ['name', 'size', 'material_spec', 'options', 'unit', 'category'] as const) if (k in b) next[k] = String(b[k] ?? '').trim();
  if ('aliases' in b) next.aliases = (Array.isArray(b.aliases) ? b.aliases.map(String) : String(b.aliases || '').split(';')).map((x) => x.trim()).filter(Boolean);
  if (!next.name) throw new HttpError(400, 'Name is needed.');
  if ('cost_price' in b) next.cost_price = num(b.cost_price);
  if ('markup_pct' in b) {
    next.markup_pct = num(b.markup_pct);
    if (next.markup_pct != null) next.sell_price = sellFromMarkup(next.cost_price, next.markup_pct);
  } else if ('sell_price' in b) {
    const s = num(b.sell_price);
    next.sell_price = s == null ? null : roundUpHalf(s);
    next.markup_pct = null;
  } else if ('cost_price' in b && next.markup_pct != null) {
    next.sell_price = sellFromMarkup(next.cost_price, next.markup_pct);
  }
  if (next.cost_price != null && next.cost_price < 0) throw new HttpError(400, 'Cost cannot be below 0.');
  const [p] = await d`update products set name = ${next.name}, aliases = ${next.aliases}, size = ${next.size}, material_spec = ${next.material_spec},
    options = ${next.options}, unit = ${next.unit}, category = ${next.category}, cost_price = ${next.cost_price}, markup_pct = ${next.markup_pct},
    sell_price = ${next.sell_price}, updated_at = now() where id = ${id} returning *`;
  return { product: toOwnerProduct(p as unknown as ProductRow) };
});

export const DELETE = route(async (_req: Request, ctx: Ctx) => {
  await requireOwner();
  const d = await db();
  await d`delete from products where id = ${Number((await ctx.params).id)}`;
  return { ok: true };
});
