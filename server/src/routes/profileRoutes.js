const router = require('express').Router();
const c = require('../controllers/profileController');
const { protect } = require('../middleware/auth');
const upload = require('../middleware/upload');

router.use(protect);
router.patch('/', c.updateProfile);
router.post('/avatar', upload.avatar, c.uploadAvatar);
router.post('/avatar/google', c.useGoogleAvatar);
router.delete('/avatar', c.removeAvatar);
router.patch('/password', c.changePassword);

module.exports = router;
