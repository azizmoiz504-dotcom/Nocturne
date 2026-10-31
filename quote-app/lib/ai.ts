import 'server-only';
import Anthropic from '@anthropic-ai/sdk';
import { zodOutputFormat } from '@anthropic-ai/sdk/helpers/zod';
import { z } from 'zod';
import { allProducts, canonSize, type ProductRow } from './products';

// The AI only ever gets: product names, other names, sizes, materials, options, units and categories.
// Never cost, markup or selling prices. The server adds prices afterwards.

export const MODEL = 'claude-sonnet-5-5';

type Group = { code: string; rows: ProductRow[] };

// one catalogue line per product (all its sizes/materials together) keeps the request small
function buildGroups(rows: ProductRow[]): Group[] {
  const map = new Map<string, ProductRow[]>();
  for (const r of rows) {
    const k = r.category + '\u0000' + r.name;
    if (!map.has(k)) map.set(k, []);
    map.get(k)!.push(r);
  }
  return [...map.values()].map((rows, i) => ({ code: 'P' + (i + 1), rows }));
}

const uniq = (a: string[]) => [...new Set(a.filter(Boolean))];

function catalogueText(groups: Group[]) {
  return groups
    .map((g) => {
      const r = g.rows[0];
      const parts = [
        g.code,
        r.name,
        r.aliases.length ? 'aka: ' + r.aliases.join('; ') : '',
        'category: ' + r.category,
        'unit: ' + r.unit,
        'sizes: ' + (uniq(g.rows.map((x) => x.size)).join(', ') || '(none)'),
        uniq(g.rows.map((x) => x.material_spec)).length ? 'materials: ' + uniq(g.rows.map((x) => x.material_spec)).join(' | ') : '',
        r.options ? 'options: ' + r.options : '',
      ];
      return parts.filter(Boolean).join(' | ');
    })
    .join('\n');
}

const RULES = `You read customer requests for Fakhri Tools & Workshop Materials Trading LLC (Al Quoz, Dubai), a B2B supplier of carbon steel (CS), stainless steel (SS) and galvanised (GI) pipes, fittings, flanges and valves, plus pipe threading and hose cutting/crimping.

Your job: work out WHICH catalogue products and QUANTITIES the customer wants. You never see or give prices.

How to answer (JSON only, matching the schema):
- lines: one entry per requested item you can match. "product" is the catalogue code (like P12). "size" must be written exactly as one of that product's listed sizes. For items listed as 'X" × smaller' (reducing items), write the real size big end first, like 4" × 2". "material" must be copied exactly from that product's materials list, or "" if the product has only one material or none. "qty" is a number (default 1 if the customer gave none). "customer_wording" = the customer's own words for that item. "confidence" = high, medium or low.
- unmatched: items you cannot match to the catalogue with confidence (not stocked, too vague, or unsure between products). Give the customer's words, your best guess in plain trade English, and qty.
- questions: at most 3 short questions for the customer, most price-critical first, only when a missing detail changes the price (size, material/grade, schedule, end type such as threaded/socket weld/butt weld/flanged, pressure rating).
- warnings: technical warnings, short. Always flag stainless steel joined directly to GI or carbon steel (galvanic corrosion: suggest a dielectric union or insulating kit). Flag pressure ratings that look too low for the stated service.
- suggested_addon: at most one natural add-on, or "" (for example pipe cut & thread for pipes, crimping for hydraulic hoses).

Rules:
- Only use product codes from the catalogue. Never invent products, sizes or prices.
- Decode trade shorthand: "1/2 GI elbow" = GI elbow 90°, ½" (DN15), threaded. Inch sizes with DN: ⅛"=DN6, ¼"=DN8, ⅜"=DN10, ½"=DN15, ¾"=DN20, 1"=DN25, 1¼"=DN32, 1½"=DN40, 2"=DN50, 2½"=DN65, 3"=DN80, 4"=DN100, 5"=DN125, 6"=DN150, 8"=DN200, 10"=DN250, 12"=DN300. Common shorthand: SS=stainless, CS/MS=carbon/mild steel, GI=galvanised, NRV=check valve, F/T or flg=flanged, SW=socket weld, BW=butt weld, Sch=schedule, # or CL=class, WOG/PN=pressure rating, BSP/NPT=thread types.
- If unsure between two products, put the item in unmatched with your best guess, or ask a question. Do not guess silently.
- Photos of parts: identify the part type, likely size, thread type, material, and how confident you are. If the size is unclear, ask for a photo next to a ruler or coin (as one of the questions).
- Photos or PDFs of lists or LPOs: read every line.
- Write everything in simple English for shop staff.`;

const Out = z.object({
  lines: z.array(
    z.object({
      product: z.string(),
      size: z.string(),
      material: z.string(),
      qty: z.number(),
      customer_wording: z.string(),
      confidence: z.enum(['high', 'medium', 'low']),
    }),
  ),
  unmatched: z.array(z.object({ customer_wording: z.string(), best_guess: z.string(), qty: z.number() })),
  questions: z.array(z.string()),
  warnings: z.array(z.string()),
  suggested_addon: z.string(),
});

export type AiFile = { mime: string; data: Buffer; name: string };

export type MatchedLine = {
  product_id: number;
  size_shown: string; // size printed on the quote (for reducers, the real size)
  qty: number;
  customer_wording: string;
  confidence: 'high' | 'medium' | 'low';
};
export type MatchResult = {
  lines: MatchedLine[];
  unmatched: { customer_wording: string; best_guess: string; qty: number }[];
  questions: string[];
  warnings: string[];
  suggested_addon: string;
};

// AI answer (product code + size + material) -> one row of the products table
function resolve(groups: Map<string, Group>, l: z.infer<typeof Out>['lines'][number]) {
  const g = groups.get(l.product.trim().toUpperCase());
  if (!g) return null;
  const want = canonSize(l.size);
  let rows = g.rows.filter((r) => canonSize(r.size) === want);
  let shown = '';
  if (!rows.length) {
    // reducing items: 4" × 2" -> the 4" × smaller row
    const big = want.split('x')[0];
    rows = g.rows.filter((r) => /× smaller$/.test(r.size) && canonSize(r.size).split('x')[0] === big);
    if (rows.length) shown = l.size.trim();
  }
  if (!rows.length && g.rows.length === 1) rows = g.rows;
  if (!rows.length) return null;
  if (rows.length > 1) {
    const m = l.material.trim().toLowerCase();
    const byMat = rows.filter((r) => r.material_spec.toLowerCase() === m);
    if (byMat.length === 1) rows = byMat;
    else if (m) {
      const loose = rows.filter((r) => r.material_spec.toLowerCase().includes(m) || m.includes(r.material_spec.toLowerCase()));
      if (loose.length === 1) rows = loose;
      else return null;
    } else return null;
  }
  const r = rows[0];
  return { row: r, shown: shown || r.size };
}

let client: Anthropic | null = null;
export const hasAiKey = () => !!process.env.ANTHROPIC_API_KEY;

export async function matchRequest(text: string, files: AiFile[]): Promise<MatchResult> {
  if (!hasAiKey()) throw new Error('NO_AI_KEY');
  client ??= new Anthropic();
  const groups = buildGroups(await allProducts());
  const byCode = new Map(groups.map((g) => [g.code, g]));

  const content: Anthropic.ContentBlockParam[] = [];
  for (const f of files) {
    if (f.mime === 'application/pdf') {
      content.push({ type: 'document', source: { type: 'base64', media_type: 'application/pdf', data: f.data.toString('base64') } });
    } else if (/^image\/(jpeg|png|webp|gif)$/.test(f.mime)) {
      content.push({
        type: 'image',
        source: { type: 'base64', media_type: f.mime as 'image/jpeg' | 'image/png' | 'image/webp' | 'image/gif', data: f.data.toString('base64') },
      });
    }
  }
  content.push({
    type: 'text',
    text:
      'Customer request' +
      (files.length ? ` (${files.length} file${files.length > 1 ? 's' : ''} attached above)` : '') +
      ':\n' +
      (text.trim() || '(no text: read the attached files)'),
  });

  const res = await client.messages.parse({
    model: MODEL,
    max_tokens: 16000,
    output_config: { effort: 'medium', format: zodOutputFormat(Out) },
    system: [
      { type: 'text', text: RULES },
      // the catalogue is the same for every request until the owner edits products, so it is cached
      { type: 'text', text: 'CATALOGUE (code | name | other names | category | unit | sizes | materials | options):\n' + catalogueText(groups), cache_control: { type: 'ephemeral' } },
    ],
    messages: [{ role: 'user', content }],
  });

  if (res.stop_reason === 'refusal') throw new Error('AI_REFUSED');
  const out = res.parsed_output;
  if (!out) throw new Error('AI_BAD_OUTPUT');

  const result: MatchResult = {
    lines: [],
    unmatched: [...out.unmatched],
    questions: out.questions.slice(0, 3),
    warnings: out.warnings,
    suggested_addon: out.suggested_addon,
  };
  for (const l of out.lines) {
    const hit = resolve(byCode, l);
    const qty = l.qty > 0 ? l.qty : 1;
    if (hit) result.lines.push({ product_id: hit.row.id, size_shown: hit.shown, qty, customer_wording: l.customer_wording, confidence: l.confidence });
    else {
      const g = byCode.get(l.product.trim().toUpperCase());
      result.unmatched.push({
        customer_wording: l.customer_wording,
        best_guess: [g?.rows[0].name, l.size, l.material].filter(Boolean).join(' '),
        qty,
      });
    }
  }
  return result;
}
