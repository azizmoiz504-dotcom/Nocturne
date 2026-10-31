import { HttpError, requireOwner } from '@/lib/auth';
import { body, num, route } from '@/lib/http';
import { db } from '@/lib/db';
import { parseCsv } from '@/lib/csv';
import { allProducts, type ProductRow } from '@/lib/products';
import { roundUpHalf, sellFromMarkup } from '@/lib/money';
import { getSettings } from '@/lib/settings';

// Import cost prices from a CSV file.
// Columns: name, aliases, size, material_spec, unit, category, cost_price (also accepted: markup_pct, sell_price, options).
// A row matches an existing product by name + size (+ material_spec when given). preview = nothing is saved.
const key = (...a: string[]) => a.map((x) => (x || '').trim().toLowerCase().replace(/\s+/g, ' ')).join('|');

export const POST = route(async (req: Request) => {
  await requireOwner();
  const b = await body<{ csv?: string; commit?: boolean; give_default?: boolean }>(req);
  const rows = parseCsv(String(b.csv || ''));
  if (!rows.length) throw new HttpError(400, 'The file is empty.');
  if (!('name' in rows[0]) || !('cost_price' in rows[0])) throw new HttpError(400, 'The file needs at least the columns "name" and "cost_price" in the first row.');
  if (rows.length > 50000) throw new HttpError(400, 'Too many rows (max 50,000).');
  const hasMat = 'material_spec' in rows[0];
  const settings = await getSettings();
  const existing = await allProducts();
  const byFull = new Map<string, ProductRow[]>();
  const byNameSize = new Map<string, ProductRow[]>();
  for (const p of existing) {
    const a = key(p.name, p.size, p.material_spec), c = key(p.name, p.size);
    byFull.set(a, [...(byFull.get(a) || []), p]);
    byNameSize.set(c, [...(byNameSize.get(c) || []), p]);
  }

  type Plan = { action: 'new' | 'update' | 'same' | 'error'; line: number; name: string; size: string; material_spec: string; old_cost: number | null; new_cost: number | null; note?: string; id?: number; row: Record<string, string> };
  const plans: Plan[] = [];
  const seen = new Set<number>();
  rows.forEach((r, i) => {
    const line = i + 2;
    const name = (r.name || '').trim();
    const base = { line, name, size: r.size || '', material_spec: r.material_spec || '', row: r };
    if (!name) return plans.push({ ...base, action: 'error', old_cost: null, new_cost: null, note: 'No name' });
    const cost = num(r.cost_price);
    if ((r.cost_price || '').trim() && cost == null) return plans.push({ ...base, action: 'error', old_cost: null, new_cost: null, note: `Cost "${r.cost_price}" is not a number` });
    if (cost != null && cost < 0) return plans.push({ ...base, action: 'error', old_cost: null, new_cost: cost, note: 'Cost below 0' });
    let match = hasMat ? byFull.get(key(name, r.size || '', r.material_spec || '')) : undefined;
    if (!match?.length) {
      const ns = byNameSize.get(key(name, r.size || ''));
      if (ns && ns.length === 1) match = ns;
      else if (ns && ns.length > 1 && !hasMat) return plans.push({ ...base, action: 'error', old_cost: null, new_cost: cost, note: 'Several products have this name and size: add the material_spec column' });
    }
    const p = match?.[0];
    if (p) {
      if (seen.has(p.id)) return plans.push({ ...base, action: 'error', old_cost: p.cost_price, new_cost: cost, note: 'Same product twice in the file' });
      seen.add(p.id);
      const changed = (cost != null && cost !== p.cost_price) || ((r.markup_pct || '').trim() && num(r.markup_pct) !== p.markup_pct);
      plans.push({ ...base, action: changed ? 'update' : 'same', old_cost: p.cost_price, new_cost: cost ?? p.cost_price, id: p.id });
    } else plans.push({ ...base, action: 'new', old_cost: null, new_cost: cost });
  });

  const count = (a: Plan['action']) => plans.filter((p) => p.action === a).length;
  const summary = { rows: rows.length, new: count('new'), update: count('update'), same: count('same'), error: count('error') };
  const show = plans.filter((p) => p.action !== 'same').slice(0, 400).map(({ row: _r, ...p }) => p);

  if (!b.commit) return { summary, changes: show };

  const d = await db();
  const def = b.give_default ? settings.default_markup_pct : null;
  await d.begin(async (t) => {
    for (const p of plans) {
      const r = p.row;
      const cost = num(r.cost_price);
      const mk = num(r.markup_pct);
      const sellIn = num(r.sell_price);
      if (p.action === 'update' && p.id) {
        const cur = existing.find((x) => x.id === p.id)!;
        const newCost = cost ?? cur.cost_price;
        let markup = mk ?? cur.markup_pct;
        let sell = cur.sell_price;
        if (markup == null && sell == null && def != null && newCost != null) markup = def;
        if (markup != null) sell = sellFromMarkup(newCost, markup);
        await t`update products set cost_price = ${newCost}, markup_pct = ${markup}, sell_price = ${sell},
          unit = ${(r.unit || '').trim() || cur.unit}, category = ${(r.category || '').trim() || cur.category}, updated_at = now() where id = ${p.id}`;
      } else if (p.action === 'new') {
        let markup = mk;
        let sell = markup == null && sellIn != null ? roundUpHalf(sellIn) : null;
        if (markup == null && sell == null && def != null && cost != null) markup = def;
        if (markup != null) sell = sellFromMarkup(cost, markup);
        await t`insert into products ${t({
          name: p.name, aliases: (r.aliases || '').split(';').map((x) => x.trim()).filter(Boolean), size: (r.size || '').trim(),
          material_spec: (r.material_spec || '').trim(), options: (r.options || '').trim(), unit: (r.unit || '').trim() || 'pc',
          category: (r.category || '').trim(), cost_price: cost, markup_pct: markup, sell_price: sell,
        } as never)}`;
      } else if (p.action === 'same' && def != null && p.id) {
        const cur = existing.find((x) => x.id === p.id)!;
        if (cur.markup_pct == null && cur.sell_price == null && cur.cost_price != null)
          await t`update products set markup_pct = ${def}, sell_price = ${sellFromMarkup(cur.cost_price, def)}, updated_at = now() where id = ${p.id}`;
      }
    }
  });
  return { summary, saved: true };
});
