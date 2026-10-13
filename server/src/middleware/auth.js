const User = require('../models/User');
const AppError = require('../utils/AppError');
const asyncHandler = require('../utils/asyncHandler');
const { COOKIE_NAME, verifyToken } = require('../utils/jwt');

function extractToken(req) {
  if (req.cookies && req.cookies[COOKIE_NAME]) return req.cookies[COOKIE_NAME];
  const header = req.headers.authorization || '';
  if (header.startsWith('Bearer ')) return header.slice(7);
  return null;
}

async function resolveUser(token) {
  const payload = verifyToken(token);
  if (payload.typ === 'socket') return null; // socket tokens can't access the REST API
  const user = await User.findById(payload.id).select('+tokenVersion');
  if (!user) return null;
  if ((user.tokenVersion || 0) !== (payload.v || 0)) return null; // session revoked
  return user;
}

/** Requires a valid session. */
const protect = asyncHandler(async (req, _res, next) => {
  const token = extractToken(req);
  if (!token) throw new AppError('Please sign in to continue', 401, 'UNAUTHENTICATED');
  let user;
  try {
    user = await resolveUser(token);
  } catch {
    throw new AppError('Your session has expired. Please sign in again', 401, 'UNAUTHENTICATED');
  }
  if (!user) throw new AppError('Your session has expired. Please sign in again', 401, 'UNAUTHENTICATED');
  if (user.isBlocked) throw new AppError('Your account has been suspended. Contact support', 403, 'BLOCKED');
  req.user = user;
  next();
});

/** Attaches req.user if a valid session exists, never fails. */
const optionalAuth = asyncHandler(async (req, _res, next) => {
  const token = extractToken(req);
  if (token) {
    try {
      const user = await resolveUser(token);
      if (user && !user.isBlocked) req.user = user;
    } catch {
      /* ignore */
    }
  }
  next();
});

const restrictTo =
  (...roles) =>
  (req, _res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return next(new AppError('You do not have permission to do this', 403, 'FORBIDDEN'));
    }
    next();
  };

module.exports = { protect, optionalAuth, restrictTo, resolveUser };
