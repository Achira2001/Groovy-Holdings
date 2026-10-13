const { OAuth2Client } = require('google-auth-library');
const User = require('../models/User');
const env = require('../config/env');
const AppError = require('../utils/AppError');
const asyncHandler = require('../utils/asyncHandler');
const { createHashedToken, hashToken, safeEqual } = require('../utils/tokens');
const { setAuthCookie, clearAuthCookie, signSocketToken } = require('../utils/jwt');
const { sendEmail } = require('../utils/email');
const templates = require('../utils/emailTemplates');
const { normalizeWhatsapp } = require('../utils/helpers');

const googleClient = new OAuth2Client(env.google.clientId);
const EMAIL_RE = /^\S+@\S+\.\S+$/;

function validatePassword(pw) {
  if (!pw || pw.length < 8) throw new AppError('Password must be at least 8 characters');
  if (!/[A-Za-z]/.test(pw) || !/\d/.test(pw)) throw new AppError('Password must contain letters and numbers');
}

function validateWhatsapp(num) {
  const n = normalizeWhatsapp(num);
  if (!/^\d{9,15}$/.test(n)) throw new AppError('Please enter a valid WhatsApp number (e.g. 0771234567)');
  return n;
}

async function sendVerification(user) {
  const { raw, hashed } = createHashedToken();
  user.emailVerifyToken = hashed;
  user.emailVerifyExpires = new Date(Date.now() + 24 * 60 * 60 * 1000);
  await user.save({ validateBeforeSave: false });
  const url = `${env.clientUrl}/verify-email?token=${raw}`;
  const { subject, html } = templates.verifyEmail(user.name, url);
  await sendEmail({ to: user.email, subject, html, text: `Confirm your email: ${url}` });
}

async function createAccount(req, role) {
  const { name, email, password, whatsapp } = req.body;
  if (!name || !email || !password || !whatsapp) throw new AppError('Name, email, WhatsApp number and password are required');
  if (!EMAIL_RE.test(email)) throw new AppError('Please enter a valid email');
  validatePassword(password);
  const phone = validateWhatsapp(whatsapp);

  const existing = await User.findOne({ email: email.toLowerCase() });
  if (existing) {
    if (!existing.isEmailVerified && existing.authProvider === 'local') {
      // Allow re-registering an unverified account: refresh details and resend email
      existing.name = name;
      existing.password = password;
      existing.whatsapp = phone;
      existing.role = role;
      await existing.save();
      await sendVerification(existing);
      return existing;
    }
    throw new AppError('An account with this email already exists. Please sign in', 409);
  }
  const user = await User.create({ name, email, password, whatsapp: phone, role, authProvider: 'local' });
  await sendVerification(user);
  return user;
}

// POST /api/auth/register
exports.register = asyncHandler(async (req, res) => {
  await createAccount(req, 'customer');
  res.status(201).json({
    success: true,
    message: 'Account created. Check your inbox and click the link to confirm your email.',
  });
});

// POST /api/auth/register-admin
exports.registerAdmin = asyncHandler(async (req, res) => {
  if (!safeEqual(req.body.adminCode, env.adminCode)) throw new AppError('The admin code is not correct', 403);
  await createAccount(req, 'admin');
  res.status(201).json({
    success: true,
    message: 'Admin account created. Confirm your email to activate it.',
  });
});

// POST /api/auth/verify-email
exports.verifyEmail = asyncHandler(async (req, res) => {
  const { token } = req.body;
  if (!token) throw new AppError('Verification token is missing');
  const user = await User.findOne({
    emailVerifyToken: hashToken(token),
    emailVerifyExpires: { $gt: new Date() },
  });
  if (!user) throw new AppError('This link is invalid or has expired. Request a new one', 400, 'TOKEN_INVALID');
  user.isEmailVerified = true;
  user.emailVerifyToken = undefined;
  user.emailVerifyExpires = undefined;
  user.lastLoginAt = new Date();
  await user.save({ validateBeforeSave: false });
  setAuthCookie(res, user);
  res.json({ success: true, message: 'Email confirmed. Welcome!', user });
});

// POST /api/auth/resend-verification
exports.resendVerification = asyncHandler(async (req, res) => {
  const user = await User.findOne({ email: String(req.body.email || '').toLowerCase() });
  if (user && !user.isEmailVerified) await sendVerification(user);
  res.json({ success: true, message: 'If that account needs confirming, a new link is on its way.' });
});

// POST /api/auth/login
exports.login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) throw new AppError('Email and password are required');
  const user = await User.findOne({ email: String(email).toLowerCase() }).select('+password +tokenVersion');
  if (!user) throw new AppError('Email or password is incorrect', 401);
  if (!user.password) {
    throw new AppError('This account uses Google sign-in. Continue with Google, or use "Forgot password" to set a password', 400, 'GOOGLE_ACCOUNT');
  }
  if (!(await user.comparePassword(password))) throw new AppError('Email or password is incorrect', 401);
  if (user.isBlocked) throw new AppError('Your account has been suspended. Contact support', 403, 'BLOCKED');
  if (!user.isEmailVerified) throw new AppError('Confirm your email before signing in. Check your inbox', 403, 'EMAIL_NOT_VERIFIED');

  user.lastLoginAt = new Date();
  await user.save({ validateBeforeSave: false });
  setAuthCookie(res, user);
  res.json({ success: true, user });
});

// POST /api/auth/google   (customers only)
exports.googleLogin = asyncHandler(async (req, res) => {
  const { credential } = req.body;
  if (!credential) throw new AppError('Google credential is missing');
  if (!env.google.clientId) throw new AppError('Google sign-in is not configured on the server', 500);

  let payload;
  try {
    const ticket = await googleClient.verifyIdToken({ idToken: credential, audience: env.google.clientId });
    payload = ticket.getPayload();
  } catch {
    throw new AppError('Google sign-in failed. Please try again', 401);
  }
  if (!payload.email_verified) throw new AppError('Your Google email is not verified', 400);

  let user = await User.findOne({ $or: [{ googleId: payload.sub }, { email: payload.email.toLowerCase() }] }).select('+tokenVersion');

  if (user && user.role === 'admin') {
    throw new AppError('Google sign-in is only for customers. Admins sign in with email and password', 403);
  }
  if (user?.isBlocked) throw new AppError('Your account has been suspended. Contact support', 403, 'BLOCKED');

  if (!user) {
    user = await User.create({
      name: payload.name || payload.email.split('@')[0],
      email: payload.email,
      googleId: payload.sub,
      googleAvatar: payload.picture,
      avatar: payload.picture || '',
      authProvider: 'google',
      isEmailVerified: true,
      role: 'customer',
    });
  } else {
    user.googleId = payload.sub;
    user.googleAvatar = payload.picture;
    if (!user.avatar && payload.picture) user.avatar = payload.picture;
    user.isEmailVerified = true;
  }
  user.lastLoginAt = new Date();
  await user.save({ validateBeforeSave: false });
  setAuthCookie(res, user);
  res.json({ success: true, user, needsWhatsapp: !user.whatsapp });
});

// POST /api/auth/logout
exports.logout = (_req, res) => {
  clearAuthCookie(res);
  res.json({ success: true });
};

// GET /api/auth/me
exports.me = (req, res) => res.json({ success: true, user: req.user });

// GET /api/auth/socket-token
exports.socketToken = (req, res) => res.json({ success: true, token: signSocketToken(req.user) });

// POST /api/auth/forgot-password
exports.forgotPassword = asyncHandler(async (req, res) => {
  const email = String(req.body.email || '').toLowerCase();
  const user = await User.findOne({ email });
  if (user && !user.isBlocked) {
    const { raw, hashed } = createHashedToken();
    user.resetPasswordToken = hashed;
    user.resetPasswordExpires = new Date(Date.now() + 60 * 60 * 1000);
    await user.save({ validateBeforeSave: false });
    const url = `${env.clientUrl}/reset-password?token=${raw}`;
    const { subject, html } = templates.resetPassword(user.name, url);
    await sendEmail({ to: user.email, subject, html, text: `Reset your password: ${url}` });
  }
  // Same response either way so emails can't be enumerated
  res.json({ success: true, message: 'If an account exists for that email, a reset link has been sent.' });
});

// POST /api/auth/reset-password
exports.resetPassword = asyncHandler(async (req, res) => {
  const { token, password } = req.body;
  if (!token) throw new AppError('Reset token is missing');
  validatePassword(password);
  const user = await User.findOne({
    resetPasswordToken: hashToken(token),
    resetPasswordExpires: { $gt: new Date() },
  }).select('+tokenVersion');
  if (!user) throw new AppError('This reset link is invalid or has expired. Request a new one', 400, 'TOKEN_INVALID');

  user.password = password;
  user.resetPasswordToken = undefined;
  user.resetPasswordExpires = undefined;
  user.isEmailVerified = true; // they proved ownership of the inbox
  user.tokenVersion = (user.tokenVersion || 0) + 1; // sign out everywhere
  await user.save();

  const { subject, html } = templates.passwordChanged(user.name);
  sendEmail({ to: user.email, subject, html });
  res.json({ success: true, message: 'Password updated. You can sign in with your new password.' });
});

exports._validatePassword = validatePassword;
exports._validateWhatsapp = validateWhatsapp;
