import { requireOwner } from '@/lib/auth';
import { route } from '@/lib/http';
import { allProducts } from '@/lib/products';
import { toCsv } from '@/lib/csv';

// The full price list as a CSV file (open in Excel, fill cost_price, save as CSV, import again).
export const GET = route(async () => {
  await requireOwner();
  const rows = await allProducts();
  const csv = toCsv(
    ['name', 'aliases', 'size', 'material_spec', 'options', 'unit', 'category', 'cost_price', 'markup_pct', 'sell_price'],
    rows.map((r) => [r.name, r.aliases.join('; '), r.size, r.material_spec, r.options, r.unit, r.category, r.cost_price, r.markup_pct, r.sell_price]),
  );
  const day = new Date().toISOString().slice(0, 10);
  return new Response(csv, {
    headers: { 'content-type': 'text/csv; charset=utf-8', 'content-disposition': `attachment; filename="fakhri-price-list-${day}.csv"`, 'cache-control': 'no-store' },
  });
});
