/* Bait Al Maqdis website: the 3D bolt, nut, washer and spanner, drawn in the browser (no picture files).
   In the hero the spanner turns the nut down the thread as you scroll; in "Every fixing" the parts come apart
   with their names. Without 3D (old phone, graphics off) the page shows the flat picture instead. */
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
  renderer.toneMappingExposure = 1.08;
  renderer.setClearColor(0x000000, 0);

  var scene = new T.Scene();
  var camera = new T.PerspectiveCamera(28, 1, 0.1, 100);
  camera.position.set(0, 0, 17);

  /* a studio made of glowing panels, so the metal has something to reflect (white light, one warm orange strip) */
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
    panel(0xffffff, 1.0, 9, 9, 0, 0, 15);
    var pm = new T.PMREMGenerator(renderer);
    scene.environment = pm.fromScene(s, 0.03).texture;
    pm.dispose();
  })();
  var key = new T.DirectionalLight(0xffffff, 1.2); key.position.set(4, 9, 7); scene.add(key);
  var rim = new T.DirectionalLight(0xf5821f, 2.2); rim.position.set(-7, -3, -6); scene.add(rim);
  scene.add(new T.AmbientLight(0x30343c, 0.5));

  var M = {
    chrome: new T.MeshStandardMaterial({ color: 0xe9ecf1, metalness: 1, roughness: 0.11 }),
    satin: new T.MeshStandardMaterial({ color: 0xc8ccd3, metalness: 1, roughness: 0.34 }),
    bolt: new T.MeshStandardMaterial({ color: 0xd8b45e, metalness: 1, roughness: 0.3 }),
    galv: new T.MeshStandardMaterial({ color: 0xc3c8cf, metalness: 1, roughness: 0.36 }),
    washer: new T.MeshStandardMaterial({ color: 0xd2d5db, metalness: 1, roughness: 0.24 }),
    plug: new T.MeshStandardMaterial({ color: 0xd9d6cf, metalness: 0, roughness: 0.55 }),
    nail: new T.MeshStandardMaterial({ color: 0xb9bcc2, metalness: 1, roughness: 0.3 }),
    etch: new T.MeshBasicMaterial({ color: 0x202226, transparent: true, opacity: 0.85, depthWrite: false })
  };

  /* ---------- the parts ---------- */
  var PITCH = 0.17, RMAJ = 0.5, RMIN = RMAJ - 0.62 * PITCH;
  var HEX_R = 0.98;                 // corner radius of the bolt head and the nut
  var HEAD_H = 0.66, NUT_H = 0.82;
  var Y_THREAD0 = -0.85, Y_TIP = -4.6;

  function hexShape(r, hole) {
    var sh = new T.Shape();
    for (var i = 0; i < 6; i++) {
      var a = i / 6 * Math.PI * 2 + Math.PI / 6;
      if (i) sh.lineTo(Math.cos(a) * r, Math.sin(a) * r); else sh.moveTo(Math.cos(a) * r, Math.sin(a) * r);
    }
    sh.closePath();
    if (hole) { var h = new T.Path(); h.absarc(0, 0, hole, 0, Math.PI * 2, true); sh.holes.push(h); }
    return sh;
  }
  /* a shape pushed out to a thickness, lying flat (its thickness along y), centred on y = 0 */
  function slab(shape, depth, bevel, segs, curve) {
    var g = new T.ExtrudeGeometry(shape, { depth: depth - bevel * 2, bevelEnabled: true, bevelThickness: bevel, bevelSize: bevel, bevelSegments: segs || 3, curveSegments: curve || 48 });
    g.translate(0, 0, -(depth - bevel * 2) / 2);
    g.rotateX(-Math.PI / 2);
    g.computeVertexNormals();
    return g;
  }
  /* the thread: a cylinder whose radius follows the V of the thread as it winds down */
  function threadGeo() {
    var cols = 112, perPitch = 14, len = Y_THREAD0 - Y_TIP;
    var rows = Math.round(len / PITCH * perPitch);
    var pos = [], idx = [];
    for (var j = 0; j <= rows; j++) {
      var y = Y_THREAD0 - len * j / rows;
      for (var i = 0; i <= cols; i++) {
        var th = i / cols * Math.PI * 2;
        var ph = ((y / PITCH + th / (Math.PI * 2)) % 1 + 1) % 1;
        var tri = ph < 0.5 ? ph * 2 : (1 - ph) * 2;                   // 0 at the root, 1 at the crest
        tri = Math.min(1, Math.max(0, (tri - 0.08) / 0.84));          // small flats at crest and root
        var r = RMIN + (RMAJ - RMIN) * tri;
        var fromTop = Y_THREAD0 - y, fromTip = y - Y_TIP;
        r = Math.min(r, RMIN + (RMAJ - RMIN) * Math.min(1, fromTop / (PITCH * 1.2)) + 0.0001 + (fromTop < PITCH * 1.2 ? (RMAJ - RMIN) * 0 : 0));
        if (fromTop < PITCH * 1.2) r = Math.max(r, RMIN + (RMAJ - RMIN) * (1 - fromTop / (PITCH * 1.2)));   // runs out into the plain shank
        r = Math.min(r, RMIN * 0.78 + fromTip * 1.1);                  // chamfered tip
        pos.push(Math.cos(th) * r, y, Math.sin(th) * r);
      }
    }
    for (j = 0; j < rows; j++) for (i = 0; i < cols; i++) {
      var a = j * (cols + 1) + i, b = a + cols + 1;
      idx.push(a, a + 1, b, b, a + 1, b + 1);
    }
    var g = new T.BufferGeometry();
    g.setAttribute('position', new T.Float32BufferAttribute(pos, 3));
    g.setIndex(idx);
    g.computeVertexNormals();
    // the seam at 0/360 degrees: share normals so no line shows
    var n = g.attributes.normal;
    for (j = 0; j <= rows; j++) {
      var s0 = j * (cols + 1), s1 = s0 + cols;
      var nx = (n.getX(s0) + n.getX(s1)) / 2, ny = (n.getY(s0) + n.getY(s1)) / 2, nz = (n.getZ(s0) + n.getZ(s1)) / 2;
      var l = Math.sqrt(nx * nx + ny * ny + nz * nz) || 1;
      n.setXYZ(s0, nx / l, ny / l, nz / l); n.setXYZ(s1, nx / l, ny / l, nz / l);
    }
    return g;
  }
  function lathe(pts, segs, mat) {
    return new T.Mesh(new T.LatheGeometry(pts.map(function (p) { return new T.Vector2(p[0], p[1]); }), segs || 72), mat);
  }

  var rig = new T.Group(); scene.add(rig);
  var stage = new T.Group(); rig.add(stage);          // the whole assembly, turned to show it off
  var parts = {};
  function part(name, ex) { var g = new T.Group(); g.userData.ex = ex; stage.add(g); parts[name] = g; return g; }

  // bolt: hex head with a washer face, plain shank, threaded length
  var bolt = part('bolt', [0, 1.1, 0]);
  var head = new T.Mesh(slab(hexShape(HEX_R), HEAD_H, 0.07, 3, 6), M.bolt); head.position.y = HEAD_H / 2 + 0.04; bolt.add(head);
  // the round chamfer that real bolt heads have on top
  bolt.add(lathe([[0, HEAD_H + 0.075], [HEX_R * 0.86, HEAD_H + 0.075], [HEX_R * 0.97, HEAD_H - 0.05], [HEX_R * 0.97, HEAD_H - 0.12], [0, HEAD_H - 0.12]], 72, M.bolt));
  bolt.add(lathe([[0, 0.05], [0.8, 0.05], [0.82, 0.02], [0.8, -0.0], [0, 0]], 72, M.bolt));
  bolt.add(lathe([[0, 0.0], [RMAJ, 0.0], [RMAJ, Y_THREAD0 + 0.0], [0, Y_THREAD0]], 72, M.bolt));
  bolt.add(new T.Mesh(threadGeo(), M.bolt));
  bolt.add(lathe([[0, Y_TIP + 0.001], [RMIN * 0.78, Y_TIP + 0.001], [0, Y_TIP + 0.001]], 48, M.bolt));
  // washer, above the nut
  var washer = part('washer', [0, -0.55, 0]);
  washer.add(lathe([[RMAJ + 0.05, -0.05], [1.12, -0.05], [1.14, -0.03], [1.14, 0.03], [1.12, 0.05], [RMAJ + 0.05, 0.05]], 96, M.washer));

  // nut (galvanised), its hole showing the thread through it
  var nut = part('nut', [0, -1.1, 0]);
  var nutSpin = new T.Group(); nut.add(nutSpin);
  nutSpin.add(new T.Mesh(slab(hexShape(HEX_R, RMAJ * 0.98), NUT_H, 0.09, 3, 6), M.galv));
  [1, -1].forEach(function (s) {    // the turned chamfer ring on both faces
    var y = s * NUT_H / 2;
    nutSpin.add(lathe(s > 0 ? [[RMAJ * 0.98, y + 0.002], [HEX_R * 0.88, y + 0.002], [HEX_R * 0.88, y - 0.002], [RMAJ * 0.98, y - 0.002]] :
      [[RMAJ * 0.98, y - 0.002], [HEX_R * 0.88, y - 0.002], [HEX_R * 0.88, y + 0.002], [RMAJ * 0.98, y + 0.002]], 72, M.satin));
  });

  // combination spanner: ring end on the nut, open end at the far side
  var SP_L = 4.9, SP_T = 0.34;
  function spannerShape() {
    var Ro = 1.42, hw0 = 0.44, hw1 = 0.38, Rj = 1.3, jaw = 0.86, phi = 15 * Math.PI / 180;
    var sh = new T.Shape();
    var a0 = Math.asin(hw0 / Ro);
    sh.moveTo(Math.cos(a0) * Ro, hw0);
    sh.absarc(0, 0, Ro, a0, Math.PI * 2 - a0, false);
    // underside of the handle, slightly waisted
    var bx = SP_L - Math.sqrt(Rj * Rj - hw1 * hw1);
    sh.bezierCurveTo(1.9, -hw0 * 0.86, bx - 0.9, -hw1 * 0.86, bx, -hw1);
    var b0 = Math.PI + Math.asin(hw1 / Rj);
    var rot = function (u, v) { return [SP_L + u * Math.cos(phi) - v * Math.sin(phi), u * Math.sin(phi) + v * Math.cos(phi)]; };
    var ue = Math.sqrt(Rj * Rj - jaw * jaw);
    var p1 = rot(ue, -jaw), aJ1 = Math.atan2(p1[1], p1[0] - SP_L);
    sh.absarc(SP_L, 0, Rj, b0, aJ1 + Math.PI * 2, false);
    var q1 = rot(0, -jaw); sh.lineTo(q1[0], q1[1]);
    sh.absarc(SP_L, 0, jaw, phi - Math.PI / 2, phi - Math.PI * 1.5, true);
    var p2 = rot(ue, jaw); sh.lineTo(p2[0], p2[1]);
    var aJ2 = Math.atan2(p2[1], p2[0] - SP_L), b1 = Math.PI - Math.asin(hw1 / Rj);
    sh.absarc(SP_L, 0, Rj, aJ2, b1, false);
    sh.bezierCurveTo(bx - 0.9, hw1 * 0.86, 1.9, hw0 * 0.86, Math.cos(a0) * Ro, hw0);
    // 12-point ring: two hexagons over each other
    var hole = new T.Path(), rc = HEX_R + 0.02, ap = rc * Math.cos(Math.PI / 6);
    for (var k = 0; k < 24; k++) {
      var ang = k / 24 * Math.PI * 2, r = k % 2 ? ap / Math.cos(Math.PI / 12) : rc;
      ang += Math.PI / 6;
      if (k) hole.lineTo(Math.cos(ang) * r, Math.sin(ang) * r); else hole.moveTo(Math.cos(ang) * r, Math.sin(ang) * r);
    }
    hole.closePath();
    sh.holes.push(hole);
    return sh;
  }
  var spanner = part('spanner', [3.4, -1.1, 0]);
  var spGeo = slab(spannerShape(), SP_T, 0.07, 4, 64);
  spanner.add(new T.Mesh(spGeo, M.chrome));
  // the raised rib down the handle
  (function () {
    var rib = new T.Shape(); rib.moveTo(1.7, 0.2); rib.bezierCurveTo(2.4, 0.16, 3.0, 0.15, 3.55, 0.16); rib.lineTo(3.55, -0.16); rib.bezierCurveTo(3.0, -0.15, 2.4, -0.16, 1.7, -0.2); rib.closePath();
    var g = slab(rib, 0.07, 0.02, 2, 24); g.translate(0, SP_T / 2 + 0.01, 0);
    spanner.add(new T.Mesh(g, M.satin));
  })();

  // only in "Every fixing": a wall plug and a nail
  var plug = part('plug', [-3.2, -2.6, 0.4]);
  (function () {
    var p = [[0, 0.9], [0.2, 0.9], [0.3, 0.86], [0.3, 0.74]];
    for (var i = 0; i < 9; i++) { var y = 0.7 - i * 0.2; p.push([0.36, y], [0.27, y - 0.1]); }
    p.push([0.2, -1.2], [0, -1.24]);
    var m = lathe(p, 48, M.plug); plug.add(m);
    var collar = lathe([[0.18, 0.9], [0.44, 0.9], [0.44, 0.84], [0.3, 0.8], [0.18, 0.8]], 48, M.plug); plug.add(collar);
  })();
  var nail = part('nail', [3.0, -2.9, 0.3]);
  nail.add(lathe([[0, 1.32], [0.3, 1.32], [0.31, 1.28], [0.3, 1.24], [0.09, 1.18], [0.065, 1.1], [0.065, -1.1], [0, -1.5]], 40, M.nail));
  [plug, nail].forEach(function (g) { g.visible = false; });

  /* where each name points, on the part (local position) */
  var anchors = [
    { g: bolt, p: [0, HEAD_H * 0.6, 0.85], id: 'bolt' },
    { g: washer, p: [1.1, 0, 0.1], id: 'washer' },
    { g: nut, p: [0.85, 0, 0.3], id: 'nut' },
    { g: spanner, p: [2.6, SP_T / 2, 0], id: 'spanner' },
    { g: plug, p: [0.36, 0.2, 0], id: 'plug' },
    { g: nail, p: [0.07, 0.3, 0], id: 'nail' }
  ];

  /* ---------- how it sits ---------- */
  var st = { hero: 0, heroPx: 0, ana: 0, appr: 0, exit: 0, intro: 0, mx: 0, my: 0, tx: 0, ty: 0, t: 0, mode: 'hero' };
  var NUT_Y0 = -3.15;      // where the nut sits before you scroll
  function layout() {
    var w = canvas.clientWidth || innerWidth, h = canvas.clientHeight || innerHeight;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  }
  addEventListener('resize', layout);
  layout();

  var lerp = function (a, b, k) { return a + (b - a) * k; };
  var ease = function (x) { x = Math.max(0, Math.min(1, x)); return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2; };
  var out = function (x) { x = Math.max(0, Math.min(1, x)); return 1 - Math.pow(1 - x, 3); };

  var spHold = new T.Group(); stage.add(spHold); spHold.add(spanner); stage.remove(spanner);   // moves the spanner aside in "Every fixing"
  var CENTRE = 1.95;        // the assembly's middle, below the top of the bolt head
  function pose(dt) {
    st.mx += (st.tx - st.mx) * Math.min(1, dt * 3);
    st.my += (st.ty - st.my) * Math.min(1, dt * 3);
    var w = camera.aspect, phone = w < 0.9;
    var h = st.hero, i = out(st.intro);
    var ar = ease(Math.max(st.appr, Math.min(1, st.ana * 2.6)));   // arriving in "Every fixing" (as it scrolls up, then while pinned), still together
    var a = ease(Math.max(0, (st.ana - 0.3) / 0.7));           // then coming apart
    var visW = 2 * camera.position.z * Math.tan(camera.fov * Math.PI / 360) * w;
    // the whole assembly: to the right of the words in the hero, to the right of the words in "Every fixing" too
    var sc = phone ? 0.66 : Math.min(1.3, 0.72 + w * 0.3);
    var side = document.documentElement.dir === 'rtl' ? -1 : 1;   // in Arabic the words are on the right, so the parts go left
    var heroX = phone ? 0.5 : side * visW * 0.2, heroY = phone ? 1.9 : -0.1;
    // on a phone the words sit at the top of the screen, so the parts go below them
    var anaX = phone ? 0.05 : side * visW * 0.17, anaY = phone ? -0.19 * visW / w : -0.1;
    var asc = phone ? 0.46 : Math.min(0.9, 0.55 + w * 0.2);
    // on a phone the parts scroll away with the hero, like a picture; on a computer they rise more slowly
    var rise = phone && st.heroPx ? st.heroPx / (canvas.clientHeight || innerHeight) * visW / w : 3.2;
    rig.position.set(lerp(heroX, anaX, ar), lerp(heroY + h * rise, anaY, ar), 0);
    rig.position.y += st.exit * visW / w;     // leaving "Every fixing": scrolls up with the page
    rig.scale.setScalar(lerp(sc, asc, ar));
    stage.position.y = lerp(lerp(CENTRE, 2.0, ar), 2.25, a) - (1 - i) * 0.3;
    stage.rotation.x = lerp(lerp(0.52, 0.42, ar), 0.2, a) + st.my * 0.1;
    stage.rotation.z = lerp(-0.3, -0.05, a);
    stage.rotation.y = lerp(lerp(-0.5 + h * 0.8, -0.2, ar), -0.35, a) + st.mx * 0.22;
    // the nut and spanner turn together, screwing down the thread; the spanner swings a little while you look
    var swing = Math.sin(st.t * 0.9) * 0.32;
    var turns = h * 2.4 + (1 - i) * 1.4;
    var ny = -3.0 - (h * 2.4 + swing / (Math.PI * 2)) * PITCH + (1 - i) * 1.7;
    var spin = -turns * Math.PI * 2 - swing;
    // falling into place on load
    bolt.position.y = (1 - out(st.intro * 1.7)) * 4.5;
    var nutY = lerp(ny, -5.0, a), wY = lerp(ny + NUT_H / 2 + 0.07, -4.25, a);
    nut.position.set(0, nutY, 0);
    nutSpin.rotation.y = lerp(spin, -Math.PI / 6 + st.t * 0.25, a);
    washer.position.set(0, wY + (1 - out(st.intro * 1.5 - 0.1)) * -3, 0);
    spanner.position.set(0, 0, 0);
    spanner.rotation.set(0, lerp(spin + api.spOff, -1.35, a), 0);
    spHold.position.set(lerp((1 - out(st.intro * 1.3 - 0.25)) * 8, 2.0, a), lerp(ny, 0.5, a), lerp(0, 0.5, a));
    spHold.rotation.set(lerp(0, 1.0, a), 0, lerp(0, 0.06, a));
    bolt.position.y += 0.9 * a;
    // the extras arrive in "Every fixing"
    [plug, nail].forEach(function (g) { g.visible = a > 0.02; g.scale.setScalar(Math.max(0.001, out(st.ana * 1.4 - 0.2))); });
    plug.position.set(-2.7, lerp(-6, -0.6, a), 0.3);
    plug.rotation.set(0.2, st.t * 0.3, lerp(0, -0.18, a));
    nail.position.set(-2.6, lerp(-7, -3.9, a), 0.2);
    nail.rotation.set(0, st.t * 0.3, lerp(0, 0.22, a));
  }

  /* the names in "Every fixing" follow their parts */
  var v = new T.Vector3();
  function placeLabels() {
    var L = api.labels;
    if (!L) return;
    var rect = canvas.getBoundingClientRect(), box = null, ox = 0, oy = 0;
    anchors.forEach(function (an) {
      var el = L[an.id];
      if (!el) return;
      if (!box) { box = el.parentNode.getBoundingClientRect(); ox = rect.left - box.left; oy = rect.top - box.top; }   // the names sit in the section, the canvas is fixed
      v.set(an.p[0], an.p[1], an.p[2]);
      an.g.localToWorld(v);
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
    if (st.intro < 1) st.intro = Math.min(1, st.intro + Math.min(0.2, raw) / 2.2);   // real time, so a slow phone still finishes it
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
  api.setLabels = function (map) { api.labels = map; };
  api.spOff = 1.4;
  api.ready = true;
  // the stamped text needs the page's letters loaded first; the rest can start now
  requestAnimationFrame(frame);
  document.documentElement.classList.add('has-gl');
  if (window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches) st.intro = 1;
  addEventListener('pointermove', function (e) { if (e.pointerType === 'mouse') { st.tx = e.clientX / innerWidth * 2 - 1; st.ty = e.clientY / innerHeight * 2 - 1; } }, { passive: true });
  document.addEventListener('visibilitychange', function () { if (!document.hidden) last = performance.now(); });
})();
