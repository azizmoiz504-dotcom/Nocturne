/* Dotted globe with a single pin on Al Quoz, Dubai. Libraries load only when the section is near. */
(function () {
  const canvas = document.getElementById('globe');
  if (!canvas) return;

  const loadScript = src => new Promise((res, rej) => {
    const s = document.createElement('script'); s.src = src; s.onload = res; s.onerror = rej; document.head.appendChild(s);
  });
  let started = false;
  const io = new IntersectionObserver(es => {
    if (!es[0].isIntersecting || started) return;
    started = true; io.disconnect();
    loadScript('vendor/d3.min.js')
      .then(() => loadScript('vendor/topojson-client.min.js'))
      .then(() => loadScript('vendor/land-110m.js'))
      .then(init)
      .catch(() => { canvas.style.display = 'none'; });
  }, { rootMargin: '900px 0px' });
  io.observe(canvas);

  function init() {
    const ctx = canvas.getContext('2d');
    const PIN = [55.23, 25.14]; // Al Quoz, Dubai
    const proj = d3.geoOrthographic().clipAngle(90).precision(0.6);
    const path = d3.geoPath(proj, ctx);
    const grat = d3.geoGraticule10();
    let W = 0, H = 0, R = 0, dpr = 1, inView = true, dragging = false, idleAt = 0;
    const rot = [-PIN[0] + 8, -PIN[1] + 2, 0];
    let dots = [];
    const buckets = Array.from({ length: 6 }, () => []);

    const toXYZ = (lon, lat) => {
      const l = lon * Math.PI / 180, p = lat * Math.PI / 180;
      return [Math.cos(p) * Math.cos(l), Math.cos(p) * Math.sin(l), Math.sin(p)];
    };
    function resize() {
      const r = canvas.getBoundingClientRect();
      dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      W = r.width; H = r.height;
      canvas.width = Math.round(W * dpr); canvas.height = Math.round(H * dpr);
      R = Math.min(W, H) / 2 * 0.84;
      proj.translate([W / 2, H / 2]).scale(R);
    }
    resize();
    window.addEventListener('resize', resize);

    // land outlines ship as a script (vendor/land-110m.js) so the globe also works when index.html is opened straight from disk
    Promise.resolve(window.FT_LAND)
      .then(topo => {
        const land = topojson.feature(topo, topo.objects.land);
        const OW = 1080, OH = 540;
        const oc = document.createElement('canvas'); oc.width = OW; oc.height = OH;
        const ox = oc.getContext('2d');
        const eq = d3.geoEquirectangular().scale(OW / (2 * Math.PI)).translate([OW / 2, OH / 2]);
        ox.fillStyle = '#000'; ox.beginPath(); d3.geoPath(eq, ox)(land); ox.fill();
        const data = ox.getImageData(0, 0, OW, OH).data;
        const step = innerWidth < 900 ? 1.45 : 1.2;
        for (let lat = -58; lat <= 80; lat += step) {
          const ls = step / Math.max(0.2, Math.cos(lat * Math.PI / 180));
          for (let lon = -180; lon < 180; lon += ls) {
            const x = Math.floor((lon + 180) / 360 * OW), y = Math.floor((90 - lat) / 180 * OH);
            if (data[(y * OW + x) * 4 + 3] > 0) dots.push([lon, lat].concat(toXYZ(lon, lat)));
          }
        }
      })
      .catch(() => { dots = []; });

    d3.select(canvas).call(d3.drag()
      .on('start', () => { dragging = true; })
      .on('drag', e => { rot[0] += e.dx * 0.32; rot[1] = Math.max(-70, Math.min(70, rot[1] - e.dy * 0.32)); })
      .on('end', () => { dragging = false; idleAt = performance.now(); }));

    new IntersectionObserver(es => { inView = es[0].isIntersecting; }, { rootMargin: '100px' }).observe(canvas);

    function draw(now) {
      requestAnimationFrame(draw);
      if (!inView || !W) return;
      const t = now / 1000;
      if (!dragging && now - idleAt > 2500) {
        const base = -PIN[0] + 8 + Math.sin(t * 0.12) * 14;
        rot[0] += (base - rot[0]) * 0.01;
        rot[1] += (-PIN[1] + 2 - rot[1]) * 0.01;
      }
      proj.rotate(rot);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, W, H);
      const cx = W / 2, cy = H / 2;

      const gr = ctx.createRadialGradient(cx - R * 0.35, cy - R * 0.4, R * 0.1, cx, cy, R);
      gr.addColorStop(0, '#0d2a3d'); gr.addColorStop(0.7, '#08182a'); gr.addColorStop(1, '#060d18');
      ctx.fillStyle = gr; ctx.beginPath(); ctx.arc(cx, cy, R, 0, Math.PI * 2); ctx.fill();
      const at = ctx.createRadialGradient(cx, cy, R * 0.96, cx, cy, R * 1.14);
      at.addColorStop(0, 'rgba(8,71,103,.55)'); at.addColorStop(1, 'rgba(8,71,103,0)');
      ctx.fillStyle = at; ctx.beginPath(); ctx.arc(cx, cy, R * 1.14, 0, Math.PI * 2); ctx.fill();

      ctx.beginPath(); path(grat); ctx.strokeStyle = 'rgba(255,255,255,.045)'; ctx.lineWidth = 0.6; ctx.stroke();

      const cv = toXYZ(-rot[0], -rot[1]);
      const ds = Math.max(1.5, R / 210);
      // dots are batched into a few brightness bands: one fill per band instead of one per dot
      const BANDS = 6;
      for (let b = 0; b < BANDS; b++) buckets[b].length = 0;
      for (let i = 0; i < dots.length; i++) {
        const d = dots[i];
        const dp = d[2] * cv[0] + d[3] * cv[1] + d[4] * cv[2];
        if (dp <= 0.02) continue;
        buckets[Math.min(BANDS - 1, (dp * BANDS) | 0)].push(d);
      }
      for (let b = 0; b < BANDS; b++) {
        const list = buckets[b]; if (!list.length) continue;
        ctx.fillStyle = 'rgba(206,214,224,' + (0.28 + (b + 0.5) / BANDS * 0.62).toFixed(3) + ')';
        ctx.beginPath();
        for (let i = 0; i < list.length; i++) { const p = proj(list[i]); ctx.rect(p[0] - ds / 2, p[1] - ds / 2, ds, ds); }
        ctx.fill();
      }

      // the pin
      const v = toXYZ(PIN[0], PIN[1]);
      if (v[0] * cv[0] + v[1] * cv[1] + v[2] * cv[2] > 0) {
        const o = proj(PIN);
        for (let k = 0; k < 3; k++) {
          const pr = ((t + k * 0.6) % 1.8) / 1.8;
          ctx.strokeStyle = 'rgba(224,48,58,' + (1 - pr).toFixed(3) + ')'; ctx.lineWidth = 1.5;
          ctx.beginPath(); ctx.arc(o[0], o[1], 4 + pr * 34, 0, Math.PI * 2); ctx.stroke();
        }
        // label goes to whichever side has room, so it is never cut off at the canvas edge
        ctx.font = '600 15px "Barlow Semi Condensed", sans-serif';
        const lw = Math.max(ctx.measureText('FAKHRI TOOLS').width, 110);
        const dir = o[0] + 64 + lw > W - 6 ? -1 : 1;
        ctx.strokeStyle = '#fff'; ctx.lineWidth = 1.2;
        ctx.beginPath(); ctx.moveTo(o[0], o[1]); ctx.lineTo(o[0] + 26 * dir, o[1] - 34); ctx.lineTo(o[0] + 60 * dir, o[1] - 34); ctx.stroke();
        ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(o[0], o[1], 5, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#b91a20'; ctx.beginPath(); ctx.arc(o[0], o[1], 2.6, 0, Math.PI * 2); ctx.fill();
        ctx.textAlign = dir > 0 ? 'left' : 'right';
        ctx.fillStyle = '#fff';
        ctx.fillText('FAKHRI TOOLS', o[0] + 64 * dir, o[1] - 40);
        ctx.font = '500 13px "Barlow Semi Condensed", sans-serif'; ctx.fillStyle = 'rgba(196,203,214,.9)';
        ctx.fillText('AL QUOZ · DUBAI', o[0] + 64 * dir, o[1] - 24);
        ctx.textAlign = 'left';
      }
    }
    requestAnimationFrame(draw);
  }
})();
