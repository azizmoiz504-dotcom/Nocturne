'use client';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { api, money, registerSW } from '@/lib/client/api';
import { marginPct, markupFromSell, roundUpHalf, sellFromMarkup } from '@/lib/money';

type Product = {
  id: number; name: string; aliases: string[]; size: string; material_spec: string; options: string; unit: string; category: string;
  cost_price: number | null; markup_pct: number | null; markup_fixed: boolean; sell_price: number | null; margin_pct: number | null; updated_at: string;
};

export default function OwnerApp() {
  const [state, setState] = useState<{ owner: boolean; password_set: boolean } | null>(null);
  const [err, setErr] = useState('');
  const load = useCallback(() => {
    api('/api/owner/login').then(setState).catch((e) => setErr(e.message));
  }, []);
  useEffect(() => {
    load();
    registerSW('/owner');
  }, [load]);
  if (err) return <Wrap><p className="card p-6 text-red-700">{err}</p></Wrap>;
  if (!state) return <Wrap><p className="p-6 text-center text-gray-500">Loading…</p></Wrap>;
  if (!state.owner) return <Wrap><Login set={state.password_set} onDone={load} /></Wrap>;
  return <Main onLogout={load} />;
}

function Wrap({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto max-w-md p-4 pt-10">
      <img src="/api/logo" alt="Fakhri Tools" className="mx-auto mb-8 h-10 w-auto" />
      {children}
    </div>
  );
}

function Login({ set, onDone }: { set: boolean; onDone: () => void }) {
  const [pw, setPw] = useState('');
  const [msg, setMsg] = useState('');
  if (!set) return <p className="card p-6">The owner password is not set yet. Add <b>OWNER_PASSWORD</b> in Vercel → Settings → Environment Variables, then redeploy.</p>;
  const go = async () => {
    setMsg('');
    try {
      await api('/api/owner/login', { method: 'POST', json: { password: pw } });
      onDone();
    } catch (e) {
      setMsg((e as Error).message);
    }
  };
  return (
    <div className="card p-6">
      <h1 className="mb-4 text-xl font-bold">Owner login</h1>
      <input className="field mb-3" type="password" autoComplete="current-password" placeholder="Password" value={pw} onChange={(e) => setPw(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && go()} />
      {msg && <p className="mb-3 font-semibold text-red-700">{msg}</p>}
      <button className="btn btn-navy w-full" onClick={go} disabled={!pw}>Log in</button>
    </div>
  );
}

function Main({ onLogout }: { onLogout: () => void }) {
  const [tab, setTab] = useState<'prices' | 'quotes' | 'settings'>('prices');
  const logout = async () => {
    await api('/api/owner/login', { method: 'DELETE' });
    onLogout();
  };
  return (
    <div className="mx-auto max-w-[1400px] px-3 pb-24 pt-3 sm:px-5">
      <header className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <img src="/api/logo" alt="Fakhri Tools" className="h-9 w-auto" />
          <span className="rounded bg-navy px-2 py-0.5 text-xs font-bold text-white">OWNER</span>
        </div>
        <nav className="flex gap-1">
          {(['prices', 'quotes', 'settings'] as const).map((t) => (
            <button key={t} className={'tab capitalize ' + (tab === t ? 'tab-on' : '')} onClick={() => setTab(t)}>{t}</button>
          ))}
          <button className="btn btn-ghost btn-sm ml-2" onClick={logout}>Log out</button>
        </nav>
      </header>
      {tab === 'prices' && <Prices />}
      {tab === 'quotes' && <Quotes />}
      {tab === 'settings' && <SettingsTab />}
    </div>
  );
}

/* ============================ PRICES ============================ */

const STATUS_FILTERS = {
  all: 'All items',
  noprice: '⚪ No sell price',
  nocost: 'No cost price',
  below: '🔴 Sell below cost',
  low: '🟠 Margin below warning',
} as const;

function Prices() {
  const [rows, setRows] = useState<Product[] | null>(null);
  const [cfg, setCfg] = useState({ default_markup_pct: 15, min_margin_warning_pct: 8 });
  const [q, setQ] = useState('');
  const [cat, setCat] = useState('');
  const [st, setSt] = useState<keyof typeof STATUS_FILTERS>('all');
  const [shown, setShown] = useState(100);
  const [sel, setSel] = useState<Set<number>>(new Set());
  const [bulk, setBulk] = useState('');
  const [msg, setMsg] = useState('');
  const [importing, setImporting] = useState(false);
  const [editing, setEditing] = useState<Product | 'new' | null>(null);

  const load = useCallback(async () => {
    const r = await api<{ products: Product[]; default_markup_pct: number; min_margin_warning_pct: number }>('/api/owner/products');
    setRows(r.products);
    setCfg({ default_markup_pct: r.default_markup_pct, min_margin_warning_pct: r.min_margin_warning_pct });
    setBulk((b) => b || String(r.default_markup_pct));
  }, []);
  useEffect(() => {
    load().catch((e) => setMsg(e.message));
  }, [load]);

  const cats = useMemo(() => [...new Set((rows || []).map((r) => r.category))].sort(), [rows]);
  const filtered = useMemo(() => {
    const words = q.toLowerCase().replace(/1\/2/g, '½').replace(/1\/4/g, '¼').replace(/3\/4/g, '¾').split(/\s+/).filter(Boolean);
    return (rows || []).filter((r) => {
      if (cat && r.category !== cat) return false;
      const m = marginPct(r.cost_price, r.sell_price);
      if (st === 'noprice' && r.sell_price != null) return false;
      if (st === 'nocost' && r.cost_price != null) return false;
      if (st === 'below' && !(r.cost_price != null && r.sell_price != null && r.sell_price < r.cost_price)) return false;
      if (st === 'low' && !(m != null && m < cfg.min_margin_warning_pct)) return false;
      if (words.length) {
        const hay = (r.name + ' ' + r.aliases.join(' ') + ' ' + r.size + ' ' + r.material_spec + ' ' + r.category).toLowerCase();
        const hay2 = hay.replace(/\./g, '');
        if (!words.every((w) => hay.includes(w) || hay2.includes(w.replace(/\./g, '')))) return false;
      }
      return true;
    });
  }, [rows, q, cat, st, cfg.min_margin_warning_pct]);

  const counts = useMemo(() => {
    const r = rows || [];
    return {
      total: r.length,
      noprice: r.filter((x) => x.sell_price == null).length,
      nocost: r.filter((x) => x.cost_price == null).length,
    };
  }, [rows]);

  const save = async (id: number, patch: Record<string, unknown>) => {
    try {
      const r = await api<{ product: Product }>(`/api/owner/products/${id}`, { method: 'PUT', json: patch });
      setRows((rs) => (rs || []).map((x) => (x.id === id ? r.product : x)));
    } catch (e) {
      setMsg((e as Error).message);
    }
  };

  const applyBulk = async (ids: number[]) => {
    const m = parseFloat(bulk);
    if (!isFinite(m)) return setMsg('Type a markup % first.');
    if (!confirm(`Set markup to ${m}% for ${ids.length} item(s)? Their sell prices will be recalculated from cost.`)) return;
    try {
      const r = await api<{ updated: number; without_cost: number }>('/api/owner/products/bulk', { method: 'POST', json: { ids, markup_pct: m } });
      setMsg(`Markup ${m}% set on ${r.updated} item(s).` + (r.without_cost ? ` ${r.without_cost} of them have no cost price yet, so they still have no sell price.` : ''));
      setSel(new Set());
      await load();
    } catch (e) {
      setMsg((e as Error).message);
    }
  };

  if (!rows) return <p className="p-6 text-center text-gray-500">{msg || 'Loading the price list…'}</p>;
  const page = filtered.slice(0, shown);
  const allSel = page.length > 0 && page.every((r) => sel.has(r.id));

  return (
    <div className="space-y-3">
      {importing && <ImportCsv defaultMarkup={cfg.default_markup_pct} onClose={() => setImporting(false)} onSaved={() => { setImporting(false); load(); }} />}
      {editing && <EditProduct p={editing} cats={cats} onClose={() => setEditing(null)} onSaved={() => { setEditing(null); load(); }} />}

      <div className="flex flex-wrap items-center gap-2 text-sm">
        <span className="rounded-full bg-white px-3 py-1 shadow-sm">{counts.total.toLocaleString()} items</span>
        <span className="rounded-full bg-white px-3 py-1 shadow-sm">{counts.nocost.toLocaleString()} without cost</span>
        <span className="rounded-full bg-white px-3 py-1 shadow-sm">{counts.noprice.toLocaleString()} without sell price</span>
        <div className="ml-auto flex flex-wrap gap-2">
          <button className="btn btn-navy btn-sm" onClick={() => setImporting(true)}>Import cost prices (CSV)</button>
          <a className="btn btn-ghost btn-sm" href="/api/owner/products/export">Download price list (CSV)</a>
          <button className="btn btn-ghost btn-sm" onClick={() => setEditing('new')}>+ Add product</button>
        </div>
      </div>

      {msg && (
        <div className="card flex items-start justify-between gap-3 border-l-4 border-navy p-3">
          <span>{msg}</span>
          <button className="text-gray-500" onClick={() => setMsg('')}>✕</button>
        </div>
      )}

      <div className="card grid gap-2 p-3 sm:grid-cols-[2fr_1fr_1fr]">
        <input className="field" placeholder="Search item, size, material…" value={q} onChange={(e) => { setQ(e.target.value); setShown(100); }} />
        <select className="field" value={cat} onChange={(e) => { setCat(e.target.value); setShown(100); }}>
          <option value="">All categories</option>
          {cats.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
        <select className="field" value={st} onChange={(e) => { setSt(e.target.value as keyof typeof STATUS_FILTERS); setShown(100); }}>
          {Object.entries(STATUS_FILTERS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
      </div>

      <div className="card flex flex-wrap items-center gap-2 p-3">
        <span className="font-semibold">Bulk set markup</span>
        <input className="field w-24 py-1.5 text-center" inputMode="decimal" value={bulk} onChange={(e) => setBulk(e.target.value)} />
        <span>%</span>
        <button className="btn btn-ghost btn-sm" disabled={!sel.size} onClick={() => applyBulk([...sel])}>for {sel.size} selected</button>
        <button className="btn btn-ghost btn-sm" disabled={!filtered.length} onClick={() => applyBulk(filtered.map((r) => r.id))}>
          for all {filtered.length.toLocaleString()} shown{cat ? ` in ${cat}` : ''}
        </button>
        <span className="text-sm text-gray-500">Sell prices are rounded up to the nearest 0.50 AED.</span>
      </div>

      <div className="card overflow-x-auto">
        <table className="w-full min-w-[980px] text-sm">
          <thead className="bg-gray-50 text-left text-xs uppercase tracking-wide text-gray-500">
            <tr>
              <th className="p-2"><input type="checkbox" checked={allSel} onChange={() => { const s = new Set(sel); page.forEach((r) => (allSel ? s.delete(r.id) : s.add(r.id))); setSel(s); }} /></th>
              <th className="p-2">Item</th><th className="p-2">Size</th><th className="p-2">Category</th>
              <th className="p-2 text-right">Cost</th><th className="p-2 text-right">Markup %</th><th className="p-2 text-right">Sell price</th>
              <th className="p-2 text-right">Margin %</th><th className="p-2">Updated</th><th className="p-2"></th>
            </tr>
          </thead>
          <tbody>
            {page.map((r) => (
              <PriceRow key={r.id} r={r} warn={cfg.min_margin_warning_pct} checked={sel.has(r.id)}
                onCheck={() => { const s = new Set(sel); if (s.has(r.id)) s.delete(r.id); else s.add(r.id); setSel(s); }}
                onSave={(patch) => save(r.id, patch)} onEdit={() => setEditing(r)} />
            ))}
          </tbody>
        </table>
        {!filtered.length && <p className="p-6 text-center text-gray-500">No items match.</p>}
      </div>
      {filtered.length > shown && (
        <button className="btn btn-ghost w-full" onClick={() => setShown(shown + 200)}>Show more ({(filtered.length - shown).toLocaleString()} left)</button>
      )}
    </div>
  );
}

function NumIn({ value, onCommit, placeholder, w = 'w-24' }: { value: number | null; onCommit: (v: number | null) => void; placeholder?: string; w?: string }) {
  const [v, setV] = useState(value == null ? '' : String(value));
  useEffect(() => setV(value == null ? '' : String(value)), [value]);
  const commit = () => {
    const n = v.trim() === '' ? null : parseFloat(v.replace(/,/g, ''));
    if (n !== null && !isFinite(n)) return setV(value == null ? '' : String(value));
    if (n !== value) onCommit(n);
  };
  return (
    <input className={'field num py-1 text-right ' + w} inputMode="decimal" value={v} placeholder={placeholder}
      onChange={(e) => setV(e.target.value)} onBlur={commit} onKeyDown={(e) => e.key === 'Enter' && (e.target as HTMLInputElement).blur()} />
  );
}

function PriceRow({ r, warn, checked, onCheck, onSave, onEdit }: {
  r: Product; warn: number; checked: boolean; onCheck: () => void; onSave: (p: Record<string, unknown>) => void; onEdit: () => void;
}) {
  const m = marginPct(r.cost_price, r.sell_price);
  const below = r.cost_price != null && r.sell_price != null && r.sell_price < r.cost_price;
  const low = !below && m != null && m < warn;
  const bg = below ? 'bg-red-50' : low ? 'bg-orange-50' : '';
  return (
    <tr className={'border-t ' + bg}>
      <td className="p-2"><input type="checkbox" checked={checked} onChange={onCheck} /></td>
      <td className="p-2">
        <div className="font-semibold">{r.name}</div>
        {r.material_spec && <div className="text-xs text-gray-500">{r.material_spec}</div>}
      </td>
      <td className="p-2 whitespace-nowrap">{r.size}</td>
      <td className="p-2 text-xs text-gray-600">{r.category}</td>
      <td className="p-2 text-right"><NumIn value={r.cost_price} placeholder="—" onCommit={(v) => onSave({ cost_price: v })} /></td>
      <td className="p-2 text-right">
        <NumIn value={r.markup_pct} w="w-20" placeholder="—" onCommit={(v) => onSave(v == null ? { sell_price: r.sell_price } : { markup_pct: v })} />
        {!r.markup_fixed && r.markup_pct != null && <div className="text-[10px] text-gray-400">from price</div>}
      </td>
      <td className="p-2 text-right">
        <NumIn value={r.sell_price} placeholder="⚪ not set" onCommit={(v) => onSave({ sell_price: v })} />
      </td>
      <td className={'p-2 text-right num font-semibold ' + (below ? 'text-red-700' : low ? 'text-orange-700' : '')}>
        {below ? '🔴 ' : low ? '🟠 ' : ''}{m == null ? '—' : m.toFixed(1) + '%'}
      </td>
      <td className="p-2 text-xs text-gray-500 whitespace-nowrap">{new Date(r.updated_at).toLocaleDateString('en-GB')}</td>
      <td className="p-2"><button className="text-navy underline" onClick={onEdit}>Edit</button></td>
    </tr>
  );
}

function EditProduct({ p, cats, onClose, onSaved }: { p: Product | 'new'; cats: string[]; onClose: () => void; onSaved: () => void }) {
  const isNew = p === 'new';
  const [f, setF] = useState(() => ({
    name: isNew ? '' : p.name, aliases: isNew ? '' : p.aliases.join('; '), size: isNew ? '' : p.size, material_spec: isNew ? '' : p.material_spec,
    options: isNew ? '' : p.options, unit: isNew ? 'pc' : p.unit, category: isNew ? '' : p.category,
    cost_price: isNew ? '' : p.cost_price ?? '', markup_pct: isNew ? '' : (p.markup_fixed ? p.markup_pct ?? '' : ''), sell_price: isNew ? '' : p.sell_price ?? '',
  }));
  const [msg, setMsg] = useState('');
  const cost = parseFloat(String(f.cost_price)), mk = parseFloat(String(f.markup_pct)), sp = parseFloat(String(f.sell_price));
  const preview = isFinite(mk) ? sellFromMarkup(isFinite(cost) ? cost : null, mk) : isFinite(sp) ? roundUpHalf(sp) : null;
  const save = async () => {
    setMsg('');
    const body: Record<string, unknown> = { name: f.name, aliases: f.aliases, size: f.size, material_spec: f.material_spec, options: f.options, unit: f.unit, category: f.category, cost_price: f.cost_price };
    if (String(f.markup_pct).trim() !== '') body.markup_pct = f.markup_pct;
    else body.sell_price = f.sell_price;
    try {
      if (isNew) await api('/api/owner/products', { method: 'POST', json: body });
      else await api(`/api/owner/products/${p.id}`, { method: 'PUT', json: body });
      onSaved();
    } catch (e) {
      setMsg((e as Error).message);
    }
  };
  const del = async () => {
    if (isNew || !confirm(`Delete "${p.name} ${p.size}" from the price list?`)) return;
    try {
      await api(`/api/owner/products/${p.id}`, { method: 'DELETE' });
      onSaved();
    } catch (e) {
      setMsg((e as Error).message);
    }
  };
  const field = (k: keyof typeof f, label: string, hint?: string) => (
    <label className="block">
      <span className="text-sm font-semibold">{label}</span>
      <input className="field mt-1" value={String(f[k])} onChange={(e) => setF({ ...f, [k]: e.target.value })} list={k === 'category' ? 'cats' : undefined} />
      {hint && <span className="text-xs text-gray-500">{hint}</span>}
    </label>
  );
  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/40 p-4">
      <div className="card w-full max-w-xl p-5">
        <h2 className="mb-4 text-xl font-bold">{isNew ? 'Add product' : 'Edit product'}</h2>
        <datalist id="cats">{cats.map((c) => <option key={c} value={c} />)}</datalist>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="sm:col-span-2">{field('name', 'Name')}</div>
          <div className="sm:col-span-2">{field('aliases', 'Other names', 'Separate with ;  e.g. "GI bend; galvanised elbow"')}</div>
          {field('size', 'Size')}
          {field('unit', 'Unit', 'pc, length, m, sheet, set …')}
          {field('material_spec', 'Material / spec')}
          {field('category', 'Category')}
          <div className="sm:col-span-2">{field('options', 'Options (ratings, ends…)')}</div>
          {field('cost_price', 'Cost (AED)')}
          {field('markup_pct', 'Markup % (leave empty to type a price)')}
          {String(f.markup_pct).trim() === '' && field('sell_price', 'Sell price (AED)')}
          <div className="self-end rounded-lg bg-gray-50 p-3 text-sm">
            Sell price: <b>{preview == null ? '—' : 'AED ' + money(preview)}</b>
            {preview != null && isFinite(cost) && <> · margin {marginPct(cost, preview)?.toFixed(1)}% · markup {markupFromSell(cost, preview)?.toFixed(1)}%</>}
          </div>
        </div>
        {msg && <p className="mt-3 font-semibold text-red-700">{msg}</p>}
        <div className="mt-5 flex flex-wrap justify-between gap-2">
          {!isNew ? <button className="btn btn-ghost text-red-700" onClick={del}>Delete</button> : <span />}
          <div className="flex gap-2">
            <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
            <button className="btn btn-navy" onClick={save} disabled={!f.name.trim()}>Save</button>
          </div>
        </div>
      </div>
    </div>
  );
}

type ImportRes = {
  summary: { rows: number; new: number; update: number; same: number; error: number };
  changes?: { action: string; line: number; name: string; size: string; material_spec: string; old_cost: number | null; new_cost: number | null; note?: string }[];
  saved?: boolean;
};

function ImportCsv({ defaultMarkup, onClose, onSaved }: { defaultMarkup: number; onClose: () => void; onSaved: () => void }) {
  const [csv, setCsv] = useState('');
  const [name, setName] = useState('');
  const [res, setRes] = useState<ImportRes | null>(null);
  const [give, setGive] = useState(true);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState('');
  const pick = async (f: File | undefined) => {
    if (!f) return;
    setMsg('');
    setRes(null);
    setName(f.name);
    const text = await f.text();
    setCsv(text);
    setBusy(true);
    try {
      setRes(await api<ImportRes>('/api/owner/import', { method: 'POST', json: { csv: text } }));
    } catch (e) {
      setMsg((e as Error).message);
    } finally {
      setBusy(false);
    }
  };
  const commit = async () => {
    setBusy(true);
    try {
      await api('/api/owner/import', { method: 'POST', json: { csv, commit: true, give_default: give } });
      onSaved();
    } catch (e) {
      setMsg((e as Error).message);
      setBusy(false);
    }
  };
  const label: Record<string, string> = { new: 'New item', update: 'Cost change', error: 'Problem' };
  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/40 p-4">
      <div className="card w-full max-w-4xl p-5">
        <h2 className="mb-2 text-xl font-bold">Import cost prices</h2>
        <p className="mb-4 text-sm text-gray-600">
          Use a CSV file with the columns <b>name, aliases, size, material_spec, unit, category, cost_price</b>. Easiest: click “Download price list (CSV)”,
          fill the <b>cost_price</b> column in Excel, then <i>File → Save As → CSV UTF-8</i> and pick that file here. Items are matched by name + size (+ material).
          Nothing is saved until you press Save.
        </p>
        <input type="file" accept=".csv,text/csv" onChange={(e) => pick(e.target.files?.[0])} />
        {busy && <p className="mt-3 text-gray-600">Working…</p>}
        {msg && <p className="mt-3 font-semibold text-red-700">{msg}</p>}
        {res && (
          <div className="mt-4">
            <p className="mb-2 font-semibold">{name}: {res.summary.rows.toLocaleString()} rows</p>
            <div className="mb-3 flex flex-wrap gap-2 text-sm">
              <span className="rounded bg-green-100 px-2 py-1">{res.summary.update} cost changes</span>
              <span className="rounded bg-blue-100 px-2 py-1">{res.summary.new} new items</span>
              <span className="rounded bg-gray-100 px-2 py-1">{res.summary.same} unchanged</span>
              <span className="rounded bg-red-100 px-2 py-1">{res.summary.error} problems (skipped)</span>
            </div>
            {!!res.changes?.length && (
              <div className="max-h-80 overflow-auto rounded border">
                <table className="w-full text-sm">
                  <thead className="sticky top-0 bg-gray-50 text-left text-xs uppercase text-gray-500">
                    <tr><th className="p-2">Row</th><th className="p-2">What</th><th className="p-2">Item</th><th className="p-2">Size</th><th className="p-2 text-right">Old cost</th><th className="p-2 text-right">New cost</th></tr>
                  </thead>
                  <tbody>
                    {res.changes.map((c, i) => (
                      <tr key={i} className={'border-t ' + (c.action === 'error' ? 'bg-red-50' : '')}>
                        <td className="p-2">{c.line}</td>
                        <td className="p-2">{label[c.action] || c.action}{c.note ? ': ' + c.note : ''}</td>
                        <td className="p-2">{c.name}<div className="text-xs text-gray-500">{c.material_spec}</div></td>
                        <td className="p-2">{c.size}</td>
                        <td className="p-2 text-right num">{c.old_cost == null ? '—' : money(c.old_cost)}</td>
                        <td className="p-2 text-right num">{c.new_cost == null ? '—' : money(c.new_cost)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            <label className="mt-3 flex items-center gap-2">
              <input type="checkbox" checked={give} onChange={(e) => setGive(e.target.checked)} />
              Give items that have a cost but no sell price the default markup ({defaultMarkup}%)
            </label>
          </div>
        )}
        <div className="mt-5 flex justify-end gap-2">
          <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
          <button className="btn btn-navy" disabled={!res || busy || res.summary.new + res.summary.update + (give ? res.summary.same : 0) === 0} onClick={commit}>Save</button>
        </div>
      </div>
    </div>
  );
}

/* ============================ QUOTES ============================ */

type OQuote = {
  id: number; quote_no: string; created_at: string; created_by: string; customer_name: string; customer_company: string;
  subtotal: number; vat: number; grand_total: number; total_cost: number; profit: number; margin_pct: number | null; status: string; lost_reason: string;
  raw_input_text: string; input_files: { id: string; name: string; mime: string }[];
  notes: { questions?: string[]; warnings?: string[]; suggested_addon?: string };
  lines: { product_id: number | null; description: string; size: string; qty: number; unit: string; unit_sell: number | null; line_total: number | null; unit_cost: number | null; line_cost: number | null; margin_pct: number | null }[];
};
const STATUS_CLS: Record<string, string> = { Draft: 'bg-gray-100', Sent: 'bg-blue-100', Won: 'bg-green-100', Lost: 'bg-red-100' };

function Quotes() {
  const [data, setData] = useState<{ quotes: OQuote[]; month: { made: number; value: number; won_value: number; won_profit: number; won: number } } | null>(null);
  const [open, setOpen] = useState<number | null>(null);
  const [msg, setMsg] = useState('');
  const load = useCallback(() => api('/api/owner/quotes').then(setData).catch((e) => setMsg(e.message)), []);
  useEffect(() => { load(); }, [load]);
  if (open != null) return <QuoteDetail id={open} onBack={() => { setOpen(null); load(); }} />;
  if (!data) return <p className="p-6 text-center text-gray-500">{msg || 'Loading…'}</p>;
  const m = data.month;
  return (
    <div className="space-y-3">
      <div className="grid gap-3 sm:grid-cols-4">
        {[
          ['Quotes this month', m.made.toLocaleString()],
          ['Value quoted', 'AED ' + money(m.value)],
          ['Won value', `AED ${money(m.won_value)} (${m.won})`],
          ['Profit on won', 'AED ' + money(m.won_profit)],
        ].map(([k, v]) => (
          <div key={k} className="card p-4"><div className="text-xs uppercase text-gray-500">{k}</div><div className="text-xl font-bold num">{v}</div></div>
        ))}
      </div>
      <div className="card overflow-x-auto">
        <table className="w-full min-w-[900px] text-sm">
          <thead className="bg-gray-50 text-left text-xs uppercase text-gray-500">
            <tr>
              <th className="p-2">Quote no</th><th className="p-2">Date</th><th className="p-2">Staff</th><th className="p-2">Customer</th>
              <th className="p-2 text-right">Total</th><th className="p-2 text-right">Cost</th><th className="p-2 text-right">Profit</th><th className="p-2 text-right">Margin</th><th className="p-2">Status</th>
            </tr>
          </thead>
          <tbody>
            {data.quotes.map((q) => (
              <tr key={q.id} className="cursor-pointer border-t hover:bg-gray-50" onClick={() => setOpen(q.id)}>
                <td className="p-2 font-semibold text-navy">{q.quote_no}</td>
                <td className="p-2">{new Date(q.created_at).toLocaleDateString('en-GB', { timeZone: 'Asia/Dubai' })}</td>
                <td className="p-2">{q.created_by}</td>
                <td className="p-2">{q.customer_company || q.customer_name || '—'}</td>
                <td className="p-2 text-right num">{money(q.grand_total)}</td>
                <td className="p-2 text-right num">{money(q.total_cost)}</td>
                <td className="p-2 text-right num">{money(q.profit)}</td>
                <td className="p-2 text-right num">{q.margin_pct == null ? '—' : q.margin_pct.toFixed(1) + '%'}</td>
                <td className="p-2"><span className={'rounded px-2 py-0.5 text-xs font-semibold ' + (STATUS_CLS[q.status] || '')}>{q.status}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
        {!data.quotes.length && <p className="p-6 text-center text-gray-500">No quotes yet.</p>}
      </div>
      <p className="text-xs text-gray-500">Total = with VAT. Cost and profit are before VAT. Lines “on request” are not counted.</p>
    </div>
  );
}

function QuoteDetail({ id, onBack }: { id: number; onBack: () => void }) {
  const [q, setQ] = useState<OQuote | null>(null);
  const [edits, setEdits] = useState<Record<number, { markup_pct?: string; unit_sell?: string; qty?: string; remove?: boolean }>>({});
  const [target, setTarget] = useState('');
  const [status, setStatus] = useState('');
  const [reason, setReason] = useState('');
  const [msg, setMsg] = useState('');
  const load = useCallback(async () => {
    const r = await api<{ quote: OQuote }>(`/api/owner/quotes/${id}`);
    setQ(r.quote);
    setStatus(r.quote.status);
    setReason(r.quote.lost_reason);
    setEdits({});
    setTarget('');
  }, [id]);
  useEffect(() => { load().catch((e) => setMsg(e.message)); }, [load]);
  if (!q) return <p className="p-6 text-center text-gray-500">{msg || 'Loading…'}</p>;

  const save = async (extra: Record<string, unknown> = {}) => {
    setMsg('');
    const lines = q.lines.map((_, i) => {
      const e = edits[i] || {};
      const o: Record<string, unknown> = {};
      if (e.remove) o.remove = true;
      if (e.qty) o.qty = parseFloat(e.qty);
      if (e.markup_pct) o.markup_pct = parseFloat(e.markup_pct);
      else if (e.unit_sell) o.unit_sell = parseFloat(e.unit_sell);
      return o;
    });
    try {
      const r = await api<{ quote: OQuote }>(`/api/owner/quotes/${id}`, { method: 'PUT', json: { lines, status, lost_reason: reason, ...extra } });
      setQ(r.quote);
      setEdits({});
      setTarget('');
      setMsg('Saved. Press “PDF” to see the new customer PDF.');
    } catch (e) {
      setMsg((e as Error).message);
    }
  };
  const ed = (i: number, patch: Record<string, string | boolean>) => setEdits({ ...edits, [i]: { ...edits[i], ...patch } });

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <button className="btn btn-ghost btn-sm" onClick={onBack}>← All quotes</button>
        <h1 className="text-xl font-bold">{q.quote_no}</h1>
        <span className="text-gray-500">{q.customer_company || q.customer_name} · by {q.created_by} · {new Date(q.created_at).toLocaleString('en-GB', { timeZone: 'Asia/Dubai' })}</span>
        <a className="btn btn-navy btn-sm ml-auto" href={`/api/staff/quotes/${q.id}/pdf`} target="_blank" rel="noreferrer">PDF</a>
      </div>
      {msg && <p className="card border-l-4 border-navy p-3">{msg}</p>}
      <div className="card overflow-x-auto">
        <table className="w-full min-w-[1000px] text-sm">
          <thead className="bg-gray-50 text-left text-xs uppercase text-gray-500">
            <tr>
              <th className="p-2">#</th><th className="p-2">Item</th><th className="p-2">Size</th><th className="p-2 text-right">Qty</th>
              <th className="p-2 text-right">Unit cost</th><th className="p-2 text-right">Markup %</th><th className="p-2 text-right">Unit price</th>
              <th className="p-2 text-right">Line total</th><th className="p-2 text-right">Line profit</th><th className="p-2 text-right">Margin</th><th className="p-2"></th>
            </tr>
          </thead>
          <tbody>
            {q.lines.map((l, i) => {
              const e = edits[i] || {};
              return (
                <tr key={i} className={'border-t ' + (e.remove ? 'opacity-40 line-through' : '')}>
                  <td className="p-2">{i + 1}</td>
                  <td className="p-2">{l.description}{l.product_id == null && <div className="text-xs text-amber-700">price on request / not in list</div>}</td>
                  <td className="p-2">{l.size}</td>
                  <td className="p-2 text-right"><input className="field w-20 py-1 text-right num" value={e.qty ?? String(l.qty)} onChange={(ev) => ed(i, { qty: ev.target.value })} /></td>
                  <td className="p-2 text-right num">{l.unit_cost == null ? '—' : money(l.unit_cost)}</td>
                  <td className="p-2 text-right">
                    <input className="field w-20 py-1 text-right num" disabled={l.unit_cost == null} placeholder={markupFromSell(l.unit_cost, l.unit_sell)?.toFixed(1) ?? '—'}
                      value={e.markup_pct ?? ''} onChange={(ev) => ed(i, { markup_pct: ev.target.value, unit_sell: '' })} />
                  </td>
                  <td className="p-2 text-right">
                    <input className="field w-24 py-1 text-right num" placeholder={l.unit_sell == null ? 'on request' : money(l.unit_sell)}
                      value={e.unit_sell ?? ''} onChange={(ev) => ed(i, { unit_sell: ev.target.value, markup_pct: '' })} />
                  </td>
                  <td className="p-2 text-right num">{l.line_total == null ? '—' : money(l.line_total)}</td>
                  <td className="p-2 text-right num">{l.line_total != null && l.line_cost != null ? money(l.line_total - l.line_cost) : '—'}</td>
                  <td className="p-2 text-right num">{l.margin_pct == null ? '—' : l.margin_pct.toFixed(1) + '%'}</td>
                  <td className="p-2"><button className="text-red-700" onClick={() => ed(i, { remove: !e.remove })}>{e.remove ? 'Undo' : 'Remove'}</button></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <div className="grid gap-3 lg:grid-cols-3">
        <div className="card space-y-1 p-4 num">
          <div className="flex justify-between"><span>Subtotal</span><b>AED {money(q.subtotal)}</b></div>
          <div className="flex justify-between"><span>VAT 5%</span><span>AED {money(q.vat)}</span></div>
          <div className="flex justify-between"><span>Grand total</span><b>AED {money(q.grand_total)}</b></div>
          <div className="flex justify-between border-t pt-1"><span>Cost</span><span>AED {money(q.total_cost)}</span></div>
          <div className="flex justify-between"><span>Profit</span><b className={q.profit < 0 ? 'text-red-700' : 'text-green-700'}>AED {money(q.profit)}</b></div>
          <div className="flex justify-between"><span>Margin</span><b>{q.margin_pct == null ? '—' : q.margin_pct.toFixed(1) + '%'}</b></div>
        </div>
        <div className="card space-y-3 p-4">
          <button className="btn btn-navy w-full" onClick={() => save()}>Save line changes & status</button>
          <div className="flex items-center gap-2">
            <span className="whitespace-nowrap text-sm">Set subtotal (before VAT) to</span>
            <input className="field py-1.5 num" inputMode="decimal" value={target} onChange={(e) => setTarget(e.target.value)} placeholder={money(q.subtotal)} />
          </div>
          <button className="btn btn-ghost w-full" disabled={!target} onClick={() => save({ set_subtotal: parseFloat(target) })}>Recalculate all prices to this subtotal</button>
        </div>
        <div className="card space-y-2 p-4">
          <label className="block text-sm font-semibold">Status</label>
          <select className="field" value={status} onChange={(e) => setStatus(e.target.value)}>
            {['Draft', 'Sent', 'Won', 'Lost'].map((s) => <option key={s}>{s}</option>)}
          </select>
          {status === 'Lost' && <input className="field" placeholder="Why lost? (price, stock, time…)" value={reason} onChange={(e) => setReason(e.target.value)} />}
          <button className="btn btn-ghost w-full" onClick={() => save()}>Save status</button>
        </div>
      </div>
      {!!(q.raw_input_text || q.input_files.length > 0 || q.notes?.questions?.length || q.notes?.warnings?.length) && (
        <div className="card space-y-3 p-4 text-sm">
          {q.raw_input_text && <div><b>Customer request:</b><pre className="mt-1 whitespace-pre-wrap rounded bg-gray-50 p-2 font-sans">{q.raw_input_text}</pre></div>}
          {q.input_files.length > 0 && <div><b>Files:</b> {q.input_files.map((f) => <a key={f.id} className="mr-3 text-navy underline" href={`/api/owner/files/${f.id}`} target="_blank" rel="noreferrer">{f.name}</a>)}</div>}
          {!!q.notes?.questions?.length && <div><b>Questions asked:</b> {q.notes.questions.join(' · ')}</div>}
          {!!q.notes?.warnings?.length && <div><b>Warnings:</b> {q.notes.warnings.join(' · ')}</div>}
        </div>
      )}
    </div>
  );
}

/* ============================ SETTINGS ============================ */

type S = {
  company_name: string; address: string; whatsapp: string; phone: string; email: string; trn: string;
  default_markup_pct: number; min_margin_warning_pct: number; quote_validity_days: number;
  validity_note: string; payment_terms: string; delivery_note: string; staff_names: string[]; pin_set: boolean; ai_ready: boolean; logo_file_id: string;
};

function SettingsTab() {
  const [s, setS] = useState<S | null>(null);
  const [names, setNames] = useState('');
  const [pin, setPin] = useState('');
  const [msg, setMsg] = useState('');
  const [logoV, setLogoV] = useState(0);
  useEffect(() => {
    api<{ settings: S }>('/api/owner/settings').then((r) => { setS(r.settings); setNames(r.settings.staff_names.join('\n')); }).catch((e) => setMsg(e.message));
  }, []);
  if (!s) return <p className="p-6 text-center text-gray-500">{msg || 'Loading…'}</p>;
  const save = async () => {
    setMsg('');
    try {
      const body: Record<string, unknown> = { ...s, staff_names: names };
      if (pin) body.new_staff_pin = pin;
      const r = await api<{ settings: S }>('/api/owner/settings', { method: 'PUT', json: body });
      setS(r.settings);
      setNames(r.settings.staff_names.join('\n'));
      setPin('');
      setMsg(pin ? 'Saved. The new PIN is active: staff must log in again with it.' : 'Saved.');
    } catch (e) {
      setMsg((e as Error).message);
    }
  };
  const uploadLogo = async (f: File | undefined) => {
    if (!f) return;
    const fd = new FormData();
    fd.set('logo', f);
    try {
      await api('/api/owner/logo', { method: 'POST', body: fd });
      setLogoV(Date.now());
      setMsg('Logo saved.');
    } catch (e) {
      setMsg((e as Error).message);
    }
  };
  const t = (k: keyof S, label: string, hint?: string, area = false) => (
    <label className="block">
      <span className="text-sm font-semibold">{label}</span>
      {area ? (
        <textarea className="field mt-1 min-h-20" value={String(s[k] ?? '')} onChange={(e) => setS({ ...s, [k]: e.target.value })} />
      ) : (
        <input className="field mt-1" value={String(s[k] ?? '')} onChange={(e) => setS({ ...s, [k]: e.target.value })} />
      )}
      {hint && <span className="text-xs text-gray-500">{hint}</span>}
    </label>
  );
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <div className="card space-y-3 p-5">
        <h2 className="text-lg font-bold">Company (printed on the quote PDF)</h2>
        {t('company_name', 'Company name')}
        {t('address', 'Address')}
        <div className="grid gap-3 sm:grid-cols-2">{t('whatsapp', 'WhatsApp')}{t('phone', 'Phone')}</div>
        <div className="grid gap-3 sm:grid-cols-2">{t('email', 'Email', 'Leave empty to hide')}{t('trn', 'TRN (VAT number)', 'Leave empty to hide')}</div>
        <div>
          <span className="text-sm font-semibold">Logo</span>
          <div className="mt-1 flex items-center gap-3">
            <img src={'/api/logo?v=' + logoV} alt="logo" className="h-10 w-auto rounded border bg-white p-1" />
            <input type="file" accept="image/png,image/jpeg" onChange={(e) => uploadLogo(e.target.files?.[0])} />
          </div>
        </div>
      </div>
      <div className="card space-y-3 p-5">
        <h2 className="text-lg font-bold">Prices and quote text</h2>
        <div className="grid gap-3 sm:grid-cols-3">
          {t('default_markup_pct', 'Default markup %')}
          {t('min_margin_warning_pct', 'Warn below margin %')}
          {t('quote_validity_days', 'Quote valid (days)')}
        </div>
        {t('validity_note', 'Validity note', undefined, true)}
        {t('delivery_note', 'Delivery note', undefined, true)}
        {t('payment_terms', 'Payment terms', undefined, true)}
      </div>
      <div className="card space-y-3 p-5">
        <h2 className="text-lg font-bold">Staff</h2>
        <label className="block">
          <span className="text-sm font-semibold">Staff names (one per line)</span>
          <textarea className="field mt-1 min-h-28" value={names} onChange={(e) => setNames(e.target.value)} />
        </label>
        <label className="block">
          <span className="text-sm font-semibold">{s.pin_set ? 'Change staff PIN' : 'Set staff PIN'} (4–8 digits)</span>
          <input className="field mt-1" inputMode="numeric" value={pin} onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))} placeholder={s.pin_set ? 'PIN is set: type a new one to change it' : 'Not set yet'} />
        </label>
        <p className="text-sm text-gray-600">Staff link: <b>{typeof window !== 'undefined' ? window.location.origin : ''}/quote</b></p>
      </div>
      <div className="card space-y-2 p-5">
        <h2 className="text-lg font-bold">Status</h2>
        <p>AI reading: {s.ai_ready ? '✅ ready' : '❌ ANTHROPIC_API_KEY not set in Vercel'}</p>
        <p>Staff PIN: {s.pin_set ? '✅ set' : '❌ not set'}</p>
        <p>Staff names: {s.staff_names.length ? '✅ ' + s.staff_names.length : '❌ none'}</p>
      </div>
      <div className="lg:col-span-2">
        {msg && <p className="card mb-3 border-l-4 border-navy p-3">{msg}</p>}
        <button className="btn btn-navy w-full text-lg" onClick={save}>Save settings</button>
      </div>
    </div>
  );
}
