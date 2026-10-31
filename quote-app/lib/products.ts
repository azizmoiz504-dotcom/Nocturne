import 'server-only';
import { db } from './db';
import { marginPct, markupFromSell, sellFromMarkup } from './money';

export type ProductRow = {
  id: number;
  name: string;
  aliases: string[];
  size: string;
  material_spec: string;
  options: string;
  unit: string;
  category: string;
  cost_price: number | null;
  markup_pct: number | null;
  sell_price: number | null;
  website_ref: string | null;
  updated_at: Date;
};

// ---- What the STAFF page may see. Built field by field: cost and markup are never copied. ----
export type StaffProduct = {
  id: number;
  name: string;
  size: string;
  material_spec: string;
  options: string;
  unit: string;
  category: string;
  sell_price: number | null;
};
export function toStaffProduct(p: ProductRow): StaffProduct {
  return {
    id: p.id,
    name: p.name,
    size: p.size,
    material_spec: p.material_spec,
    options: p.options,
    unit: p.unit,
    category: p.category,
    sell_price: p.sell_price,
  };
}

// ---- What the OWNER page sees ----
export function toOwnerProduct(p: ProductRow) {
  return {
    ...toStaffProduct(p),
    aliases: p.aliases,
    cost_price: p.cost_price,
    markup_pct: p.markup_pct ?? markupFromSell(p.cost_price, p.sell_price),
    markup_fixed: p.markup_pct != null,
    margin_pct: marginPct(p.cost_price, p.sell_price),
    updated_at: p.updated_at,
  };
}

const norm = (s: string) =>
  s
    .toLowerCase()
    .replace(/1\/8/g, '⅛').replace(/1\/4/g, '¼').replace(/3\/8/g, '⅜').replace(/1\/2/g, '½').replace(/3\/4/g, '¾')
    .replace(/(\d)[\s-]+([⅛¼⅜½¾])/g, '$1$2')
    .replace(/["”″]|inch(es)?\b/g, '"')
    .replace(/\s+/g, ' ')
    .trim();
// size in a plain form for comparing: 1-1/2" -> 1½, 4" x 3" -> 4x3, DN/mm text kept
export const canonSize = (s: string) =>
  norm(s).replace(/"/g, '').replace(/\s*[x×]\s*/g, 'x').replace(/\s+/g, '').replace(/^dn/, 'dn');

// search over name, aliases, size, material, category (every word must match somewhere)
export async function searchProducts(q: string, limit = 40): Promise<ProductRow[]> {
  const d = await db();
  const words = norm(q).split(' ').filter(Boolean).slice(0, 6);
  if (!words.length) return (await d`select * from products order by category, name, id limit ${limit}`) as unknown as ProductRow[];
  const hay = d`lower(name || ' ' || array_to_string(aliases, ' ') || ' ' || size || ' ' || material_spec || ' ' || category || ' ' || options)`;
  let cond = d`true`;
  for (const w of words) {
    const like = '%' + w.replace(/[%_\\]/g, '\\$&') + '%';
    // "s.s" and "ss" are the same; "1/2" and "½" too (norm above)
    const alt = '%' + w.replace(/\./g, '').replace(/[%_\\]/g, '\\$&') + '%';
    cond = d`${cond} and (${hay} like ${like} or replace(${hay}, '.', '') like ${alt})`;
  }
  return (await d`select * from products where ${cond} order by category, name, id limit ${limit}`) as unknown as ProductRow[];
}

export async function productsByIds(ids: number[]): Promise<Map<number, ProductRow>> {
  const d = await db();
  if (!ids.length) return new Map();
  const rows = (await d`select * from products where id = any(${ids}::int[])`) as unknown as ProductRow[];
  return new Map(rows.map((r) => [r.id, r]));
}

export async function allProducts(): Promise<ProductRow[]> {
  const d = await db();
  return (await d`select * from products order by category, name, id`) as unknown as ProductRow[];
}

// sell price for a product after its cost or markup changes
export function priceAfter(cost: number | null, markup: number | null, oldSell: number | null) {
  if (markup != null) return sellFromMarkup(cost, markup) ?? oldSell;
  return oldSell;
}
