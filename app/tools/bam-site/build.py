#!/usr/bin/env python3
"""Builds the Bait Al Maqdis products website, with no prices, from the private catalogue in app/bam/.

    python3 app/tools/bam-site/build.py [--bam DIR] [--out DIR] [--design v1|v2]

Writes app/build/bait-al-maqdis/ (default): English pages, Arabic pages in ar/, photos, the printed catalogues
and a search list. --design v2 builds the new look (v2/templates, v2/static) into app/build/bait-al-maqdis-new/. Every link is relative, so the folder works at any address; it is published at
<website>/bait-al-maqdis/.
Prices never leave this script: a product's lines are read as [part no., size] only (public_rows), and
check_no_prices() looks through everything written before the build counts as done.
"""
import argparse, datetime, hashlib, json, os, re, shutil, subprocess, sys, tempfile
from urllib.parse import quote
from PIL import Image
import jinja2
from markupsafe import Markup, escape

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
sys.path.insert(0, os.path.join(HERE, '..', 'bam-editor'))
from bamdata import APP, load
from i18n import EXTRA_AR, JS_KEYS, S, t

# Bait Al Maqdis's own details, from their app and printed catalogues. WhatsApp: digits only (971...), '' = no WhatsApp button
CONTACT = {
    'phone': '+971 6 529 4533', 'tel': '+97165294533', 'email': 'baitalmaqdisuae@gmail.com',
    'whatsapp': '', 'whatsapp_show': '',
    'maps': 'https://www.google.com/maps/search/?api=1&query=' + quote('Bait Al Maqdis Building Materials Trading, Jurf Industrial Zone 1, Ajman'),
}
URL = 'https://azizmoiz504-dotcom.github.io/Nocturne/bait-al-maqdis/'   # where it is published: only for the picture shown when a link is shared
DESIGNS = {   # where each look keeps its pages and files, where it is built and where it is published
    'v1': {'dir': '.', 'out': 'bait-al-maqdis', 'url': URL},
    'v2': {'dir': 'v2', 'out': 'bait-al-maqdis-new', 'url': 'https://azizmoiz504-dotcom.github.io/Nocturne/bait-al-maqdis-new/'},
}
WALL_CELL, WALL_COLS = 96, 25   # the home page's wall of every product: one small square per product in one picture
BIG = 100            # a range with at least this many products gets a big tile on the home page
PHOTO = 640          # longest side of product photos on the site
SPEC = 1600          # longest side of the specifications pictures
COVER = 720          # longest side of the range pictures
LANGS = ('en', 'ar')

# the arcade on the home page, drawn on a 1000 x 820 plan with the floor at 740: x, width, top of the arch
FLOOR, PLAN_W, PLAN_H = 740, 1000, 820
ARCHES = [(110, 110, 478), (262, 124, 430), (420, 160, 372), (614, 124, 430), (780, 110, 478)]

ICONS = {
    'search': '<circle cx="10.5" cy="10.5" r="6.5"/><path d="m15.5 15.5 5 5"/>',
    'sun': '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>',
    'moon': '<path d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5z"/>',
    'list': '<path d="M9 4h6a1 1 0 0 1 1 1v1H8V5a1 1 0 0 1 1-1z"/><path d="M8 5H6a1 1 0 0 0-1 1v14a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V6a1 1 0 0 0-1-1h-2"/><path d="M9 11h6M9 15h4"/>',
    'x': '<path d="M6 6l12 12M18 6L6 18"/>',
    'info': '<circle cx="12" cy="12" r="9"/><path d="M12 11v5M12 8h.01"/>',
    'mail': '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="m4 7 8 6 8-6"/>',
    'print': '<path d="M7 9V3h10v6"/><rect x="3" y="9" width="18" height="8" rx="2"/><path d="M7 14h10v7H7z"/>',
    'copy': '<rect x="8" y="8" width="12" height="12" rx="2"/><path d="M16 8V5a1 1 0 0 0-1-1H5a1 1 0 0 0-1 1v10a1 1 0 0 0 1 1h3"/>',
    'arrow': '<path class="flip" d="M5 12h14M13 6l6 6-6 6"/>',
    'pin': '<path d="M12 21s-7-6.2-7-11.5A7 7 0 0 1 19 9.5C19 14.8 12 21 12 21z"/><circle cx="12" cy="9.5" r="2.5"/>',
    'phone': '<path d="M5 4h3l2 5-2.5 1.5a11 11 0 0 0 6 6L15 14l5 2v3a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2"/>',
    'down': '<path d="M6 9l6 6 6-6"/>',
    'book': '<path d="M4 5a2 2 0 0 1 2-2h13v16H6a2 2 0 0 0-2 2z"/><path d="M4 19V5M19 19v2H6"/>',
    'plus': '<path class="i-plus" d="M12 5v14M5 12h14"/>',
    'check': '<path class="i-check" d="M5 12.5l4.5 4.5L19 7.5"/>',
    'wa': '<path fill="currentColor" stroke="none" d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2zm0 18.2c-1.6 0-3.1-.4-4.4-1.2l-.3-.2-3 .8.8-2.9-.2-.3A8.2 8.2 0 1 1 12 20.2zm4.5-6.1c-.2-.1-1.5-.7-1.7-.8-.2-.1-.4-.1-.6.1l-.8 1c-.1.2-.3.2-.5.1a6.7 6.7 0 0 1-3.3-2.9c-.2-.4.2-.4.7-1.3.1-.2 0-.3 0-.4l-.8-1.8c-.2-.5-.4-.4-.6-.4h-.5c-.2 0-.4.1-.7.3-.2.2-.9.9-.9 2.2s.9 2.6 1.1 2.7c.1.2 1.8 2.8 4.4 3.9 1.6.7 2.3.8 3.1.6.5-.1 1.5-.6 1.7-1.2.2-.6.2-1.1.1-1.2l-.7-.3z"/>',
    'box': '<path d="M3.5 7.5 12 3l8.5 4.5v9L12 21l-8.5-4.5z"/><path d="M3.5 7.5 12 12l8.5-4.5M12 12v9"/>',
    'dome': '<path d="M10.5 3.2a1.6 1.6 0 0 0 3 0"/><path d="M12 4.6v2"/><path d="M6.5 13C6.5 9 9 6.6 12 6.6S17.5 9 17.5 13"/><path d="M5.5 13h13M6 13v2M18 13v2M3.5 15h17"/><path d="M6 21v-3a1.5 1.5 0 0 1 3 0v3M10.5 21v-3.5a1.5 1.5 0 0 1 3 0V21M15 21v-3a1.5 1.5 0 0 1 3 0v3M3 21h18"/>',
}


JS_ICONS = ('x', 'arrow', 'plus', 'check', 'mail', 'copy', 'info', 'dome', 'list', 'search', 'box')   # drawn by the page's script


def icon(name, cls=''):
    return Markup('<svg class="ico ico--%s%s" viewBox="0 0 24 24" aria-hidden="true" focusable="false">%s</svg>' % (name, (' ' + cls) if cls else '', ICONS[name]))


def slug(s):
    s = s.lower().replace('"', ' inch ').replace("'", '').replace('&', ' and ').replace('½', ' half ')
    return re.sub(r'[^a-z0-9]+', '-', s).strip('-')[:70].strip('-') or 'item'


def public_rows(item):
    """the only way product lines leave the catalogue: [part no., size], never the price"""
    def clean(v):
        v = str(v).strip() if v is not None else ''
        return None if v in ('', '-', '—', '–') else v      # their sheets use a dash for "no size"
    return [[clean(r[0]), clean(r[1])] for r in item.get('r') or []]


def split_words(html):
    """the big titles rise word by word: each word in its own span, <em> words kept in italics"""
    out, i, em = [], 0, False
    for tok in re.split(r'(<em>|</em>|\s+)', html):
        if tok == '<em>': em = True; continue
        if tok == '</em>': em = False; continue
        if not tok or tok.isspace(): continue
        w = str(escape(Markup(tok).unescape()))
        out.append('<span class="w"><span class="w__i" style="--i:%d">%s</span></span>' % (i, ('<em>%s</em>' % w) if em else w))
        i += 1
    return Markup(' '.join(out))


class Site:
    def __init__(self, bam, out, url=URL, design='v1'):
        self.bam, self.out, self.url, self.design = bam, out, url, design
        self.dir = os.path.normpath(os.path.join(HERE, DESIGNS[design]['dir']))
        self.clean = {}
        self.written = set()
        self.data, ar = load(bam)
        self.dict = ar['dict']
        self.low = {k.lower(): v for k, v in self.dict.items()}
        self.specw = ar.get('spec', {})
        self.sizes = {}

    # ---------- Arabic from their own word list ----------
    def ar(self, s):
        if not s: return ''
        return self.dict.get(s) or self.low.get(re.sub(r'\s+', ' ', str(s)).strip().lower()) or EXTRA_AR.get(s) or ''

    def ar_size(self, s):
        return re.sub(r'[A-Za-z]+', lambda m: self.specw.get(m.group(0).upper(), m.group(0)), s) if s else ''

    # ---------- files ----------
    def path(self, rel):
        p = os.path.join(self.out, rel)
        os.makedirs(os.path.dirname(p), exist_ok=True)
        self.written.add(os.path.normpath(rel))
        return p

    def write(self, rel, text):
        p = self.path(rel)
        with open(p + '.part', 'w', encoding='utf-8') as fh: fh.write(text)
        os.replace(p + '.part', p)

    def photo(self, rel, side):
        """a lighter copy of one of their photos (never made bigger, never re-cropped); returns (path, w, h)"""
        src = os.path.join(self.bam, rel)
        if not os.path.isfile(src): return None
        dst_rel = 'img/' + os.path.splitext(rel)[0] + '.jpg'
        dst = self.path(dst_rel)
        if not os.path.isfile(dst) or os.path.getmtime(dst) < os.path.getmtime(src):
            im = Image.open(src)
            if im.mode in ('RGBA', 'LA', 'P'):
                im = im.convert('RGBA'); bg = Image.new('RGB', im.size, (255, 255, 255)); bg.paste(im, mask=im.split()[-1]); im = bg
            im = im.convert('RGB'); im.thumbnail((side, side), Image.LANCZOS)
            im.save(dst + '.part', 'JPEG', quality=84, optimize=True, progressive=True); os.replace(dst + '.part', dst)
        if dst_rel not in self.sizes:
            with Image.open(dst) as im: self.sizes[dst_rel] = im.size
        w, h = self.sizes[dst_rel]
        return dst_rel, w, h

    # ---------- the catalogue, without prices ----------
    def gather(self):
        cats = self.data['cats']
        spec_paths = {p for c in cats for s in c['secs'] for it in s['items'] for p in (it.get('spec') or [])}
        self.ranges, lines = [], 0
        for ci, c in enumerate(cats):
            r = {'id': c['id'], 'vt': re.sub(r'[^a-z0-9-]', '', c['id']) or 'r%d' % ci, 'no': ci + 1,
                 'name': {'en': c['name'], 'ar': self.ar(c['name']) or c['name']},
                 'title': {'en': '', 'ar': ''}, 'lede': {'en': c.get('lede') or '', 'ar': self.ar(c.get('lede'))}, 'groups': [], 'items': []}
            tl = (c.get('title') or '').strip()
            if tl and tl.lower() not in (c['name'].lower(), 'bait al maqdis'):
                r['title'] = {'en': tl, 'ar': self.ar(tl)}
            cov = self.photo(c['cover'], COVER) if c.get('cover') else None
            seen = set()
            for si, s in enumerate(c['secs']):
                gs = slug(s['n']); k = 2
                while gs in {g['slug'] for g in r['groups']}: gs = '%s-%d' % (slug(s['n']), k); k += 1
                g = {'slug': gs, 'name': {'en': s['n'], 'ar': self.ar(s['n']) or s['n']}, 'items': [], 'thumb': ''}
                gi = len(r['groups'])      # its place among the groups shown (empty ones are left out)
                for it in s['items']:
                    rows = public_rows(it)
                    lines += len(rows)
                    base = slug(it['n'] + ' ' + (rows[0][0] or '' if rows else ''))
                    ps, k = base, 2
                    while ps in seen: ps = '%s-%d' % (base, k); k += 1
                    seen.add(ps)
                    ph = self.photo(it['img'], PHOTO) if it.get('img') else None
                    specs = [x for x in (self.photo(sp, SPEC) for sp in (it.get('spec') or [])) if x]
                    p = {'slug': ps, 'name': {'en': it['n'], 'ar': self.ar(it['n']) or it['n']}, 'rows': rows,     # no Arabic name yet: the English one
                         'img': ph[0] if ph else '', 'w': ph[1] if ph else 0, 'h': ph[2] if ph else 0, 'range': c['id'],
                         'square': bool(ph) and it['img'] not in spec_paths and 0.8 <= ph[1] / ph[2] <= 1.25,
                         'specs': [x[0] for x in specs], 'g': gi}
                    if ph and not g['thumb']: g['thumb'] = ph[0]
                    g['items'].append(p); r['items'].append(p)
                if g['items']: r['groups'].append(g)
            r['count'] = len(r['items'])
            r['lines'] = sum(len(p['rows']) for p in r['items'])
            if cov: r['cover'], r['cover_w'], r['cover_h'] = cov
            else:
                first = next((p for p in r['items'] if p['img']), None)
                r['cover'], r['cover_w'], r['cover_h'] = (first['img'], first['w'], first['h']) if first else ('', 0, 0)
            r['big'] = r['count'] >= BIG
            if r['items']: self.ranges.append(r)
        self.stats = {'products': sum(r['count'] for r in self.ranges), 'ranges': len(self.ranges),
                      'groups': sum(len(r['groups']) for r in self.ranges), 'lines': lines, 'lines_fmt': '{:,}'.format(lines)}

    def pdfs(self):
        out = []
        for b in self.data.get('pdfs') or []:
            src = os.path.join(self.bam, b['file'])
            if not os.path.isfile(src): continue
            name = os.path.basename(b['file']); stem = os.path.splitext(name)[0]
            dst = self.path('catalogues/' + name)
            if not os.path.isfile(dst) or os.path.getmtime(dst) < os.path.getmtime(src): shutil.copyfile(src, dst)
            cover_rel = 'img/pdf/%s.jpg' % stem; cover = self.path(cover_rel)
            if not os.path.isfile(cover) or os.path.getmtime(cover) < os.path.getmtime(src):
                with tempfile.TemporaryDirectory() as tmp:
                    subprocess.run(['pdftoppm', '-f', '1', '-l', '1', '-r', '110', '-jpeg', src, os.path.join(tmp, 'c')], check=True)
                    im = Image.open(os.path.join(tmp, sorted(os.listdir(tmp))[0])).convert('RGB')
                    # a plain white band at the foot of the cover page is trimmed, so the cover fills its frame
                    g = im.convert('L'); w, h = g.size; foot = h
                    while foot > h * 0.9 and min(g.crop((0, foot - 1, w, foot)).getextrema()) > 245: foot -= 1
                    if foot < h - 4: im = im.crop((0, 0, w, foot))
                    im.thumbnail((620, 900), Image.LANCZOS)
                    im.save(cover, 'JPEG', quality=84, optimize=True, progressive=True)
            with Image.open(cover) as im: cw, ch = im.size
            info = subprocess.run(['pdfinfo', src], capture_output=True, text=True).stdout
            pages = int(re.search(r'Pages:\s+(\d+)', info).group(1))
            rid = next((r['id'] for r in self.ranges if stem.startswith(r['id'])), '')
            rng = next((r for r in self.ranges if r['id'] == rid), None)
            title_ar = self.ar(b.get('title')) or (('كتالوج ' + rng['name']['ar']) if rng and rng['name']['ar'] else '')
            d = {'file': 'catalogues/' + name, 'cover': cover_rel, 'cover_w': cw, 'cover_h': ch, 'pages': pages,
                 'mb': '%.1f' % (os.path.getsize(src) / 1e6), 'range': rid,
                 'title': {'en': b.get('title') or stem, 'ar': title_ar or b.get('title') or stem},
                 'sub': {'en': b.get('sub') or '', 'ar': self.ar(b.get('sub')) or (rng['lede']['ar'] if rng else '')}}
            out.append(d)
            if rng: rng['pdf'] = d
        return out

    def arcade(self):
        """5 arches, each showing a few of their own product photos in turn, taken evenly from every range"""
        pools = [[p for p in r['items'] if p['square']] for r in self.ranges]
        for pool in pools: pool.sort(key=lambda p: hashlib.sha1(p['slug'].encode()).hexdigest())
        picks, i = [], 0
        while len(picks) < len(ARCHES) * 6 and any(pools):
            pool = pools[i % len(pools)]
            if pool: picks.append(pool.pop(0)['img'])
            i += 1
        arches = []
        for n, (x, w, top) in enumerate(ARCHES):
            r = w / 2; h = FLOOR - top
            arches.append({'x': x, 'w': w, 'r': r, 'spring': top + r, 'left': round(x / PLAN_W * 100, 3), 'top': round(top / PLAN_H * 100, 3),
                           'width': round(w / PLAN_W * 100, 3), 'height': round(h / PLAN_H * 100, 3), 'ry': round(r / h * 100, 3),
                           'photos': picks[n::len(ARCHES)] or picks[:1]})
        return arches

    # ---------- the new look (v2): the wall of products, the departures board, the featured ranges ----------
    def is_clean(self, rel):
        """a photo on plain white: (nearly) all of its edge is white, so it can stand on the page without its box"""
        if rel not in self.clean:
            with Image.open(os.path.join(self.out, rel)) as im:
                g = im.convert('L'); w, h = g.size; b = max(2, int(min(w, h) * .02))
                edges = [g.crop((0, 0, w, b)), g.crop((0, h - b, w, h)), g.crop((0, 0, b, h)), g.crop((w - b, 0, w, h))]
                white = sum(sum(e.histogram()[240:]) for e in edges)
                self.clean[rel] = white / sum(e.width * e.height for e in edges) >= 0.96
        return self.clean[rel]

    def wall(self):
        """every product in one picture, a small square each (in catalogue order), and the list the page needs to place them"""
        items = [p for r in self.ranges for p in r['items']]
        rows = -(-len(items) // WALL_COLS)
        atlas = Image.new('RGB', (WALL_COLS * WALL_CELL, rows * WALL_CELL), (255, 255, 255))
        pad = int(WALL_CELL * .06)
        for i, p in enumerate(items):
            if not p['img']: continue
            with Image.open(os.path.join(self.out, p['img'])) as im:
                im = im.convert('RGB'); im.thumbnail((WALL_CELL - 2 * pad, WALL_CELL - 2 * pad), Image.LANCZOS)
                x, y = (i % WALL_COLS) * WALL_CELL, (i // WALL_COLS) * WALL_CELL
                atlas.paste(im, (x + (WALL_CELL - im.width) // 2, y + (WALL_CELL - im.height) // 2))
        dst = self.path('img/wall.webp')
        atlas.save(dst + '.part', 'WEBP', quality=72, method=6); os.replace(dst + '.part', dst)
        av = hashlib.sha1(open(dst, 'rb').read()).hexdigest()[:10]
        rix = {r['id']: i for i, r in enumerate(self.ranges)}
        first = lambda p: next((c for c, _ in p['rows'] if c), '')
        tiles = [[rix[p['range']], p['slug'], p['name']['en'], p['name']['ar'], first(p), p['img'], 1 if p['img'] and self.is_clean(p['img']) else 0] for p in items]
        # the departures board: products with a part number and a size, taken in turn from every range
        pools = [[p for p in r['items'] if any(c and z for c, z in p['rows'])] for r in self.ranges]
        for pool in pools: pool.sort(key=lambda p: hashlib.sha1(('b' + p['slug']).encode()).hexdigest())
        board, i = [], 0
        while len(board) < 48 and any(pools):
            pool = pools[i % len(pools)]
            if pool:
                p = pool.pop(0); c, z = next((c, z) for c, z in p['rows'] if c and z)
                board.append([c, p['name']['en'], p['name']['ar'], z, self.ar_size(z), rix[p['range']], p['slug']])
            i += 1
        self.board = board
        data = {'cell': WALL_CELL, 'cols': WALL_COLS, 'src': 'img/wall.webp?v=' + av,
                'r': [[r['id'], r['name']['en'], r['name']['ar'], r['count']] for r in self.ranges], 't': tiles, 'b': board}
        text = self.js(data)
        self.write('data/wall.json', text)
        self.versions['wall'] = hashlib.sha1(text.encode()).hexdigest()[:10]

    def v2_extras(self):
        self.wall()
        for r in self.ranges:
            clean = [p for p in r['items'] if p['img'] and self.is_clean(p['img'])]
            pool = [p for p in clean if p['square']] or clean
            pool = sorted(pool, key=lambda p: hashlib.sha1(('f' + p['slug']).encode()).hexdigest())
            r['feature'] = pool[:7]
            r['belt'] = (clean or [p for p in r['items'] if p['img']])[:18]
        # the example price request on the home page: three real lines from the catalogue
        demo = []
        def line(rid, want, q):
            rng = next((x for x in self.ranges if x['id'] == rid), None)
            if not rng: return
            for p in rng['items']:
                for c, z in p['rows']:
                    if z and (c == want or not want):
                        demo.append({'name': p['name'], 'size': {'en': z, 'ar': self.ar_size(z)}, 'pn': c or '', 'q': q, 'img': p['img']}); return
        line('kapusi', 'K-0026', 6); line('castor', '', 24); line('safety', '', 50)
        return {'board': self.board[:6], 'demo': demo}

    def og_v2(self, logo):
        """the picture shown when a link is shared: their logo, the numbers, and a few of their products"""
        W, H = 1200, 630
        og = Image.new('RGB', (W, H), (18, 19, 22))
        m = logo.copy(); m.thumbnail((300, 170), Image.LANCZOS); og.paste(m, (72, 64), m)
        f = os.path.join(self.dir, 'static', 'fonts', 'archivo-100-900-latin.woff2')
        from PIL import ImageDraw, ImageFont
        dr = ImageDraw.Draw(og)
        big = ImageFont.truetype(f, 70); big.set_variation_by_axes([800, 125])
        sm = ImageFont.truetype(f, 22); sm.set_variation_by_axes([500, 100])
        y = 330
        for txt in ('%d PRODUCTS.' % self.stats['products'], '%s SIZES.' % self.stats['lines_fmt']):
            dr.text((72, y), txt, font=big, fill=(236, 235, 230)); y += 82
        dr.rectangle((72, 516, 72 + 64, 522), fill=(255, 90, 31))
        dr.text((72, 540), 'Jurf Industrial Zone 1, Ajman · Prices on request', font=sm, fill=(154, 158, 166))
        from PIL import ImageChops
        picks = []
        for r in self.ranges:
            pool = sorted((p for p in r['items'] if p['img'] and p['square'] and self.is_clean(p['img'])), key=lambda p: hashlib.sha1(('f' + p['slug']).encode()).hexdigest())
            picks += pool[:2 if r['big'] else 1]
        for k, p in enumerate(picks[:16]):
            cx, cy = 690 + (k % 4) * 118, 64 + (k // 4) * 128
            tile = Image.new('RGB', (108, 118), (236, 235, 230)); white = Image.new('RGB', (108, 118), (255, 255, 255))
            with Image.open(os.path.join(self.out, p['img'])) as im:
                im = im.convert('RGB'); im.thumbnail((92, 92), Image.LANCZOS)
                white.paste(im, ((108 - im.width) // 2, (118 - im.height) // 2))
            og.paste(ImageChops.multiply(tile, white), (cx, cy))
        og.save(self.path('assets/og.jpg'), quality=86)

    # ---------- words ----------
    def summary(self, p, lang):
        rows = p['rows']
        sizes = [s for _, s in rows if s]
        codes = [c for c, _ in rows if c]
        sz = (lambda s: self.ar_size(s)) if lang == 'ar' else (lambda s: s)
        if len(rows) == 1:
            text = Markup('<bdi>%s</bdi>') % sz(sizes[0]) if sizes else ''
        else:
            text = Markup(escape(t(lang, 'n_sizes', n=len(rows))))
            if len(set(sizes)) > 1: text += Markup(' · <bdi>%s</bdi> – <bdi>%s</bdi>') % (sz(sizes[0]), sz(sizes[-1]))
            elif len(sizes) == 1: text += Markup(' · <bdi>%s</bdi>') % sz(sizes[0])
        code = (codes[0] if len(codes) == 1 else '%s – %s' % (codes[0], codes[-1])) if codes else ''
        return text, code

    def count_txt(self, n, lang, one, many):
        return t(lang, one) if n == 1 else t(lang, many, n=n)

    # ---------- pages ----------
    def build(self):
        self.gather()
        books = self.pdfs()
        arches = self.arcade() if self.design == 'v1' else []
        self.assets()
        year = datetime.date.today().year
        env = jinja2.Environment(loader=jinja2.FileSystemLoader(os.path.join(self.dir, 'templates')), autoescape=True, trim_blocks=True, lstrip_blocks=True)
        index = self.search_index()
        v = self.versions
        v['index'] = hashlib.sha1(index.encode()).hexdigest()[:10]
        self.write('data/index.json', index)
        extra = self.v2_extras() if self.design == 'v2' else {}
        for lang in LANGS:
            T = lambda key, **kw: t(lang, key, **kw)
            for r in self.ranges:
                r['count_txt'] = self.count_txt(r['count'], lang, 'one_product', 'n_products')
                r['groups_txt'] = self.count_txt(len(r['groups']), lang, 'one_group', 'n_groups')
                for g in r['groups']:
                    g['count'] = len(g['items'])
                    g['count_txt'] = self.count_txt(g['count'], lang, 'one_product', 'n_products')
                    for p in g['items']: p['summary'], p['codes'] = self.summary(p, lang)
            pages = [('index.html', 'home', None)] + [('range/%s/index.html' % r['id'], 'range', r) for r in self.ranges]
            for rel, kind, r in pages:
                full = (('ar/' if lang == 'ar' else '') + rel)
                depth = full.count('/')
                root = '../' * depth
                home = root + ('ar/' if lang == 'ar' else '')
                other = root + ('' if lang == 'ar' else 'ar/') + (rel[:-len('index.html')])
                cfg = {'lang': lang, 'root': root, 'home': home, 'index': root + 'data/index.json?v=' + v['index'],
                       'wall': (root + 'data/wall.json?v=' + v['wall']) if 'wall' in v else '',
                       't': {k: t(lang, k) for k in JS_KEYS}, 'contact': {k: CONTACT[k] for k in ('email', 'phone', 'tel', 'whatsapp')},
                       'page': kind, 'range': r['id'] if r else '', 'icons': {k: ICONS[k] for k in JS_ICONS}}
                ctx = dict(lang=lang, T=T, icon=icon, split=split_words, root=root, home=home or './', other_url=other or './', page=kind, site_url=self.url,
                           page_url=self.url + full[:-len('index.html')],
                           ranges=self.ranges, stats=self.stats, contact=CONTACT, year=year, v=v, pdfs=books, arches=arches,
                           config=Markup(self.js(cfg)), **extra)
                if kind == 'home':
                    ctx.update(title=T('home_title'), description=T('home_desc', p=self.stats['products'], r=self.stats['ranges']))
                    html = env.get_template('home.html').render(**ctx)
                else:
                    i = self.ranges.index(r)
                    ctx.update(r=r, nxt=self.ranges[(i + 1) % len(self.ranges)], title=T('range_title', name=r['name'][lang] or r['name']['en']),
                               description=T('range_desc', name=r['name'][lang] or r['name']['en'], p=r['count']), range_json=Markup(self.js(self.range_data(r))))
                    html = env.get_template('range.html').render(**ctx)
                self.write(full, html)
        self.prune()
        check_no_prices(self.out, self.data)
        print('site: %d products in %d ranges, %d groups, %d lines, %d catalogues -> %s' % (
            self.stats['products'], self.stats['ranges'], self.stats['groups'], self.stats['lines'], len(books), self.out))

    def js(self, obj):
        return json.dumps(obj, ensure_ascii=False, separators=(',', ':')).replace('</', '<\\/')

    def range_data(self, r):
        items = {}
        for p in r['items']:
            items[p['slug']] = {'n': p['name'], 'i': p['img'], 'w': p['w'], 'h': p['h'], 'sp': p['specs'], 'g': p['g'],
                                'z': [[c, s, self.ar_size(s) if s else None] for c, s in p['rows']]}
        return {'id': r['id'], 'name': r['name'], 'groups': [{'s': g['slug'], 'n': g['name']} for g in r['groups']],
                'order': [p['slug'] for p in r['items']], 'items': items}

    def search_index(self):
        rs, gs, ps = [], [], []
        for ri, r in enumerate(self.ranges):
            rs.append([r['id'], r['name']['en'], r['name']['ar'], r['count']])
            gbase = len(gs)
            for g in r['groups']: gs.append([ri, g['slug'], g['name']['en'], g['name']['ar'], len(g['items'])])
            for p in r['items']:
                ps.append([p['slug'], gbase + p['g'], p['name']['en'], p['name']['ar'], p['img'], [[c, s, self.ar_size(s) if s else None] for c, s in p['rows']]])
        return self.js({'r': rs, 'g': gs, 'p': ps})

    def assets(self):
        st = os.path.join(self.dir, 'static')
        self.versions = {}
        for name in ('site.css', 'site.js', 'motion.js'):
            src = os.path.join(st, name)
            if not os.path.isfile(src): continue
            shutil.copyfile(src, self.path('assets/' + name))
            self.versions[name.replace('.', '_') if name == 'motion.js' else name.split('.')[1]] = hashlib.sha1(open(src, 'rb').read()).hexdigest()[:10]
        if os.path.isdir(os.path.join(st, 'vendor')):
            vh = hashlib.sha1()
            for f in sorted(os.listdir(os.path.join(st, 'vendor'))):
                shutil.copyfile(os.path.join(st, 'vendor', f), self.path('assets/vendor/' + f)); vh.update(open(os.path.join(st, 'vendor', f), 'rb').read())
            self.versions['vendor'] = vh.hexdigest()[:10]
        fh = hashlib.sha1()
        for f in sorted(os.listdir(os.path.join(st, 'fonts'))):
            shutil.copyfile(os.path.join(st, 'fonts', f), self.path('assets/fonts/' + f)); fh.update(open(os.path.join(st, 'fonts', f), 'rb').read())
        self.versions['fonts'] = fh.hexdigest()[:10]
        # their logo: the dome on its own (a mask the page colours), the icon and the picture for shared links
        logo = Image.open(os.path.join(self.bam, 'logo.png')).convert('LA')
        a = logo.getchannel('A')
        rows = [a.crop((0, y, logo.width, y + 1)).getbbox() is not None for y in range(logo.height)]
        cut = next((y for y in range(int(logo.height * 0.5), logo.height) if not rows[y]), int(logo.height * 0.74))
        dome = logo.crop((0, 0, logo.width, cut)); dome = dome.crop(dome.getchannel('A').getbbox())
        white = Image.new('RGBA', dome.size, (255, 255, 255, 0)); white.putalpha(dome.getchannel('A'))
        white.save(self.path('assets/mark.png'), optimize=True)
        full = Image.new('RGBA', logo.size, (255, 255, 255, 0)); full.putalpha(a); full.save(self.path('assets/logo.png'), optimize=True)
        ink = (15, 110, 92) if self.design == 'v1' else (18, 19, 22)
        for size, bg, rel in ((192, ink, 'assets/icon-192.png'), (512, ink, 'assets/icon-512.png')):
            ic = Image.new('RGB', (size, size), bg); m = white.copy(); m.thumbnail((int(size * .68), int(size * .62)), Image.LANCZOS)
            ic.paste(m, ((size - m.width) // 2, (size - m.height) // 2 + int(size * .02)), m); ic.save(self.path(rel), optimize=True)
        if self.design == 'v1':
            og = Image.new('RGB', (1200, 630), (42, 36, 27)); m = full.copy(); m.thumbnail((640, 400), Image.LANCZOS)
            og.paste(m, ((1200 - m.width) // 2, (630 - m.height) // 2), m); og.save(self.path('assets/og.jpg'), quality=86)
        else:
            self.og_v2(full)

    def prune(self):
        for base, dirs, files in os.walk(self.out, topdown=False):
            for f in files:
                rel = os.path.normpath(os.path.relpath(os.path.join(base, f), self.out))
                if rel not in self.written: os.remove(os.path.join(base, f))
            if base != self.out and not os.listdir(base): os.rmdir(base)


def check_no_prices(out, data):
    """stops the build if anything written could be a price: the word AED, a price field, or a line with 3 values"""
    bad = []
    for base, _, files in os.walk(out):
        for f in files:
            if not f.endswith(('.html', '.json', '.js', '.css')): continue
            p = os.path.join(base, f); text = open(p, encoding='utf-8').read()
            if re.search(r'\bAED\b|درهم|"price"|"p":\s*[0-9]', text): bad.append(os.path.relpath(p, out))
    idx = json.load(open(os.path.join(out, 'data', 'index.json'), encoding='utf-8'))
    priced = {(c['id'], it['n']): [r[2] for r in it['r']] for c in data['cats'] for s in c['secs'] for it in s['items']}
    for p in idx['p']:
        for row in p[5]:
            if len(row) != 3 or (row[2] is not None and not isinstance(row[2], str)): bad.append('index.json line ' + p[0])
    wall = os.path.join(out, 'data', 'wall.json')
    if os.path.isfile(wall):    # the new look's wall and board: names, part numbers and sizes only
        w = json.load(open(wall, encoding='utf-8'))
        for x in w['t']:
            if len(x) != 7: bad.append('wall.json product ' + str(x[1]))
        for x in w['b']:
            if len(x) != 7 or not isinstance(x[3], str) or not isinstance(x[4], str): bad.append('wall.json board ' + str(x[6]))
    if bad: sys.exit('STOPPED: something that looks like a price was written: ' + ', '.join(sorted(set(bad))[:10]))
    if not priced: sys.exit('STOPPED: empty catalogue')


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--bam', default=os.path.join(APP, 'bam'))
    ap.add_argument('--design', default='v1', choices=sorted(DESIGNS))
    ap.add_argument('--out', help='default: app/build/bait-al-maqdis/ (v1) or app/build/bait-al-maqdis-new/ (v2)')
    ap.add_argument('--url', help='the address it is published at, ending in /')
    a = ap.parse_args()
    out = a.out or os.path.join(APP, 'build', DESIGNS[a.design]['out'])
    os.makedirs(out, exist_ok=True)
    Site(a.bam, out, a.url or DESIGNS[a.design]['url'], a.design).build()


if __name__ == '__main__':
    main()
