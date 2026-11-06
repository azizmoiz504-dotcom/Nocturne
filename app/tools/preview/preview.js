/* Browser preview of the sales app. Runs before the app:
   - product photos come from photo packs (photos-N.js) instead of hundreds of separate files
   - order forms and catalogue PDFs open on the page (a preview page cannot open new tabs or download)
   - WhatsApp and phone links show a note instead
   - the branch, cart and orders survive a reload even where the browser blocks storage */
(function () {
  'use strict';

  /* ---------- storage that survives a reload (kept in window.name when real storage is blocked) ---------- */
  function memStore(slot) {
    var all = function () { try { var o = JSON.parse(window.name || '{}'); return o && typeof o === 'object' ? o : {}; } catch (e) { return {}; } };
    var data = all()[slot] || {};
    var save = function () { var o = all(); o[slot] = data; try { window.name = JSON.stringify(o); } catch (e) {} };
    return {
      getItem: function (k) { return Object.prototype.hasOwnProperty.call(data, k) ? data[k] : null; },
      setItem: function (k, v) { data[k] = String(v); save(); },
      removeItem: function (k) { delete data[k]; save(); },
      clear: function () { data = {}; save(); },
      key: function (i) { return Object.keys(data)[i] || null; },
      get length() { return Object.keys(data).length; }
    };
  }
  ['localStorage', 'sessionStorage'].forEach(function (n) {
    try { var s = window[n]; s.setItem('__t', '1'); s.removeItem('__t'); }
    catch (e) { try { Object.defineProperty(window, n, { configurable: true, value: memStore(n) }); } catch (e2) {} }
  });

  /* ---------- photos from the packs ---------- */
  var IMG = window.__IMG = window.__IMG || {}, WHERE = window.__WHERE || {}, PACKS = window.__PACKS || [];
  var waiting = {}, asked = {}, srcProp = Object.getOwnPropertyDescriptor(HTMLImageElement.prototype, 'src');
  var key = function (v) { if (typeof v !== 'string') return null; v = v.replace(/^\.\//, ''); return Object.prototype.hasOwnProperty.call(WHERE, v) ? v : null; };
  function pack(i) {
    if (asked[i]) return; asked[i] = 1;
    var s = document.createElement('script'); s.src = PACKS[i]; s.async = true;
    s.onerror = function () { asked[i] = 0; setTimeout(function () { pack(i); }, 2000); };
    document.head.appendChild(s);
  }
  function want(img, k) {
    if (IMG[k]) { srcProp.set.call(img, IMG[k]); return; }
    (waiting[k] = waiting[k] || []).push(img); pack(WHERE[k]);
  }
  window.__packLoaded = function () {
    Object.keys(waiting).forEach(function (k) { if (IMG[k]) { waiting[k].forEach(function (img) { srcProp.set.call(img, IMG[k]); }); delete waiting[k]; } });
  };
  // img.src = 'p/…'
  Object.defineProperty(HTMLImageElement.prototype, 'src', {
    configurable: true, enumerable: true, get: srcProp.get,
    set: function (v) { var k = key(v); if (!k) return srcProp.set.call(this, v); this.removeAttribute('src'); want(this, k); }
  });
  // '<img src="p/…">' in HTML the app builds: no request for a file that is not there, the observer below fills it
  var RE = /(<img\b[^>]*?\s)src=(["'])((?:(?:bam|me)\/)?p\/[^"']+)\2/g, html = Object.getOwnPropertyDescriptor(Element.prototype, 'innerHTML');
  Object.defineProperty(Element.prototype, 'innerHTML', {
    configurable: true, enumerable: true, get: html.get,
    set: function (v) { html.set.call(this, typeof v === 'string' && v.indexOf('p/') > -1 ? v.replace(RE, '$1data-want=$2$3$2') : v); }
  });
  function fix(img) {
    var k = key(img.getAttribute('data-want'));
    if (k) { img.removeAttribute('data-want'); return want(img, k); }
    k = key(img.getAttribute('src'));
    if (k) { img.removeAttribute('src'); want(img, k); }
  }
  function scan(n) {
    if (n.nodeType !== 1) return;
    if (n.tagName === 'IMG') return fix(n);
    var l = n.getElementsByTagName('img'); for (var i = 0; i < l.length; i++) fix(l[i]);
  }
  new MutationObserver(function (ms) {
    ms.forEach(function (m) { if (m.type === 'attributes') fix(m.target); else for (var i = 0; i < m.addedNodes.length; i++) scan(m.addedNodes[i]); });
  }).observe(document.documentElement, { childList: true, subtree: true, attributes: true, attributeFilter: ['src', 'data-want'] });
  // the rest of the photos arrive in the background, so later screens open with their photos ready
  window.addEventListener('load', function () {
    var i = 0, next = function () { while (i < PACKS.length && asked[i]) i++; if (i < PACKS.length) { pack(i); setTimeout(next, 1500); } };
    setTimeout(next, 2500);
  });

  /* ---------- notes for what the phone hands to other apps ---------- */
  function note(text) {
    var n = document.getElementById('pv-note');
    if (!n) { n = document.createElement('div'); n.id = 'pv-note'; n.setAttribute('role', 'status'); document.body.appendChild(n); }
    n.textContent = text; n.className = 'is-on';
    clearTimeout(note.t); note.t = setTimeout(function () { n.className = ''; }, 4200);
  }
  window.open = function (u) {
    u = String(u || '');
    note(/wa\.me|whatsapp/i.test(u) ? 'On the phone this opens WhatsApp with the message ready.' : 'On the phone this opens ' + u.replace(/^https?:\/\//, '').split(/[/?]/)[0] + '.');
    return {};
  };
  document.addEventListener('click', function (e) {
    var a = e.target.closest && e.target.closest('a[href^="tel:"],a[href^="mailto:"],a[href*="wa.me"]');
    if (a) { e.preventDefault(); note(/^tel:/.test(a.getAttribute('href')) ? 'On the phone this calls ' + a.getAttribute('href').slice(4) + '.' : 'On the phone this opens WhatsApp or email.'); }
  }, true);

  /* ---------- PDFs on the page ---------- */
  var PDFJS = window.__PDFJS_BASE || 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/', lib = null;
  function script(src) { return new Promise(function (ok, bad) { var s = document.createElement('script'); s.src = src; s.onload = ok; s.onerror = bad; document.head.appendChild(s); }); }
  function pdfjs() {
    // the worker is loaded as a plain script too, so pdf.js runs it on the page (a preview page cannot start workers from another site)
    return lib = lib || script(PDFJS + 'pdf.min.js').then(function () { return script(PDFJS + 'pdf.worker.min.js'); }).then(function () { return window.pdfjsLib; });
  }
  window.FT_PDF_VIEW = function (u8, name) {
    var box = document.createElement('div'); box.id = 'pv-pdf';
    box.innerHTML = '<div class="pv-pdf__bar"><b></b><button type="button" aria-label="Close">Close</button></div>' +
      '<p class="pv-pdf__note">Preview. On the phone this opens in the PDF app, or goes to WhatsApp to send.</p><div class="pv-pdf__pages"><p class="pv-pdf__wait">Opening…</p></div>';
    box.querySelector('b').textContent = String(name || 'PDF').replace(/\.pdf$/i, '').replace(/-/g, ' ');
    var close = function () { box.remove(); };
    box.querySelector('button').onclick = close;
    document.body.appendChild(box);
    var pages = box.querySelector('.pv-pdf__pages');
    pdfjs().then(function (P) { return P.getDocument({ data: u8 }).promise; }).then(function (doc) {
      pages.innerHTML = '';
      var w = pages.clientWidth - 16, dpr = Math.min(window.devicePixelRatio || 1, 2), slots = [];
      return doc.getPage(1).then(function (p1) {
        var r = p1.getViewport({ scale: 1 }), h = Math.round(w * r.height / r.width);
        for (var i = 1; i <= doc.numPages; i++) {
          var c = document.createElement('canvas'); c.width = Math.round(w * dpr); c.height = Math.round(h * dpr);
          c.dataset.n = i; pages.appendChild(c); slots.push(c);
        }
        var draw = function (c) {
          if (c.__done) return; c.__done = 1;
          doc.getPage(+c.dataset.n).then(function (pg) {
            var v = pg.getViewport({ scale: 1 }), s = c.width / v.width; c.height = Math.round(v.height * s);
            var ctx = c.getContext('2d'); ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, c.width, c.height);
            return pg.render({ canvasContext: ctx, viewport: pg.getViewport({ scale: s }) }).promise;
          });
        };
        var io = new IntersectionObserver(function (es) { es.forEach(function (e) { if (e.isIntersecting) { io.unobserve(e.target); draw(e.target); } }); }, { root: pages, rootMargin: '600px 0px' });
        slots.forEach(function (c) { io.observe(c); });
      });
    }).catch(function () { pages.innerHTML = '<p class="pv-pdf__wait">Could not open this PDF here. It opens normally on the phone.</p>'; });
  };
})();
