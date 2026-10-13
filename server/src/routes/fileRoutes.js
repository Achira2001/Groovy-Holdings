const router = require('express').Router();
const c = require('../controllers/fileController');
const { protect } = require('../middleware/auth');

router.get('/:filename', protect, c.getPrivateFile);

module.exports = router;
