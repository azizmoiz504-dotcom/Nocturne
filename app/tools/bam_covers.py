#!/usr/bin/env python3
"""Step 3 of importing the Bait Al Maqdis catalogue: gives every category a home-screen picture on white,
like the Fakhri Tools tiles (their old tiles are black banners with the name printed on them).

Usage: python3 -I bam_covers.py <bam_dir>      (run by import-bam.sh; safe to run again)

Each category in data.js gets "cover": one of its own product photos (the one named in PREFER, else the
first with a white background). A category with no product photos gets covers/<cat>.jpg, made from its old
banner: the printed name is cut off and the black background turned white.
"""
import json, os, sys
from PIL import Image, ImageChops, ImageDraw, ImageFilter

BAM = sys.argv[1]
PREFER = {'kapusi': 'adjustable ratchet handle', 'sgs': 'tile & granite cutter', 'shednet': 'green shade net',
          'gifittings': 'gi elbow 90', 'handequipment': 'plastic jerry can', 'hoses': 'gas hose',
          'paint': 'paint roller', 'shovels': 'square shovel'}

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


def from_banner(cid):
    """the old banner without its printed name, on white"""
    im = Image.open(os.path.join(BAM, 'tiles', cid + '.jpg')).convert('RGB')
    w, h = im.size
    im = im.crop((0, int(h * .24), w, h))            # the name is printed across the top quarter
    seen = im.copy()
    for x in range(0, im.width, 8):                  # fill the black background from every edge
        for y in (0, im.height - 1):
            if max(seen.getpixel((x, y))) < 60:
                ImageDraw.floodfill(seen, (x, y), (255, 0, 255), thresh=60)
    for y in range(0, im.height, 8):
        for x in (0, im.width - 1):
            if max(seen.getpixel((x, y))) < 60:
                ImageDraw.floodfill(seen, (x, y), (255, 0, 255), thresh=60)
    r, g, b = seen.split()
    mask = ImageChops.multiply(ImageChops.multiply(r.point(lambda v: 255 if v == 255 else 0), g.point(lambda v: 255 if v == 0 else 0)),
                               b.point(lambda v: 255 if v == 255 else 0))
    mask = mask.filter(ImageFilter.GaussianBlur(1.2))
    out = Image.composite(Image.new('RGB', im.size, (255, 255, 255)), im, mask)
    box = Image.eval(mask, lambda v: 255 - v).point(lambda v: 255 if v > 128 else 0).getbbox() or (0, 0, im.width, im.height)
    out = out.crop(box)
    side = int(max(out.size) * 1.12)
    sq = Image.new('RGB', (side, side), (255, 255, 255))
    sq.paste(out, ((side - out.width) // 2, (side - out.height) // 2))
    sq.thumbnail((400, 400), Image.LANCZOS)
    os.makedirs(os.path.join(BAM, 'covers'), exist_ok=True)
    rel = 'covers/%s.jpg' % cid
    sq.save(os.path.join(BAM, rel), 'JPEG', quality=82, optimize=True, progressive=True)
    return rel


for c in data['cats']:
    items = [it for s in c['secs'] for it in s['items'] if it.get('img')]
    want = PREFER.get(c['id'])
    pick = next((it for it in items if want and want in it['n'].lower()), None)
    pick = pick or next((it for it in items if white_edges(it['img']) > .9), None) or (items[0] if items else None)
    c['cover'] = pick['img'] if pick else from_banner(c['id'])
    print('%-16s %s' % (c['id'], c['cover']))

with open(path, 'w', encoding='utf-8') as fh:
    fh.write((head + '\n' if head else '') + 'window.BAM_DATA = ' + json.dumps(data, ensure_ascii=False, separators=(',', ':')) + ';\n')
