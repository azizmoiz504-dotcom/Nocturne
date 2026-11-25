/* =========================================================
   Sales catalogue app · the order form as a PDF (A4), under the salesman's branch
   FT_ORDER_PDF(order) -> Promise<base64 PDF>
   order = { no, at, brand, accent:[r,g,b], dark:[r,g,b], priced, cust:{...}, shop:{...},
             rows:[{ src, n, group, img, q, p,  code, size ('bam': Bait Al Maqdis)  |  size, spec, mat ('fk': Fakhri Tools) }] }
   priced: the form shows Rate and Amount; a row without a price reads "On request".
   Fakhri Tools products have no prices: the shop confirms them.
   ========================================================= */
(() => {
  'use strict';
  const W = 595.28, H = 841.89, M = 34;
  const C = { ink: [7, 24, 35], mute: [91, 101, 119], light: [244, 246, 248], zebra: [248, 249, 251], line: [222, 226, 232], red: [185, 26, 32], navy: [8, 71, 103], amber: [176, 104, 0], white: [255, 255, 255] };
  const num = v => (Math.round(v * 100) / 100).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  // the PDF's built-in font prints Western European letters; everything else is written out plainly
  const MAP = { '–': '-', '—': '-', '≤': '<=', '≥': '>=', '⅛': '1/8', '⅜': '3/8', '⅝': '5/8', '⅞': '7/8', '⅓': '1/3', '‘': "'", '’': "'", '“': '"', '”': '"', '…': '...', ' ': ' ' };
  const clean = s => String(s == null ? '' : s).replace(/[^\x20-\x7e\xa0-\xff]/g, ch => MAP[ch] !== undefined ? MAP[ch] : '?');
  // text that font can't print (Arabic names and notes) is drawn by the phone, as a picture of the words
  const foreign = s => /[^\x20-\x7e\xa0-\xff]/.test(String(s == null ? '' : s).replace(/[^\x20-\x7e\xa0-\xff]/g, ch => MAP[ch] !== undefined ? MAP[ch] : ch));
  const PX = 4, cv = document.createElement('canvas'), cx = cv.getContext('2d');   // 4 px per pt: sharp when printed
  const cfont = (sz, bold) => (bold ? 'bold ' : '') + (sz * PX) + 'px sans-serif';
  const AR = '\u0600-\u065F\u066A-\u06EF\u06FA-\u06FF\u0750-\u077F\uFB50-\uFDFF\uFE70-\uFEFF';   // Arabic letters, not digits
  const rtlRx = new RegExp('^[^A-Za-z' + AR + ']*[' + AR + ']'), rtlText = s => rtlRx.test(s);
  function measure(s, sz, bold) { cx.font = cfont(sz, bold); return cx.measureText(s).width / PX; }
  function wrapForeign(s, sz, bold, w) {
    const out = [];
    String(s).split(/\r?\n/).forEach(par => {
      let line = '';
      par.split(/\s+/).filter(Boolean).forEach(word => {
        const t = line ? line + ' ' + word : word;
        if (!line || measure(t, sz, bold) <= w) line = t; else { out.push(line); line = word; }
      });
      out.push(line);
    });
    return out;
  }
  function picture(s, sz, bold, col) {
    const w = Math.ceil(measure(s, sz, bold) * PX) + 8, h = Math.ceil(sz * 1.45 * PX);
    const c = document.createElement('canvas'); c.width = w; c.height = h;
    const g = c.getContext('2d'), r = rtlText(s);
    g.font = cfont(sz, bold); g.fillStyle = 'rgb(' + col.join(',') + ')'; g.textBaseline = 'alphabetic';
    g.direction = r ? 'rtl' : 'ltr'; g.textAlign = r ? 'right' : 'left';
    g.fillText(s, r ? w - 4 : 4, Math.round(sz * 1.1 * PX));
    return { url: c.toDataURL('image/png'), w: w / PX, h: h / PX };
  }

  function loadImg(src) {
    return new Promise(res => {
      if (!src) return res(null);
      const i = new Image();
      i.onload = () => res(i); i.onerror = () => res(null);
      i.src = src;
    });
  }
  // photos are shot on white: square JPEG thumbnails, white background
  async function thumb(src, px) {
    const i = await loadImg(src); if (!i || !i.naturalWidth) return null;
    const c = document.createElement('canvas'); c.width = c.height = px;
    const g = c.getContext('2d'); g.fillStyle = '#fff'; g.fillRect(0, 0, px, px);
    const k = Math.min((px - 8) / i.naturalWidth, (px - 8) / i.naturalHeight), w = i.naturalWidth * k, h = i.naturalHeight * k;
    g.drawImage(i, (px - w) / 2, (px - h) / 2, w, h);
    try { return c.toDataURL('image/jpeg', 0.82); } catch (e) { return null; }
  }
  async function logo(src) {
    const i = await loadImg(src); if (!i || !i.naturalWidth) return null;
    const c = document.createElement('canvas'); c.width = i.naturalWidth; c.height = i.naturalHeight;
    const g = c.getContext('2d'); g.fillStyle = '#fff'; g.fillRect(0, 0, c.width, c.height); g.drawImage(i, 0, 0);
    try { return { url: c.toDataURL('image/jpeg', 0.92), r: i.naturalHeight / i.naturalWidth }; } catch (e) { return null; }
  }

  // the PDF maker is only loaded the first time an order form is made
  let lib = null;
  const loadLib = () => lib || (lib = new Promise((res, rej) => {
    if (window.jspdf) return res();
    const s = document.createElement('script'); s.src = 'jspdf.umd.min.js'; s.onload = res; s.onerror = () => { lib = null; rej(new Error('PDF maker missing')); };
    document.head.appendChild(s);
  }));

  window.FT_ORDER_PDF = async function (x) {
    await loadLib();
    const J = window.jspdf && window.jspdf.jsPDF; if (!J) throw new Error('PDF maker missing');
    const doc = new J({ unit: 'pt', format: 'a4', compress: true });
    const shop = x.shop, cu = x.cust || {}, priced = !!x.priced;
    const acc = x.accent || C.red, dark = x.dark || C.navy;
    // a light brand colour (orange) is darkened a little for small text on white
    const accT = (acc[0] * .3 + acc[1] * .59 + acc[2] * .11) > 140 ? acc.map(v => Math.round(v * .78)) : acc;
    const [lg, thumbs] = await Promise.all([logo(shop.logo), Promise.all(x.rows.map(r => thumb(r.img, 140)))]);
    const cur = { st: 'normal', sz: 10, col: C.ink };
    const font = (st, sz, col) => { cur.st = st; cur.sz = sz; cur.col = col || C.ink; doc.setFont('helvetica', st); doc.setFontSize(sz); doc.setTextColor.apply(doc, cur.col); };
    const fill = col => doc.setFillColor.apply(doc, col);
    const stroke = (col, w) => { doc.setDrawColor.apply(doc, col); doc.setLineWidth(w || 0.6); };
    function text(s, xx, yy, o) {
      if (!foreign(s)) return doc.text(clean(s), xx, yy, o);
      const p = picture(String(s), cur.sz, cur.st === 'bold', cur.col), al = o && o.align;
      doc.addImage(p.url, 'PNG', al === 'right' ? xx - p.w + 1 : al === 'center' ? xx - p.w / 2 : xx - 1, yy - cur.sz * 1.1, p.w, p.h);
    }
    const wrap = (s, w) => foreign(s) ? wrapForeign(s, cur.sz, cur.st === 'bold', w) : doc.splitTextToSize(clean(s), w);
    // several lines, spaced like jsPDF spaces them
    const lines = (ls, xx, yy) => ls.some(foreign) ? ls.forEach((l, i) => text(l, xx, yy + i * cur.sz * doc.getLineHeightFactor())) : doc.text(ls, xx, yy);
    const date = new Date(x.at);
    const dateStr = date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) + ', ' + date.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });

    /* ---------- page top ---------- */
    function header(first) {
      fill(acc); doc.rect(0, 0, W, 5, 'F');
      fill(dark); doc.rect(0, 5, W, 1.6, 'F');
      // the logo: wide ones (Fakhri Tools) by width, tall ones (Bait Al Maqdis) by height
      const top = first ? 24 : 20, maxW = first ? 205 : 150, maxH = first ? 72 : 46;
      let lb = top + 34;
      if (lg) { const lw = Math.min(maxW, maxH / lg.r), lh = lw * lg.r; doc.addImage(lg.url, 'JPEG', M, top, lw, lh); lb = top + lh; }
      font('bold', first ? 22 : 15, C.ink); text('ORDER FORM', W - M, first ? 46 : 38, { align: 'right' });
      font('bold', first ? 11.5 : 9.5, accT); text(x.no, W - M, first ? 62 : 51, { align: 'right' });
      font('normal', 8.5, C.mute); text(first ? dateStr : 'continued', W - M, first ? 75 : 62, { align: 'right' });
      if (!first) { const ly = Math.max(74, lb + 8); stroke(C.line, 0.8); doc.line(M, ly, W - M, ly); return ly + 12; }
      const ay = Math.max(86, lb + 12);
      font('normal', 8.2, C.mute);
      text(shop.address, M, ay);
      text([shop.phone && 'Tel ' + shop.phone, shop.wa && 'WhatsApp ' + shop.wa, shop.email].filter(Boolean).join('   ·   '), M, ay + 11);
      stroke(C.line, 0.8); doc.line(M, ay + 22, W - M, ay + 22);
      return ay + 36;
    }
    let y = header(true);

    /* ---------- customer and order details ---------- */
    const bw = (W - 2 * M - 12) / 2, pad = 12;
    const phone = String(cu.phone || '').replace(/[\u0660-\u0669\u06F0-\u06F9]/g, c => c.charCodeAt(0) & 15);   // Arabic digits as 0-9
    const custRows = [['Contact', cu.person], ['Phone', phone], ['Location', cu.site]].filter(r => r[1]);
    const ordRows = [['Order no.', x.no], ['Date', dateStr], ['Delivery', !cu.delivery ? '' : cu.delivery === 'deliver' ? 'Deliver to the customer' : 'Collect from the ' + (shop.pickup || 'shop')], ['Needed by', cu.by ? new Date(cu.by + 'T12:00:00').toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' }) : ''], ['Payment', cu.pay]].filter(r => r[1]);
    font('bold', 12.5); const nameLines = wrap(cu.name || '-', bw - 2 * pad);
    const lineH = 13.5;
    const kvH = rows => rows.reduce((s, r) => { font('normal', 9); return s + wrap(r[1], bw - 2 * pad - 62).length * 11.5 + 2.5; }, 0);
    const bh = Math.max(20 + nameLines.length * 15 + 6 + kvH(custRows), 20 + kvH(ordRows)) + pad;
    function box(bx, title) {
      fill(C.light); doc.roundedRect(bx, y, bw, bh, 7, 7, 'F');
      fill(title === 'CUSTOMER' ? acc : dark); doc.rect(bx, y + 10, 3, 12, 'F');
      font('bold', 7.5, C.mute); doc.setCharSpace(1.2); text(title, bx + pad, y + 19); doc.setCharSpace(0);
    }
    function kv(bx, yy, rows) {
      rows.forEach(r => {
        font('normal', 7.8, C.mute); text(r[0].toUpperCase(), bx + pad, yy);
        font('bold', 9, C.ink); const ls = wrap(r[1], bw - 2 * pad - 62); lines(ls, bx + pad + 62, yy);
        yy += ls.length * 11.5 + 2.5;
      });
    }
    box(M, 'CUSTOMER');
    font('bold', 12.5, C.ink); lines(nameLines, M + pad, y + 37);
    kv(M, y + 37 + nameLines.length * 15 + 4, custRows);
    box(M + bw + 12, 'ORDER DETAILS');
    kv(M + bw + 12, y + 37, ordRows);
    y += bh + 18;

    /* ---------- items ---------- */
    // columns: # · photo · item · size · qty (· rate · amount when priced)
    const col = priced ? { n: M + 8, ph: M + 26, it: M + 76, sz: W - M - 236, q: W - M - 138, r: W - M - 72, a: W - M - 10 }
                       : { n: M + 8, ph: M + 26, it: M + 76, sz: W - M - 132, q: W - M - 10 };
    const itW = col.sz - col.it - 12, szW = col.q - 40 - col.sz;
    function thead() {
      fill(C.ink); doc.roundedRect(M, y, W - 2 * M, 22, 4, 4, 'F');
      font('bold', 7.6, C.white); doc.setCharSpace(1);
      text('#', col.n, y + 14.5); text('ITEM', col.it, y + 14.5); text('SIZE', col.sz, y + 14.5); text('QTY', col.q, y + 14.5, { align: 'right' });
      if (priced) { text('RATE', col.r, y + 14.5, { align: 'right' }); text('AMOUNT', col.a, y + 14.5, { align: 'right' }); }
      doc.setCharSpace(0);
      y += 22;
    }
    const FOOT = 64;
    function newPage(table) { doc.addPage(); y = header(false); if (table) thead(); }
    thead();
    let sum = 0, ask = 0;
    x.rows.forEach((r, i) => {
      font('bold', 9.8); const nl = wrap(r.n, itW);
      const det = [['Part no.', r.code], ['Specs & ratings', r.spec], ['Material', r.mat]].filter(d => d[1]).map(d => { font('normal', 8.3); return { k: d[0], v: d[1], ls: wrap(d[0] + ': ' + d[1], itW) }; });
      font('bold', 9.5); const sl = wrap(r.size || '-', szW);
      const textH = 11 + nl.length * 11.5 + det.reduce((s, d) => s + d.ls.length * 10.5, 0) + 4;
      const rh = Math.max(56, textH + 10, sl.length * 11.5 + 18);
      if (y + rh > H - 50) newPage(true);
      if (i % 2) { fill(C.zebra); doc.rect(M, y, W - 2 * M, rh, 'F'); }
      font('bold', 9, C.mute); text(String(i + 1), col.n, y + 18);
      if (thumbs[i]) { stroke(C.line, 0.6); doc.roundedRect(col.ph - 1, y + 7, 42, 42, 4, 4, 'S'); doc.addImage(thumbs[i], 'JPEG', col.ph, y + 8, 40, 40); }
      else { fill(C.light); doc.roundedRect(col.ph - 1, y + 7, 42, 42, 4, 4, 'F'); }
      let ty = y + 15;
      font('normal', 6.8, C.mute); doc.setCharSpace(0.8); text(String(r.group || '').toUpperCase(), col.it, ty); doc.setCharSpace(0);
      ty += 11;
      font('bold', 9.8, C.ink); lines(nl, col.it, ty); ty += nl.length * 11.5;
      det.forEach(d => {
        d.ls.forEach((l, j) => {
          const tc = /to confirm/.test(d.v);
          if (j === 0) {
            font('normal', 8.3, C.mute); text(d.k + ':', col.it, ty);
            const kw = doc.getTextWidth(d.k + ': ');
            font(tc ? 'bold' : 'normal', 8.3, tc ? C.amber : C.ink); text(l.slice(d.k.length + 2), col.it + kw, ty);
          } else { font(tc ? 'bold' : 'normal', 8.3, tc ? C.amber : C.ink); text(l, col.it, ty); }
          ty += 10.5;
        });
      });
      font('bold', 9.5, /to confirm/.test(r.size) ? C.amber : C.ink); lines(sl, col.sz, y + 26);
      font('bold', 12, C.ink); text(String(r.q), col.q, y + 26, { align: 'right' });
      font('normal', 7, C.mute); text('pcs', col.q, y + 36, { align: 'right' });
      if (priced) {
        if (r.p != null) {
          const amt = r.p * r.q; sum += amt;
          font('normal', 9, C.ink); text(num(r.p), col.r, y + 26, { align: 'right' });
          font('bold', 9.5, C.ink); text(num(amt), col.a, y + 26, { align: 'right' });
        } else { ask++; font('bold', 7.8, C.amber); text('On request', col.a, y + 26, { align: 'right' }); }
      }
      y += rh;
      stroke(C.line, 0.5); doc.line(M, y, W - M, y);
    });

    /* ---------- totals, note, signatures ---------- */
    const pcs = x.rows.reduce((s, r) => s + (+r.q || 0), 0);
    const count = x.rows.length + (x.rows.length === 1 ? ' item' : ' items') + '  ·  ' + pcs + ' pcs';
    if (y + (priced ? 70 : 40) > H - FOOT) newPage();
    y += 10;
    if (priced) {
      const tw = 240, tx = W - M - tw;
      fill(C.light); doc.roundedRect(tx, y, tw, ask ? 72 : 52, 5, 5, 'F');
      font('normal', 8.5, C.mute); text(count, tx + 12, y + 17);
      fill(dark); doc.roundedRect(tx, y + 24, tw, 28, 5, 5, 'F');
      font('bold', 7.8, C.white); doc.setCharSpace(1); text('TOTAL (AED)', tx + 12, y + 42); doc.setCharSpace(0);
      font('bold', 13, C.white); text(num(sum), W - M - 12, y + 43, { align: 'right' });
      if (ask) { font('bold', 7.8, C.amber); text(ask + (ask === 1 ? ' item' : ' items') + ' marked On request, quoted separately', W - M - 12, y + 64, { align: 'right' }); }
      y += (ask ? 72 : 52) + 16;
    } else {
      fill(C.light); doc.roundedRect(W - M - 210, y, 210, 30, 5, 5, 'F');
      font('bold', 7.8, C.mute); doc.setCharSpace(1); text('TOTAL', W - M - 198, y + 19); doc.setCharSpace(0);
      font('bold', 11.5, C.ink); text(count, W - M - 12, y + 19.5, { align: 'right' });
      y += 46;
    }
    if (cu.note) {
      font('normal', 9); const nl = wrap(cu.note, W - 2 * M - 24);
      const nh = 26 + nl.length * 11.5;
      if (y + nh > H - FOOT) newPage();
      fill([255, 248, 235]); doc.roundedRect(M, y, W - 2 * M, nh, 6, 6, 'F');
      font('bold', 7.5, C.amber); doc.setCharSpace(1.2); text('NOTE', M + 12, y + 15); doc.setCharSpace(0);
      font('normal', 9, C.ink); lines(nl, M + 12, y + 28);
      y += nh + 14;
    }
    const hasFk = x.rows.some(r => /to confirm/.test([r.size, r.spec, r.mat].join(' ')));
    const say = [];
    if (!priced) say.push('Prices and stock are confirmed by ' + shop.short + ' before delivery or collection.');
    else if (ask) say.push('Items marked "On request" are priced by ' + shop.short + ' separately.');
    if (hasFk) say.push('Anything marked "to confirm" is checked with the customer first.');
    font('normal', 8.3); const info = wrap(say.join(' '), W - 2 * M);
    if (y + info.length * 11 + 92 > H - FOOT) newPage();
    font('normal', 8.3, C.mute); if (say.length) lines(info, M, y); y += (say.length ? info.length * 11 : 0) + 48;
    stroke(C.ink, 0.7);
    doc.line(M, y, M + bw, y); doc.line(M + bw + 12, y, W - M, y);
    font('bold', 8, C.ink); text('Customer name, signature & stamp', M, y + 13); text('For ' + shop.name, M + bw + 12, y + 13);
    font('normal', 7.8, C.mute); text('Date:', M, y + 26); text('Date:', M + bw + 12, y + 26);

    /* ---------- footer on every page ---------- */
    const n = doc.getNumberOfPages();
    for (let p = 1; p <= n; p++) {
      doc.setPage(p);
      stroke(C.line, 0.6); doc.line(M, H - 40, W - M, H - 40);
      font('normal', 7.5, C.mute);
      text(shop.name + '  ·  ' + shop.city, M, H - 27);
      text(x.no + '  ·  Page ' + p + ' of ' + n, W - M, H - 27, { align: 'right' });
    }
    return btoa(doc.output());
  };
})();
