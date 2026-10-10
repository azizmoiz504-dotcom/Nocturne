/* Procedural flanged gate valve — turns with scroll in the hero, explodes in "Anatomy". */
(function () {
  const canvas = document.getElementById('gl');
  const api = { ready: false, intro() {}, setAnatomy() {} };
  window.FT3D = api;
  if (!window.THREE || !canvas) return;

  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'high-performance' });
  } catch (e) { canvas.remove(); return; }

  const isSmall = () => innerWidth < 900;
  let pr = Math.min(window.devicePixelRatio || 1, isSmall() ? 1.25 : 1.5);
  renderer.setPixelRatio(pr);
  renderer.outputEncoding = THREE.sRGBEncoding;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;
  renderer.setClearColor(0x000000, 0);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(30, 1, 0.1, 100);
  camera.position.set(0, 0, 14);

  // --- Studio environment built from emissive panels (no external HDRI) ---
  (function buildEnv() {
    const s = new THREE.Scene();
    s.add(new THREE.Mesh(new THREE.BoxGeometry(30, 30, 30), new THREE.MeshBasicMaterial({ color: 0x06080d, side: THREE.BackSide })));
    const panel = (c, k, w, h, x, y, z) => {
      const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h),
        new THREE.MeshBasicMaterial({ color: new THREE.Color(c).multiplyScalar(k), side: THREE.DoubleSide }));
      m.position.set(x, y, z); m.lookAt(0, 0, 0); s.add(m);
    };
    panel(0xffffff, 5.0, 10, 4, 0, 12, 3);
    panel(0xdde6ff, 2.4, 4, 12, -13, 2, 4);
    panel(0xffffff, 3.4, 4, 12, 13, 3, -1);
    panel(0xe0262e, 3.2, 12, 3, 0, -10, -8);
    panel(0x6f8cff, 1.3, 14, 6, 0, 2, -13);
    panel(0xffffff, 1.2, 8, 8, 0, 0, 14);
    const pm = new THREE.PMREMGenerator(renderer);
    scene.environment = pm.fromScene(s, 0.035).texture;
    pm.dispose();
  })();

  const key = new THREE.DirectionalLight(0xffffff, 1.1); key.position.set(5, 8, 6); scene.add(key);
  const rim = new THREE.DirectionalLight(0xe0303a, 1.6); rim.position.set(-6, -2, -6); scene.add(rim);
  scene.add(new THREE.AmbientLight(0x223355, 0.35));

  // --- Materials ---
  const M = {
    body: new THREE.MeshStandardMaterial({ color: 0x084767, metalness: 0.25, roughness: 0.36, envMapIntensity: 0.62 }),
    red: new THREE.MeshStandardMaterial({ color: 0xb91a20, metalness: 0.22, roughness: 0.26 }),
    steel: new THREE.MeshStandardMaterial({ color: 0xd5dae2, metalness: 1, roughness: 0.18 }),
    forged: new THREE.MeshStandardMaterial({ color: 0x9aa2ae, metalness: 1, roughness: 0.32 }),
    dark: new THREE.MeshStandardMaterial({ color: 0x5a616c, metalness: 1, roughness: 0.4 }),
    brass: new THREE.MeshStandardMaterial({ color: 0xd4a54f, metalness: 1, roughness: 0.24 }),
    gasket: new THREE.MeshStandardMaterial({ color: 0x23262c, metalness: 0.2, roughness: 0.7 }),
    void: new THREE.MeshBasicMaterial({ color: 0x030408 })
  };

  const cyl = (rt, rb, h, mat, seg) => new THREE.Mesh(new THREE.CylinderGeometry(rt, rb, h, seg || 40), mat);
  const hex = (r, h, mat) => new THREE.Mesh(new THREE.CylinderGeometry(r, r, h, 6), mat);
  const alongX = (m, x, s) => { m.rotation.z = (s || 1) * Math.PI / 2; m.position.x = x; return m; };
  const ring = (r0, r1, t, mat) => {
    const pts = [[r0, -t], [r1, -t], [r1, t], [r0, t], [r0, -t]].map(p => new THREE.Vector2(p[0], p[1]));
    return new THREE.Mesh(new THREE.LatheGeometry(pts, 64), mat);
  };

  const valve = new THREE.Group();
  const inner = new THREE.Group();
  inner.position.y = -1.45;
  valve.add(inner);
  scene.add(valve);

  const parts = [];
  const anchors = [];
  function part(ex) {
    const g = new THREE.Group();
    g.userData.ex = new THREE.Vector3(ex[0], ex[1], ex[2]);
    inner.add(g); parts.push(g);
    return g;
  }
  function anchor(g, pos, label, sub, cat) {
    const o = new THREE.Object3D(); o.position.set(pos[0], pos[1], pos[2]); g.add(o);
    anchors.push({ o, label, sub, cat });
  }

  // Body: lathe bulb + horizontal run + hubs + end flanges + bonnet flange
  const body = part([0, 0, 0]);
  const prof = [[0, -1.0], [0.5, -1.0], [0.78, -0.86], [0.95, -0.5], [0.98, 0], [0.9, 0.42], [0.72, 0.72], [0.66, 0.86], [0, 0.86]]
    .map(p => new THREE.Vector2(p[0], p[1]));
  body.add(new THREE.Mesh(new THREE.LatheGeometry(prof, 72), M.body));
  body.add(alongX(cyl(0.6, 0.6, 2.9, M.body), 0));
  [-1, 1].forEach(s => {
    body.add(alongX(cyl(0.8, 0.64, 0.32, M.body), s * 1.32, -s));
    body.add(alongX(cyl(1.08, 1.08, 0.2, M.body, 72), s * 1.58));
    body.add(alongX(cyl(0.78, 0.78, 0.04, M.steel), s * 1.70));
    const bore = new THREE.Mesh(new THREE.CircleGeometry(0.46, 48), M.void);
    bore.position.x = s * 1.721; bore.rotation.y = s * Math.PI / 2; body.add(bore);
    // casting rib
  });
  const bf = cyl(0.74, 0.74, 0.14, M.body, 64); bf.position.y = 0.93; body.add(bf);
  anchor(body, [0.2, -0.75, 0.75], 'Valve body', 'Holds the flow', 'gate-valves');

  // Wedge (hidden inside body until exploded)
  const wedge = part([0, -2.7, 0]);
  wedge.add(alongX(cyl(0.55, 0.55, 0.22, M.brass), 0));
  const wb = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.42, 0.34), M.brass); wb.position.y = 0.6; wedge.add(wb);
  anchor(wedge, [0, -0.35, 0.4], 'Gate / wedge', 'Opens & shuts the line', 'gate-valves');

  // Bonnet studs
  const bbolts = part([0, 2.2, 0]);
  for (let i = 0; i < 8; i++) {
    const a = i / 8 * Math.PI * 2 + Math.PI / 8;
    const x = Math.cos(a) * 0.64, z = Math.sin(a) * 0.64;
    const st = cyl(0.04, 0.04, 0.46, M.steel, 12); st.position.set(x, 1.07, z); bbolts.add(st);
    const n = hex(0.085, 0.08, M.steel); n.position.set(x, 1.27, z); bbolts.add(n);
    const n2 = hex(0.085, 0.08, M.steel); n2.position.set(x, 0.82, z); bbolts.add(n2);
  }

  // Bonnet
  const bonnet = part([0, 1.25, 0]);
  const bfl = cyl(0.74, 0.74, 0.14, M.body, 64); bfl.position.y = 1.08; bonnet.add(bfl);
  const bb = cyl(0.3, 0.5, 0.85, M.body); bb.position.y = 1.575; bonnet.add(bb);
  const gl = cyl(0.36, 0.36, 0.1, M.body); gl.position.y = 2.05; bonnet.add(gl);
  const gf = cyl(0.2, 0.2, 0.18, M.brass); gf.position.y = 2.17; bonnet.add(gf);
  anchor(bonnet, [0.42, 1.5, 0.1], 'Bonnet', 'Closes the top of the body', 'gate-valves');

  // Yoke
  const yoke = part([0, 2.0, 0]);
  [-1, 1].forEach(s => { const p = new THREE.Mesh(new THREE.BoxGeometry(0.12, 1.1, 0.2), M.body); p.position.set(s * 0.33, 2.8, 0); yoke.add(p); });
  const yb = cyl(0.4, 0.4, 0.1, M.body); yb.position.y = 2.28; yoke.add(yb);
  const yt = cyl(0.42, 0.42, 0.14, M.body); yt.position.y = 3.36; yoke.add(yt);
  const yn = cyl(0.16, 0.16, 0.26, M.brass); yn.position.y = 3.55; yoke.add(yn);

  // Stem
  const stem = part([0, 2.9, 0]);
  const sm = cyl(0.07, 0.07, 4.3, M.steel, 20); sm.position.y = 1.6; stem.add(sm);
  const threadGeo = new THREE.TorusGeometry(0.072, 0.014, 6, 20);
  for (let y = 2.4; y < 3.7; y += 0.1) {
    const t = new THREE.Mesh(threadGeo, M.steel);
    t.rotation.x = Math.PI / 2; t.position.y = y; stem.add(t);
  }
  anchor(stem, [0.07, 3.0, 0], 'Stem', 'Moves the wedge', null);

  // Handwheel
  const wheel = part([0, 3.7, 0]);
  const wheelSpin = new THREE.Group(); wheelSpin.position.y = 3.98; wheel.add(wheelSpin);
  const rimT = new THREE.Mesh(new THREE.TorusGeometry(0.92, 0.075, 16, 96), M.red); rimT.rotation.x = Math.PI / 2; wheelSpin.add(rimT);
  const knobGeo = new THREE.SphereGeometry(0.085, 10, 8);
  for (let i = 0; i < 12; i++) {
    const k = new THREE.Mesh(knobGeo, M.red);
    const a = i / 12 * Math.PI * 2; k.position.set(Math.cos(a) * 0.92, 0, Math.sin(a) * 0.92); k.scale.set(1, 0.9, 1); wheelSpin.add(k);
  }
  const hub = cyl(0.18, 0.18, 0.22, M.red); wheelSpin.add(hub);
  for (let i = 0; i < 5; i++) {
    const piv = new THREE.Group(); piv.rotation.y = i / 5 * Math.PI * 2;
    const sp = cyl(0.042, 0.055, 0.76, M.red, 16); sp.rotation.z = Math.PI / 2; sp.position.x = 0.54; sp.position.y = -0.02;
    piv.add(sp); wheelSpin.add(piv);
  }
  const tn = hex(0.11, 0.12, M.steel); tn.position.y = 0.16; wheelSpin.add(tn);
  anchor(wheel, [-0.92, 3.98, 0], 'Handwheel', 'Turn to open or close', 'gate-valves');

  // Gaskets, companion flanges and studs (both sides)
  [-1, 1].forEach(s => {
    const gk = part([s * 1.1, 0, 0]);
    gk.add(alongX(ring(0.6, 0.86, 0.028, M.gasket), s * 1.745));
    gk.add(alongX(ring(0.86, 1.0, 0.022, M.steel), s * 1.745));
    if (s > 0) anchor(gk, [s * 1.745, 0.93, 0], 'Gasket', 'Seals the joint', 'gaskets-caf-canf-sheets');

    const cf = part([s * 2.2, 0, 0]);
    cf.add(alongX(cyl(1.08, 1.08, 0.2, M.forged, 72), s * 1.87));
    cf.add(alongX(cyl(0.8, 0.62, 0.34, M.forged), s * 2.13, s));
    cf.add(alongX(cyl(0.6, 0.6, 0.9, M.dark), s * 2.74));
    const bore = new THREE.Mesh(new THREE.CircleGeometry(0.5, 48), M.void);
    bore.position.x = s * 3.191; bore.rotation.y = s * Math.PI / 2; cf.add(bore);
    const lip = alongX(ring(0.5, 0.6, 0.01, M.forged), s * 3.19); cf.add(lip);
    if (s > 0) anchor(cf, [s * 2.9, 0.6, 0], 'Pipe', 'Carries the flow', 'ms-forged-low-pressure-bw-fittings');
    if (s > 0) anchor(cf, [s * 1.87, -1.0, 0.2], 'Flange', 'Joins valve to pipe', 'ss-ms-flanges-forging-casting');

    const bolts = part([s * 3.4, 0, 0]);
    for (let i = 0; i < 8; i++) {
      const a = i / 8 * Math.PI * 2 + Math.PI / 8;
      const y = Math.cos(a) * 0.93, z = Math.sin(a) * 0.93;
      const st = alongX(cyl(0.05, 0.05, 0.78, M.steel, 12), s * 1.74); st.position.y = y; st.position.z = z; bolts.add(st);
      [1.42, 2.06].forEach(x => { const n = alongX(hex(0.1, 0.1, M.steel), s * x); n.position.y = y; n.position.z = z; bolts.add(n); });
    }
    if (s < 0) anchor(bolts, [s * 2.06, 0.93 * Math.cos(Math.PI / 8), 0.93 * Math.sin(Math.PI / 8)], 'Stud bolts & nuts', 'Hold the joint together', null);
  });

  // --- Labels (HTML overlay) ---
  const labelHost = document.getElementById('labels');
  anchors.forEach(a => {
    const el = document.createElement(a.cat ? 'button' : 'div');
    el.className = 'vlabel';
    if (a.cat) { el.dataset.cat = a.cat; el.setAttribute('data-cursor', 'Open'); }
    el.innerHTML = '<i class="vlabel__dot"></i><span class="vlabel__line"></span><span class="vlabel__txt"><b>' + a.label + '</b><small>' + a.sub + '</small></span>';
    labelHost && labelHost.appendChild(el);
    a.el = el;
  });

  // --- State ---
  const st = { anaP: 0, mx: 0, my: 0, intro: 0, introT: null };
  const cur = { x: 2.6, y: 0, ry: -0.6, rx: 0.2, s: 0.3, ex: 0, z: 14 };
  const v = new THREE.Vector3();
  const heroEl = document.getElementById('top');
  const anaEl = document.getElementById('anatomy');

  api.ready = true;
  api.intro = () => { st.introT = performance.now(); };
  api.setAnatomy = p => { st.anaP = p; };

  window.addEventListener('pointermove', e => {
    st.mx = e.clientX / innerWidth * 2 - 1;
    st.my = e.clientY / innerHeight * 2 - 1;
  }, { passive: true });

  let heroVis = true, anaVis = false, heroH = 1, stageOn = true;
  const io = new IntersectionObserver(es => es.forEach(e => {
    if (e.target === heroEl) heroVis = e.isIntersecting; else anaVis = e.isIntersecting;
  }));
  io.observe(heroEl); io.observe(anaEl);
  const measure = () => { heroH = Math.max(1, heroEl.offsetHeight); };
  function resize() {
    const w = innerWidth, h = innerHeight;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    measure();
  }
  resize();
  let rT; window.addEventListener('resize', () => { clearTimeout(rT); rT = setTimeout(resize, 120); });
  window.addEventListener('load', measure);
  if (window.ScrollTrigger) ScrollTrigger.addEventListener('refresh', measure);

  const ease = t => t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
  const clamp = (x, a, b) => Math.max(a, Math.min(b, x));
  let last = performance.now();
  let labelsOn = false, slowAvg = 0.016, frameN = 0;

  function frame(now) {
    requestAnimationFrame(frame);
    const dt = Math.max(0, Math.min(0.05, (now - last) / 1000)); last = now;
    const t = now / 1000;
    const W = innerWidth, H = innerHeight, mobile = W < 900;

    const on = heroVis || anaVis;
    if (on !== stageOn) { stageOn = on; document.body.classList.toggle('off-stage', !on); }
    if (!on) { if (labelsOn) { labelHost.classList.remove('is-on'); labelsOn = false; } return; }
    // a full-screen overlay is covering the valve: don't spend frames on it
    const bc = document.body.classList;
    if (bc.contains('is-shop') || bc.contains('is-menu')) return;

    // adaptive resolution: if frames are slow, render fewer pixels
    if (dt > 0) { slowAvg = slowAvg * 0.95 + dt * 0.05; }
    if (++frameN % 90 === 0 && slowAvg > 0.024 && pr > 0.8) { pr = Math.max(0.75, pr - 0.25); renderer.setPixelRatio(pr); renderer.setSize(innerWidth, innerHeight, false); }

    const halfW = Math.tan(15 * Math.PI / 180) * 14 * camera.aspect;
    const intro = st.introT ? ease(clamp((now - st.introT) / 2200, 0, 1)) : 0;
    let tg;
    if (anaVis && !heroVis) {
      const p = st.anaP;
      const ex = ease(clamp((p - 0.1) / 0.5, 0, 1));
      tg = {
        x: mobile ? 0 : halfW * 0.36, y: mobile ? -1.75 : -0.35,
        ry: -0.75 + p * 1.1 + st.mx * 0.12, rx: 0.32 + st.my * 0.06,
        s: mobile ? 0.34 : 0.5 * clamp(camera.aspect / 1.6, 0.8, 1.1), ex, z: 15
      };
      // the handwheel keeps turning as you scroll through the explode
      wheelSpin.rotation.y = -p * Math.PI * 3;
    } else {
      const hp = clamp(window.scrollY / heroH, 0, 1);
      tg = {
        x: mobile ? 0.15 : halfW * 0.46, y: (mobile ? 1.75 : -0.15) + hp * 2.2,
        ry: -0.55 + Math.sin(t * 0.3) * 0.22 + hp * 1.6 + st.mx * 0.25,
        rx: 0.16 + st.my * 0.1 + hp * 0.35,
        s: (mobile ? 0.39 : 0.86 * clamp(camera.aspect / 1.55, 0.78, 1)) * (0.35 + 0.65 * intro), ex: 0, z: 14
      };
      wheelSpin.rotation.y = -(window.scrollY * 0.006) - t * 0.25;
    }

    const k = 1 - Math.pow(0.0015, dt);
    for (const key in tg) cur[key] += (tg[key] - cur[key]) * k;

    valve.position.set(cur.x, cur.y, 0);
    valve.rotation.set(cur.rx, cur.ry, 0);
    valve.scale.setScalar(cur.s);
    camera.position.z = cur.z;
    parts.forEach(g => g.position.copy(g.userData.ex).multiplyScalar(cur.ex));

    renderer.render(scene, camera);

    // labels
    const show = anaVis && !heroVis && cur.ex > 0.82;
    if (show !== labelsOn) { labelHost.classList.toggle('is-on', show); labelsOn = show; }
    if (show) {
      valve.updateMatrixWorld();
      anchors.forEach(a => {
        a.o.getWorldPosition(v); v.project(camera);
        const x = (v.x * 0.5 + 0.5) * W, y = (-v.y * 0.5 + 0.5) * H;
        const left = mobile ? x > W * 0.5 : x < W * 0.62;
        a.el.classList.toggle('is-left', left);
        a.el.style.transform = 'translate(' + (left ? 'calc(' + x + 'px - 100%)' : x + 'px') + ',' + y + 'px) translateY(-50%)';
      });
    }
  }
  requestAnimationFrame(frame);
})();
