const MeetingSlot = require('../models/MeetingSlot');

const env = require('../config/env');
const AppError = require('../utils/AppError');
const asyncHandler = require('../utils/asyncHandler');
const { sendEmail, adminEmails } = require('../utils/email');
const templates = require('../utils/emailTemplates');
const calendar = require('../utils/googleCalendar');
const realtime = require('../utils/realtime');

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const TIME_RE = /^([01]\d|2[0-3]):[0-5]\d$/;
const MIN_LEAD_MS = 60 * 60 * 1000; // customers must book at least 1 hour ahead

/** Build a Date from a local business date + time (e.g. Asia/Colombo). */
const localDate = (date, time) => new Date(`${date}T${time}:00${env.timezoneOffset}`);
const toMinutes = (t) => Number(t.slice(0, 2)) * 60 + Number(t.slice(3, 5));

// POST /api/meetings/slots (admin)
// body: { dates: ["2026-10-05", ...], startTime: "09:00", endTime: "12:00", duration: 30, gap: 0 }
exports.createSlots = asyncHandler(async (req, res) => {
  const { dates, startTime, endTime } = req.body;
  const duration = Number(req.body.duration) || 30;
  const gap = Math.max(0, Number(req.body.gap) || 0);
  const list = [].concat(dates || []).filter((d) => DATE_RE.test(d));
  if (!list.length) throw new AppError('Choose at least one date');
  if (!TIME_RE.test(startTime) || !TIME_RE.test(endTime)) throw new AppError('Enter valid start and end times');
  if (toMinutes(endTime) <= toMinutes(startTime)) throw new AppError('End time must be after start time');
  if (duration < 10 || duration > 240) throw new AppError('Meeting length must be between 10 and 240 minutes');
  if (list.length > 62) throw new AppError('You can create slots for up to 62 days at once');

  const candidates = [];
  for (const date of list) {
    const dayEnd = localDate(date, endTime);
    let cursor = localDate(date, startTime);
    while (cursor.getTime() + duration * 60000 <= dayEnd.getTime()) {
      const end = new Date(cursor.getTime() + duration * 60000);
      if (cursor.getTime() > Date.now()) candidates.push({ start: new Date(cursor), end });
      cursor = new Date(end.getTime() + gap * 60000);
    }
  }
  if (!candidates.length) throw new AppError('No future slots fit in that time range');

  // Skip anything overlapping an existing active slot
  const existing = await MeetingSlot.find({
    status: { $ne: 'cancelled' },
    start: { $lt: candidates[candidates.length - 1].end },
    end: { $gt: candidates[0].start },
  }).lean();
  const overlaps = (c) => existing.some((e) => c.start < e.end && c.end > e.start);
  const toCreate = candidates.filter((c) => !overlaps(c)).map((c) => ({ ...c, createdBy: req.user._id }));

  const created = toCreate.length ? await MeetingSlot.insertMany(toCreate) : [];
  res.status(201).json({
    success: true,
    message: `${created.length} slot${created.length === 1 ? '' : 's'} added${candidates.length - created.length ? `, ${candidates.length - created.length} skipped (overlapping)` : ''}`,
    created: created.length,
    skipped: candidates.length - created.length,
  });
});

// GET /api/meetings/slots?from=&to=&status= (admin)
exports.listSlots = asyncHandler(async (req, res) => {
  const filter = {};
  const from = req.query.from ? new Date(req.query.from) : new Date(Date.now() - 7 * 864e5);
  const to = req.query.to ? new Date(req.query.to) : new Date(Date.now() + 90 * 864e5);
  filter.start = { $gte: from, $lte: to };
  if (req.query.status && req.query.status !== 'all') filter.status = req.query.status;
  const slots = await MeetingSlot.find(filter).populate('bookedBy', 'name email whatsapp avatar').sort('start').lean();
  res.json({ success: true, slots });
});

// DELETE /api/meetings/slots/:id (admin) – only unbooked slots
exports.deleteSlot = asyncHandler(async (req, res) => {
  const slot = await MeetingSlot.findById(req.params.id);
  if (!slot) throw new AppError('Slot not found', 404);
  if (slot.status === 'booked') throw new AppError('This slot is booked. Cancel the meeting first');
  await slot.deleteOne();
  res.json({ success: true, message: 'Slot removed' });
});

// GET /api/meetings/available (public)
exports.availableSlots = asyncHandler(async (_req, res) => {
  const slots = await MeetingSlot.find({
    status: 'available',
    start: { $gt: new Date(Date.now() + MIN_LEAD_MS), $lt: new Date(Date.now() + 120 * 864e5) },
  })
    .select('start end status')
    .sort('start')
    .lean();
  res.json({ success: true, slots, timezone: env.timezone });
});

// POST /api/meetings/slots/:id/book (customer)
exports.bookSlot = asyncHandler(async (req, res) => {
  const topic = String(req.body.topic || '').trim();
  if (!topic) throw new AppError('Tell us what the meeting is about');

  // Atomic: only one customer can win the slot
  const slot = await MeetingSlot.findOneAndUpdate(
    { _id: req.params.id, status: 'available', start: { $gt: new Date(Date.now() + MIN_LEAD_MS) } },
    { $set: { status: 'booked', bookedBy: req.user._id, bookedAt: new Date(), topic, notes: req.body.notes } },
    { new: true }
  );
  if (!slot) throw new AppError('Sorry, this time was just booked by someone else. Choose another slot', 409, 'SLOT_TAKEN');

  const admins = await adminEmails();
  // Create Google Calendar event + Meet link (attendees get Google Calendar notifications)
  try {
    const event = await calendar.createMeetEvent({
      summary: `Groovy Holdings × ${req.user.name}: ${topic}`,
      description: `Customer: ${req.user.name}\nEmail: ${req.user.email}\nWhatsApp: +${req.user.whatsapp || '-'}\n\n${req.body.notes || ''}`,
      start: slot.start,
      end: slot.end,
      attendees: [req.user.email, ...admins],
    });
    if (event) {
      slot.meetLink = event.meetLink;
      slot.calendarEventId = event.eventId;
      slot.calendarHtmlLink = event.htmlLink;
      await slot.save();
    }
  } catch (err) {
    console.warn('⚠ Google Calendar event failed:', err.message);
  }

  const forCustomer = templates.meetingBooked({ recipientName: req.user.name, customer: req.user, slot, forAdmin: false });
  sendEmail({ to: req.user.email, ...forCustomer });
  const forAdmin = templates.meetingBooked({ recipientName: 'Team', customer: req.user, slot, forAdmin: true });
  sendEmail({ to: admins, ...forAdmin });

  realtime.notifyAdmins('Meeting booked', `${req.user.name} · ${templates.fmtDate(slot.start)}`, '/admin/meetings', 'meeting');
  realtime.toAdmins('meetings:changed', { id: slot._id });
  realtime.getIO()?.emit('meetings:availability', { id: slot._id, status: 'booked' });

  res.status(201).json({
    success: true,
    message: slot.meetLink ? 'Meeting booked. The Google Meet link was emailed to you' : 'Meeting booked. Details were emailed to you',
    slot,
  });
});

// GET /api/meetings/mine (customer)
exports.myMeetings = asyncHandler(async (req, res) => {
  const meetings = await MeetingSlot.find({ bookedBy: req.user._id }).sort('-start').lean();
  res.json({ success: true, meetings });
});

// POST /api/meetings/slots/:id/cancel (customer who booked, or admin)
// body: { reason, releaseSlot (admin only, default true) }
exports.cancelMeeting = asyncHandler(async (req, res) => {
  const slot = await MeetingSlot.findById(req.params.id).populate('bookedBy', 'name email');
  if (!slot || slot.status !== 'booked') throw new AppError('Booked meeting not found', 404);
  const isAdmin = req.user.role === 'admin';
  if (!isAdmin && String(slot.bookedBy?._id) !== String(req.user._id)) throw new AppError('Booked meeting not found', 404);

  const customer = slot.bookedBy;
  const snapshot = slot.toObject();
  await calendar.cancelEvent(slot.calendarEventId);

  const release = isAdmin ? req.body.releaseSlot !== false : true;
  if (release && slot.start > new Date()) {
    slot.status = 'available';
    slot.bookedBy = undefined;
    slot.bookedAt = undefined;
    slot.topic = undefined;
    slot.notes = undefined;
    slot.meetLink = undefined;
    slot.calendarEventId = undefined;
    slot.calendarHtmlLink = undefined;
  } else {
    slot.status = 'cancelled';
    slot.cancelledReason = req.body.reason;
  }
  await slot.save();

  const by = isAdmin ? 'Groovy Holdings' : customer?.name || 'the customer';
  if (customer) {
    const t = templates.meetingCancelled({ recipientName: customer.name, slot: snapshot, cancelledBy: by, reason: req.body.reason });
    sendEmail({ to: customer.email, ...t });
    if (isAdmin) realtime.notifyUser(customer._id, 'Meeting cancelled', templates.fmtDate(snapshot.start), '/account/meetings', 'meeting');
  }
  const ta = templates.meetingCancelled({ recipientName: 'Team', slot: snapshot, cancelledBy: by, reason: req.body.reason });
  adminEmails().then((to) => sendEmail({ to, ...ta }));
  if (!isAdmin) realtime.notifyAdmins('Meeting cancelled', `${customer?.name} · ${templates.fmtDate(snapshot.start)}`, '/admin/meetings', 'meeting');
  realtime.toAdmins('meetings:changed', { id: slot._id });
  realtime.getIO()?.emit('meetings:availability', { id: slot._id, status: slot.status });

  res.json({ success: true, message: 'Meeting cancelled' });
});

// PATCH /api/meetings/slots/:id/complete (admin)
exports.completeMeeting = asyncHandler(async (req, res) => {
  const slot = await MeetingSlot.findById(req.params.id);
  if (!slot || slot.status !== 'booked') throw new AppError('Booked meeting not found', 404);
  slot.status = 'completed';
  await slot.save();
  res.json({ success: true, message: 'Marked as completed', slot });
});

