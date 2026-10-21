#!/usr/bin/env python3
"""Builds the Bait Al Maqdis product editor (a web page to change prices, sizes, names and photos).

    python3 app/tools/bam-editor/build.py [--password-file FILE] [--out DIR]

Reads the private catalogue in app/bam/ and writes the page to app/build/bam-editor/ (default):
    index.html          the editor (tools/bam-editor/editor.html)
    data.bin            the product list
    photos/<name>.bin   small copies of the photos, one file per category
With --password-file, data.bin and the photos are locked (AES-GCM, key from the password with
PBKDF2-SHA256), so the page can sit on a public website and only people with the password see
the prices. Without it they are plain: only for a private place.
The person editing presses "Save changes file"; app/tools/bam-editor/apply.py puts that file into app/bam/.
"""
import argparse, io, json, os, struct, sys, time
from PIL import Image

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
from bamdata import APP, load, version, item_key, sec_key

ITER = 310000          # PBKDF2 rounds: the same number is in editor.html
THUMB = 320            # longest side of the photo copies in the editor


def thumb(path):
    im = Image.open(path)
    if im.mode in ('RGBA', 'LA', 'P'):
        im = im.convert('RGBA'); bg = Image.new('RGB', im.size, (255, 255, 255)); bg.paste(im, mask=im.split()[-1]); im = bg
    im = im.convert('RGB'); im.thumbnail((THUMB, THUMB), Image.LANCZOS)
    b = io.BytesIO(); im.save(b, 'JPEG', quality=76, optimize=True); return b.getvalue()


def pack(files):
    """4-byte length + JSON index {path: [offset, length]} + the photos one after another"""
    idx, body = {}, b''
    for p, data in files:
        idx[p] = [len(body), len(data)]; body += data
    head = json.dumps(idx, separators=(',', ':')).encode()
    return struct.pack('>I', len(head)) + head + body


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--bam', default=os.path.join(APP, 'bam'))
    ap.add_argument('--out', default=os.path.join(APP, 'build', 'bam-editor'))
    ap.add_argument('--password-file')
    a = ap.parse_args()

    data, ar = load(a.bam)
    d = ar['dict']
    ver = version(a.bam)
    cats, paths, total = [], [], 0
    for c in data['cats']:
        cid = c['id']
        secs = []
        for si, s in enumerate(c['secs']):
            items = []
            for ii, it in enumerate(s['items']):
                o = {'k': item_key(cid, si, ii), 'n': it['n'], 'ar': d.get(it['n'], ''), 'img': it.get('img') or '', 'r': it['r']}
                if it.get('spec'): o['spec'] = it['spec']
                items.append(o); total += 1
                paths += [it.get('img')] + list(it.get('spec') or [])
            secs.append({'k': sec_key(cid, si), 'n': s['n'], 'ar': d.get(s['n'], ''), 'items': items})
        cats.append({'id': cid, 'name': c['name'], 'ar': d.get(c['name'], ''), 'cover': c.get('cover') or '', 'secs': secs})
        paths.append(c.get('cover'))

    groups = {}
    for p in dict.fromkeys(x for x in paths if x):
        f = os.path.join(a.bam, p)
        if not os.path.isfile(f):
            print('photo missing, left out of the editor:', p); continue
        g = 'covers' if p.startswith('covers/') else p.split('/')[1]
        groups.setdefault(g, []).append((p, thumb(f)))

    key = salt = None
    if a.password_file:
        from cryptography.hazmat.primitives.ciphers.aead import AESGCM
        from cryptography.hazmat.primitives.kdf.pbkdf2 import PBKDF2HMAC
        from cryptography.hazmat.primitives import hashes
        pw = open(a.password_file, encoding='utf-8').read().strip()
        if len(pw) < 10: sys.exit('the password is too short')
        # the same salt every build (kept next to the password), so "Remember" on a device lasts across updates
        sf = a.password_file + '.salt'
        if not os.path.isfile(sf):
            with open(sf, 'w') as fh: fh.write(os.urandom(16).hex() + '\n')
        salt = bytes.fromhex(open(sf).read().strip())
        key = AESGCM(PBKDF2HMAC(algorithm=hashes.SHA256(), length=32, salt=salt, iterations=ITER).derive(pw.encode()))

    def seal(raw):
        if not key: return b'BAMP1' + raw
        iv = os.urandom(12)
        return b'BAME1' + salt + iv + key.encrypt(iv, raw, None)

    os.makedirs(os.path.join(a.out, 'photos'), exist_ok=True)
    for f in os.listdir(os.path.join(a.out, 'photos')): os.remove(os.path.join(a.out, 'photos', f))
    payload = {'ver': ver, 'built': time.strftime('%Y-%m-%d %H:%M'), 'total': total, 'cats': cats, 'bundles': sorted(groups)}
    with open(os.path.join(a.out, 'data.bin'), 'wb') as fh: fh.write(seal(json.dumps(payload, ensure_ascii=False, separators=(',', ':')).encode()))
    size = 0
    for g, files in groups.items():
        raw = pack(files); size += len(raw)
        with open(os.path.join(a.out, 'photos', g + '.bin'), 'wb') as fh: fh.write(seal(raw))
    page = open(os.path.join(HERE, 'editor.html'), encoding='utf-8').read()
    stamp = ver + '-' + time.strftime('%y%m%d%H%M')
    page = page.replace('<script>\n\'use strict\';', '<script>window.BAM_BUILD = %s;</script>\n<script>\n\'use strict\';' % json.dumps(stamp), 1)
    if 'BAM_BUILD = ' not in page: sys.exit('could not stamp editor.html')
    with open(os.path.join(a.out, 'index.html'), 'w', encoding='utf-8') as fh: fh.write(page)
    print('editor %s: %d products, %d categories, %d photo files (%.1f MB), %s' % (stamp, total, len(cats), len(groups), size / 1e6, 'LOCKED with the password' if key else 'NOT locked'))


if __name__ == '__main__':
    main()
