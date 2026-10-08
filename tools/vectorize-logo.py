"""
Traces the Fakhri Tools logo (a small JPEG) into crisp SVGs.

  python3 tools/vectorize-logo.py <logo.jpg> <out-dir>

Writes:
  emblem.svg               the FT emblem (navy square, red diamond, white FT)
  logo-stacked.svg         emblem over wordmark and tagline, as supplied
  logo-lockup.svg          horizontal: emblem left, wordmark + tagline right (for light grounds)
  logo-lockup-white.svg    same, wordmark and tagline in white (for the navy footer)
  favicon.svg, favicon-180.png, favicon-32.png
Requires Pillow, numpy, scipy, potracer.
"""
import os
import sys

import numpy as np
import potrace
from PIL import Image
from scipy import ndimage

SRC, OUT = sys.argv[1], sys.argv[2]
os.makedirs(OUT, exist_ok=True)
K = 6  # upscale factor before tracing

im = Image.open(SRC).convert("RGB")
W, H = im.size
big = np.asarray(im.resize((W * K, H * K), Image.LANCZOS)).astype(float)
r, g, b = big[..., 0], big[..., 1], big[..., 2]
lum = 0.299 * r + 0.587 * g + 0.114 * b

red_m = (r > 120) & (r - g > 70) & (r - b > 50)
navy_m = (b > g) & (b - r > 45) & (lum < 120)
dark_m = (lum < 110) & ~red_m & ~navy_m          # tagline ink

# Bands found by ink profile on the original (emblem, wordmark, tagline)
ink = np.asarray(im).min(2) < 200
rows = np.where(ink.any(1))[0]
bands, start = [], rows[0]
for a, b_ in zip(rows, rows[1:]):
    if b_ != a + 1:
        bands.append((start, a + 1)); start = b_
bands.append((start, rows[-1] + 1))
(e0, e1), (w0, w1), (t0, t1) = bands[:3]
ex = np.where(ink[e0:e1].any(0))[0]
wx = np.where(ink[w0:w1].any(0))[0]
tx = np.where(ink[t0:t1].any(0))[0]
EB = (ex.min(), e0, ex.max() + 1, e1)            # emblem box (x0, y0, x1, y1), original px
WB = (wx.min(), w0, wx.max() + 1, w1)
TB = (tx.min(), t0, tx.max() + 1, t1)


def mean_color(mask):
    c = big[mask].mean(0)
    return "#%02x%02x%02x" % tuple(int(round(v)) for v in c)


RED = mean_color(red_m & (big.min(2) < 200))
NAVY = mean_color(navy_m)
INK = "#232323"


def trace(mask, box, smooth=0.7):
    """Trace a boolean mask inside box (original px) → SVG path data in original-px coordinates."""
    x0, y0, x1, y1 = box
    m = mask[y0 * K:y1 * K, x0 * K:x1 * K]
    m = ndimage.gaussian_filter(m.astype(float), smooth * K / 3) > 0.5
    bm = potrace.Bitmap(~m)  # potracer traces the dark (False) pixels
    path = bm.trace(turdsize=int(K * K * 2), alphamax=1.0, opticurve=True, opttolerance=0.2)
    f = lambda p: f"{x0 + p.x / K:.2f},{y0 + p.y / K:.2f}"
    d = []
    for curve in path:
        d.append("M" + f(curve.start_point))
        for s in curve.segments:
            if s.is_corner:
                d.append("L" + f(s.c) + "L" + f(s.end_point))
            else:
                d.append("C" + f(s.c1) + " " + f(s.c2) + " " + f(s.end_point))
        d.append("Z")
    return "".join(d)


# Emblem: navy square, then everything inside it that isn't navy as white, then red on top.
ex0, ey0, ex1, ey1 = EB
inside = np.zeros_like(red_m)
inside[ey0 * K:ey1 * K, ex0 * K:ex1 * K] = True
navy_d = trace(navy_m & inside, EB, 0.9)
red_d = trace(red_m & inside, EB, 0.9)
word_d = trace(red_m, WB, 0.6)
tag_d = trace(dark_m, TB, 0.5)


def emblem_group(dx=0, dy=0, s=1):
    return (f'<g transform="translate({dx} {dy}) scale({s}) translate({-ex0} {-ey0})">'
            f'<rect x="{ex0}" y="{ey0}" width="{ex1 - ex0}" height="{ey1 - ey0}" fill="#fff"/>'
            f'<path fill="{NAVY}" fill-rule="evenodd" d="{navy_d}"/>'
            f'<path fill="{RED}" fill-rule="evenodd" d="{red_d}"/></g>')


def svg(w, h, body, title="Fakhri Tools"):
    return (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {w:.1f} {h:.1f}" role="img" aria-label="{title}">'
            f'<title>{title}</title>{body}</svg>\n')


ew, eh = ex1 - ex0, ey1 - ey0
open(f"{OUT}/emblem.svg", "w").write(svg(ew, eh, emblem_group()))

# Stacked, as supplied (cropped to ink)
x0 = min(EB[0], WB[0], TB[0]); x1 = max(EB[2], WB[2], TB[2])
sw, sh = x1 - x0, TB[3] - EB[1]
stacked = (f'<g transform="translate({-x0} {-EB[1]})">{emblem_group(ex0, ey0)}'
           f'<path fill="{RED}" fill-rule="evenodd" d="{word_d}"/><path fill="{INK}" fill-rule="evenodd" d="{tag_d}"/></g>')
open(f"{OUT}/logo-stacked.svg", "w").write(svg(sw, sh, stacked))

# Horizontal lockup: emblem scaled to the height of wordmark + gap + tagline
gap_wt = 9
block_h = (WB[3] - WB[1]) + gap_wt + (TB[3] - TB[1])
s = block_h / eh
pad = 14
tx_ = ew * s + pad
lw, lh = tx_ + (WB[2] - WB[0]), block_h


def lockup(word_fill, tag_fill):
    return (emblem_group(0, 0, s) +
            f'<g transform="translate({tx_ - WB[0]} {-WB[1]})"><path fill="{word_fill}" fill-rule="evenodd" d="{word_d}"/></g>'
            f'<g transform="translate({tx_ - TB[0]} {(WB[3] - WB[1]) + gap_wt - TB[1]})"><path fill="{tag_fill}" fill-rule="evenodd" d="{tag_d}"/></g>')


open(f"{OUT}/logo-lockup.svg", "w").write(svg(lw, lh, lockup(RED, INK)))
open(f"{OUT}/logo-lockup-white.svg", "w").write(svg(lw, lh, lockup("#ffffff", "#ffffff")))

# Favicons
open(f"{OUT}/favicon.svg", "w").write(svg(ew, eh, emblem_group()))
emb = im.crop(EB).resize((180, 180), Image.LANCZOS)
emb.save(f"{OUT}/favicon-180.png")
emb.resize((32, 32), Image.LANCZOS).save(f"{OUT}/favicon-32.png")
print(f"red={RED} navy={NAVY} emblem={EB} word={WB} tag={TB} lockup={lw:.0f}x{lh:.0f}")
