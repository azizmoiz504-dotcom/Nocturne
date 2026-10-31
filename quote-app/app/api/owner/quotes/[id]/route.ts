import { HttpError, requireOwner } from '@/lib/auth';
import { body, num, route } from '@/lib/http';
import { db } from '@/lib/db';
import { computeQuote, getQuote, STATUSES, toOwnerQuote } from '@/lib/quotes';
import { round2, roundUpHalf, sellFromMarkup } from '@/lib/money';

type Ctx = { params: Promise<{ id: string }> };

export const GET = route(async (_req: Request, ctx: Ctx) => {
  await requireOwner();
  const q = await getQuote(Number((await ctx.params).id));
  if (!q) throw new HttpError(404, 'Quote not found');
  return { quote: toOwnerQuote(q) };
});

// Owner changes: status, line prices (by markup % or price), quantities, or "set subtotal to X"
export const PUT = route(async (req: Request, ctx: Ctx) => {
  await requireOwner();
  const id = Number((await ctx.params).id);
  const q = await getQuote(id);
  if (!q) throw new HttpError(404, 'Quote not found');
  const b = await body<{
    status?: string; lost_reason?: string; customer_name?: string; customer_company?: string;
    lines?: { markup_pct?: number | null; unit_sell?: number | null; qty?: number; remove?: boolean }[];
    set_subtotal?: number;
  }>(req);
  let lines = q.lines;
  if (Array.isArray(b.lines)) {
    lines = [];
    q.lines.forEach((l, i) => {
      const e = b.lines![i] || {};
      if (e.remove) return;
      const n = { ...l };
      const qty = num(e.qty);
      if (qty != null && qty > 0) n.qty = qty;
      if ('markup_pct' in e && num(e.markup_pct) != null && n.unit_cost != null) n.unit_sell = sellFromMarkup(n.unit_cost, num(e.markup_pct));
      else if ('unit_sell' in e) {
        const s = num(e.unit_sell);
        n.unit_sell = s == null ? null : roundUpHalf(s);
      }
      lines.push(n);
    });
    if (!lines.length) throw new HttpError(400, 'A quote needs at least one line.');
  }
  const target = num(b.set_subtotal);
  if (target != null) {
    const cur = computeQuote(lines).subtotal;
    if (!(cur > 0)) throw new HttpError(400, 'No priced lines to change.');
    const f = target / cur;
    lines = lines.map((l) => ({ ...l, unit_sell: l.unit_sell == null ? null : round2(l.unit_sell * f) }));
    // put any rounding difference on a line with qty 1, if there is one
    const diff = round2(target - computeQuote(lines).subtotal);
    const one = lines.find((l) => l.unit_sell != null && l.qty === 1);
    if (diff && one) one.unit_sell = round2(one.unit_sell! + diff);
  }
  const t = computeQuote(lines);
  const status = b.status && (STATUSES as readonly string[]).includes(b.status) ? b.status : q.status;
  const lost_reason = status === 'Lost' ? String(b.lost_reason ?? q.lost_reason ?? '').slice(0, 300) : '';
  const d = await db();
  await d`update quotes set lines = ${d.json(lines as never)}, subtotal = ${t.subtotal}, vat = ${t.vat}, grand_total = ${t.grand_total},
    total_cost = ${t.total_cost}, profit = ${t.profit}, margin_pct = ${t.margin_pct}, status = ${status}, lost_reason = ${lost_reason},
    customer_name = ${String(b.customer_name ?? q.customer_name).slice(0, 120)}, customer_company = ${String(b.customer_company ?? q.customer_company).slice(0, 120)},
    updated_at = now() where id = ${id}`;
  return { quote: toOwnerQuote((await getQuote(id))!) };
});
