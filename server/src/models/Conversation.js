const mongoose = require('mongoose');

/** One support thread per customer; every admin can see and reply. */
const conversationSchema = new mongoose.Schema(
  {
    customer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    lastMessage: { type: String, default: '' },
    lastMessageAt: { type: Date, default: Date.now, index: true },
    lastSenderRole: { type: String, enum: ['customer', 'admin'] },
    unreadByAdmin: { type: Number, default: 0 },
    unreadByCustomer: { type: Number, default: 0 },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Conversation', conversationSchema);
