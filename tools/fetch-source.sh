#!/usr/bin/env bash
# Downloads the raw material the site is built from into a cache dir (not committed):
#   - Mabrook Hardware (Fakhri Group) product photos and category banners
#   - Natural Earth coastline data for the store map
# The catalogue text itself lives in tools/catalogue/*.json.
#
#   bash tools/fetch-source.sh [.cache/source]
set -euo pipefail
OUT="${1:-.cache/source}"
UA="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36"
U="https://mabrook-uae.com/wp-content/uploads"
mkdir -p "$OUT/mabrook" "$OUT/geo"
get() { [ -s "$2" ] || curl -sSL --fail --retry 4 --retry-delay 2 -A "$UA" -e https://mabrook-uae.com/ -o "$2" "$1"; }

echo "→ Mabrook photos referenced by tools/catalogue"
python3 -I - "$OUT" <<'EOF' | while read -r url; do get "$url" "$OUT/mabrook/$(basename "$url")"; done
import json, sys
for p in json.load(open('tools/catalogue/additions.json')):
    for _, f in p['range']:
        print('https://mabrook-uae.com/wp-content/uploads/2023/12/' + f)
for c in json.load(open('tools/catalogue/categories.json')):
    t = c['tile']
    for f in ([t['banner']] if 'banner' in t else []) + t.get('compose_items', []):
        print('https://mabrook-uae.com/wp-content/uploads/2023/12/' + f)
EOF

echo "→ Natural Earth map data (world-atlas, public domain)"
get "https://cdn.jsdelivr.net/npm/world-atlas@2.0.2/countries-10m.json" "$OUT/geo/countries-10m.json"
echo "done → $OUT"
