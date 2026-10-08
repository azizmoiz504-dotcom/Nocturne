// Pipe cross-section geometry shared by the home teaser and the schedule explorer.
export const weight = (od, wt) => 0.0246615 * (od - wt) * wt; // kg/m, carbon steel
export const toIn = (mm, d = 3) => (mm / 25.4).toFixed(d);

// Annulus as one even-odd path.
export function ring(cx, cy, ro, ri) {
  const c = (r) => `M${cx - r} ${cy}a${r} ${r} 0 1 0 ${2 * r} 0a${r} ${r} 0 1 0 ${-2 * r} 0Z`;
  return c(ro) + c(ri);
}
