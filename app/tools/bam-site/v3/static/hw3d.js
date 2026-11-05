/* Bait Al Maqdis website: the 3D safety and site items.
   A traffic cone, a solar warning light, a roll of warning tape, a pan shovel, a roll of hessian cloth,
   a pair of work gloves and safety glasses float together in the hero; scrolling pulls the warning tape off its roll.
   The gloves are a scanned model and the hessian and the shovel handle use photographed textures, all from
   Poly Haven (polyhaven.com, CC0: free to use, no credit needed), recoloured to match BAM's own products.
   The rest is drawn in the browser, shaped after BAM's own product photos.
   In "Every tool" they fly onto the wall, each with its name. Without 3D (old phone, graphics off)
   the page shows the flat picture instead. */
(function () {
  'use strict';
  var canvas = document.getElementById('gl');
  var BASE = ((document.currentScript && document.currentScript.src) || '').replace(/[^\/]*$/, '') + 'models/';
  var api = { ready: false, hero: function () {}, anatomy: function () {}, labels: [] };
  window.BAM3D = api;
  var fail = function () { document.documentElement.classList.add('no-gl'); if (canvas) canvas.remove(); };
  if (!window.THREE || !canvas) { fail(); return; }
  var T = window.THREE;

  // ask a spare canvas first, so a phone without 3D goes quietly to the picture
  var can = false;
  try { var tc = document.createElement('canvas'); can = !!(window.WebGLRenderingContext && (tc.getContext('webgl') || tc.getContext('experimental-webgl'))); } catch (e) {}
  if (!can) { fail(); return; }

  var renderer;
  try {
    renderer = new T.WebGLRenderer({ canvas: canvas, antialias: (window.devicePixelRatio || 1) < 1.5, alpha: true, powerPreference: 'high-performance' });
  } catch (e) { fail(); return; }
  if (!renderer.getContext()) { fail(); return; }

  var small = function () { return innerWidth < 900; };
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, small() ? 1.5 : 1.75));
  renderer.outputEncoding = T.sRGBEncoding;
  renderer.toneMapping = T.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;
  renderer.setClearColor(0x000000, 0);

  var scene = new T.Scene();
  var camera = new T.PerspectiveCamera(28, 1, 0.1, 100);
  camera.position.set(0, 0, 17);

  /* a studio made of glowing panels, so the metal and the plastic have something to reflect */
  (function () {
    var s = new T.Scene();
    s.add(new T.Mesh(new T.BoxGeometry(40, 40, 40), new T.MeshBasicMaterial({ color: 0x07080a, side: T.BackSide })));
    var panel = function (c, k, w, h, x, y, z) {
      var m = new T.Mesh(new T.PlaneGeometry(w, h), new T.MeshBasicMaterial({ color: new T.Color(c).multiplyScalar(k), side: T.DoubleSide }));
      m.position.set(x, y, z); m.lookAt(0, 0, 0); s.add(m);
    };
    panel(0xffffff, 5.2, 14, 3.5, 0, 13, 4);      // long soft box overhead
    panel(0xe8eeff, 2.6, 3, 14, -14, 1, 5);       // strip on the left
    panel(0xffffff, 3.6, 3, 14, 14, 2, -2);       // strip on the right
    panel(0xf5821f, 4.2, 16, 2.4, 0, -11, -6);    // orange floor glow
    panel(0xff9a3d, 1.6, 4, 10, 10, -3, -12);
    panel(0x8fa6c8, 0.9, 16, 8, 0, 3, -15);
    panel(0xffffff, 2.0, 12, 10, 0, 1, 15);       // soft light from the front, so faces turned to you shine
    var pm = new T.PMREMGenerator(renderer);
    scene.environment = pm.fromScene(s, 0.03).texture;
    pm.dispose();
  })();
  var key = new T.DirectionalLight(0xffffff, 1.3); key.position.set(4, 9, 7); scene.add(key);
  var rim = new T.DirectionalLight(0xf5821f, 2.0); rim.position.set(-7, -3, -6); scene.add(rim);
  var fill = new T.DirectionalLight(0xdfe6ff, 0.45); fill.position.set(-6, 2, 8); scene.add(fill);
  scene.add(new T.AmbientLight(0x30343c, 0.55));

  var srgb = function (hex) { return new T.Color(hex).convertSRGBToLinear(); };

  var M = {
    chrome: new T.MeshStandardMaterial({ color: 0xe9ecf1, metalness: 1, roughness: 0.1 }),
    polish: new T.MeshStandardMaterial({ color: 0xdde1e6, metalness: 1, roughness: 0.17 }),
    satin: new T.MeshStandardMaterial({ color: 0xc8ccd3, metalness: 1, roughness: 0.32 }),
    steel: new T.MeshStandardMaterial({ color: 0x9da3ab, metalness: 1, roughness: 0.34 }),
    dark: new T.MeshStandardMaterial({ color: 0x55595f, metalness: 1, roughness: 0.4 }),
    orange: new T.MeshPhysicalMaterial({ color: srgb(0xf06c12), metalness: 0, roughness: 0.4, clearcoat: 0.55, clearcoatRoughness: 0.3 }),
    paint: new T.MeshPhysicalMaterial({ color: srgb(0xf27a14), metalness: 0, roughness: 0.46, clearcoat: 0.35, clearcoatRoughness: 0.4 }),
    black: new T.MeshStandardMaterial({ color: srgb(0x1b1c1f), metalness: 0, roughness: 0.74 }),
    gloss: new T.MeshPhysicalMaterial({ color: srgb(0x151619), metalness: 0, roughness: 0.32, clearcoat: 0.7, clearcoatRoughness: 0.2 }),
    vial: new T.MeshPhysicalMaterial({ color: srgb(0xb9ef4c), emissive: srgb(0x3d6b00), emissiveIntensity: 0.55, roughness: 0.08, clearcoat: 1, transparent: true, opacity: 0.86 }),
    bubble: new T.MeshStandardMaterial({ color: 0xf4ffe6, emissive: srgb(0x50642a), roughness: 0.15 })
  };

  /* ---------- helpers ---------- */
  function lathe(pts, segs, mat) {
    return new T.Mesh(new T.LatheGeometry(pts.map(function (p) { return new T.Vector2(p[0], p[1]); }), segs || 64), mat);
  }
  /* a flat shape pushed out to a thickness, facing the camera (its thickness along z), centred on z = 0 */
  function ext(shape, depth, bevel, mat, segs, curve) {
    var g = new T.ExtrudeGeometry(shape, { depth: Math.max(0.001, depth - bevel * 2), bevelEnabled: bevel > 0, bevelThickness: bevel, bevelSize: bevel, bevelSegments: segs || 3, curveSegments: curve || 32 });
    g.translate(0, 0, -(depth - bevel * 2) / 2);
    return new T.Mesh(g, mat);
  }
  function rrect(w, h, r, cx, cy) {
    cx = cx || 0; cy = cy || 0;
    var s = new T.Shape(), x = cx - w / 2, y = cy - h / 2;
    s.moveTo(x + r, y); s.lineTo(x + w - r, y); s.quadraticCurveTo(x + w, y, x + w, y + r);
    s.lineTo(x + w, y + h - r); s.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    s.lineTo(x + r, y + h); s.quadraticCurveTo(x, y + h, x, y + h - r);
    s.lineTo(x, y + r); s.quadraticCurveTo(x, y, x + r, y);
    return s;
  }
  function tube(pts, r, mat, segs) {
    var curve = new T.CatmullRomCurve3(pts.map(function (p) { return new T.Vector3(p[0], p[1], p[2]); }));
    var m = new T.Mesh(new T.TubeGeometry(curve, segs || 64, r, 18, false), mat);
    m.userData.curve = curve;
    return m;
  }
  function cap(curve, t, r, mat) {          // a round end on a tube
    var m = new T.Mesh(new T.SphereGeometry(r, 18, 12), mat);
    m.position.copy(curve.getPoint(t));
    return m;
  }
  /* a turned handle with flutes: radius follows the profile up the handle, dipping into n grooves around it */
  function fluted(prof, n, depth, sharp, mat, from, to) {
    var rows = 46, cols = 120, pos = [], idx = [];
    var y0 = from != null ? from : prof[0][0], y1 = to != null ? to : prof[prof.length - 1][0];
    var R = function (y) {
      for (var k = 1; k < prof.length; k++) if (y <= prof[k][0]) { var a = prof[k - 1], b = prof[k], f = (y - a[0]) / (b[0] - a[0] || 1); return a[1] + (b[1] - a[1]) * f; }
      return prof[prof.length - 1][1];
    };
    var span = prof[prof.length - 1][0] - prof[0][0];
    for (var j = 0; j <= rows; j++) {
      var y = y0 + (y1 - y0) * j / rows, r0 = R(y);
      var win = Math.min(1, Math.max(0, Math.min(y - prof[0][0], prof[prof.length - 1][0] - y) / (span * 0.12)));
      for (var i = 0; i <= cols; i++) {
        var th = i / cols * Math.PI * 2;
        var g = Math.pow(Math.max(0, Math.cos(n * th)), sharp);
        var r = r0 * (1 - depth * g * win);
        pos.push(Math.cos(th) * r, y, Math.sin(th) * r);
      }
    }
    for (j = 0; j < rows; j++) for (i = 0; i < cols; i++) {
      var a = j * (cols + 1) + i, b = a + cols + 1;
      idx.push(a, b, a + 1, b, b + 1, a + 1);
    }
    var geo = new T.BufferGeometry();
    geo.setAttribute('position', new T.Float32BufferAttribute(pos, 3));
    geo.setIndex(idx);
    geo.computeVertexNormals();
    var nn = geo.attributes.normal;            // close the seam
    for (j = 0; j <= rows; j++) {
      var s0 = j * (cols + 1), s1 = s0 + cols;
      var nx = nn.getX(s0) + nn.getX(s1), ny = nn.getY(s0) + nn.getY(s1), nz = nn.getZ(s0) + nn.getZ(s1), l = Math.sqrt(nx * nx + ny * ny + nz * nz) || 1;
      nn.setXYZ(s0, nx / l, ny / l, nz / l); nn.setXYZ(s1, nx / l, ny / l, nz / l);
    }
    return new T.Mesh(geo, mat);
  }

  var rig = new T.Group(); scene.add(rig);
  var stage = new T.Group(); rig.add(stage);
  var tools = {}, order = [];
  function tool(name) {
    var g = new T.Group(), inner = new T.Group();
    g.add(inner); stage.add(g);
    g.userData.inner = inner;
    tools[name] = g; order.push(name);
    return inner;
  }

  /* ---------- textures drawn once in the browser ---------- */
  function canvasTex(w, h, draw, rep) {
    var c = document.createElement('canvas'); c.width = w; c.height = h;
    draw(c.getContext('2d'), w, h);
    var t = new T.CanvasTexture(c);
    t.encoding = T.sRGBEncoding;
    t.anisotropy = Math.min(8, renderer.capabilities.getMaxAnisotropy());
    if (rep) { t.wrapS = t.wrapT = T.RepeatWrapping; }
    return t;
  }
  // warning tape: black and yellow bands with WARNING on them
  var RIB_LEN = 3.2;                       // how long one picture of the tape is, in the model
  var cautionTex = canvasTex(1024, 128, function (x, w, h) {
    x.fillStyle = '#f4f2ee'; x.fillRect(0, 0, w, h);
    x.fillStyle = '#e0261c';
    for (var k = -2; k < 18; k++) { x.beginPath(); x.moveTo(k * 64, h); x.lineTo(k * 64 + 32, h); x.lineTo(k * 64 + 32 + 60, 0); x.lineTo(k * 64 + 60, 0); x.closePath(); x.fill(); }
    x.fillStyle = 'rgba(255,255,255,.18)'; x.fillRect(0, 6, w, 3); x.fillRect(0, h - 9, w, 3);
  }, true);
  // hessian: open brown weave
  var hessianTex = canvasTex(256, 256, function (x, w, h) {
    x.fillStyle = '#6e5232'; x.fillRect(0, 0, w, h);
    for (var i = 0; i < w; i += 8) {
      for (var j = 0; j < h; j += 8) {
        var a = ((i + j) / 8) % 2 === 0, n = Math.random() * 18;
        x.fillStyle = 'rgb(' + (176 + n) + ',' + (138 + n) + ',' + (88 + n) + ')';
        if (a) x.fillRect(i, j + 1, 8, 5); else x.fillRect(i + 1, j, 5, 8);
      }
    }
  }, true);
  hessianTex.repeat.set(6, 3);
  var texLoader = new T.TextureLoader();
  function photoTex(file, rx, ry, colour, done) {
    texLoader.load(BASE + file, function (t) {
      if (colour) t.encoding = T.sRGBEncoding;
      t.wrapS = t.wrapT = T.RepeatWrapping; t.repeat.set(rx, ry);
      t.anisotropy = Math.min(8, renderer.capabilities.getMaxAnisotropy());
      done(t);
    });
  }
  // knitted glove with blue dots on the palm
  var knitTex = canvasTex(256, 256, function (x, w, h) {
    x.fillStyle = '#e9e8e2'; x.fillRect(0, 0, w, h);
    x.strokeStyle = 'rgba(0,0,0,.07)'; x.lineWidth = 2;
    for (var j = 0; j < h; j += 6) { x.beginPath(); x.moveTo(0, j); x.lineTo(w, j); x.stroke(); }
    x.fillStyle = '#1f5fd6';
    for (var a = 0; a < w; a += 22) for (var b = 0; b < h; b += 22) { x.beginPath(); x.arc(a + ((b / 22) % 2) * 11 + 6, b + 6, 4.6, 0, Math.PI * 2); x.fill(); }
  }, true);
  knitTex.repeat.set(2, 2);
  // the solar panel on top of the warning light
  var solarTex = canvasTex(256, 256, function (x, w, h) {
    x.fillStyle = '#0d1a33'; x.fillRect(0, 0, w, h);
    x.strokeStyle = '#7f93b8'; x.lineWidth = 3;
    for (var i = 0; i <= 4; i++) { x.beginPath(); x.moveTo(i * w / 4, 0); x.lineTo(i * w / 4, h); x.stroke(); x.beginPath(); x.moveTo(0, i * h / 4); x.lineTo(w, i * h / 4); x.stroke(); }
    x.strokeStyle = 'rgba(127,147,184,.35)'; x.lineWidth = 1;
    for (i = 0; i < w; i += 8) { x.beginPath(); x.moveTo(i, 0); x.lineTo(i, h); x.stroke(); }
  });

  var ringsTex = canvasTex(512, 512, function (x, w, h) {
    x.fillStyle = '#808080'; x.fillRect(0, 0, w, h);
    for (var r = 250; r > 8; r -= 9) {
      var g = x.createRadialGradient(w / 2, h / 2, r - 9, w / 2, h / 2, r);
      g.addColorStop(0, '#505050'); g.addColorStop(1, '#c8c8c8');
      x.fillStyle = g; x.beginPath(); x.arc(w / 2, h / 2, r, 0, Math.PI * 2); x.fill();
    }
  });
  var K = {
    cone: new T.MeshPhysicalMaterial({ color: srgb(0xe8341c), roughness: 0.38, clearcoat: 0.7, clearcoatRoughness: 0.22, sheen: 0 }),
    body: new T.MeshPhysicalMaterial({ color: srgb(0xff8a12), roughness: 0.32, clearcoat: 0.8, clearcoatRoughness: 0.18 }),
    lensA: new T.MeshPhysicalMaterial({ color: srgb(0xff9a00), emissive: srgb(0xff5a00), emissiveIntensity: 0.6, bumpMap: ringsTex, bumpScale: 0.05, roughness: 0.12, clearcoat: 1, clearcoatRoughness: 0.05 }),
    clear: new T.MeshPhysicalMaterial({ color: srgb(0xf4fbff), metalness: 0, roughness: 0.04, transparent: true, opacity: 0.22, clearcoat: 1, clearcoatRoughness: 0.02, side: T.DoubleSide, depthWrite: false }),
    clearEdge: new T.MeshPhysicalMaterial({ color: srgb(0xdfeaf5), roughness: 0.1, transparent: true, opacity: 0.65, clearcoat: 1 }),
    arm: new T.MeshPhysicalMaterial({ color: srgb(0xf26a10), roughness: 0.36, clearcoat: 0.6, clearcoatRoughness: 0.25 }),
    armDark: new T.MeshStandardMaterial({ color: srgb(0x2a2b2f), roughness: 0.5 }),
    reflect: new T.MeshStandardMaterial({ color: 0xf4f6f8, metalness: 0.6, roughness: 0.18, emissive: srgb(0x3a3d42) }),
    rubber: new T.MeshStandardMaterial({ color: srgb(0x18191c), roughness: 0.85 }),
    amber: new T.MeshPhysicalMaterial({ color: srgb(0xffa21a), emissive: srgb(0xff7a00), emissiveIntensity: 1.2, roughness: 0.15, clearcoat: 1, side: T.DoubleSide }),
    bulb: new T.MeshBasicMaterial({ color: srgb(0xfff1c2) }),
    solar: new T.MeshStandardMaterial({ map: solarTex, metalness: 0.4, roughness: 0.22 }),
    ribbon: new T.MeshStandardMaterial({ map: cautionTex, roughness: 0.5, side: T.DoubleSide }),
    hessian: new T.MeshStandardMaterial({ map: hessianTex, roughness: 0.95, side: T.DoubleSide }),
    wood: new T.MeshStandardMaterial({ color: srgb(0xb9824a), roughness: 0.55 }),
    blade: new T.MeshPhysicalMaterial({ color: srgb(0x8a9099), metalness: 0.85, roughness: 0.3, clearcoat: 0.4 }),
    knit: new T.MeshStandardMaterial({ map: knitTex, roughness: 0.9 }),
    cuff: new T.MeshStandardMaterial({ color: srgb(0x1f5fd6), roughness: 0.8 }),
    lens: new T.MeshPhysicalMaterial({ color: srgb(0xd8f0ff), metalness: 0, roughness: 0.05, transmission: 0, transparent: true, opacity: 0.35, clearcoat: 1 }),
    frame: new T.MeshPhysicalMaterial({ color: srgb(0x1e2a3a), roughness: 0.35, clearcoat: 0.6, transparent: true, opacity: 0.85 }),
    strap: new T.MeshStandardMaterial({ color: srgb(0xf06c12), roughness: 0.7 })
  };

  /* ---------- traffic cone: tall red cone, one wide white reflective sleeve, heavy black eight-sided base (like BAM's) ---------- */
  var cone = tool('cone');
  (function (s) {
    var base = new T.Mesh(new T.CylinderGeometry(0.98, 1.06, 0.2, 8, 1), K.rubber); base.rotation.y = Math.PI / 8; base.position.y = -1.36; s.add(base);
    var lip = new T.Mesh(new T.CylinderGeometry(0.7, 0.86, 0.12, 8, 1), K.rubber); lip.rotation.y = Math.PI / 8; lip.position.y = -1.21; s.add(lip);
    var H = 2.95, r0 = 0.6, r1 = 0.1, y0 = -1.18;
    var R = function (y) { return r0 + (r1 - r0) * (y - y0) / H; };
    s.add(lathe([[0, y0], [r0 + 0.03, y0], [r0, y0 + 0.06], [r1, y0 + H], [r1 - 0.012, y0 + H + 0.03], [0.07, y0 + H + 0.035], [0.07, y0 + H - 0.2], [0, y0 + H - 0.2]], 72, K.cone));
    var a = y0 + 1.0, c = y0 + 1.72;
    s.add(lathe([[R(a) + 0.006, a - 0.004], [R(a) + 0.014, a], [R(c) + 0.014, c], [R(c) + 0.006, c + 0.004]], 72, K.reflect));
    s.position.y = 0.05;
  })(cone);

  /* ---------- solar warning light: round amber lens that flashes, orange body, carry hoop and solar cell on top, on its cone mount ---------- */
  var light = tool('light');
  var lens, glow;
  (function (s) {
    var body = new T.Mesh(new T.CylinderGeometry(0.66, 0.66, 0.34, 72), K.body); body.rotation.x = Math.PI / 2; body.position.y = 0.2; s.add(body);
    var bezel = new T.Mesh(new T.TorusGeometry(0.62, 0.055, 16, 72), K.body); bezel.position.set(0, 0.2, 0.17); s.add(bezel);
    lens = lathe([[0, 0], [0.6, 0], [0.57, 0.06], [0.45, 0.11], [0, 0.13]], 72, K.lensA);
    lens.rotation.x = Math.PI / 2; lens.position.set(0, 0.2, 0.16); s.add(lens);
    var led = new T.Mesh(new T.SphereGeometry(0.1, 24, 16), K.bulb); led.position.set(0, 0.2, 0.26); led.scale.z = 0.5; s.add(led);
    var cell = new T.Mesh(new T.BoxGeometry(0.42, 0.04, 0.26), K.solar); cell.position.set(0, 0.88, 0.0); cell.rotation.x = 0.25; s.add(cell);
    var cellBox = new T.Mesh(new T.BoxGeometry(0.48, 0.1, 0.3), K.rubber); cellBox.position.set(0, 0.84, -0.02); cellBox.rotation.x = 0.25; s.add(cellBox);
    var hoop = new T.Mesh(new T.TorusGeometry(0.36, 0.035, 12, 48, Math.PI), M.satin); hoop.position.set(0, 0.92, -0.02); s.add(hoop);
    [-1, 1].forEach(function (x) { var p = new T.Mesh(new T.CylinderGeometry(0.06, 0.06, 0.12, 16), M.satin); p.rotation.z = Math.PI / 2; p.position.set(x * 0.36, 0.92, -0.02); s.add(p); });
    var mount = lathe([[0, -0.2], [0.13, -0.2], [0.16, -0.32], [0.36, -1.3], [0.42, -1.36], [0, -1.36]], 48, K.body); s.add(mount);
    var foot = new T.Mesh(new T.CylinderGeometry(0.44, 0.46, 0.06, 48), K.rubber); foot.position.y = -1.38; s.add(foot);
    glow = new T.PointLight(0xff8a1a, 0, 5); glow.position.set(0, 0.2, 0.9); s.add(glow);
    s.position.y = 0.3;
  })(light);

  /* ---------- warning tape: a roll seen from the front, and the tape hangs off it and pulls out as you scroll ---------- */
  var cautionTexV = canvasTex(128, 1024, function (x, w, h) {   // the same tape, standing up
    x.translate(w, 0); x.rotate(Math.PI / 2); x.drawImage(cautionTex.image, 0, 0);
  }, true);
  var tape = tool('tape');
  var ribbon, ribL = 0.6;
  (function (s) {
    var rm = K.ribbon.clone(); rm.map = cautionTex.clone(); rm.map.needsUpdate = true; rm.map.repeat.set(1.2, 1); rm.side = T.FrontSide;
    var roll = new T.Mesh(new T.CylinderGeometry(0.62, 0.62, 0.5, 64, 1, true), rm); roll.rotation.z = Math.PI / 2; s.add(roll);
    var sideM = new T.MeshStandardMaterial({ color: srgb(0xe9e6e0), roughness: 0.55, side: T.DoubleSide });
    [-1, 1].forEach(function (x) { var r = new T.Mesh(new T.RingGeometry(0.26, 0.62, 64), sideM); r.rotation.y = Math.PI / 2; r.position.x = x * 0.25; s.add(r); });
    var core = new T.Mesh(new T.CylinderGeometry(0.26, 0.26, 0.52, 40, 1, true), new T.MeshStandardMaterial({ color: srgb(0xc9a77a), roughness: 0.9, side: T.DoubleSide }));
    core.rotation.z = Math.PI / 2; s.add(core);
    // the loose end hangs from the front of the roll: a strip from y = 0 down to -1, stretched to its length every frame
    var g = new T.PlaneGeometry(0.48, 1, 1, 8); g.translate(0, -0.5, 0);
    var bm = K.ribbon.clone(); bm.map = cautionTexV;
    ribbon = new T.Mesh(g, bm); ribbon.position.set(0, 0, 0.625); s.add(ribbon);
  })(tape);

  /* ---------- pan shovel: dark steel blade, oak handle with a D grip ---------- */
  var shovel = tool('shovel');
  (function (s) {
    var b = new T.Shape();
    b.moveTo(-0.62, 0.5); b.lineTo(0.62, 0.5); b.quadraticCurveTo(0.7, -0.6, 0.0, -1.15); b.quadraticCurveTo(-0.7, -0.6, -0.62, 0.5);
    var bl = ext(b, 0.06, 0.02, K.blade, 2, 24); bl.position.y = -1.9; bl.rotation.x = 0.18; s.add(bl);
    var sock = lathe([[0, -1.25], [0.2, -1.25], [0.11, -0.7], [0, -0.7]], 32, K.blade); sock.position.y = -0.1; s.add(sock);
    var shaft = new T.Mesh(new T.CylinderGeometry(0.075, 0.085, 3.0, 24), K.wood); shaft.position.y = 0.6; s.add(shaft);
    var d = tube([[-0.06, 2.0, 0], [-0.3, 2.25, 0], [-0.3, 2.65, 0], [0, 2.78, 0], [0.3, 2.65, 0], [0.3, 2.25, 0], [0.06, 2.0, 0]], 0.06, K.blade, 60); s.add(d);
    var grip = new T.Mesh(new T.CylinderGeometry(0.075, 0.075, 0.56, 20), K.wood); grip.rotation.z = Math.PI / 2; grip.position.y = 2.68; s.add(grip);
    s.position.y = -0.3;
    photoTex('oak_diff.jpg', 1, 3, true, function (t) { K.wood.map = t; K.wood.color.set(0xffffff); K.wood.roughness = 0.5; K.wood.needsUpdate = true; });
  })(shovel);

  /* ---------- hessian cloth: a roll with a length hanging off it ---------- */
  var hessian = tool('hessian');
  var flap;
  (function (s) {
    var roll = new T.Mesh(new T.CylinderGeometry(0.55, 0.55, 2.3, 48), K.hessian.clone()); roll.rotation.z = Math.PI / 2; s.add(roll);
    var ends = new T.MeshStandardMaterial({ color: srgb(0x9a7748), roughness: 0.95 });
    [-1, 1].forEach(function (x) { var e = new T.Mesh(new T.CircleGeometry(0.55, 40), ends); e.rotation.y = x * Math.PI / 2; e.position.x = x * 1.151; s.add(e); });
    var fg = new T.PlaneGeometry(2.3, 1.4, 12, 10); fg.translate(0, -0.7, 0);
    var fm = K.hessian.clone(); fm.map = hessianTex.clone(); fm.map.needsUpdate = true; fm.map.repeat.set(6, 2);
    flap = new T.Mesh(fg, fm); flap.position.set(0, -0.0, 0.55); s.add(flap);
    flap.userData.base = fg.attributes.position.array.slice();
    var mats = [roll.material, fm];
    photoTex('hessian_diff.jpg', 3, 1.5, true, function (t) {
      mats.forEach(function (m, k) { var tt = k ? t.clone() : t; if (k) { tt.needsUpdate = true; tt.repeat.set(3, 1.6); } m.map = tt; m.color.set(0xf2e6d2); m.needsUpdate = true; });
      ends.map = t; ends.color.set(0xc9b493); ends.needsUpdate = true;
    });
    photoTex('hessian_nor.jpg', 3, 1.5, false, function (t) { mats.forEach(function (m) { m.normalMap = t; m.normalScale = new T.Vector2(0.9, 0.9); m.needsUpdate = true; }); });
  })(hessian);

  /* ---------- work gloves: a scanned pair of knitted gloves with a dipped palm (Poly Haven, CC0), recoloured white and grey like BAM's nitrile gloves.
     Until the file arrives (or if it can't load) a simple drawn glove stands in. ---------- */
  var glove = tool('gloves');
  var stand = new T.Group(); glove.add(stand);
  (function (s) {
    var palm = ext(rrect(1.05, 1.15, 0.38), 0.36, 0.14, K.knit, 4, 16); palm.position.y = -0.1; s.add(palm);
    var finger = function (x, y0, len, r, tilt) {
      var tp = [x + Math.sin(tilt) * len, y0 + Math.cos(tilt) * len, 0];
      var m = tube([[x, y0, 0], [(x + tp[0]) / 2, (y0 + tp[1]) / 2, 0.02], tp], r, K.knit, 16);
      s.add(m); s.add(cap(m.userData.curve, 1, r, K.knit));
    };
    finger(-0.36, 0.3, 0.72, 0.13, -0.08); finger(-0.12, 0.35, 0.86, 0.135, -0.02); finger(0.13, 0.35, 0.8, 0.135, 0.03); finger(0.37, 0.3, 0.62, 0.12, 0.1);
    var th = tube([[-0.42, -0.25, 0], [-0.72, 0.0, 0.05], [-0.86, 0.32, 0.05]], 0.14, K.knit, 16); s.add(th); s.add(cap(th.userData.curve, 1, 0.14, K.knit));
    var cuff = ext(rrect(1.12, 0.42, 0.16), 0.42, 0.12, K.cuff, 3, 12); cuff.position.y = -0.86; s.add(cuff);
    s.position.y = 0.1;
  })(stand);
  if (T.GLTFLoader) {
    new T.GLTFLoader().load(BASE + 'gloves.glb', function (gl) {
      var m = gl.scene;
      m.rotation.x = -Math.PI / 2;                // the scan lies flat on a table: stand it up, palms to you
      var holder = new T.Group(); holder.add(m);
      var box = new T.Box3().setFromObject(holder), size = box.getSize(new T.Vector3()), mid = box.getCenter(new T.Vector3());
      m.position.sub(mid);
      holder.scale.setScalar(2.7 / Math.max(size.x, size.y));
      m.traverse(function (o) { if (o.isMesh) { o.material.envMapIntensity = 0.85; o.material.side = T.DoubleSide; } });
      glove.remove(stand); glove.add(holder);
    });
  }

  /* ---------- safety glasses: one clear wrap-round lens and orange arms (like BAM's) ---------- */
  var goggles = tool('goggles');
  (function (s) {
    // the lens outline: two eyes joined over the nose
    var L = new T.Shape();
    L.moveTo(-1.18, 0.22);
    L.bezierCurveTo(-0.9, 0.36, -0.3, 0.34, 0, 0.3);
    L.bezierCurveTo(0.3, 0.34, 0.9, 0.36, 1.18, 0.22);
    L.bezierCurveTo(1.22, -0.05, 1.08, -0.42, 0.62, -0.44);
    L.bezierCurveTo(0.3, -0.45, 0.2, -0.3, 0.12, -0.12);
    L.quadraticCurveTo(0, 0.02, -0.12, -0.12);
    L.bezierCurveTo(-0.2, -0.3, -0.3, -0.45, -0.62, -0.44);
    L.bezierCurveTo(-1.08, -0.42, -1.22, -0.05, -1.18, 0.22);
    var wrap = function (geo, k) {          // bend the flat lens round the face
      var a = geo.attributes.position;
      for (var i = 0; i < a.count; i++) { var x = a.getX(i); a.setZ(i, a.getZ(i) - k * x * x); }
      geo.computeVertexNormals(); return geo;
    };
    var lg = new T.ExtrudeGeometry(L, { depth: 0.035, bevelEnabled: true, bevelThickness: 0.012, bevelSize: 0.012, bevelSegments: 2, curveSegments: 40 });
    lg.translate(0, 0, -0.02);
    s.add(new T.Mesh(wrap(lg, 0.32), K.clear));
    // a thin orange brow along the top of the lens
    var bp = []; for (var i = 0; i <= 24; i++) { var x = -1.16 + i * 2.32 / 24; bp.push([x, 0.24 + 0.1 * Math.cos(x * 1.35) - 0.02, -0.32 * x * x + 0.03]); }
    var brow = tube(bp, 0.035, K.arm, 80); brow.scale.y = 1.6; s.add(brow);
    // nose pads
    [-1, 1].forEach(function (x) { var n = new T.Mesh(new T.SphereGeometry(0.07, 16, 12), K.armDark); n.scale.set(0.6, 1.4, 0.8); n.position.set(x * 0.15, -0.16, -0.06); s.add(n); });
    // the arms: from the lens ends back over the ears
    [-1, 1].forEach(function (x) {
      var z0 = -0.32 * 1.18 * 1.18;
      var arm = tube([[x * 1.17, 0.18, z0], [x * 1.2, 0.17, z0 - 0.5], [x * 1.2, 0.13, z0 - 1.2], [x * 1.18, 0.0, z0 - 1.55], [x * 1.15, -0.2, z0 - 1.72]], 0.05, K.arm, 48);
      arm.scale.y = 1; s.add(arm);
      var hinge = new T.Mesh(new T.BoxGeometry(0.1, 0.16, 0.12), K.arm); hinge.position.set(x * 1.17, 0.18, z0 + 0.02); s.add(hinge);
    });
  })(goggles);

  /* where each name sits on the wall: a point beside the item (in wall units, from its middle), and which side of it the name goes */
  var anchors = [
    { id: 'cone', d: [0.0, 1.85], at: 'up' },
    { id: 'light', d: [0.0, 1.55], at: 'up' },
    { id: 'gloves', d: [0.0, 1.55], pd: [0.0, 1.3], at: 'up' },
    { id: 'shovel', d: [0.0, 3.0], at: 'up' },
    { id: 'tape', d: [0.0, 0.95], at: 'up' },
    { id: 'hessian', d: [0.0, 0.95], at: 'up' },
    { id: 'goggles', d: [0.0, 0.85], at: 'up' }
  ];

  /* ---------- where each item sits ---------- */
  var D = Math.PI / 180;
  var FAN = {}, PIV = [0, 0], RAD = 0;
  // the hero: the site kit grouped together, the cone in the middle, the tape unrolling in front
  var HERO = {
    shovel: { p: [1.55, 0.35, -1.4], r: [0.1, -0.3, -0.42], s: 0.9 },
    cone: { p: [-0.1, -0.05, 0.2], r: [0.18, 0.4, 0.04], s: 1.05 },
    light: { p: [-1.75, 1.55, -0.6], r: [0.12, 0.45, 0.1], s: 0.82 },
    hessian: { p: [-1.6, -1.45, -1.0], r: [0.35, 0.35, -0.08], s: 0.72 },
    gloves: { p: [1.55, -1.45, 0.9], r: [0.2, -0.45, -0.35], s: 0.82 },
    goggles: { p: [0.5, 1.95, 0.6], r: [0.3, -0.35, 0.12], s: 0.62 },
    tape: { p: [-0.4, -1.95, 1.6], r: [0.3, -0.25, 0.0], s: 0.78 }
  };
  // "Every tool": on the wall in two rows, the shovel standing at the end
  var WALL = {
    cone: { p: [-2.75, 1.45, 0], r: [0.12, 0.3, 0], s: 0.82 },
    light: { p: [-0.85, 1.75, 0], r: [0.08, 0.2, 0], s: 0.85 },
    gloves: { p: [1.0, 1.7, 0], r: [0.08, -0.25, 0], s: 0.85 },
    tape: { p: [-2.7, -2.15, 0], r: [0.2, -0.35, 0], s: 0.95 },
    hessian: { p: [-0.75, -2.05, 0], r: [0.35, 0.2, 0], s: 0.68 },
    goggles: { p: [1.05, -2.0, 0], r: [0.25, -0.3, 0], s: 0.7 },
    shovel: { p: [2.85, -0.15, 0], r: [0.08, -0.35, 0.0], s: 0.9 }
  };
  // on a phone the wall is narrow and tall: three rows, every name above its item
  var WALL_PHONE = {
    cone: { p: [-1.75, 3.6, 0], s: 0.72 }, light: { p: [0.45, 3.7, 0], s: 0.76 },
    gloves: { p: [-1.75, -0.05, 0], s: 0.8 }, goggles: { p: [0.45, -0.25, 0], s: 0.66 },
    tape: { p: [-1.75, -3.15, 0], s: 0.9 }, hessian: { p: [0.45, -3.1, 0], s: 0.6 },
    shovel: { p: [2.35, -0.1, 0], s: 0.82 }
  };
  var START = {      // where they fly in from when the page opens
    cone: [0, -8, 1], light: [-6, 6, -1], shovel: [7, 5, -2], hessian: [-7, -5, -1], gloves: [6, -6, 2], goggles: [2, 8, 1], tape: [-3, -9, 3]
  };

  var st = { hero: 0, heroPx: 0, ana: 0, appr: 0, exit: 0, intro: 0, mx: 0, my: 0, tx: 0, ty: 0, t: 0 };
  function layout() {
    var w = canvas.clientWidth || innerWidth, h = canvas.clientHeight || innerHeight;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  }
  addEventListener('resize', layout);
  layout();

  var lerp = function (a, b, k) { return a + (b - a) * k; };
  var clamp01 = function (x) { return Math.max(0, Math.min(1, x)); };
  var ease = function (x) { x = clamp01(x); return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2; };
  var out = function (x) { x = clamp01(x); return 1 - Math.pow(1 - x, 3); };
  var back = function (x) { x = clamp01(x); var c = 1.4; return 1 + (c + 1) * Math.pow(x - 1, 3) + c * Math.pow(x - 1, 2); };
  var qa = new T.Quaternion(), qb = new T.Quaternion(), ea = new T.Euler(), v3 = new T.Vector3();

  function pose(dt) {
    st.mx += (st.tx - st.mx) * Math.min(1, dt * 3);
    st.my += (st.ty - st.my) * Math.min(1, dt * 3);
    var w = camera.aspect, phone = w < 0.9, rtl = document.documentElement.dir === 'rtl';
    var h = st.hero, i0 = st.intro, t = st.t;
    var ar = ease(Math.max(st.appr, Math.min(1, st.ana * 2.6)));   // the cluster moves to "Every tool"
    var a = clamp01((st.ana - 0.22) / 0.7);                       // then the tools go onto the wall
    var visW = 2 * camera.position.z * Math.tan(camera.fov * Math.PI / 360) * w;
    var side = rtl ? -1 : 1;
    var visH = visW / w, cH = canvas.clientHeight || innerHeight;
    var sc = Math.min(1.02, 0.6 + w * 0.26), heroX = side * visW * 0.22, heroY = 0.1;
    if (phone) {   // the fan fits the space the page leaves above the title, under the header
      var top = 78, room = Math.min(innerWidth * 0.92, 470);
      sc = Math.min(0.6, (room - top + 24) / cH * visH / 5.9, visW / 5.6);
      heroX = 0; heroY = visH / 2 - (top + room) / 2 / cH * visH + 0.2 * sc;
    }
    var anaX = phone ? 0 : side * visW * 0.2, anaY = phone ? -1.7 : -0.3;
    var asc = phone ? Math.min(0.5, visW / 7.4) : Math.min(0.84, 0.58 + w * 0.16);
    var rise = phone && st.heroPx ? st.heroPx / (canvas.clientHeight || innerHeight) * visW / w : 3.2;
    rig.position.set(lerp(heroX, anaX, ar), lerp(heroY + h * rise, anaY, ar), 0);
    rig.position.y += st.exit * visW / w;
    rig.scale.setScalar(lerp(sc, asc, ar));
    // the whole group turns slowly as you scroll and follows the mouse
    stage.rotation.set(
      lerp(0.08 + Math.sin(t * 0.4) * 0.03, 0, ar) + st.my * 0.12 * (1 - a * 0.5),
      lerp(-0.18 * side + h * 0.55 * side + Math.sin(t * 0.3) * 0.05, 0, ar) + st.mx * 0.25 * (1 - a * 0.5),
      0);
    stage.position.y = lerp(-0.1, 0, ar);
    var spread = 1 + h * 0.4 + Math.sin(t * 0.5) * 0.03;    // the fan opens as you scroll, and breathes
    order.forEach(function (name, k) {
      var g = tools[name], Wl = WALL[name], F = FAN[name], H = HERO[name];
      if (phone) Wl = { p: WALL_PHONE[name].p, r: Wl.r, s: WALL_PHONE[name].s || Wl.s };
      if (F) {      // its place in the fan: out from the handles along its angle
        var an = F.a * D * spread;
        H = { p: [PIV[0] - Math.sin(an) * RAD, PIV[1] + Math.cos(an) * RAD, F.z], r: [0.12, F.ry, an + (F.flip ? Math.PI : 0)], s: F.s };
      }
      var hx = H.p[0] * side, hy = H.p[1], hz = H.p[2];
      // floating, each in its own time
      var bob = Math.sin(t * 0.9 + k * 1.7) * 0.07, sway = Math.sin(t * 0.7 + k * 2.3) * 0.035;
      // the intro: each flies in from its corner, a little after the one before
      var ik = back((i0 * 1.6 - k * 0.09));
      var S = START[name];
      var hp = [lerp(S[0], hx, ik), lerp(S[1], hy, ik) + bob, lerp(S[2], hz, ik)];
      var hrz = H.r[2] * (rtl ? -1 : 1) + sway + (1 - ik) * 1.5;
      var hry = H.r[1] * side;
      // on the wall: the order they arrive in, and the gentle swing of a tool on a hook
      var ak = ease((a - k * 0.045) / 0.73);
      var wx = Wl.p[0] * side, wy = Wl.p[1] + Math.sin(t * 0.8 + k) * 0.02 * ak, wz = Wl.p[2];
      g.position.set(lerp(hp[0], wx, ak), lerp(hp[1], wy, ak) + Math.sin(ak * Math.PI) * 0.6, lerp(hp[2], wz, ak) + Math.sin(ak * Math.PI) * 1.4);
      var wry = Wl.r[1] * side;
      qa.setFromEuler(ea.set(H.r[0] + (1 - ik) * 1.2, hry, hrz));
      qb.setFromEuler(ea.set(Wl.r[0], wry, Wl.r[2] + Math.sin(t * 0.8 + k * 1.3) * 0.025));
      g.quaternion.copy(qa).slerp(qb, ak);
      g.scale.setScalar(Math.max(0.001, lerp(H.s, Wl.s, ak)));
    });
    // the warning tape pulls off its roll as you scroll the hero, and rolls back up on the wall
    var tl = lerp(lerp(0.7, 3.0, ease(h * 2.2)) + Math.sin(t * 0.6) * 0.04, 0.55, ease(a * 1.4));
    ribL = Math.max(0.08, tl * (0.35 + 0.65 * out(i0 * 1.4 - 0.35)));
    ribbon.scale.y = ribL;
    ribbon.material.map.repeat.y = ribL / RIB_LEN;
    ribbon.rotation.x = Math.sin(t * 0.9) * 0.08 + 0.1;
    tools.tape.userData.inner.rotation.x = -ribL * 0.4;   // the roll turns as the tape comes off
    // the warning light flashes
    var fl = Math.pow(Math.max(0, Math.sin(t * 4.2)), 6);
    K.lensA.emissiveIntensity = 0.45 + fl * 2.6;
    glow.intensity = fl * 2.2;
    // the hessian flap moves a little in the air
    flap.rotation.x = Math.sin(t * 1.1) * 0.07 - 0.05;
  }

  /* the names in "Every tool" follow their tools */
  var v = new T.Vector3();
  function placeLabels() {
    var L = api.labels;
    if (!L) return;
    var rect = canvas.getBoundingClientRect(), box = null, ox = 0, oy = 0;
    anchors.forEach(function (an) {
      var el = L[an.id];
      if (!el) return;
      if (!box) { box = el.parentNode.getBoundingClientRect(); ox = rect.left - box.left; oy = rect.top - box.top; }
      var g = tools[an.id], side = document.documentElement.dir === 'rtl' ? -1 : 1, d = phoneLabels && an.pd ? an.pd : an.d;
      v.set(g.position.x + d[0] * side, g.position.y + d[1], g.position.z + 0.3);
      stage.localToWorld(v);
      v.project(camera);
      var x = ox + (v.x * 0.5 + 0.5) * rect.width, y = oy + (-v.y * 0.5 + 0.5) * rect.height;
      el.style.transform = 'translate3d(' + x.toFixed(1) + 'px,' + y.toFixed(1) + 'px,0)';
    });
  }

  var last = performance.now(), visible = true, running = true;
  function frame(now) {
    if (!running) return;
    requestAnimationFrame(frame);
    var raw = (now - last) / 1000, dt = Math.min(0.05, raw); last = now;
    if (!visible) return;
    st.t += dt;
    if (st.intro < 1) st.intro = Math.min(1, st.intro + Math.min(0.2, raw) / 2.4);   // real time, so a slow phone still finishes it
    pose(dt);
    renderer.render(scene, camera);
    if (st.ana > 0.01) placeLabels();
  }

  api.hero = function (p, px) { st.hero = p; if (px) st.heroPx = px; };
  api.anatomy = function (p) { st.ana = p; };
  api.approach = function (p) { st.appr = p; };
  api.exit = function (p) { st.exit = p; };
  api.show = function (on) { visible = on; canvas.style.visibility = on ? 'visible' : 'hidden'; if (on) last = performance.now(); };
  api.pointer = function (x, y) { st.tx = x; st.ty = y; };
  api.skipIntro = function () { st.intro = 1; };
  var phoneLabels = null;
  function labelSides() {
    var map = api.labels, ph = camera.aspect < 0.9, rtl = document.documentElement.dir === 'rtl';
    if (!map || ph === phoneLabels) return;
    phoneLabels = ph;
    anchors.forEach(function (an) {
      var el = map[an.id];
      if (!el) return;
      el.classList.remove('flabel--up', 'flabel--left', 'flabel--right');
      el.classList.add('flabel--' + (an.at === 'up' || (ph && an.pd) ? 'up' : (an.at === 'out') !== rtl ? 'left' : 'right'));
    });
  }
  addEventListener('resize', labelSides);
  api.setLabels = function (map) { api.labels = map; phoneLabels = null; labelSides(); };
  api.ready = true;
  requestAnimationFrame(frame);
  document.documentElement.classList.add('has-gl');
  if (window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches) st.intro = 1;
  addEventListener('pointermove', function (e) { if (e.pointerType === 'mouse') { st.tx = e.clientX / innerWidth * 2 - 1; st.ty = e.clientY / innerHeight * 2 - 1; } }, { passive: true });
  document.addEventListener('visibilitychange', function () { if (!document.hidden) last = performance.now(); });
})();
