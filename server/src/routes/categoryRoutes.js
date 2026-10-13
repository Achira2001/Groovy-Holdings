const router = require('express').Router();
const c = require('../controllers/categoryController');
const { protect, optionalAuth, restrictTo } = require('../middleware/auth');
const upload = require('../middleware/upload');

router.get('/', optionalAuth, c.listCategories);
router.post('/', protect, restrictTo('admin'), upload.categoryImage, c.createCategory);
router.patch('/:id', protect, restrictTo('admin'), upload.categoryImage, c.updateCategory);
router.delete('/:id', protect, restrictTo('admin'), c.deleteCategory);

module.exports = router;
