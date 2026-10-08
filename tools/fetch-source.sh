#!/usr/bin/env bash
# Downloads everything the prototype is built from (content, imagery, map data) into a cache dir.
# Nothing here is committed; the processed results live in assets/img and src/data.js.
#
#   bash tools/fetch-source.sh [.cache/source]
set -euo pipefail
OUT="${1:-.cache/source}"
UA="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36"
U="https://aqmoilfield.com/wp-content/uploads"
mkdir -p "$OUT/site" "$OUT/raw/products" "$OUT/geo"
get() { curl -sSL --fail -A "$UA" -o "$2" "$1"; }

echo "→ catalogue (WooCommerce Store API)"
get "https://aqmoilfield.com/wp-json/wc/store/v1/products?per_page=100" "$OUT/site/products.json"

echo "→ brand, category, industry, team and partner imagery"
for f in \
  2026/04/AQM-Oilfield-Equipments-Trading-F.Z.C.png \
  2026/04/OIL-GAS.png 2026/04/PETRO-CHEMICALS.png 2026/04/OFFCHORE.png 2026/04/FIRE-SAFETY.png \
  2026/04/Seawage-Solutions.png 2026/04/CONSTRUCTION.png 2026/04/industrial-plant-during-sunset.jpg \
  2026/04/Gemini_Generated_Image_ujhwnlujhwnlujhw.png 2026/04/Gemini_Generated_Image_z1xgfrz1xgfrz1xg.png \
  2026/05/pexels-ganesh-ramsumair-489944037-30445637.jpg 2026/05/Oil-Gas.jpeg \
  2026/05/Buttwelded-Fittings.png 2026/05/Flanges.png 2026/05/Pipes-Tubes.png 2026/05/Structure-sTEEL.png \
  2026/05/gauges-instrumentation.png 2026/05/Threaded-Fittings.png 2026/05/slide2.png 2026/05/unnamed.jpg \
  2026/05/03252023222055641f73c79b156.jpg 2026/05/hydraulic-hoses-1.png 2026/05/sheet_gaskets_subgroup.webp \
  2026/04/Valves.png \
  2026/04/WhatsApp-Image-2026-04-27-at-3.07.24-PM-2.jpeg 2026/04/WhatsApp-Image-2026-04-27-at-3.07.24-PM-1-1.jpeg \
  2026/04/WhatsApp-Image-2026-04-27-at-3.22.06-PM-1.jpeg 2026/04/WhatsApp-Image-2026-04-27-at-3.07.25-PM-1.jpeg \
  2026/04/Benkan.png 2026/04/Wmass-germ.jpg 2026/04/3.-BOTHWELL-1.png 2026/04/Viraj.png 2026/04/YC-Inox.png \
  2026/04/6.-SPI-1.png 2026/04/Wolf.png 2026/04/8.-JAZEERA.png 2026/04/Wika.png 2026/04/100-Tong.png \
  2026/04/11.-VALVE-TEK-1.jpg 2026/04/12.-PARKER.png 2026/04/13.-BONNEY-FORGED.jpg 2026/04/Pegler.png \
  2026/04/15.-FEROLITE.png 2026/04/16.-ITALFLEX-1.png; do
  get "$U/$f" "$OUT/raw/$(basename "$f")"
done

echo "→ product photography"
python3 -I -c "import json,sys; [print(p['images'][0]['src']) for p in json.load(open(sys.argv[1])) if p['images'] and p['categories']]" \
  "$OUT/site/products.json" | while read -r src; do get "$src" "$OUT/raw/products/$(basename "$src")"; done

echo "→ Natural Earth map data (world-atlas, public domain)"
get "https://cdn.jsdelivr.net/npm/world-atlas@2.0.2/land-110m.json" "$OUT/geo/land-110m.json"
get "https://cdn.jsdelivr.net/npm/world-atlas@2.0.2/countries-10m.json" "$OUT/geo/countries-10m.json"
echo "done → $OUT"
