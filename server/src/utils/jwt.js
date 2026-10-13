const jwt = require('jsonwebtoken');
const env = require('../config/env');

const COOKIE_NAME = 'gh_token';

function parseDurationMs(str) {
  const m = /^(\d+)([smhd])$/.exec(String(str));
  if (!m) return 7 * 24 * 60 * 60 * 1000;
  const n = Number(m[1]);
  return n * { s: 1e3, m: 6e4, h: 36e5, d: 864e5 }[m[2]];
}

function signAuthToken(user) {
  return jwt.sign({ id: user._id.toString(), role: user.role, v: user.tokenVersion || 0 }, env.jwtSecret, {
    expiresIn: env.jwtExpiresIn,
  });
}

/** Short-lived token used only for the Socket.io handshake. */
function signSocketToken(user) {
  return jwt.sign({ id: user._id.toString(), v: user.tokenVersion || 0, typ: 'socket' }, env.jwtSecret, {
    expiresIn: '10m',
  });
}

function verifyToken(token) {
  return jwt.verify(token, env.jwtSecret);
}

function cookieOptions() {
  return {
    httpOnly: true,
    secure: env.cookieSecure,
    sameSite: env.cookieSameSite,
    path: '/',
    maxAge: parseDurationMs(env.jwtExpiresIn),
  };
}

function setAuthCookie(res, user) {
  const token = signAuthToken(user);
  res.cookie(COOKIE_NAME, token, cookieOptions());
  return token;
}

function clearAuthCookie(res) {
  const { maxAge, ...opts } = cookieOptions();
  res.clearCookie(COOKIE_NAME, opts);
}

module.exports = {
  COOKIE_NAME,
  signAuthToken,
  signSocketToken,
  verifyToken,
  setAuthCookie,
  clearAuthCookie,
};
