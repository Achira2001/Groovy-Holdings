const User = require('../models/User');
const AppError = require('../utils/AppError');
const asyncHandler = require('../utils/asyncHandler');
const { setAuthCookie } = require('../utils/jwt');
const { removePublicFile } = require('../utils/helpers');
const { sendEmail } = require('../utils/email');
const templates = require('../utils/emailTemplates');
const { _validatePassword, _validateWhatsapp } = require('./authController');

// PATCH /api/profile
exports.updateProfile = asyncHandler(async (req, res) => {
  const user = req.user;
  const { name, whatsapp, companyName, bio, address } = req.body;
  if (name !== undefined) {
    if (!String(name).trim()) throw new AppError('Name cannot be empty');
    user.name = name;
  }
  if (whatsapp !== undefined) user.whatsapp = _validateWhatsapp(whatsapp);
  if (companyName !== undefined) user.companyName = companyName;
  if (bio !== undefined) user.bio = bio;
  if (address && typeof address === 'object') {
    user.address = {
      line1: address.line1 ?? user.address?.line1,
      city: address.city ?? user.address?.city,
      district: address.district ?? user.address?.district,
      postalCode: address.postalCode ?? user.address?.postalCode,
    };
  }
  await user.save();
  res.json({ success: true, message: 'Profile saved', user });
});

// POST /api/profile/avatar  (multipart: avatar)
exports.uploadAvatar = asyncHandler(async (req, res) => {
  if (!req.file) throw new AppError('Choose an image to upload');
  const user = req.user;
  removePublicFile(user.avatar); // only deletes local uploads
  user.avatar = `/uploads/avatars/${req.file.filename}`;
  await user.save({ validateBeforeSave: false });
  res.json({ success: true, message: 'Profile photo updated', user });
});

// POST /api/profile/avatar/google
exports.useGoogleAvatar = asyncHandler(async (req, res) => {
  const user = req.user;
  if (!user.googleAvatar) throw new AppError('No Google photo is linked to this account');
  removePublicFile(user.avatar);
  user.avatar = user.googleAvatar;
  await user.save({ validateBeforeSave: false });
  res.json({ success: true, message: 'Using your Google photo', user });
});

// DELETE /api/profile/avatar
exports.removeAvatar = asyncHandler(async (req, res) => {
  const user = req.user;
  removePublicFile(user.avatar);
  user.avatar = '';
  await user.save({ validateBeforeSave: false });
  res.json({ success: true, message: 'Profile photo removed', user });
});

// PATCH /api/profile/password
exports.changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  const user = await User.findById(req.user._id).select('+password +tokenVersion');
  if (user.password) {
    if (!currentPassword) throw new AppError('Enter your current password');
    if (!(await user.comparePassword(currentPassword))) throw new AppError('Current password is incorrect', 401);
  }
  _validatePassword(newPassword);
  if (currentPassword && currentPassword === newPassword) throw new AppError('New password must be different');

  user.password = newPassword;
  user.tokenVersion = (user.tokenVersion || 0) + 1; // revoke other sessions
  await user.save();
  setAuthCookie(res, user); // keep this session signed in

  const { subject, html } = templates.passwordChanged(user.name);
  sendEmail({ to: user.email, subject, html });
  res.json({ success: true, message: 'Password updated', user });
});
