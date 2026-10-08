import { GLOBE, SOURCING, HUB, MARKETS } from '../data.js';

const D2R = Math.PI / 180;
const lerp = (a, b, t) => a + (b - a) * t;
const clamp01 = (v) => Math.min(1, Math.max(0, v));
const smooth = (t) => t * t * (3 - 2 * t);
const rng = (p, a, b) => clamp01((p - a) / (b - a));

const vec = (lat, lon) => {
  const la = lat * D2R, lo = lon * D2R;
  return [Math.cos(la) * Math.sin(lo), Math.sin(la), Math.cos(la) * Math.cos(lo)];
};

// Inbound (amber) and outbound (blue) supply lines, scheduled against scroll progress.
const INBOUND = SOURCING.map((s, i) => ({ code: s.code, name: s.name, a: vec(s.lat, s.lon), b: vec(HUB.lat, HUB.lon), t0: 0.05 + i * 0.045, t1: 0.17 + i * 0.045 }));
const OUTBOUND = MARKETS.map((m, i) => ({ region: m.region, a: vec(HUB.lat, HUB.lon), b: vec(m.lat, m.lon), t0: 0.66 + i * 0.022, t1: 0.78 + i * 0.022 }));

// Camera keyframes: [progress, centre lon, centre lat, zoom]
const CAM = [[0, 44, 32, 0.98], [0.36, 70, 24, 1.0], [0.52, 57, 24, 1.24], [0.64, 55, 22, 1.18], [0.86, 38, 6, 1.0], [1, 36, 4, 1.0]];
function camera(p) {
  for (let i = 1; i < CAM.length; i++) {
    if (p <= CAM[i][0]) {
      const [p0, ...a] = CAM[i - 1], [p1, ...b] = CAM[i];
      const t = smooth(rng(p, p0, p1));
      return a.map((v, k) => lerp(v, b[k], t));
    }
  }
  return CAM.at(-1).slice(1);
}

function slerp(a, b, t) {
  const d = Math.min(1, Math.max(-1, a[0] * b[0] + a[1] * b[1] + a[2] * b[2]));
  const w = Math.acos(d);
  if (w < 1e-5) return a;
  const s = Math.sin(w), ka = Math.sin((1 - t) * w) / s, kb = Math.sin(t * w) / s;
  return [a[0] * ka + b[0] * kb, a[1] * ka + b[1] * kb, a[2] * ka + b[2] * kb];
}

export function createGlobe(canvas) {
  const ctx = canvas.getContext('2d');
  const N = GLOBE.length / 2;
  const pts = new Float32Array(N * 3);
  for (let i = 0; i < N; i++) {
    const v = vec(GLOBE[i * 2], GLOBE[i * 2 + 1]);
    pts.set(v, i * 3);
  }
  // Pre-sampled arcs
  const SEG = 56;
  const sample = (arc) => {
    const ang = Math.acos(Math.min(1, arc.a[0] * arc.b[0] + arc.a[1] * arc.b[1] + arc.a[2] * arc.b[2]));
    const lift = 0.06 + ang * 0.22;
    arc.pts = [];
    for (let k = 0; k <= SEG; k++) {
      const t = k / SEG, v = slerp(arc.a, arc.b, t), h = 1 + Math.sin(Math.PI * t) * lift;
      arc.pts.push([v[0] * h, v[1] * h, v[2] * h]);
    }
  };
  INBOUND.forEach(sample);
  OUTBOUND.forEach(sample);

  let W = 0, H = 0, dpr = 1, R = 0, cx = 0, cy = 0;
  let target = 0, prog = 0, raf = 0, running = false, t0 = performance.now();
  const resize = () => {
    const r = canvas.getBoundingClientRect();
    dpr = Math.min(devicePixelRatio || 1, 2);
    W = Math.max(1, r.width); H = Math.max(1, r.height);
    canvas.width = W * dpr; canvas.height = H * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    cx = W / 2; cy = H / 2; R = Math.min(W, H) * 0.4;
  };
  resize();
  new ResizeObserver(resize).observe(canvas);

  // rotation: centre lon/lat → view space
  let cl0 = 1, sl0 = 0, cL = 1, sL = 0;
  const setRot = (lon, lat) => { cl0 = Math.cos(-lon * D2R); sl0 = Math.sin(-lon * D2R); cL = Math.cos(lat * D2R); sL = Math.sin(lat * D2R); };
  const rot = (x, y, z, out) => {
    // yaw around Y by -lon, then pitch around X by lat
    const x1 = x * cl0 + z * sl0, z1 = -x * sl0 + z * cl0;
    out[0] = x1; out[1] = y * cL - z1 * sL; out[2] = y * sL + z1 * cL;
    return out;
  };
  const tmp = [0, 0, 0];
  const hidden = (v) => v[2] < 0 && v[0] * v[0] + v[1] * v[1] < 1;

  function drawArc(arc, amt, color, rad, time, done) {
    if (amt <= 0) return;
    const last = Math.max(1, Math.floor(amt * SEG));
    ctx.lineCap = 'round';
    let prev = null;
    for (let k = 0; k <= last; k++) {
      const p = arc.pts[k];
      const v = rot(p[0], p[1], p[2], [0, 0, 0]);
      if (prev && !hidden(v) && !hidden(prev)) {
        const a = done ? 0.32 : 0.15 + 0.85 * (k / last);
        ctx.strokeStyle = `rgba(${color},${a})`;
        ctx.lineWidth = done ? 1.1 : 1.6;
        ctx.beginPath();
        ctx.moveTo(cx + prev[0] * rad, cy - prev[1] * rad);
        ctx.lineTo(cx + v[0] * rad, cy - v[1] * rad);
        ctx.stroke();
      }
      prev = v;
    }
    // head / travelling packets
    const heads = done ? [((time * 0.00022 + arc.pts.length * 0.013) % 1)] : [amt];
    heads.forEach((h) => {
      const p = arc.pts[Math.min(SEG, Math.round(h * SEG))];
      const v = rot(p[0], p[1], p[2], tmp);
      if (hidden(v)) return;
      const x = cx + v[0] * rad, y = cy - v[1] * rad;
      const g = ctx.createRadialGradient(x, y, 0, x, y, 9);
      g.addColorStop(0, `rgba(${color},0.95)`);
      g.addColorStop(1, `rgba(${color},0)`);
      ctx.fillStyle = g;
      ctx.fillRect(x - 9, y - 9, 18, 18);
    });
  }

  function label(v, rad, text, color, align = 'left', dy = 0) {
    if (v[2] < 0.12) return;
    const x = cx + v[0] * rad, y = cy - v[1] * rad;
    ctx.globalAlpha = clamp01((v[2] - 0.12) * 4);
    ctx.fillStyle = color;
    ctx.font = '500 10.5px "Geist Mono", ui-monospace, monospace';
    ctx.textAlign = align;
    ctx.fillText(text.toUpperCase(), x + (align === 'left' ? 10 : -10), y + 3.5 + dy);
    ctx.globalAlpha = 1;
  }

  let lastNow = performance.now();
  function frame(now) {
    // time-based easing with a capped lag, so the globe never trails the copy
    const dt = Math.min(0.1, (now - lastNow) / 1000); lastNow = now;
    prog += (target - prog) * (1 - Math.exp(-dt * 7));
    if (Math.abs(target - prog) > 0.08) prog = target - Math.sign(target - prog) * 0.08;
    const time = Math.max(0, now - t0); // rAF timestamps can precede creation time
    const [lon, lat, zoom] = camera(prog);
    setRot(lon + Math.sin(time * 0.00018) * 2.2, lat);
    const rad = R * zoom;
    ctx.clearRect(0, 0, W, H);

    // atmosphere + ocean
    let g = ctx.createRadialGradient(cx, cy, rad * 0.9, cx, cy, rad * 1.32);
    g.addColorStop(0, 'rgba(95,134,216,0.28)');
    g.addColorStop(0.35, 'rgba(95,134,216,0.08)');
    g.addColorStop(1, 'rgba(95,134,216,0)');
    ctx.fillStyle = g;
    ctx.beginPath(); ctx.arc(cx, cy, rad * 1.32, 0, Math.PI * 2); ctx.fill();
    g = ctx.createRadialGradient(cx - rad * 0.35, cy - rad * 0.4, rad * 0.1, cx, cy, rad);
    g.addColorStop(0, '#13213f');
    g.addColorStop(1, '#060b16');
    ctx.fillStyle = g;
    ctx.beginPath(); ctx.arc(cx, cy, rad, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = 'rgba(159,178,216,0.18)';
    ctx.lineWidth = 1;
    ctx.stroke();

    // land dots, binned by depth for cheap shading
    const s = Math.max(1.1, rad / 230);
    const bins = [[], [], [], []];
    for (let i = 0; i < N; i++) {
      rot(pts[i * 3], pts[i * 3 + 1], pts[i * 3 + 2], tmp);
      if (tmp[2] <= 0.02) continue;
      bins[Math.min(3, (tmp[2] * 4) | 0)].push(cx + tmp[0] * rad, cy - tmp[1] * rad);
    }
    const alphas = [0.22, 0.38, 0.58, 0.82];
    bins.forEach((b, k) => {
      ctx.fillStyle = `rgba(143,170,228,${alphas[k]})`;
      for (let j = 0; j < b.length; j += 2) ctx.fillRect(b[j] - s / 2, b[j + 1] - s / 2, s, s);
    });

    // supply lines
    INBOUND.forEach((a) => drawArc(a, rng(prog, a.t0, a.t1), '255,138,61', rad, time, prog > a.t1 + 0.02));
    OUTBOUND.forEach((a) => drawArc(a, rng(prog, a.t0, a.t1), '143,176,255', rad, time, prog > a.t1 + 0.02));

    // sources
    INBOUND.forEach((a) => {
      const v = rot(a.a[0], a.a[1], a.a[2], [0, 0, 0]);
      if (v[2] <= 0) return;
      const lit = prog > a.t0;
      const x = cx + v[0] * rad, y = cy - v[1] * rad;
      ctx.fillStyle = lit ? 'rgba(255,180,110,0.95)' : 'rgba(167,177,196,0.5)';
      ctx.beginPath(); ctx.arc(x, y, lit ? 3 : 2, 0, Math.PI * 2); ctx.fill();
      if (lit) label(v, rad, a.name, 'rgba(234,238,246,0.85)', a.code === 'UK' || a.code === 'MY' ? 'right' : 'left', a.code === 'UK' ? 4 : a.code === 'DE' ? -6 : a.code === 'SG' ? 8 : a.code === 'TW' ? 4 : a.code === 'CN' ? -4 : 0);
    });
    // markets
    OUTBOUND.forEach((a) => {
      if (prog < a.t1) return;
      const v = rot(a.b[0], a.b[1], a.b[2], [0, 0, 0]);
      if (v[2] <= 0) return;
      ctx.fillStyle = 'rgba(185,205,255,0.95)';
      ctx.beginPath(); ctx.arc(cx + v[0] * rad, cy - v[1] * rad, 2.4, 0, Math.PI * 2); ctx.fill();
    });
    if (prog > 0.8) {
      const gcc = rot(...vec(23.5, 47), [0, 0, 0]), afr = rot(...vec(2, 26), [0, 0, 0]);
      label(gcc, rad, 'GCC', 'rgba(185,205,255,0.9)', 'right');
      label(afr, rad, 'Africa', 'rgba(185,205,255,0.9)', 'right');
    }
    // hub
    const hv = rot(...vec(HUB.lat, HUB.lon), [0, 0, 0]);
    if (hv[2] > 0) {
      const x = cx + hv[0] * rad, y = cy - hv[1] * rad;
      const k = clamp01(prog * 3);
      for (let r = 0; r < 3; r++) {
        const ph = ((time * 0.0006 + r / 3) % 1);
        ctx.strokeStyle = `rgba(255,138,61,${(1 - ph) * 0.7 * k})`;
        ctx.lineWidth = 1.2;
        ctx.beginPath(); ctx.arc(x, y, 4 + ph * 26 * (prog > 0.4 ? 1.4 : 1), 0, Math.PI * 2); ctx.stroke();
      }
      g = ctx.createRadialGradient(x, y, 0, x, y, 16);
      g.addColorStop(0, 'rgba(255,200,140,1)');
      g.addColorStop(0.3, 'rgba(255,138,61,0.8)');
      g.addColorStop(1, 'rgba(255,138,61,0)');
      ctx.fillStyle = g;
      ctx.fillRect(x - 16, y - 16, 32, 32);
      label(hv, rad, 'Ajman · UAE', 'rgba(255,180,110,1)', 'right', -12);
    }
    if (running) raf = requestAnimationFrame(frame);
  }

  return {
    setProgress(p) { target = p; if (!running) { prog = p; requestAnimationFrame(frame); } },
    start() { if (!running) { running = true; lastNow = performance.now(); raf = requestAnimationFrame(frame); } },
    stop() { running = false; cancelAnimationFrame(raf); },
    litCodes(p) { return new Set(INBOUND.filter((a) => p > a.t1).map((a) => a.code)); },
  };
}
