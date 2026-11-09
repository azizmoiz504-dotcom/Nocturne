"""Small, fast copies of every product photo for the product lists.

The lists (catalogue cards, category photos, quote list, product pages) show assets/thumbs/<same path>.webp,
about a quarter of the size of the full photo; the product window still shows the full photo from assets/products/.
Only photos that are new or changed get a new copy, and copies of photos that were removed are deleted.
Runs on its own:  python3 tools/thumbs.py   (tools/build-pages.js runs it every time, so apply-edits does too.)
Needs Pillow (python3 -m pip install Pillow)."""
import os
import sys

from PIL import Image

SRC, OUT, SIDE, QUALITY = 'assets/products', 'assets/thumbs', 480, 78


def main():
    if not os.path.isdir(SRC):
        sys.exit('Run from the site folder (no ' + SRC + ' here)')
    made = kept = 0
    want = set()
    for root, _, files in os.walk(SRC):
        for f in files:
            if not f.lower().endswith(('.jpg', '.jpeg', '.png', '.webp')):
                continue
            src = os.path.join(root, f)
            rel = os.path.relpath(src, SRC)
            dst = os.path.join(OUT, os.path.splitext(rel)[0] + '.webp')
            want.add(os.path.normpath(dst))
            if os.path.exists(dst) and os.path.getmtime(dst) >= os.path.getmtime(src):
                kept += 1
                continue
            os.makedirs(os.path.dirname(dst), exist_ok=True)
            with Image.open(src) as im:
                alpha = im.mode in ('RGBA', 'LA') or (im.mode == 'P' and 'transparency' in im.info)
                im = im.convert('RGBA' if alpha else 'RGB')
                im.thumbnail((SIDE, SIDE), Image.LANCZOS)
                im.save(dst, 'WEBP', quality=QUALITY, method=6)
            made += 1
    gone = 0
    for root, _, files in os.walk(OUT):
        for f in files:
            p = os.path.normpath(os.path.join(root, f))
            if p not in want:
                os.remove(p)
                gone += 1
    for root, dirs, files in os.walk(OUT, topdown=False):
        if root != OUT and not os.listdir(root):
            os.rmdir(root)
    print('Small photos: %d made, %d already up to date, %d removed' % (made, kept, gone))


if __name__ == '__main__':
    main()
