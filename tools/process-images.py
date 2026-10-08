"""
Builds the image assets for new catalogue lines and category tiles.

  python3 tools/process-images.py <source-dir> <assets/img>

  products/<slug>.webp          main photo for each line in tools/catalogue/additions.json
  range/<slug>-<n>.webp         gallery photos for those lines (Mabrook's baked-in name bar cropped off)
  cat/<category>.webp           2.4:1 category tiles (a Mabrook banner, or two product photos side by side)

Product photos for the original 75 lines are already in assets/img/products and are left as they are.
The logo is handled by tools/vectorize-logo.py. Requires Pillow and numpy.
"""
import json
import os
import sys

import numpy as np
from PIL import Image

SRC, OUT = sys.argv[1], sys.argv[2]
MB = os.path.join(SRC, "mabrook")
for d in ("products", "range", "cat"):
    os.makedirs(os.path.join(OUT, d), exist_ok=True)


def label_bar_top(a):
    """Mabrook item photos carry a flat grey name bar along the bottom; find where it starts."""
    for y in range(a.shape[0] // 2, a.shape[0]):
        row = a[y]
        if 190 < row.mean() < 235 and row.std(0).mean() < 12:
            return y
    return a.shape[0]


def product_photo(path, size=900, pad=0.08):
    im = Image.open(path).convert("RGB")
    a = np.asarray(im).astype(int)
    im = im.crop((0, 0, im.width, label_bar_top(a)))
    a = np.asarray(im).astype(int)
    ink = a.min(2) < 236
    ys, xs = np.where(ink)
    if len(xs):
        im = im.crop((xs.min(), ys.min(), xs.max() + 1, ys.max() + 1))
    side = int(max(im.size) * (1 + 2 * pad))
    canvas = Image.new("RGB", (side, side), "white")
    canvas.paste(im, ((side - im.width) // 2, (side - im.height) // 2))
    if side > size:
        canvas = canvas.resize((size, size), Image.LANCZOS)
    return canvas


def save(im, path, q=82):
    im.save(path, "WEBP", quality=q, method=6)


additions = json.load(open("tools/catalogue/additions.json"))
for p in additions:
    for i, (_, f) in enumerate(p["range"]):
        img = product_photo(os.path.join(MB, f))
        save(img, os.path.join(OUT, "range", f"{p['slug']}-{i + 1}.webp"))
        if i == 0:
            save(img, os.path.join(OUT, "products", f"{p['slug']}.webp"))
    print("product", p["slug"], len(p["range"]))

TW, TH = 1170, 480


def tile_from(images):
    tile = Image.new("RGB", (TW, TH), "white")
    w = TW // len(images)
    for i, im in enumerate(images):
        im = im.copy()
        im.thumbnail((int(w * 0.86), int(TH * 0.86)), Image.LANCZOS)
        tile.paste(im, (i * w + (w - im.width) // 2, (TH - im.height) // 2))
    return tile


for c in json.load(open("tools/catalogue/categories.json")):
    t = c["tile"]
    if "banner" in t:
        tile = Image.open(os.path.join(MB, t["banner"])).convert("RGB").resize((TW, TH), Image.LANCZOS)
    elif "compose_items" in t:
        tile = tile_from([product_photo(os.path.join(MB, f), 1200, 0.02) for f in t["compose_items"]])
    else:
        ims = []
        for slug in t["compose"]:
            im = Image.open(os.path.join(OUT, "products", slug + ".webp")).convert("RGB")
            a = np.asarray(im).astype(int)
            ys, xs = np.where(a.min(2) < 236)
            ims.append(im.crop((xs.min(), ys.min(), xs.max() + 1, ys.max() + 1)) if len(xs) else im)
        tile = tile_from(ims)
    save(tile.resize((960, 394), Image.LANCZOS), os.path.join(OUT, "cat", c["slug"] + ".webp"), 80)
    print("tile", c["slug"])
