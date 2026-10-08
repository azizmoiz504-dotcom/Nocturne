// Hero scene — a weld-neck flange joint, built procedurally.
// Exposes window.AQMHero.create(canvas) → { setProgress(p), intro(), dispose() }
import * as THREE from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js';
import { toCreasedNormals } from 'three/examples/jsm/utils/BufferGeometryUtils.js';

const TAU = Math.PI * 2;
const clamp01 = (v) => Math.min(1, Math.max(0, v));
const rng = (p, a, b) => clamp01((p - a) / (b - a));
const lerp = (a, b, t) => a + (b - a) * t;
const easeIO = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
const easeOut = (t) => 1 - Math.pow(1 - t, 4);
const expoOut = (t) => (t >= 1 ? 1 : 1 - Math.pow(2, -10 * t));

// ---- Dimensions (1 unit = 100 mm; proportions of an NPS 6 Class 300 WN-RF flange) ----
const D = {
  rOut: 1.59, t: 0.35, rRF: 1.08, hRF: 0.04, rHub: 1.03, rNeck: 0.86, lHub: 0.62, rBore: 0.77,
  rBC: 1.35, rHole: 0.115, bolts: 8, gasket: 0.045, pipe: 1.45,
  nutR: 0.19, nutH: 0.16, studR: 0.092,
};
const SEQ = [1, 5, 3, 7, 2, 6, 4, 8]; // star-pattern bolt-up sequence

// ---------------------------------------------------------------------------
// Procedural textures
// ---------------------------------------------------------------------------
function canvasTex(w, h, draw, { color = false, repeat } = {}) {
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  draw(c.getContext('2d'), w, h);
  const t = new THREE.CanvasTexture(c);
  if (color) t.colorSpace = THREE.SRGBColorSpace;
  if (repeat) { t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(...repeat); }
  t.anisotropy = 8;
  return t;
}
// Concentric serrations for the raised face (planar UVs, centred).
const serrations = () => canvasTex(1024, 1024, (g, w) => {
  g.fillStyle = '#808080'; g.fillRect(0, 0, w, w);
  const c = w / 2;
  for (let r = 0; r < c; r += 3.2) {
    g.strokeStyle = (r / 3.2) % 2 < 1 ? '#a8a8a8' : '#5a5a5a';
    g.lineWidth = 1.6;
    g.beginPath(); g.arc(c, c, r, 0, TAU); g.stroke();
  }
});
// Spiral-wound gasket winding: steel strip + graphite filler.
const winding = () => canvasTex(1024, 1024, (g, w) => {
  const c = w / 2;
  g.fillStyle = '#2a2d33'; g.fillRect(0, 0, w, w);
  for (let r = c * 0.78; r < c; r += 4.2) {
    g.strokeStyle = '#c9cfd9'; g.lineWidth = 1.8;
    g.beginPath(); g.arc(c, c, r, 0, TAU); g.stroke();
  }
}, { color: true });
const threads = () => canvasTex(8, 256, (g, w, h) => {
  const grd = g.createLinearGradient(0, 0, 0, h);
  for (let i = 0; i <= 8; i++) grd.addColorStop(i / 8, i % 2 ? '#202020' : '#e0e0e0');
  g.fillStyle = grd; g.fillRect(0, 0, w, h);
}, { repeat: [1, 14] });
const sprite = () => canvasTex(64, 64, (g, w) => {
  const grd = g.createRadialGradient(w / 2, w / 2, 0, w / 2, w / 2, w / 2);
  grd.addColorStop(0, 'rgba(255,255,255,1)'); grd.addColorStop(0.25, 'rgba(255,255,255,0.5)'); grd.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = grd; g.fillRect(0, 0, w, w);
}, { color: true });

// ---------------------------------------------------------------------------
// Geometry
// ---------------------------------------------------------------------------
const crease = (geo, a = 0.55) => toCreasedNormals(geo, a);

// A flat ring/disk with optional bolt holes, lying in XZ, spanning y ∈ [y0, y0 + depth].
function plate(rOut, rIn, depth, y0, holes = 0, rHole = 0, bevel = 0.012) {
  const s = new THREE.Shape();
  s.absarc(0, 0, rOut, 0, TAU, false);
  const h = new THREE.Path(); h.absarc(0, 0, rIn, 0, TAU, true); s.holes.push(h);
  for (let k = 0; k < holes; k++) {
    const a = (k / holes) * TAU + Math.PI / holes;
    const p = new THREE.Path(); p.absarc(Math.cos(a) * D.rBC, Math.sin(a) * D.rBC, rHole, 0, TAU, true); s.holes.push(p);
  }
  const g = new THREE.ExtrudeGeometry(s, { depth: depth - 2 * bevel, bevelEnabled: bevel > 0, bevelThickness: bevel, bevelSize: bevel, bevelSegments: 2, curveSegments: 112 });
  g.translate(0, 0, bevel);
  g.rotateX(Math.PI / 2); // extrusion z → -y
  g.translate(0, y0 + depth, 0);
  return g;
}

function lathe(profile, seg = 128) {
  return crease(new THREE.LatheGeometry(profile.map(([r, y]) => new THREE.Vector2(r, y)), seg));
}

// Weld-neck flange body: raised face + hub + bore (lathe) plus the drilled disk (extrude).
function flangeGeos() {
  const { rOut, t, rRF, hRF, rHub, rNeck, lHub, rBore } = D;
  const fil = [];
  for (let i = 0; i <= 6; i++) { // hub-to-disk fillet
    const a = (i / 6) * (Math.PI / 2);
    fil.push([rHub + 0.09 - Math.sin(a) * 0.09, -t - (1 - Math.cos(a)) * 0.09]);
  }
  const body = lathe([
    [rBore, hRF], [rRF - 0.01, hRF], [rRF, hRF - 0.01], [rRF, 0], [rHub + 0.09, -t + 0.001],
    ...fil, [rNeck + 0.02, -t - lHub + 0.03], [rNeck, -t - lHub], [rBore + 0.01, -t - lHub], [rBore, -t - lHub + 0.01], [rBore, hRF],
  ]);
  const face = new THREE.RingGeometry(rBore + 0.004, rRF - 0.012, 128, 1);
  face.rotateX(-Math.PI / 2);
  face.translate(0, hRF + 0.0015, 0);
  const disk = plate(rOut, rRF - 0.06, t, -t, D.bolts, D.rHole, 0.014);
  return { body, face, disk };
}

function nutGeo() {
  const r = D.nutR, h = D.nutH / 2, c = 0.035;
  const g = lathe([[D.studR + 0.01, -h], [r * 0.82, -h], [r, -h + c], [r, h - c], [r * 0.82, h], [D.studR + 0.01, h], [D.studR + 0.01, -h]], 6);
  g.rotateY(Math.PI / 6);
  return g;
}

// ---------------------------------------------------------------------------
export function create(canvas, { reduced = false, mobile = false } = {}) {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'high-performance' });
  if (!renderer.getContext()) throw new Error('No WebGL');
  let dpr = Math.min(devicePixelRatio || 1, mobile ? 1.5 : 1.75);
  renderer.setPixelRatio(dpr);
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;
  renderer.setClearColor(0x000000, 0);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(32, 1, 0.03, 80);

  // Atmosphere painted into the scene background (the bloom pass makes the canvas opaque,
  // so the night sky, glows and drafting grid live in here rather than in CSS).
  const bgCanvas = document.createElement('canvas');
  const bgTex = new THREE.CanvasTexture(bgCanvas);
  bgTex.colorSpace = THREE.SRGBColorSpace;
  scene.background = bgTex;
  const drawBg = (w, h) => {
    const k = 0.5, cw = Math.max(2, Math.round(w * k)), ch = Math.max(2, Math.round(h * k));
    bgCanvas.width = cw; bgCanvas.height = ch;
    const g = bgCanvas.getContext('2d');
    g.fillStyle = '#03050a'; g.fillRect(0, 0, cw, ch);
    const glow = (x, y, r, stops) => {
      const gr = g.createRadialGradient(x, y, 0, x, y, r);
      stops.forEach(([o, c]) => gr.addColorStop(o, c));
      g.fillStyle = gr; g.fillRect(0, 0, cw, ch);
    };
    const m = Math.max(cw, ch);
    glow(cw * 0.86, ch * 1.08, m * 0.58, [[0, 'rgba(255,138,61,0.30)'], [0.55, 'rgba(255,138,61,0.07)'], [1, 'rgba(255,138,61,0)']]);
    glow(cw * 0.04, -ch * 0.12, m * 0.62, [[0, 'rgba(95,134,216,0.26)'], [1, 'rgba(95,134,216,0)']]);
    // drafting grid, faded towards the edges
    const step = 88 * k, gx = cw * 0.62, gy = ch * 0.48;
    g.save();
    g.strokeStyle = 'rgba(167,177,196,0.075)'; g.lineWidth = 1;
    g.beginPath();
    for (let x = (cw / 2) % step; x < cw; x += step) { g.moveTo(x + 0.5, 0); g.lineTo(x + 0.5, ch); }
    for (let y = (ch / 2) % step; y < ch; y += step) { g.moveTo(0, y + 0.5); g.lineTo(cw, y + 0.5); }
    g.stroke();
    g.globalCompositeOperation = 'destination-in';
    const mask = g.createRadialGradient(gx, gy, 0, gx, gy, m * 0.62);
    mask.addColorStop(0, 'rgba(0,0,0,1)'); mask.addColorStop(1, 'rgba(0,0,0,0)');
    g.fillStyle = mask; g.fillRect(0, 0, cw, ch);
    g.restore();
    // re-lay the base under the masked grid
    g.globalCompositeOperation = 'destination-over';
    g.fillStyle = '#03050a'; g.fillRect(0, 0, cw, ch);
    glow(cw * 0.86, ch * 1.08, m * 0.58, [[0, 'rgba(255,138,61,0.30)'], [0.55, 'rgba(255,138,61,0.07)'], [1, 'rgba(255,138,61,0)']]);
    g.globalCompositeOperation = 'source-over';
    bgTex.needsUpdate = true;
  };

  // --- Environment: a dark studio lit by a cool softbox and an amber strip (the brand palette) ---
  const env = new THREE.Scene();
  env.background = new THREE.Color(0x04060b);
  const panel = (hex, k, pos, scale) => {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.MeshBasicMaterial({ color: new THREE.Color(hex).multiplyScalar(k), side: THREE.DoubleSide }));
    m.position.set(...pos); m.scale.set(...scale); m.lookAt(0, 0, 0); env.add(m);
  };
  panel(0xa9c0ff, 3.2, [-6, 6, 5], [9, 4, 1]);
  panel(0xff8a3d, 7, [7, -1, 2], [1.1, 10, 1]);
  panel(0xffffff, 5, [0, 9, -3], [14, 0.8, 1]);
  panel(0x2c4a8a, 1.6, [-8, -3, -3], [7, 7, 1]);
  panel(0xff9a50, 2.4, [-3, -7, 6], [7, 0.8, 1]);
  panel(0xdfe8ff, 2.2, [2, 2, 9], [5, 2.2, 1]);
  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(env, 0.03).texture;
  pmrem.dispose();
  const key = new THREE.DirectionalLight(0xffc49a, 1.4); key.position.set(5, -2, 4); scene.add(key);
  const rim = new THREE.DirectionalLight(0x9fb6ff, 1.1); rim.position.set(-4, 5, -3); scene.add(rim);
  scene.add(new THREE.HemisphereLight(0x8fa6d8, 0x1a0e06, 0.35));

  // --- Materials ---
  const steel = new THREE.MeshPhysicalMaterial({ color: 0xc7ced9, metalness: 1, roughness: 0.27, envMapIntensity: 1.15, side: THREE.DoubleSide });
  const serr = serrations();
  serr.repeat.set(1 / (2 * D.rRF), 1 / (2 * D.rRF)); serr.offset.set(0.5, 0.5);
  const faceMat = new THREE.MeshPhysicalMaterial({ color: 0xd3d9e3, metalness: 1, roughness: 0.34, bumpMap: serr, bumpScale: 2.2, envMapIntensity: 1.25 });
  // RingGeometry UVs run 0..1 across the bounding square, so re-map to the same centred space.
  serr.repeat.set(1, 1); serr.offset.set(0, 0);
  const pipeMat = new THREE.MeshPhysicalMaterial({ color: 0xaeb6c3, metalness: 1, roughness: 0.36, envMapIntensity: 1, side: THREE.DoubleSide });
  const wind = winding();
  const R_W = 1.06;
  wind.repeat.set(1 / (2 * R_W), 1 / (2 * R_W)); wind.offset.set(0.5, 0.5);
  const windMat = new THREE.MeshPhysicalMaterial({ map: wind, metalness: 0.75, roughness: 0.42, envMapIntensity: 0.9 });
  const ringMat = new THREE.MeshPhysicalMaterial({ color: 0xd9dee7, metalness: 1, roughness: 0.22 });
  const paintMat = new THREE.MeshPhysicalMaterial({ color: 0xe0832f, metalness: 0.25, roughness: 0.38, clearcoat: 0.6, clearcoatRoughness: 0.25 });
  const thr = threads();
  const studMat = new THREE.MeshPhysicalMaterial({ color: 0x4a515e, metalness: 0.95, roughness: 0.42, bumpMap: thr, bumpScale: 3 });

  // --- Build assembly ---
  const rig = new THREE.Group(); // camera-facing orientation
  const asm = new THREE.Group(); // assembly, axis = X
  rig.add(asm); scene.add(rig);

  const fg = flangeGeos();
  const pipeGeo = lathe([[D.rBore, 0], [D.rNeck, 0], [D.rNeck, D.pipe], [D.rBore, D.pipe], [D.rBore, 0]]);
  const weldGeo = new THREE.TorusGeometry(D.rNeck + 0.005, 0.03, 12, 128); weldGeo.rotateX(Math.PI / 2);

  function makeFlange() {
    const g = new THREE.Group();
    g.add(new THREE.Mesh(fg.body, steel), new THREE.Mesh(fg.disk, steel), new THREE.Mesh(fg.face, faceMat));
    const pipe = new THREE.Mesh(pipeGeo, pipeMat);
    pipe.rotation.x = Math.PI; pipe.position.y = -D.t - D.lHub; // extends along -y
    const weld = new THREE.Mesh(weldGeo, pipeMat); weld.position.y = -D.t - D.lHub;
    g.add(pipe, weld);
    return g;
  }
  const A = makeFlange(); A.rotation.z = -Math.PI / 2; // local +y → world +x
  const B = makeFlange(); B.rotation.z = Math.PI / 2; // local +y → world −x
  const flangeX = D.gasket / 2 + D.hRF;
  asm.add(A, B);

  const gasket = new THREE.Group();
  const gt = D.gasket;
  gasket.add(new THREE.Mesh(plate(0.84, D.rBore + 0.006, gt * 0.66, -gt * 0.33, 0, 0, 0.004), ringMat));
  gasket.add(new THREE.Mesh(plate(R_W, 0.84, gt, -gt / 2, 0, 0, 0.003), windMat));
  gasket.add(new THREE.Mesh(plate(1.3, R_W, gt * 0.66, -gt * 0.33, 0, 0, 0.006), paintMat));
  gasket.rotation.z = -Math.PI / 2;
  asm.add(gasket);

  const studLen = 2 * (D.t + D.hRF + gt / 2 + D.nutH + 0.11);
  const studGeo = new THREE.CylinderGeometry(D.studR, D.studR, studLen, 28, 1); studGeo.rotateZ(Math.PI / 2);
  const ng = nutGeo(); ng.rotateZ(Math.PI / 2);
  const seat = D.t + D.hRF + gt / 2 + D.nutH / 2;
  const bolts = [];
  for (let k = 0; k < D.bolts; k++) {
    const a = (k / D.bolts) * TAU + Math.PI / D.bolts;
    const y = Math.cos(a) * D.rBC, z = Math.sin(a) * D.rBC;
    const nm = new THREE.MeshPhysicalMaterial({ color: 0x5b6372, metalness: 1, roughness: 0.3, emissive: new THREE.Color(0xff7a2a), emissiveIntensity: 0 });
    const stud = new THREE.Mesh(studGeo, studMat);
    const n1 = new THREE.Mesh(ng, nm), n2 = new THREE.Mesh(ng, nm);
    asm.add(stud, n1, n2);
    bolts.push({ y, z, stud, n1, n2, mat: nm, order: SEQ.indexOf(k + 1), pulse: -1 });
  }

  // Floating dust in the light
  const P = mobile ? 140 : 320;
  const pp = new Float32Array(P * 3), pc = new Float32Array(P * 3), seeds = new Float32Array(P);
  const cA = new THREE.Color(0xff9a50), cB = new THREE.Color(0x8fb0ff);
  for (let i = 0; i < P; i++) {
    pp.set([(Math.random() - 0.5) * 16, (Math.random() - 0.5) * 10, (Math.random() - 0.5) * 10], i * 3);
    const c = Math.random() < 0.55 ? cA : cB; pc.set([c.r, c.g, c.b], i * 3); seeds[i] = Math.random();
  }
  const pGeo = new THREE.BufferGeometry();
  pGeo.setAttribute('position', new THREE.BufferAttribute(pp, 3));
  pGeo.setAttribute('color', new THREE.BufferAttribute(pc, 3));
  const dust = new THREE.Points(pGeo, new THREE.PointsMaterial({ size: 0.045, map: sprite(), vertexColors: true, transparent: true, opacity: 0.7, depthWrite: false, blending: THREE.AdditiveBlending }));
  scene.add(dust);

  // --- Post ---
  let composer = null, bloom = null;
  if (!mobile) {
    composer = new EffectComposer(renderer);
    composer.addPass(new RenderPass(scene, camera));
    bloom = new UnrealBloomPass(new THREE.Vector2(1, 1), 0.42, 0.55, 0.82);
    composer.addPass(bloom);
    composer.addPass(new OutputPass());
  }

  // --- State ---
  let W = 1, H = 1, target = 0, prog = 0, introAt = -1, visible = true, raf = 0, running = false;
  const mouse = { x: 0, y: 0, sx: 0, sy: 0 };
  const clock = new THREE.Clock();
  const resize = () => {
    const r = canvas.getBoundingClientRect();
    W = Math.max(1, r.width); H = Math.max(1, r.height);
    renderer.setSize(W, H, false);
    composer?.setSize(W, H);
    drawBg(W, H);
    camera.aspect = W / H;
    camera.updateProjectionMatrix();
  };
  resize();
  new ResizeObserver(resize).observe(canvas);
  addEventListener('pointermove', (e) => { mouse.x = e.clientX / innerWidth - 0.5; mouse.y = e.clientY / innerHeight - 0.5; }, { passive: true });

  const camFrom = new THREE.Vector3(), look = new THREE.Vector3();
  let slow = 0, frames = 0, accum = 0;

  function pose(p, t) {
    const intro = introAt < 0 ? (reduced ? 1 : 0) : expoOut(Math.min(1, (t - introAt) / 2.6));
    const spread = 1 + (1 - intro) * 1.6;
    const narrow = W / H < 0.9;

    // 1. Flanges and gasket close the gap
    const close = easeIO(rng(p, 0.04, 0.2));
    const gapX = lerp(1.3, 0, close) * spread;
    A.position.x = -flangeX - gapX;
    B.position.x = flangeX + gapX;
    const gs = easeIO(rng(p, 0.03, 0.19));
    gasket.rotation.set(lerp(0.65, 0, gs), lerp(-0.5, 0, gs), -Math.PI / 2 + lerp(0.25, 0, gs));
    gasket.position.y = lerp(0.35, 0, gs) * spread;

    // 2. Studs slide through, 3. nuts run down in star sequence
    bolts.forEach((b, k) => {
      const s = easeIO(rng(p, 0.11 + k * 0.009, 0.25 + k * 0.009));
      const rad = lerp(1.2, 1, s) * spread;
      const sx = lerp(3.1, 0, s) * spread;
      b.stud.position.set(sx, b.y * rad, b.z * rad);
      b.stud.rotation.x = lerp(0.6, 0, s);
      const n0 = 0.22 + b.order * 0.0275, n = easeOut(rng(p, n0, n0 + 0.0475));
      const nrad = lerp(1.24, 1, Math.min(1, n * 1.6)) * spread;
      const travel = lerp(2.5, 0, n) * spread;
      b.n1.position.set(-seat - travel, b.y * nrad, b.z * nrad);
      b.n2.position.set(seat + travel + (1 - s) * 0.6, b.y * nrad, b.z * nrad);
      const spin = travel * 18;
      b.n1.rotation.x = spin; b.n2.rotation.x = -spin;
      // flash only when a nut seats during real scrolling, never on a jump or in reduced motion
      if (n >= 1 && !b.seated) { b.seated = true; b.pulse = reduced || Math.abs(target - prog) > 0.04 ? -1 : t; }
      if (n < 0.98) { b.seated = false; b.pulse = -1; }
      b.mat.emissiveIntensity = b.pulse < 0 ? 0 : Math.exp(-(t - b.pulse) * 3.2) * 2.4;
    });

    // Rig orientation: 3/4 view → axial view
    const turn = easeIO(rng(p, 0.5, 0.74));
    const idle = (1 - turn) * (reduced ? 0 : 1);
    mouse.sx += (mouse.x - mouse.sx) * 0.05; mouse.sy += (mouse.y - mouse.sy) * 0.05;
    rig.rotation.y = lerp(-0.62 - (1 - intro) * 0.9, -Math.PI / 2, turn) + idle * (Math.sin(t * 0.25) * 0.06 + mouse.sx * 0.35);
    rig.rotation.x = lerp(0.22, 0, turn) + idle * (mouse.sy * 0.18);
    rig.rotation.z = lerp(-0.06, 0, turn);
    asm.rotation.x = (1 - turn) * (Math.sin(t * 0.12) * 0.32 + (1 - intro) * 0.8);
    rig.scale.setScalar(lerp(0.82, 1, intro));

    // Camera: hold, then dolly through the bore
    const dolly = rng(p, 0.7, 1);
    const ease = dolly * dolly * (3 - 2 * dolly);
    const dist = narrow ? 19.5 : 14.2;
    camFrom.set(0, narrow ? -0.4 : 0.15, lerp(dist, -2.6, ease));
    camera.position.copy(camFrom);
    look.set(0, narrow ? -0.4 : 0.15, camFrom.z - 5);
    camera.lookAt(look);
    camera.fov = lerp(32, 62, ease);
    camera.filmOffset = narrow ? 0 : lerp(-7.4, 0, easeIO(rng(p, 0.46, 0.7)));
    if (narrow) camera.setViewOffset(W, H, 0, H * lerp(0.27, 0, turn), W, H); else camera.clearViewOffset();
    camera.updateProjectionMatrix();
    if (bloom) bloom.strength = 0.42 + ease * 0.5;

    // dust drift
    const a = pGeo.attributes.position.array;
    for (let i = 0; i < P; i++) {
      a[i * 3 + 1] += 0.0016 + seeds[i] * 0.002;
      if (a[i * 3 + 1] > 5) a[i * 3 + 1] = -5;
    }
    pGeo.attributes.position.needsUpdate = true;
    dust.rotation.y = rig.rotation.y * 0.3;
  }

  let last = performance.now();
  function frame() {
    const t = clock.getElapsedTime();
    const now = performance.now(), dt = (now - last) / 1000; last = now;
    prog += (target - prog) * (reduced ? 1 : 1 - Math.exp(-Math.min(0.1, dt) * 8.5));
    if (Math.abs(target - prog) > 0.06) prog = target - Math.sign(target - prog) * 0.06;
    pose(prog, t);
    if (composer) composer.render(); else renderer.render(scene, camera);
    // adaptive quality: if we're slow, lower resolution and drop bloom
    if (frames < 90) {
      frames++; accum += dt;
      if (frames === 90 && accum / 90 > 1 / 38 && !slow) {
        slow = 1; dpr = 1; renderer.setPixelRatio(dpr); composer?.setPixelRatio?.(dpr); resize();
        if (bloom) bloom.enabled = false;
      }
    }
    if (running) raf = requestAnimationFrame(frame);
  }
  const start = () => { if (!running && visible && !document.hidden) { running = true; last = performance.now(); raf = requestAnimationFrame(frame); } };
  const stop = () => { running = false; cancelAnimationFrame(raf); };
  new IntersectionObserver(([e]) => { visible = e.isIntersecting; visible ? start() : stop(); }).observe(canvas);
  document.addEventListener('visibilitychange', () => (document.hidden ? stop() : start()));
  start();

  return {
    setProgress(p) { target = p; if (!running) { prog = p; pose(p, clock.getElapsedTime()); composer ? composer.render() : renderer.render(scene, camera); } },
    intro() { introAt = clock.getElapsedTime(); },
    dispose() { stop(); renderer.dispose(); },
  };
}

window.AQMHero = { create };
