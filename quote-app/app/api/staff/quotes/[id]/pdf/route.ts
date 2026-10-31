import { HttpError, requireStaff } from '@/lib/auth';
import { route } from '@/lib/http';
import { getQuote, pdfFileName, toStaffQuote } from '@/lib/quotes';
import { getSettings } from '@/lib/settings';
import { getLogo } from '@/lib/files';
import { buildQuotePdf } from '@/lib/pdf';

// The customer PDF. Built from the staff view of the quote, so no cost can be printed.
export const GET = route(async (req: Request, ctx: { params: Promise<{ id: string }> }) => {
  const who = await requireStaff();
  const q = await getQuote(Number((await ctx.params).id));
  if (!q || (who.role !== 'owner' && q.created_by !== who.name)) throw new HttpError(404, 'Quote not found');
  const pdf = await buildQuotePdf(toStaffQuote(q), await getSettings(), await getLogo());
  const name = pdfFileName(q);
  const dl = new URL(req.url).searchParams.get('download') === '1';
  return new Response(new Uint8Array(pdf), {
    headers: {
      'content-type': 'application/pdf',
      'content-disposition': `${dl ? 'attachment' : 'inline'}; filename="${name}"`,
      'cache-control': 'no-store',
    },
  });
});
