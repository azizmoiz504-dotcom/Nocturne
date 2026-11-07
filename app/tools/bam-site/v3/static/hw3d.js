/* Bait Al Maqdis website: the safety and site items in the hero and on the "Site safety" wall.
   These are BAM's own product photos (traffic cone, solar warning light, warning tape, pan shovel, hessian cloth,
   dotted gloves, safety goggles), cut out of their white backgrounds. They float together in the hero,
   drift with the mouse, open out as you scroll, then fly onto the wall, each with its name.
   Only CSS transforms move, so a phone draws it as easily as it scrolls the page.
   The same calls as the old 3D (BAM3D.hero, .anatomy, .show ...) so motion.js drives it unchanged. */
(function () {
  'use strict';
  var stageEl = document.getElementById('gl');
  var api = { ready: false, hero: function () {}, anatomy: function () {}, labels: [] };
  window.BAM3D = api;
  if (!stageEl) { document.documentElement.classList.add('no-gl'); return; }
  var BASE = ((document.currentScript && document.currentScript.src) || '').replace(/[^\/]*$/, '') + 'img/';

  /* the scene is measured in "units": the screen is VIS_H units tall, so the layouts below fit any size */
  var VIS_H = 8.5, CAM = 17;
  // each photo: its width in units, and the point the halo of the warning light sits on (fractions of the photo)
  var ITEMS = {
    cone: { w: 1.85 }, light: { w: 1.05 }, tape: { w: 1.65 }, shovel: { w: 4.4 },
    hessian: { w: 2.6 }, gloves: { w: 2.3 }, goggles: { w: 2.3 }
  };
  // the rendered frames of each item: how many, how they sit in the sheet, and their height to width
  var SPR = {"cone":{"n":28,"cols":7,"rows":4,"ar":1.614},"gloves":{"n":28,"cols":7,"rows":4,"ar":0.9675},"goggles":{"n":28,"cols":7,"rows":4,"ar":0.5},"hessian":{"n":28,"cols":7,"rows":4,"ar":0.7025},"light":{"n":28,"cols":7,"rows":4,"ar":2.3834},"shovel":{"n":28,"cols":7,"rows":4,"ar":0.27},"tape":{"n":28,"cols":7,"rows":4,"ar":1.3731}}, SPR_V = '2', FPS = 13;
  var order = ['cone', 'light', 'tape', 'shovel', 'hessian', 'gloves', 'goggles'];
  // the hero group: p = [x, y, depth], r = turn (radians, anticlockwise), s = size
  var HERO = {
    shovel: { p: [2.05, 0.6, -1.4], r: 0.95, s: 1 },
    cone: { p: [-0.05, -0.05, 0.2], r: 0.04, s: 1.08 },
    light: { p: [-1.75, 1.45, -0.6], r: 0.1, s: 1 },
    hessian: { p: [-1.75, -1.5, -1.0], r: -0.08, s: 0.95 },
    gloves: { p: [2.0, -1.65, 0.9], r: -0.3, s: 0.95 },
    goggles: { p: [0.55, 1.95, 0.6], r: 0.12, s: 0.9 },
    tape: { p: [-0.15, -2.05, 1.6], r: 0.05, s: 0.9 }
  };
  // "Site safety": on the wall in two rows, the shovel standing at the end
  var WALL = {
    cone: { p: [-2.75, 1.45], r: 0, s: 0.8 }, light: { p: [-0.85, 1.65], r: 0, s: 0.85 }, gloves: { p: [1.0, 1.6], r: 0, s: 0.8 },
    tape: { p: [-2.7, -2.0], r: 0, s: 0.95 }, hessian: { p: [-0.75, -2.0], r: 0, s: 0.72 }, goggles: { p: [1.05, -2.0], r: 0, s: 0.72 },
    shovel: { p: [2.85, -0.15], r: 1.5708, s: 0.95 }
  };
  // a phone: narrow and tall, three rows
  var WALL_PHONE = {
    cone: { p: [-1.75, 3.6], s: 0.75 }, light: { p: [0.45, 3.7], s: 0.8 },
    gloves: { p: [-1.75, -0.05], s: 0.8 }, goggles: { p: [0.45, -0.25], s: 0.72 },
    tape: { p: [-1.75, -3.15], s: 0.9 }, hessian: { p: [0.45, -3.1], s: 0.66 },
    shovel: { p: [2.35, -0.1], s: 0.82 }
  };
  // where each name sits: units above the middle of its item on the wall
  var LABEL = { cone: 1.5, light: 1.45, gloves: 1.25, tape: 1.0, hessian: 1.1, goggles: 0.65, shovel: 2.2 };
  var LABEL_PHONE = { gloves: 1.15 };
  var START = { cone: [0, -8, 1], light: [-6, 6, -1], shovel: [7, 5, -2], hessian: [-7, -5, -1], gloves: [6, -6, 2], goggles: [2, 8, 1], tape: [-3, -9, 3] };

  /* ---------- build the photos ---------- */
  var els = {}, spr = {}, halo = null, ready = 0;
  order.forEach(function (name, k) {
    var box = document.createElement('div'); box.className = 'ph ph--' + name;
    var M = SPR[name], s = document.createElement('i'); s.className = 'ph__s';
    s.style.backgroundSize = (M.cols * 100) + '% ' + (M.rows * 100) + '%';
    box.style.setProperty('--ar', M.ar);
    var img = new Image(); img.decoding = 'async';
    img.onload = function () { s.style.backgroundImage = 'url(' + img.src + ')'; box.classList.add('is-in'); if (++ready === order.length) document.documentElement.classList.add('gl-models'); };
    img.src = BASE + 'spin-' + name + '.webp?v=' + SPR_V;
    box.appendChild(s); spr[name] = { el: s, f: -1 };
    if (name === 'light') { halo = document.createElement('i'); halo.className = 'ph__halo'; box.appendChild(halo); }
    stageEl.appendChild(box);
    els[name] = box;
  });

  var W = 1, H = 1, U = 1;
  function size() {
    W = stageEl.clientWidth || innerWidth; H = stageEl.clientHeight || innerHeight; U = H / VIS_H;
    order.forEach(function (n) { var w = ITEMS[n].w * U; els[n].style.width = w.toFixed(1) + 'px'; els[n].style.height = (w * SPR[n].ar).toFixed(1) + 'px'; });
  }
  addEventListener('resize', size);
  size();

  /* ---------- helpers ---------- */
  var lerp = function (a, b, k) { return a + (b - a) * k; };
  var clamp01 = function (x) { return Math.max(0, Math.min(1, x)); };
  var ease = function (x) { x = clamp01(x); return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2; };
  var out = function (x) { x = clamp01(x); return 1 - Math.pow(1 - x, 3); };
  var back = function (x) { x = clamp01(x); var c = 1.4; return 1 + (c + 1) * Math.pow(x - 1, 3) + c * Math.pow(x - 1, 2); };

  var st = { hero: 0, heroPx: 0, ana: 0, appr: 0, exit: 0, intro: 0, mx: 0, my: 0, tx: 0, ty: 0, t: 0 };
  var placed = {};    // where each item is drawn this frame, in units, for the names

  function pose(dt) {
    st.mx += (st.tx - st.mx) * Math.min(1, dt * 3);
    st.my += (st.ty - st.my) * Math.min(1, dt * 3);
    var aspect = W / H, phone = aspect < 0.9, rtl = document.documentElement.dir === 'rtl', side = rtl ? -1 : 1;
    var visW = VIS_H * aspect, h = st.hero, t = st.t;
    var ar = ease(Math.max(st.appr, Math.min(1, st.ana * 2.6)));   // the group moves to the wall section
    var a = clamp01((st.ana - 0.22) / 0.7);                       // then the items go onto the wall
    var sc = Math.min(1.02, 0.6 + aspect * 0.26), heroX = side * visW * 0.22, heroY = 0.1;
    if (phone) {   // the group fits the space above the title, under the header
      var top = 78, room = Math.min(W * 0.92, 470);
      sc = Math.min(0.6, (room - top + 24) / H * VIS_H / 5.9, visW / 5.6);
      heroX = 0; heroY = VIS_H / 2 - (top + room) / 2 / H * VIS_H + 0.2 * sc;
    }
    var anaX = phone ? 0 : side * visW * 0.2, anaY = phone ? -1.7 : -0.3;
    var asc = phone ? Math.min(0.5, visW / 7.4) : Math.min(0.84, 0.58 + aspect * 0.16);
    var rise = phone && st.heroPx ? st.heroPx / H * VIS_H : 3.2;
    var rx = lerp(heroX, anaX, ar), ry = lerp(heroY + h * rise, anaY, ar) + st.exit * VIS_H, rs = lerp(sc, asc, ar);
    var spread = 1 + h * 0.35;
    order.forEach(function (name, k) {
      var Hh = HERO[name], Wl = WALL[name];
      if (phone) Wl = { p: WALL_PHONE[name].p, r: Wl.r, s: WALL_PHONE[name].s };
      var ik = back(st.intro * 1.6 - k * 0.09), S = START[name];
      var bob = Math.sin(t * 0.9 + k * 1.7) * 0.08, sway = Math.sin(t * 0.7 + k * 2.3) * 0.04;
      // in the hero: its place in the group, opening out as you scroll, drifting with the mouse by its depth
      var z = Hh.p[2], par = (1 - ar) * (z + 2) * 0.12;
      var hx = lerp(S[0], Hh.p[0] * spread * side, ik) + st.mx * par, hy = lerp(S[1], Hh.p[1] * spread, ik) + bob - st.my * par;
      var persp = CAM / (CAM - z * (1 - ar) * 0.9);
      var hr = (Hh.r + sway + (1 - ik) * 1.2) * side, hs = Hh.s * persp;
      // on the wall: they arrive one after another and hang with a gentle swing
      var ak = ease((a - k * 0.045) / 0.73);
      var wx = Wl.p[0] * side, wy = Wl.p[1], wr = (Wl.r + Math.sin(t * 0.8 + k * 1.3) * 0.02) * side;
      var x = lerp(hx, wx, ak), y = lerp(hy, wy, ak) + Math.sin(ak * Math.PI) * 0.5;
      var r = lerp(hr, wr, ak), s = Math.max(0.001, lerp(hs, Wl.s, ak)) * (1 + Math.sin(ak * Math.PI) * 0.12);
      // to the screen
      var X = rx + x * rs, Y = ry + y * rs, Sc = s * rs;
      placed[name] = [X, Y, Sc];
      var px = W / 2 + X * U, py = H / 2 - Y * U;
      els[name].style.transform = 'translate3d(' + px.toFixed(1) + 'px,' + py.toFixed(1) + 'px,0) translate(-50%,-50%) rotate(' + (-r).toFixed(4) + 'rad) scale(' + Sc.toFixed(4) + ')' + (rtl ? ' scaleX(-1)' : '');
      els[name].style.zIndex = String(Math.round((z + 3) * 10));
      els[name].style.opacity = String(clamp01(st.intro * 3 - k * 0.15));
    });
    // each item turns: its rendered frames play back and forth, and scrolling turns them a little more
    order.forEach(function (name, k) {
      var M = SPR[name], n2 = M.n * 2 - 2, q = Math.floor(t * FPS + k * 7 + (st.hero + st.ana) * 26) % n2;
      if (q < 0) q += n2;
      var f = q < M.n ? q : n2 - q, S2 = spr[name];
      if (f !== S2.f) { S2.f = f; S2.el.style.backgroundPosition = (M.cols > 1 ? (f % M.cols) / (M.cols - 1) * 100 : 0) + '% ' + (M.rows > 1 ? Math.floor(f / M.cols) / (M.rows - 1) * 100 : 0) + '%'; }
    });
    // the warning light flashes
    if (halo) halo.style.opacity = String(Math.pow(Math.max(0, Math.sin(t * 4.2)), 6).toFixed(3));
  }

  /* the names on the wall follow their items */
  function placeLabels() {
    var L = api.labels;
    if (!L) return;
    var phone = W / H < 0.9, box = null, ox = 0, oy = 0, rect = stageEl.getBoundingClientRect();
    order.forEach(function (id) {
      var el = L[id], p = placed[id];
      if (!el || !p) return;
      if (!box) { box = el.parentNode.getBoundingClientRect(); ox = rect.left - box.left; oy = rect.top - box.top; }
      var up = (phone && LABEL_PHONE[id]) || LABEL[id];
      var x = ox + W / 2 + p[0] * U, y = oy + H / 2 - (p[1] + up * p[2] / (WALL[id].s || 1) * (phone ? (WALL_PHONE[id].s / (WALL[id].s || 1)) : 1)) * U;
      el.style.transform = 'translate3d(' + x.toFixed(1) + 'px,' + y.toFixed(1) + 'px,0)';
    });
  }

  var last = performance.now(), visible = true;
  function frame(now) {
    requestAnimationFrame(frame);
    var raw = (now - last) / 1000, dt = Math.min(0.05, raw); last = now;
    if (!visible) return;
    st.t += dt;
    if (st.intro < 1) st.intro = Math.min(1, st.intro + Math.min(0.2, raw) / 2.0);
    pose(dt);
    if (st.ana > 0.01) placeLabels();
  }

  api.hero = function (p, px) { st.hero = p; if (px) st.heroPx = px; };
  api.anatomy = function (p) { st.ana = p; };
  api.approach = function (p) { st.appr = p; };
  api.exit = function (p) { st.exit = p; };
  api.show = function (on) { visible = on; stageEl.style.visibility = on ? 'visible' : 'hidden'; if (on) last = performance.now(); };
  api.pointer = function (x, y) { st.tx = x; st.ty = y; };
  api.skipIntro = function () { st.intro = 1; };
  api.at = function (sec) { st.t = sec; };   // for tests: jump the clock
  api.setLabels = function (map) {
    api.labels = map;
    order.forEach(function (id) { var el = map[id]; if (el) { el.classList.remove('flabel--left', 'flabel--right'); el.classList.add('flabel--up'); } });
  };
  api.ready = true;
  requestAnimationFrame(frame);
  document.documentElement.classList.add('has-gl');
  if (window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches) st.intro = 1;
  addEventListener('pointermove', function (e) { if (e.pointerType === 'mouse') { st.tx = e.clientX / innerWidth * 2 - 1; st.ty = e.clientY / innerHeight * 2 - 1; } }, { passive: true });
  document.addEventListener('visibilitychange', function () { if (!document.hidden) last = performance.now(); });
})();
