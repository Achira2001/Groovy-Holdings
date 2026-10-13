const router = require('express').Router();
const c = require('../controllers/orderController');
const { protect, restrictTo } = require('../middleware/auth');
const upload = require('../middleware/upload');

router.use(protect);
router.post('/', restrictTo('customer'), upload.designFiles, c.createOrder);
router.get('/mine', c.myOrders);
router.get('/', restrictTo('admin'), c.listOrders);
router.get('/:id', c.getOrder);
router.patch('/:id/cancel', restrictTo('customer'), c.cancelMyOrder);
router.patch('/:id', restrictTo('admin'), c.updateOrder);
router.delete('/:id', restrictTo('admin'), c.deleteOrder);

module.exports = router;
