#!/usr/bin/env bash
# Builds the sales catalogue APK (Fakhri Tools + Bait Al Maqdis) from the website's product list
# and the Bait Al Maqdis catalogue in app/bam/ (made by app/tools/import-bam.sh).
#   needs (Ubuntu): apt-get install android-sdk-build-tools android-sdk-platform-23 dalvik-exchange apksigner zipalign imagemagick
#   usage: app/build.sh <keystore> <store-password>     -> app/build/fakhri-catalogue.apk
#          app/build.sh --www                           -> only the app's pages in app/build/apk/assets/www (open them in a browser)
#   DEBUG=1 app/build.sh ...  makes a test build the automated phone test can drive
set -euo pipefail
cd "$(dirname "$0")"
APP=$PWD; SITE=$(cd .. && pwd); OUT=$APP/build
SDK=/usr/lib/android-sdk; JAR=$SDK/platforms/android-23/android.jar
WWW_ONLY=; [ "${1:-}" = --www ] && WWW_ONLY=1
[ -n "$WWW_ONLY" ] || { KS=${1:?keystore}; PASS=${2:?password}; }
[ -f bam/data.js ] || { echo "app/bam/ is missing: run app/tools/import-bam.sh <BaitAlMaqdis.apk> first" >&2; exit 1; }
VERSION_CODE=$(sed -n 's/.*versionCode=\([0-9]*\).*/\1/p' version.txt); VERSION_NAME=$(sed -n 's/.*versionName=\([^ ]*\).*/\1/p' version.txt)

rm -rf "$OUT/apk" "$OUT/classes" "$OUT/gen" "$OUT/res.zip"; mkdir -p "$OUT/apk/assets/www" "$OUT/classes" "$OUT/gen" "$OUT/photos"
W=$OUT/apk/assets/www

# 1. the app's pages, the product list and the shop details
cp web/index.html web/app.css web/app.js web/orderform.js web/jspdf.umd.min.js "$W/"
cp "$SITE/js/data.js" "$W/data.js"
cp "$SITE/js/config.js" "$W/config.js"
cp "$SITE/js/choices.js" "$W/choices.js"
mkdir -p "$W/fonts" "$W/brands" "$W/img"
for f in barlow-400-latin barlow-500-latin barlow-600-latin barlow-700-latin barlow-condensed-600-latin barlow-condensed-700-latin barlow-condensed-800-latin barlow-semi-condensed-500-latin barlow-semi-condensed-600-latin; do cp "$SITE/fonts/$f.woff2" "$W/fonts/"; done
cp "$SITE"/assets/brands/*.png "$W/brands/"
cp "$SITE/assets/logo-lockup.png" "$SITE/assets/logo-stacked.png" "$SITE/assets/emblem.png" "$SITE/assets/icon-512.png" "$W/img/"
cp -r bam "$W/bam"; rm -rf "$W/bam/tiles"   # the old black banner tiles: the app shows a product photo per category (bam/covers, tools/bam_covers.py)

# 2. every photo the list uses, made lighter for phones (cached between builds)
node -e '
  global.window = {}; require(process.argv[1]);
  const s = new Set(); window.FT_CATS.forEach(c => { if (c.cover) s.add(c.cover); c.items.forEach(i => i[3] && s.add(i[3])); });
  console.log([...s].join("\n"));' "$SITE/js/data.js" > "$W/photos.txt"
while read -r p; do
  src="$SITE/assets/products/$p"; dst="$OUT/photos/$p"
  [ -f "$src" ] || { echo "missing photo: $p" >&2; continue; }
  if [ ! -f "$dst" ] || [ "$src" -nt "$dst" ]; then
    mkdir -p "$(dirname "$dst")"
    case "$p" in *.png) convert "$src" -resize '640x640>' -strip "$dst" ;; *) convert "$src" -resize '640x640>' -strip -quality 80 -sampling-factor 4:2:0 -interlace JPEG "$dst" ;; esac
  fi
  mkdir -p "$W/p/$(dirname "$p")"; cp "$dst" "$W/p/$p"
done < "$W/photos.txt"
[ -z "$WWW_ONLY" ] || { echo "$W"; exit 0; }

# 3. resources, code, package, sign
aapt2 compile --dir android/res -o "$OUT/res.zip"
aapt2 link -I "$JAR" --manifest android/AndroidManifest.xml -o "$OUT/base.apk" "$OUT/res.zip" \
  -A "$OUT/apk/assets" --java "$OUT/gen" --min-sdk-version 21 --target-sdk-version 34 \
  --version-code "$VERSION_CODE" --version-name "$VERSION_NAME" -0 jpg -0 png -0 woff2 -0 pdf ${DEBUG:+--debug-mode}
javac -nowarn -source 8 -target 8 -bootclasspath "$JAR" -d "$OUT/classes" $(find android/src "$OUT/gen" -name '*.java') 2>&1 | grep -v -e 'bootstrap classpath' -e '^warning' -e '^1 warning' -e 'JAVA_TOOL_OPTIONS' || true
dalvik-exchange --dex --min-sdk-version=21 --output="$OUT/classes.dex" "$OUT/classes"
(cd "$OUT" && cp base.apk unsigned.apk && zip -q -j unsigned.apk classes.dex)
zipalign -f -p 4 "$OUT/unsigned.apk" "$OUT/aligned.apk"
apksigner sign --ks "$KS" --ks-pass "pass:$PASS" --ks-key-alias fakhri --out "$OUT/fakhri-catalogue.apk" "$OUT/aligned.apk"
apksigner verify --print-certs "$OUT/fakhri-catalogue.apk" | head -2
ls -la "$OUT/fakhri-catalogue.apk"
