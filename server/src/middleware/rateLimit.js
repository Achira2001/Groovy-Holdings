const rateLimit = require('express-rate-limit');

const base = { standardHeaders: 'draft-7', legacyHeaders: false };

module.exports = {
  authLimiter: rateLimit({
    ...base,
    windowMs: 15 * 60 * 1000,
    limit: 30,
    message: { success: false, message: 'Too many attempts. Please try again in 15 minutes' },
  }),
  emailLimiter: rateLimit({
    ...base,
    windowMs: 60 * 60 * 1000,
    limit: 8,
    message: { success: false, message: 'Too many email requests. Please try again later' },
  }),
  apiLimiter: rateLimit({ ...base, windowMs: 60 * 1000, limit: 300 }),
};
