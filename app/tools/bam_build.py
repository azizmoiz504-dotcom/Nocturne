#!/usr/bin/env python3
"""Step 2 of importing the Bait Al Maqdis catalogue: turns what bam_extract.py wrote into the
files the app reads (app/bam/).  Run by import-bam.sh.

Usage: python3 -I bam_build.py <extract_dir> <public_dir> <out_dir>

  data.js       window.BAM_DATA: the 18 categories, their sections and products, every size with
                its part number and price (null = price on request), spec sheets per product
  p/<cat>/<n>.jpg   product photos on white, at most 600 px (spec sheets keep 900 px)
  tiles/<cat>.jpg   the home-screen category tiles (names are part of the picture)
  logo.png      the white logo for dark screens; logo-pdf.jpg the same on dark, for the order form
  pdf/          the three printed catalogues; clients.js the shop's customer list; fonts/ Poppins
Stock numbers and "out of stock" marks are left out: the old app never showed them.
"""
import io, json, os, re, shutil, sys
from PIL import Image

EX, PUB, OUT = sys.argv[1], sys.argv[2], sys.argv[3]
cat = json.load(open(os.path.join(EX, 'catalogue.json'), encoding='utf-8'))
stats = json.load(open(os.path.join(EX, 'stats.json'), encoding='utf-8'))

if os.path.isdir(OUT):
    shutil.rmtree(OUT)
for d in ('p', 'tiles', 'pdf', 'fonts'):
    os.makedirs(os.path.join(OUT, d))


def on_white(src):
    im = Image.open(src)
    if im.mode in ('RGBA', 'LA') or (im.mode == 'P' and 'transparency' in im.info):
        im = im.convert('RGBA')
        bg = Image.new('RGB', im.size, (255, 255, 255))
        bg.paste(im, mask=im.split()[-1])
        return bg
    return im.convert('RGB')


def photo(src, dst, box):
    im = on_white(src)
    if max(im.size) > box:
        im.thumbnail((box, box), Image.LANCZOS)
    os.makedirs(os.path.dirname(dst), exist_ok=True)
    im.save(dst, 'JPEG', quality=80, optimize=True, progressive=True)


def code_of(c):
    c = (c or '').strip()
    return None if c in ('', '—', '-', '–') else c


def price_of(p):
    if p in (None, ''):
        return None
    v = float(p)
    return v if v > 0 else None


def clean(s):
    return re.sub(r'\s+', ' ', s or '').strip()


tiles = {os.path.splitext(t['href'])[0]: t for t in stats['home']['tiles']}
out, n_items, n_rows, n_priced, n_img = [], 0, 0, 0, 0
for page in cat:
    pid = page['page']
    t = tiles[pid]
    photo(os.path.join(EX, t['file']), os.path.join(OUT, 'tiles', pid + '.jpg'), 400)
    c = {'id': pid, 'name': clean(page['homeLabel']), 'title': clean(page['coverTitle']),
         'lede': clean(page['lede']), 'secs': []}
    for sec in page['sections']:
        s = {'n': clean(sec['name']), 'items': []}
        sheets = {}
        for card in sec['cards']:
            if card['kind'] == 'spec-sheet':
                for im in card['images']:
                    rel = 'p/%s/%d.jpg' % (pid, im['index'])
                    photo(os.path.join(EX, im['file']), os.path.join(OUT, rel), 900)
                    sheets.setdefault(card.get('group'), []).append(rel)
        for card in sec['cards']:
            if card['kind'] != 'product':
                continue
            it = {'n': clean(card['name'])}
            if card['image']:
                rel = 'p/%s/%d.jpg' % (pid, card['imageIndex'])
                photo(os.path.join(EX, card['image']), os.path.join(OUT, rel), 600)
                it['img'] = rel
                n_img += 1
            it['r'] = [[code_of(r['code']), clean(r['size']) or None, price_of(r['price'])] for r in card['rows']]
            if card.get('group') in sheets:
                it['spec'] = sheets[card['group']]
            s['items'].append(it)
            n_items += 1
            n_rows += len(it['r'])
            n_priced += sum(1 for r in it['r'] if r[2] is not None)
        c['secs'].append(s)
    out.append(c)

# the three printed catalogues (PDFs tab)
PDFS = [('kapusi', 'Kapusi catalogue', 'Hand tools & workshop equipment'),
        ('sgs', 'SGS catalogue', 'Construction, tiling & finishing tools'),
        ('castor', 'Castor Wheels catalogue', 'Caster wheels, gate wheels & trolleys')]
pdfs = []
for pid, title, sub in PDFS:
    f = pid + '-catalogue.pdf'
    shutil.copy(os.path.join(PUB, 'pdf', f), os.path.join(OUT, 'pdf', f))
    pdfs.append({'file': 'pdf/' + f, 'title': title, 'sub': sub, 'mb': round(os.path.getsize(os.path.join(OUT, 'pdf', f)) / 1048576, 1)})

with open(os.path.join(OUT, 'data.js'), 'w', encoding='utf-8') as fh:
    fh.write('/* Bait Al Maqdis catalogue, made by app/tools/import-bam.sh from their old app. Prices in AED, null = on request. */\n')
    fh.write('window.BAM_DATA = ' + json.dumps({'cats': out, 'pdfs': pdfs}, ensure_ascii=False, separators=(',', ':')) + ';\n')

# logo: white on transparent for the dark screens, and the same on a dark square for the order form
logo = os.path.join(EX, 'home', 'store-logo-1.png')
shutil.copy(logo, os.path.join(OUT, 'logo.png'))
lg = Image.open(logo).convert('RGBA')
pad = 60
box = Image.new('RGB', (lg.width + 2 * pad, lg.height + 2 * pad), (20, 20, 22))
box.paste(lg, (pad, pad), lg)
box.save(os.path.join(OUT, 'logo-pdf.jpg'), 'JPEG', quality=92)

shutil.copy(os.path.join(PUB, 'clients.js'), os.path.join(OUT, 'clients.js'))
for f in os.listdir(os.path.join(PUB, 'fonts')):
    if f.endswith('.woff2'):
        shutil.copy(os.path.join(PUB, 'fonts', f), os.path.join(OUT, 'fonts', f))

print('categories %d, products %d, sizes %d (priced %d), photos %d, pdfs %d' % (len(out), n_items, n_rows, n_priced, n_img, len(pdfs)))
