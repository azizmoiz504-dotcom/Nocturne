"""
Generates src/data.js — every piece of content on the prototype comes from here.

Inputs (scraped from https://aqmoilfield.com, see README):
  <scratch>/site/products.json     WooCommerce Store API dump (75 products)
  <scratch>/partners.json          partner logo metadata (from the logo pipeline)
  <scratch>/geo/land-110m.json     world-atlas@2.0.2 (Natural Earth, public domain)
  <scratch>/geo/countries-10m.json world-atlas@2.0.2

Usage: python3 tools/build-data.py <scratch-dir>
"""
import html
import json
import math
import os
import re
import sys

S = sys.argv[1]
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

# --------------------------------------------------------------------------------------
# Catalogue
# --------------------------------------------------------------------------------------
CATEGORIES = [
    # slug, display name, homepage blurb (verbatim from the live site)
    ("threaded-forged-fittings", "Threaded & Forged Fittings",
     "High-strength fittings designed for secure threaded connections in piping systems. Suitable for both low and high-pressure applications, ensuring reliability in critical operations."),
    ("butt-welded-fittings", "Butt-welded Fittings",
     "Precision-engineered fittings used to connect pipes through welding for a permanent and leak-proof system. Ideal for high-pressure and high-temperature applications across oil & gas, petrochemical, and water industries."),
    ("flanges", "Flanges",
     "Robust flange solutions for connecting pipes, valves, and equipment. Manufactured to international standards, our flanges ensure secure connections, easy maintenance, and excellent sealing performance."),
    ("structure-steel-ms-ss", "Structure Steel (MS & SS)",
     "A comprehensive range of structural steel products used in construction and fabrication. Known for strength and versatility, our materials are suitable for buildings, industrial frameworks, and heavy-duty applications."),
    ("pipe-tubings", "Pipe & Tubings",
     "High-quality piping solutions designed for industrial, commercial, and infrastructure applications. Our range includes carbon steel, stainless steel, and plastic pipes suitable for fluid transfer, structural use, and high-pressure systems, ensuring durability, corrosion resistance, and reliable performance."),
    ("hoses-connectors-assemblies", "Hoses, Connectors & Assemblies",
     "Flexible and durable hose solutions for transferring fluids, air, and chemicals. Designed to handle varying pressures and environments with high performance and reliability."),
    ("valves", "Industrial Valves",
     "Reliable flow control solutions designed for regulating, directing, and controlling liquids and gases. Our valves are built for durability and efficiency in demanding industrial environments."),
    ("gaskets-sheets", "Gaskets & Sheets",
     "Sealing solutions designed to prevent leakage between connected surfaces. Available in various materials to withstand high temperature, pressure, and chemical exposure."),
    ("camlocks-couplings", "Camlocks & Couplings",
     "Quick-connect coupling systems designed for fast and secure hose and pipe connections. Widely used in fluid transfer applications for their ease of use and leak-proof performance."),
    ("gi-mi-fittings", "GI & MI Fittings",
     "Durable galvanized and malleable iron fittings designed for plumbing and pipeline systems. These fittings offer corrosion resistance and are ideal for water, gas, and general piping applications."),
    ("insulations-tubes", "Insulation & Tubes",
     "Thermal and protective insulation materials designed to reduce heat loss and improve energy efficiency. Suitable for industrial, HVAC, and construction applications."),
    ("gauges-instrumentations", "Gauges & Instrumentation",
     "Precision instruments used to measure pressure, temperature, and flow in industrial systems. Designed for accuracy, safety, and reliable monitoring of operations."),
]
CAT_ORDER = [c[0] for c in CATEGORIES]

# Typos on the live site, corrected for the prototype (listed in the README)
NAME_FIXES = {
    "NEEDAL VALVES": "Needle Valves",
    "VACCUM GAUGES": "Vacuum Gauges",
    "BAURER COUPLINGS": "Bauer Couplings",
    "GI PIPES (THREAED & PLAIN END)": "GI Pipes (Threaded & Plain End)",
    "THREADED & SOCKED-WELDED VALVES": "Threaded & Socket-Welded Valves",
    "PNEUMATIC (Pu) HOSES": "Pneumatic (PU) Hoses",
    "LOW PRESSURE #150 THREADED FITTINGS": "Low Pressure #150 Threaded Fittings",
    "HIGH PRESSURE 2000PSI, 3000PSI, & 6000PSI FITTINGS": "High Pressure 2000, 3000 & 6000 PSI Fittings",
    "LOW PRESSURE 1000PSI FITTINGS": "Low Pressure 1000 PSI Fittings",
    "SS SEAMLESS, ERW, EFW, LSAW & HFW PIPES": "SS Seamless, ERW, EFW, LSAW & HFW Pipes",
}
ACRONYMS = {"GI", "MI", "HDG", "HDPE", "PPR", "PVC", "HP", "SS", "CS", "MS", "EPDM", "NBR", "PTFE", "EN8",
            "HRC", "PU", "PSI", "ERW", "EFW", "LSAW", "HFW", "CS/MS"}
SMALL = {"and", "of", "for", "the", "&"}


def title(name):
    name = html.unescape(name).strip()
    if name in NAME_FIXES:
        return NAME_FIXES[name]
    out = []
    for i, w in enumerate(name.split()):
        core = w.strip("()")
        if core.upper() in ACRONYMS:
            fixed = core.upper()
        elif i and core.lower() in SMALL:
            fixed = core.lower()
        else:
            fixed = "-".join(p[:1].upper() + p[1:].lower() for p in core.split("-"))
        out.append(w.replace(core, fixed))
    return " ".join(out)


def clean(text):
    text = re.sub(r"<[^>]+>", " ", text or "")
    text = html.unescape(text).replace("¬", "")
    text = re.sub(r"\s+", " ", text).strip()
    text = text.replace(" ,", ",").replace(" .", ".")
    if text and not text.endswith("."):
        text += "."
    return text


raw = json.load(open(os.path.join(S, "site", "products.json")))
cat_by_name = {
    "THREADED & FORGED FITTINGS": "threaded-forged-fittings", "GI & MI FITTINGS": "gi-mi-fittings",
    "Pipe & Tubings": "pipe-tubings", "GAUGES & INSTRUMENTATIONS": "gauges-instrumentations",
    "INSULATIONS & TUBES": "insulations-tubes", "HOSES, CONNECTORS & ASSEMBLIES": "hoses-connectors-assemblies",
    "CAMLOCKS & COUPLINGS": "camlocks-couplings", "GASKETS & SHEETS": "gaskets-sheets",
    "INDUSTRIAL VAVLES": "valves", "Structure Steel (MS & SS)": "structure-steel-ms-ss",
    "Flanges": "flanges", "Butt-welded Fittings": "butt-welded-fittings",
}
products = []
for p in raw:
    if not p["categories"]:
        continue  # the one "Uncategorized" placeholder product
    cat = cat_by_name[html.unescape(p["categories"][0]["name"])]
    products.append({
        "slug": p["slug"],
        "name": title(p["name"]),
        "cat": cat,
        "desc": clean(p["description"]),
        "img": f"assets/img/products/{p['slug']}.webp",
    })
# stable order: by category order, then the order the store lists them
products.sort(key=lambda x: CAT_ORDER.index(x["cat"]))

categories = []
for i, (slug, name, blurb) in enumerate(CATEGORIES):
    items = [p for p in products if p["cat"] == slug]
    categories.append({"slug": slug, "name": name, "blurb": blurb, "count": len(items),
                       "img": f"assets/img/cat/{slug}.webp", "n": i + 1})

# --------------------------------------------------------------------------------------
# Globe: land dots spaced evenly over the sphere (Natural Earth 110m land)
# --------------------------------------------------------------------------------------
def decode_topo(topo, obj):
    sx, sy = topo["transform"]["scale"]
    tx, ty = topo["transform"]["translate"]
    arcs = []
    for arc in topo["arcs"]:
        x = y = 0
        pts = []
        for dx, dy in arc:
            x += dx
            y += dy
            pts.append((x * sx + tx, y * sy + ty))
        arcs.append(pts)

    def ring(idx):
        pts = []
        for a in idx:
            seg = arcs[a] if a >= 0 else list(reversed(arcs[~a]))
            pts.extend(seg if not pts else seg[1:])
        return pts

    def geom(g):
        if g["type"] == "Polygon":
            return [[ring(r) for r in g["arcs"]]]
        if g["type"] == "MultiPolygon":
            return [[ring(r) for r in poly] for poly in g["arcs"]]
        if g["type"] == "GeometryCollection":
            return [p for gg in g["geometries"] for p in geom(gg)]
        return []

    return geom(topo["objects"][obj])


def inside(pt, rings):
    x, y = pt
    c = False
    for r in rings:
        n = len(r)
        j = n - 1
        for i in range(n):
            xi, yi = r[i]
            xj, yj = r[j]
            if (yi > y) != (yj > y) and x < (xj - xi) * (y - yi) / (yj - yi + 1e-12) + xi:
                c = not c
            j = i
    return c


land = decode_topo(json.load(open(os.path.join(S, "geo", "land-110m.json"))), "land")
polys = []
for poly in land:
    xs = [p[0] for p in poly[0]]
    ys = [p[1] for p in poly[0]]
    polys.append((min(xs), max(xs), min(ys), max(ys), poly))

STEP = 1.55
dots = []
lat = -56.0
while lat <= 78:
    n = max(1, int(round(360 * math.cos(math.radians(lat)) / STEP)))
    for k in range(n):
        lon = -180 + (k + 0.5) * 360 / n
        for x0, x1, y0, y1, poly in polys:
            if x0 <= lon <= x1 and y0 <= lat <= y1 and inside((lon, lat), poly):
                dots.append((round(lat, 1), round(lon, 1)))
                break
    lat += STEP
globe = [v for d in dots for v in d]

# --------------------------------------------------------------------------------------
# UAE map (contact page): countries-10m, clipped to the northern Emirates window
# --------------------------------------------------------------------------------------
BOX = (53.6, 24.15, 56.75, 26.25)  # lon0, lat0, lon1, lat1
W = 1000
K = math.cos(math.radians((BOX[1] + BOX[3]) / 2))
H = round(W * (BOX[3] - BOX[1]) / ((BOX[2] - BOX[0]) * K))


def proj(lon, lat):
    return ((lon - BOX[0]) / (BOX[2] - BOX[0]) * W, (BOX[3] - lat) / (BOX[3] - BOX[1]) * H)


def clip(ring, edge):
    out = []
    if not ring:
        return out
    inside_fn, inter = edge
    prev = ring[-1]
    for cur in ring:
        if inside_fn(cur):
            if not inside_fn(prev):
                out.append(inter(prev, cur))
            out.append(cur)
        elif inside_fn(prev):
            out.append(inter(prev, cur))
        prev = cur
    return out


def lerp_x(a, b, x):
    t = (x - a[0]) / (b[0] - a[0])
    return (x, a[1] + t * (b[1] - a[1]))


def lerp_y(a, b, y):
    t = (y - a[1]) / (b[1] - a[1])
    return (a[0] + t * (b[0] - a[0]), y)


m = 0.3
x0, y0, x1, y1 = BOX[0] - m, BOX[1] - m, BOX[2] + m, BOX[3] + m
EDGES = [
    (lambda p: p[0] >= x0, lambda a, b: lerp_x(a, b, x0)),
    (lambda p: p[0] <= x1, lambda a, b: lerp_x(a, b, x1)),
    (lambda p: p[1] >= y0, lambda a, b: lerp_y(a, b, y0)),
    (lambda p: p[1] <= y1, lambda a, b: lerp_y(a, b, y1)),
]
topo10 = json.load(open(os.path.join(S, "geo", "countries-10m.json")))
geoms = {g.get("id"): g for g in topo10["objects"]["countries"]["geometries"]}
uae_paths = {}
for cid, key in [("784", "uae"), ("512", "oman"), ("682", "saudi"), ("634", "qatar"), ("364", "iran")]:
    sub = {"type": "GeometryCollection", "geometries": [geoms[cid]]}
    topo10["objects"]["_tmp"] = sub
    d = []
    for poly in decode_topo(topo10, "_tmp"):
        for r in poly:
            for e in EDGES:
                r = clip(r, e)
            if len(r) < 3:
                continue
            pts = [proj(*p) for p in r]
            # drop points closer than 0.6px to keep the path light
            keep = [pts[0]]
            for p in pts[1:]:
                if abs(p[0] - keep[-1][0]) + abs(p[1] - keep[-1][1]) > 0.6:
                    keep.append(p)
            if len(keep) < 3:
                continue
            d.append("M" + "L".join(f"{x:.1f},{y:.1f}" for x, y in keep) + "Z")
    uae_paths[key] = "".join(d)

PLACES = [
    ("Ajman", 25.405, 55.445, True), ("Dubai", 25.20, 55.27, False), ("Sharjah", 25.346, 55.42, False),
    ("Umm Al Quwain", 25.565, 55.555, False), ("Ras Al Khaimah", 25.79, 55.94, False),
    ("Fujairah", 25.12, 56.33, False), ("Abu Dhabi", 24.45, 54.38, False),
]
places = []
for name, la, lo, hq in PLACES:
    x, y = proj(lo, la)
    places.append({"name": name, "x": round(x, 1), "y": round(y, 1), "hq": hq})

# --------------------------------------------------------------------------------------
# Everything else (copy verbatim from the live site unless noted)
# --------------------------------------------------------------------------------------
partners = json.load(open(os.path.join(S, "partners.json")))

data = {
    "SITE": {
        "name": "AQM Oilfield Equipments Trading F.Z.C",
        "short": "AQM Oilfield",
        "phone": "+971 52 725 1355",
        "tel": "+971527251355",
        "whatsapp": "971527251355",
        "email": "Sales@aqmoilfield.com",
        "address": ["C1 Tower, First Floor", "Ajman Free Zone", "Sheikh Rashid Bin Saeed Al Maktoum Street",
                    "Al Bustan Area, Ajman, UAE"],
        "maps": "https://www.google.com/maps/search/?api=1&query=C1+Tower+Ajman+Free+Zone+Ajman+UAE",
        "hours": {"open": "08:00", "close": "18:30", "days": [1, 2, 3, 4, 5, 6]},
        "tagline": "We planted our roots with a commitment to earning your trust and protecting lives, property, and prestige.",
    },
    "CATEGORIES": categories,
    "PRODUCTS": products,
    "PARTNERS": partners,
    "SOURCING": [
        {"code": "DE", "name": "Germany", "lat": 53.55, "lon": 9.99},
        {"code": "UK", "name": "United Kingdom", "lat": 51.51, "lon": -0.13},
        {"code": "IN", "name": "India", "lat": 19.08, "lon": 72.88},
        {"code": "CN", "name": "China", "lat": 31.23, "lon": 121.47},
        {"code": "TW", "name": "Taiwan", "lat": 22.62, "lon": 120.30},
        {"code": "MY", "name": "Malaysia", "lat": 3.0, "lon": 101.39},
        {"code": "SG", "name": "Singapore", "lat": 1.29, "lon": 103.85},
    ],
    "HUB": {"name": "Ajman Free Zone", "lat": 25.405, "lon": 55.445},
    "MARKETS": [
        {"region": "GCC", "lat": 24.71, "lon": 46.68}, {"region": "GCC", "lat": 25.29, "lon": 51.53},
        {"region": "GCC", "lat": 23.59, "lon": 58.41}, {"region": "GCC", "lat": 29.37, "lon": 47.98},
        {"region": "GCC", "lat": 26.23, "lon": 50.59},
        {"region": "Africa", "lat": -1.29, "lon": 36.82}, {"region": "Africa", "lat": 6.52, "lon": 3.38},
        {"region": "Africa", "lat": 30.04, "lon": 31.24}, {"region": "Africa", "lat": -26.2, "lon": 28.05},
        {"region": "Africa", "lat": -6.8, "lon": 39.28},
    ],
    "INDUSTRIES": [
        {"slug": "oil-gas", "name": "Oil & Gas",
         "text": "High-quality piping materials including pipes, flanges, fittings, and valves for the oil & gas industry. Our products are sourced from trusted manufacturers and meet international industry standards. We support upstream, midstream, and downstream operations with reliable supply solutions across the UAE and international markets."},
        {"slug": "refineries", "name": "Refineries & Petrochemicals",
         "text": "Durable industrial piping materials and components suitable for refinery and petrochemical processing facilities. Our range includes flanges, fittings, valves, and piping systems designed to perform in high-pressure and high-temperature environments. AQM ensures dependable supply for maintenance, expansion, and new refinery projects."},
        {"slug": "marine", "name": "Marine & Offshore",
         "text": "Corrosion-resistant piping materials and industrial components used in marine and offshore applications. Our products are designed to withstand harsh environmental conditions and demanding offshore operations. We support shipyards, offshore platforms, and marine infrastructure projects with reliable and certified materials."},
        {"slug": "fire-safety", "name": "Fire & Safety",
         "text": "Industrial piping materials and components used in fire protection and safety systems. Our products support the installation and maintenance of fire suppression networks, hydrant systems, and safety infrastructure. AQM ensures dependable supply of materials that meet safety standards required for industrial and commercial facilities."},
        {"slug": "drainage", "name": "Drainage, Plumbing & Sewage",
         "text": "A wide range of piping materials suitable for drainage, plumbing, and sewage infrastructure projects. Our products support water distribution networks, municipal drainage systems, and industrial plumbing installations. We supply durable materials designed for long-term performance in demanding environments."},
        {"slug": "construction", "name": "Construction",
         "text": "High-quality industrial piping materials and components used in construction and infrastructure projects. Our products support structural, mechanical, and utility installations across commercial, residential, and industrial developments. AQM provides reliable supply solutions to contractors, engineers, and project developers."},
    ],
    "WHY": [
        {"t": "Fast & Reliable Delivery Across UAE", "d": "Efficient logistics to ensure timely supply to your project site."},
        {"t": "Premium Quality Assurance Materials", "d": "All materials supplied with proper certification and standards compliance."},
        {"t": "Competitive Market Pricing", "d": "Providing cost-effective solutions without compromising quality."},
        {"t": "Reliable Sourcing", "d": "We source high-quality industrial materials from trusted manufacturers."},
    ],
    "VALUES": [
        {"t": "Quality Commitment", "d": "Supplying products that meet international standards."},
        {"t": "Integrity", "d": "Conducting business with honesty, transparency, and fairness."},
        {"t": "Customer Focus", "d": "Understanding client needs and delivering solutions."},
        {"t": "Reliability", "d": "Ensuring consistent supply and on-time delivery."},
        {"t": "Professionalism", "d": "Maintaining high standards in service and operations."},
        {"t": "Continuous Improvement", "d": "Enhancing sourcing, processes, and service quality over time."},
    ],
    "OBJECTIVES": [
        "Build strong relationships with approved manufacturers and suppliers",
        "Expand product offerings to meet varied industry needs",
        "Grow our presence in the UAE, GCC, and African markets",
        "Ensure timely deliveries and consistent stock availability",
        "Offer competitive pricing aligned with quality compliance",
        "Develop lasting partnerships with contractors, EPC companies, and end users",
    ],
    "VISION": "To be a trusted supplier of oilfield and industrial equipment in the UAE and regional markets, consistently delivering quality products, reliable service, and long-term value to our clients.",
    "MISSION": "To supply high-quality oilfield and industrial products sourced from reliable global manufacturers, offering professional service, competitive pricing, and timely delivery while fostering strong, trust-based partnerships.",
    "TEAM": [
        {"slug": "fariha-yousufi", "name": "Fariha Yousufi", "role": "CEO & Founder"},
        {"slug": "shahid-ali", "name": "Shahid Ali", "role": "Finance Manager"},
        {"slug": "hussammuddin-hussain", "name": "Hussammuddin Hussain", "role": "Sales & Business Development Manager"},
        {"slug": "fahmidah-khan", "name": "Fahmidah Khan", "role": "Social Media Marketing Manager"},
    ],
    "GLOBE": globe,
    "UAEMAP": {"w": W, "h": H, "paths": uae_paths, "places": places},
}

U = "https://aqmoilfield.com/wp-content/uploads/2026/05/"
downloads = [
    {"id": "brochure", "group": "brochure", "code": "2026", "title": "AQM Oilfield Brochure 2026",
     "std": "Company profile & product range", "url": U + "AQM-Oilfield-Brochure-2026.pdf"},
    {"id": "schedule-chart", "group": "schedule", "code": "B36.19", "title": "Pipe Schedule — Thickness & Weight Chart",
     "std": "Austenitic stainless steel", "url": U + "Pipe-Schedule-Thickness-Weight-Chart-Austenitic-Steel.pdf"},
]
for c in [150, 300, 400, 600, 900, 1500, 2500]:
    downloads.append({"id": f"class-{c}", "group": "asme", "code": f"Class {c}", "title": f"Flange Dimensions — Class {c}",
                      "std": "ASME B16.5", "url": U + f"Class-{c}.pdf"})
for pn in [6, 10, 16, 25]:
    downloads.append({"id": f"pn{pn}", "group": "en", "code": f"PN{pn}", "title": f"Flange Dimensions — PN{pn}",
                      "std": "EN 1092-1", "url": U + f"PN{pn}.pdf"})
for k in [5, 10, 16, 20]:
    downloads.append({"id": f"jis-{k}k", "group": "jis", "code": f"JIS {k}K", "title": f"Flange Dimensions — JIS {k}K",
                      "std": "JIS B2220", "url": U + f"JIS-{k}K.pdf"})
for s in [5, 10, 20, 30, 40, 60, 80, 100, 120, 140, 160]:
    downloads.append({"id": f"sch-{s}", "group": "schedule", "code": f"SCH {s}", "title": f"Pipe Schedule {s} — Dimensions & Weights",
                      "std": "Pipe schedule", "url": U + f"SCH-{s}.pdf"})
data["DOWNLOADS"] = downloads

# Pipe schedule explorer — ASME B36.10M wall thickness (mm). OD in mm.
data["PIPE"] = [
    # NPS label, OD, {schedule: wall}
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

out = ["// Generated by tools/build-data.py — do not edit by hand.\n"]
for k, v in data.items():
    out.append(f"export const {k} = {json.dumps(v, ensure_ascii=False, separators=(',', ':'))};\n")
os.makedirs(os.path.join(ROOT, "src"), exist_ok=True)
open(os.path.join(ROOT, "src", "data.js"), "w").write("".join(out))
print(f"products={len(products)} categories={len(categories)} globe_dots={len(dots)} "
      f"uae_map={W}x{H} paths={ {k: len(v) for k, v in uae_paths.items()} } downloads={len(downloads)}")
for c in categories:
    print(f"  {c['n']:02d} {c['name']:<32} {c['count']}")
