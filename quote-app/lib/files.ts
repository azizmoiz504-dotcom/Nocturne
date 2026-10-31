import 'server-only';
import crypto from 'node:crypto';
import { db } from './db';
import { getSettings } from './settings';

export async function saveFile(kind: string, name: string, mime: string, data: Buffer) {
  const d = await db();
  const id = crypto.randomUUID();
  await d`insert into files (id, kind, name, mime, data) values (${id}, ${kind}, ${name.slice(0, 200)}, ${mime}, ${data})`;
  return id;
}

export async function getFile(id: string): Promise<{ id: string; kind: string; name: string; mime: string; data: Buffer } | null> {
  if (!/^[0-9a-f-]{36}$/.test(id)) return null;
  const d = await db();
  const [f] = await d`select id, kind, name, mime, data from files where id = ${id}`;
  return (f as never) || null;
}

export async function getLogo() {
  const s = await getSettings();
  if (!s.logo_file_id) return null;
  const f = await getFile(s.logo_file_id);
  return f ? { mime: f.mime, data: f.data } : null;
}
