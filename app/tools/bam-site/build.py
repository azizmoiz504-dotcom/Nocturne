#!/usr/bin/env python3
"""Builds the Bait Al Maqdis products website, with no prices, from the private catalogue in app/bam/.

    python3 app/tools/bam-site/build.py [--bam DIR] [--out DIR]

Writes app/build/bait-al-maqdis/ (default): English pages, Arabic pages in ar/, photos, the printed catalogues
and a search list. Every link is relative, so the folder works at any address; it is published at
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
    'dome': '<path d="M10.5 3.2a1.6 1.6 0 0 0 3 0"/><path d="M12 4.6v2"/><path d="M6.5 13C6.5 9 9 6.6 12 6.6S17.5 9 17.5 13"/><path d="M5.5 13h13M6 13v2M18 13v2M3.5 15h17"/><path d="M6 21v-3a1.5 1.5 0 0 1 3 0v3M10.5 21v-3.5a1.5 1.5 0 0 1 3 0V21M15 21v-3a1.5 1.5 0 0 1 3 0v3M3 21h18"/>',
}


JS_ICONS = ('x', 'arrow', 'plus', 'check', 'mail', 'copy', 'info', 'dome', 'list')   # drawn by the page's script


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
    def __init__(self, bam, out, url=URL):
        self.bam, self.out, self.url = bam, out, url
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
                         'img': ph[0] if ph else '', 'w': ph[1] if ph else 0, 'h': ph[2] if ph else 0,
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
        arches = self.arcade()
        self.assets()
        year = datetime.date.today().year
        env = jinja2.Environment(loader=jinja2.FileSystemLoader(os.path.join(HERE, 'templates')), autoescape=True, trim_blocks=True, lstrip_blocks=True)
        index = self.search_index()
        v = self.versions
        v['index'] = hashlib.sha1(index.encode()).hexdigest()[:10]
        self.write('data/index.json', index)
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
                       't': {k: t(lang, k) for k in JS_KEYS}, 'contact': {k: CONTACT[k] for k in ('email', 'phone', 'tel', 'whatsapp')},
                       'page': kind, 'range': r['id'] if r else '', 'icons': {k: ICONS[k] for k in JS_ICONS}}
                ctx = dict(lang=lang, T=T, icon=icon, split=split_words, root=root, home=home or './', other_url=other or './', page=kind, site_url=self.url,
                           page_url=self.url + full[:-len('index.html')],
                           ranges=self.ranges, stats=self.stats, contact=CONTACT, year=year, v=v, pdfs=books, arches=arches,
                           config=Markup(self.js(cfg)))
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
        st = os.path.join(HERE, 'static')
        self.versions = {}
        for name in ('site.css', 'site.js'):
            src = os.path.join(st, name)
            shutil.copyfile(src, self.path('assets/' + name))
            self.versions[name.split('.')[1]] = hashlib.sha1(open(src, 'rb').read()).hexdigest()[:10]
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
        for size, bg, rel in ((192, (15, 110, 92), 'assets/icon-192.png'), (512, (15, 110, 92), 'assets/icon-512.png')):
            ic = Image.new('RGB', (size, size), bg); m = white.copy(); m.thumbnail((int(size * .68), int(size * .62)), Image.LANCZOS)
            ic.paste(m, ((size - m.width) // 2, (size - m.height) // 2 + int(size * .02)), m); ic.save(self.path(rel), optimize=True)
        og = Image.new('RGB', (1200, 630), (42, 36, 27)); m = full.copy(); m.thumbnail((640, 400), Image.LANCZOS)
        og.paste(m, ((1200 - m.width) // 2, (630 - m.height) // 2), m); og.save(self.path('assets/og.jpg'), quality=86)

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
    if bad: sys.exit('STOPPED: something that looks like a price was written: ' + ', '.join(sorted(set(bad))[:10]))
    if not priced: sys.exit('STOPPED: empty catalogue')


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--bam', default=os.path.join(APP, 'bam'))
    ap.add_argument('--out', default=os.path.join(APP, 'build', 'bait-al-maqdis'))
    ap.add_argument('--url', default=URL, help='the address it is published at, ending in /')
    a = ap.parse_args()
    os.makedirs(a.out, exist_ok=True)
    Site(a.bam, a.out, a.url).build()


if __name__ == '__main__':
    main()
