"""Reads and writes the private Bait Al Maqdis catalogue files (app/bam/data.js and ar.js)."""
import hashlib, json, os

APP = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))


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


def load(bam):
    return read_js(os.path.join(bam, 'data.js'), 'BAM_DATA')[1], read_js(os.path.join(bam, 'ar.js'), 'BAM_AR')[1]


def version(bam):
    """a fingerprint of the list: a changes file says which list it was made from"""
    h = hashlib.sha256()
    for f in ('data.js', 'ar.js'):
        h.update(open(os.path.join(bam, f), 'rb').read())
    return h.hexdigest()[:12]


# keys the editor gives each product and group, so a changes file says what was renamed, moved or deleted
def item_key(cid, si, ii): return '%s.%d.%d' % (cid, si, ii)
def sec_key(cid, si): return 's:%s.%d' % (cid, si)
