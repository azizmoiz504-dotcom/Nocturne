/* Bait Al Maqdis website: the 3D safety and site items, all drawn in the browser (no model or picture files).
   A traffic cone, a solar warning light, a roll of barrier tape, a pan shovel, a roll of hessian cloth,
   a pair of dipped work gloves and safety glasses float together in the hero; scrolling pulls the tape off its roll.
   Each is shaped after BAM's own product photos. The weave, the wood grain, the knit and the reflective prisms are
   painted on small canvases when the page opens, with a relief map so the light catches them; the gloves are one
   smooth skin found on a fine grid from overlapping rounded pieces.
   In "Site safety" they fly onto the wall, each with its name. Without 3D (old phone, graphics off)
   the page shows the flat picture instead. */
(function () {
  'use strict';
  var canvas = document.getElementById('gl');
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
  var DPR = Math.min(window.devicePixelRatio || 1, small() ? 1.35 : 1.5);
  renderer.setPixelRatio(DPR);
  renderer.outputEncoding = T.sRGBEncoding;
  renderer.toneMapping = T.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.1;
  renderer.setClearColor(0x000000, 0);

  var scene = new T.Scene();
  var camera = new T.PerspectiveCamera(28, 1, 0.1, 100);
  camera.position.set(0, 0, 17);

  /* a studio made of glowing panels, so the metal and the plastic have something to reflect */
  (function () {
    var s = new T.Scene();
    s.add(new T.Mesh(new T.BoxGeometry(40, 40, 40), new T.MeshBasicMaterial({ color: 0x8fa8d6, side: T.BackSide })));
    var panel = function (c, k, w, h, x, y, z) {
      var m = new T.Mesh(new T.PlaneGeometry(w, h), new T.MeshBasicMaterial({ color: new T.Color(c).multiplyScalar(k * 0.55), side: T.DoubleSide }));
      m.position.set(x, y, z); m.lookAt(0, 0, 0); s.add(m);
    };
    panel(0xffffff, 5.2, 14, 3.5, 0, 13, 4);      // long soft box overhead
    panel(0xe8eeff, 2.6, 3, 14, -14, 1, 5);       // strip on the left
    panel(0xffffff, 3.6, 3, 14, 14, 2, -2);       // strip on the right
    panel(0x2f6dff, 4.4, 16, 2.4, 0, -11, -6);    // blue floor glow
    panel(0x5b8cff, 1.8, 4, 10, 10, -3, -12);
    panel(0x8fa6c8, 0.9, 16, 8, 0, 3, -15);
    panel(0xffffff, 2.0, 12, 10, 0, 1, 15);       // soft light from the front, so faces turned to you shine
    var pm = new T.PMREMGenerator(renderer);
    scene.environment = pm.fromScene(s, 0.03).texture;
    pm.dispose();
  })();
  var key = new T.DirectionalLight(0xfff8f0, 2.1); key.position.set(4, 9, 7);
  key.castShadow = false;
  key.shadow.mapSize.set(small() ? 1024 : 2048, small() ? 1024 : 2048);
  key.shadow.camera.left = key.shadow.camera.bottom = -6; key.shadow.camera.right = key.shadow.camera.top = 6;
  key.shadow.camera.near = 1; key.shadow.camera.far = 30; key.shadow.bias = -0.0012; key.shadow.normalBias = 0.045; key.shadow.radius = 4;
  var rim = new T.DirectionalLight(0x6f9bff, 0.9); rim.position.set(-7, -3, -6); scene.add(rim);
  var fill = new T.DirectionalLight(0xdfe6ff, 0.45); fill.position.set(-6, 2, 8); scene.add(fill);
  scene.add(new T.HemisphereLight(0xf2f6ff, 0x5d6f9e, 0.4));

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
  function tube(pts, r, mat, segs, closed) {
    var curve = new T.CatmullRomCurve3(pts.map(function (p) { return new T.Vector3(p[0], p[1], p[2]); }), !!closed);
    var m = new T.Mesh(new T.TubeGeometry(curve, segs || 64, r, 18, !!closed), mat);
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
  rig.add(key); rig.add(key.target);   // the key light and its shadows travel with the group
  var stage = new T.Group(); rig.add(stage);
  var tools = {}, order = [];
  function tool(name) {
    var g = new T.Group(), inner = new T.Group();
    g.add(inner); stage.add(g);
    g.userData.inner = inner;
    tools[name] = g; order.push(name);
    return inner;
  }

  var MAXANI = Math.min(8, renderer.capabilities.getMaxAnisotropy());
  function canvasTex(w, h, draw, rep, linear) {
    var c = document.createElement('canvas'); c.width = w; c.height = h;
    draw(c.getContext('2d'), w, h);
    var t = new T.CanvasTexture(c);
    if (!linear) t.encoding = T.sRGBEncoding;
    t.anisotropy = MAXANI;
    if (rep) { t.wrapS = t.wrapT = T.RepeatWrapping; }
    return t;
  }

  /* ---------- the tools: real products, photo-scanned (Poly Haven, CC0), loaded from assets/models ----------
     Each is turned so its long side stands upright and its flat side faces you, then sized to LEN (its long side, in scene units). */
  var BASE = ((document.currentScript && document.currentScript.src) || '').replace(/[^\/]*$/, '') + 'models/';
  var LEN = { ratchet: 2.3, pliers: 2.0, spanner: 2.5, pumppliers: 2.4, sledge: 3.3, claw: 2.6, tape: 1.5 };
  var loaded = 0;
  ['ratchet', 'pliers', 'spanner', 'pumppliers', 'sledge', 'claw', 'tape'].forEach(function (name) {
    var inner = tool(name);
    if (!T.GLTFLoader) return;
    new T.GLTFLoader().load(BASE + name + '.glb', function (gl) {
      var o = gl.scene;
      o.traverse(function (m) {
        if (!m.isMesh) return;
        var mt = m.material;
        if (mt.map) mt.map.anisotropy = MAXANI;
        mt.envMapIntensity = 1.0;
      });
      // stand it up: longest side to y, middle side to x, thinnest to z (towards you)
      var box = new T.Box3().setFromObject(o), sz = box.getSize(new T.Vector3()), v = [sz.x, sz.y, sz.z];
      var ix = [0, 1, 2].sort(function (p, q) { return v[q] - v[p]; });
      var e = function (i) { return new T.Vector3(i === 0 ? 1 : 0, i === 1 ? 1 : 0, i === 2 ? 1 : 0); };
      var rx = e(ix[1]), ry = e(ix[0]), rz = new T.Vector3().crossVectors(rx, ry);
      var m4 = new T.Matrix4().set(rx.x, rx.y, rx.z, 0, ry.x, ry.y, ry.z, 0, rz.x, rz.y, rz.z, 0, 0, 0, 0, 1);
      var hold = new T.Group(); hold.add(o);
      o.applyMatrix4(m4);
      box.setFromObject(hold);
      var c = box.getCenter(new T.Vector3()), k = LEN[name] / Math.max(v[ix[0]], 1e-6);
      o.position.sub(c);
      hold.scale.setScalar(k);
      if (FLIP[name]) hold.rotation.set(FLIP[name][0], FLIP[name][1], FLIP[name][2]);
      inner.add(hold);
      if (++loaded === 7) document.documentElement.classList.add('gl-models');
    });
  });
  var FLIP = { };   // per model, if one comes in upside down or back to front: [x, y, z] turns

  var floor = new T.Mesh(new T.PlaneGeometry(12, 12), new T.ShadowMaterial({ opacity: 0.45 }));
  floor.rotation.x = -Math.PI / 2; floor.position.y = -2.25; floor.receiveShadow = true; rig.add(floor);
  var blobTex = canvasTex(256, 256, function (x, w, h) {
    var g = x.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, w / 2);
    g.addColorStop(0, 'rgba(0,0,0,.55)'); g.addColorStop(0.5, 'rgba(0,0,0,.22)'); g.addColorStop(1, 'rgba(0,0,0,0)');
    x.fillStyle = g; x.fillRect(0, 0, w, h);
  });
  var blob = new T.Mesh(new T.PlaneGeometry(4.2, 4.2), new T.MeshBasicMaterial({ map: blobTex, transparent: true, depthWrite: false }));
  blob.rotation.x = -Math.PI / 2; blob.position.y = -2.24; rig.add(blob);
  // every solid part throws and catches shadow; the clear lens only catches it
  stage.traverse(function (o) { if (o.isMesh) { var tr = o.material && o.material.transparent; o.castShadow = !tr; o.receiveShadow = true; } });

  /* where each name sits on the wall: a point beside the item (in wall units, from its middle), and which side of it the name goes */
  var anchors = [
    { id: 'ratchet', d: [0.0, 1.4], at: 'up' },
    { id: 'pliers', d: [0.0, 1.25], at: 'up' },
    { id: 'pumppliers', d: [0.0, 1.4], at: 'up' },
    { id: 'sledge', d: [0.0, 2.0], at: 'up' },
    { id: 'spanner', d: [0.0, 0.6], pd: [0.0, 0.6], at: 'up' },
    { id: 'tape', d: [0.0, 1.05], at: 'up' },
    { id: 'claw', d: [0.0, 1.4], at: 'up' }
  ];

  /* ---------- where each item sits ---------- */
  var D = Math.PI / 180;
  var FAN = {}, PIV = [0, 0], RAD = 0;
  // the hero: the site kit grouped together, the cone in the middle, the tape unrolling in front
  var HERO = {
    sledge: { p: [1.85, 0.3, -1.3], r: [0.1, 0.25, -0.42], s: 1.08 },
    claw: { p: [-1.55, 0.8, -0.6], r: [0.1, -0.25, 0.45], s: 1.08 },
    ratchet: { p: [0.1, 1.1, 0.35], r: [0.15, 0.2, -0.15], s: 1.08 },
    spanner: { p: [0.8, -1.05, 0.9], r: [0.25, 0.15, -1.15], s: 1.08 },
    pliers: { p: [-0.5, -0.8, 1.1], r: [0.2, -0.15, 0.35], s: 1.08 },
    pumppliers: { p: [-2.1, -1.4, 0.1], r: [0.2, 0.2, 0.85], s: 1.08 },
    tape: { p: [0.75, -2.25, 1.6], r: [0.25, 0.1, 0.1], s: 1.08 }
  };
  // "Every tool": on the wall in two rows, the shovel standing at the end
  var WALL = {
    ratchet: { p: [-2.75, 1.95, 0], r: [0.1, 0.2, 0], s: 0.95 },
    pliers: { p: [-0.85, 1.95, 0], r: [0.1, -0.2, 0], s: 0.95 },
    pumppliers: { p: [1.0, 1.95, 0], r: [0.1, 0.2, 0], s: 0.9 },
    spanner: { p: [-2.7, -2.2, 0], r: [0.15, 0.2, -1.35], s: 0.9 },
    tape: { p: [-0.75, -2.3, 0], r: [0.2, -0.2, 0], s: 1.05 },
    claw: { p: [1.05, -2.15, 0], r: [0.1, 0.3, 0], s: 0.85 },
    sledge: { p: [2.85, -0.15, 0], r: [0.08, -0.3, 0.0], s: 1.0 }
  };
  // on a phone the wall is narrow and tall: three rows, every name above its item
  var WALL_PHONE = {
    ratchet: { p: [-1.75, 3.6, 0], s: 1.0 }, pliers: { p: [0.45, 3.6, 0], s: 1.0 },
    pumppliers: { p: [-1.75, -0.05, 0], s: 0.95 }, claw: { p: [0.45, -0.05, 0], s: 0.95 },
    spanner: { p: [-1.75, -3.15, 0], s: 0.95 }, tape: { p: [0.45, -3.1, 0], s: 1.25 },
    sledge: { p: [2.35, -0.1, 0], s: 1.0 }
  };
  // the showcase: in the hero one item at a time, big, turning slowly in the studio light; the next one slides in every few seconds
  var SHOW = false, SHOW_EVERY = 4.6;
  var SHOW_S = { ratchet: 1.4, pliers: 1.4, spanner: 1.3, pumppliers: 1.3, sledge: 1.0, claw: 1.2, tape: 2.2 };
  // tilt towards you, the three-quarter turn it rests at, and its lean
  var SHOW_R = { ratchet: [0.2, 0.5, 0], pliers: [0.2, 0.4, 0], spanner: [0.2, 0.4, -0.6], pumppliers: [0.2, 0.4, 0.3], sledge: [0.15, 0.5, -0.4], claw: [0.15, 0.5, 0.3], tape: [0.3, 0.6, 0] };
  var SHOW_Y = { ratchet: 0.2, pliers: 0.2, spanner: 0.2, pumppliers: 0.2, sledge: 0.3, claw: 0.3, tape: 0.2 };
  var capEls = {}, capBar = null, capOn = null;
  (function () {
    var box = document.querySelector('.showcap');
    if (!box) return;
    Array.prototype.forEach.call(box.querySelectorAll('[data-cap]'), function (el) { capEls[el.getAttribute('data-cap')] = el; });
    capBar = box.querySelector('.showcap__bar i');
  })();
  function caption(id, i, n, f) {
    if (capOn !== id) {
      if (capEls[capOn]) capEls[capOn].classList.remove('is-on');
      var el = capEls[id];
      if (el) { el.classList.add('is-on'); el.querySelector('small').textContent = ('0' + (i + 1)).slice(-2) + ' / ' + ('0' + n).slice(-2); }
      capOn = id;
    }
    if (capBar) capBar.style.transform = 'scaleX(' + f.toFixed(3) + ')';
  }
  var START = {      // where they fly in from when the page opens
    ratchet: [0, 8, 1], pliers: [-6, -6, -1], sledge: [7, 5, -2], claw: [-7, 5, -1], spanner: [6, -6, 2], pumppliers: [-7, -3, 1], tape: [-3, -9, 3]
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
    var fo = SHOW ? (1 - ar) : 0;
    floor.visible = blob.visible = fo > 0.01; floor.material.opacity = 0.45 * fo; blob.material.opacity = fo;
    var spread = 1 + h * 0.4 + Math.sin(t * 0.5) * 0.03;    // the fan opens as you scroll, and breathes
    order.forEach(function (name, k) {
      var g = tools[name], Wl = WALL[name], F = FAN[name], H = HERO[name];
      if (phone) Wl = { p: WALL_PHONE[name].p, r: Wl.r, s: WALL_PHONE[name].s || Wl.s };
      if (F) {      // its place in the fan: out from the handles along its angle
        var an = F.a * D * spread;
        H = { p: [PIV[0] - Math.sin(an) * RAD, PIV[1] + Math.cos(an) * RAD, F.z], r: [0.12, F.ry, an + (F.flip ? Math.PI : 0)], s: F.s };
      }
      if (SHOW) {
        var n = order.length, cyc = st.t / SHOW_EVERY, cur = Math.floor(cyc) % n, prev = (cur + n - 1) % n;
        var tr = ease(clamp01((cyc - Math.floor(cyc)) / 0.22)), wgt = k === cur ? tr : k === prev && cyc >= 1 ? 1 - tr : 0;
        if (cyc < 1 && k === cur) wgt = 1;
        var dir = k === cur ? 1 : -1, R0 = SHOW_R[name];
        var spin = R0[1] + Math.sin(st.t * 0.55 + k) * 0.55 + (1 - wgt) * dir * 1.2;   // turns gently to and fro, never edge-on
        H = { p: [lerp(dir * 4.6, 0, wgt), lerp(-0.4, SHOW_Y[name], wgt), lerp(-3, 0.6, wgt)],
              r: [R0[0], spin, R0[2]], s: Math.max(0.001, SHOW_S[name] * out(wgt)) };
        if (k === 0) caption(order[cur], cur, n, clamp01(cyc - Math.floor(cyc)));
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

  var last = performance.now(), visible = true, running = true; var slowT = 0, slowN = 0;
  function frame(now) {
    if (!running) return;
    requestAnimationFrame(frame);
    var raw = (now - last) / 1000, dt = Math.min(0.05, raw); last = now;
    if (!visible) return;
    st.t += dt;
    if (st.intro < 1) st.intro = Math.min(1, st.intro + Math.min(0.2, raw) / 2.4);   // real time, so a slow phone still finishes it
    pose(dt);
    renderer.render(scene, camera);
    // a slow machine: draw fewer pixels until it keeps up
    if (raw < 0.25) { slowT += raw; slowN++; }
    if (slowN >= 90 && !navigator.webdriver) {
      if (slowT / slowN > 0.026 && DPR > 0.8) { DPR = Math.max(0.75, DPR - 0.25); renderer.setPixelRatio(DPR); layout(); }
      slowT = 0; slowN = 0;
    }
    if (st.ana > 0.01) placeLabels();
  }

  api.hero = function (p, px) { st.hero = p; if (px) st.heroPx = px; };
  api.anatomy = function (p) { st.ana = p; };
  api.approach = function (p) { st.appr = p; };
  api.exit = function (p) { st.exit = p; };
  api.show = function (on) { visible = on; canvas.style.visibility = on ? 'visible' : 'hidden'; if (on) last = performance.now(); };
  api.pointer = function (x, y) { st.tx = x; st.ty = y; };
  api.skipIntro = function () { st.intro = 1; };
  api.at = function (sec) { st.t = sec; };   // for tests: jump the clock
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
