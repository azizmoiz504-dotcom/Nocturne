import 'server-only';
import { NextResponse } from 'next/server';
import { HttpError } from './auth';

// Wraps a route: turns errors into short, plain JSON messages.
export function route<A extends unknown[]>(fn: (...args: A) => Promise<Response | unknown>) {
  return async (...args: A): Promise<Response> => {
    try {
      const out = await fn(...args);
      if (out instanceof Response) return out;
      return NextResponse.json(out ?? { ok: true }, { headers: { 'cache-control': 'no-store' } });
    } catch (e) {
      if (e instanceof HttpError) return NextResponse.json({ error: e.message }, { status: e.status });
      if (e instanceof Error && e.message === 'NO_DATABASE')
        return NextResponse.json({ error: 'The database is not connected yet (DATABASE_URL / POSTGRES_URL missing).' }, { status: 503 });
      console.error(e);
      return NextResponse.json({ error: 'Something went wrong on the server. Please try again.' }, { status: 500 });
    }
  };
}

export async function body<T = Record<string, unknown>>(req: Request): Promise<T> {
  try {
    return (await req.json()) as T;
  } catch {
    throw new HttpError(400, 'Bad request');
  }
}

export const num = (v: unknown): number | null => {
  if (v === null || v === undefined || v === '') return null;
  const n = typeof v === 'number' ? v : parseFloat(String(v).replace(/[, ]/g, '').replace(/^AED/i, ''));
  return isFinite(n) ? n : null;
};
