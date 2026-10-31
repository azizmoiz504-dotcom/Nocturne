import 'server-only';
import { db } from './db';
import { marginPct, round2, totals } from './money';
import { HttpError } from './auth';
import { num } from './http';
import { productsByIds } from './products';

// One line as stored. unit_cost is the cost at the time of the quote (owner only).
export type StoredLine = {
  product_id: number | null;
  description: string;
  size: string;
  qty: number;
  unit: string;
  unit_sell: number | null; // null = price on request
  unit_cost: number | null;
  line_total: number | null;
};

export type QuoteRow = {
  id: number;
  quote_no: string;
  created_at: Date;
  created_by: string;
  customer_name: string;
  customer_company: string;
  raw_input_text: string;
  input_files: { id: string; name: string; mime: string }[];
  lines: StoredLine[];
  notes: { questions?: string[]; warnings?: string[]; suggested_addon?: string };
  subtotal: number;
  vat: number;
  grand_total: number;
  total_cost: number;
  profit: number;
  margin_pct: number | null;
  status: string;
  lost_reason: string;
  updated_at: Date;
};

export const STATUSES = ['Draft', 'Sent', 'Won', 'Lost'] as const;

// ---- What the STAFF page may see of a quote. Built field by field: no cost, profit or margin. ----
export function toStaffLine(l: StoredLine) {
  return {
    product_id: l.product_id,
    description: l.description,
    size: l.size,
    qty: l.qty,
    unit: l.unit,
    unit_sell: l.unit_sell,
    line_total: l.line_total,
  };
}
export function toStaffQuote(q: QuoteRow) {
  return {
    id: q.id,
    quote_no: q.quote_no,
    created_at: q.created_at,
    created_by: q.created_by,
    customer_name: q.customer_name,
    customer_company: q.customer_company,
    lines: q.lines.map(toStaffLine),
    subtotal: q.subtotal,
    vat: q.vat,
    grand_total: q.grand_total,
    status: q.status,
  };
}

// ---- Owner view ----
export function toOwnerQuote(q: QuoteRow) {
  return {
    ...toStaffQuote(q),
    raw_input_text: q.raw_input_text,
    input_files: q.input_files,
    notes: q.notes,
    lines: q.lines.map((l) => ({
      ...toStaffLine(l),
      unit_cost: l.unit_cost,
      line_cost: l.unit_cost != null ? round2(l.unit_cost * l.qty) : null,
      margin_pct: marginPct(l.unit_cost, l.unit_sell),
    })),
    total_cost: q.total_cost,
    profit: q.profit,
    margin_pct: q.margin_pct,
    lost_reason: q.lost_reason,
    updated_at: q.updated_at,
  };
}

// totals, cost and profit for a set of lines (priced lines only; "price on request" lines are not counted)
export function computeQuote(lines: StoredLine[]) {
  let sub = 0, cost = 0, priced = 0;
  for (const l of lines) {
    l.line_total = l.unit_sell != null ? round2(l.unit_sell * l.qty) : null;
    if (l.line_total != null) {
      sub += l.line_total;
      priced += l.line_total;
      if (l.unit_cost != null) cost += l.unit_cost * l.qty;
    }
  }
  const t = totals(sub);
  const total_cost = round2(cost);
  const profit = round2(t.subtotal - total_cost);
  return { ...t, total_cost, profit, margin_pct: priced > 0 ? marginPct(total_cost, t.subtotal) : null };
}

// Q-YYYYMMDD-01, -02 ... counted per day (Dubai time)
export async function nextQuoteNo(): Promise<string> {
  const d = await db();
  const dubai = new Date(Date.now() + 4 * 3600 * 1000);
  const day = dubai.toISOString().slice(0, 10).replace(/-/g, '');
  const [{ n }] = await d`insert into day_counter (day, n) values (${day}, 1)
    on conflict (day) do update set n = day_counter.n + 1 returning n`;
  return `Q-${day}-${String(n).padStart(2, '0')}`;
}

export async function getQuote(id: number): Promise<QuoteRow | null> {
  const d = await db();
  const [q] = await d`select * from quotes where id = ${id}`;
  return (q as unknown as QuoteRow) || null;
}

export function pdfFileName(q: { quote_no: string; customer_company: string; customer_name: string }) {
  const who = (q.customer_company || q.customer_name || 'Customer').replace(/[^A-Za-z0-9]+/g, '_').replace(/^_|_$/g, '').slice(0, 40) || 'Customer';
  return `Fakhri_Quote_${q.quote_no}_${who}.pdf`;
}

export type InLine = { product_id?: number | null; qty?: number; size?: string; description?: string; unit?: string };

// Lines from the staff page -> stored lines. Prices and cost come from the database only.
export async function buildLines(inLines: InLine[]): Promise<StoredLine[]> {
  const prods = await productsByIds(inLines.map((l) => Number(l.product_id)).filter((x) => x > 0));
  const lines: StoredLine[] = [];
  for (const l of inLines) {
    const qty = num(l.qty);
    if (qty == null || qty <= 0 || qty > 1e6) throw new HttpError(400, 'Every line needs a quantity above 0.');
    if (l.product_id) {
      const p = prods.get(Number(l.product_id));
      if (!p) throw new HttpError(400, 'An item was removed from the price list. Please pick it again.');
      if (p.sell_price == null) throw new HttpError(400, `"${p.name} ${p.size}" has no selling price yet. Ask the owner to set it.`);
      lines.push({
        product_id: p.id,
        description: p.name + (p.material_spec ? ' — ' + p.material_spec : ''),
        // only reducing items take a typed size (big end × small end); others keep the price-list size
        size: /× smaller$/.test(p.size) && l.size && !/× smaller$/.test(String(l.size)) ? String(l.size).slice(0, 60) : p.size,
        qty, unit: p.unit,
        unit_sell: p.sell_price, unit_cost: p.cost_price, line_total: null,
      });
    } else {
      const desc = String(l.description || '').trim().slice(0, 300);
      if (!desc) throw new HttpError(400, 'A "price on request" line needs a description.');
      lines.push({ product_id: null, description: desc, size: String(l.size || '').slice(0, 60), qty, unit: String(l.unit || 'pc').slice(0, 12), unit_sell: null, unit_cost: null, line_total: null });
    }
  }
  return lines;
}
