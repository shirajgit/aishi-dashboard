// Money is stored in INR (whole rupees). Adjust CURRENCY to taste.
const CURRENCY = 'INR';
const LOCALE = 'en-IN';

export function money(n) {
  if (n == null) return '—';
  return new Intl.NumberFormat(LOCALE, {
    style: 'currency',
    currency: CURRENCY,
    maximumFractionDigits: 0,
  }).format(n);
}

export function compactMoney(n) {
  if (n == null) return '—';
  if (n >= 10000000) return `₹${(n / 10000000).toFixed(1)}Cr`;
  if (n >= 100000) return `₹${(n / 100000).toFixed(1)}L`;
  if (n >= 1000) return `₹${(n / 1000).toFixed(0)}k`;
  return `₹${n}`;
}

export function num(n) {
  return new Intl.NumberFormat(LOCALE).format(n ?? 0);
}

export function dateShort(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
}

export function dateLong(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

export function fromNow(iso) {
  if (!iso) return '—';
  const diff = Date.now() - new Date(iso).getTime();
  const d = Math.round(diff / 86400000);
  if (d === 0) return 'today';
  if (d === 1) return 'yesterday';
  if (d > 0 && d < 30) return `${d}d ago`;
  if (d < 0 && d > -30) return `in ${-d}d`;
  return dateShort(iso);
}

export function initials(name = '') {
  return name
    .split(' ')
    .map((p) => p[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

// Deterministic accent colour from a string (avatars, tags).
export function hueFor(str = '') {
  let h = 0;
  for (let i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) % 360;
  return h;
}
