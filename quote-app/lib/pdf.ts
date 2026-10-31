import 'server-only';
import fs from 'node:fs';
import path from 'node:path';
import { PDFDocument, rgb, type PDFFont, type PDFPage, type PDFImage } from 'pdf-lib';
import fontkit from '@pdf-lib/fontkit';
import type { Settings } from './db';
import { aed } from './money';

// The customer PDF. It is built from the STAFF view of a quote (no cost, markup or profit fields exist in it).
export type PdfQuote = {
  quote_no: string;
  created_at: Date | string;
  customer_name: string;
  customer_company: string;
  lines: { description: string; size: string; qty: number; unit: string; unit_sell: number | null; line_total: number | null }[];
  subtotal: number;
  vat: number;
  grand_total: number;
};

const RED = rgb(0.725, 0.102, 0.125);
const NAVY = rgb(0.031, 0.278, 0.404);
const GREY = rgb(0.35, 0.35, 0.38);
const LIGHT = rgb(0.95, 0.95, 0.96);
const BLACK = rgb(0.1, 0.1, 0.12);

const FONT = () => fs.readFileSync(path.join(process.cwd(), 'fonts', 'DejaVuSans.ttf'));
const FONT_BOLD = () => fs.readFileSync(path.join(process.cwd(), 'fonts', 'DejaVuSans-Bold.ttf'));
const DEFAULT_LOGO = () => fs.readFileSync(path.join(process.cwd(), 'public', 'logo.png'));

function wrap(text: string, font: PDFFont, size: number, width: number): string[] {
  const out: string[] = [];
  for (const para of String(text || '').split('\n')) {
    let line = '';
    for (const word of para.split(/\s+/)) {
      const t = line ? line + ' ' + word : word;
      if (font.widthOfTextAtSize(t, size) <= width) line = t;
      else {
        if (line) out.push(line);
        // a single very long word: cut it
        let w = word;
        while (font.widthOfTextAtSize(w, size) > width && w.length > 1) {
          let k = w.length;
          while (k > 1 && font.widthOfTextAtSize(w.slice(0, k), size) > width) k--;
          out.push(w.slice(0, k));
          w = w.slice(k);
        }
        line = w;
      }
    }
    out.push(line);
  }
  return out;
}

const fmtQty = (n: number) => (Number.isInteger(n) ? String(n) : String(Math.round(n * 1000) / 1000));

function dubaiDate(d: Date | string) {
  return new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', timeZone: 'Asia/Dubai' });
}

export async function buildQuotePdf(q: PdfQuote, s: Settings, logo: { mime: string; data: Buffer } | null): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  doc.registerFontkit(fontkit);
  const font = await doc.embedFont(FONT(), { subset: true });
  const bold = await doc.embedFont(FONT_BOLD(), { subset: true });
  doc.setTitle(`Quotation ${q.quote_no}`);
  doc.setAuthor(s.company_name);
  doc.setCreator('Fakhri Quote');

  let img: PDFImage | null = null;
  try {
    const src = logo ?? { mime: 'image/png', data: DEFAULT_LOGO() };
    img = /png/.test(src.mime) ? await doc.embedPng(src.data) : await doc.embedJpg(src.data);
  } catch {
    img = null;
  }

  const W = 595.28, H = 841.89, M = 40;
  // table columns: #, description, size, qty, unit, unit price, total
  const cols = [
    { k: '#', w: 22, a: 'l' },
    { k: 'Description', w: 190, a: 'l' },
    { k: 'Size', w: 70, a: 'l' },
    { k: 'Qty', w: 40, a: 'r' },
    { k: 'Unit', w: 38, a: 'l' },
    { k: 'Unit price (AED)', w: 77, a: 'r' },
    { k: 'Total (AED)', w: 78, a: 'r' },
  ] as const;

  let page: PDFPage = doc.addPage([W, H]);
  let y = H - M;
  const pages: PDFPage[] = [page];

  const text = (p: PDFPage, t: string, x: number, yy: number, size: number, f: PDFFont = font, color = BLACK) =>
    p.drawText(t, { x, y: yy, size, font: f, color });
  const right = (p: PDFPage, t: string, xr: number, yy: number, size: number, f: PDFFont = font, color = BLACK) =>
    p.drawText(t, { x: xr - f.widthOfTextAtSize(t, size), y: yy, size, font: f, color });

  // ---- header ----
  if (img) {
    const h = 46, w = Math.min(260, (img.width / img.height) * h);
    page.drawImage(img, { x: M, y: y - h, width: w, height: (w / img.width) * img.height });
  }
  let hy = y - 8;
  const info = [
    s.company_name,
    s.address,
    s.whatsapp ? 'WhatsApp: ' + s.whatsapp : '',
    [s.phone ? 'Tel: ' + s.phone : '', s.email ? s.email : ''].filter(Boolean).join('   '),
    s.trn ? 'TRN: ' + s.trn : '',
  ].filter(Boolean);
  info.forEach((t, i) => {
    for (const ln of wrap(t, i === 0 ? bold : font, i === 0 ? 9 : 8.5, 230)) {
      right(page, ln, W - M, hy, i === 0 ? 9 : 8.5, i === 0 ? bold : font, i === 0 ? NAVY : GREY);
      hy -= 11.5;
    }
  });
  y = Math.min(y - 60, hy - 6);
  page.drawRectangle({ x: M, y, width: W - 2 * M, height: 2, color: RED });
  y -= 30;

  text(page, 'QUOTATION', M, y, 20, bold, NAVY);
  const meta = [
    ['Quote no.', q.quote_no],
    ['Date', dubaiDate(q.created_at)],
    ['Valid for', `${s.quote_validity_days} days`],
  ];
  let my = y + 8;
  for (const [k, v] of meta) {
    right(page, k + ':', W - M - 110, my, 9, font, GREY);
    text(page, v, W - M - 104, my, 9, bold);
    my -= 13;
  }
  y -= 34;
  const cust = [q.customer_company, q.customer_name].filter(Boolean);
  if (cust.length) {
    text(page, 'To:', M, y, 9, font, GREY);
    cust.forEach((c, i) => text(page, c, M + 22, y - i * 13, 10, i === 0 ? bold : font));
    y -= cust.length * 13 + 10;
  } else y -= 4;

  // ---- table ----
  const drawHead = (p: PDFPage, yy: number) => {
    p.drawRectangle({ x: M, y: yy - 6, width: W - 2 * M, height: 20, color: NAVY });
    let x = M;
    for (const c of cols) {
      if (c.a === 'r') right(p, c.k, x + c.w - 4, yy, 8, bold, rgb(1, 1, 1));
      else text(p, c.k, x + 4, yy, 8, bold, rgb(1, 1, 1));
      x += c.w;
    }
    return yy - 22;
  };
  y = drawHead(page, y);

  const fs9 = 8.6, lh = 11;
  q.lines.forEach((l, i) => {
    const desc = wrap(l.description, font, fs9, cols[1].w - 8);
    const size = wrap(l.size || '', font, fs9, cols[2].w - 8);
    const n = Math.max(desc.length, size.length, 1);
    const h = n * lh + 6;
    if (y - h < M + 40) {
      page = doc.addPage([W, H]);
      pages.push(page);
      y = drawHead(page, H - M);
    }
    if (i % 2 === 1) page.drawRectangle({ x: M, y: y - h + lh - 2, width: W - 2 * M, height: h, color: LIGHT });
    let x = M;
    const cells: (string | string[])[] = [
      String(i + 1),
      desc,
      size,
      fmtQty(l.qty),
      l.unit,
      l.unit_sell == null ? 'On request' : aed(l.unit_sell),
      l.line_total == null ? '—' : aed(l.line_total),
    ];
    cells.forEach((c, ci) => {
      const lines = Array.isArray(c) ? c : [c];
      lines.forEach((t, li) => {
        if (cols[ci].a === 'r') right(page, t, x + cols[ci].w - 4, y - li * lh, fs9);
        else text(page, t, x + 4, y - li * lh, fs9);
      });
      x += cols[ci].w;
    });
    y -= h;
  });

  // ---- totals ----
  if (y < M + 200) {
    page = doc.addPage([W, H]);
    pages.push(page);
    y = H - M;
  }
  y -= 8;
  page.drawLine({ start: { x: W - M - 220, y: y + 10 }, end: { x: W - M, y: y + 10 }, thickness: 0.6, color: GREY });
  const tot: [string, string, boolean][] = [
    ['Subtotal', 'AED ' + aed(q.subtotal), false],
    ['VAT 5%', 'AED ' + aed(q.vat), false],
    ['Grand total', 'AED ' + aed(q.grand_total), true],
  ];
  for (const [k, v, b] of tot) {
    if (b) page.drawRectangle({ x: W - M - 220, y: y - 6, width: 220, height: 20, color: LIGHT });
    text(page, k, W - M - 214, y, b ? 10.5 : 9.5, b ? bold : font);
    right(page, v, W - M - 6, y, b ? 10.5 : 9.5, b ? bold : font);
    y -= b ? 24 : 16;
  }
  if (q.lines.some((l) => l.unit_sell == null)) {
    text(page, 'Items marked "On request" are not included in the total. We will confirm their price.', M, y, 8.5, font, GREY);
    y -= 14;
  }

  // ---- notes ----
  y -= 10;
  const notes = [s.validity_note, s.delivery_note, s.payment_terms].filter((x) => x && x.trim());
  if (notes.length) {
    text(page, 'Notes', M, y, 10, bold, NAVY);
    y -= 14;
    for (const n of notes) {
      for (const ln of wrap('• ' + n, font, 8.8, W - 2 * M)) {
        text(page, ln, M, y, 8.8, font, BLACK);
        y -= 12;
      }
    }
  }
  y -= 14;
  if (y > M + 10) text(page, 'Thank you for your enquiry. To order, reply on WhatsApp ' + (s.whatsapp || '') + ' with this quote number.', M, y, 8.5, font, GREY);

  // page numbers
  pages.forEach((p, i) => {
    right(p, `${q.quote_no}  ·  Page ${i + 1} of ${pages.length}`, W - M, 22, 7.5, font, GREY);
  });

  return doc.save();
}
