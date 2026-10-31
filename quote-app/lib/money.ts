// Price maths, shared by the server and the owner page.
export const VAT_RATE = 0.05;

export const round2 = (x: number) => Math.round((x + Number.EPSILON) * 100) / 100;

// selling prices are rounded UP to the nearest 0.50 AED
export const roundUpHalf = (x: number) => Math.ceil(round2(x) * 2 - 1e-9) / 2;

export function sellFromMarkup(cost: number | null | undefined, markupPct: number | null | undefined): number | null {
  if (cost == null || markupPct == null || !isFinite(cost) || !isFinite(markupPct)) return null;
  return roundUpHalf(cost * (1 + markupPct / 100));
}

export function markupFromSell(cost: number | null | undefined, sell: number | null | undefined): number | null {
  if (cost == null || sell == null || !(cost > 0)) return null;
  return round2((sell / cost - 1) * 100);
}

export function marginPct(cost: number | null | undefined, sell: number | null | undefined): number | null {
  if (cost == null || sell == null || !(sell > 0)) return null;
  return round2(((sell - cost) / sell) * 100);
}

export function totals(subtotal: number) {
  const s = round2(subtotal);
  const vat = round2(s * VAT_RATE);
  return { subtotal: s, vat, grand_total: round2(s + vat) };
}

export const aed = (x: number | null | undefined) =>
  x == null ? '' : x.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
