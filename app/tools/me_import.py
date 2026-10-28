#!/usr/bin/env python3
"""Makes the Modern Electric catalogue (app/me/) from their product list spreadsheet.

    python3 app/tools/me_import.py <Product_List_by_Category.xlsx> [--out app/me]

Reads the sheet "All Items (Filter)" (Main Category, Category, Product, Size, Details, Brand, Tally Item Name)
and writes the same shape as the Bait Al Maqdis catalogue, so the app and the product editor treat both alike:
    data.js   window.ME_DATA = {cats: [{id, name, title, lede, cover, secs: [{n, items: [{n, img, r}]}]}]}
              one category per main category, one group per category, one card per product and brand;
              each line r = [Tally item name, size (and details), price or null]
    ar.js     window.ME_AR = {dict: {}, spec: {}}   Arabic names, filled in with the product editor
    covers/   a drawn picture for each main category (tools/me_covers.mjs)
The list has no prices and no photos yet: both are added with the product editor.
Run it once. After that the product editor's changes files are the way to change the list.
"""
import argparse, json, os, re, sys
import openpyxl

APP = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
COLS = ['Main Category', 'Category', 'Product', 'Size', 'Details', 'Brand', 'Tally Item Name']


def slug(s):
    return re.sub(r'[^a-z0-9]+', '-', s.lower().replace('&', ' ')).strip('-')


def clean(v):
    return re.sub(r'\s+', ' ', str(v)).strip() if v is not None else ''


def brand_label(b):
    if not b or b == 'No Brand Listed': return ''
    m = re.match(r'^(.*?)\s*\((.*)\)$', b)       # "Germany (Imported)" -> "Germany, Imported"
    return '%s, %s' % (m.group(1), m.group(2)) if m else b


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('xlsx')
    ap.add_argument('--out', default=os.path.join(APP, 'me'))
    a = ap.parse_args()

    ws = openpyxl.load_workbook(a.xlsx, read_only=True, data_only=True)['All Items (Filter)']
    rows = list(ws.iter_rows(values_only=True))
    head = next(i for i, r in enumerate(rows) if r and clean(r[0]) == COLS[0])
    if [clean(x) for x in rows[head][:7]] != COLS: sys.exit('unexpected columns: %r' % (rows[head],))
    lines = [[clean(x) for x in r[:7]] for r in rows[head + 1:] if r and any(r)]

    cats, by_cat, by_card, problems = [], {}, {}, []
    for main, cat, prod, size, det, brand, tally in lines:
        if not (main and cat and prod and tally): problems.append('line with a missing column: %r' % ([main, cat, prod, size, det, brand, tally],)); continue
        c = by_cat.get(main)
        if not c:
            c = by_cat[main] = {'id': slug(main), 'name': main, 'title': main, 'lede': '', 'cover': 'covers/%s.png' % slug(main), 'secs': []}
            cats.append(c)
        sec = next((s for s in c['secs'] if s['n'] == cat), None)
        if not sec: sec = {'n': cat, 'items': []}; c['secs'].append(sec)
        key = (main, cat, prod, brand)
        it = by_card.get(key)
        if not it:
            b = brand_label(brand)
            it = by_card[key] = {'n': prod + (' (%s)' % b if b else ''), 'img': None, 'r': []}
            sec['items'].append(it)
        sz = ' · '.join(x for x in (size, det) if x) or None
        row = [tally, sz, None]
        if any(r[0] == row[0] and r[1] == row[1] for r in it['r']): problems.append('same line twice: %s' % tally)
        it['r'].append(row)

    # checks: every line in, every card name unique inside its group
    total = sum(len(it['r']) for c in cats for s in c['secs'] for it in s['items'])
    cards = sum(len(s['items']) for c in cats for s in c['secs'])
    for c in cats:
        for s in c['secs']:
            names = [it['n'] for it in s['items']]
            for n in set(names):
                if names.count(n) > 1: problems.append('two cards called %s in %s' % (n, s['n']))
    if len({c['id'] for c in cats}) != len(cats): problems.append('two main categories with the same address')
    print('%d lines, %d products, %d groups, %d categories' % (total, cards, sum(len(c['secs']) for c in cats), len(cats)))
    for p in problems: print('PROBLEM:', p)
    if problems or total != len(lines): sys.exit('not written')

    os.makedirs(os.path.join(a.out, 'covers'), exist_ok=True)
    os.makedirs(os.path.join(a.out, 'p'), exist_ok=True)
    head = '/* Modern Electric House Trading L.L.C. product list (private: not in the public repository). Made by tools/me_import.py, then changed with the product editor. */'
    with open(os.path.join(a.out, 'data.js'), 'w', encoding='utf-8') as fh:
        fh.write(head + '\nwindow.ME_DATA = ' + json.dumps({'cats': cats}, ensure_ascii=False, separators=(',', ':')) + ';\n')
    arf = os.path.join(a.out, 'ar.js')
    if not os.path.isfile(arf):
        with open(arf, 'w', encoding='utf-8') as fh:
            fh.write('/* Modern Electric names in Arabic, from the product editor */\nwindow.ME_AR = {"dict":{},"spec":{}};\n')
    print('written to', a.out)


if __name__ == '__main__':
    main()
