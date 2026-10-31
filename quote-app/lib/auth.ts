import 'server-only';
import crypto from 'node:crypto';
import { cookies, headers } from 'next/headers';
import { db } from './db';
import { getSettingsRow } from './settings';

// Two separate logins:
//  - staff: shared PIN + their name, remembered on the device (cookie fq_staff)
//  - owner: OWNER_PASSWORD from the server settings (cookie fq_owner)
// Cookies are signed with a secret made on first start and kept in the database.

export type Staff = { role: 'staff' | 'owner'; name: string };

const b64 = (s: string) => Buffer.from(s).toString('base64url');
const unb64 = (s: string) => Buffer.from(s, 'base64url').toString();

function sign(secret: string, body: string) {
  return crypto.createHmac('sha256', secret).update(body).digest('base64url');
}

function makeToken(secret: string, data: object) {
  const body = b64(JSON.stringify(data));
  return body + '.' + sign(secret, body);
}

function readToken<T>(secret: string, token: string | undefined): T | null {
  if (!token) return null;
  const [body, sig] = token.split('.');
  if (!body || !sig) return null;
  const want = sign(secret, body);
  if (want.length !== sig.length || !crypto.timingSafeEqual(Buffer.from(want), Buffer.from(sig))) return null;
  try {
    const d = JSON.parse(unb64(body));
    if (typeof d.exp !== 'number' || d.exp < Date.now()) return null;
    return d as T;
  } catch {
    return null;
  }
}

export function hashPin(pin: string, salt = crypto.randomBytes(16).toString('hex')) {
  const h = crypto.scryptSync(pin, salt, 32).toString('hex');
  return salt + ':' + h;
}
export function checkPin(pin: string, stored: string) {
  const [salt, h] = (stored || '').split(':');
  if (!salt || !h) return false;
  const got = crypto.scryptSync(pin, salt, 32);
  const want = Buffer.from(h, 'hex');
  return got.length === want.length && crypto.timingSafeEqual(got, want);
}

const ownerPassword = () => process.env.OWNER_PASSWORD || '';
// changes when the owner password changes, so old owner logins stop working
const ownerVersion = () => crypto.createHash('sha256').update('v1:' + ownerPassword()).digest('hex').slice(0, 16);

function safeEqual(a: string, b: string) {
  const ha = crypto.createHash('sha256').update(a).digest();
  const hb = crypto.createHash('sha256').update(b).digest();
  return crypto.timingSafeEqual(ha, hb);
}

const DAY = 24 * 3600 * 1000;
const secure = process.env.NODE_ENV === 'production';

async function clientKey() {
  const h = await headers();
  return (h.get('x-forwarded-for') || '').split(',')[0].trim() || 'local';
}

// too many wrong PINs/passwords from one place = wait 15 minutes
async function tooManyFails(kind: string) {
  const d = await db();
  const who = await clientKey();
  const [{ n }] = await d`select count(*)::int as n from events where kind = ${kind} and who = ${who} and at > now() - interval '15 minutes'`;
  return n >= 8;
}
async function noteFail(kind: string) {
  const d = await db();
  await d`insert into events (kind, who) values (${kind}, ${await clientKey()})`;
}

export async function loginOwner(password: string): Promise<'ok' | 'wrong' | 'locked' | 'not_set'> {
  if (!ownerPassword()) return 'not_set';
  if (await tooManyFails('owner_fail')) return 'locked';
  if (!safeEqual(password, ownerPassword())) {
    await noteFail('owner_fail');
    return 'wrong';
  }
  const { secret } = await getSettingsRow();
  const c = await cookies();
  c.set('fq_owner', makeToken(secret, { r: 'owner', v: ownerVersion(), exp: Date.now() + 30 * DAY }), {
    httpOnly: true, sameSite: 'lax', secure, path: '/', maxAge: 30 * 24 * 3600,
  });
  return 'ok';
}

export async function loginStaff(name: string, pin: string): Promise<'ok' | 'wrong' | 'locked' | 'not_set' | 'bad_name'> {
  const { data, secret } = await getSettingsRow();
  if (!data.staff_pin_hash) return 'not_set';
  if (!data.staff_names.includes(name)) return 'bad_name';
  if (await tooManyFails('pin_fail')) return 'locked';
  if (!checkPin(pin, data.staff_pin_hash)) {
    await noteFail('pin_fail');
    return 'wrong';
  }
  const c = await cookies();
  c.set('fq_staff', makeToken(secret, { r: 'staff', n: name, v: data.staff_pin_version, exp: Date.now() + 180 * DAY }), {
    httpOnly: true, sameSite: 'lax', secure, path: '/', maxAge: 180 * 24 * 3600,
  });
  return 'ok';
}

export async function logout(which: 'owner' | 'staff') {
  const c = await cookies();
  c.delete(which === 'owner' ? 'fq_owner' : 'fq_staff');
}

export async function currentOwner(): Promise<boolean> {
  if (!ownerPassword()) return false;
  const c = await cookies();
  const { secret } = await getSettingsRow();
  const t = readToken<{ r: string; v: string }>(secret, c.get('fq_owner')?.value);
  return !!t && t.r === 'owner' && t.v === ownerVersion();
}

// staff pages accept a staff login, or the owner (who can also make quotes)
export async function currentStaff(): Promise<Staff | null> {
  const c = await cookies();
  const { secret, data } = await getSettingsRow();
  const t = readToken<{ r: string; n: string; v: number }>(secret, c.get('fq_staff')?.value);
  if (t && t.r === 'staff' && t.v === data.staff_pin_version && data.staff_names.includes(t.n)) return { role: 'staff', name: t.n };
  if (await currentOwner()) return { role: 'owner', name: 'Owner' };
  return null;
}

export class HttpError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}
export async function requireOwner() {
  if (!(await currentOwner())) throw new HttpError(401, 'Owner login needed');
}
export async function requireStaff(): Promise<Staff> {
  const s = await currentStaff();
  if (!s) throw new HttpError(401, 'Please log in with the staff PIN');
  return s;
}
