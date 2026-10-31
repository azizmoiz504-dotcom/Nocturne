import { requireOwner } from '@/lib/auth';
import { route } from '@/lib/http';
import { db } from '@/lib/db';
import { toOwnerQuote, type QuoteRow } from '@/lib/quotes';

export const GET = route(async (req: Request) => {
  await requireOwner();
  const d = await db();
  const limit = Math.min(Number(new URL(req.url).searchParams.get('limit') || 500), 2000);
  const rows = (await d`select * from quotes order by id desc limit ${limit}`) as unknown as QuoteRow[];
  // this month (Dubai time)
  const [m] = await d`select count(*)::int as made, coalesce(sum(grand_total),0)::float8 as value,
      coalesce(sum(grand_total) filter (where status = 'Won'),0)::float8 as won_value,
      coalesce(sum(profit) filter (where status = 'Won'),0)::float8 as won_profit,
      count(*) filter (where status = 'Won')::int as won
    from quotes where date_trunc('month', created_at at time zone 'Asia/Dubai') = date_trunc('month', now() at time zone 'Asia/Dubai')`;
  return { quotes: rows.map(toOwnerQuote), month: m };
});
