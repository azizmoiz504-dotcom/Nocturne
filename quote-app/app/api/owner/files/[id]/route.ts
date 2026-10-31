import { HttpError, requireOwner } from '@/lib/auth';
import { route } from '@/lib/http';
import { getFile } from '@/lib/files';

// the customer's original photos/PDFs saved with a quote (owner only)
export const GET = route(async (_req: Request, ctx: { params: Promise<{ id: string }> }) => {
  await requireOwner();
  const f = await getFile((await ctx.params).id);
  if (!f) throw new HttpError(404, 'File not found');
  return new Response(new Uint8Array(f.data), { headers: { 'content-type': f.mime, 'content-disposition': `inline; filename="${encodeURIComponent(f.name)}"`, 'cache-control': 'private, no-store' } });
});
