import { currentOwner, HttpError, loginOwner, logout } from '@/lib/auth';
import { body, route } from '@/lib/http';

export const GET = route(async () => ({ owner: await currentOwner(), password_set: !!process.env.OWNER_PASSWORD }));

export const POST = route(async (req: Request) => {
  const b = await body<{ password?: string }>(req);
  const r = await loginOwner(String(b.password || ''));
  if (r === 'ok') return { ok: true };
  const msg = {
    wrong: 'Wrong password.',
    locked: 'Too many wrong tries. Please wait 15 minutes.',
    not_set: 'The owner password is not set on the server yet (OWNER_PASSWORD in Vercel).',
  }[r];
  throw new HttpError(r === 'locked' ? 429 : 401, msg);
});

export const DELETE = route(async () => {
  await logout('owner');
  return { ok: true };
});
