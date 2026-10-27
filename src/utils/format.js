export function parseDate(value) {
  if (!value) return null;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
}

export function formatDate(value, opts = {}) {
  const d = parseDate(value);
  if (!d) return '—';
  return d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric', ...opts });
}

export function formatTime(value) {
  const d = parseDate(value);
  if (!d) return '';
  return d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
}

export function formatDateTime(value) {
  const d = parseDate(value);
  if (!d) return '—';
  return `${formatDate(value)}, ${formatTime(value)}`;
}

export function dateParts(value) {
  const d = parseDate(value) || new Date();
  return {
    day: d.getDate(),
    month: d.toLocaleDateString(undefined, { month: 'short' }),
    weekday: d.toLocaleDateString(undefined, { weekday: 'short' }),
    year: d.getFullYear(),
  };
}

export function monthLabel(value) {
  const d = parseDate(value);
  if (!d) return '';
  return d.toLocaleDateString(undefined, { month: 'long', year: 'numeric' });
}

export function isPast(value) {
  const d = parseDate(value);
  return d ? d.getTime() < Date.now() : false;
}

const rtf = new Intl.RelativeTimeFormat(undefined, { numeric: 'auto' });
const UNITS = [
  ['year', 31536000],
  ['month', 2592000],
  ['week', 604800],
  ['day', 86400],
  ['hour', 3600],
  ['minute', 60],
];

export function relativeTime(value) {
  const d = parseDate(value);
  if (!d) return '';
  const diff = (d.getTime() - Date.now()) / 1000;
  for (const [unit, secs] of UNITS) {
    if (Math.abs(diff) >= secs) return rtf.format(Math.round(diff / secs), unit);
  }
  return 'just now';
}

// ISO string -> value for <input type="datetime-local"> in the viewer's timezone.
export function toLocalInputValue(value) {
  const d = parseDate(value);
  if (!d) return '';
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function hueFor(text = '') {
  let h = 7;
  for (const ch of String(text).toLowerCase()) h = (h * 31 + ch.codePointAt(0)) % 360;
  return h;
}

export function initials(name = '') {
  const parts = String(name).trim().split(/\s+/).filter(Boolean).slice(0, 2);
  return parts.map((w) => [...w][0].toUpperCase()).join('') || '?';
}

export function plural(n, word, pluralWord = `${word}s`) {
  return `${n} ${n === 1 ? word : pluralWord}`;
}
