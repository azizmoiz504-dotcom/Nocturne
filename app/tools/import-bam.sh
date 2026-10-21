#!/usr/bin/env bash
# Imports the Bait Al Maqdis catalogue from their old app (BaitAlMaqdis.apk) into app/bam/.
#   usage: app/tools/import-bam.sh <BaitAlMaqdis.apk>
#   needs: python3 with bs4, lxml and Pillow; node; unzip
# Run it again whenever Bait Al Maqdis sends a newer APK, then build the app as usual.
set -euo pipefail
APK=$(cd "$(dirname "$1")" && pwd)/$(basename "$1")
cd "$(dirname "$0")"
TOOLS=$PWD; OUT=$(cd .. && pwd)/bam
TMP=$(mktemp -d); trap 'rm -rf "$TMP"' EXIT
mkdir "$TMP/apk" "$TMP/ex"
unzip -q "$APK" 'assets/public/*' -d "$TMP/apk"
PUB=$TMP/apk/assets/public
python3 -I "$TOOLS/bam_extract.py" "$PUB" "$TMP/ex" > "$TMP/extract.log"
tail -1 "$TMP/extract.log"
python3 -I "$TOOLS/bam_build.py" "$TMP/ex" "$PUB" "$OUT"
node "$TOOLS/bam_ar.js" "$PUB/i18n.js" "$OUT/ar.js"
du -sh "$OUT"
