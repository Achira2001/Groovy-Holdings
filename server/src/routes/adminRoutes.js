const router = require('express').Router();
const users = require('../controllers/adminUserController');
const stats = require('../controllers/statsController');
const { protect, restrictTo } = require('../middleware/auth');

router.use(protect, restrictTo('admin'));
router.get('/stats', stats.dashboard);
router.get('/users', users.listUsers);
router.get('/users/:id', users.getUser);
router.patch('/users/:id', users.updateUser);
router.delete('/users/:id', users.deleteUser);

module.exports = router;
