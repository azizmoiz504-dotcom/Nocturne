// Inline SVG icon set — 24px grid, 1.5px stroke, inherits currentColor.
const s = (d, extra = '') =>
  `<svg class="i" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"${extra}>${d}</svg>`;

export const I = {
  arrow: s('<path d="M4 12h15M13 6l6 6-6 6"/>'),
  arrowUR: s('<path d="M7 17 17 7M8 7h9v9"/>'),
  arrowDown: s('<path d="M12 4v15M6 13l6 6 6-6"/>'),
  arrowUp: s('<path d="M12 20V5M6 11l6-6 6 6"/>'),
  plus: s('<path d="M12 5v14M5 12h14"/>'),
  minus: s('<path d="M5 12h14"/>'),
  close: s('<path d="M6 6l12 12M18 6 6 18"/>'),
  check: s('<path d="m5 12.5 4.5 4.5L19 7.5"/>'),
  search: s('<circle cx="11" cy="11" r="6.5"/><path d="m16 16 4 4"/>'),
  phone: s('<path d="M5 4h3.5l1.6 4.2-2.1 1.4a11 11 0 0 0 6.4 6.4l1.4-2.1L20 15.5V19a1.5 1.5 0 0 1-1.6 1.5C10.6 20 4 13.4 3.5 5.6A1.5 1.5 0 0 1 5 4Z"/>'),
  mail: s('<rect x="3" y="5" width="18" height="14" rx="2"/><path d="m4 7 8 6 8-6"/>'),
  pin: s('<path d="M12 21s-6.5-5.6-6.5-11a6.5 6.5 0 0 1 13 0c0 5.4-6.5 11-6.5 11Z"/><circle cx="12" cy="10" r="2.4"/>'),
  clock: s('<circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3 2"/>'),
  download: s('<path d="M12 4v11M7 10l5 5 5-5M5 20h14"/>'),
  external: s('<path d="M14 5h5v5M19 5l-8 8M18 14v4a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h4"/>'),
  file: s('<path d="M7 3h7l5 5v12a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1Z"/><path d="M14 3v5h5"/>'),
  list: s('<path d="M9 6h11M9 12h11M9 18h11"/><circle cx="4.5" cy="6" r=".8"/><circle cx="4.5" cy="12" r=".8"/><circle cx="4.5" cy="18" r=".8"/>'),
  truck: s('<path d="M3 6h11v10H3zM14 9.5h4l3 3.5v3h-7"/><circle cx="7" cy="17.5" r="1.8"/><circle cx="17.5" cy="17.5" r="1.8"/>'),
  seal: s('<circle cx="12" cy="10" r="5.5"/><path d="m9.5 10 1.8 1.8 3.4-3.6M8.5 14.6 7 21l5-2.4 5 2.4-1.5-6.4"/>'),
  tag: s('<path d="M3.5 12.6V4.5a1 1 0 0 1 1-1h8.1l8 8a1.4 1.4 0 0 1 0 2l-7.1 7.1a1.4 1.4 0 0 1-2 0l-8-8Z"/><circle cx="8" cy="8" r="1.4"/>'),
  network: s('<circle cx="12" cy="12" r="8.5"/><path d="M3.5 12h17M12 3.5c2.4 2.4 3.4 5.3 3.4 8.5s-1 6.1-3.4 8.5c-2.4-2.4-3.4-5.3-3.4-8.5s1-6.1 3.4-8.5Z"/>'),
  gauge: s('<path d="M4.2 17a8.5 8.5 0 1 1 15.6 0"/><path d="m12 13 4-4"/><circle cx="12" cy="13" r="1.2"/>'),
  grid: s('<rect x="4" y="4" width="6.5" height="6.5" rx="1"/><rect x="13.5" y="4" width="6.5" height="6.5" rx="1"/><rect x="4" y="13.5" width="6.5" height="6.5" rx="1"/><rect x="13.5" y="13.5" width="6.5" height="6.5" rx="1"/>'),
  whatsapp: '<svg class="i i--fill" viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M17.47 14.38c-.3-.15-1.76-.87-2.03-.97-.27-.1-.47-.15-.67.15-.2.3-.77.97-.94 1.16-.17.2-.35.22-.64.08-.3-.15-1.26-.47-2.39-1.48-.88-.79-1.48-1.76-1.65-2.06-.17-.3-.02-.46.13-.6.13-.14.3-.35.45-.52.15-.17.2-.3.3-.5.1-.2.05-.37-.03-.52-.07-.15-.67-1.61-.92-2.2-.24-.58-.49-.5-.67-.51h-.57c-.2 0-.52.07-.8.37-.27.3-1.04 1.02-1.04 2.48s1.07 2.88 1.21 3.07c.15.2 2.1 3.2 5.08 4.49.71.3 1.26.49 1.7.63.71.22 1.36.19 1.87.12.57-.09 1.76-.72 2-1.41.25-.7.25-1.29.18-1.41-.08-.13-.28-.2-.57-.35m-5.42 7.4a9.87 9.87 0 0 1-5.03-1.38l-.36-.21-3.74.98 1-3.65-.24-.37a9.86 9.86 0 0 1-1.51-5.26 9.89 9.89 0 0 1 16.88-6.99 9.83 9.83 0 0 1 2.89 7 9.9 9.9 0 0 1-9.89 9.88m8.41-18.3A11.82 11.82 0 0 0 12.05 0C5.5 0 .16 5.34.16 11.89c0 2.1.55 4.14 1.59 5.95L.06 24l6.3-1.65a11.88 11.88 0 0 0 5.69 1.45c6.55 0 11.89-5.34 11.89-11.89 0-3.18-1.24-6.17-3.48-8.41"/></svg>',
  facebook: '<svg class="i i--fill" viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M13.5 21v-7.5h2.6l.4-3h-3V8.6c0-.9.3-1.5 1.5-1.5h1.6V4.4c-.3 0-1.2-.1-2.3-.1-2.3 0-3.8 1.4-3.8 3.9v2.3H7.9v3h2.6V21h3Z"/></svg>',
  instagram: s('<rect x="3.5" y="3.5" width="17" height="17" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.2" cy="6.8" r=".6" fill="currentColor"/>'),
  x: '<svg class="i i--fill" viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M17.8 3h3.1l-6.8 7.8 8 10.2h-6.3l-4.9-6.4L5.3 21H2.2l7.3-8.3L1.8 3h6.4l4.4 5.9L17.8 3Zm-1.1 16.2h1.7L7.4 4.7H5.6l11.1 14.5Z"/></svg>',
  youtube: '<svg class="i i--fill" viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M21.6 7.2a2.5 2.5 0 0 0-1.8-1.8C18.3 5 12 5 12 5s-6.3 0-7.8.4A2.5 2.5 0 0 0 2.4 7.2C2 8.8 2 12 2 12s0 3.2.4 4.8a2.5 2.5 0 0 0 1.8 1.8c1.5.4 7.8.4 7.8.4s6.3 0 7.8-.4a2.5 2.5 0 0 0 1.8-1.8c.4-1.6.4-4.8.4-4.8s0-3.2-.4-4.8ZM10 15V9l5.2 3L10 15Z"/></svg>',
};

// The AQM monogram, redrawn as vector: geometric A and M either side of a
// weld-neck flange that doubles as the Q — the idea at the heart of the original logo.
export function mark(id = 'm', cls = 'mark') {
  const holes = Array.from({ length: 8 }, (_, k) => {
    const a = (k / 8) * Math.PI * 2 + Math.PI / 8;
    return `<circle cx="${(147 + Math.cos(a) * 34).toFixed(2)}" cy="${(50 + Math.sin(a) * 34).toFixed(2)}" r="5.2"/>`;
  }).join('');
  return `<svg class="${cls}" viewBox="0 0 300 104" role="img" aria-label="AQM">
  <defs>
    <linearGradient id="${id}g" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#f4f8ff"/><stop offset=".42" stop-color="#a9bde6"/>
      <stop offset=".52" stop-color="#3e5c9e"/><stop offset=".78" stop-color="#8fa7d8"/><stop offset="1" stop-color="#dfe8fb"/>
    </linearGradient>
    <mask id="${id}k"><rect width="300" height="104" fill="#fff"/><g fill="#000"><circle cx="147" cy="50" r="18"/>${holes}</g></mask>
  </defs>
  <g fill="url(#${id}g)">
    <path fill-rule="evenodd" d="M0 100 34 2h24l34 98H70l-7-21H29l-7 21H0Zm34-39h24l-12-37-12 37Z"/>
    <g mask="url(#${id}k)"><circle cx="147" cy="50" r="48"/></g>
    <path d="m168 80 22 22h-24l-14-14z"/>
    <path d="M202 100V2h24l23 52 23-52h26v98h-21V40l-20 46h-16l-20-46v60z"/>
  </g>
</svg>`;
}
