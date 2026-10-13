const crypto = require('crypto');

/** Returns a random token for the email link and its SHA-256 hash for the DB. */
function createHashedToken(bytes = 32) {
  const raw = crypto.randomBytes(bytes).toString('hex');
  return { raw, hashed: hashToken(raw) };
}

function hashToken(raw) {
  return crypto.createHash('sha256').update(String(raw)).digest('hex');
}

/** Constant-time string comparison (used for the admin code). */
function safeEqual(a, b) {
  const ab = Buffer.from(String(a || ''));
  const bb = Buffer.from(String(b || ''));
  if (ab.length !== bb.length) return false;
  return crypto.timingSafeEqual(ab, bb);
}

module.exports = { createHashedToken, hashToken, safeEqual };
