import { HttpError, requireStaff } from '@/lib/auth';
import { body, route } from '@/lib/http';
import { db } from '@/lib/db';
import { type InLine, buildLines, computeQuote, nextQuoteNo, toStaffQuote, type QuoteRow } from '@/lib/quotes';

// Staff: own recent quotes (no costs)
export const GET = route(async () => {
  const who = await requireStaff();
  const d = await db();
  const rows = (await d`select * from quotes where created_by = ${who.name} order by id desc limit 50`) as unknown as QuoteRow[];
  return { quotes: rows.map(toStaffQuote) };
});

// Staff: create a quote. Prices are always taken from the database, never from the browser.
export const POST = route(async (req: Request) => {
  const who = await requireStaff();
  const b = await body<{
    customer_name?: string; customer_company?: string; raw_input_text?: string;
    files?: { id: string; name: string; mime: string }[]; lines?: unknown[];
    notes?: { questions?: string[]; warnings?: string[]; suggested_addon?: string };
  }>(req);
  const inLines = (b.lines || []).slice(0, 300) as InLine[];
  if (!inLines.length) throw new HttpError(400, 'The quote has no lines.');
  const lines = await buildLines(inLines);
  const t = computeQuote(lines);
  const d = await db();
  const quote_no = await nextQuoteNo();
  const notes = {
    questions: (b.notes?.questions || []).slice(0, 3).map(String),
    warnings: (b.notes?.warnings || []).slice(0, 10).map(String),
    suggested_addon: String(b.notes?.suggested_addon || ''),
  };
  const files = (b.files || []).filter((f) => /^[0-9a-f-]{36}$/.test(f.id)).slice(0, 20);
  const [q] = await d`insert into quotes ${d({
    quote_no, created_by: who.name,
    customer_name: String(b.customer_name || '').slice(0, 120),
    customer_company: String(b.customer_company || '').slice(0, 120),
    raw_input_text: String(b.raw_input_text || '').slice(0, 20000),
    input_files: d.json(files as never), lines: d.json(lines as never), notes: d.json(notes as never),
    ...t,
  } as never)} returning *`;
  return { quote: toStaffQuote(q as unknown as QuoteRow) };
});
