/* Bait Al Maqdis website: Showroom No. 06 in 3D, at night.
   The sign is lit and the roller shutter is down. Scrolling rolls the shutter up slat by slat into its box,
   the lights inside come on row by row (racking, stock and a display wall of their products) and you walk
   up to the door. Drawn in the browser; without 3D the page keeps the drawn shutter instead. */
(function () {
  'use strict';
  var canvas = document.getElementById('whgl');
  var api = { ready: false, progress: function () {}, show: function () {} };
  window.BAMWH = api;
  if (!window.THREE || !canvas) return;
  var T = window.THREE;
  var can = false;
  try { var tc = document.createElement('canvas'); can = !!(window.WebGLRenderingContext && (tc.getContext('webgl') || tc.getContext('experimental-webgl'))); } catch (e) {}
  if (!can) return;
  var renderer;
  try { renderer = new T.WebGLRenderer({ canvas: canvas, antialias: (window.devicePixelRatio || 1) < 1.5, alpha: false, powerPreference: 'high-performance' }); } catch (e) { return; }
  if (!renderer.getContext()) return;
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, innerWidth < 900 ? 1.5 : 1.75));
  renderer.outputEncoding = T.sRGBEncoding;
  renderer.toneMapping = T.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;
  renderer.localClippingEnabled = true;
  renderer.setClearColor(0x0b0c0e, 1);

  var srgb = function (h) { return new T.Color(h).convertSRGBToLinear(); };
  var clamp01 = function (x) { return Math.max(0, Math.min(1, x)); };
  var lerp = function (a, b, k) { return a + (b - a) * k; };
  var ease = function (x) { x = clamp01(x); return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2; };
  var smooth = function (x) { x = clamp01(x); return x * x * (3 - 2 * x); };
  var seed = 7, rnd = function () { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; };
  var mk = function (w, h, draw) { var c = document.createElement('canvas'); c.width = w; c.height = h; draw(c.getContext('2d'), w, h); return c; };
  var tex = function (c, rep) {
    var t = new T.CanvasTexture(c); t.encoding = T.sRGBEncoding; t.anisotropy = Math.min(8, renderer.capabilities.getMaxAnisotropy());
    if (rep) { t.wrapS = t.wrapT = T.RepeatWrapping; t.repeat.set(rep[0], rep[1]); }
    return t;
  };
  var noise = function (x, w, h, n, a, b) { for (var i = 0; i < n; i++) { x.fillStyle = 'rgba(' + (rnd() < 0.5 ? a : b) + ',' + (rnd() * 0.07).toFixed(3) + ')'; var s = 1 + rnd() * 3; x.fillRect(rnd() * w, rnd() * h, s, s); } };

  var scene = new T.Scene();
  scene.fog = new T.Fog(0x0b0c0e, 16, 34);
  var camera = new T.PerspectiveCamera(36, 1, 0.1, 80);

  /* reflections: a night sky, a warm street glow, a pale panel in front */
  (function () {
    var s = new T.Scene();
    s.add(new T.Mesh(new T.BoxGeometry(60, 60, 60), new T.MeshBasicMaterial({ color: 0x0a0c10, side: T.BackSide })));
    var panel = function (c, k, w, h, x, y, z) {
      var m = new T.Mesh(new T.PlaneGeometry(w, h), new T.MeshBasicMaterial({ color: new T.Color(c).multiplyScalar(k), side: T.DoubleSide }));
      m.position.set(x, y, z); m.lookAt(0, 2, 0); s.add(m);
    };
    panel(0x8ea3c4, 0.75, 40, 10, 0, 22, 0);
    panel(0xf5821f, 1.1, 26, 3, 0, -1, 20);
    panel(0xfff0dc, 0.55, 10, 4, 0, 7, 18);
    panel(0xfff3e0, 1.6, 8, 3, 0, 3, -20);
    var pm = new T.PMREMGenerator(renderer);
    scene.environment = pm.fromScene(s, 0.04).texture;
    pm.dispose();
  })();

  /* ---------- lights ---------- */
  scene.add(new T.HemisphereLight(srgb(0x7e8fae), srgb(0x17130f), 0.26));
  var moon = new T.DirectionalLight(srgb(0xaab9d8), 0.32); moon.position.set(-7, 11, 9); scene.add(moon);
  var lamp = new T.SpotLight(srgb(0xffd6a0), 2.6, 16, 0.62, 0.85, 1.3); lamp.position.set(0, 6.3, 2.4); lamp.target.position.set(0, 0.2, 0.6);
  scene.add(lamp); scene.add(lamp.target);
  var signGlow = new T.PointLight(srgb(0xff8a2a), 0.9, 5.5, 2); signGlow.position.set(0, 4.95, 0.9); scene.add(signGlow);
  // two wall lamps either side of the sign, washing light down the ribbed wall
  var wallLamps = [-1, 1].map(function (s) {
    var l = new T.SpotLight(srgb(0xffe2bd), 2.4, 9, 0.6, 0.85, 1.1); l.position.set(s * 3.05, 4.55, 0.55); l.target.position.set(s * 3.2, 0, 0.1);
    scene.add(l); scene.add(l.target);
    return l;
  });
  var ROWS = [-1.9, -4.7, -7.5, -10.3];
  var rowLights = ROWS.map(function (z) { var l = new T.PointLight(srgb(0xfff2df), 0, 10, 1.5); l.position.set(0, 4.3, z); scene.add(l); return l; });
  var spillLight = new T.PointLight(srgb(0xffe6c4), 0, 9, 2); spillLight.position.set(0, 2.2, -0.6); scene.add(spillLight);

  /* ---------- textures drawn here ---------- */
  var groundTex = tex(mk(1024, 1024, function (x, w, h) {      // the yard in front: dark concrete, a kerb line and a keep-clear box
    x.fillStyle = '#3b3c3e'; x.fillRect(0, 0, w, h);
    noise(x, w, h, 9000, '255,255,255', '0,0,0');
    var px = w / 12;                                             // 12 m across, 12 m deep; the wall is at the top
    x.fillStyle = '#d9a514'; x.fillRect(0, 0.12 * px, w, 0.1 * px);
    var bx = w / 2 - 2.25 * px, bw = 4.5 * px, by = 0.55 * px, bh = 2.4 * px;
    x.save(); x.beginPath(); x.rect(bx, by, bw, bh); x.clip();
    x.strokeStyle = 'rgba(217,165,20,.85)'; x.lineWidth = 0.12 * px;
    for (var k = -12; k < 20; k++) { x.beginPath(); x.moveTo(bx + k * 0.42 * px, by); x.lineTo(bx + k * 0.42 * px + bh, by + bh); x.stroke(); }
    x.restore();
    x.strokeStyle = '#d9a514'; x.lineWidth = 0.1 * px; x.strokeRect(bx, by, bw, bh);
    x.globalCompositeOperation = 'multiply'; noise(x, w, h, 5000, '90,90,90', '140,140,140');
  }));
  var floorTex = tex(mk(1024, 1024, function (x, w, h) {       // inside: polished concrete, saw cuts, aisle lines
    var g = x.createLinearGradient(0, 0, w, h); g.addColorStop(0, '#9a9c9f'); g.addColorStop(1, '#8a8c90');
    x.fillStyle = g; x.fillRect(0, 0, w, h);
    noise(x, w, h, 7000, '255,255,255', '0,0,0');
    var px = w / 9;                                              // 9 m across, 12 m deep (stretched)
    x.strokeStyle = 'rgba(40,40,42,.35)'; x.lineWidth = 3;
    for (var i = 1; i < 3; i++) { x.beginPath(); x.moveTo(i * w / 3, 0); x.lineTo(i * w / 3, h); x.stroke(); x.beginPath(); x.moveTo(0, i * h / 4); x.lineTo(w, i * h / 4); x.stroke(); x.beginPath(); x.moveTo(0, (i + 1.5) * h / 4); x.lineTo(w, (i + 1.5) * h / 4); x.stroke(); }
    x.fillStyle = '#e1ae17';
    [-1.75, 1.75].forEach(function (m) { x.fillRect(w / 2 + m * px - 0.05 * px, 0, 0.1 * px, h); });
  }));
  var hazardTex = tex(mk(256, 32, function (x, w, h) {
    x.fillStyle = '#f2c21b'; x.fillRect(0, 0, w, h); x.fillStyle = '#141518';
    for (var k = -2; k < 12; k++) { x.beginPath(); x.moveTo(k * 32, h); x.lineTo(k * 32 + 16, h); x.lineTo(k * 32 + 16 + h, 0); x.lineTo(k * 32 + h, 0); x.closePath(); x.fill(); }
  }), [6, 1]);
  var bollardTex = tex(mk(64, 256, function (x, w, h) {
    x.fillStyle = '#f2c21b'; x.fillRect(0, 0, w, h); x.fillStyle = '#141518';
    for (var k = 0; k < 4; k++) x.fillRect(0, k * 64 + 32, w, 32);
  }));
  var glow = function (inner, outer) {
    return tex(mk(256, 256, function (x, w, h) {
      var g = x.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, w / 2); g.addColorStop(0, inner); g.addColorStop(1, outer);
      x.fillStyle = g; x.fillRect(0, 0, w, h);
    }));
  };
  var dotTex = glow('rgba(255,236,205,1)', 'rgba(255,236,205,0)');
  var spillTex = tex(mk(512, 512, function (x, w, h) {         // light falling out of the door onto the yard: wider as it comes out
    var g = x.createLinearGradient(0, 0, 0, h); g.addColorStop(0, 'rgba(255,226,180,1)'); g.addColorStop(0.55, 'rgba(255,214,160,.35)'); g.addColorStop(1, 'rgba(255,214,160,0)');
    x.fillStyle = g;
    x.filter = 'blur(18px)';
    x.beginPath(); x.moveTo(w * 0.31, 0); x.lineTo(w * 0.69, 0); x.lineTo(w * 0.95, h); x.lineTo(w * 0.05, h); x.closePath(); x.fill();
  }));
  var hazeTex = tex(mk(256, 256, function (x, w, h) {
    var g = x.createLinearGradient(0, 0, 0, h); g.addColorStop(0, 'rgba(255,228,190,.9)'); g.addColorStop(1, 'rgba(255,228,190,0)');
    x.fillStyle = g; x.fillRect(0, 0, w, h);
    x.globalCompositeOperation = 'destination-in';
    var e = x.createLinearGradient(0, 0, w, 0); e.addColorStop(0, 'rgba(0,0,0,0)'); e.addColorStop(0.25, '#000'); e.addColorStop(0.75, '#000'); e.addColorStop(1, 'rgba(0,0,0,0)');
    x.fillStyle = e; x.fillRect(0, 0, w, h);
  }));

  /* ---------- materials ---------- */
  var clipTop = new T.Plane(new T.Vector3(0, -1, 0), 3.74);       // the shutter disappears into its box
  var clipDecal = new T.Plane(new T.Vector3(0, -1, 0), 3.6);
  var M = {
    clad: new T.MeshStandardMaterial({ color: srgb(0x3b4149), metalness: 0.3, roughness: 0.55 }),
    trim: new T.MeshStandardMaterial({ color: srgb(0x1b1e23), metalness: 0.6, roughness: 0.45 }),
    housing: new T.MeshStandardMaterial({ color: srgb(0x41474f), metalness: 0.75, roughness: 0.4 }),
    guide: new T.MeshStandardMaterial({ color: srgb(0x9aa1a9), metalness: 0.85, roughness: 0.4 }),
    galv: new T.MeshStandardMaterial({ color: srgb(0xb3b9c0), metalness: 0.88, roughness: 0.36, clippingPlanes: [clipTop], side: T.DoubleSide }),
    bar: new T.MeshStandardMaterial({ color: srgb(0x878d95), metalness: 0.9, roughness: 0.38, clippingPlanes: [clipTop] }),
    chrome: new T.MeshStandardMaterial({ color: 0xe6e9ee, metalness: 1, roughness: 0.15, clippingPlanes: [clipTop] }),
    rubber: new T.MeshStandardMaterial({ color: 0x111214, roughness: 0.85, clippingPlanes: [clipTop] }),
    hazard: new T.MeshStandardMaterial({ map: hazardTex, roughness: 0.6, clippingPlanes: [clipTop] }),
    decal: null,
    ground: new T.MeshStandardMaterial({ map: groundTex, roughness: 0.86, metalness: 0 }),
    floor: new T.MeshStandardMaterial({ map: floorTex, roughness: 0.3, metalness: 0.05 }),
    wall: new T.MeshStandardMaterial({ color: srgb(0x8b9097), roughness: 0.9 }),
    back: new T.MeshStandardMaterial({ color: srgb(0x2d3238), roughness: 0.8 }),
    ceil: new T.MeshStandardMaterial({ color: srgb(0x2a2d32), roughness: 0.95 }),
    upright: new T.MeshStandardMaterial({ color: srgb(0x23466e), metalness: 0.45, roughness: 0.45 }),
    beam: new T.MeshStandardMaterial({ color: srgb(0xf06c12), metalness: 0.3, roughness: 0.42 }),
    deck: new T.MeshStandardMaterial({ color: srgb(0x5d636b), metalness: 0.6, roughness: 0.55 }),
    carton: new T.MeshStandardMaterial({ color: 0xffffff, roughness: 0.92 }),
    white: new T.MeshStandardMaterial({ color: srgb(0xf1f0ec), roughness: 0.6 }),
    wood: new T.MeshStandardMaterial({ color: srgb(0x9a7148), roughness: 0.9 }),
    bollard: new T.MeshStandardMaterial({ map: bollardTex, roughness: 0.5 }),
    fixture: new T.MeshBasicMaterial({ color: 0x000000 }),
    orangeLit: new T.MeshBasicMaterial({ color: srgb(0xf5821f) })
  };

  /* ---------- the building ---------- */
  var OPEN_W = 4.0, OPEN_H = 3.6;
  // corrugated cladding: vertical ribs
  function cladding(x0, x1, y0, y1) {
    var P = 0.3, d = 0.045, prof = [[0, 0], [0.1, 0], [0.14, d], [0.26, d], [0.3, 0]], pts = [];
    for (var x = x0; x < x1 - 1e-6; x += P) prof.forEach(function (p, k) { if (k < 4 || x + P >= x1 - 1e-6) { var X = Math.min(x1, x + p[0]); pts.push([X, p[1]]); } });
    var pos = [];
    for (var i = 0; i < pts.length - 1; i++) {
      var a = pts[i], b = pts[i + 1];
      if (b[0] <= a[0]) continue;
      pos.push(a[0], y0, a[1], b[0], y0, b[1], b[0], y1, b[1], a[0], y0, a[1], b[0], y1, b[1], a[0], y1, a[1]);
    }
    var g = new T.BufferGeometry(); g.setAttribute('position', new T.Float32BufferAttribute(pos, 3)); g.computeVertexNormals();
    return new T.Mesh(g, M.clad);
  }
  var hw = OPEN_W / 2 + 0.14;
  scene.add(cladding(-9, -hw, 0, 9), cladding(hw, 9, 0, 9), cladding(-hw, hw, OPEN_H, 9));
  // a steel band along the bottom of the wall and a coping along the top
  var kick = new T.Mesh(new T.BoxGeometry(18, 0.3, 0.12), M.trim); kick.position.set(0, 0.15, 0.02);
  scene.add(kick);
  // the guide rails either side of the opening
  [-1, 1].forEach(function (s) {
    var gd = new T.Mesh(new T.BoxGeometry(0.15, OPEN_H + 0.02, 0.18), M.guide); gd.position.set(s * (OPEN_W / 2 + 0.07), OPEN_H / 2, 0.05); scene.add(gd);
    var lip = new T.Mesh(new T.BoxGeometry(0.04, OPEN_H, 0.06), M.trim); lip.position.set(s * (OPEN_W / 2 + 0.005), OPEN_H / 2, 0.12); scene.add(lip);
  });
  // the shutter box over the opening
  var box = new T.Mesh(new T.BoxGeometry(OPEN_W + 0.6, 0.66, 0.6), M.housing); box.position.set(0, OPEN_H + 0.33, 0.24); scene.add(box);
  var boxLip = new T.Mesh(new T.BoxGeometry(OPEN_W + 0.64, 0.05, 0.64), M.trim); boxLip.position.set(0, OPEN_H + 0.66, 0.24); scene.add(boxLip);
  // the sign: lit letters on a black box, an orange line of light underneath
  var signC = document.createElement('canvas'); signC.width = 2048; signC.height = 360;
  var signTex = tex(signC);
  var signMat = new T.MeshBasicMaterial({ map: signTex, color: 0x000000 });
  var signBox = new T.Mesh(new T.BoxGeometry(5.6, 0.98, 0.16), M.trim); signBox.position.set(0, 4.95, 0.1); scene.add(signBox);
  var signFace = new T.Mesh(new T.PlaneGeometry(5.48, 0.94), signMat); signFace.position.set(0, 4.95, 0.185); scene.add(signFace);
  var ledMat = new T.MeshBasicMaterial({ color: 0x000000 }), LED = srgb(0xff8a2a);
  var led = new T.Mesh(new T.BoxGeometry(5.5, 0.035, 0.04), ledMat); led.position.set(0, 4.43, 0.17); scene.add(led);
  var markImg = new Image();
  markImg.src = canvas.getAttribute('data-mark') || '';
  var names = { en: canvas.getAttribute('data-en') || 'Bait Al Maqdis', ar: canvas.getAttribute('data-ar') || '' };
  function drawSign() {
    var x = signC.getContext('2d'), w = signC.width, h = signC.height;
    x.clearRect(0, 0, w, h);
    x.fillStyle = '#0c0d0f'; x.fillRect(0, 0, w, h);
    x.strokeStyle = 'rgba(255,255,255,.07)'; x.lineWidth = 6; x.strokeRect(8, 8, w - 16, h - 16);
    if (markImg.complete && markImg.naturalWidth) {          // their dome mark, small, in orange
      var mh = 170, mw = mh * markImg.naturalWidth / markImg.naturalHeight;
      var t = mk(Math.ceil(mw), mh, function (c) { c.drawImage(markImg, 0, 0, mw, mh); c.globalCompositeOperation = 'source-in'; c.fillStyle = '#f5821f'; c.fillRect(0, 0, mw, mh); });
      x.save(); x.shadowColor = 'rgba(245,130,31,.9)'; x.shadowBlur = 30; x.drawImage(t, 90, (h - mh) / 2); x.restore();
    }
    x.textAlign = 'center'; x.textBaseline = 'alphabetic';
    var cx = w / 2 - 20;
    x.save(); x.translate(cx, 190); x.scale(0.78, 1);
    x.font = '900 168px Archivo, "Arial Narrow", Arial, sans-serif';
    x.shadowColor = 'rgba(255,170,90,.75)'; x.shadowBlur = 34; x.fillStyle = '#fff4e8';
    x.fillText(names.en.toUpperCase(), 0, 0); x.restore();
    if (names.ar) {
      x.save(); x.direction = 'rtl'; x.font = '700 92px "IBM Plex Sans Arabic", Arial, sans-serif';
      x.shadowColor = 'rgba(245,130,31,.8)'; x.shadowBlur = 26; x.fillStyle = '#ffb36b';
      x.fillText(names.ar, cx, 312); x.restore();
    }
    // the unit number in an orange box
    var bx = w - 330, by = 60, bs = 240;
    x.save(); x.shadowColor = 'rgba(245,130,31,.8)'; x.shadowBlur = 36; x.fillStyle = '#f5821f';
    x.beginPath(); if (x.roundRect) x.roundRect(bx, by, bs, bs, 22); else x.rect(bx, by, bs, bs); x.fill(); x.restore();
    x.save(); x.translate(bx + bs / 2, by + bs * 0.79); x.scale(0.8, 1); x.font = '900 190px Archivo, Arial, sans-serif'; x.fillStyle = '#0c0d0f'; x.fillText('06', 0, 0); x.restore();
    signTex.needsUpdate = true;
  }
  drawSign();
  markImg.onload = drawSign;
  if (document.fonts && document.fonts.load) {
    Promise.all([document.fonts.load('900 100px Archivo'), names.ar ? document.fonts.load('700 60px "IBM Plex Sans Arabic"', names.ar) : 0]).then(drawSign, function () {});
  }
  var lampMat = new T.MeshBasicMaterial({ color: srgb(0xfff1dc) });
  [-1, 1].forEach(function (s) {
    var body = new T.Mesh(new T.BoxGeometry(0.34, 0.2, 0.3), M.trim); body.position.set(s * 3.05, 4.66, 0.17); scene.add(body);
    var lens = new T.Mesh(new T.PlaneGeometry(0.28, 0.24), lampMat); lens.rotation.x = Math.PI / 2; lens.position.set(s * 3.05, 4.555, 0.19); scene.add(lens);
  });
  // two bollards in hazard stripes
  [-1, 1].forEach(function (s) {
    var b = new T.Mesh(new T.CylinderGeometry(0.11, 0.11, 1.05, 24), M.bollard); b.position.set(s * 2.75, 0.525, 0.65); scene.add(b);
    var c = new T.Mesh(new T.SphereGeometry(0.11, 20, 10, 0, Math.PI * 2, 0, Math.PI / 2), M.bollard); c.position.set(s * 2.75, 1.05, 0.65); scene.add(c);
  });
  // the yard
  var yard = new T.Mesh(new T.PlaneGeometry(12, 12), M.ground); yard.rotation.x = -Math.PI / 2; yard.position.set(0, 0, 6); scene.add(yard);
  var yardFar = new T.Mesh(new T.PlaneGeometry(60, 40), new T.MeshStandardMaterial({ color: srgb(0x2c2d2f), roughness: 0.9 })); yardFar.rotation.x = -Math.PI / 2; yardFar.position.set(0, -0.005, 14); scene.add(yardFar);

  /* ---------- the roller shutter ---------- */
  var PITCH = 0.082, BAR_H = 0.11, N = Math.ceil((OPEN_H + 0.3) / PITCH) + 2;
  var slatGeo = (function () {
    var seg = 7, W = OPEN_W + 0.12, prof = [], pos = [], idx = [];
    for (var k = 0; k <= seg; k++) { var v = k / seg; prof.push([v * PITCH * 0.9, 0.016 * Math.sin(Math.PI * v)]); }
    prof.push([PITCH * 0.95, -0.006], [PITCH, 0.0]);       // the hinge between slats
    prof.forEach(function (p) { pos.push(-W / 2, p[0], p[1], W / 2, p[0], p[1]); });
    for (k = 0; k < prof.length - 1; k++) { var a = k * 2; idx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2); }
    var g = new T.BufferGeometry(); g.setAttribute('position', new T.Float32BufferAttribute(pos, 3)); g.setIndex(idx); g.computeVertexNormals();
    return g;
  })();
  var slats = new T.InstancedMesh(slatGeo, M.galv, N); scene.add(slats);
  var dummy = new T.Object3D();
  var curtainBar = new T.Group(); scene.add(curtainBar);
  (function () {
    var bar = new T.Mesh(new T.BoxGeometry(OPEN_W + 0.1, BAR_H, 0.07), M.bar); bar.position.y = BAR_H / 2; curtainBar.add(bar);
    var seal = new T.Mesh(new T.BoxGeometry(OPEN_W + 0.1, 0.03, 0.05), M.rubber); seal.position.y = -0.005; curtainBar.add(seal);
    var hz = new T.Mesh(new T.PlaneGeometry(OPEN_W + 0.06, 0.06), M.hazard); hz.position.set(0, BAR_H * 0.52, 0.0355); curtainBar.add(hz);
    [-0.95, 0.95].forEach(function (x) {                      // lifting handles
      var hd = new T.Mesh(new T.TorusGeometry(0.075, 0.014, 8, 20, Math.PI), M.chrome); hd.position.set(x, 0.2, 0.045); curtainBar.add(hd);
    });
    var lock = new T.Mesh(new T.CylinderGeometry(0.03, 0.03, 0.03, 20), M.chrome); lock.rotation.x = Math.PI / 2; lock.position.set(0, BAR_H * 0.55, 0.045); curtainBar.add(lock);
  })();
  // the unit number stencilled on the shutter
  function drawDecal(x, w, h) {
    x.globalCompositeOperation = 'source-over'; x.clearRect(0, 0, w, h); seed = 11;
    x.textAlign = 'center'; x.fillStyle = '#f5821f';
    x.save(); x.translate(w / 2, h * 0.86); x.scale(0.8, 1); x.font = '900 340px Archivo, Arial, sans-serif'; x.fillText('06', 0, 0); x.restore();
    x.globalCompositeOperation = 'destination-out';              // worn paint
    for (var i = 0; i < 2600; i++) { x.fillStyle = 'rgba(0,0,0,' + (rnd() * 0.5).toFixed(2) + ')'; var s = 1 + rnd() * 3; x.fillRect(rnd() * w, rnd() * h, s, s); }
    x.globalCompositeOperation = 'source-over';
  }
  var decalTex = tex(mk(512, 384, drawDecal));
  M.decal = new T.MeshStandardMaterial({ map: decalTex, transparent: true, roughness: 0.55, metalness: 0.2, clippingPlanes: [clipDecal], depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2 });
  var decal = new T.Mesh(new T.PlaneGeometry(1.5, 1.125), M.decal); scene.add(decal);
  function redrawDecal() { var c = decalTex.image; drawDecal(c.getContext('2d'), c.width, c.height); decalTex.needsUpdate = true; }
  if (document.fonts && document.fonts.load) document.fonts.load('900 100px Archivo').then(redrawDecal, function () {});

  /* ---------- inside ---------- */
  var IN_W = 9, IN_D = 12.4, IN_H = 5.2;
  var fl = new T.Mesh(new T.PlaneGeometry(IN_W, IN_D), M.floor); fl.rotation.x = -Math.PI / 2; fl.position.set(0, 0.002, -IN_D / 2); scene.add(fl);
  var cl = new T.Mesh(new T.PlaneGeometry(IN_W, IN_D), M.ceil); cl.rotation.x = Math.PI / 2; cl.position.set(0, IN_H, -IN_D / 2); scene.add(cl);
  var bk = new T.Mesh(new T.PlaneGeometry(IN_W, IN_H), M.back); bk.position.set(0, IN_H / 2, -IN_D); scene.add(bk);
  [-1, 1].forEach(function (s) { var w = new T.Mesh(new T.PlaneGeometry(IN_D, IN_H), M.wall); w.rotation.y = -s * Math.PI / 2; w.position.set(s * IN_W / 2, IN_H / 2, -IN_D / 2); scene.add(w); });
  // pallet racking down both sides: blue uprights, orange beams, cartons
  var BAYS = 4, BAY = 2.45, Z0 = -1.3, LEV = [0.14, 1.5, 2.86, 4.2], RX = 3.55, RD = 1.0;
  var up = new T.InstancedMesh(new T.BoxGeometry(0.08, 4.5, 0.08), M.upright, 2 * 2 * (BAYS + 1));
  var bm = new T.InstancedMesh(new T.BoxGeometry(0.06, 0.13, BAY - 0.08), M.beam, 2 * 2 * BAYS * LEV.length);
  var dk = new T.InstancedMesh(new T.BoxGeometry(RD, 0.03, BAY - 0.1), M.deck, 2 * BAYS * LEV.length);
  var cartonGeo = new T.BoxGeometry(1, 1, 1);
  var cartons = [], ui = 0, bi = 0, di = 0;
  [-1, 1].forEach(function (s) {
    var xc = s * RX;
    for (var b = 0; b <= BAYS; b++) [-1, 1].forEach(function (f) { dummy.position.set(xc + f * RD / 2, 2.25, Z0 - b * BAY); dummy.rotation.set(0, 0, 0); dummy.scale.set(1, 1, 1); dummy.updateMatrix(); up.setMatrixAt(ui++, dummy.matrix); });
    for (b = 0; b < BAYS; b++) {
      var zc = Z0 - (b + 0.5) * BAY;
      LEV.forEach(function (y, li) {
        [-1, 1].forEach(function (f) { dummy.position.set(xc + f * RD / 2, y + 0.06, zc); dummy.updateMatrix(); bm.setMatrixAt(bi++, dummy.matrix); });
        dummy.position.set(xc, y + 0.13, zc); dummy.updateMatrix(); dk.setMatrixAt(di++, dummy.matrix);
        if (li === LEV.length - 1 && rnd() < 0.5) return;
        var z = zc - BAY / 2 + 0.12;
        while (z < zc + BAY / 2 - 0.4) {
          var d = 0.45 + rnd() * 0.5, hh = 0.4 + rnd() * 0.7, wd = 0.6 + rnd() * 0.35;
          if (z + d > zc + BAY / 2 - 0.08) break;
          if (rnd() < 0.85) cartons.push({ p: [xc + s * (rnd() * 0.1), y + 0.145 + hh / 2, z + d / 2], s: [wd, hh, d], c: rnd() < 0.8 ? 0 : 1 });
          z += d + 0.04 + rnd() * 0.12;
        }
      });
    }
  });
  scene.add(up, bm, dk);
  // a pallet of stock in the aisle
  var pal = new T.Group(); pal.position.set(-1.0, 0, -7.2); pal.rotation.y = 0.15; scene.add(pal);
  var pb = new T.Mesh(new T.BoxGeometry(1.2, 0.14, 1.0), M.wood); pb.position.y = 0.07; pal.add(pb);
  [[-0.3, -0.25, 0.55, 0.5, 0.45], [0.3, -0.25, 0.55, 0.5, 0.45], [-0.3, 0.25, 0.55, 0.5, 0.45], [0.3, 0.25, 0.55, 0.42, 0.45], [0.0, 0.0, 1.1, 0.4, 0.9]].forEach(function (q, k) {
    var y = k < 4 ? 0.14 + q[3] / 2 : 0.14 + 0.5 + q[3] / 2;
    cartons.push({ p: [q[0], y, q[1]], s: [q[2], q[3], q[4]], c: 0, g: pal });
  });
  var shades = [srgb(0xb88a58), srgb(0xa77a4b), srgb(0xc49a68), srgb(0x9d7245)];
  var ct = new T.InstancedMesh(cartonGeo, M.carton, cartons.filter(function (c) { return !c.g; }).length);
  var ctPal = new T.InstancedMesh(cartonGeo, M.carton, cartons.filter(function (c) { return c.g; }).length);
  var ci = 0, cp = 0;
  cartons.forEach(function (c) {
    dummy.position.set(c.p[0], c.p[1], c.p[2]); dummy.rotation.set(0, 0, 0); dummy.scale.set(c.s[0], c.s[1], c.s[2]); dummy.updateMatrix();
    var col = c.c ? srgb(0xeeeeea) : shades[Math.floor(rnd() * shades.length)];
    if (c.g) { ctPal.setMatrixAt(cp, dummy.matrix); ctPal.setColorAt(cp++, col); } else { ct.setMatrixAt(ci, dummy.matrix); ct.setColorAt(ci++, col); }
  });
  scene.add(ct); pal.add(ctPal);
  // the lights: rows of long fittings
  var fixtures = [];
  ROWS.forEach(function (z) {
    [-1.7, 1.7].forEach(function (x) {
      var f = new T.Mesh(new T.BoxGeometry(0.22, 0.06, 1.8), M.fixture.clone()); f.position.set(x, IN_H - 0.25, z); scene.add(f); fixtures.push(f);
      var hs = new T.Mesh(new T.BoxGeometry(0.28, 0.08, 1.86), M.trim); hs.position.set(x, IN_H - 0.2, z); scene.add(hs);
    });
  });
  // their products: on the display wall at the back, and on the ends of the racking
  var photos = (canvas.getAttribute('data-imgs') || '').split('|').filter(Boolean);
  var boards = [];
  function board(w, h, x, y, z, ry) {
    var g = new T.Group(); g.position.set(x, y, z); g.rotation.y = ry || 0; scene.add(g);
    var back = new T.Mesh(new T.BoxGeometry(w + 0.08, h + 0.08, 0.05), M.trim); g.add(back);
    var face = new T.Mesh(new T.PlaneGeometry(w, h), M.white.clone()); face.position.z = 0.03; g.add(face);
    boards.push(face);
    return g;
  }
  var cols = 5, bw = 1.05;
  for (var r = 0; r < 2; r++) for (var c = 0; c < cols; c++) board(bw, bw, (c - (cols - 1) / 2) * (bw + 0.22), 1.35 + r * (bw + 0.25), -IN_D + 0.06);
  var headC = mk(1024, 128, function (x, w, h) { x.fillStyle = '#f5821f'; x.fillRect(0, 0, w, h); });
  var head = new T.Mesh(new T.PlaneGeometry(6.6, 0.42), new T.MeshStandardMaterial({ map: tex(headC), roughness: 0.6 })); head.position.set(0, 4.15, -IN_D + 0.05); scene.add(head);
  [-1, 1].forEach(function (s) { for (var l = 0; l < 3; l++) board(0.78, 0.78, s * RX, LEV[l] + 0.78, Z0 + 0.12); });
  var loader = new T.ImageLoader();
  boards.forEach(function (face, k) {
    var src = photos[k % Math.max(1, photos.length)];
    if (!src) return;
    loader.load(src, function (img) {
      var c = mk(256, 256, function (x, w, h) {
        x.fillStyle = '#fff'; x.fillRect(0, 0, w, h);
        var s = Math.min((w - 28) / img.width, (h - 28) / img.height);
        x.drawImage(img, (w - img.width * s) / 2, (h - img.height * s) / 2, img.width * s, img.height * s);
      });
      face.material.map = tex(c); face.material.color.set(0xffffff); face.material.needsUpdate = true;
    });
  });

  /* ---------- light coming out ---------- */
  var addMat = function (map) { return new T.MeshBasicMaterial({ map: map, transparent: true, opacity: 0, blending: T.AdditiveBlending, depthWrite: false, color: srgb(0xffd8a8) }); };
  var spill = new T.Mesh(new T.PlaneGeometry(7.5, 6), addMat(spillTex)); spill.rotation.x = -Math.PI / 2; spill.position.set(0, 0.012, 3.0); scene.add(spill);
  var hazeGeo = (function () {           // a sheet of light from the top of the door down to the yard
    var g = new T.BufferGeometry();
    g.setAttribute('position', new T.Float32BufferAttribute([-2, OPEN_H - 0.1, 0.1, 2, OPEN_H - 0.1, 0.1, -3.3, 0.02, 4.8, 3.3, 0.02, 4.8], 3));
    g.setAttribute('uv', new T.Float32BufferAttribute([0, 1, 1, 1, 0, 0, 1, 0], 2));
    g.setIndex([0, 2, 1, 1, 2, 3]);
    return g;
  })();
  var haze = new T.Mesh(hazeGeo, addMat(hazeTex)); haze.material.side = T.DoubleSide; scene.add(haze);
  var haze2 = haze.clone(); haze2.material = haze.material.clone(); haze2.scale.set(0.8, 1, 0.7); scene.add(haze2);
  var dust = (function () {
    var n = 170, pos = new Float32Array(n * 3);
    for (var i = 0; i < n; i++) { pos[i * 3] = (rnd() - 0.5) * 4.2; pos[i * 3 + 1] = 0.2 + rnd() * 3.3; pos[i * 3 + 2] = -1 + rnd() * 4; }
    var g = new T.BufferGeometry(); g.setAttribute('position', new T.BufferAttribute(pos, 3));
    var m = new T.PointsMaterial({ map: dotTex, size: 0.05, transparent: true, opacity: 0, depthWrite: false, blending: T.AdditiveBlending, color: srgb(0xffe2b8) });
    var p = new T.Points(g, m); scene.add(p); return p;
  })();

  /* ---------- the scroll ---------- */
  var st = { p: 0, t: 0, mx: 0, my: 0, tx: 0, ty: 0, open: 0, lastOpen: 0, rowOn: ROWS.map(function () { return -1; }), signOn: -1 };
  var CAM0 = new T.Vector3(0.75, 1.55, 9.8), CAM1 = new T.Vector3(0.12, 1.7, 3.9);
  var LOOK0 = new T.Vector3(0, 2.65, 0), LOOK1 = new T.Vector3(0, 2.0, -6), look = new T.Vector3();
  function flicker(t) {     // a fluorescent tube starting: a few blinks, then on
    if (t < 0) return 0;
    if (t > 0.75) return 1;
    var f = [0, 0.9, 0, 0, 0.6, 0.1, 1, 0.3, 1, 1, 0.8, 1];
    return f[Math.min(f.length - 1, Math.floor(t / 0.75 * f.length))];
  }
  function layout() {
    var w = canvas.clientWidth || 600, h = canvas.clientHeight || 600;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    // keep the whole front (about 6.6 m wide) in view on a narrow screen
    var hf = 2 * Math.atan(3.3 / CAM0.z);
    camera.fov = Math.max(36, 2 * Math.atan(Math.tan(hf / 2) / camera.aspect) * 180 / Math.PI);
    camera.updateProjectionMatrix();
  }
  addEventListener('resize', layout);
  layout();

  function pose(dt) {
    var P = st.p, t = st.t;
    st.mx += (st.tx - st.mx) * Math.min(1, dt * 2.5); st.my += (st.ty - st.my) * Math.min(1, dt * 2.5);
    // the sign comes on when it is first seen, then stays on
    if (st.signOn < 0) st.signOn = st.instant ? t - 5 : t;
    var sg = flicker(t - st.signOn - 0.15);
    signMat.color.setScalar(0.08 + 0.92 * sg); ledMat.color.copy(LED).multiplyScalar(sg * 1.2);
    signGlow.intensity = 0.9 * sg;
    // the shutter: up between 6% and 66% of the scroll, with a small bounce at the top
    var o = ease((P - 0.06) / 0.6);
    var speed = Math.abs(o - st.lastOpen) / Math.max(dt, 0.001); st.lastOpen = o;
    var yb = o * (OPEN_H - 0.04);
    curtainBar.position.set(0, yb, 0.02);
    for (var i = 0; i < N; i++) {
      var y = yb + BAR_H + i * PITCH;
      dummy.position.set(0, y, 0.0 + Math.sin(i * 0.9 + t * 9) * Math.min(0.006, speed * 0.004));
      dummy.rotation.set(0, 0, 0); dummy.scale.set(1, 1, 1);
      dummy.updateMatrix(); slats.setMatrixAt(i, dummy.matrix);
    }
    slats.instanceMatrix.needsUpdate = true;
    decal.position.set(0, yb + BAR_H + 1.55, 0.03);
    // the lights inside, front row first
    var lit = 0;
    ROWS.forEach(function (z, k) {
      var on = P > 0.2 + k * 0.08;
      if (on && st.rowOn[k] < 0) st.rowOn[k] = st.instant ? t - 5 : t + k * 0.12;
      if (!on) st.rowOn[k] = -1;
      var f = on ? flicker(t - st.rowOn[k]) : 0;
      rowLights[k].intensity = 1.45 * f;
      fixtures[k * 2].material.color.setScalar(f * 1.6); fixtures[k * 2 + 1].material.color.setScalar(f * 1.6);
      lit += f / ROWS.length;
    });
    var out = lit * smooth(o * 1.3);
    spillLight.intensity = 1.1 * out;
    spill.material.opacity = 0.75 * out;
    haze.material.opacity = 0.16 * out; haze2.material.opacity = 0.1 * out;
    dust.material.opacity = 0.75 * out;
    var dp = dust.geometry.attributes.position;
    for (i = 0; i < dp.count; i++) {
      var yy = dp.getY(i) + dt * 0.05 * (0.4 + (i % 5) * 0.2);
      if (yy > 3.6) yy = 0.2;
      dp.setY(i, yy); dp.setX(i, dp.getX(i) + Math.sin(t * 0.3 + i) * dt * 0.02);
    }
    dp.needsUpdate = true;
    // walking up to the door as it opens
    var c = ease((P - 0.12) / 0.88);
    camera.position.lerpVectors(CAM0, CAM1, c);
    camera.position.x += st.mx * 0.35 * (1 - c * 0.6);
    camera.position.y += -st.my * 0.18 + Math.sin(t * 0.5) * 0.015;
    look.lerpVectors(LOOK0, LOOK1, ease((P - 0.25) / 0.75));
    camera.lookAt(look);
  }

  var visible = false, last = performance.now(), raf = 0;
  function frame(now) {
    raf = 0;
    if (!visible) return;
    raf = requestAnimationFrame(frame);
    var raw = (now - last) / 1000, dt = Math.min(0.05, raw); last = now;
    st.t += dt;
    pose(dt);
    renderer.render(scene, camera);
  }
  api.progress = function (p) { st.p = clamp01(p); };
  api.show = function (on) {
    if (on === visible) return;
    visible = on;
    if (on) { last = performance.now(); if (!raf) raf = requestAnimationFrame(frame); }
  };
  api.pointer = function (x, y) { st.tx = x; st.ty = y; };
  api.skip = function () { st.instant = true; st.signOn = st.t - 5; st.rowOn = st.rowOn.map(function (v) { return v < 0 ? v : st.t - 5; }); };
  canvas.addEventListener('pointermove', function (e) {
    if (e.pointerType !== 'mouse') return;
    var r = canvas.getBoundingClientRect(); st.tx = (e.clientX - r.left) / r.width * 2 - 1; st.ty = (e.clientY - r.top) / r.height * 2 - 1;
  }, { passive: true });
  canvas.addEventListener('pointerleave', function () { st.tx = 0; st.ty = 0; });
  // draw only while it is on screen
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(function (es) { es.forEach(function (e) { api.show(e.isIntersecting); }); }, { rootMargin: '15% 0px' }).observe(canvas);
  } else api.show(true);
  document.addEventListener('visibilitychange', function () { if (!document.hidden) last = performance.now(); });
  api.ready = true;
  document.documentElement.classList.add('has-wh');
})();
