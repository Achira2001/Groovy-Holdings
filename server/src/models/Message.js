const mongoose = require('mongoose');

const attachmentSchema = new mongoose.Schema(
  {
    filename: { type: String, required: true },
    originalName: String,
    mimeType: String,
    size: Number,
  },
  { _id: false }
);

const messageSchema = new mongoose.Schema(
  {
    conversation: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Conversation',
      required: true,
      index: true,
    },
    sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    senderRole: { type: String, enum: ['customer', 'admin'], required: true },
    text: { type: String, trim: true, maxlength: 5000, default: '' },
    attachments: [attachmentSchema],
    readAt: Date,
  },
  { timestamps: true }
);

messageSchema.index({ conversation: 1, createdAt: -1 });
messageSchema.index({ 'attachments.filename': 1 });

module.exports = mongoose.model('Message', messageSchema);
