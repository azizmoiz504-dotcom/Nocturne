import { HttpError, requireStaff } from '@/lib/auth';
import { route } from '@/lib/http';
import { db } from '@/lib/db';
import { matchRequest, hasAiKey, type AiFile } from '@/lib/ai';
import { productsByIds, toStaffProduct } from '@/lib/products';
import { saveFile } from '@/lib/files';

export const maxDuration = 120;

const PER_PERSON_PER_HOUR = Number(process.env.AI_LIMIT_PER_HOUR || 30);
const ALL_PER_DAY = Number(process.env.AI_LIMIT_PER_DAY || 300);
const MAX_BYTES = 4 * 1024 * 1024; // the hosting limit is 4.5 MB per request

// Reads the customer's request with the AI, then adds SELLING prices from the database.
export const POST = route(async (req: Request) => {
  const who = await requireStaff();
  if (!hasAiKey()) throw new HttpError(503, 'The AI key is not set up yet (ANTHROPIC_API_KEY). Ask the owner.');

  const d = await db();
  const [{ mine }] = await d`select count(*)::int as mine from events where kind = 'ai' and who = ${who.name} and at > now() - interval '1 hour'`;
  const [{ all }] = await d`select count(*)::int as "all" from events where kind = 'ai' and at > now() - interval '1 day'`;
  if (mine >= PER_PERSON_PER_HOUR) throw new HttpError(429, `You made ${mine} AI requests in the last hour. Please wait a little.`);
  if (all >= ALL_PER_DAY) throw new HttpError(429, 'The daily AI limit is reached. It resets within 24 hours. Ask the owner if this keeps happening.');

  const form = await req.formData();
  const text = String(form.get('text') || '').slice(0, 20000);
  const files: AiFile[] = [];
  let total = 0;
  for (const v of form.getAll('files')) {
    if (typeof v === 'string') continue;
    const mime = v.type || 'application/octet-stream';
    if (!/^image\/(jpeg|png|webp|gif)$|^application\/pdf$/.test(mime)) throw new HttpError(400, `"${v.name}" is not a photo or PDF.`);
    const data = Buffer.from(await v.arrayBuffer());
    total += data.length;
    if (total > MAX_BYTES) throw new HttpError(413, 'The files are too big together (max 4 MB). Send fewer photos or a smaller PDF.');
    files.push({ mime, data, name: v.name || 'file' });
  }
  if (!text.trim() && !files.length) throw new HttpError(400, 'Paste the request or add a photo/PDF first.');

  await d`insert into events (kind, who) values ('ai', ${who.name})`;
  let r;
  try {
    r = await matchRequest(text, files);
  } catch (e) {
    console.error(e);
    const m = e instanceof Error ? e.message : '';
    if (m === 'AI_REFUSED') throw new HttpError(422, 'The AI could not read this request. Please type the items instead.');
    throw new HttpError(502, 'The AI did not answer properly. Please try again in a moment.');
  }

  const fileRefs = [];
  for (const f of files) fileRefs.push({ id: await saveFile('input', f.name, f.mime, f.data), name: f.name, mime: f.mime });

  const prods = await productsByIds(r.lines.map((l) => l.product_id));
  return {
    lines: r.lines.map((l) => ({
      product: toStaffProduct(prods.get(l.product_id)!),
      size: l.size_shown,
      qty: l.qty,
      customer_wording: l.customer_wording,
      confidence: l.confidence,
    })),
    unmatched: r.unmatched,
    questions: r.questions,
    warnings: r.warnings,
    suggested_addon: r.suggested_addon,
    files: fileRefs,
  };
});
