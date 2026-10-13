const path = require('path');
const fs = require('fs');
const Message = require('../models/Message');
const Conversation = require('../models/Conversation');
const Order = require('../models/Order');
const AppError = require('../utils/AppError');
const asyncHandler = require('../utils/asyncHandler');
const { UPLOAD_ROOT } = require('../utils/helpers');

const INLINE_TYPES = ['image/', 'application/pdf', 'text/plain'];

/**
 * GET /api/files/:filename?download=1
 * Serves private files (chat attachments, order designs) only to the owner customer or admins.
 */
exports.getPrivateFile = asyncHandler(async (req, res) => {
  const filename = path.basename(req.params.filename);
  const full = path.join(UPLOAD_ROOT, 'private', filename);
  const isAdmin = req.user.role === 'admin';

  let meta = null;
  let allowed = false;

  const msg = await Message.findOne({ 'attachments.filename': filename }).lean();
  if (msg) {
    meta = msg.attachments.find((a) => a.filename === filename);
    if (isAdmin) allowed = true;
    else {
      const conv = await Conversation.findById(msg.conversation).lean();
      allowed = conv && String(conv.customer) === String(req.user._id);
    }
  } else {
    const order = await Order.findOne({ 'designFiles.filename': filename }).lean();
    if (order) {
      meta = order.designFiles.find((f) => f.filename === filename);
      allowed = isAdmin || String(order.customer) === String(req.user._id);
    }
  }

  if (!meta || !allowed || !fs.existsSync(full)) throw new AppError('File not found', 404);

  const isSvg = (meta.mimeType || '').includes('svg');
  const inline = !req.query.download && !isSvg && INLINE_TYPES.some((t) => (meta.mimeType || '').startsWith(t));
  res.setHeader('Content-Type', meta.mimeType || 'application/octet-stream');
  res.setHeader(
    'Content-Disposition',
    `${inline ? 'inline' : 'attachment'}; filename="${encodeURIComponent(meta.originalName || filename)}"`
  );
  res.setHeader('Cache-Control', 'private, max-age=3600');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Content-Security-Policy', "default-src 'none'; img-src 'self'; style-src 'unsafe-inline'; sandbox");
  res.setHeader('Cross-Origin-Resource-Policy', 'same-site');
  fs.createReadStream(full).pipe(res);
});
