const router = require('express').Router();
const c = require('../controllers/meetingController');
const { protect, restrictTo } = require('../middleware/auth');

router.get('/available', c.availableSlots);
router.use(protect);
router.get('/mine', c.myMeetings);
router.post('/slots/:id/book', restrictTo('customer'), c.bookSlot);
router.post('/slots/:id/cancel', c.cancelMeeting);
router.get('/slots', restrictTo('admin'), c.listSlots);
router.post('/slots', restrictTo('admin'), c.createSlots);
router.patch('/slots/:id/complete', restrictTo('admin'), c.completeMeeting);
router.delete('/slots/:id', restrictTo('admin'), c.deleteSlot);

module.exports = router;
