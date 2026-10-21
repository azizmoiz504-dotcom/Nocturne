// Keeps the catalogue working on the phone without internet.
// The app's own files: from the phone first, refreshed in the background.
// The product list (../js/): newest from the website, the saved copy when offline.
// Photos: saved the first time they are seen.
const V = '2.0-baea02a-4c18cf38', SHELL = 'ft-app-' + V, LIVE = 'ft-live', PHOTOS = 'ft-photos';
const FILES = ['./', "app.css","app.js","brands/100-tong.png","brands/benkan.png","brands/both-well.png","brands/froch.png","brands/lintas.png","brands/maass.png","brands/mega.png","brands/pegler.png","brands/sa-brand.png","brands/ta-chen.png","brands/valve-tek.png","brands/viraj.png","brands/yc-inox.png","fonts/barlow-400-latin.woff2","fonts/barlow-500-latin.woff2","fonts/barlow-600-latin.woff2","fonts/barlow-700-latin.woff2","fonts/barlow-condensed-600-latin.woff2","fonts/barlow-condensed-700-latin.woff2","fonts/barlow-condensed-800-latin.woff2","fonts/barlow-semi-condensed-500-latin.woff2","fonts/barlow-semi-condensed-600-latin.woff2","img/apple-touch-icon.png","img/emblem.png","img/icon-192.png","img/icon-512.png","img/logo-lockup.png","img/logo-stacked.png","index.html","jspdf.umd.min.js","manifest.webmanifest","orderform.js", '../js/config.js', '../js/data.js', '../js/choices.js'];
self.addEventListener('install', e => e.waitUntil(caches.open(SHELL).then(c => c.addAll(FILES.filter(f => !f.startsWith('../')))).then(() => caches.open(LIVE)).then(c => c.addAll(FILES.filter(f => f.startsWith('../'))).catch(() => {})).then(() => self.skipWaiting())));
self.addEventListener('activate', e => e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k.startsWith('ft-app-') && k !== SHELL).map(k => caches.delete(k)))).then(() => self.clients.claim())));
self.addEventListener('fetch', e => {
  const r = e.request, u = new URL(r.url);
  if (r.method !== 'GET' || u.origin !== location.origin) return;
  const p = u.pathname;
  if (/\/js\/(data|choices|config)\.js$/.test(p)) {
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
