const mongoose = require('mongoose');

const meetingSlotSchema = new mongoose.Schema(
  {
    start: { type: Date, required: true, index: true },
    end: { type: Date, required: true },
    status: {
      type: String,
      enum: ['available', 'booked', 'completed', 'cancelled'],
      default: 'available',
      index: true,
    },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },

    // Booking details
    bookedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', index: true },
    bookedAt: Date,
    topic: { type: String, trim: true, maxlength: 160 },
    notes: { type: String, trim: true, maxlength: 1500 },
    meetLink: String,
    calendarEventId: String,
    calendarHtmlLink: String,
    cancelledReason: String,
  },
  { timestamps: true }
);

module.exports = mongoose.model('MeetingSlot', meetingSlotSchema);
