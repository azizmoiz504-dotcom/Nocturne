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
  renderer.toneMappingExposure = 0.98;
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

  /* ---------- surfaces painted once in the browser: a colour picture, and a height picture turned into fine relief ---------- */
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
  // a height picture (light = raised) becomes a normal map, so the light catches every thread and grain
  function reliefTex(w, h, draw, strength) {
    var c = document.createElement('canvas'); c.width = w; c.height = h;
    var x = c.getContext('2d'); draw(x, w, h);
    var src = x.getImageData(0, 0, w, h).data, out = x.createImageData(w, h), d = out.data;
    var H = function (i, j) { i = (i + w) % w; j = (j + h) % h; return src[(j * w + i) * 4] / 255; };
    for (var j = 0; j < h; j++) for (var i = 0; i < w; i++) {
      var dx = (H(i + 1, j) - H(i - 1, j)) * strength, dy = (H(i, j + 1) - H(i, j - 1)) * strength;
      var l = Math.sqrt(dx * dx + dy * dy + 1), k = (j * w + i) * 4;
      d[k] = (-dx / l * 0.5 + 0.5) * 255; d[k + 1] = (dy / l * 0.5 + 0.5) * 255; d[k + 2] = (1 / l * 0.5 + 0.5) * 255; d[k + 3] = 255;
    }
    x.putImageData(out, 0, 0);
    var t = new T.CanvasTexture(c);
    t.wrapS = t.wrapT = T.RepeatWrapping; t.anisotropy = MAXANI;
    return t;
  }
  // a steady random, so every visit draws the same textures
  var seed = 7;
  var rnd = function () { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; };

  /* hessian: thick jute yarns over and under, each a slightly different straw colour, with loose fibres */
  function hessianDraw(height) {
    return function (x, w, h) {
      seed = 11;
      var n = 32, p = w / n;                         // 32 yarns each way
      x.fillStyle = height ? '#000' : '#3b2a16'; x.fillRect(0, 0, w, h);
      var tone = [], i, j;
      for (i = 0; i < n * 2; i++) tone.push(rnd());
      for (j = 0; j < n; j++) for (i = 0; i < n; i++) {
        var over = (i + j) % 2 === 0;               // which yarn is on top here
        var cx = i * p, cy = j * p;
        var g, t;
        if (over) {                                 // the up-and-down yarn shows
          t = tone[i];
          g = x.createLinearGradient(cx, 0, cx + p, 0);
        } else {                                    // the side-to-side yarn shows
          t = tone[n + j];
          g = x.createLinearGradient(0, cy, 0, cy + p);
        }
        if (height) { g.addColorStop(0, '#222'); g.addColorStop(0.5, '#fff'); g.addColorStop(1, '#222'); }
        else {
          var r = 168 + t * 34, gg = 128 + t * 26, b = 74 + t * 18;
          g.addColorStop(0, 'rgb(' + (r * 0.62 | 0) + ',' + (gg * 0.6 | 0) + ',' + (b * 0.56 | 0) + ')');
          g.addColorStop(0.5, 'rgb(' + (r | 0) + ',' + (gg | 0) + ',' + (b | 0) + ')');
          g.addColorStop(1, 'rgb(' + (r * 0.62 | 0) + ',' + (gg * 0.6 | 0) + ',' + (b * 0.56 | 0) + ')');
        }
        x.fillStyle = g;
        var m = p * 0.1;
        if (over) x.fillRect(cx + m, cy - m, p - m * 2, p + m * 2); else x.fillRect(cx - m, cy + m, p + m * 2, p - m * 2);
        // the twist in the yarn
        x.strokeStyle = height ? 'rgba(0,0,0,.25)' : 'rgba(60,40,15,.28)'; x.lineWidth = 1;
        for (var k = 0; k < 3; k++) {
          x.beginPath();
          if (over) { var yy = cy + (k + 0.5) * p / 3; x.moveTo(cx + m, yy); x.lineTo(cx + p - m, yy + p * 0.12); }
          else { var xx = cx + (k + 0.5) * p / 3; x.moveTo(xx, cy + m); x.lineTo(xx + p * 0.12, cy + p - m); }
          x.stroke();
        }
      }
      // loose fibres lying across
      for (i = 0; i < 260; i++) {
        var a = rnd() * Math.PI * 2, L = 6 + rnd() * 18, sx = rnd() * w, sy = rnd() * h;
        x.strokeStyle = height ? 'rgba(255,255,255,.35)' : 'rgba(' + (200 + rnd() * 40 | 0) + ',' + (160 + rnd() * 30 | 0) + ',' + (100 + rnd() * 20 | 0) + ',.55)';
        x.lineWidth = 0.7; x.beginPath(); x.moveTo(sx, sy); x.quadraticCurveTo(sx + Math.cos(a + 0.6) * L / 2, sy + Math.sin(a + 0.6) * L / 2, sx + Math.cos(a) * L, sy + Math.sin(a) * L); x.stroke();
      }
    };
  }

  /* oak: long grain lines that wander a little, with darker flecks */
  function oakDraw(height) {
    return function (x, w, h) {
      seed = 23;
      var g = x.createLinearGradient(0, 0, w, 0);
      if (height) { x.fillStyle = '#808080'; x.fillRect(0, 0, w, h); }
      else { g.addColorStop(0, '#c99a62'); g.addColorStop(0.5, '#d9ad74'); g.addColorStop(1, '#c4935a'); x.fillStyle = g; x.fillRect(0, 0, w, h); }
      for (var i = 0; i < 70; i++) {
        var px = rnd() * w, amp = 2 + rnd() * 6, fr = 1 + rnd() * 3, ph = rnd() * 6, wd = 0.6 + rnd() * 1.8;
        x.strokeStyle = height ? 'rgba(0,0,0,' + (0.25 + rnd() * 0.3) + ')' : 'rgba(' + (120 + rnd() * 30 | 0) + ',' + (78 + rnd() * 20 | 0) + ',' + (40 + rnd() * 12 | 0) + ',' + (0.25 + rnd() * 0.35) + ')';
        x.lineWidth = wd; x.beginPath();
        for (var y = 0; y <= h; y += 8) { var xx = px + Math.sin(y / h * Math.PI * 2 * fr + ph) * amp; if (y) x.lineTo(xx, y); else x.moveTo(xx, y); }
        x.stroke();
      }
      for (i = 0; i < 90; i++) {            // rays and pores
        x.fillStyle = height ? 'rgba(0,0,0,.4)' : 'rgba(110,70,35,.35)';
        x.fillRect(rnd() * w, rnd() * h, 0.8 + rnd(), 3 + rnd() * 9);
      }
    };
  }

  /* knitted glove: rows of little V-shaped loops */
  function knitDraw(height, base) {
    return function (x, w, h) {
      x.fillStyle = height ? '#000' : base; x.fillRect(0, 0, w, h);
      var cw = w / 16, ch = h / 24;
      for (var j = -1; j <= 24; j++) for (var i = 0; i < 16; i++) {
        var cx = i * cw + cw / 2, cy = j * ch;
        [-1, 1].forEach(function (s) {
          x.save(); x.translate(cx + s * cw * 0.2, cy + ch * 0.55); x.rotate(s * 0.55);
          var g = x.createRadialGradient(0, 0, 0, 0, 0, ch * 0.75);
          if (height) { g.addColorStop(0, '#fff'); g.addColorStop(1, '#000'); }
          else { g.addColorStop(0, base === '#f4f3ef' ? '#ffffff' : '#9aa2ad'); g.addColorStop(1, base === '#f4f3ef' ? '#cfcdc6' : '#5d646e'); }
          x.fillStyle = g; x.beginPath(); x.ellipse(0, 0, cw * 0.26, ch * 0.72, 0, 0, Math.PI * 2); x.fill(); x.restore();
        });
      }
    };
  }
  // nitrile coating: smooth grey with tiny foam pores

  // reflective sleeve on the cone: tiny prisms that sparkle
  // moulded plastic: a faint mottling so it isn't plastic-perfect

  // barrier tape: red and white bands like BAM's (no words on it)
  var RIB_LEN = 3.2;                       // how long one picture of the tape is, in the model
  var cautionTex = canvasTex(1024, 128, function (x, w, h) {
    x.fillStyle = '#f6f4f0'; x.fillRect(0, 0, w, h);
    x.fillStyle = '#dd2318';
    for (var k = -2; k < 18; k++) { x.beginPath(); x.moveTo(k * 64, h); x.lineTo(k * 64 + 32, h); x.lineTo(k * 64 + 32 + 60, 0); x.lineTo(k * 64 + 60, 0); x.closePath(); x.fill(); }
    x.fillStyle = 'rgba(255,255,255,.2)'; x.fillRect(0, 7, w, 2); x.fillRect(0, h - 9, w, 2);
  }, true);
  var cautionTexV = canvasTex(128, 1024, function (x, w, h) {   // the same tape, standing up
    x.translate(w, 0); x.rotate(Math.PI / 2); x.drawImage(cautionTex.image, 0, 0);
  }, true);
  // the solar cell on the warning light
  var solarTex = canvasTex(256, 256, function (x, w, h) {
    var g = x.createLinearGradient(0, 0, w, h); g.addColorStop(0, '#0b1a3a'); g.addColorStop(1, '#14284f');
    x.fillStyle = g; x.fillRect(0, 0, w, h);
    x.strokeStyle = '#8fa3c7'; x.lineWidth = 3;
    for (var i = 0; i <= 4; i++) { x.beginPath(); x.moveTo(i * w / 4, 0); x.lineTo(i * w / 4, h); x.stroke(); x.beginPath(); x.moveTo(0, i * h / 4); x.lineTo(w, i * h / 4); x.stroke(); }
    x.strokeStyle = 'rgba(143,163,199,.35)'; x.lineWidth = 1;
    for (i = 0; i < w; i += 8) { x.beginPath(); x.moveTo(i, 0); x.lineTo(i, h); x.stroke(); }
  });
  // fresnel rings on the warning light lens

  var BLUE = 0x2f6dff;
  /* glossy toy look: smooth vinyl colours, a strong clear coat, no fabric or grain textures */
  var toy = function (hex, o) {
    var m = new T.MeshPhysicalMaterial({ color: srgb(hex), metalness: 0, roughness: 0.22, clearcoat: 1, clearcoatRoughness: 0.05, envMapIntensity: 0.6 });
    if (o) for (var q in o) m[q] = o[q];
    return m;
  };
  var K = {
    cone: toy(0xff4a14, { roughness: 0.2 }),
    reflect: toy(0xffffff, { roughness: 0.14, envMapIntensity: 0.45, emissive: srgb(0x3a4152) }),
    rubber: toy(0x16203a, { roughness: 0.3 }),
    body: toy(0xffa800),
    lensA: toy(0xff5200, { emissive: srgb(0xff4800), emissiveIntensity: 0.45, roughness: 0.08 }),
    bulb: new T.MeshBasicMaterial({ color: srgb(0xfff1c2) }),
    solar: new T.MeshPhysicalMaterial({ map: solarTex, metalness: 0.3, roughness: 0.12, clearcoat: 1, clearcoatRoughness: 0.04 }),
    ribbon: new T.MeshPhysicalMaterial({ map: cautionTexV, roughness: 0.22, clearcoat: 1, clearcoatRoughness: 0.06, side: T.DoubleSide }),
    hessian: toy(0xd99a4e, { roughness: 0.42, clearcoat: 0.35, clearcoatRoughness: 0.2, envMapIntensity: 0.35, side: T.DoubleSide }),
    twine: toy(BLUE),
    wood: toy(0xd4893c, { roughness: 0.24 }),
    blade: toy(0xb9c6da, { metalness: 0.55, roughness: 0.2 }),
    bright: toy(0xeef2f8, { metalness: 0.6, roughness: 0.14 }),
    knit: toy(0xffffff, { roughness: 0.3, clearcoat: 0.8, emissive: srgb(0x2c3242), side: T.DoubleSide }),
    dip: toy(BLUE, { roughness: 0.16, side: T.DoubleSide }),
    cuff: toy(0xffffff, { roughness: 0.3, clearcoat: 0.8, emissive: srgb(0x2c3242), side: T.DoubleSide }),
    hem: toy(0x16203a),
    clear: new T.MeshPhysicalMaterial({ color: srgb(0x9cc0ff), metalness: 0, roughness: 0.02, transparent: true, opacity: 0.5, clearcoat: 1, clearcoatRoughness: 0.02, side: T.DoubleSide, depthWrite: false }),
    coat: new T.MeshPhysicalMaterial({ color: srgb(0x7fb0ff), metalness: 0.9, roughness: 0.05, transparent: true, opacity: 0.16, side: T.FrontSide, depthWrite: false }),
    arm: toy(BLUE),
    armDark: toy(0x16203a),
    core: toy(0xe6bf86, { roughness: 0.35, side: T.DoubleSide })
  };

  /* ---------- a smooth shape from overlapping rounded pieces (for the glove): the outline is found on a fine grid ---------- */
  function sdCapsule(px, py, pz, a, b, r) {
    var bax = b[0] - a[0], bay = b[1] - a[1], baz = b[2] - a[2], pax = px - a[0], pay = py - a[1], paz = pz - a[2];
    var hh = Math.max(0, Math.min(1, (pax * bax + pay * bay + paz * baz) / (bax * bax + bay * bay + baz * baz)));
    var dx = pax - bax * hh, dy = pay - bay * hh, dz = paz - baz * hh;
    return Math.sqrt(dx * dx + dy * dy + dz * dz) - (r[0] + (r[1] - r[0]) * hh);
  }
  function sdRoundBox(px, py, pz, c, b, r) {
    var qx = Math.abs(px - c[0]) - b[0], qy = Math.abs(py - c[1]) - b[1], qz = Math.abs(pz - c[2]) - b[2];
    var mx = Math.max(qx, 0), my = Math.max(qy, 0), mz = Math.max(qz, 0);
    return Math.sqrt(mx * mx + my * my + mz * mz) + Math.min(Math.max(qx, Math.max(qy, qz)), 0) - r;
  }
  function smin(a, b, k) { var h = Math.max(k - Math.abs(a - b), 0) / k; return Math.min(a, b) - h * h * k * 0.25; }
  /* surface nets: one point inside each grid cell the outline passes through, joined into a smooth skin */
  function surface(f, min, max, step) {
    var nx = Math.ceil((max[0] - min[0]) / step) + 1, ny = Math.ceil((max[1] - min[1]) / step) + 1, nz = Math.ceil((max[2] - min[2]) / step) + 1;
    var val = new Float32Array(nx * ny * nz), I = function (i, j, k) { return i + nx * (j + ny * k); };
    for (var k = 0; k < nz; k++) for (var j = 0; j < ny; j++) for (var i = 0; i < nx; i++) val[I(i, j, k)] = f(min[0] + i * step, min[1] + j * step, min[2] + k * step);
    var vid = new Int32Array(nx * ny * nz).fill(-1), pos = [], idx = [];
    var E = [[0, 0, 0, 1, 0, 0], [0, 1, 0, 1, 1, 0], [0, 0, 1, 1, 0, 1], [0, 1, 1, 1, 1, 1], [0, 0, 0, 0, 1, 0], [1, 0, 0, 1, 1, 0], [0, 0, 1, 0, 1, 1], [1, 0, 1, 1, 1, 1], [0, 0, 0, 0, 0, 1], [1, 0, 0, 1, 0, 1], [0, 1, 0, 0, 1, 1], [1, 1, 0, 1, 1, 1]];
    for (k = 0; k < nz - 1; k++) for (j = 0; j < ny - 1; j++) for (i = 0; i < nx - 1; i++) {
      var sx = 0, sy = 0, sz = 0, n = 0;
      for (var e = 0; e < 12; e++) {
        var A = E[e], a = val[I(i + A[0], j + A[1], k + A[2])], b = val[I(i + A[3], j + A[4], k + A[5])];
        if ((a < 0) !== (b < 0)) { var t = a / (a - b); sx += A[0] + (A[3] - A[0]) * t; sy += A[1] + (A[4] - A[1]) * t; sz += A[2] + (A[5] - A[2]) * t; n++; }
      }
      if (n) { vid[I(i, j, k)] = pos.length / 3; pos.push(min[0] + (i + sx / n) * step, min[1] + (j + sy / n) * step, min[2] + (k + sz / n) * step); }
    }
    var quad = function (a, b, c, d, flip) { if (a < 0 || b < 0 || c < 0 || d < 0) return; if (flip) idx.push(a, c, b, a, d, c); else idx.push(a, b, c, a, c, d); };
    for (k = 1; k < nz - 1; k++) for (j = 1; j < ny - 1; j++) for (i = 1; i < nx - 1; i++) {
      var inside = val[I(i, j, k)] < 0;
      if (inside !== (val[I(i + 1, j, k)] < 0)) quad(vid[I(i, j - 1, k - 1)], vid[I(i, j, k - 1)], vid[I(i, j, k)], vid[I(i, j - 1, k)], !inside);
      if (inside !== (val[I(i, j + 1, k)] < 0)) quad(vid[I(i - 1, j, k - 1)], vid[I(i - 1, j, k)], vid[I(i, j, k)], vid[I(i, j, k - 1)], !inside);
      if (inside !== (val[I(i, j, k + 1)] < 0)) quad(vid[I(i - 1, j - 1, k)], vid[I(i, j - 1, k)], vid[I(i, j, k)], vid[I(i - 1, j, k)], !inside);
    }
    // two gentle smoothing passes, then normals straight from the shape itself
    var p = new Float32Array(pos), nb = new Array(p.length / 3);
    for (i = 0; i < nb.length; i++) nb[i] = [];
    for (i = 0; i < idx.length; i += 3) for (e = 0; e < 3; e++) { var u = idx[i + e], w = idx[i + (e + 1) % 3]; nb[u].push(w); nb[w].push(u); }
    for (var pass = 0; pass < 2; pass++) {
      var q = p.slice();
      for (i = 0; i < nb.length; i++) {
        if (!nb[i].length) continue;
        var ax = 0, ay = 0, az = 0;
        nb[i].forEach(function (o) { ax += p[o * 3]; ay += p[o * 3 + 1]; az += p[o * 3 + 2]; });
        var c = nb[i].length;
        q[i * 3] = p[i * 3] * 0.5 + ax / c * 0.5; q[i * 3 + 1] = p[i * 3 + 1] * 0.5 + ay / c * 0.5; q[i * 3 + 2] = p[i * 3 + 2] * 0.5 + az / c * 0.5;
      }
      p = q;
    }
    var nrm = new Float32Array(p.length), h = step * 0.5;
    for (i = 0; i < p.length; i += 3) {
      var X = p[i], Y = p[i + 1], Z = p[i + 2];
      var gx = f(X + h, Y, Z) - f(X - h, Y, Z), gy = f(X, Y + h, Z) - f(X, Y - h, Z), gz = f(X, Y, Z + h) - f(X, Y, Z - h), gl = Math.sqrt(gx * gx + gy * gy + gz * gz) || 1;
      nrm[i] = gx / gl; nrm[i + 1] = gy / gl; nrm[i + 2] = gz / gl;
    }
    return { pos: p, nrm: nrm, idx: idx };
  }

  /* ---------- traffic cone: tall red cone, one wide reflective sleeve, heavy black eight-sided base (like BAM's) ---------- */
  var cone = tool('cone');
  (function (s) {
    // the base: an octagon with soft edges and a raised collar for the cone to sit in
    var oct = new T.Shape();
    for (var i = 0; i < 8; i++) { var a = i / 8 * Math.PI * 2 + Math.PI / 8, r = 1.04; if (i) oct.lineTo(Math.cos(a) * r, Math.sin(a) * r); else oct.moveTo(Math.cos(a) * r, Math.sin(a) * r); }
    var bg = new T.ExtrudeGeometry(oct, { depth: 0.06, bevelEnabled: true, bevelThickness: 0.08, bevelSize: 0.08, bevelSegments: 8, curveSegments: 8 });
    var base = new T.Mesh(bg, K.rubber); base.rotation.x = -Math.PI / 2; base.position.y = -1.44; s.add(base);
    s.add(lathe([[0.62, -1.24], [0.8, -1.25], [0.82, -1.29], [0.84, -1.32], [0.6, -1.32]], 72, K.rubber));
    // the body with a rolled lip at the bottom and a little open top
    var H = 2.9, r0 = 0.64, r1 = 0.15, y0 = -1.22;
    var R = function (y) { return r0 + (r1 - r0) * (y - y0) / H; };
    s.add(lathe([[0, y0], [r0 + 0.045, y0], [r0 + 0.05, y0 + 0.03], [r0 + 0.01, y0 + 0.07], [r0, y0 + 0.1], [r1, y0 + H], [r1 - 0.004, y0 + H + 0.025], [r1 - 0.025, y0 + H + 0.035], [0.065, y0 + H + 0.02], [0.06, y0 + H - 0.25], [0, y0 + H - 0.25]], 96, K.cone));
    // moulded rings at the top, as on real cones
    [0.25, 0.32].forEach(function (d) { var y = y0 + H - d; s.add(lathe([[R(y) - 0.002, y - 0.012], [R(y) + 0.012, y], [R(y) - 0.002, y + 0.012]], 96, K.cone)); });
    // the sleeve, wrapped on with a sliver of edge showing
    [[0.72, 1.18], [1.6, 1.98]].forEach(function (b) {
      var a1 = y0 + b[0], c1 = y0 + b[1];
      s.add(lathe([[R(a1) - 0.002, a1 - 0.012], [R(a1) + 0.02, a1 + 0.004], [R(c1) + 0.02, c1 - 0.004], [R(c1) - 0.002, c1 + 0.012]], 96, K.reflect));
    });
    s.position.y = 0.06;
  })(cone);

  /* ---------- solar warning light: round amber lens that flashes, orange body, carry hoop and solar cell on top, on its cone mount ---------- */
  var light = tool('light');
  var lens, glow;
  (function (s) {
    var body = lathe([[0, -0.18], [0.6, -0.18], [0.66, -0.14], [0.68, -0.06], [0.68, 0.1], [0.66, 0.15], [0.62, 0.17], [0, 0.17]], 96, K.body);
    body.rotation.x = Math.PI / 2; body.position.y = 0.2; s.add(body);
    var bezel = new T.Mesh(new T.TorusGeometry(0.615, 0.055, 18, 96), K.body); bezel.position.set(0, 0.2, 0.17); s.add(bezel);
    var lp = [[0, 0], [0.59, 0], [0.585, 0.04]], rr = 0.58, zz = 0.04;
    while (rr > 0.12) { zz += 0.006; lp.push([rr - 0.004, zz + 0.022]); rr -= 0.046; lp.push([rr + 0.002, zz]); }
    lp.push([0.1, zz + 0.03], [0, zz + 0.035]);
    lens = lathe(lp, 128, K.lensA);
    lens.rotation.x = Math.PI / 2; lens.position.set(0, 0.2, 0.15); s.add(lens);
    var led = new T.Mesh(new T.SphereGeometry(0.09, 24, 16), K.bulb); led.position.set(0, 0.2, 0.27); led.scale.z = 0.5; s.add(led);
    for (var k = 0; k < 4; k++) {                     // four screws round the bezel
      var a = k / 4 * Math.PI * 2 + Math.PI / 4, sc = new T.Mesh(new T.CylinderGeometry(0.04, 0.04, 0.03, 16), K.reflect);
      sc.rotation.x = Math.PI / 2; sc.position.set(Math.cos(a) * 0.64, 0.2 + Math.sin(a) * 0.64, 0.2); s.add(sc);
    }
    var cellBox = ext(rrect(0.5, 0.32, 0.05), 0.08, 0.02, K.rubber, 2, 8); cellBox.rotation.x = -Math.PI / 2 + 0.25; cellBox.position.set(0, 0.86, 0.02); s.add(cellBox);
    var cell = new T.Mesh(new T.PlaneGeometry(0.42, 0.25), K.solar); cell.rotation.x = -Math.PI / 2 + 0.25; cell.position.set(0, 0.905, 0.03); s.add(cell);
    var hoop = new T.Mesh(new T.TorusGeometry(0.38, 0.05, 18, 64, Math.PI), K.rubber); hoop.position.set(0, 0.95, -0.04); s.add(hoop);
    [-1, 1].forEach(function (x) { var p = new T.Mesh(new T.CylinderGeometry(0.055, 0.055, 0.12, 20), K.body); p.rotation.z = Math.PI / 2; p.position.set(x * 0.38, 0.95, -0.04); s.add(p); });
    var mount = lathe([[0, -0.18], [0.12, -0.18], [0.15, -0.3], [0.17, -0.33], [0.36, -1.28], [0.43, -1.33], [0.43, -1.345], [0, -1.345]], 64, K.body); s.add(mount);
    var foot = new T.Mesh(new T.CylinderGeometry(0.45, 0.47, 0.06, 64), K.rubber); foot.position.y = -1.39; s.add(foot);
    glow = new T.PointLight(0xff8a1a, 0, 5); glow.position.set(0, 0.2, 0.9); s.add(glow);
    var halo = new T.Sprite(new T.SpriteMaterial({ map: canvasTex(128, 128, function (x, w, h) {
      var g = x.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, w / 2);
      g.addColorStop(0, 'rgba(255,214,140,1)'); g.addColorStop(0.25, 'rgba(255,150,40,.55)'); g.addColorStop(1, 'rgba(255,120,0,0)');
      x.fillStyle = g; x.fillRect(0, 0, w, h);
    }), blending: T.AdditiveBlending, transparent: true, depthWrite: false, opacity: 0 }));
    halo.scale.set(2.6, 2.6, 1); halo.position.set(0, 0.2, 0.35); s.add(halo); light.userData.halo = halo;
    s.position.y = 0.3;
  })(light);

  /* ---------- barrier tape: a roll seen from the front, the tape hangs off it and pulls out as you scroll ---------- */
  var tape = tool('tape');
  var ribbon, ribL = 0.6;
  (function (s) {
    var rm = new T.MeshPhysicalMaterial({ map: cautionTex.clone(), roughness: 0.2, clearcoat: 1, clearcoatRoughness: 0.06 }); rm.map.needsUpdate = true; rm.map.repeat.set(1.2, 1);
    var roll = new T.Mesh(new T.CylinderGeometry(0.62, 0.62, 0.5, 96, 1, true), rm); roll.rotation.z = Math.PI / 2; s.add(roll);
    // the sides show the wound layers
    var layers = canvasTex(256, 256, function (x, w, h) {
      x.fillStyle = '#f4f6fa'; x.fillRect(0, 0, w, h);
      for (var r = 128; r > 52; r -= 9) { x.strokeStyle = '#e8322a'; x.lineWidth = 4; x.beginPath(); x.arc(128, 128, r - 2, 0, Math.PI * 2); x.stroke(); }
    });
    var sideM = new T.MeshPhysicalMaterial({ map: layers, roughness: 0.25, clearcoat: 1, clearcoatRoughness: 0.08, side: T.DoubleSide });
    [-1, 1].forEach(function (x) { var r = new T.Mesh(new T.RingGeometry(0.26, 0.62, 96), sideM); r.rotation.y = Math.PI / 2; r.position.x = x * 0.25; s.add(r); });
    [-1, 1].forEach(function (x) { var rim = new T.Mesh(new T.TorusGeometry(0.62, 0.022, 12, 96), K.reflect); rim.rotation.y = Math.PI / 2; rim.position.x = x * 0.25; s.add(rim); });
    var core = new T.Mesh(new T.CylinderGeometry(0.26, 0.26, 0.52, 48, 1, true), K.core); core.rotation.z = Math.PI / 2; s.add(core);
    var inner = new T.Mesh(new T.CylinderGeometry(0.23, 0.23, 0.53, 48, 1, true), toy(0xc89a62, { roughness: 0.4, side: T.BackSide })); inner.rotation.z = Math.PI / 2; s.add(inner);
    [-1, 1].forEach(function (x) { var r = new T.Mesh(new T.RingGeometry(0.23, 0.26, 48), K.core); r.rotation.y = Math.PI / 2; r.position.x = x * 0.26; s.add(r); });
    // the loose end hangs from the front of the roll: a strip from y = 0 down to -1, stretched to its length every frame
    var g = new T.PlaneGeometry(0.48, 1, 1, 12); g.translate(0, -0.5, 0);
    ribbon = new T.Mesh(g, K.ribbon); ribbon.position.set(0, 0, 0.625); s.add(ribbon);
  })(tape);

  /* ---------- pan shovel: dished steel blade, oak handle with a steel D grip ---------- */
  var shovel = tool('shovel');
  (function (s) {
    // the blade is dished, with its sides turned up
    var bw = 26, bh = 30, pos = [], idx = [], uv = [];
    for (var j = 0; j <= bh; j++) for (var i = 0; i <= bw; i++) {
      var u = i / bw * 2 - 1, v = j / bh;                       // v = 0 at the tip, 1 at the top
      var half = 0.64 * Math.sqrt(Math.max(0, Math.sin(Math.min(1, v * 1.25 + 0.05) * Math.PI / 2)));
      var x = u * half, y = -1.15 + v * 1.65;
      if (v < 0.2) x *= 0.75 + v * 1.25;
      var z = -0.16 * Math.pow(Math.abs(u), 3) - 0.04 * (1 - u * u) * v;     // turned-up sides, a gentle dish
      pos.push(x, y, z); uv.push(i / bw, v);
    }
    for (j = 0; j < bh; j++) for (i = 0; i < bw; i++) { var a = j * (bw + 1) + i, b = a + bw + 1; idx.push(a, a + 1, b, b, a + 1, b + 1); }
    var bgm = new T.BufferGeometry();
    bgm.setAttribute('position', new T.Float32BufferAttribute(pos, 3)); bgm.setAttribute('uv', new T.Float32BufferAttribute(uv, 2)); bgm.setIndex(idx); bgm.computeVertexNormals();
    var blade = new T.Mesh(bgm, toy(0x9db4e0, { metalness: 0.45, roughness: 0.18, side: T.DoubleSide }));
    blade.position.set(0, -1.9, 0.02); blade.rotation.x = 0.16; s.add(blade);
    var sock = lathe([[0, -1.3], [0.2, -1.3], [0.17, -1.1], [0.11, -0.72], [0.1, -0.68], [0, -0.68]], 48, K.blade); sock.position.y = -0.1; s.add(sock);
    [0.09, -0.09].forEach(function (x) { var rv = new T.Mesh(new T.SphereGeometry(0.03, 12, 8), K.bright); rv.position.set(x * 0.6, -0.95, 0.115); rv.scale.z = 0.5; s.add(rv); });
    var shaft = new T.Mesh(new T.CylinderGeometry(0.1, 0.11, 3.0, 32, 1), K.wood); shaft.position.y = 0.6; s.add(shaft);
    var ferrule = new T.Mesh(new T.CylinderGeometry(0.125, 0.125, 0.22, 32), K.bright); ferrule.position.y = 2.0; s.add(ferrule);
    var d = tube([[-0.07, 2.08, 0], [-0.3, 2.3, 0], [-0.31, 2.62, 0], [0, 2.78, 0], [0.31, 2.62, 0], [0.3, 2.3, 0], [0.07, 2.08, 0]], 0.06, K.arm, 80); s.add(d);
    var grip = new T.Mesh(new T.CylinderGeometry(0.1, 0.1, 0.56, 32), K.wood); grip.rotation.z = Math.PI / 2; grip.position.y = 2.66; s.add(grip);
    s.position.y = -0.3;
  })(shovel);

  /* ---------- hessian cloth: a tied roll with a length hanging off it, the weave and loose fibres painted in ---------- */
  var hessian = tool('hessian');
  var flap;
  (function (s) {
    var rmat = K.hessian;
    var roll = new T.Mesh(new T.CylinderGeometry(0.55, 0.55, 2.3, 72, 1, true), rmat); roll.rotation.z = Math.PI / 2; s.add(roll);
    // the rolled-up ends: a spiral of layers
    var spiral = canvasTex(256, 256, function (x, w, h) {
      x.fillStyle = '#d89a50'; x.fillRect(0, 0, w, h);
      x.strokeStyle = '#a8692c'; x.lineWidth = 2.5; x.beginPath();
      for (var a = 0; a < Math.PI * 2 * 12; a += 0.05) { var r = 18 + a * 1.45; x.lineTo(128 + Math.cos(a) * r, 128 + Math.sin(a) * r); }
      x.stroke();
      x.fillStyle = '#16203a'; x.beginPath(); x.arc(128, 128, 16, 0, Math.PI * 2); x.fill();
    });
    var ends = new T.MeshPhysicalMaterial({ map: spiral, color: 0x7a7a7a, roughness: 0.55, envMapIntensity: 0.2 });
    [-1, 1].forEach(function (x) { var e = new T.Mesh(new T.CircleGeometry(0.55, 64), ends); e.rotation.y = x * Math.PI / 2; e.position.x = x * 1.151; s.add(e); });
    // two twine ties round the roll
    [-0.7, 0.7].forEach(function (x) { var t = new T.Mesh(new T.TorusGeometry(0.57, 0.04, 16, 96), K.twine); t.rotation.y = Math.PI / 2; t.position.x = x; s.add(t); });
    // the hanging length, with a frayed bottom edge
    var fs = new T.Shape(); fs.moveTo(-1.1, 0); fs.lineTo(1.1, 0); fs.lineTo(1.1, -1.25);
    for (var q = 0; q <= 24; q++) { var qx = 1.1 - q * 2.2 / 24; fs.lineTo(qx, -1.3 - Math.sin(q / 24 * Math.PI * 3) * 0.05 - (q % 2 ? 0 : 0.0)); }
    fs.lineTo(-1.1, 0);
    var fg = new T.ExtrudeGeometry(fs, { depth: 0.02, bevelEnabled: true, bevelThickness: 0.025, bevelSize: 0.025, bevelSegments: 4, curveSegments: 12 });
    var fray = canvasTex(64, 512, function (x, w, h) {
      x.fillStyle = '#fff'; x.fillRect(0, 0, w, h - 26);
      for (var i = 0; i < w; i += 1) { x.fillRect(i, h - 26, 1, 12 + Math.sin(i / w * Math.PI * 6) * 8); }
    }, false, true);
    var fm = K.hessian.clone();
    flap = new T.Mesh(fg, fm); flap.position.set(0, 0, 0.55); s.add(flap);
  })(hessian);

  /* ---------- work gloves, a pair: white knitted gloves with a grey nitrile dipped palm (like BAM's),
     one showing its palm and one its back. The shape is drawn as one smooth skin ---------- */
  var glove = tool('gloves');
  (function (s) {
    var fingers = [   // knuckle, middle, tip (x, y, z), radius at knuckle and tip
      [[-0.33, 0.34, 0.0], [-0.38, 0.84, 0.03], [-0.42, 1.24, 0.09], 0.124, 0.112],
      [[-0.11, 0.4, 0.0], [-0.12, 0.94, 0.03], [-0.13, 1.4, 0.1], 0.128, 0.114],
      [[0.12, 0.38, 0.0], [0.14, 0.9, 0.03], [0.16, 1.3, 0.09], 0.124, 0.112],
      [[0.34, 0.3, 0.0], [0.4, 0.7, 0.03], [0.45, 1.02, 0.08], 0.112, 0.1]
    ];
    var thumb = [[-0.34, -0.3, 0.03], [-0.62, -0.04, 0.08], [-0.82, 0.32, 0.11], 0.142, 0.12];
    var F = function (x, y, z) {
      var d = sdRoundBox(x, y, z, [0, -0.1, 0], [0.38, 0.48, 0.035], 0.1 + 0.02 * Math.max(0, 1 - Math.abs(x) * 2));
      fingers.concat([thumb]).forEach(function (f) {
        var rm = (f[3] + f[4]) / 2;
        d = smin(d, Math.min(sdCapsule(x, y, z, f[0], f[1], [f[3], rm]), sdCapsule(x, y, z, f[1], f[2], [rm, f[4]])), 0.1);
      });
      
      var cuff = Math.max(Math.abs(y + 0.93) - 0.3, Math.sqrt(x * x / Math.pow(0.47 + (-0.66 - y) * 0.08, 2) + z * z / 0.022) - 1) * 0.2;
      d = smin(d, cuff, 0.12);
      // creases: shallow grooves across each finger at the joints, and two palm lines
      var cr = 0;
      fingers.forEach(function (f) {
        [0.42, 0.78].forEach(function (t) {
          var jy = f[0][1] + (f[2][1] - f[0][1]) * t, jx = f[0][0] + (f[2][0] - f[0][0]) * t;
          var dx = x - jx, dy = y - jy;
          if (Math.abs(dx) < 0.14) cr += 0.006 * Math.exp(-dy * dy / 0.0007) * (1 - Math.abs(dx) / 0.14);
        });
      });
      if (y > -0.5 && y < 0.35) cr += 0.003 * Math.exp(-Math.pow(y - 0.18 + x * 0.25, 2) / 0.0012) + 0.003 * Math.exp(-Math.pow(y + 0.12 - x * 0.35, 2) / 0.0012);
      if (y < -0.68) cr += 0.004 * Math.pow(Math.sin(x * 70), 8);   // the ribs of the knitted cuff
      return d + cr;
    };
    var S = surface(F, [-1.05, -1.4, -0.3], [0.7, 1.55, 0.36], small() ? 0.026 : 0.021);
    // which skin is coated: the palm side, and the finger tips all round
    var tipY = function (x) { return x < -0.25 ? 0.9 : x < 0.0 ? 1.06 : x < 0.24 ? 0.98 : 0.76; };
    var wav = function (x, y) { return Math.sin(x * 23) * 0.012 + Math.sin(x * 7 + y * 5) * 0.015; };
    var coated = function (x, y, z, nz) {
      if (y < -0.6 + wav(x, y)) return false;                          // the knitted wrist
      if (nz > -0.2 + wav(x, y) * 4) return true;                      // the palm, and a little way round the sides
      var thumbTip = x < -0.62 && y > 0.18;
      return y > tipY(x) + wav(x, y) || thumbTip;                     // dipped finger tips
    };
    var cuffPart = function (y) { return y < -0.6; };
    var parts = { knit: [], dip: [], cuff: [] };
    for (var i = 0; i < S.idx.length; i += 3) {
      var a = S.idx[i], b = S.idx[i + 1], c = S.idx[i + 2];
      var cx = (S.pos[a * 3] + S.pos[b * 3] + S.pos[c * 3]) / 3, cy = (S.pos[a * 3 + 1] + S.pos[b * 3 + 1] + S.pos[c * 3 + 1]) / 3, cz = (S.pos[a * 3 + 2] + S.pos[b * 3 + 2] + S.pos[c * 3 + 2]) / 3;
      var nz = S.nrm[a * 3 + 2] + S.nrm[b * 3 + 2] + S.nrm[c * 3 + 2];
      (coated(cx, cy, cz, nz / 3) ? parts.dip : cuffPart(cy) ? parts.cuff : parts.knit).push(a, b, c);
    }
    var uvs = new Float32Array(S.pos.length / 3 * 2);
    for (i = 0; i < S.pos.length / 3; i++) { uvs[i * 2] = S.pos[i * 3] * 3.2; uvs[i * 2 + 1] = S.pos[i * 3 + 1] * 3.2; }
    var one = new T.Group();
    [['knit', K.knit], ['dip', K.dip], ['cuff', K.cuff]].forEach(function (p) {
      var g = new T.BufferGeometry();
      g.setAttribute('position', new T.BufferAttribute(S.pos, 3));
      g.setAttribute('normal', new T.BufferAttribute(S.nrm, 3));
      g.setAttribute('uv', new T.BufferAttribute(uvs, 2));
      g.setIndex(parts[p[0]]);
      one.add(new T.Mesh(g, p[1]));
    });
    // the stitched blue hem round the opening, and the dark inside
    var hemPts = []; for (i = 0; i <= 48; i++) { var t = i / 48 * Math.PI * 2; hemPts.push([Math.cos(t) * 0.524, -1.225, Math.sin(t) * 0.152]); }
    var hem = tube(hemPts, 0.045, K.dip, 96); one.add(hem);
    var hole = new T.Mesh(new T.CircleGeometry(1, 48), toy(0x16203a, { roughness: 0.5, side: T.DoubleSide }));
    hole.scale.set(0.5, 0.135, 1); hole.rotation.x = Math.PI / 2; hole.position.y = -1.222; one.add(hole);

    var front = one, back = one.clone();
    front.position.set(-0.32, 0.05, 0.12); front.rotation.set(0, 0.18, 0.12);
    back.position.set(0.42, -0.08, -0.2); back.rotation.set(0, Math.PI - 0.2, -0.16);
    s.add(front); s.add(back);
    s.scale.setScalar(0.92);
  })(glove);

  /* ---------- safety glasses: one clear wrap-round lens, a blue brow and blue arms ---------- */
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
    var lg = new T.ExtrudeGeometry(L, { depth: 0.035, bevelEnabled: true, bevelThickness: 0.014, bevelSize: 0.014, bevelSegments: 3, curveSegments: 48 });
    lg.translate(0, 0, -0.02);
    s.add(new T.Mesh(wrap(lg, 0.32), K.clear));
    var rimPts = L.getSpacedPoints(160).map(function (p) { return [p.x, p.y, -0.32 * p.x * p.x + 0.01]; });
    var frame = tube(rimPts, 0.038, K.arm, 320, true); s.add(frame);
    var cg = wrap(new T.ShapeGeometry(L, 48), 0.32); var coat = new T.Mesh(cg, K.coat); coat.position.z = 0.04; s.add(coat);
    // a thin blue brow along the top of the lens
    var bp = []; for (var i = 0; i <= 32; i++) { var x = -1.16 + i * 2.32 / 32; bp.push([x, 0.24 + 0.1 * Math.cos(x * 1.35) - 0.02, -0.32 * x * x + 0.03]); }
    var brow = tube(bp, 0.036, K.arm, 120); brow.scale.y = 1.6; s.add(brow);
    // nose pads
    [-1, 1].forEach(function (x) { var n = new T.Mesh(new T.SphereGeometry(0.07, 18, 12), K.armDark); n.scale.set(0.6, 1.4, 0.8); n.position.set(x * 0.15, -0.16, -0.06); s.add(n); });
    // the arms: from the lens ends back over the ears, with a soft dark tip
    [-1, 1].forEach(function (x) {
      var z0 = -0.32 * 1.18 * 1.18;
      var arm = tube([[x * 1.17, 0.18, z0], [x * 1.2, 0.17, z0 - 0.5], [x * 1.2, 0.13, z0 - 1.2], [x * 1.18, 0.0, z0 - 1.55], [x * 1.15, -0.2, z0 - 1.72]], 0.05, K.arm, 64);
      arm.scale.y = 1.25; s.add(arm);
      var tip = tube([[x * 1.18, 0.02, z0 - 1.5], [x * 1.16, -0.12, z0 - 1.65], [x * 1.15, -0.2, z0 - 1.72]], 0.058, K.armDark, 24); s.add(tip);
      var hinge = ext(rrect(0.1, 0.18, 0.03), 0.14, 0.02, K.arm, 2, 6); hinge.position.set(x * 1.17, 0.18, z0 + 0.02); s.add(hinge);
    });
  })(goggles);

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
    hessian: { p: [-1.85, -1.35, -1.0], r: [0.35, 0.35, -0.08], s: 0.68 },
    gloves: { p: [1.85, -1.3, 0.9], r: [0.2, -0.45, -0.35], s: 0.76 },
    goggles: { p: [0.5, 1.95, 0.6], r: [0.3, -0.35, 0.12], s: 0.62 },
    tape: { p: [-0.6, -2.05, 1.6], r: [0.3, -0.25, 0.0], s: 0.74 }
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
  // the showcase: in the hero one item at a time, big, turning slowly in the studio light; the next one slides in every few seconds
  var SHOW = false, SHOW_EVERY = 4.6;
  var SHOW_S = { cone: 1.42, light: 1.55, gloves: 1.5, shovel: 0.98, tape: 2.3, hessian: 1.5, goggles: 1.9 };
  // tilt towards you, the three-quarter turn it rests at, and its lean
  var SHOW_R = { cone: [0.2, 0.3, 0], light: [0.12, 0.35, 0], gloves: [0.08, 0.2, 0.1], shovel: [0.15, 0.5, -0.55], tape: [0.22, 0.75, 0.05], hessian: [0.35, 0.55, -0.05], goggles: [0.18, 0.6, 0.05] };
  var SHOW_Y = { cone: -0.05, light: 0.1, gloves: 0.1, shovel: 0.35, tape: 0.2, hessian: 0.2, goggles: 0.3 };
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
    // the warning tape pulls off its roll as you scroll the hero, and rolls back up on the wall
    var tl = lerp(lerp(0.7, 3.0, ease(h * 2.2)) + Math.sin(t * 0.6) * 0.04, 0.55, ease(a * 1.4));
    ribL = Math.max(0.08, tl * (0.35 + 0.65 * out(i0 * 1.4 - 0.35)));
    ribbon.scale.y = ribL;
    ribbon.material.map.repeat.y = ribL / RIB_LEN;
    ribbon.rotation.x = Math.sin(t * 0.9) * 0.08 + 0.1;
    tools.tape.userData.inner.rotation.x = -ribL * 0.4;   // the roll turns as the tape comes off
    // the warning light flashes
    var fl = Math.pow(Math.max(0, Math.sin(t * 4.2)), 6);
    K.lensA.emissiveIntensity = 0.25 + fl * 2.8;
    glow.intensity = fl * 2.2;
    light.userData.halo.material.opacity = fl * 0.9;
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
