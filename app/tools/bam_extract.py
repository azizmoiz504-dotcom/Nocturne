#!/usr/bin/env python3
"""Step 1 of importing the Bait Al Maqdis catalogue: reads the 18 category pages of their old app
(the web root inside their APK, assets/public) and writes catalogue.json, stats.json and every
embedded photo as a file.  Run by import-bam.sh; read-only on the input.

Usage: python3 -I bam_extract.py <public_dir> <out_dir>
"""
import base64, hashlib, json, os, re, sys
from bs4 import BeautifulSoup

try:
    from PIL import Image
    import io
except Exception:  # PIL optional, only used for pixel sizes
    Image = None

PUB, OUT = sys.argv[1], sys.argv[2]
os.makedirs(OUT, exist_ok=True)

# Order and labels exactly as the home grid lists them (index.html)
DATA_URI = re.compile(r'^data:(image/[A-Za-z0-9.+-]+);base64,(.*)$', re.S)
EXT = {'image/jpeg': 'jpg', 'image/jpg': 'jpg', 'image/png': 'png', 'image/webp': 'webp',
       'image/gif': 'gif', 'image/svg+xml': 'svg'}


def decode(uri):
    m = DATA_URI.match(uri or '')
    if not m:
        return None, None
    mime = m.group(1).lower()
    raw = base64.b64decode(re.sub(r'\s+', '', m.group(2)))
    return mime, raw


def dims(raw):
    if Image is None:
        return None
    try:
        im = Image.open(io.BytesIO(raw))
        return [im.width, im.height]
    except Exception:
        return None


def save(raw, mime, path_noext):
    ext = EXT.get(mime, mime.split('/')[-1])
    p = path_noext + '.' + ext
    os.makedirs(os.path.dirname(p), exist_ok=True)
    with open(p, 'wb') as fh:
        fh.write(raw)
    return p, ext


def txt(el):
    return re.sub(r'\s+', ' ', el.get_text(' ', strip=True)).strip() if el else ''


# ------------------------------------------------------------------ home
home_dir = os.path.join(OUT, 'home')
os.makedirs(home_dir, exist_ok=True)
idx_html = open(os.path.join(PUB, 'index.html'), encoding='utf-8').read()
idx = BeautifulSoup(idx_html, 'lxml')
home = {'tiles': [], 'logos': []}
for n, a in enumerate(idx.select('.grid a.cat'), 1):
    img = a.select_one('.cat-img img')
    mime, raw = decode(img.get('src') if img else None)
    rec = {'n': n, 'href': a.get('href'), 'label': txt(a.select_one('.cat-label')),
           'alt': img.get('alt') if img else None, 'classes': a.get('class')}
    if raw:
        slug = os.path.splitext(a.get('href'))[0]
        p, ext = save(raw, mime, os.path.join(home_dir, 'tile-%02d-%s' % (n, slug)))
        rec.update(file=os.path.relpath(p, OUT), mime=mime, bytes=len(raw), size=dims(raw),
                   sha1=hashlib.sha1(raw).hexdigest()[:12])
    home['tiles'].append(rec)

hero = idx.select_one('#hero-logo')
mime, raw = decode(hero.get('src'))
if raw:
    p, _ = save(raw, mime, os.path.join(home_dir, 'index-hero-placeholder'))
    home['logos'].append({'source': 'index.html #hero-logo (placeholder, replaced at runtime by BAM.logo)',
                          'file': os.path.relpath(p, OUT), 'mime': mime, 'bytes': len(raw), 'size': dims(raw)})

for js in ('store.js', 'orderpdf.js', 'share.js', 'i18n.js'):
    s = open(os.path.join(PUB, js), encoding='utf-8').read()
    for k, m in enumerate(re.finditer(r'data:image/[A-Za-z0-9.+-]+;base64,[A-Za-z0-9+/=\s]+', s), 1):
        mime, raw = decode(m.group(0))
        p, _ = save(raw, mime, os.path.join(home_dir, '%s-logo-%d' % (js.replace('.js', ''), k)))
        home['logos'].append({'source': js, 'file': os.path.relpath(p, OUT), 'mime': mime,
                              'bytes': len(raw), 'size': dims(raw)})

# ------------------------------------------------------------- catalogues
pages = [t['href'] for t in home['tiles']]
labels = {t['href']: t['label'] for t in home['tiles']}
catalogue, stats = [], []
tot = dict(cards=0, spec_cards=0, rows=0, rows_priced=0, rows_stock=0, rows_oos=0,
           images=0, image_bytes=0)

for href in pages:
    page = os.path.splitext(href)[0]
    html = open(os.path.join(PUB, href), encoding='utf-8').read()
    soup = BeautifulSoup(html, 'lxml')

    # Kapusi keeps its prices in a JS table, keyed card-key -> part no -> price
    PRICES = {}
    m = re.search(r'var PRICES = (\{.*?\});\n', html)
    if m:
        PRICES = json.loads(m.group(1))

    init = re.search(r'BAM\.initCatalog\("([^"]+)"(?:,\s*"([^"]+)")?\)', html)
    ls = re.search(r"var LS_EDITS = '([^']+)'", html)
    pdoc = {
        'file': href, 'page': page, 'homeLabel': labels[href],
        'title': soup.title.get_text(strip=True) if soup.title else '',
        'brandmark': txt(soup.select_one('.brandmark')),
        'coverTitle': txt(soup.select_one('.cover h1')),
        'lede': txt(soup.select_one('.cover .lede')),
        'footer': [txt(d) for d in soup.select('.foot .foot-in > div')],
        'searchPlaceholder': (soup.select_one('#q') or {}).get('placeholder'),
        'storeSrc': init.group(1) if init else None,
        'storeBadge': (init.group(2) if init and init.group(2) else (init.group(1) if init else None)),
        'editsKey': ls.group(1) if ls else None,
        'priceSource': 'PRICES table in page script (by card key, then part no.)' if PRICES
                       else 'data-price attributes on ladder rows / .single',
        'sections': [],
    }
    st = dict(page=page, sections=0, cards=0, spec_cards=0, static_cards=0, rows=0,
              rows_priced=0, rows_stock=0, rows_oos=0, rows_nonpos_stock=0,
              cards_with_image=0, cards_oos=0, images=0, image_bytes=0,
              image_formats={}, image_sizes=[])
    img_n = 0

    for sec in soup.select('main section.cat'):
        sdoc = {'id': sec.get('id'), 'name': txt(sec.select_one('.cat-title h2')),
                'eyebrow': txt(sec.select_one('.cat-title .eyebrow')),
                'description': txt(sec.select_one('.cat-title p')),
                'countShown': txt(sec.select_one('.cat-count b')), 'cards': []}
        st['sections'] += 1
        for card in sec.select('article.card'):
            static = card.has_attr('data-static')
            cdoc = {}
            row_parent = card.find_parent(class_='typerow')
            if row_parent is not None:
                cdoc['group'] = row_parent.get('data-fam') or ('typerow-n%s' % row_parent.get('data-n'))
            if static:
                st['static_cards'] += 1
                st['spec_cards'] += 1
                cdoc.update(kind='spec-sheet', name=txt(card.select_one('.spec-cap')),
                            specKey=card.get('data-spec'), imageIndex=None, images=[], rows=[])
                for im in card.select('.specstack img'):
                    mime, raw = decode(im.get('src'))
                    if not raw:
                        continue
                    img_n += 1
                    p, ext = save(raw, mime, os.path.join(OUT, 'img', page, str(img_n)))
                    st['images'] += 1; st['image_bytes'] += len(raw)
                    st['image_formats'][ext] = st['image_formats'].get(ext, 0) + 1
                    cdoc['images'].append({'index': img_n, 'file': os.path.relpath(p, OUT),
                                           'size': dims(raw), 'alt': im.get('alt')})
                sdoc['cards'].append(cdoc)
                continue

            st['cards'] += 1
            fig = card.select_one('figure.shot')
            key = fig.get('data-code') if fig else None
            h3 = card.select_one('.card-body h3') or card.select_one('h3')
            cdoc.update(kind='product', name=txt(h3), key=key,
                        noCode=card.has_attr('data-nocode'),
                        oos=card.get('data-oos') == '1',
                        remoteImage=fig.get('data-remote') if fig else None,
                        imageIndex=None, image=None, imageSize=None, rows=[])
            if cdoc['oos']:
                st['cards_oos'] += 1
            im = fig.select_one('img') if fig else None
            if im is not None:
                mime, raw = decode(im.get('src'))
                if raw:
                    img_n += 1
                    p, ext = save(raw, mime, os.path.join(OUT, 'img', page, str(img_n)))
                    cdoc.update(imageIndex=img_n, image=os.path.relpath(p, OUT), imageSize=dims(raw))
                    st['cards_with_image'] += 1
                    st['images'] += 1; st['image_bytes'] += len(raw)
                    st['image_formats'][ext] = st['image_formats'].get(ext, 0) + 1
                    st['image_sizes'].append(dims(raw))
            card_prices = PRICES.get(key, {}) if PRICES else {}

            def add_row(el, code, size):
                price = el.get('data-price')
                if PRICES:
                    price = card_prices.get(code) or None
                    src = 'PRICES'
                else:
                    price = price if price not in (None, '') else None
                    src = 'data-price'
                stock = el.get('data-stock')
                r = {'key': el.get('data-code') or code, 'code': (None if cdoc['noCode'] else code),
                     'size': size or None, 'price': price,
                     'stock': int(stock) if stock not in (None, '') and re.fullmatch(r'-?\d+', stock) else (stock or None),
                     'oos': el.get('data-oos') == '1'}
                cdoc['rows'].append(r)
                st['rows'] += 1
                if price: st['rows_priced'] += 1
                if stock not in (None, ''):
                    st['rows_stock'] += 1
                    if isinstance(r['stock'], int) and r['stock'] <= 0:
                        st['rows_nonpos_stock'] += 1
                if r['oos']: st['rows_oos'] += 1

            for tr in card.select('table.ladder tbody tr'):
                c = tr.select_one('td.code'); s = tr.select_one('td.spec')
                code = txt(c) if c else (tr.get('data-code') or '')
                add_row(tr, code, txt(s) if s else '')
            if not cdoc['rows']:
                single = card.select_one('.single')
                if single is not None:
                    c = single.select_one('.code'); s = single.select_one('.spec')
                    line = card.select_one('.spec-line')
                    size = txt(s) if s else (txt(line) if line else '')
                    add_row(single, txt(c) if c else (single.get('data-code') or ''), size)
            sdoc['cards'].append(cdoc)
        pdoc['sections'].append(sdoc)

    sz = [x for x in st['image_sizes'] if x]
    st['image_sizes'] = {'min': min(sz, default=None, key=lambda d: d[0] * d[1]),
                         'max': max(sz, default=None, key=lambda d: d[0] * d[1])}
    catalogue.append(pdoc)
    stats.append(st)
    for k in ('cards', 'spec_cards', 'rows', 'rows_priced', 'rows_stock', 'rows_oos', 'images', 'image_bytes'):
        tot[k] += st[k]

json.dump(catalogue, open(os.path.join(OUT, 'catalogue.json'), 'w'), ensure_ascii=False, indent=1)
json.dump({'pages': stats, 'totals': tot, 'home': home},
          open(os.path.join(OUT, 'stats.json'), 'w'), ensure_ascii=False, indent=1)

hdr = '%-16s %4s %5s %5s %6s %6s %5s %4s %6s %6s %9s' % (
    'page', 'secs', 'cards', 'spec', 'rows', 'priced', 'stock', 'oos', 'w/img', 'imgs', 'bytes')
print(hdr)
for s in stats:
    print('%-16s %4d %5d %5d %6d %6d %5d %4d %6d %6d %9d' % (
        s['page'], s['sections'], s['cards'], s['spec_cards'], s['rows'], s['rows_priced'],
        s['rows_stock'], s['rows_oos'], s['cards_with_image'], s['images'], s['image_bytes']))
print('TOTAL', json.dumps(tot))
