"""
Turns the raw imagery from tools/fetch-source.sh into the optimised assets in assets/img:

  cat/       category renders, cut out to transparent PNG-style webp so they float on the night palette
  ind/       industry photography
  photo/     editorial photography
  team/      portraits
  products/  75 product photos (900px webp)
  partners/  16 manufacturer logos as a white silhouette (-mono) + colour version on its native ground
  brand/     the original AQM logo (used on the brochure cover)

Also writes <source>/partners.json, consumed by tools/build-data.py.

Usage: python3 tools/process-images.py <source-dir> <assets/img>
Requires Pillow, numpy, scipy.
"""
import json
import os
import sys

import numpy as np
from PIL import Image
from scipy import ndimage

SRC, OUT = sys.argv[1], sys.argv[2]
RAW = os.path.join(SRC, "raw")
for d in ["products", "cat", "ind", "photo", "team", "partners", "brand"]:
    os.makedirs(os.path.join(OUT, d), exist_ok=True)


def save(im, path, maxw=None, maxh=None, q=80):
    im = im.copy()
    if maxw or maxh:
        im.thumbnail((maxw or 10**5, maxh or 10**5), Image.LANCZOS)
    im.save(path, "WEBP", quality=q, method=6)
    return im.size


def cutout(im, thr=236, sat=16):
    """Remove a white / near-white background connected to the image border, with a soft edge."""
    a = np.asarray(im.convert("RGB")).astype(np.int16)
    mn, mx = a.min(2), a.max(2)
    lab, _ = ndimage.label((mn >= thr) & ((mx - mn) <= sat))
    border = set(np.unique(np.concatenate([lab[0], lab[-1], lab[:, 0], lab[:, -1]]))) - {0}
    bg = np.isin(lab, list(border))
    near = ndimage.binary_dilation(bg, iterations=2) & ~bg
    whiteness = np.clip((mn - 200) / 55.0, 0, 1)
    alpha = np.where(bg, 0.0, 1.0)
    alpha = np.where(near, 1.0 - whiteness * 0.85, alpha)
    alpha = ndimage.gaussian_filter(alpha, 0.6)
    return Image.fromarray(np.dstack([a.astype(np.uint8), (alpha * 255).astype(np.uint8)]), "RGBA")


def drop_enclosed_white(im, min_px=900):
    """Clear large pure-white islands (floor patches between products) that the border flood can't reach."""
    a = np.asarray(im).copy()
    rgb = a[..., :3].astype(np.int16)
    white = (rgb.min(2) >= 236) & ((rgb.max(2) - rgb.min(2)) <= 12) & (a[..., 3] > 0)
    lab, n = ndimage.label(white)
    sizes = ndimage.sum(white, lab, range(1, n + 1))
    kill = ndimage.binary_dilation(np.isin(lab, [i + 1 for i, s in enumerate(sizes) if s > min_px]), iterations=1)
    alpha = a[..., 3].astype(float) / 255
    alpha[kill] = 0
    a[..., 3] = (ndimage.gaussian_filter(alpha, 0.6) * 255).astype(np.uint8)
    return Image.fromarray(a, "RGBA")


def trim(im, pad=8):
    im = im.convert("RGBA")
    box = im.getchannel("A").point(lambda v: 255 if v > 8 else 0).getbbox()
    if box:
        l, t, r, b = box
        im = im.crop((max(0, l - pad), max(0, t - pad), min(im.width, r + pad), min(im.height, b + pad)))
    return im


# ---- category renders: (file, cutout thresholds or None if already transparent) ----
CATS = {
    "threaded-forged-fittings": ("Threaded-Fittings.png", None),
    "butt-welded-fittings": ("Buttwelded-Fittings.png", None),
    "flanges": ("Flanges.png", None),
    "structure-steel-ms-ss": ("Structure-sTEEL.png", None),
    "pipe-tubings": ("Pipes-Tubes.png", None),
    "hoses-connectors-assemblies": ("hydraulic-hoses-1.png", (214, 26)),
    "valves": ("Valves.png", (200, 30)),
    "gaskets-sheets": ("sheet_gaskets_subgroup.webp", None),
    "camlocks-couplings": ("slide2.png", None),
    "gi-mi-fittings": ("unnamed.jpg", (236, 16)),
    "insulations-tubes": ("03252023222055641f73c79b156.jpg", (205, 28)),
    "gauges-instrumentations": ("gauges-instrumentation.png", None),
}
for slug, (f, cut) in CATS.items():
    im = Image.open(os.path.join(RAW, f))
    im = cutout(im, *cut) if cut else im.convert("RGBA")
    if slug == "valves":
        im = drop_enclosed_white(im)
    print("cat", slug, save(trim(im), os.path.join(OUT, "cat", slug + ".webp"), 1100, 800, 82))

for slug, f in {"oil-gas": "OIL-GAS.png", "refineries": "PETRO-CHEMICALS.png", "marine": "OFFCHORE.png",
                "fire-safety": "FIRE-SAFETY.png", "drainage": "Seawage-Solutions.png", "construction": "CONSTRUCTION.png"}.items():
    save(Image.open(os.path.join(RAW, f)).convert("RGB"), os.path.join(OUT, "ind", slug + ".webp"), 1600, None, 78)

for slug, f in {"yard": "Gemini_Generated_Image_z1xgfrz1xgfrz1xg.png", "office": "Gemini_Generated_Image_ujhwnlujhwnlujhw.png",
                "offshore": "pexels-ganesh-ramsumair-489944037-30445637.jpg", "plant-blue-hour": "industrial-plant-during-sunset.jpg",
                "pipeline-sunset": "Oil-Gas.jpeg"}.items():
    save(Image.open(os.path.join(RAW, f)).convert("RGB"), os.path.join(OUT, "photo", slug + ".webp"), 1800, 1800, 80)

for slug, f in {"fariha-yousufi": "WhatsApp-Image-2026-04-27-at-3.07.24-PM-2.jpeg",
                "shahid-ali": "WhatsApp-Image-2026-04-27-at-3.07.24-PM-1-1.jpeg",
                "hussammuddin-hussain": "WhatsApp-Image-2026-04-27-at-3.22.06-PM-1.jpeg",
                "fahmidah-khan": "WhatsApp-Image-2026-04-27-at-3.07.25-PM-1.jpeg"}.items():
    save(Image.open(os.path.join(RAW, f)).convert("RGB"), os.path.join(OUT, "team", slug + ".webp"), 800, 800, 82)

trim(Image.open(os.path.join(RAW, "AQM-Oilfield-Equipments-Trading-F.Z.C.png")), 2).save(
    os.path.join(OUT, "brand", "aqm-logo.png"), optimize=True)

for p in json.load(open(os.path.join(SRC, "site", "products.json"))):
    if p["images"] and p["categories"]:
        src = os.path.join(RAW, "products", os.path.basename(p["images"][0]["src"]))
        save(Image.open(src).convert("RGB"), os.path.join(OUT, "products", p["slug"] + ".webp"), 900, 900, 80)
print("products done")

# ---- partner logos ----
LOGOS = [("benkan", "Benkan", "Benkan.png"), ("maass", "Maass Global Group", "Wmass-germ.jpg"),
         ("both-well", "Both-Well", "3.-BOTHWELL-1.png"), ("viraj", "Viraj", "Viraj.png"), ("yc-inox", "YC Inox", "YC-Inox.png"),
         ("spi", "SPI", "6.-SPI-1.png"), ("wolf", "Wolf Pipe & Fitting", "Wolf.png"), ("jazeera", "Jazeera Steel", "8.-JAZEERA.png"),
         ("wika", "WIKA", "Wika.png"), ("100tong", "100Tong", "100-Tong.png"), ("valve-tek", "Valve-tek", "11.-VALVE-TEK-1.jpg"),
         ("parker", "Parker", "12.-PARKER.png"), ("bonney-forge", "Bonney Forge", "13.-BONNEY-FORGED.jpg"),
         ("pegler", "Pegler", "Pegler.png"), ("ferolite", "Ferolite", "15.-FEROLITE.png"), ("italflex", "Italflex", "16.-ITALFLEX-1.png")]


def emit(slug, rgb, ink):
    """Write <slug>-mono.webp (white silhouette, alpha = ink) and <slug>.webp (colour), both cropped to the mark."""
    ys, xs = np.where(ink > 0.12)
    pad = 4
    y0, y1 = max(0, ys.min() - pad), min(rgb.shape[0], ys.max() + pad)
    x0, x1 = max(0, xs.min() - pad), min(rgb.shape[1], xs.max() + pad)
    ic = np.clip(ink[y0:y1, x0:x1], 0, 1) ** 0.85
    mono = Image.fromarray(np.dstack([np.full(ic.shape, 255)] * 3 + [ic * 255]).astype(np.uint8), "RGBA")
    col = Image.fromarray(rgb[y0:y1, x0:x1].astype(np.uint8), "RGB")
    for im in (mono, col):
        if im.height > 120:
            im.thumbnail((10**4, 120), Image.LANCZOS)
    mono.save(f"{OUT}/partners/{slug}-mono.webp", "WEBP", quality=90)
    col.save(f"{OUT}/partners/{slug}.webp", "WEBP", quality=88)
    return mono.size


meta = []
for slug, name, f in LOGOS:
    a = np.asarray(Image.open(os.path.join(RAW, f)).convert("RGBA")).astype(float)
    alpha = a[..., 3] / 255
    if slug == "maass":  # grey frame + decorative band under the mark
        rgb = a[..., :3]
        lum = rgb @ [0.299, 0.587, 0.114]
        cut = next(y for y in range(60, rgb.shape[0]) if np.percentile(lum[y], 95) < 200)
        rgb, lum = rgb[:cut], lum[:cut]
        sat = rgb.max(2) - rgb.min(2)
        ink = np.where(sat > 45, 1.0, np.clip((200 - lum) / 110, 0, 1))
        rgb = rgb.copy()
        rgb[ink < 0.1] = 255
        bg = np.array([255, 255, 255])
    elif slug == "jazeera":  # transparent PNG with its own white text box: flatten on white
        bg = np.array([255, 255, 255])
        rgb = a[..., :3] * alpha[..., None] + bg * (1 - alpha[..., None])
        ink = np.abs(rgb - bg).max(2) / 255 / 0.55
    else:
        if alpha.min() < 0.5:  # transparent: decide whether the mark wants a dark or light ground
            lum = (a[..., :3] @ [0.299, 0.587, 0.114])[alpha > 0.5].mean()
            bg = np.array([10, 13, 20]) if lum > 150 else np.array([255, 255, 255])
            rgb = a[..., :3] * alpha[..., None] + bg * (1 - alpha[..., None])
        else:
            rgb = a[..., :3]
            bg = np.median(np.array([rgb[1, 1], rgb[1, -2], rgb[-2, 1], rgb[-2, -2]]), 0)
        ink = np.abs(rgb - bg).max(2) / 255 / 0.55
    w, h = emit(slug, rgb, ink)
    meta.append({"slug": slug, "name": name, "bg": "#%02x%02x%02x" % tuple(int(v) for v in bg), "w": w, "h": h})
    print("logo", slug)
json.dump(meta, open(os.path.join(SRC, "partners.json"), "w"))
