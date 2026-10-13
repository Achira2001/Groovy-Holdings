const jwt = require('jsonwebtoken');
const env = require('../config/env');
const AppError = require('../utils/AppError');
const asyncHandler = require('../utils/asyncHandler');
const calendar = require('../utils/googleCalendar');

// GET /api/google/calendar/status (admin)
exports.status = asyncHandler(async (_req, res) => {
  res.json({ success: true, ...(await calendar.getStatus()) });
});

// GET /api/google/calendar/auth-url (admin)
exports.authUrl = asyncHandler(async (req, res) => {
  if (!calendar.isOAuthConfigured()) throw new AppError('Add GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET to the server .env first', 400);
  const state = jwt.sign({ id: String(req.user._id), purpose: 'gcal' }, env.jwtSecret, { expiresIn: '10m' });
  res.json({ success: true, url: calendar.getAuthUrl(state) });
});

// GET /api/google/calendar/callback  (Google redirects here)
exports.callback = async (req, res) => {
  const back = `${env.clientUrl}/admin/settings`;
  try {
    const payload = jwt.verify(String(req.query.state || ''), env.jwtSecret);
    if (payload.purpose !== 'gcal') throw new Error('bad state');
    if (!req.query.code) throw new Error(req.query.error || 'missing code');
    await calendar.handleCallback(String(req.query.code));
    res.redirect(`${back}?calendar=connected`);
  } catch (err) {
    console.warn('⚠ Google Calendar connect failed:', err.message);
    res.redirect(`${back}?calendar=error`);
  }
};

// DELETE /api/google/calendar (admin)
exports.disconnect = asyncHandler(async (_req, res) => {
  await calendar.disconnect();
  res.json({ success: true, message: 'Google Calendar disconnected' });
});
