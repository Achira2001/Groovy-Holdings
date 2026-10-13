const Conversation = require('../models/Conversation');
const Message = require('../models/Message');
const User = require('../models/User');
const env = require('../config/env');
const AppError = require('../utils/AppError');
const asyncHandler = require('../utils/asyncHandler');
const { escapeRegex, removePrivateFile } = require('../utils/helpers');
const { sendEmail, adminEmails } = require('../utils/email');
const templates = require('../utils/emailTemplates');
const realtime = require('../utils/realtime');

const CUSTOMER_FIELDS = 'name email whatsapp avatar companyName lastLoginAt';

async function getOrCreateConversation(customerId) {
  return Conversation.findOneAndUpdate(
    { customer: customerId },
    { $setOnInsert: { customer: customerId, lastMessageAt: new Date() } },
    { new: true, upsert: true }
  ).populate('customer', CUSTOMER_FIELDS);
}

/** Loads a conversation and checks the current user can access it. */
async function loadConversation(req) {
  const conv = await Conversation.findById(req.params.id).populate('customer', CUSTOMER_FIELDS);
  if (!conv) throw new AppError('Conversation not found', 404);
  if (req.user.role !== 'admin' && String(conv.customer?._id) !== String(req.user._id)) {
    throw new AppError('Conversation not found', 404);
  }
  return conv;
}

const serialize = (msg, sender) => ({
  ...msg.toObject(),
  sender: { _id: sender._id, name: sender.name, avatar: sender.avatar, role: sender.role },
});

// GET /api/chat/my-conversation (customer)
exports.myConversation = asyncHandler(async (req, res) => {
  const conversation = await getOrCreateConversation(req.user._id);
  res.json({ success: true, conversation });
});

// POST /api/chat/start/:customerId (admin opens a thread with a customer)
exports.startWithCustomer = asyncHandler(async (req, res) => {
  const customer = await User.findOne({ _id: req.params.customerId, role: 'customer' });
  if (!customer) throw new AppError('Customer not found', 404);
  const conversation = await getOrCreateConversation(customer._id);
  res.json({ success: true, conversation });
});

// GET /api/chat/conversations?search= (admin)
exports.listConversations = asyncHandler(async (req, res) => {
  const filter = {};
  if (req.query.search) {
    const rx = new RegExp(escapeRegex(req.query.search), 'i');
    const users = await User.find({ role: 'customer', $or: [{ name: rx }, { email: rx }, { whatsapp: rx }] }).select('_id').lean();
    filter.customer = { $in: users.map((u) => u._id) };
  }
  const conversations = await Conversation.find(filter)
    .populate('customer', CUSTOMER_FIELDS)
    .sort({ lastMessageAt: -1 })
    .limit(200)
    .lean();
  res.json({ success: true, conversations: conversations.filter((c) => c.customer) });
});

// GET /api/chat/conversations/:id/messages?before=<iso>&limit=40
exports.getMessages = asyncHandler(async (req, res) => {
  const conv = await loadConversation(req);
  const limit = Math.min(100, Number(req.query.limit) || 40);
  const filter = { conversation: conv._id };
  if (req.query.before) filter.createdAt = { $lt: new Date(req.query.before) };
  const messages = await Message.find(filter)
    .sort({ createdAt: -1 })
    .limit(limit)
    .populate('sender', 'name avatar role')
    .lean();
  res.json({ success: true, conversation: conv, messages: messages.reverse(), hasMore: messages.length === limit });
});

// POST /api/chat/conversations/:id/messages (multipart: text + files[])
exports.sendMessage = asyncHandler(async (req, res) => {
  const conv = await loadConversation(req);
  const text = String(req.body.text || '').trim();
  const files = req.files || [];
  if (!text && !files.length) throw new AppError('Type a message or attach a file');

  const senderRole = req.user.role === 'admin' ? 'admin' : 'customer';
  const message = await Message.create({
    conversation: conv._id,
    sender: req.user._id,
    senderRole,
    text,
    attachments: files.map((f) => ({ filename: f.filename, originalName: f.originalname, mimeType: f.mimetype, size: f.size })),
  });

  conv.lastMessage = text || `📎 ${files.length} file${files.length > 1 ? 's' : ''}`;
  conv.lastMessageAt = message.createdAt;
  conv.lastSenderRole = senderRole;
  if (senderRole === 'admin') conv.unreadByCustomer += 1;
  else conv.unreadByAdmin += 1;
  await conv.save();

  const payload = serialize(message, req.user);
  const convJson = conv.toObject();
  realtime.toConversation(conv._id, 'chat:message', payload);
  realtime.toAdmins('chat:conversation', convJson);
  realtime.toUser(conv.customer._id, 'chat:conversation', convJson);

  // Email notifications (non-blocking)
  if (env.chatEmailNotifications) {
    if (senderRole === 'admin') {
      const t = templates.newChatMessage({
        recipientName: conv.customer.name,
        senderName: 'Groovy Holdings',
        text,
        fileCount: files.length,
        url: `${env.clientUrl}/chat`,
      });
      sendEmail({ to: conv.customer.email, ...t });
    } else {
      const t = templates.newChatMessage({
        recipientName: 'Team',
        senderName: req.user.name,
        text,
        fileCount: files.length,
        url: `${env.clientUrl}/admin/chat?c=${conv._id}`,
      });
      adminEmails().then((to) => sendEmail({ to, ...t, replyTo: req.user.email }));
    }
  }
  res.status(201).json({ success: true, message: payload });
});

// POST /api/chat/conversations/:id/read
exports.markRead = asyncHandler(async (req, res) => {
  const conv = await loadConversation(req);
  const isAdmin = req.user.role === 'admin';
  const otherRole = isAdmin ? 'customer' : 'admin';
  await Message.updateMany({ conversation: conv._id, senderRole: otherRole, readAt: null }, { readAt: new Date() });
  if (isAdmin) conv.unreadByAdmin = 0;
  else conv.unreadByCustomer = 0;
  await conv.save();
  realtime.toConversation(conv._id, 'chat:read', { conversationId: conv._id, by: isAdmin ? 'admin' : 'customer', at: new Date() });
  if (isAdmin) realtime.toAdmins('chat:conversation', conv.toObject());
  res.json({ success: true });
});

// GET /api/chat/conversations/:id/files
exports.listFiles = asyncHandler(async (req, res) => {
  const conv = await loadConversation(req);
  const messages = await Message.find({ conversation: conv._id, 'attachments.0': { $exists: true } })
    .sort({ createdAt: -1 })
    .populate('sender', 'name role')
    .lean();
  const files = messages.flatMap((m) =>
    m.attachments.map((a) => ({ ...a, messageId: m._id, createdAt: m.createdAt, sender: m.sender }))
  );
  res.json({ success: true, files });
});

// DELETE /api/chat/messages/:messageId (sender or admin)
exports.deleteMessage = asyncHandler(async (req, res) => {
  const msg = await Message.findById(req.params.messageId);
  if (!msg) throw new AppError('Message not found', 404);
  if (req.user.role !== 'admin' && String(msg.sender) !== String(req.user._id)) throw new AppError('Not allowed', 403);
  msg.attachments.forEach((a) => removePrivateFile(a.filename));
  await msg.deleteOne();
  realtime.toConversation(msg.conversation, 'chat:deleted', { messageId: msg._id });
  res.json({ success: true });
});

// GET /api/chat/unread
exports.unreadCount = asyncHandler(async (req, res) => {
  if (req.user.role === 'admin') {
    const [agg] = await Conversation.aggregate([{ $group: { _id: null, total: { $sum: '$unreadByAdmin' } } }]);
    return res.json({ success: true, unread: agg?.total || 0 });
  }
  const conv = await Conversation.findOne({ customer: req.user._id }).lean();
  res.json({ success: true, unread: conv?.unreadByCustomer || 0 });
});
