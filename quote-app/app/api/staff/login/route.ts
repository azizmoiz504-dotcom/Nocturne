import { loginStaff, logout } from '@/lib/auth';
import { body, route } from '@/lib/http';
import { HttpError } from '@/lib/auth';

export const POST = route(async (req: Request) => {
  const b = await body<{ name?: string; pin?: string }>(req);
  const r = await loginStaff(String(b.name || ''), String(b.pin || ''));
  if (r === 'ok') return { ok: true };
  const msg = {
    wrong: 'Wrong PIN. Please try again.',
    locked: 'Too many wrong tries. Please wait 15 minutes.',
    not_set: 'The owner has not set a staff PIN yet (Owner page → Settings).',
    bad_name: 'Please pick your name from the list.',
  }[r];
  throw new HttpError(r === 'locked' ? 429 : 401, msg);
});

export const DELETE = route(async () => {
  await logout('staff');
  return { ok: true };
});
