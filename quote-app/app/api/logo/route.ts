import fs from 'node:fs';
import path from 'node:path';
import { getLogo } from '@/lib/files';

// The company logo (shown on both pages and printed on the PDF).
export async function GET() {
  let logo: { mime: string; data: Buffer } | null = null;
  try { logo = await getLogo(); } catch { logo = null; }
  const data = logo?.data ?? fs.readFileSync(path.join(process.cwd(), 'public/logo.png'));
  return new Response(new Uint8Array(data), { headers: { 'content-type': logo?.mime ?? 'image/png', 'cache-control': 'public, max-age=300' } });
}
