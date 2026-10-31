import 'server-only';
import postgres from 'postgres';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { parseCsv } from './csv';

// The database address comes from Vercel (Supabase integration sets POSTGRES_URL) or from DATABASE_URL.
const url = process.env.DATABASE_URL || process.env.POSTGRES_URL || process.env.POSTGRES_PRISMA_URL || '';

type Sql = ReturnType<typeof postgres>;
const g = globalThis as unknown as { __fq_sql?: Sql; __fq_ready?: Promise<void> };

export function hasDb() {
  return !!url;
}

function make(): Sql {
  if (!url) throw new Error('NO_DATABASE');
  const local = /localhost|127\.0\.0\.1/.test(url);
  // drop extra settings in the address (Vercel's Supabase link adds e.g. ?sslmode=require&supa=...); ssl is set below
  const clean = new URL(url);
  clean.search = '';
  return postgres(clean.toString(), {
    max: 3,
    prepare: false, // works with the Supabase connection pooler
    ssl: local ? false : 'require',
    idle_timeout: 20,
    types: {
      // numbers stored as numeric come back as JS numbers
      numeric: { to: 1700, from: [1700], serialize: (x: unknown) => String(x), parse: (x: string) => parseFloat(x) },
    } as never,
  });
}

export function sql(): Sql {
  if (!g.__fq_sql) g.__fq_sql = make();
  return g.__fq_sql;
}

const SCHEMA = `
create table if not exists products (
  id serial primary key,
  name text not null,
  aliases text[] not null default '{}',
  size text not null default '',
  material_spec text not null default '',
  options text not null default '',
  unit text not null default 'pc',
  category text not null default '',
  cost_price numeric(12,2),
  markup_pct numeric(8,2),
  sell_price numeric(12,2),
  website_ref text,
  updated_at timestamptz not null default now()
);
create index if not exists products_name_idx on products (lower(name));
create table if not exists settings (
  id int primary key default 1 check (id = 1),
  data jsonb not null,
  secret text not null
);
create table if not exists quotes (
  id serial primary key,
  quote_no text unique not null,
  created_at timestamptz not null default now(),
  created_by text not null default '',
  customer_name text not null default '',
  customer_company text not null default '',
  raw_input_text text not null default '',
  input_files jsonb not null default '[]',
  lines jsonb not null default '[]',
  notes jsonb not null default '{}',
  subtotal numeric(14,2) not null default 0,
  vat numeric(14,2) not null default 0,
  grand_total numeric(14,2) not null default 0,
  total_cost numeric(14,2) not null default 0,
  profit numeric(14,2) not null default 0,
  margin_pct numeric(8,2),
  status text not null default 'Draft',
  lost_reason text not null default '',
  updated_at timestamptz not null default now()
);
create table if not exists files (
  id uuid primary key,
  kind text not null,
  name text not null default '',
  mime text not null,
  data bytea not null,
  created_at timestamptz not null default now()
);
create table if not exists day_counter (day text primary key, n int not null);
create table if not exists events (
  id bigserial primary key,
  at timestamptz not null default now(),
  kind text not null,
  who text not null default ''
);
create index if not exists events_kind_at on events (kind, at);
`;

export const DEFAULT_SETTINGS = {
  company_name: 'Fakhri Tools & Workshop Materials Trading LLC',
  address: 'Warehouse 8, 8th Street, Al Quoz Industrial 3, Dubai, UAE',
  whatsapp: '052 276 7034',
  phone: '04 285 0135',
  email: '',
  trn: '',
  default_markup_pct: 15,
  min_margin_warning_pct: 8,
  quote_validity_days: 7,
  validity_note: 'Prices valid for 7 days due to steel price changes.',
  payment_terms: 'Payment: cash, card, bank transfer or cheque.',
  delivery_note: 'Delivery across the UAE for orders from AED 5,000.',
  staff_names: [] as string[],
  staff_pin_hash: '',
  staff_pin_version: 0,
  logo_file_id: '',
};
export type Settings = typeof DEFAULT_SETTINGS;

async function migrate() {
  const db = sql();
  await db.unsafe(SCHEMA);
  const s = await db`select id from settings where id = 1`;
  if (!s.length) {
    await db`insert into settings (id, data, secret) values (1, ${db.json(DEFAULT_SETTINGS)}, ${crypto.randomBytes(32).toString('hex')}) on conflict do nothing`;
  }
  const [{ n }] = await db`select count(*)::int as n from products`;
  if (n === 0) await seedProducts();
}

// First start: load the product list made from the website (cost prices blank).
async function seedProducts() {
  const file = path.join(process.cwd(), 'data', 'products.csv');
  if (!fs.existsSync(file)) return;
  const rows = parseCsv(fs.readFileSync(file, 'utf8'));
  const db = sql();
  const items = rows.map((r) => ({
    name: r.name,
    aliases: (r.aliases || '').split(';').map((x) => x.trim()).filter(Boolean),
    size: r.size || '',
    material_spec: r.material_spec || '',
    options: r.options || '',
    unit: r.unit || 'pc',
    category: r.category || '',
    website_ref: r.website_ref || null,
  }));
  for (let i = 0; i < items.length; i += 500) {
    const chunk = items.slice(i, i + 500);
    await db`insert into products ${db(chunk, 'name', 'aliases', 'size', 'material_spec', 'options', 'unit', 'category', 'website_ref')}`;
  }
}

export function ready(): Promise<void> {
  if (!g.__fq_ready) {
    g.__fq_ready = migrate().catch((e) => {
      g.__fq_ready = undefined;
      throw e;
    });
  }
  return g.__fq_ready;
}

export async function db(): Promise<Sql> {
  await ready();
  return sql();
}
