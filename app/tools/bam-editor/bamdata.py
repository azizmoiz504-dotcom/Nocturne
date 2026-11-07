"""Reads and writes the private shop catalogues the product editor changes:
Bait Al Maqdis (app/bam/data.js and ar.js) and Modern Electric (app/me/data.js and ar.js)."""
import hashlib, json, os

APP = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# the shops the product editor works on. kind: what a changes file from that shop says it is
SHOPS = {
    'bam': {'name': 'Bait Al Maqdis', 'dir': os.path.join(APP, 'bam'), 'data': 'BAM_DATA', 'ar': 'BAM_AR',
            'kind': 'bam-product-changes', 'file': 'bait-al-maqdis-product-changes.json'},
    'me': {'name': 'Modern Electric', 'dir': os.path.join(APP, 'me'), 'data': 'ME_DATA', 'ar': 'ME_AR',
           'kind': 'me-product-changes', 'file': 'modern-electric-product-changes.json'},
}


def shop_of(folder):
    """which shop a catalogue folder holds, from the name its data.js uses"""
    text = open(os.path.join(folder, 'data.js'), encoding='utf-8').read(4000)
    for sid, s in SHOPS.items():
        if 'window.%s = ' % s['data'] in text: return sid
    raise ValueError('not a shop catalogue: ' + folder)


def read_js(path, var):
    """returns (header comment line, value) of a file written as  /* ... */ \\n window.VAR = {...};"""
    text = open(path, encoding='utf-8').read()
    start = text.index('window.%s = ' % var)
    head = text[:start].strip()
    body = text[start + len('window.%s = ' % var):].strip()
    if body.endswith(';'): body = body[:-1]
    return head, json.loads(body)


def write_js(path, var, head, value):
    tmp = path + '.part'
    with open(tmp, 'w', encoding='utf-8') as fh:
        fh.write((head + '\n' if head else '') + 'window.%s = ' % var + json.dumps(value, ensure_ascii=False, separators=(',', ':')) + ';\n')
    os.replace(tmp, path)


def load(folder):
    s = SHOPS[shop_of(folder)]
    return read_js(os.path.join(folder, 'data.js'), s['data'])[1], read_js(os.path.join(folder, 'ar.js'), s['ar'])[1]


def version(folder):
    """a fingerprint of the list: a changes file says which list it was made from"""
    h = hashlib.sha256()
    for f in ('data.js', 'ar.js'):
        h.update(open(os.path.join(folder, f), 'rb').read())
    return h.hexdigest()[:12]


# keys the editor gives each product and group, so a changes file says what was renamed, moved or deleted
def item_key(cid, si, ii): return '%s.%d.%d' % (cid, si, ii)
def sec_key(cid, si): return 's:%s.%d' % (cid, si)
