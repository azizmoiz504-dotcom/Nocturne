#!/usr/bin/env python3
"""Puts a changes file from the product editor into that shop's private catalogue:
Bait Al Maqdis (app/bam/) or Modern Electric (app/me/), as the file says.

    python3 app/tools/bam-editor/apply.py <bait-al-maqdis-product-changes.json | modern-electric-product-changes.json> [--check] [--force] [--dir FOLDER]

--check   only shows what the file changes; nothing is written
--force   apply even if the list was changed after the editor was opened (look at the report first)
--dir     a copy of the catalogue to apply it to instead (for example an older list the file was made from)
Writes data.js, Arabic names into ar.js, and new photos into p/<category>/ and covers/.
Then: copy the folder to the shared private copy, rebuild the app and the editor.
"""
import argparse, base64, io, json, os, re, sys, time
from PIL import Image

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
from bamdata import APP, SHOPS, shop_of, load, read_js, write_js, version, item_key


def photo(data_url, path, max_side):
    head, _, b64 = data_url.partition(',')
    if not head.startswith('data:image/') or ';base64' not in head: raise ValueError('not a photo')
    im = Image.open(io.BytesIO(base64.b64decode(b64)))
    im.load()
    if im.mode in ('RGBA', 'LA', 'P'):
        im = im.convert('RGBA'); bg = Image.new('RGB', im.size, (255, 255, 255)); bg.paste(im, mask=im.split()[-1]); im = bg
    im = im.convert('RGB'); im.thumbnail((max_side, max_side), Image.LANCZOS)
    os.makedirs(os.path.dirname(path), exist_ok=True)
    im.save(path, 'JPEG', quality=85, optimize=True, progressive=True)


def money(v): return 'on request' if v is None else 'AED %g' % v


def new_id(name, taken):
    """an address-safe id for a new category: "Power Tools" -> power-tools (photos go in p/<id>/)"""
    base = re.sub(r'[^a-z0-9]+', '-', name.lower()).strip('-')[:40].strip('-') or 'range'
    cid, k = base, 2
    while cid in taken: cid = '%s-%d' % (base, k); k += 1
    taken.add(cid)
    return cid


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('changes')
    ap.add_argument('--dir', '--bam', dest='dir')
    ap.add_argument('--check', action='store_true')
    ap.add_argument('--force', action='store_true')
    a = ap.parse_args()

    ch = json.load(open(a.changes, encoding='utf-8'))
    sid = next((k for k, s in SHOPS.items() if s['kind'] == ch.get('kind')), None)
    if not sid: sys.exit('This is not a changes file from the product editor.')
    SHOP = SHOPS[sid]
    a.bam = a.dir or SHOP['dir']
    if shop_of(a.bam) != sid: sys.exit('This changes file is for %s, but %s holds another shop.' % (SHOP['name'], a.bam))
    print('%s changes file' % SHOP['name'])
    data, ar = load(a.bam)
    d = ar['dict']
    now_ver = version(a.bam)
    if ch.get('ver') != now_ver:
        print('NOTE: the list was changed after this editor was opened (file %s, list now %s).' % (ch.get('ver'), now_ver))
        if not a.force and not a.check: sys.exit('Nothing written. Look at the report with --check, then use --force if it is right.')

    orig_cats = {c['id']: c for c in data['cats']}
    orig = {}
    for c in data['cats']:
        for si, s in enumerate(c['secs']):
            for ii, it in enumerate(s['items']):
                orig[item_key(c['id'], si, ii)] = (c['id'], si, s['n'], it)

    report, problems = [], []
    stamp = time.strftime('%y%m%d')
    saved = {}            # new photo id -> path in the catalogue

    def new_photo(pid, folder, cover=False):
        if pid in saved: return saved[pid]
        if pid not in ch.get('images', {}): problems.append('photo %s is missing from the file' % pid); return ''
        n = pid.split('/')[-1].split('.')[0]
        rel = ('covers/%s-own-%s-%s.jpg' % (folder, stamp, n)) if cover else ('p/%s/e%s-%s.jpg' % (folder, stamp, n))
        k = 2
        while os.path.exists(os.path.join(a.bam, rel)) and not a.check:
            rel = rel[:-4] + '-%d.jpg' % k; k += 1
        if not a.check:
            try: photo(ch['images'][pid], os.path.join(a.bam, rel), 700 if cover else 1000)
            except Exception as e: problems.append('photo %s could not be read (%s)' % (pid, e)); return ''
        saved[pid] = rel
        return rel

    cats, seen, ar_new = [], set(), {}
    taken = set(orig_cats)
    def ar_set(en, value):
        value = (value or '').strip()
        if not en or not value or d.get(en) == value: return
        if en in ar_new and ar_new[en] != value: problems.append('two different Arabic names for "%s": %s / %s (kept the second)' % (en, ar_new[en], value))
        ar_new[en] = value

    for c in ch['cats']:
        oc = orig_cats.get(c.get('id'))
        if not oc and c.get('isNew'):
            name = (c.get('name') or '').strip()
            if not name: problems.append('a new category with no name left out'); continue
            oc = {'id': new_id(name, taken), 'name': name, 'title': name, 'lede': '', 'secs': [], 'cover': ''}
            report.append('NEW category "%s"' % name)
        elif not oc: problems.append('unknown category %r left out' % c.get('id')); continue
        cid = oc['id']
        name = (c.get('name') or '').strip() or oc['name']
        if name != oc['name']: report.append('%s: category renamed to "%s"' % (oc['name'], name))
        ar_set(name, c.get('ar'))
        cover = c.get('cover') or ''
        if cover.startswith('new/'):
            cover = new_photo(cover, cid, cover=True) or oc.get('cover', '')
            report.append('%s: new category picture' % name)
        secs = []
        for s in c['secs']:
            sn = (s.get('n') or '').strip()
            if not sn: problems.append('%s: a group with no name left out' % name); continue
            if not s.get('items'): continue
            skey = s.get('k', '')
            if skey.startswith('s:%s.' % cid):
                was = oc['secs'][int(skey.split('.')[-1])]['n']
                if was != sn: report.append('%s: group "%s" renamed to "%s"' % (name, was, sn))
            else:
                report.append('%s: new group "%s"' % (name, sn))
            ar_set(sn, s.get('ar'))
            items = []
            keys = [it.get('k', '') for it in s['items'] if it.get('k', '') in orig]
            for it in s['items']:
                n = (it.get('n') or '').strip()
                if not n: problems.append('%s > %s: a product with no name left out' % (name, sn)); continue
                rows = []
                for r in it.get('r') or []:
                    pn, sz, pr = (r + [None, None, None])[:3]
                    pn = (str(pn).strip() or None) if pn is not None else None
                    sz = (str(sz).strip() or None) if sz is not None else None
                    if pr is not None and not (isinstance(pr, (int, float)) and pr >= 0):
                        problems.append('%s > %s: price %r is not a number, left as on request' % (name, n, pr)); pr = None
                    rows.append([pn, sz, pr])
                rows = [r for r in rows if r != [None, None, None]] or [[None, None, None]]
                img = it.get('img') or ''
                if img.startswith('new/'): img = new_photo(img, cid)
                o = {'n': n, 'img': img or None, 'r': rows}
                if it.get('spec'): o['spec'] = it['spec']
                ar_set(n, it.get('ar'))
                ik = it.get('k', '')
                where = '%s > %s > %s' % (name, sn, n)
                if ik in orig and ik not in seen:
                    seen.add(ik)
                    ocid, osi, osn, oi = orig[ik]
                    if oi['n'] != n: report.append('%s: renamed (was "%s")' % (where, oi['n']))
                    if skey != 's:%s.%d' % (ocid, osi): report.append('%s: moved here from %s > %s' % (where, orig_cats[ocid]['name'], osn))
                    if (oi.get('img') or None) != o['img']: report.append('%s: new photo' % where)
                    if oi['r'] != rows:
                        old = {tuple(r[:2]): r[2] for r in oi['r']}
                        new = {tuple(r[:2]): r[2] for r in rows}
                        for key in new:
                            label = ' / '.join(x for x in key if x) or 'price'
                            if key not in old: report.append('%s: added %s, %s' % (where, label, money(new[key])))
                            elif old[key] != new[key]: report.append('%s: %s price %s -> %s' % (where, label, money(old[key]), money(new[key])))
                        for key in old:
                            if key not in new: report.append('%s: removed %s' % (where, ' / '.join(x for x in key if x) or 'line'))
                        if old == new and list(old) != list(new): report.append('%s: lines put in a new order' % where)
                else:
                    report.append('%s: NEW product, %d line%s' % (where, len(rows), '' if len(rows) == 1 else 's'))
                items.append(o)
            if skey.startswith('s:%s.' % cid):
                osi = int(skey.split('.')[-1])
                was = [k for k in (item_key(cid, osi, i) for i in range(len(oc['secs'][osi]['items']))) if k in keys]
                if keys and [k for k in keys if k in was] != was: report.append('%s > %s: products put in a new order' % (name, sn))
            if items: secs.append({'n': sn, 'items': items})
        if not secs:
            if not c.get('isNew'): report.append('%s: no products left, category taken out' % name)
            continue
        cats.append({'id': cid, 'name': name, 'title': oc.get('title', ''), 'lede': oc.get('lede', ''), 'secs': secs, 'cover': cover})
    for k, (ocid, osi, osn, oi) in orig.items():
        if k not in seen: report.append('%s > %s > %s: DELETED' % (orig_cats[ocid]['name'], osn, oi['n']))
    in_file = {c.get('id') for c in ch['cats']}
    missing = [c['id'] for c in data['cats'] if c['id'] not in in_file]
    if missing: problems.append('categories missing from the file, kept as they were: ' + ', '.join(missing))
    for cid in missing:
        cats.insert([c['id'] for c in data['cats']].index(cid), orig_cats[cid])
    for en, v in ar_new.items(): report.append('Arabic: "%s" = %s' % (en, v))

    total = sum(len(s['items']) for c in cats for s in c['secs'])
    print('Changes file saved %s: %d products now (was %d). %d change line(s).' % (ch.get('saved', '?'), total, len(orig), len(report)))
    for line in report: print('  ' + line)
    for p in problems: print('  PROBLEM: ' + p)
    if a.check: print('(--check: nothing written)'); return

    data['cats'] = cats
    head = read_js(os.path.join(a.bam, 'data.js'), SHOP['data'])[0]
    write_js(os.path.join(a.bam, 'data.js'), SHOP['data'], head, data)
    if ar_new:
        d.update(ar_new)
        write_js(os.path.join(a.bam, 'ar.js'), SHOP['ar'], read_js(os.path.join(a.bam, 'ar.js'), SHOP['ar'])[0], ar)
    print('Written: data.js%s, %d new photo(s).' % (', ar.js' if ar_new else '', len(saved)))


if __name__ == '__main__':
    main()
