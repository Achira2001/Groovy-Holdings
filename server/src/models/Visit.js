const mongoose = require('mongoose');

/**
 * One document per visitor per day (business time zone).
 * `pageViews` counts every page opened by that visitor on that day.
 */
const visitSchema = new mongoose.Schema(
  {
    visitorId: { type: String, required: true, maxlength: 64 },
    day: { type: String, required: true }, // YYYY-MM-DD (local business date)
    firstSeenAt: { type: Date, default: Date.now, index: true },
    lastSeenAt: { type: Date, default: Date.now },
    pageViews: { type: Number, default: 1 },
    paths: [{ type: String, maxlength: 200 }],
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    isNewVisitor: { type: Boolean, default: false },
    referrer: { type: String, maxlength: 300 },
    device: { type: String, enum: ['mobile', 'tablet', 'desktop'], default: 'desktop' },
  },
  { timestamps: false }
);

visitSchema.index({ visitorId: 1, day: 1 }, { unique: true });

module.exports = mongoose.model('Visit', visitSchema);
