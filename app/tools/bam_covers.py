#!/usr/bin/env python3
"""Step 3 of importing the Bait Al Maqdis catalogue: gives every category its home-screen picture on white,
like the Fakhri Tools tiles. Their own category pictures (tiles/<cat>.jpg) are products on black under the
category's name: the name is taken out (the tile prints it), brand logos (Kapusi, SGS) stay with their white
letters made dark, and the black is made white.

Usage: python3 -I bam_covers.py <bam_dir>      (run by import-bam.sh; safe to run again)

Each category in data.js gets "cover": covers/<cat>.jpg made from its picture, or, with no picture, one of its
own product photos (the one named in PREFER, else the first with a white background).
"""
import json, os, sys
from PIL import Image, ImageChops, ImageDraw, ImageFilter

BAM = sys.argv[1]
PREFER = {'kapusi': 'adjustable ratchet handle', 'sgs': 'tile & granite cutter', 'shednet': 'green shade net',
          'gifittings': 'gi elbow 90', 'handequipment': 'plastic jerry can', 'hoses': 'gas hose',
          'paint': 'paint roller', 'shovels': 'square shovel'}
LOGO = {'kapusi', 'sgs'}   # the heading is the brand's logo, not the category's name
DARK = 24                  # the background is pure black; products' own dark parts are lighter than this
PATCH = 400                # black left between products is background when it is at least this many pixels
# in these the products themselves are black on black: only the black reached from the edges goes
NO_PATCH = {'kapusi', 'sgs'}

path = os.path.join(BAM, 'data.js')
src = open(path, encoding='utf-8').read()
head, body = src.split('\n', 1) if src.startswith('/*') else ('', src)
data = json.loads(body[body.index('{'):body.rstrip().rstrip(';').rindex('}') + 1])


def white_edges(rel):
    im = Image.open(os.path.join(BAM, rel)).convert('RGB')
    w, h = im.size
    px = [im.getpixel((x, y)) for x in range(0, w, max(1, w // 20)) for y in (0, h - 1)]
    px += [im.getpixel((x, y)) for y in range(0, h, max(1, h // 20)) for x in (0, w - 1)]
    return sum(1 for p in px if min(p) > 235) / len(px)


def areas(mask, box):
    """the connected white areas of a 0/255 mask inside box, each a list of points"""
    w, h = mask.size; m = mask.load(); seen = set(); out = []
    x0, y0, x1, y1 = box
    for y in range(y0, y1):
        for x in range(x0, x1):
            if m[x, y] and (x, y) not in seen:
                todo, pts = [(x, y)], []
                seen.add((x, y))
                while todo:
                    p = todo.pop(); pts.append(p)
                    for q in ((p[0] + 1, p[1]), (p[0] - 1, p[1]), (p[0], p[1] + 1), (p[0], p[1] - 1)):
                        if 0 <= q[0] < w and 0 <= q[1] < h and m[q] and q not in seen:
                            seen.add(q); todo.append(q)
                out.append(pts)
    return out


def on_white(cid):
    """the category's own picture on white, without its printed name"""
    im = Image.open(os.path.join(BAM, 'tiles', cid + '.jpg')).convert('RGB')
    w, h = im.size
    px = im.load()
    # the heading: white letters in the top third
    lit = im.convert('L').point(lambda v: 255 if v > 40 else 0)
    for pts in areas(lit, (0, 0, w, int(h * .32))):
        if max(p[1] for p in pts) > h * .32:
            continue                                   # reaches down into the products
        if sum(1 for p in pts if min(px[p]) > 170 and max(px[p]) - min(px[p]) < 50) < len(pts) * .35:
            continue                                   # coloured: a product, or the coloured part of a logo
        if cid in LOGO:
            for p in pts:                              # white letters made dark, soft edges kept
                v = max(px[p])
                if v > 40: px[p] = (24 + (255 - v) // 6,) * 3
        else:
            for p in pts:                              # the name goes, edges and all
                px[p] = (0, 0, 0)
                for dx in (-2, -1, 0, 1, 2):
                    for dy in (-2, -1, 0, 1, 2):
                        q = (p[0] + dx, p[1] + dy)
                        if 0 <= q[0] < w and 0 <= q[1] < h and max(px[q]) < 120: px[q] = (0, 0, 0)
    # the black background, from every edge
    seen = im.copy()
    for x in range(0, w, 4):
        for y in (0, h - 1):
            if max(seen.getpixel((x, y))) <= DARK: ImageDraw.floodfill(seen, (x, y), (255, 0, 255), thresh=DARK)
    for y in range(0, h, 4):
        for x in (0, w - 1):
            if max(seen.getpixel((x, y))) <= DARK: ImageDraw.floodfill(seen, (x, y), (255, 0, 255), thresh=DARK)
    r, g, b = seen.split()
    mask = ImageChops.multiply(ImageChops.multiply(r.point(lambda v: 255 if v == 255 else 0), g.point(lambda v: 255 if v == 0 else 0)),
                               b.point(lambda v: 255 if v == 255 else 0))
    if cid not in NO_PATCH:
        dr, dg, db = Image.eval(im, lambda v: 255 if v <= DARK else 0).split()
        for pts in areas(ImageChops.subtract(ImageChops.multiply(ImageChops.multiply(dr, dg), db), mask), (0, 0, w, h)):
            if len(pts) >= PATCH:
                for p in pts: mask.putpixel(p, 255)
    soft = mask.filter(ImageFilter.MaxFilter(3)).filter(ImageFilter.GaussianBlur(1))
    out = Image.composite(Image.new('RGB', im.size, (255, 255, 255)), im, soft)
    out = out.crop(mask.point(lambda v: 0 if v > 128 else 255).getbbox() or (0, 0, w, h))
    side = int(max(out.size) * 1.1)
    sq = Image.new('RGB', (side, side), (255, 255, 255))
    sq.paste(out, ((side - out.width) // 2, (side - out.height) // 2))
    sq.thumbnail((400, 400), Image.LANCZOS)
    os.makedirs(os.path.join(BAM, 'covers'), exist_ok=True)
    rel = 'covers/%s.jpg' % cid
    sq.save(os.path.join(BAM, rel), 'JPEG', quality=86, optimize=True, progressive=True)
    return rel


for c in data['cats']:
    if '-own-' in (c.get('cover') or ''):     # a picture chosen in the product editor stays
        print('%-16s %s (chosen in the editor)' % (c['id'], c['cover'])); continue
    if os.path.isfile(os.path.join(BAM, 'tiles', c['id'] + '.jpg')):
        c['cover'] = on_white(c['id'])
    else:
        items = [it for s in c['secs'] for it in s['items'] if it.get('img')]
        want = PREFER.get(c['id'])
        pick = next((it for it in items if want and want in it['n'].lower()), None)
        pick = pick or next((it for it in items if white_edges(it['img']) > .9), None) or (items[0] if items else None)
        c['cover'] = pick['img'] if pick else ''
    print('%-16s %s' % (c['id'], c['cover']))

with open(path, 'w', encoding='utf-8') as fh:
    fh.write((head + '\n' if head else '') + 'window.BAM_DATA = ' + json.dumps(data, ensure_ascii=False, separators=(',', ':')) + ';\n')
