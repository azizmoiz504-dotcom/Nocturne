"""
Generates src/data.js for the Fakhri Tools site.

Inputs (committed):  tools/catalogue/base.json, additions.json, categories.json
Inputs (cache):      <source>/geo/countries-10m.json  (Natural Earth via world-atlas, public domain)

Usage: python3 tools/build-data.py <source-dir>
"""
import json
import math
import os
import sys

S = sys.argv[1]
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CAT = os.path.join(ROOT, "tools", "catalogue")

SITE = {
    "name": "Fakhri Tools & Workshop Materials Trading LLC",
    "short": "Fakhri Tools",
    "phone": "+971 4 285 0135",
    "tel": "+97142850135",
    # Not supplied yet. Set these and the site switches on email / WhatsApp actions everywhere.
    "email": None,
    "whatsapp": None,
    "address": ["Warehouse 8, 8th Street", "Al Quoz Industrial Area 3", "Al Quoz, Dubai", "United Arab Emirates"],
    "addressLine": "Wh #8, 8th St, Al Quoz Industrial Area 3, Dubai",
    "maps": "https://www.google.com/maps/search/?api=1&query=Fakhri+Tools+%26+Workshop+Materials+Trading+LLC+Al+Quoz+Dubai",
    # Monday–Saturday 7:30am–6:00pm, Sunday closed (Gulf Standard Time, UTC+4)
    "hours": {"days": [1, 2, 3, 4, 5, 6], "open": [7, 30], "close": [18, 0]},
    # Public address of the site, with a trailing slash. Canonical links, the sitemap and structured data use it.
    # Change it to the shop's own domain (for example "https://www.example.ae/") once one is set up.
    "url": "https://azizmoiz504-dotcom.github.io/Nocturne/",
    # Google Analytics 4 measurement ID (for example "G-XXXXXXXXXX"). While empty, no analytics code is loaded.
    "ga4": None,
}

# --------------------------------------------------------------------------------------
# Catalogue
# --------------------------------------------------------------------------------------
cats = json.load(open(os.path.join(CAT, "categories.json")))
base = json.load(open(os.path.join(CAT, "base.json")))
adds = json.load(open(os.path.join(CAT, "additions.json")))
order = [c["slug"] for c in cats]

products = []
for slug in order:
    items = [p for p in base if p["cat"] == slug] + [p for p in adds if p["cat"] == slug]
    n = order.index(slug) + 1
    for i, p in enumerate(items):
        out = {"slug": p["slug"], "name": p["name"], "cat": slug, "ref": f"{n:02d}.{i + 1:02d}", "desc": p["desc"],
               "img": p.get("img") or f"assets/img/products/{p['slug']}.webp"}
        if "specs" in p:
            out["specs"] = p["specs"]
        if "range" in p:
            out["range"] = [{"name": name, "img": f"assets/img/range/{p['slug']}-{k + 1}.webp"} for k, (name, _) in enumerate(p["range"])]
        products.append(out)

categories = []
for i, c in enumerate(cats):
    categories.append({"slug": c["slug"], "name": c["name"], "short": c["short"], "blurb": c["blurb"], "n": i + 1,
                       "count": sum(1 for p in products if p["cat"] == c["slug"]), "img": f"assets/img/cat/{c['slug']}.webp"})

# Lean index for header search suggestions (shipped to the browser)
search = [[p["slug"], p["name"], next(c["short"] for c in categories if c["slug"] == p["cat"]), p["ref"]] for p in products]

# --------------------------------------------------------------------------------------
# Store map: Dubai coast from Jebel Ali to Ajman, Natural Earth 1:10m
# --------------------------------------------------------------------------------------
BOX = (54.98, 24.98, 55.62, 25.44)  # lon0, lat0, lon1, lat1
W = 1000
K = math.cos(math.radians((BOX[1] + BOX[3]) / 2))
H = round(W * (BOX[3] - BOX[1]) / ((BOX[2] - BOX[0]) * K))


def proj(lon, lat):
    return ((lon - BOX[0]) / (BOX[2] - BOX[0]) * W, (BOX[3] - lat) / (BOX[3] - BOX[1]) * H)


def decode(topo, geom):
    sx, sy = topo["transform"]["scale"]
    tx, ty = topo["transform"]["translate"]
    arcs = []
    for arc in topo["arcs"]:
        x = y = 0
        pts = []
        for dx, dy in arc:
            x += dx; y += dy
            pts.append((x * sx + tx, y * sy + ty))
        arcs.append(pts)

    def ring(idx):
        pts = []
        for a in idx:
            seg = arcs[a] if a >= 0 else list(reversed(arcs[~a]))
            pts.extend(seg if not pts else seg[1:])
        return pts

    polys = geom["arcs"] if geom["type"] == "MultiPolygon" else [geom["arcs"]]
    return [[ring(r) for r in poly] for poly in polys]


def clip(ring, inside, inter):
    if not ring:
        return ring
    out, prev = [], ring[-1]
    for cur in ring:
        if inside(cur):
            if not inside(prev):
                out.append(inter(prev, cur))
            out.append(cur)
        elif inside(prev):
            out.append(inter(prev, cur))
        prev = cur
    return out


m = 0.2
x0, y0, x1, y1 = BOX[0] - m, BOX[1] - m, BOX[2] + m, BOX[3] + m
lx = lambda a, b, x: (x, a[1] + (x - a[0]) / (b[0] - a[0]) * (b[1] - a[1]))
ly = lambda a, b, y: (a[0] + (y - a[1]) / (b[1] - a[1]) * (b[0] - a[0]), y)
EDGES = [(lambda p: p[0] >= x0, lambda a, b: lx(a, b, x0)), (lambda p: p[0] <= x1, lambda a, b: lx(a, b, x1)),
         (lambda p: p[1] >= y0, lambda a, b: ly(a, b, y0)), (lambda p: p[1] <= y1, lambda a, b: ly(a, b, y1))]

topo = json.load(open(os.path.join(S, "geo", "countries-10m.json")))
uae = next(g for g in topo["objects"]["countries"]["geometries"] if g.get("id") == "784")
d = []
for poly in decode(topo, uae):
    for r in poly:
        for e in EDGES:
            r = clip(r, *e)
        if len(r) < 3:
            continue
        pts = [proj(*p) for p in r]
        keep = [pts[0]]
        for p in pts[1:]:
            if abs(p[0] - keep[-1][0]) + abs(p[1] - keep[-1][1]) > 0.8:
                keep.append(p)
        if len(keep) >= 3:
            d.append("M" + "L".join(f"{x:.1f},{y:.1f}" for x, y in keep) + "Z")

PLACES = [("Jebel Ali", 25.005, 55.08), ("Dubai Marina", 25.08, 55.14), ("Downtown", 25.197, 55.274),
          ("Deira", 25.27, 55.32), ("DXB Airport", 25.253, 55.365), ("Sharjah", 25.346, 55.42)]
STORE = (25.125, 55.222)  # Al Quoz Industrial Area 3, approximate
mapdata = {"w": W, "h": H, "land": "".join(d),
           "places": [{"name": n, "x": round(proj(lo, la)[0], 1), "y": round(proj(lo, la)[1], 1)} for n, la, lo in PLACES],
           "store": {"x": round(proj(STORE[1], STORE[0])[0], 1), "y": round(proj(STORE[1], STORE[0])[1], 1)}}

PIPE = [
    ["½″", 21.3, {"40": 2.77, "80": 3.73, "160": 4.78, "XXS": 7.47}],
    ["¾″", 26.7, {"40": 2.87, "80": 3.91, "160": 5.56, "XXS": 7.82}],
    ["1″", 33.4, {"40": 3.38, "80": 4.55, "160": 6.35, "XXS": 9.09}],
    ["1¼″", 42.2, {"40": 3.56, "80": 4.85, "160": 6.35, "XXS": 9.70}],
    ["1½″", 48.3, {"40": 3.68, "80": 5.08, "160": 7.14, "XXS": 10.15}],
    ["2″", 60.3, {"40": 3.91, "80": 5.54, "160": 8.74, "XXS": 11.07}],
    ["2½″", 73.0, {"40": 5.16, "80": 7.01, "160": 9.53, "XXS": 14.02}],
    ["3″", 88.9, {"40": 5.49, "80": 7.62, "160": 11.13, "XXS": 15.24}],
    ["4″", 114.3, {"40": 6.02, "80": 8.56, "160": 13.49, "XXS": 17.12}],
    ["5″", 141.3, {"40": 6.55, "80": 9.53, "160": 15.88, "XXS": 19.05}],
    ["6″", 168.3, {"40": 7.11, "80": 10.97, "160": 18.26, "XXS": 21.95}],
    ["8″", 219.1, {"40": 8.18, "80": 12.70, "160": 23.01, "XXS": 22.23}],
    ["10″", 273.0, {"40": 9.27, "80": 15.09, "160": 28.58, "XXS": 25.40}],
    ["12″", 323.8, {"40": 10.31, "80": 17.48, "160": 33.32, "XXS": 25.40}],
    ["14″", 355.6, {"40": 11.13, "80": 19.05, "160": 35.71}],
    ["16″", 406.4, {"40": 12.70, "80": 21.44, "160": 40.49}],
    ["18″", 457.0, {"40": 14.27, "80": 23.83, "160": 45.24}],
    ["20″", 508.0, {"40": 15.09, "80": 26.19, "160": 50.01}],
    ["24″", 610.0, {"40": 17.48, "80": 30.96, "160": 59.54}],
]

data = {"SITE": SITE, "CATEGORIES": categories, "PRODUCTS": products, "SEARCH": search, "MAP": mapdata, "PIPE": PIPE}
out = ["// Generated by tools/build-data.py — do not edit by hand.\n"]
for k, v in data.items():
    out.append(f"export const {k} = {json.dumps(v, ensure_ascii=False, separators=(',', ':'))};\n")
open(os.path.join(ROOT, "src", "data.js"), "w").write("".join(out))
print(f"products={len(products)} categories={len(categories)} map={W}x{H} land={len(mapdata['land'])}B")
for c in categories:
    print(f"  {c['n']:02d} {c['name']:<30} {c['count']}")
