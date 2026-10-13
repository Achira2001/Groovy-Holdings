const router = require('express').Router();
const c = require('../controllers/googleController');
const { protect, restrictTo } = require('../middleware/auth');

router.get('/calendar/callback', c.callback);
router.get('/calendar/status', protect, restrictTo('admin'), c.status);
router.get('/calendar/auth-url', protect, restrictTo('admin'), c.authUrl);
router.delete('/calendar', protect, restrictTo('admin'), c.disconnect);

module.exports = router;
