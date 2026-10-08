// Live open/closed status in Dubai time (GST, UTC+4, no daylight saving).
// Open Monday to Saturday 7:30am to 6:00pm, closed Sunday.
import { $$ } from './util.js';

const OPEN = 7 * 60 + 30;
const CLOSE = 18 * 60;

export function dubaiNow(ms = Date.now()) {
  const d = new Date(ms + 4 * 3600e3);
  return { day: d.getUTCDay(), h: d.getUTCHours(), m: d.getUTCMinutes(), min: d.getUTCHours() * 60 + d.getUTCMinutes() };
}

export function shopState(t = dubaiNow()) {
  const openDay = t.day !== 0;
  if (openDay && t.min >= OPEN && t.min < CLOSE) {
    const left = CLOSE - t.min;
    return left <= 60
      ? { open: true, head: 'Open now', tail: ` · closes in ${left} min` }
      : { open: true, head: 'Open now', tail: ' · until 6:00pm' };
  }
  if (openDay && t.min < OPEN) return { open: false, head: 'Closed', tail: ' · opens 7:30am today' };
  if (t.day === 0) return { open: false, head: 'Closed Sunday', tail: ' · opens Monday 7:30am' };
  if (t.day === 6) return { open: false, head: 'Closed', tail: ' · opens Monday 7:30am' };
  return { open: false, head: 'Closed', tail: ' · opens 7:30am tomorrow' };
}

const clock = ({ h, m }) => `${h % 12 || 12}:${String(m).padStart(2, '0')}${h < 12 ? 'am' : 'pm'}`;

export function initHours() {
  const status = $$('[data-status]');
  const tables = $$('[data-hours]');
  const clocks = $$('[data-clock]');
  function tick() {
    const t = dubaiNow();
    const s = shopState(t);
    for (const el of status) {
      el.classList.toggle('is-open', s.open);
      el.classList.toggle('is-closed', !s.open);
      el.innerHTML = `<i></i><span><b>${s.head}</b><em>${s.tail}</em></span>`;
    }
    for (const tb of tables) for (const row of tb.children) row.classList.toggle('is-today', Number(row.dataset.day) === t.day);
    for (const c of clocks) c.textContent = clock(t);
  }
  tick();
  setInterval(tick, 20000);
}
