const User = require('../models/User');
const Order = require('../models/Order');
const MeetingSlot = require('../models/MeetingSlot');
const Conversation = require('../models/Conversation');
const Message = require('../models/Message');
const AppError = require('../utils/AppError');
const asyncHandler = require('../utils/asyncHandler');
const { escapeRegex, pagination, normalizeWhatsapp } = require('../utils/helpers');

// GET /api/admin/users?search=&role=&status=&page=&limit=&sort=
exports.listUsers = asyncHandler(async (req, res) => {
  const { search, role, status, sort = '-createdAt' } = req.query;
  const { page, limit, skip } = pagination(req.query, 15);
  const filter = {};
  if (role && ['customer', 'admin'].includes(role)) filter.role = role;
  if (status === 'blocked') filter.isBlocked = true;
  if (status === 'active') filter.isBlocked = false;
  if (status === 'unverified') filter.isEmailVerified = false;
  if (search) {
    const rx = new RegExp(escapeRegex(search), 'i');
    filter.$or = [{ name: rx }, { email: rx }, { whatsapp: rx }, { companyName: rx }];
  }
  const allowedSort = ['createdAt', '-createdAt', 'name', '-name', 'lastLoginAt', '-lastLoginAt'];
  const [users, total] = await Promise.all([
    User.find(filter).sort(allowedSort.includes(sort) ? sort : '-createdAt').skip(skip).limit(limit).lean(),
    User.countDocuments(filter),
  ]);

  // Attach order counts in one query
  const ids = users.map((u) => u._id);
  const counts = await Order.aggregate([
    { $match: { customer: { $in: ids } } },
    { $group: { _id: '$customer', orders: { $sum: 1 }, spent: { $sum: '$amountPaid' } } },
  ]);
  const map = Object.fromEntries(counts.map((c) => [String(c._id), c]));
  users.forEach((u) => {
    delete u.password;
    delete u.tokenVersion;
    u.orderCount = map[String(u._id)]?.orders || 0;
    u.totalSpent = map[String(u._id)]?.spent || 0;
  });

  res.json({ success: true, users, total, page, pages: Math.ceil(total / limit) });
});

// GET /api/admin/users/:id
exports.getUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) throw new AppError('User not found', 404);
  const [orders, meetings] = await Promise.all([
    Order.find({ customer: user._id }).sort('-createdAt').limit(10).lean(),
    MeetingSlot.find({ bookedBy: user._id }).sort('-start').limit(10).lean(),
  ]);
  res.json({ success: true, user, orders, meetings });
});

// PATCH /api/admin/users/:id
exports.updateUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id).select('+tokenVersion');
  if (!user) throw new AppError('User not found', 404);
  const isSelf = String(user._id) === String(req.user._id);
  const { name, whatsapp, companyName, isBlocked, isEmailVerified, role } = req.body;

  if (name !== undefined) user.name = name;
  if (companyName !== undefined) user.companyName = companyName;
  if (whatsapp !== undefined) user.whatsapp = normalizeWhatsapp(whatsapp);
  if (isEmailVerified !== undefined) user.isEmailVerified = Boolean(isEmailVerified);
  if (isBlocked !== undefined) {
    if (isSelf) throw new AppError("You can't block your own account");
    user.isBlocked = Boolean(isBlocked);
    if (user.isBlocked) user.tokenVersion = (user.tokenVersion || 0) + 1; // force sign-out
  }
  if (role !== undefined && ['customer', 'admin'].includes(role)) {
    if (isSelf) throw new AppError("You can't change your own role");
    user.role = role;
    user.tokenVersion = (user.tokenVersion || 0) + 1;
  }
  await user.save();
  res.json({ success: true, message: 'User updated', user });
});

// DELETE /api/admin/users/:id
exports.deleteUser = asyncHandler(async (req, res) => {
  if (String(req.params.id) === String(req.user._id)) throw new AppError("You can't delete your own account");
  const user = await User.findById(req.params.id);
  if (!user) throw new AppError('User not found', 404);

  const conv = await Conversation.findOne({ customer: user._id });
  if (conv) {
    await Message.deleteMany({ conversation: conv._id });
    await conv.deleteOne();
  }
  // Free up any future meetings booked by this user
  await MeetingSlot.updateMany(
    { bookedBy: user._id, start: { $gt: new Date() }, status: 'booked' },
    { $set: { status: 'available' }, $unset: { bookedBy: 1, bookedAt: 1, topic: 1, notes: 1, meetLink: 1, calendarEventId: 1 } }
  );
  await user.deleteOne();
  res.json({ success: true, message: 'User deleted' });
});
