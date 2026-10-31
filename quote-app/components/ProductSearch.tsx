'use client';
import { useEffect, useRef, useState } from 'react';
import { api, money } from '@/lib/client/api';

export type StaffProduct = {
  id: number;
  name: string;
  size: string;
  material_spec: string;
  options: string;
  unit: string;
  category: string;
  sell_price: number | null;
};

// Full-screen search over the price list (name, other names, size, material). Shows selling prices only.
export default function ProductSearch({ initial, onPick, onClose }: { initial?: string; onPick: (p: StaffProduct) => void; onClose: () => void }) {
  const [q, setQ] = useState(initial || '');
  const [rows, setRows] = useState<StaffProduct[]>([]);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const box = useRef<HTMLInputElement>(null);

  useEffect(() => {
    box.current?.focus();
  }, []);
  useEffect(() => {
    let stop = false;
    const t = setTimeout(async () => {
      setBusy(true);
      try {
        const r = await api<{ products: StaffProduct[] }>('/api/staff/products?q=' + encodeURIComponent(q));
        if (!stop) { setRows(r.products); setErr(''); }
      } catch (e) {
        if (!stop) setErr((e as Error).message);
      } finally {
        if (!stop) setBusy(false);
      }
    }, 250);
    return () => { stop = true; clearTimeout(t); };
  }, [q]);

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-white">
      <div className="flex items-center gap-2 border-b p-3">
        <input
          ref={box}
          className="field text-lg"
          placeholder='Search: e.g. "gi elbow 1/2" or "ss ball valve 2"'
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
        <button className="btn btn-ghost" onClick={onClose}>Close</button>
      </div>
      <div className="flex-1 overflow-y-auto">
        {err && <p className="p-4 text-red-700">{err}</p>}
        {!err && !rows.length && !busy && <p className="p-6 text-center text-gray-500">Nothing found. Try fewer words.</p>}
        <ul className="divide-y">
          {rows.map((p) => (
            <li key={p.id}>
              <button className="flex w-full items-center gap-3 p-4 text-left hover:bg-gray-50" onClick={() => onPick(p)}>
                <div className="flex-1">
                  <div className="font-semibold">{p.name} <span className="text-navy">{p.size}</span></div>
                  <div className="text-sm text-gray-500">{[p.material_spec, p.category].filter(Boolean).join(' · ')}</div>
                </div>
                <div className="text-right num">
                  {p.sell_price != null ? (
                    <><div className="font-semibold">AED {money(p.sell_price)}</div><div className="text-xs text-gray-500">per {p.unit}</div></>
                  ) : (
                    <span className="rounded bg-amber-100 px-2 py-1 text-xs font-semibold text-amber-800">Price not set</span>
                  )}
                </div>
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
