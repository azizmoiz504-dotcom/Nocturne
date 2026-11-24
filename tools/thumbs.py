"""Small, fast copies of every product photo for the product lists.

The lists (catalogue cards, category photos, quote list, product pages) show assets/thumbs/<same path>.webp,
about a quarter of the size of the full photo; the product window still shows the full photo from assets/products/.
Only photos that are new or changed get a new copy, and copies of photos that were removed are deleted.
Runs on its own:  python3 tools/thumbs.py   (tools/build-pages.js runs it every time, so apply-edits does too.)
Needs Pillow (python3 -m pip install Pillow)."""
import os
import sys

from PIL import Image, ImageChops, ImageDraw

SRC, OUT, SIDE, QUALITY = 'assets/products', 'assets/thumbs', 480, 78
# 2026-11-24: every small photo is a white square with the product at the same size in the middle (FILL of the side),
# so tiles and cards line up even when the photos are framed differently (tall, small in a big margin, grey backdrop).
# Only photos on a plain light backdrop are reframed; the backdrop becomes white. Other photos are only made smaller.
# Bump STYLE to remake every small photo.
STYLE, FILL, TOL = '2', 0.84, 26


def plain_backdrop(im):
    w, h = im.size
    px = im.load()
    edge = [px[x, y] for x in range(0, w, max(1, w // 40)) for y in (0, h - 1)] + \
           [px[x, y] for y in range(0, h, max(1, h // 40)) for x in (0, w - 1)]
    med = tuple(sorted(c[i] for c in edge)[len(edge) // 2] for i in range(3))
    if min(med) < 225:
        return None
    near = sum(1 for c in edge if max(abs(c[i] - med[i]) for i in range(3)) <= TOL)
    return med if near >= 0.9 * len(edge) else None


def reframe(im):
    bg = plain_backdrop(im)
    if not bg:
        return None
    im = im.copy()
    w, h = im.size
    # the backdrop that touches the edges turns white (the product's own light parts stay as they are)
    for x, y in [(0, 0), (w - 1, 0), (0, h - 1), (w - 1, h - 1), (w // 2, 0), (w // 2, h - 1), (0, h // 2), (w - 1, h // 2)]:
        if max(abs(im.getpixel((x, y))[i] - bg[i]) for i in range(3)) <= TOL:
            ImageDraw.floodfill(im, (x, y), (255, 255, 255), thresh=TOL)
    diff = ImageChops.difference(im, Image.new('RGB', im.size, (255, 255, 255))).convert('L').point(lambda v: 255 if v > 18 else 0)
    box = diff.getbbox()
    if not box:
        return None
    obj = im.crop(box)
    k = SIDE * FILL / max(obj.size)
    obj = obj.resize((max(1, round(obj.width * k)), max(1, round(obj.height * k))), Image.LANCZOS)
    out = Image.new('RGB', (SIDE, SIDE), (255, 255, 255))
    out.paste(obj, ((SIDE - obj.width) // 2, (SIDE - obj.height) // 2))
    return out


def main():
    if not os.path.isdir(SRC):
        sys.exit('Run from the site folder (no ' + SRC + ' here)')
    made = kept = 0
    want = set()
    stamp = os.path.join(OUT, '.style')
    fresh = not os.path.exists(stamp) or open(stamp).read().strip() != STYLE
    for root, _, files in os.walk(SRC):
        for f in files:
            if not f.lower().endswith(('.jpg', '.jpeg', '.png', '.webp')):
                continue
            src = os.path.join(root, f)
            rel = os.path.relpath(src, SRC)
            dst = os.path.join(OUT, os.path.splitext(rel)[0] + '.webp')
            want.add(os.path.normpath(dst))
            if not fresh and os.path.exists(dst) and os.path.getmtime(dst) >= os.path.getmtime(src):
                kept += 1
                continue
            os.makedirs(os.path.dirname(dst), exist_ok=True)
            with Image.open(src) as im:
                alpha = im.mode in ('RGBA', 'LA') or (im.mode == 'P' and 'transparency' in im.info)
                im = im.convert('RGBA' if alpha else 'RGB')
                if alpha:   # transparent photos sit on white
                    flat = Image.new('RGB', im.size, (255, 255, 255))
                    flat.paste(im, mask=im.split()[-1])
                    im = flat
                im = reframe(im) or im
                im.thumbnail((SIDE, SIDE), Image.LANCZOS)
                im.save(dst, 'WEBP', quality=QUALITY, method=6)
            made += 1
    os.makedirs(OUT, exist_ok=True)
    with open(stamp, 'w') as fh:
        fh.write(STYLE + '\n')
    want.add(os.path.normpath(stamp))
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
