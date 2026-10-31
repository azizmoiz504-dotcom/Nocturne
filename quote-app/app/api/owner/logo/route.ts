import { HttpError, requireOwner } from '@/lib/auth';
import { route } from '@/lib/http';
import { saveFile } from '@/lib/files';
import { saveSettings } from '@/lib/settings';

export const POST = route(async (req: Request) => {
  await requireOwner();
  const form = await req.formData();
  const f = form.get('logo');
  if (!f || typeof f === 'string') throw new HttpError(400, 'Pick a logo file.');
  if (!/^image\/(png|jpeg)$/.test(f.type)) throw new HttpError(400, 'The logo must be a PNG or JPG picture.');
  const data = Buffer.from(await f.arrayBuffer());
  if (data.length > 2 * 1024 * 1024) throw new HttpError(400, 'The logo is too big (max 2 MB).');
  const id = await saveFile('logo', f.name, f.type, data);
  await saveSettings({ logo_file_id: id });
  return { ok: true };
});

export const DELETE = route(async () => {
  await requireOwner();
  await saveSettings({ logo_file_id: '' });
  return { ok: true };
});
