const Visit = require('../models/Visit');
const env = require('../config/env');
const asyncHandler = require('../utils/asyncHandler');
const { verifyToken, COOKIE_NAME } = require('../utils/jwt');

const ID_RE = /^[a-zA-Z0-9_-]{8,64}$/;

/** YYYY-MM-DD in the business time zone (e.g. Asia/Colombo). */
const localDay = (d = new Date()) => d.toLocaleDateString('en-CA', { timeZone: env.timezone });

function deviceFrom(ua = '') {
  if (/ipad|tablet/i.test(ua)) return 'tablet';
  if (/mobi|android|iphone/i.test(ua)) return 'mobile';
  return 'desktop';
}

function userIdFromCookie(req) {
  try {
    const token = req.cookies?.[COOKIE_NAME];
    return token ? verifyToken(token).id : undefined;
  } catch {
    return undefined;
  }
}

// POST /api/public/visit  { visitorId, path, referrer, firstVisit }
exports.trackVisit = asyncHandler(async (req, res) => {
  const { visitorId, path = '/', referrer, firstVisit } = req.body || {};
  if (!ID_RE.test(String(visitorId || ''))) return res.status(204).end();
  // Admin pages are not counted as website traffic
  if (String(path).startsWith('/admin')) return res.status(204).end();

  const now = new Date();
  const userId = userIdFromCookie(req);
  await Visit.updateOne(
    { visitorId, day: localDay(now) },
    {
      $setOnInsert: {
        firstSeenAt: now,
        isNewVisitor: Boolean(firstVisit),
        referrer: referrer ? String(referrer).slice(0, 300) : undefined,
        device: deviceFrom(req.headers['user-agent']),
      },
      $set: { lastSeenAt: now, ...(userId ? { user: userId } : {}) },
      $inc: { pageViews: 1 },
      $addToSet: { paths: String(path).slice(0, 200) },
    },
    { upsert: true }
  ).catch((err) => {
    if (err.code !== 11000) throw err; // duplicate on a race is harmless
  });
  res.status(204).end();
});
