#!/usr/bin/env bash
# Builds the iPhone web app (Add to Home Screen) from the same screens as the Android app.
# It is Fakhri Tools only: the web app is public, and the Bait Al Maqdis prices stay inside the Android app.
#   usage: app/build-web.sh   -> app/build/webapp/   (publish it as  <site>/app/  next to the main website)
# The list (js/data.js, js/choices.js, js/config.js) and the photos (assets/products/) are read live
# from the website one folder up, so editor saves show without a new build. Opened screens, products
# and photos are kept on the phone by sw.js and keep working offline.
set -euo pipefail
cd "$(dirname "$0")"
SITE=$(cd .. && pwd); W=$PWD/build/webapp
VERSION_NAME=$(sed -n 's/.*versionName=\([^ ]*\).*/\1/p' version.txt)
STAMP=$VERSION_NAME-$(git rev-parse --short HEAD 2>/dev/null || date +%s)-$(cat web/*.js web/*.css web/index.html | md5sum | cut -c1-8)

rm -rf "$W"; mkdir -p "$W/fonts" "$W/brands" "$W/img"
cp web/app.css web/app.js web/orderform.js web/jspdf.umd.min.js "$W/"
for f in barlow-400-latin barlow-500-latin barlow-600-latin barlow-700-latin barlow-condensed-600-latin barlow-condensed-700-latin barlow-condensed-800-latin barlow-semi-condensed-500-latin barlow-semi-condensed-600-latin; do cp "$SITE/fonts/$f.woff2" "$W/fonts/"; done
cp "$SITE"/assets/brands/*.png "$W/brands/"
cp "$SITE/assets/logo-lockup.png" "$SITE/assets/logo-stacked.png" "$SITE/assets/emblem.png" "$SITE/assets/icon-192.png" "$SITE/assets/icon-512.png" "$SITE/assets/apple-touch-icon.png" "$W/img/"

# index.html: Home Screen tags, live list from the website, offline helper
HEAD='<meta name="apple-mobile-web-app-capable" content="yes">\n<meta name="mobile-web-app-capable" content="yes">\n<meta name="apple-mobile-web-app-status-bar-style" content="default">\n<meta name="apple-mobile-web-app-title" content="Fakhri Tools">\n<meta name="robots" content="noindex">\n<link rel="manifest" href="manifest.webmanifest">\n<link rel="apple-touch-icon" href="img/apple-touch-icon.png">\n<link rel="icon" href="img/icon-192.png">\n<script>document.documentElement.className += " is-web"; window.FT_WEB = { img: "../assets/products/", brand: "fakhri" };</script>'
sed -e 's#<meta name="theme-color" content="[^"]*">#<meta name="theme-color" content="\#ffffff">#' \
    -e "s#<link rel=\"stylesheet\" href=\"app.css\">#&\n$HEAD#" \
    -e 's#<script src="config.js"></script>#<script src="../js/config.js"></script>#' \
    -e 's#<script src="data.js"></script>#<script src="../js/data.js"></script>#' \
    -e 's#<script src="choices.js"></script>#<script src="../js/choices.js"></script>#' \
    -e "s#<script src=\"app.js\"></script>#&\n<script>if ('serviceWorker' in navigator) addEventListener('load', () => navigator.serviceWorker.register('sw.js').catch(() => {}));</script>#" \
    -e '/<script src="bam\//d' \
    web/index.html > "$W/index.html"
for k in manifest.webmanifest 'is-web' '../js/data.js' '../js/choices.js' '../js/config.js' 'sw.js' 'brand: "fakhri"'; do grep -q -- "$k" "$W/index.html" || { echo "index.html is missing $k" >&2; exit 1; }; done
if grep -q 'bam/' "$W/index.html"; then echo "index.html still loads Bait Al Maqdis files" >&2; exit 1; fi

cat > "$W/manifest.webmanifest" <<'EOF'
{
  "name": "Fakhri Tools Catalogue",
  "short_name": "Fakhri Tools",
  "start_url": "./",
  "scope": "./",
  "display": "standalone",
  "background_color": "#f3f4f6",
  "theme_color": "#ffffff",
  "icons": [
    { "src": "img/icon-192.png", "sizes": "192x192", "type": "image/png" },
    { "src": "img/icon-512.png", "sizes": "512x512", "type": "image/png" }
  ]
}
EOF

SHELL_FILES=$(cd "$W" && find . -type f ! -name sw.js | sed 's#^\./##' | sort | sed 's#.*#"&"#' | paste -sd, -)
cat > "$W/sw.js" <<EOF
// Keeps the catalogue working on the phone without internet.
// The app's own files: from the phone first, refreshed in the background.
// The product list (../js/): newest from the website, the saved copy when offline.
// Photos: saved the first time they are seen.
const V = '$STAMP', SHELL = 'ft-app-' + V, LIVE = 'ft-live', PHOTOS = 'ft-photos';
const FILES = ['./', $SHELL_FILES, '../js/config.js', '../js/data.js', '../js/choices.js'];
self.addEventListener('install', e => e.waitUntil(caches.open(SHELL).then(c => c.addAll(FILES.filter(f => !f.startsWith('../')))).then(() => caches.open(LIVE)).then(c => c.addAll(FILES.filter(f => f.startsWith('../'))).catch(() => {})).then(() => self.skipWaiting())));
self.addEventListener('activate', e => e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k.startsWith('ft-app-') && k !== SHELL).map(k => caches.delete(k)))).then(() => self.clients.claim())));
self.addEventListener('fetch', e => {
  const r = e.request, u = new URL(r.url);
  if (r.method !== 'GET' || u.origin !== location.origin) return;
  const p = u.pathname;
  if (/\/js\/(data|choices|config)\.js\$/.test(p)) {
    const key = new URL(p, location.origin).href;
    e.respondWith(fetch(r, { cache: 'no-cache' }).then(res => { if (res.ok) { const cl = res.clone(); caches.open(LIVE).then(c => c.put(key, cl)); } return res; }).catch(() => caches.match(key, { cacheName: LIVE }).then(m => m || Response.error())));
  } else if (p.includes('/assets/products/')) {
    e.respondWith(caches.open(PHOTOS).then(c => c.match(r).then(m => m || fetch(r).then(res => { if (res.ok) c.put(r, res.clone()); return res; }))));
  } else if (p.startsWith(new URL('./', location.href).pathname)) {
    e.respondWith(caches.open(SHELL).then(c => c.match(r, { ignoreSearch: true }).then(m => {
      const net = fetch(r).then(res => { if (res.ok && !p.endsWith('/sw.js')) c.put(r, res.clone()); return res; });
      if (m) { e.waitUntil(net.catch(() => {})); return m; }
      return net;
    })));
  }
});
EOF
node --check "$W/sw.js"
du -sh "$W"; echo "web app stamp $STAMP"
