'use client';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { api, money, registerSW } from '@/lib/client/api';
import ProductSearch, { type StaffProduct } from './ProductSearch';

type Me = {
  user: { role: string; name: string } | null;
  staff_names: string[];
  pin_set: boolean;
  ai_ready: boolean;
  company: { company_name: string; whatsapp: string; quote_validity_days: number };
};
type Line = {
  key: string;
  product: StaffProduct | null; // null = price on request
  description: string;
  size: string;
  qty: number;
  unit: string;
  customer_wording?: string;
  confidence?: string;
};
type Unmatched = { key: string; customer_wording: string; best_guess: string; qty: number };
type SavedQuote = {
  id: number; quote_no: string; created_at: string; customer_name: string; customer_company: string;
  subtotal: number; vat: number; grand_total: number; status: string;
  lines: { description: string; size: string; qty: number; unit: string; unit_sell: number | null; line_total: number | null }[];
};
type Notes = { questions: string[]; warnings: string[]; suggested_addon: string };

const k = () => Math.random().toString(36).slice(2);
const r2 = (x: number) => Math.round(x * 100) / 100;

// phone photos are made smaller before upload (the server takes max 4 MB per request)
async function shrinkImage(f: File): Promise<File> {
  if (!/^image\//.test(f.type) || f.type === 'image/gif') return f;
  try {
    const bmp = await createImageBitmap(f);
    const max = 1800;
    const s = Math.min(1, max / Math.max(bmp.width, bmp.height));
    const c = document.createElement('canvas');
    c.width = Math.round(bmp.width * s);
    c.height = Math.round(bmp.height * s);
    c.getContext('2d')!.drawImage(bmp, 0, 0, c.width, c.height);
    const blob: Blob = await new Promise((res) => c.toBlob((b) => res(b!), 'image/jpeg', 0.82));
    return new File([blob], f.name.replace(/\.\w+$/, '') + '.jpg', { type: 'image/jpeg' });
  } catch {
    return f;
  }
}

export default function QuoteApp() {
  const [me, setMe] = useState<Me | null>(null);
  const [err, setErr] = useState('');
  const load = useCallback(async () => {
    try {
      setMe(await api<Me>('/api/staff/me'));
      setErr('');
    } catch (e) {
      setErr((e as Error).message);
    }
  }, []);
  useEffect(() => {
    load();
    registerSW('/quote');
  }, [load]);

  if (err) return <Shell><p className="card p-6 text-red-700">{err}</p></Shell>;
  if (!me) return <Shell><p className="p-6 text-center text-gray-500">Loading…</p></Shell>;
  if (!me.user) return <Shell><Login me={me} onDone={load} /></Shell>;
  return <Main me={me} onLogout={load} />;
}

function Shell({ children, right }: { children: React.ReactNode; right?: React.ReactNode }) {
  return (
    <div className="mx-auto max-w-3xl px-3 pb-24 pt-3 sm:px-5">
      <header className="mb-4 flex items-center justify-between gap-3">
        <img src="/api/logo" alt="Fakhri Tools" className="h-7 w-auto min-w-0 sm:h-9" />
        {right}
      </header>
      {children}
    </div>
  );
}

function Login({ me, onDone }: { me: Me; onDone: () => void }) {
  const [name, setName] = useState(() => (typeof localStorage !== 'undefined' && localStorage.getItem('fq_name')) || '');
  const [pin, setPin] = useState('');
  const [msg, setMsg] = useState('');
  const [busy, setBusy] = useState(false);
  if (!me.pin_set || !me.staff_names.length)
    return (
      <div className="card p-6 text-lg">
        <h1 className="mb-2 text-xl font-bold">Not ready yet</h1>
        <p>The owner needs to add staff names and a staff PIN first (Owner page → Settings).</p>
      </div>
    );
  const go = async () => {
    setBusy(true);
    setMsg('');
    try {
      await api('/api/staff/login', { method: 'POST', json: { name, pin } });
      localStorage.setItem('fq_name', name);
      onDone();
    } catch (e) {
      setMsg((e as Error).message);
    } finally {
      setBusy(false);
    }
  };
  return (
    <div className="card p-5 sm:p-6">
      <h1 className="mb-4 text-2xl font-bold">Who are you?</h1>
      <div className="mb-5 grid grid-cols-2 gap-2 sm:grid-cols-3">
        {me.staff_names.map((n) => (
          <button key={n} className={'btn ' + (n === name ? 'btn-navy' : 'btn-ghost')} onClick={() => setName(n)}>{n}</button>
        ))}
      </div>
      <label className="mb-1 block font-semibold">Staff PIN</label>
      <input
        className="field mb-4 text-center text-2xl tracking-[.4em]"
        inputMode="numeric" type="password" autoComplete="off" maxLength={8}
        value={pin} onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
        onKeyDown={(e) => e.key === 'Enter' && name && pin && go()}
      />
      {msg && <p className="mb-3 font-semibold text-red-700">{msg}</p>}
      <button className="btn btn-primary w-full text-lg" disabled={!name || pin.length < 4 || busy} onClick={go}>
        {busy ? 'Checking…' : 'Start'}
      </button>
      <p className="mt-3 text-center text-sm text-gray-500">This phone will remember you.</p>
    </div>
  );
}

function Main({ me, onLogout }: { me: Me; onLogout: () => void }) {
  const [tab, setTab] = useState<'new' | 'history'>('new');
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [customer, setCustomer] = useState({ name: '', company: '' });
  const [text, setText] = useState('');
  const [files, setFiles] = useState<File[]>([]);
  const [lines, setLines] = useState<Line[]>([]);
  const [unmatched, setUnmatched] = useState<Unmatched[]>([]);
  const [notes, setNotes] = useState<Notes>({ questions: [], warnings: [], suggested_addon: '' });
  const [saved, setSaved] = useState<{ id: string; name: string; mime: string }[]>([]);
  const [quote, setQuote] = useState<SavedQuote | null>(null);
  const [busy, setBusy] = useState('');
  const [msg, setMsg] = useState('');

  const reset = () => {
    setStep(1); setCustomer({ name: '', company: '' }); setText(''); setFiles([]); setLines([]); setUnmatched([]);
    setNotes({ questions: [], warnings: [], suggested_addon: '' }); setSaved([]); setQuote(null); setMsg('');
    window.scrollTo(0, 0);
  };

  const makeQuote = async () => {
    setMsg('');
    setBusy('Reading the request… this takes about 20–60 seconds.');
    try {
      const fd = new FormData();
      fd.set('text', text);
      for (const f of files) fd.append('files', await shrinkImage(f));
      const r = await api<{
        lines: { product: StaffProduct; size: string; qty: number; customer_wording: string; confidence: string }[];
        unmatched: { customer_wording: string; best_guess: string; qty: number }[];
        files: { id: string; name: string; mime: string }[];
      } & Notes>('/api/staff/match', { method: 'POST', body: fd });
      setLines(r.lines.map((l) => ({
        key: k(), product: l.product, description: l.product.name, size: l.size, qty: l.qty, unit: l.product.unit,
        customer_wording: l.customer_wording, confidence: l.confidence,
      })));
      setUnmatched(r.unmatched.map((u) => ({ ...u, key: k() })));
      setNotes({ questions: r.questions, warnings: r.warnings, suggested_addon: r.suggested_addon });
      setSaved(r.files);
      setStep(2);
      window.scrollTo(0, 0);
    } catch (e) {
      setMsg((e as Error).message);
    } finally {
      setBusy('');
    }
  };

  const createPdf = async () => {
    setMsg('');
    setBusy('Making the quote…');
    try {
      const all = [
        ...lines,
        // items still "not in price list" go on the quote as "price on request"
        ...unmatched.map((u) => ({ key: u.key, product: null, description: u.best_guess || u.customer_wording, size: '', qty: u.qty || 1, unit: 'pc' })),
      ];
      const r = await api<{ quote: SavedQuote }>('/api/staff/quotes', {
        method: 'POST',
        json: {
          customer_name: customer.name, customer_company: customer.company, raw_input_text: text, files: saved, notes,
          lines: all.map((l) => ({ product_id: l.product?.id ?? null, qty: l.qty, size: l.size, description: l.description, unit: l.unit })),
        },
      });
      setQuote(r.quote);
      setStep(3);
      window.scrollTo(0, 0);
    } catch (e) {
      setMsg((e as Error).message);
    } finally {
      setBusy('');
    }
  };

  const logout = async () => {
    await api('/api/staff/login', { method: 'DELETE' });
    onLogout();
  };

  return (
    <Shell
      right={
        <div className="flex items-center gap-2 text-sm">
          <span className="hidden text-gray-600 sm:inline">{me.user!.name}</span>
          <button className="btn btn-ghost btn-sm" onClick={logout}>Log out</button>
        </div>
      }
    >
      <nav className="mb-4 flex gap-2">
        <button className={'tab ' + (tab === 'new' ? 'tab-on' : '')} onClick={() => setTab('new')}>New quote</button>
        <button className={'tab ' + (tab === 'history' ? 'tab-on' : '')} onClick={() => setTab('history')}>My quotes</button>
      </nav>
      {tab === 'history' && <History me={me} />}
      {tab === 'new' && (
        <>
          {busy && (
            <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 p-6">
              <div className="card max-w-sm p-6 text-center text-lg font-semibold">
                <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-4 border-gray-200 border-t-brand" />
                {busy}
              </div>
            </div>
          )}
          {msg && <p className="card mb-4 border-l-4 border-red-600 p-4 font-semibold text-red-700">{msg}</p>}
          {step === 1 && (
            <StepInput
              me={me} customer={customer} setCustomer={setCustomer} text={text} setText={setText} files={files} setFiles={setFiles}
              onMake={makeQuote}
              onManual={() => { setLines([]); setUnmatched([]); setSaved([]); setStep(2); }}
            />
          )}
          {step === 2 && (
            <StepCheck
              customer={customer} setCustomer={setCustomer} lines={lines} setLines={setLines} unmatched={unmatched} setUnmatched={setUnmatched}
              notes={notes} onBack={() => setStep(1)} onCreate={createPdf}
            />
          )}
          {step === 3 && quote && <StepSend me={me} quote={quote} notes={notes} onNew={reset} />}
        </>
      )}
    </Shell>
  );
}

function StepInput(p: {
  me: Me; customer: { name: string; company: string }; setCustomer: (c: { name: string; company: string }) => void;
  text: string; setText: (s: string) => void; files: File[]; setFiles: (f: File[]) => void; onMake: () => void; onManual: () => void;
}) {
  const cam = useRef<HTMLInputElement>(null), pics = useRef<HTMLInputElement>(null), pdf = useRef<HTMLInputElement>(null);
  const add = (list: FileList | null) => list && p.setFiles([...p.files, ...Array.from(list)].slice(0, 10));
  return (
    <div className="card p-4 sm:p-6">
      <h1 className="mb-4 text-2xl font-bold">New quote</h1>
      <div className="mb-4 grid gap-3 sm:grid-cols-2">
        <input className="field" placeholder="Customer name (optional)" value={p.customer.name} onChange={(e) => p.setCustomer({ ...p.customer, name: e.target.value })} />
        <input className="field" placeholder="Company (optional)" value={p.customer.company} onChange={(e) => p.setCustomer({ ...p.customer, company: e.target.value })} />
      </div>
      <textarea
        className="field mb-4 min-h-48 text-lg"
        placeholder={'Paste the customer\'s message here.\n\nExample:\n10 pcs 1/2 GI elbow\n5 pcs 2" SS ball valve\n2 lengths 1" GI pipe'}
        value={p.text} onChange={(e) => p.setText(e.target.value)}
      />
      <div className="mb-4 grid grid-cols-3 gap-2">
        <button className="btn btn-ghost" onClick={() => cam.current?.click()}>📷 Take photo</button>
        <button className="btn btn-ghost" onClick={() => pics.current?.click()}>🖼 Photos</button>
        <button className="btn btn-ghost" onClick={() => pdf.current?.click()}>📄 PDF</button>
        <input ref={cam} hidden type="file" accept="image/*" capture="environment" onChange={(e) => { add(e.target.files); e.target.value = ''; }} />
        <input ref={pics} hidden type="file" accept="image/*" multiple onChange={(e) => { add(e.target.files); e.target.value = ''; }} />
        <input ref={pdf} hidden type="file" accept="application/pdf" multiple onChange={(e) => { add(e.target.files); e.target.value = ''; }} />
      </div>
      {!!p.files.length && (
        <ul className="mb-4 space-y-2">
          {p.files.map((f, i) => (
            <li key={i} className="flex items-center justify-between rounded-lg bg-gray-50 px-3 py-2 text-sm">
              <span className="truncate">{/pdf/.test(f.type) ? '📄' : '🖼'} {f.name}</span>
              <button className="text-red-700" onClick={() => p.setFiles(p.files.filter((_, j) => j !== i))}>Remove</button>
            </li>
          ))}
        </ul>
      )}
      {!p.me.ai_ready && <p className="mb-3 rounded-lg bg-amber-50 p-3 text-amber-900">The AI is not set up yet. You can still add items by hand.</p>}
      <button className="btn btn-primary w-full text-xl" disabled={!p.me.ai_ready || (!p.text.trim() && !p.files.length)} onClick={p.onMake}>
        Make quote
      </button>
      <button className="mt-3 w-full text-center text-navy underline" onClick={p.onManual}>or add items by hand</button>
    </div>
  );
}

function StepCheck(p: {
  customer: { name: string; company: string }; setCustomer: (c: { name: string; company: string }) => void;
  lines: Line[]; setLines: (l: Line[]) => void; unmatched: Unmatched[]; setUnmatched: (u: Unmatched[]) => void;
  notes: Notes; onBack: () => void; onCreate: () => void;
}) {
  // search box: for a line ("change item"), for an unmatched item ("pick"), or a new line
  const [search, setSearch] = useState<null | { mode: 'line' | 'unmatched' | 'add'; key?: string; q: string }>(null);
  const { lines, setLines, unmatched, setUnmatched } = p;
  const setLine = (key: string, patch: Partial<Line>) => setLines(lines.map((l) => (l.key === key ? { ...l, ...patch } : l)));

  const pick = (prod: StaffProduct) => {
    if (!search) return;
    const base = { product: prod, description: prod.name, size: prod.size, unit: prod.unit };
    if (search.mode === 'line') setLines(lines.map((l) => (l.key === search.key ? { ...l, ...base, confidence: undefined } : l)));
    else if (search.mode === 'unmatched') {
      const u = unmatched.find((x) => x.key === search.key)!;
      setLines([...lines, { key: k(), ...base, qty: u.qty || 1, customer_wording: u.customer_wording }]);
      setUnmatched(unmatched.filter((x) => x.key !== search.key));
    } else setLines([...lines, { key: k(), ...base, qty: 1 }]);
    setSearch(null);
  };

  const noPrice = lines.filter((l) => l.product && l.product.sell_price == null);
  const reducerNoSize = lines.filter((l) => /× smaller$/.test(l.size));
  const sub = useMemo(() => r2(lines.reduce((s, l) => s + (l.product?.sell_price != null ? r2(l.product.sell_price * l.qty) : 0), 0)), [lines]);
  const vat = r2(sub * 0.05);
  const total = lines.length + unmatched.length;

  return (
    <div className="space-y-4">
      {search && <ProductSearch initial={search.q} onPick={pick} onClose={() => setSearch(null)} />}
      <div className="card p-4 sm:p-6">
        <div className="mb-3 flex items-center justify-between">
          <h1 className="text-2xl font-bold">Check the lines</h1>
          <button className="btn btn-ghost btn-sm" onClick={p.onBack}>← Back</button>
        </div>
        <div className="mb-4 grid gap-2 sm:grid-cols-2">
          <input className="field" placeholder="Customer name" value={p.customer.name} onChange={(e) => p.setCustomer({ ...p.customer, name: e.target.value })} />
          <input className="field" placeholder="Company" value={p.customer.company} onChange={(e) => p.setCustomer({ ...p.customer, company: e.target.value })} />
        </div>
        {!lines.length && <p className="rounded-lg bg-gray-50 p-4 text-gray-600">No items yet. Add one below.</p>}
        <ul className="divide-y">
          {lines.map((l, i) => {
            const price = l.product?.sell_price ?? null;
            return (
              <li key={l.key} className="py-3">
                <div className="flex gap-3">
                  <span className="mt-1 w-6 shrink-0 text-sm text-gray-400">{i + 1}</span>
                  <div className="min-w-0 flex-1">
                    <div className="font-semibold">{l.description}</div>
                    <div className="text-sm text-gray-500">{l.product?.material_spec}</div>
                    {l.customer_wording && <div className="text-xs text-gray-400">Customer wrote: “{l.customer_wording}”</div>}
                    <div className="mt-2 flex flex-wrap items-center gap-2">
                      {/× smaller$/.test(l.product?.size || '') ? (
                        <input
                          className="field w-36 py-1.5" placeholder={'e.g. 4" × 2"'}
                          value={/× smaller$/.test(l.size) ? '' : l.size}
                          onChange={(e) => setLine(l.key, { size: e.target.value || l.product!.size })}
                        />
                      ) : (
                        <span className="rounded-md bg-navy/10 px-2 py-1 font-semibold text-navy">{l.size || '—'}</span>
                      )}
                      <label className="flex items-center gap-1">
                        <span className="text-sm text-gray-500">Qty</span>
                        <input
                          className="field w-20 py-1.5 text-center num" inputMode="decimal" value={String(l.qty)}
                          onChange={(e) => { const v = parseFloat(e.target.value); setLine(l.key, { qty: isFinite(v) && v > 0 ? v : 0 }); }}
                        />
                        <span className="text-sm text-gray-500">{l.unit}</span>
                      </label>
                      {l.confidence && l.confidence !== 'high' && (
                        <span className="rounded bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-800">AI {l.confidence} confidence: please check</span>
                      )}
                    </div>
                  </div>
                  <div className="shrink-0 text-right num">
                    {price != null ? (
                      <>
                        <div className="text-sm text-gray-500">AED {money(price)}</div>
                        <div className="font-bold">AED {money(r2(price * l.qty))}</div>
                      </>
                    ) : (
                      <span className="inline-block rounded bg-red-100 px-2 py-1 text-xs font-bold text-red-800">⚠️ Price not set<br />Ask owner</span>
                    )}
                  </div>
                </div>
                <div className="mt-2 flex gap-2 pl-9">
                  <button className="btn btn-ghost btn-sm" onClick={() => setSearch({ mode: 'line', key: l.key, q: l.description + ' ' + (l.product?.size || '') })}>Change item</button>
                  <button className="btn btn-ghost btn-sm text-red-700" onClick={() => setLines(lines.filter((x) => x.key !== l.key))}>Delete</button>
                </div>
              </li>
            );
          })}
        </ul>
        <button className="btn btn-ghost mt-3 w-full" onClick={() => setSearch({ mode: 'add', q: '' })}>+ Add item</button>
      </div>

      {!!unmatched.length && (
        <div className="card border-l-4 border-amber-500 p-4 sm:p-6">
          <h2 className="mb-1 text-lg font-bold">⚠️ Not in price list ({unmatched.length})</h2>
          <p className="mb-3 text-sm text-gray-600">Pick the right item, or leave it: it goes on the quote as “price on request”.</p>
          <ul className="space-y-3">
            {unmatched.map((u) => (
              <li key={u.key} className="rounded-lg bg-amber-50 p-3">
                <div className="font-semibold">“{u.customer_wording}” <span className="font-normal text-gray-600">× {u.qty}</span></div>
                {u.best_guess && <div className="text-sm text-gray-600">Best guess: {u.best_guess}</div>}
                <div className="mt-2 flex flex-wrap gap-2">
                  <button className="btn btn-navy btn-sm" onClick={() => setSearch({ mode: 'unmatched', key: u.key, q: u.best_guess || u.customer_wording })}>Search & pick</button>
                  <button className="btn btn-ghost btn-sm text-red-700" onClick={() => setUnmatched(unmatched.filter((x) => x.key !== u.key))}>Remove</button>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      {(!!p.notes.questions.length || !!p.notes.warnings.length || !!p.notes.suggested_addon) && (
        <div className="card space-y-4 p-4 sm:p-6">
          {!!p.notes.questions.length && (
            <div>
              <h2 className="mb-1 text-lg font-bold">❓ Questions for the customer</h2>
              <ol className="list-decimal space-y-1 pl-6">{p.notes.questions.map((q, i) => <li key={i}>{q}</li>)}</ol>
            </div>
          )}
          {!!p.notes.warnings.length && (
            <div>
              <h2 className="mb-1 text-lg font-bold">🔧 Technical warnings</h2>
              <ul className="list-disc space-y-1 pl-6">{p.notes.warnings.map((w, i) => <li key={i}>{w}</li>)}</ul>
            </div>
          )}
          {p.notes.suggested_addon && (
            <div>
              <h2 className="mb-1 text-lg font-bold">💡 Suggest to the customer</h2>
              <p>{p.notes.suggested_addon}</p>
            </div>
          )}
        </div>
      )}

      <div className="card p-4 sm:p-6">
        <dl className="mb-4 space-y-1 text-lg num">
          <div className="flex justify-between"><dt>Subtotal</dt><dd>AED {money(sub)}</dd></div>
          <div className="flex justify-between"><dt>VAT 5%</dt><dd>AED {money(vat)}</dd></div>
          <div className="flex justify-between text-xl font-bold"><dt>Grand total</dt><dd>AED {money(r2(sub + vat))}</dd></div>
        </dl>
        {!!noPrice.length && (
          <p className="mb-3 rounded-lg bg-red-50 p-3 font-semibold text-red-800">
            {noPrice.length} item{noPrice.length > 1 ? 's have' : ' has'} no selling price yet. Ask the owner to set {noPrice.length > 1 ? 'them' : 'it'}, or change/delete {noPrice.length > 1 ? 'them' : 'it'}.
          </p>
        )}
        {!!reducerNoSize.length && <p className="mb-3 rounded-lg bg-amber-50 p-3 font-semibold text-amber-900">Type the full size for the reducing items (big end × small end).</p>}
        {lines.some((l) => !(l.qty > 0)) && <p className="mb-3 rounded-lg bg-amber-50 p-3 font-semibold text-amber-900">Every line needs a quantity.</p>}
        <button
          className="btn btn-primary w-full text-xl"
          disabled={!total || !!noPrice.length || !!reducerNoSize.length || lines.some((l) => !(l.qty > 0))}
          onClick={p.onCreate}
        >
          Create PDF
        </button>
      </div>
    </div>
  );
}

function waText(me: Me, q: SavedQuote, notes?: Notes) {
  const who = q.customer_name || q.customer_company;
  const parts = [
    `Dear ${who || 'Sir/Madam'},`,
    '',
    `Please find attached our quotation ${q.quote_no} for AED ${money(q.grand_total)} (including 5% VAT).`,
    `Prices are valid for ${me.company.quote_validity_days} days.`,
  ];
  if (q.lines.some((l) => l.unit_sell == null)) parts.push('Items marked "On request" will be confirmed separately.');
  if (notes?.questions.length) {
    parts.push('', 'To make sure we supply the right items, please confirm:');
    notes.questions.forEach((x, i) => parts.push(`${i + 1}. ${x}`));
  }
  parts.push('', 'Reply here to confirm your order.', '', `${me.company.company_name}`);
  return parts.join('\n');
}

function StepSend({ me, quote, notes, onNew }: { me: Me; quote: SavedQuote; notes?: Notes; onNew: () => void }) {
  const url = `/api/staff/quotes/${quote.id}/pdf`;
  const [text, setText] = useState(() => waText(me, quote, notes));
  const [info, setInfo] = useState('');
  const name = `Fakhri_Quote_${quote.quote_no}_${(quote.customer_company || quote.customer_name || 'Customer').replace(/[^A-Za-z0-9]+/g, '_').replace(/^_|_$/g, '') || 'Customer'}.pdf`;

  const share = async () => {
    setInfo('');
    try {
      const blob = await (await fetch(url, { credentials: 'same-origin' })).blob();
      const file = new File([blob], name, { type: 'application/pdf' });
      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({ files: [file], text });
      } else {
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = name;
        a.click();
        setInfo('This browser cannot share files, so the PDF was downloaded. Send it on WhatsApp from your downloads.');
      }
    } catch (e) {
      if ((e as Error).name !== 'AbortError') setInfo('Could not share: ' + (e as Error).message);
    }
  };
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setInfo('Message copied.');
    } catch {
      setInfo('Select the text and copy it.');
    }
  };

  return (
    <div className="space-y-4">
      <div className="card p-4 sm:p-6">
        <div className="mb-1 text-sm font-semibold text-green-700">✓ Quote saved</div>
        <h1 className="mb-1 text-2xl font-bold">{quote.quote_no}</h1>
        <p className="mb-4 text-lg num">Grand total <b>AED {money(quote.grand_total)}</b></p>
        <div className="grid grid-cols-2 gap-2">
          <button className="btn btn-primary text-lg" onClick={share}>Share</button>
          <a className="btn btn-ghost text-lg" href={url + '?download=1'}>Download</a>
        </div>
        {info && <p className="mt-3 text-sm text-gray-700">{info}</p>}
      </div>
      <div className="card p-4 sm:p-6">
        <div className="mb-2 flex items-center justify-between">
          <h2 className="text-lg font-bold">WhatsApp message</h2>
          <button className="btn btn-ghost btn-sm" onClick={copy}>Copy</button>
        </div>
        <textarea className="field min-h-56" value={text} onChange={(e) => setText(e.target.value)} />
      </div>
      <div className="card p-4 sm:p-6">
        <div className="mb-3 flex items-center justify-between">
          <span className="text-lg font-bold">What the customer gets</span>
          <a className="btn btn-ghost btn-sm" href={url} target="_blank" rel="noreferrer">Open PDF</a>
        </div>
        <div className="mb-2 text-sm text-gray-600">{[quote.customer_company, quote.customer_name].filter(Boolean).join(' · ') || 'No customer name'}</div>
        <ul className="divide-y text-sm">
          {quote.lines.map((l, i) => (
            <li key={i} className="flex gap-3 py-2">
              <span className="w-5 text-gray-400">{i + 1}</span>
              <div className="flex-1">
                <div className="font-semibold">{l.description}</div>
                <div className="text-gray-500">{l.size} · {l.qty} {l.unit} × {l.unit_sell == null ? 'on request' : 'AED ' + money(l.unit_sell)}</div>
              </div>
              <div className="font-semibold num">{l.line_total == null ? '—' : money(l.line_total)}</div>
            </li>
          ))}
        </ul>
        <dl className="mt-2 space-y-1 border-t pt-2 num">
          <div className="flex justify-between"><dt>Subtotal</dt><dd>AED {money(quote.subtotal)}</dd></div>
          <div className="flex justify-between"><dt>VAT 5%</dt><dd>AED {money(quote.vat)}</dd></div>
          <div className="flex justify-between font-bold"><dt>Grand total</dt><dd>AED {money(quote.grand_total)}</dd></div>
        </dl>
      </div>
      <button className="btn btn-navy w-full text-lg" onClick={onNew}>+ New quote</button>
    </div>
  );
}

function History({ me }: { me: Me }) {
  const [rows, setRows] = useState<SavedQuote[] | null>(null);
  const [err, setErr] = useState('');
  const [open, setOpen] = useState<SavedQuote | null>(null);
  useEffect(() => {
    api<{ quotes: SavedQuote[] }>('/api/staff/quotes').then((r) => setRows(r.quotes)).catch((e) => setErr(e.message));
  }, []);
  if (open) return (<><button className="btn btn-ghost btn-sm mb-3" onClick={() => setOpen(null)}>← All my quotes</button><StepSend me={me} quote={open} onNew={() => setOpen(null)} /></>);
  if (err) return <p className="card p-4 text-red-700">{err}</p>;
  if (!rows) return <p className="p-6 text-center text-gray-500">Loading…</p>;
  if (!rows.length) return <p className="card p-6 text-center text-gray-500">No quotes yet.</p>;
  return (
    <ul className="card divide-y">
      {rows.map((q) => (
        <li key={q.id}>
          <button className="flex w-full items-center gap-3 p-4 text-left hover:bg-gray-50" onClick={() => setOpen(q)}>
            <div className="flex-1">
              <div className="font-semibold">{q.customer_company || q.customer_name || 'No name'}</div>
              <div className="text-sm text-gray-500">{q.quote_no} · {new Date(q.created_at).toLocaleDateString('en-GB', { timeZone: 'Asia/Dubai' })}</div>
            </div>
            <div className="font-bold num">AED {money(q.grand_total)}</div>
          </button>
        </li>
      ))}
    </ul>
  );
}
