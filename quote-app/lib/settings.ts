import 'server-only';
import { db, DEFAULT_SETTINGS, type Settings } from './db';

export async function getSettingsRow(): Promise<{ data: Settings; secret: string }> {
  const d = await db();
  const [row] = await d`select data, secret from settings where id = 1`;
  return { data: { ...DEFAULT_SETTINGS, ...(row.data as Partial<Settings>) }, secret: row.secret as string };
}

export async function getSettings(): Promise<Settings> {
  return (await getSettingsRow()).data;
}

export async function saveSettings(patch: Partial<Settings>) {
  const d = await db();
  const cur = await getSettings();
  const next = { ...cur, ...patch };
  await d`update settings set data = ${d.json(next as never)} where id = 1`;
  return next;
}

// what the staff page may know about the company (no PIN, no secrets)
export function publicCompany(s: Settings) {
  return {
    company_name: s.company_name,
    address: s.address,
    whatsapp: s.whatsapp,
    quote_validity_days: s.quote_validity_days,
    has_logo: true,
  };
}
