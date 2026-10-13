const fs = require('fs');
const path = require('path');

const UPLOAD_ROOT = path.join(__dirname, '..', '..', 'uploads');

function slugify(text) {
  return String(text)
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/** Parse a JSON field sent inside multipart/form-data. */
function parseJSON(value, fallback) {
  if (value === undefined || value === null || value === '') return fallback;
  if (typeof value !== 'string') return value;
  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
}

/** Delete a public upload by its URL (/uploads/...). Ignores errors. */
function removePublicFile(url) {
  if (!url || !url.startsWith('/uploads/')) return;
  const rel = url.replace('/uploads/', '');
  const base = path.join(UPLOAD_ROOT, 'public');
  const full = path.join(base, rel);
  if (!full.startsWith(base)) return; // path traversal guard
  fs.promises.unlink(full).catch(() => {});
}

function removePrivateFile(filename) {
  if (!filename) return;
  const full = path.join(UPLOAD_ROOT, 'private', path.basename(filename));
  fs.promises.unlink(full).catch(() => {});
}

function escapeRegex(s = '') {
  return String(s).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function pagination(query, defLimit = 20, maxLimit = 100) {
  const page = Math.max(1, parseInt(query.page, 10) || 1);
  const limit = Math.min(maxLimit, Math.max(1, parseInt(query.limit, 10) || defLimit));
  return { page, limit, skip: (page - 1) * limit };
}

function normalizeWhatsapp(num = '') {
  let n = String(num).replace(/[^\d+]/g, '');
  if (n.startsWith('+')) n = n.slice(1);
  if (n.startsWith('0') && n.length === 10) n = `94${n.slice(1)}`; // Sri Lankan local format
  return n;
}

module.exports = {
  UPLOAD_ROOT,
  slugify,
  parseJSON,
  removePublicFile,
  removePrivateFile,
  escapeRegex,
  pagination,
  normalizeWhatsapp,
};
