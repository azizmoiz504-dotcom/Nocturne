#!/usr/bin/env bash
# Builds the sales catalogue APK (Fakhri Tools, Bait Al Maqdis, Mabrook, Modern Electric) from the website's product list
# (Fakhri Tools and Mabrook), the Bait Al Maqdis catalogue in app/bam/ (app/tools/import-bam.sh)
# and the Modern Electric catalogue in app/me/ (app/tools/me_import.py). Both folders are private: see README.
#   needs (Ubuntu): apt-get install android-sdk-build-tools android-sdk-platform-23 dalvik-exchange apksigner zipalign imagemagick
#   usage: app/build.sh <keystore> <store-password>     -> app/build/fakhri-catalogue.apk
#          app/build.sh --www                           -> only the app's pages in app/build/apk/assets/www (open them in a browser)
#   DEBUG=1 app/build.sh ...  makes a test build the automated phone test can drive
set -euo pipefail
cd "$(dirname "$0")"
APP=$PWD; SITE=$(cd .. && pwd); OUT=$APP/build
# SHOP=mabrook app/build.sh ...  makes the Mabrook-only app instead: its own name, icon and package, so it installs
# next to the main app; only the Mabrook shop (the Fakhri Tools list), no Bait Al Maqdis or Modern Electric data.
SHOP=${SHOP:-}
case "$SHOP" in
  '') STAGE=$OUT; APK=$OUT/fakhri-catalogue.apk ;;
  mabrook) STAGE=$OUT/mabrook; APK=$OUT/mabrook-catalogue.apk; PKG=com.mabrookhardware.catalogue ;;
  *) echo "SHOP can only be mabrook" >&2; exit 1 ;;
esac
SDK=/usr/lib/android-sdk; JAR=$SDK/platforms/android-23/android.jar
WWW_ONLY=; [ "${1:-}" = --www ] && WWW_ONLY=1
[ -n "$WWW_ONLY" ] || { KS=${1:?keystore}; PASS=${2:?password}; }
[ -n "$SHOP" ] || [ -f bam/data.js ] || { echo "app/bam/ is missing: run app/tools/import-bam.sh <BaitAlMaqdis.apk> first" >&2; exit 1; }
[ -n "$SHOP" ] || [ -f me/data.js ] || { echo "app/me/ is missing: copy it from the project files (fakhri/app/me-catalogue)" >&2; exit 1; }
VERSION_CODE=$(sed -n 's/.*versionCode=\([0-9]*\).*/\1/p' version.txt); VERSION_NAME=$(sed -n 's/.*versionName=\([^ ]*\).*/\1/p' version.txt)

rm -rf "$STAGE/apk" "$STAGE/classes" "$STAGE/gen" "$STAGE/res.zip"; mkdir -p "$STAGE/apk/assets/www" "$STAGE/classes" "$STAGE/gen" "$OUT/photos"
W=$STAGE/apk/assets/www

# 1. the app's pages, the product list and the shop details
cp web/index.html web/app.css web/app.js web/orderform.js web/jspdf.umd.min.js "$W/"
cp "$SITE/js/data.js" "$W/data.js"
cp "$SITE/js/config.js" "$W/config.js"
cp "$SITE/js/choices.js" "$W/choices.js"
mkdir -p "$W/fonts" "$W/brands" "$W/img"
for f in barlow-400-latin barlow-500-latin barlow-600-latin barlow-700-latin barlow-condensed-600-latin barlow-condensed-700-latin barlow-condensed-800-latin barlow-semi-condensed-500-latin barlow-semi-condensed-600-latin; do cp "$SITE/fonts/$f.woff2" "$W/fonts/"; done
cp "$SITE"/assets/brands/*.png "$W/brands/"
cp "$SITE/assets/logo-lockup.png" "$SITE/assets/logo-stacked.png" "$SITE/assets/emblem.png" "$SITE/assets/icon-512.png" "$W/img/"
cp web/img/*.png "$W/img/"   # logo-lockup-dark.png: the logo with a light grey line for the dark look
cp -r web/shops "$W/shops"   # the Mabrook and Modern Electric logos and the plug sign
if [ -z "$SHOP" ]; then
  cp -r bam "$W/bam"; rm -rf "$W/bam/tiles"   # their category pictures on black: the app shows them on white (bam/covers, tools/bam_covers.py)
  cp -r me "$W/me"
else
  # one shop: fixed in the page, and the other shops' lists left out
  sed -i -e '/<script src="bam\//d' -e '/<script src="me\//d' -e "0,/<script>/s//<script>window.FT_SHOP = \"$SHOP\";<\/script>\n<script>/" "$W/index.html"
  grep -q 'FT_SHOP = "'"$SHOP"'"' "$W/index.html" && ! grep -q -e 'bam/' -e '"me/' "$W/index.html" || { echo "could not make the $SHOP page" >&2; exit 1; }
  rm -f "$W"/shops/me-*
  if [ -d bam/fonts ]; then mkdir -p "$W/bam"; cp -r bam/fonts "$W/bam/fonts"; fi   # the Poppins font the other shops' pages use (app.css), no list
fi

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
MANIFEST=android/AndroidManifest.xml
if [ -n "$SHOP" ]; then
  # the one-shop app: its own package and photo provider, one launcher entry (its name and icon), and the shop named
  # for CatalogueActivity.fixedShop(); the code stays in com.fakhritools.catalogue, so every class name is written out
  MANIFEST=$STAGE/AndroidManifest.xml
  python3 - "$SHOP" "$PKG" "$MANIFEST" <<'PY'
import re, sys
shop, pkg, out = sys.argv[1:]
alias = {'mabrook': '.BrandMabrook'}[shop]
m = open('android/AndroidManifest.xml', encoding='utf-8').read()
m = m.replace('package="com.fakhritools.catalogue"', 'package="%s"' % pkg)
m = re.sub(r'android:(name|targetActivity)="\.', r'android:\1="com.fakhritools.catalogue.', m)
m = m.replace('android:authorities="com.fakhritools.catalogue.photos"', 'android:authorities="%s.photos"' % pkg)
blocks = re.findall(r'\n        <activity-alias.*?</activity-alias>', m, re.S)
assert len(blocks) == 4
for b in blocks:
    if 'com.fakhritools.catalogue' + alias + '"' in b: m = m.replace(b, b.replace('android:enabled="false"', 'android:enabled="true"'))
    else: m = m.replace(b, '')
m = m.replace('android:label="@string/app_name"\n        android:icon="@mipmap/ic_launcher"', 'android:label="@string/name_%s"\n        android:icon="@mipmap/ic_%s"' % (shop, shop))
m = m.replace('        <provider', '        <meta-data android:name="shop" android:value="%s" />\n\n        <provider' % shop)
assert m.count('<activity-alias') == 1 and 'android:value="%s"' % shop in m and '@mipmap/ic_%s"\n        android:allowBackup' % shop in m and 'com.fakhritools.catalogue.photos' not in m
open(out, 'w', encoding='utf-8').write(m)
PY
fi
aapt2 compile --dir android/res -o "$STAGE/res.zip"
aapt2 link -I "$JAR" --manifest "$MANIFEST" --custom-package com.fakhritools.catalogue -o "$STAGE/base.apk" "$STAGE/res.zip" \
  -A "$STAGE/apk/assets" --java "$STAGE/gen" --min-sdk-version 21 --target-sdk-version 34 \
  --version-code "$VERSION_CODE" --version-name "$VERSION_NAME" -0 jpg -0 png -0 woff2 -0 pdf ${DEBUG:+--debug-mode}
javac -nowarn -source 8 -target 8 -bootclasspath "$JAR" -d "$STAGE/classes" $(find android/src "$STAGE/gen" -name '*.java') 2>&1 | grep -v -e 'bootstrap classpath' -e '^warning' -e '^1 warning' -e 'JAVA_TOOL_OPTIONS' || true
dalvik-exchange --dex --min-sdk-version=21 --output="$STAGE/classes.dex" "$STAGE/classes"
(cd "$STAGE" && cp base.apk unsigned.apk && zip -q -j unsigned.apk classes.dex)
zipalign -f -p 4 "$STAGE/unsigned.apk" "$STAGE/aligned.apk"
apksigner sign --ks "$KS" --ks-pass "pass:$PASS" --ks-key-alias fakhri --out "$APK" "$STAGE/aligned.apk"
apksigner verify --print-certs "$APK" | head -2
ls -la "$APK"
