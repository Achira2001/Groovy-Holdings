const router = require('express').Router();
const c = require('../controllers/productController');
const { protect, optionalAuth, restrictTo } = require('../middleware/auth');
const upload = require('../middleware/upload');

router.get('/', optionalAuth, c.listProducts);
router.get('/:idOrSlug', optionalAuth, c.getProduct);
router.post('/', protect, restrictTo('admin'), upload.productImages, c.createProduct);
router.patch('/:id', protect, restrictTo('admin'), upload.productImages, c.updateProduct);
router.delete('/:id', protect, restrictTo('admin'), c.deleteProduct);

module.exports = router;
