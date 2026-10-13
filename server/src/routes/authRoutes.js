const router = require('express').Router();
const c = require('../controllers/authController');
const { protect } = require('../middleware/auth');
const { authLimiter, emailLimiter } = require('../middleware/rateLimit');

router.post('/register', authLimiter, c.register);
router.post('/register-admin', authLimiter, c.registerAdmin);
router.post('/verify-email', authLimiter, c.verifyEmail);
router.post('/resend-verification', emailLimiter, c.resendVerification);
router.post('/login', authLimiter, c.login);
router.post('/google', authLimiter, c.googleLogin);
router.post('/logout', c.logout);
router.post('/forgot-password', emailLimiter, c.forgotPassword);
router.post('/reset-password', authLimiter, c.resetPassword);
router.get('/me', protect, c.me);
router.get('/socket-token', protect, c.socketToken);

module.exports = router;
