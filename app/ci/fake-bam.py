#!/usr/bin/env python3
"""Makes a stand-in Bait Al Maqdis catalogue in app/bam/ for the automated phone test.

The real one (prices, customer list, catalogue PDFs) is kept out of GitHub on purpose, because this
repository is public: it lives in the project files and is made by app/tools/import-bam.sh.
This one has made-up products and prices, Fakhri Tools photos, and text pictures, but the same shape,
so the test can tap through every Bait Al Maqdis screen.   usage: python3 app/ci/fake-bam.py
"""
import json, os, random, shutil, subprocess

APP = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SITE = os.path.dirname(APP)
OUT = os.environ.get('BAM_OUT') or os.path.join(APP, 'bam')
CATS = [('kapusi', 'Kapusi'), ('sgs', 'SGS'), ('castor', 'Castor Wheels'), ('nails', 'Nails & Fasteners'), ('meshes', 'Meshes'),
        ('shadenet', 'Shade Net'), ('wire', 'GI Binding Wire'), ('chain', 'GI Chain'), ('gifit', 'GI Fittings'), ('safety', 'Safety Items'),
        ('hammers', 'Hammers'), ('hand', 'Hand Equipment'), ('hoses', 'Hoses'), ('ropes', 'Ropes'), ('paint', 'Paint Brushes & Rollers'),
        ('packing', 'Packing Materials'), ('shovels', 'Shovels & Pickaxes'), ('tarpaulin', 'Tarpaulin')]


def picture(path, text, w=400, h=400, bg='#101012'):
    subprocess.run(['convert', '-size', f'{w}x{h}', f'xc:{bg}', '-fill', 'white', '-gravity', 'center',
                    '-pointsize', '34', '-annotate', '0', text, path], check=True)


def main():
    random.seed(7)
    if os.path.exists(OUT):
        shutil.rmtree(OUT)
    for d in ('p', 'tiles', 'pdf'):
        os.makedirs(os.path.join(OUT, d))
    photos = []
    for root, _, files in os.walk(os.path.join(SITE, 'assets', 'products')):
        photos += [os.path.join(root, f) for f in sorted(files) if f.lower().endswith('.jpg')]
    photos.sort()
    cats, code = [], 1
    for cid, name in CATS:
        picture(os.path.join(OUT, 'tiles', cid + '.jpg'), name.upper())
        os.makedirs(os.path.join(OUT, 'p', cid))
        secs = []
        for s in range(2):
            items = []
            for i in range(4):
                n = len(items) + s * 4 + 1
                shutil.copy(photos[(code * 7) % len(photos)], os.path.join(OUT, 'p', cid, f'{n}.jpg'))
                rows = []
                for j in range(1 + (i % 3)):
                    c = 'K-0026' if (cid, s, i, j) == ('kapusi', 0, 0, 0) else f'T-{code:04d}'
                    code += 1
                    rows.append([c, f'{(j + 1) * 5}"', None if (i == 3 and cid != 'kapusi') else round(random.uniform(2, 90), 1)])
                items.append({'n': f'Test {name} item {n}', 'img': f'p/{cid}/{n}.jpg', 'r': rows})
            secs.append({'n': f'{name} group {s + 1}', 'items': items})
        cats.append({'id': cid, 'name': name, 'title': 'Bait Al Maqdis', 'lede': '', 'secs': secs})
    pdfs = []
    for cid, title in (('kapusi', 'Kapusi catalogue'), ('sgs', 'SGS catalogue'), ('castor', 'Castor Wheels catalogue')):
        subprocess.run(['convert', os.path.join(OUT, 'tiles', cid + '.jpg'), os.path.join(OUT, 'pdf', cid + '-catalogue.pdf')], check=True)
        pdfs.append({'file': f'pdf/{cid}-catalogue.pdf', 'title': title, 'sub': 'Test catalogue', 'mb': 0.1})
    with open(os.path.join(OUT, 'data.js'), 'w') as f:
        f.write('/* stand-in Bait Al Maqdis catalogue for the phone test (app/ci/fake-bam.py): made-up products and prices */\n')
        f.write('window.BAM_DATA = ' + json.dumps({'cats': cats, 'pdfs': pdfs}) + ';\n')
    with open(os.path.join(OUT, 'clients.js'), 'w') as f:
        f.write('window.BAM_CLIENTS = ' + json.dumps({'r': ['Dubai', 'Sharjah'], 'l': [['Test Client A', 0], ['Test Client B', 1]]}) + ';\n')
    with open(os.path.join(OUT, 'ar.js'), 'w') as f:
        f.write('window.BAM_AR = {"dict": {}, "spec": {}};\n')
    picture(os.path.join(OUT, 'logo.png'), 'BAIT AL MAQDIS', 512, 277, 'none')
    picture(os.path.join(OUT, 'logo-pdf.jpg'), 'BAIT AL MAQDIS', 632, 397, '#141416')
    print('stand-in Bait Al Maqdis catalogue:', sum(len(s['items']) for c in cats for s in c['secs']), 'products in', OUT)


if __name__ == '__main__':
    main()
