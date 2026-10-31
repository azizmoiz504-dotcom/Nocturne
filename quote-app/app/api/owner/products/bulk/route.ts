import { HttpError, requireOwner } from '@/lib/auth';
import { body, num, route } from '@/lib/http';
import { db } from '@/lib/db';

// "Set markup to X%" for many products at once. Sell price = cost + X%, rounded up to 0.50.
export const POST = route(async (req: Request) => {
  await requireOwner();
  const b = await body<{ ids?: number[]; markup_pct?: number }>(req);
  const ids = (b.ids || []).map(Number).filter((x) => x > 0);
  const m = num(b.markup_pct);
  if (!ids.length) throw new HttpError(400, 'No products selected.');
  if (m == null || m < -100 || m > 10000) throw new HttpError(400, 'Type a markup %.');
  const d = await db();
  const r = await d`update products set markup_pct = ${m},
      sell_price = case when cost_price is null then sell_price else ceil(round(cost_price * (1 + ${m}::numeric / 100), 2) * 2) / 2 end,
      updated_at = now()
    where id = any(${ids}::int[])`;
  const [{ nocost }] = await d`select count(*)::int as nocost from products where id = any(${ids}::int[]) and cost_price is null`;
  return { updated: r.count, without_cost: nocost };
});
