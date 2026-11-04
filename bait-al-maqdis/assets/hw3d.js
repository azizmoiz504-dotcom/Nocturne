/* Bait Al Maqdis website: the 3D hand tools, drawn in the browser (no picture files).
   They are the orange-and-black tools from their own Kapusi range: claw hammer, combination spanner,
   screwdriver, combination pliers and tape measure float together in the hero, and scrolling pulls the
   tape out and opens the pliers. In "Every tool" they fly onto the wall with the spirit level and the
   trowel, each with its name. Without 3D (old phone, graphics off) the page shows the flat picture instead. */
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
  /* the blade of the tape: yellow steel with centimetre marks (drawn once) */
  var TEX_LEN = 4.4;                  // how long 100 cm of blade is, in the model
  function tapeTexture() {
    var c = document.createElement('canvas'); c.width = 2048; c.height = 128;
    var x = c.getContext('2d');
    x.fillStyle = '#f2c21b'; x.fillRect(0, 0, c.width, c.height);
    var px = c.width / 100;
    x.fillStyle = '#16171a';
    for (var mm = 0; mm <= 1000; mm += 5) {
      var X = mm / 10 * px, cm = mm % 10 === 0, ten = mm % 100 === 0;
      var h = ten ? 52 : cm ? 34 : 16;
      x.fillRect(X - (ten ? 1.5 : 1), 0, ten ? 3 : 2, h);
      x.fillRect(X - (ten ? 1.5 : 1), c.height - h, ten ? 3 : 2, h);
    }
    x.textAlign = 'center'; x.textBaseline = 'middle';
    for (var n = 1; n < 100; n++) {
      var X2 = n * px;
      if (n % 10 === 0) {
        x.fillStyle = '#d4201c'; x.fillRect(X2 - 17, 44, 34, 40);
        x.fillStyle = '#fff'; x.font = '700 30px Arial, sans-serif'; x.fillText(String(n), X2, 65);
      } else {
        x.fillStyle = '#16171a'; x.font = '600 19px Arial, sans-serif'; x.fillText(String(n % 10), X2 + 0.5, 65);
      }
    }
    var t = new T.CanvasTexture(c);
    t.encoding = T.sRGBEncoding;
    t.anisotropy = Math.min(8, renderer.capabilities.getMaxAnisotropy());
    t.wrapS = T.ClampToEdgeWrapping;
    return t;
  }
  var tapeTex = tapeTexture();

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
    blade: new T.MeshStandardMaterial({ color: 0xffffff, map: tapeTex, metalness: 0.3, roughness: 0.38, side: T.DoubleSide }),
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

  /* ---------- claw hammer: polished head, orange handle, black grip ---------- */
  var hammer = tool('hammer');
  (function (h) {
    h.position.y = 1.85;
    var head = new T.Group(); h.add(head);
    var face = lathe([[0, 1.168], [0.13, 1.162], [0.238, 1.15], [0.272, 1.124], [0.284, 1.08], [0.284, 0.93], [0.262, 0.875], [0.214, 0.78], [0.196, 0.66], [0.21, 0.58], [0.25, 0.5], [0, 0.5]], 64, M.polish);
    face.rotation.z = Math.PI / 2; head.add(face);
    head.add(ext(rrect(0.8, 0.6, 0.12, -0.22, 0), 0.36, 0.05, M.polish, 3, 12));
    // the claw: two prongs curving down, with the slot between them
    var claw = new T.Shape(), top = [], bot = [];
    for (var k = 0; k <= 26; k++) {
      var t = k / 26, u = 1 - t;
      var cx = u * u * 0.1 + 2 * u * t * 0.86 + t * t * 1.24, cy = u * u * 0.03 + 2 * u * t * 0.13 + t * t * -0.52;
      var dx = 2 * u * (0.86 - 0.1) + 2 * t * (1.24 - 0.86), dy = 2 * u * (0.13 - 0.03) + 2 * t * (-0.52 - 0.13);
      var l = Math.sqrt(dx * dx + dy * dy), nx = -dy / l, ny = dx / l;
      var hh = (0.5 * Math.pow(1 - t, 0.75) + 0.05 * t) / 2;
      top.push([cx + nx * hh, cy + ny * hh]); bot.push([cx - nx * hh, cy - ny * hh]);
    }
    claw.moveTo(top[0][0], top[0][1]);
    top.forEach(function (p) { claw.lineTo(p[0], p[1]); });
    bot.reverse().forEach(function (p) { claw.lineTo(p[0], p[1]); });
    [-1, 1].forEach(function (s) { var m = ext(claw, 0.135, 0.028, M.polish, 3, 12); m.position.z = s * 0.088; head.add(m); });
    // handle: orange core, black rubber grip with two orange bands, oval in section
    var hd = new T.Group(); hd.scale.z = 0.74; h.add(hd);
    hd.add(lathe([[0, 0.26], [0.152, 0.26], [0.152, -0.3], [0.158, -0.7], [0.168, -1.1], [0.176, -1.5], [0, -1.5]], 48, M.orange));
    var grip = [[0, -1.32], [0.172, -1.32], [0.202, -1.42], [0.207, -1.62], [0.199, -2.1], [0.205, -2.6], [0.225, -3.1], [0.242, -3.5], [0.252, -3.74], [0.238, -3.92], [0.18, -3.995], [0, -4.0]];
    hd.add(lathe(grip, 48, M.black));
    [-1.66, -3.58].forEach(function (y) {
      var r = y > -2 ? 0.207 : 0.246;
      hd.add(lathe([[r - 0.004, y + 0.05], [r + 0.012, y + 0.035], [r + 0.012, y - 0.035], [r - 0.004, y - 0.05]], 48, M.orange));
    });
  })(hammer);

  /* ---------- combination spanner (chrome): ring end and open end ---------- */
  var spanner = tool('spanner');
  (function (s) {
    var L = 3.35, Ro = 0.6, hw0 = 0.2, hw1 = 0.165, Rj = 0.6, jaw = 0.37, phi = 15 * Math.PI / 180, HX = 0.41;
    var sh = new T.Shape();
    var a0 = Math.asin(hw0 / Ro);
    sh.moveTo(Math.cos(a0) * Ro, hw0);
    sh.absarc(0, 0, Ro, a0, Math.PI * 2 - a0, false);
    var bx = L - Math.sqrt(Rj * Rj - hw1 * hw1);
    sh.bezierCurveTo(1.2, -hw0 * 0.86, bx - 0.6, -hw1 * 0.86, bx, -hw1);
    var b0 = Math.PI + Math.asin(hw1 / Rj);
    var rot = function (u, v) { return [L + u * Math.cos(phi) - v * Math.sin(phi), u * Math.sin(phi) + v * Math.cos(phi)]; };
    var ue = Math.sqrt(Rj * Rj - jaw * jaw);
    var p1 = rot(ue, -jaw), aJ1 = Math.atan2(p1[1], p1[0] - L);
    sh.absarc(L, 0, Rj, b0, aJ1 + Math.PI * 2, false);
    var q1 = rot(0, -jaw); sh.lineTo(q1[0], q1[1]);
    sh.absarc(L, 0, jaw, phi - Math.PI / 2, phi - Math.PI * 1.5, true);
    var p2 = rot(ue, jaw); sh.lineTo(p2[0], p2[1]);
    var aJ2 = Math.atan2(p2[1], p2[0] - L), b1 = Math.PI - Math.asin(hw1 / Rj);
    sh.absarc(L, 0, Rj, aJ2, b1, false);
    sh.bezierCurveTo(bx - 0.6, hw1 * 0.86, 1.2, hw0 * 0.86, Math.cos(a0) * Ro, hw0);
    var hole = new T.Path(), ap = HX * Math.cos(Math.PI / 6);
    for (var k = 0; k < 24; k++) {
      var ang = k / 24 * Math.PI * 2 + Math.PI / 6, r = k % 2 ? ap / Math.cos(Math.PI / 12) : HX;
      if (k) hole.lineTo(Math.cos(ang) * r, Math.sin(ang) * r); else hole.moveTo(Math.cos(ang) * r, Math.sin(ang) * r);
    }
    hole.closePath(); sh.holes.push(hole);
    var body = new T.Group(); body.rotation.z = -Math.PI / 2; body.position.y = L / 2; s.add(body);
    body.add(ext(sh, 0.19, 0.05, M.chrome, 4, 48));
    var rib = new T.Shape(); rib.moveTo(0.95, 0.1); rib.bezierCurveTo(1.5, 0.085, 2.0, 0.08, 2.45, 0.085); rib.lineTo(2.45, -0.085); rib.bezierCurveTo(2.0, -0.08, 1.5, -0.085, 0.95, -0.1); rib.closePath();
    [-1, 1].forEach(function (z) { var m = ext(rib, 0.04, 0.012, M.satin, 2, 16); m.position.z = z * 0.095; body.add(m); });
  })(spanner);

  /* ---------- screwdriver: fluted orange handle with black grips, chrome shaft, cross tip ---------- */
  var driver = tool('driver');
  (function (s) {
    var prof = [[0.55, 0.15], [0.62, 0.2], [0.76, 0.238], [1.0, 0.268], [1.5, 0.284], [1.8, 0.274], [1.95, 0.238], [2.02, 0.16], [2.05, 0.0]];
    s.add(fluted(prof, 6, 0.09, 3, M.orange));
    var grip = prof.map(function (p) { return [p[0], p[1] * 1.015]; });
    s.add(fluted(grip, 6, 0.09, 3, M.black, 0.86, 1.3));
    s.add(fluted(grip, 6, 0.09, 3, M.black, 1.58, 1.86));
    s.add(lathe([[0, 0.56], [0.152, 0.56], [0.152, 0.52], [0.118, 0.46], [0.075, 0.4], [0, 0.4]], 48, M.chrome));
    s.add(lathe([[0, 0.42], [0.068, 0.42], [0.068, -1.72], [0, -1.72]], 32, M.chrome));
    s.add(fluted([[-2.05, 0.0], [-2.03, 0.014], [-1.96, 0.04], [-1.84, 0.066], [-1.72, 0.068]], 4, 0.55, 10, M.chrome));
  })(driver);

  /* ---------- combination pliers: chrome head, orange and black grips; they open and close ---------- */
  var pliers = tool('pliers');
  var halves = [];
  (function (s) {
    s.position.y = 0.72;
    function half(sg) {
      var X = function (x) { return x * sg; };
      var sh = new T.Shape();
      sh.moveTo(X(-0.035), 1.58);
      sh.lineTo(X(-0.17), 1.53);
      sh.quadraticCurveTo(X(-0.33), 1.06, X(-0.385), 0.46);
      sh.quadraticCurveTo(X(-0.5), 0.05, X(-0.36), -0.3);
      sh.quadraticCurveTo(X(0.16), -0.95, X(0.42), -2.95);
      sh.lineTo(X(0.54), -2.95);
      sh.quadraticCurveTo(X(0.46), -1.3, X(0.44), -0.24);
      sh.quadraticCurveTo(X(0.36), 0.22, X(0.02), 0.42);
      sh.lineTo(X(-0.035), 1.58);
      var g = new T.Group();
      var m = ext(sh, 0.21, 0.035, M.chrome, 3, 24); m.position.z = sg * 0.06; g.add(m);
      // the grip over the handle
      var gp = tube([[X(0.2), -0.95, sg * 0.06], [X(0.33), -1.6, sg * 0.06], [X(0.44), -2.3, sg * 0.06], [X(0.49), -2.98, sg * 0.06]], 0.17, M.orange, 48);
      g.add(gp);
      var c = gp.userData.curve;
      g.add(cap(c, 1, 0.17, M.orange));
      var lower = new T.CatmullRomCurve3([0.5, 0.62, 0.74, 0.86, 1].map(function (t) { return c.getPoint(t); }));
      g.add(new T.Mesh(new T.TubeGeometry(lower, 32, 0.18, 18, false), M.black));
      g.add(cap(c, 1, 0.18, M.black));
      g.add(cap(c, 0, 0.17, M.orange));
      // the stop at the top of the grip
      var stop = lathe([[0, 0.03], [0.2, 0.03], [0.22, 0], [0.2, -0.03], [0, -0.03]], 32, M.orange);
      stop.position.copy(c.getPoint(0.02));
      stop.quaternion.setFromUnitVectors(new T.Vector3(0, 1, 0), c.getTangent(0.02).negate());
      g.add(stop);
      s.add(g);
      return g;
    }
    halves.push(half(1), half(-1));
    var rivet = new T.Mesh(new T.CylinderGeometry(0.13, 0.13, 0.3, 32), M.satin);
    rivet.rotation.x = Math.PI / 2; s.add(rivet);
  })(pliers);

  /* ---------- tape measure: orange case, black sides, the yellow blade pulls out ---------- */
  var tape = tool('tape');
  var blade, hook, tapeL = 0.5;
  (function (s) {
    s.add(ext(rrect(1.56, 1.5, 0.46), 0.62, 0.07, M.orange, 4, 16));
    [-1, 1].forEach(function (z) {
      var side = ext(rrect(1.34, 1.28, 0.38), 0.06, 0.02, M.black, 2, 16); side.position.z = z * 0.315; s.add(side);
      var badge = new T.Mesh(new T.CylinderGeometry(0.3, 0.3, 0.04, 48), M.chrome); badge.rotation.x = Math.PI / 2; badge.position.z = z * 0.35; s.add(badge);
      var dot = new T.Mesh(new T.CylinderGeometry(0.07, 0.07, 0.05, 24), M.gloss); dot.rotation.x = Math.PI / 2; dot.position.z = z * 0.36; s.add(dot);
    });
    var lock = ext(rrect(0.42, 0.16, 0.06), 0.3, 0.03, M.gloss); lock.position.set(0.34, 0.76, 0); s.add(lock);
    var mouth = ext(rrect(0.34, 0.24, 0.05), 0.5, 0.03, M.gloss); mouth.position.set(0.64, -0.64, 0); s.add(mouth);
    // the blade: a strip from x = 0 to 1, curved across its width; it is stretched to its length every frame
    var W = 0.44, sag = 0.035, seg = 10, pos = [], uv = [], idx = [];
    for (var i = 0; i <= 1; i++) for (var j = 0; j <= seg; j++) {
      var z = -W / 2 + W * j / seg, zz = z / (W / 2);
      pos.push(i, -sag * (1 - zz * zz), z); uv.push(1 - i, j / seg);
    }
    for (j = 0; j < seg; j++) idx.push(j, j + 1, seg + 1 + j, j + 1, seg + 2 + j, seg + 1 + j);
    var g = new T.BufferGeometry();
    g.setAttribute('position', new T.Float32BufferAttribute(pos, 3));
    g.setAttribute('uv', new T.Float32BufferAttribute(uv, 2));
    g.setIndex(idx); g.computeVertexNormals();
    blade = new T.Mesh(g, M.blade); blade.position.set(0.78, -0.64, 0); s.add(blade);
    hook = new T.Group(); s.add(hook);
    var plate = new T.Mesh(new T.BoxGeometry(0.035, 0.24, 0.48), M.satin); plate.position.set(0.018, -0.1, 0); hook.add(plate);
    var tab = new T.Mesh(new T.BoxGeometry(0.16, 0.02, 0.46), M.satin); tab.position.set(-0.07, 0.008, 0); hook.add(tab);
  })(tape);

  /* ---------- spirit level: orange body, milled edges, black end caps, three vials ---------- */
  var level = tool('level');
  var bubbles = [];
  (function (s) {
    var LEN = 4.7;
    s.add(ext(rrect(LEN - 0.3, 0.56, 0.04), 0.24, 0.025, M.paint, 2, 8));
    [-1, 1].forEach(function (y) { var e = new T.Mesh(new T.BoxGeometry(LEN - 0.32, 0.04, 0.25), M.satin); e.position.y = y * 0.28; s.add(e); });
    [-1, 1].forEach(function (x) { var c = ext(rrect(0.24, 0.66, 0.07), 0.32, 0.04, M.black, 2, 8); c.position.x = x * (LEN / 2 - 0.1); s.add(c); });
    var vial = function (len, r) {
      var p = [[0, -len / 2 - r]], k;
      for (k = 1; k <= 6; k++) { var a = -Math.PI / 2 + k / 6 * Math.PI / 2; p.push([Math.cos(a) * r, -len / 2 + Math.sin(a) * r]); }
      for (k = 0; k <= 6; k++) { var b = k / 6 * Math.PI / 2; p.push([Math.cos(b) * r, len / 2 + Math.sin(b) * r]); }
      return lathe(p, 32, M.vial);
    };
    [-1, 1].forEach(function (z) {
      var w = ext(rrect(1.0, 0.38, 0.12), 0.03, 0.01, M.gloss); w.position.set(0, 0, z * 0.12); s.add(w);
      var v = vial(0.5, 0.085); v.rotation.z = Math.PI / 2; v.position.set(0, 0, z * 0.14); s.add(v);
      var b = new T.Mesh(new T.SphereGeometry(0.06, 16, 10), M.bubble); b.scale.set(1.6, 0.55, 0.8); b.position.set(0, 0.05, z * 0.15); s.add(b); bubbles.push(b);
      [-1, 1].forEach(function (x) {
        var d = new T.Mesh(new T.CylinderGeometry(0.2, 0.2, 0.03, 40), M.gloss); d.rotation.x = Math.PI / 2; d.position.set(x * 1.62, 0, z * 0.12); s.add(d);
        var pv = vial(0.18, 0.07); pv.position.set(x * 1.62, 0, z * 0.14); s.add(pv);
      });
      var slot = ext(rrect(0.9, 0.2, 0.1), 0.03, 0.01, M.gloss); slot.position.set(0.95, 0, z * 0.12); s.add(slot);
    });
  })(level);

  /* ---------- trowel: steel blade, orange closed handle with a black grip ---------- */
  var trowel = tool('trowel');
  (function (s) {
    s.add(ext(rrect(2.7, 1.12, 0.14), 0.035, 0.012, M.steel, 2, 12));
    var bar = new T.Mesh(new T.BoxGeometry(2.0, 0.14, 0.07), M.satin); bar.position.z = 0.05; s.add(bar);
    var hd = tube([[-0.95, 0, 0.06], [-0.82, 0, 0.42], [-0.45, 0, 0.64], [0.4, 0, 0.66], [0.82, 0, 0.46], [0.95, 0, 0.06]], 0.1, M.orange, 80);
    s.add(hd);
    var c = hd.userData.curve;
    var mid = new T.CatmullRomCurve3([0.3, 0.4, 0.5, 0.6, 0.7].map(function (t) { return c.getPoint(t); }));
    s.add(new T.Mesh(new T.TubeGeometry(mid, 40, 0.122, 18, false), M.black));
    s.add(cap(mid, 0, 0.122, M.black)); s.add(cap(mid, 1, 0.122, M.black));
  })(trowel);

  /* where each name sits on the wall: a point beside the tool (in wall units, from its middle), and which side of it the name goes */
  var anchors = [
    { id: 'level', d: [2.62, 0.0], at: 'side', pd: [1.55, 0.36] },
    { id: 'hammer', d: [0.0, 2.32], at: 'up' },
    { id: 'driver', d: [0.0, 2.08], at: 'up' },
    { id: 'pliers', d: [0.0, 2.36], at: 'up' },
    { id: 'spanner', d: [0.0, 2.36], at: 'up' },
    { id: 'tape', d: [-0.98, 0.1], at: 'out', pd: [0.05, 0.86] },
    { id: 'trowel', d: [1.5, 0.0], at: 'side', pd: [0.0, 0.7] }
  ];

  /* ---------- where each tool sits ---------- */
  var D = Math.PI / 180;
  // the hero: a fan of tools held at the handles, like a hand of cards, with the tape measure in front
  var FAN = {
    pliers: { a: 40, z: -0.55, ry: -0.3, s: 0.95 },
    driver: { a: 14, z: -0.2, ry: 0.25, s: 0.98, flip: true },
    hammer: { a: -13, z: 0.35, ry: -0.35, s: 1.0 },
    spanner: { a: -39, z: 0.0, ry: 0.3, s: 0.98 }
  };
  var PIV = [0.15, -2.0], RAD = 2.2;
  var HERO = {
    tape: { p: [0.55, -2.05, 1.6], r: [0.36, Math.PI + 0.22, 0.03], s: 0.9 },
    level: { p: [0.2, -7, -2], r: [0.3, -0.4, 0.4], s: 0.6 },
    trowel: { p: [-1.5, -7.5, -2], r: [0.8, 0.4, -0.3], s: 0.6 }
  };
  // "Every tool": hung on the wall in their places, the level along the top
  var WALL = {
    level: { p: [-0.35, 3.55, 0], r: [0.08, 0, 0], s: 1.0 },
    hammer: { p: [-2.75, 0.05, 0], r: [0.08, 0.18, 0], s: 0.95 },
    driver: { p: [-0.95, 0.15, 0], r: [0.08, 0, 0], s: 0.92 },
    pliers: { p: [0.75, -0.05, 0], r: [0.08, 0, 0], s: 0.92 },
    spanner: { p: [2.45, 0.0, 0], r: [0.08, 0, 0], s: 0.95 },
    tape: { p: [-1.7, -3.3, 0], r: [0.75, Math.PI + 0.35, 0], s: 0.95 },
    trowel: { p: [1.2, -3.3, 0], r: [-0.4, 0.42, 0.08], s: 0.88 }
  };
  // on a phone the wall is narrow and tall: more room between the rows, every name above its tool
  var WALL_PHONE = {
    level: { p: [-0.35, 4.7, 0], s: 1.0 }, hammer: { p: [-2.75, 1.25, 0] }, driver: { p: [-0.95, 1.35, 0] }, pliers: { p: [0.75, 1.15, 0] },
    spanner: { p: [2.45, 1.2, 0] }, tape: { p: [-1.6, -2.75, 0] }, trowel: { p: [1.25, -2.75, 0] }
  };
  var START = {      // where they fly in from when the page opens
    hammer: [5, 6, 2], spanner: [-6, 5, -1], driver: [7, -4, -2], pliers: [-7, -5, 1], tape: [3, -8, 3], level: [0, -9, 0], trowel: [0, -9, 0]
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
      sc = Math.min(0.6, (room - top + 24) / cH * visH / 5.3, visW / 5.4);
      heroX = 0; heroY = visH / 2 - (top + room) / 2 / cH * visH + 0.2 * sc;
    }
    var anaX = phone ? 0 : side * visW * 0.2, anaY = phone ? -1.45 : -0.3;
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
      var hry = (rtl && name === 'tape') ? Math.PI - H.r[1] : H.r[1] * side;   // the tape is turned, not mirrored, so its blade still points at the words
      // on the wall: the order they arrive in, and the gentle swing of a tool on a hook
      var ak = ease((a - k * 0.045) / 0.73);
      var wx = Wl.p[0] * side, wy = Wl.p[1] + Math.sin(t * 0.8 + k) * 0.02 * ak, wz = Wl.p[2];
      g.position.set(lerp(hp[0], wx, ak), lerp(hp[1], wy, ak) + Math.sin(ak * Math.PI) * 0.6, lerp(hp[2], wz, ak) + Math.sin(ak * Math.PI) * 1.4);
      var wry = (rtl && name === 'tape') ? Math.PI - Wl.r[1] : Wl.r[1] * side;
      qa.setFromEuler(ea.set(H.r[0] + (1 - ik) * 1.2, hry, hrz));
      qb.setFromEuler(ea.set(Wl.r[0], wry, Wl.r[2] + Math.sin(t * 0.8 + k * 1.3) * 0.025));
      g.quaternion.copy(qa).slerp(qb, ak);
      var vis = name === 'level' || name === 'trowel' ? out(ak * 1.6) : 1;
      g.scale.setScalar(Math.max(0.001, lerp(H.s, Wl.s, ak) * vis));
      g.visible = vis > 0.002;
    });
    // the tape pulls out as you scroll the hero, and goes back in on the wall
    var tl = lerp(lerp(0.45, 4.1, ease(h * 2.2)) + Math.sin(t * 0.6) * 0.04, 0.42, ease(a * 1.4));
    tl = tl * (0.35 + 0.65 * out(i0 * 1.4 - 0.35));
    tapeL = Math.max(0.08, tl);
    blade.scale.x = tapeL;
    tapeTex.repeat.x = tapeL / TEX_LEN;
    hook.position.set(0.78 + tapeL, -0.64, 0);
    // the pliers open as you scroll, a little bite while they float, closed on the wall
    var open = lerp(0.1 + h * 0.32 + Math.max(0, Math.sin(t * 1.3)) * 0.05, 0.03, ease(a));
    halves[0].rotation.z = open / 2; halves[1].rotation.z = -open / 2;
    // the bubble in the level finds the high side
    level.parent.updateMatrixWorld(true);
    v3.set(1, 0, 0).transformDirection(level.matrixWorld);
    var tilt = Math.atan2(v3.y, v3.x);
    bubbles.forEach(function (b) { b.position.x += (Math.max(-0.17, Math.min(0.17, tilt * 2.2)) - b.position.x) * Math.min(1, dt * 4); });
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
