import { HttpError, hashPin, requireOwner } from '@/lib/auth';
import { body, num, route } from '@/lib/http';
import { getSettings, saveSettings } from '@/lib/settings';
import type { Settings } from '@/lib/db';
import { hasAiKey } from '@/lib/ai';

const view = (s: Settings) => {
  const { staff_pin_hash, ...rest } = s;
  return { ...rest, pin_set: !!staff_pin_hash, ai_ready: hasAiKey() };
};

export const GET = route(async () => {
  await requireOwner();
  return { settings: view(await getSettings()) };
});

export const PUT = route(async (req: Request) => {
  await requireOwner();
  const b = await body<Record<string, unknown>>(req);
  const cur = await getSettings();
  const patch: Partial<Settings> = {};
  for (const k of ['company_name', 'address', 'whatsapp', 'phone', 'email', 'trn', 'validity_note', 'payment_terms', 'delivery_note'] as const)
    if (k in b) patch[k] = String(b[k] ?? '').slice(0, 500);
  for (const k of ['default_markup_pct', 'min_margin_warning_pct', 'quote_validity_days'] as const)
    if (k in b) {
      const n = num(b[k]);
      if (n == null || n < 0) throw new HttpError(400, `"${k}" must be a number.`);
      patch[k] = n;
    }
  if ('staff_names' in b) {
    const names = (Array.isArray(b.staff_names) ? b.staff_names : String(b.staff_names || '').split(/\n|,/))
      .map((x) => String(x).trim()).filter(Boolean).slice(0, 50);
    patch.staff_names = [...new Set(names)];
  }
  if (b.new_staff_pin) {
    const pin = String(b.new_staff_pin).trim();
    if (!/^\d{4,8}$/.test(pin)) throw new HttpError(400, 'The staff PIN must be 4 to 8 digits.');
    patch.staff_pin_hash = hashPin(pin);
    patch.staff_pin_version = (cur.staff_pin_version || 0) + 1; // everyone logs in again with the new PIN
  }
  return { settings: view(await saveSettings(patch)) };
});
