'use client';
// small fetch helper for the pages: throws the server's plain message on errors
export async function api<T = any>(url: string, opts: RequestInit & { json?: unknown } = {}): Promise<T> {
  const init: RequestInit = { ...opts, credentials: 'same-origin' };
  if (opts.json !== undefined) {
    init.body = JSON.stringify(opts.json);
    init.headers = { 'content-type': 'application/json', ...(opts.headers || {}) };
  }
  const r = await fetch(url, init);
  const ct = r.headers.get('content-type') || '';
  const data = ct.includes('json') ? await r.json() : null;
  if (!r.ok) {
    const e = new Error((data && data.error) || `Error ${r.status}`) as Error & { status: number };
    e.status = r.status;
    throw e;
  }
  return data as T;
}

export function registerSW(scope: string) {
  if (typeof navigator !== 'undefined' && 'serviceWorker' in navigator) {
    navigator.serviceWorker.register('/sw.js', { scope }).catch(() => {});
  }
}

export const money = (x: number | null | undefined) =>
  x == null ? '' : x.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
