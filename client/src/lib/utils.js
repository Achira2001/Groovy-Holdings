import { clsx } from 'clsx';

export const cn = (...args) => clsx(...args);

export const WHATSAPP = process.env.NEXT_PUBLIC_WHATSAPP || '94777660791';
export const WHATSAPP_DISPLAY = `+${WHATSAPP.slice(0, 2)} ${WHATSAPP.slice(2, 4)} ${WHATSAPP.slice(4, 7)} ${WHATSAPP.slice(7)}`;
export const whatsappLink = (text = '') => `https://wa.me/${WHATSAPP}${text ? `?text=${encodeURIComponent(text)}` : ''}`;

export const formatLKR = (n = 0) =>
  `LKR ${Number(n || 0).toLocaleString('en-LK', { maximumFractionDigits: 0 })}`;

export const compactNumber = (n = 0) =>
  Intl.NumberFormat('en', { notation: 'compact', maximumFractionDigits: 1 }).format(n || 0);

export const TZ = 'Asia/Colombo';

export const formatDate = (d, opts = {}) =>
  d ? new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', timeZone: TZ, ...opts }) : '—';

export const formatDateTime = (d) =>
  d
    ? new Date(d).toLocaleString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', timeZone: TZ })
    : '—';

export const formatTime = (d) =>
  new Date(d).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', timeZone: TZ });

/** YYYY-MM-DD for a date in the business time zone. */
export const localDateKey = (d) => new Date(d).toLocaleDateString('en-CA', { timeZone: TZ });

export const timeAgo = (d) => {
  if (!d) return '';
  const s = Math.floor((Date.now() - new Date(d).getTime()) / 1000);
  if (s < 60) return 'just now';
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  if (s < 604800) return `${Math.floor(s / 86400)}d ago`;
  return formatDate(d);
};

export const bytes = (n = 0) => {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(0)} KB`;
  return `${(n / 1024 / 1024).toFixed(1)} MB`;
};

export const initials = (name = '') =>
  name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join('') || '?';

export const ORDER_STATUS = {
  pending: { label: 'Pending review', tone: 'warning' },
  reviewing: { label: 'Reviewing', tone: 'brand' },
  quoted: { label: 'Price quoted', tone: 'brand' },
  confirmed: { label: 'Confirmed', tone: 'brand' },
  in_production: { label: 'In production', tone: 'accent' },
  ready: { label: 'Ready', tone: 'success' },
  delivered: { label: 'Delivered', tone: 'success' },
  cancelled: { label: 'Cancelled', tone: 'danger' },
};
export const ORDER_FLOW = ['pending', 'reviewing', 'quoted', 'confirmed', 'in_production', 'ready', 'delivered'];

export const isImage = (mime = '') => mime.startsWith('image/') && !mime.includes('svg');
