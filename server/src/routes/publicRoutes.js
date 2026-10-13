const router = require('express').Router();
const env = require('../config/env');
const Product = require('../models/Product');
const Order = require('../models/Order');
const User = require('../models/User');
const asyncHandler = require('../utils/asyncHandler');
const analytics = require('../controllers/analyticsController');

// GET /api/public/config – non-secret settings the frontend can use
router.get('/config', (_req, res) => {
  res.json({
    success: true,
    businessName: env.businessName,
    whatsapp: env.businessWhatsapp,
    timezone: env.timezone,
    googleSignIn: Boolean(env.google.clientId),
  });
});

// GET /api/public/highlights – numbers for the home page
router.get(
  '/highlights',
  asyncHandler(async (_req, res) => {
    const [products, orders, customers, items] = await Promise.all([
      Product.countDocuments({ isActive: true }),
      Order.countDocuments({ status: { $ne: 'cancelled' } }),
      User.countDocuments({ role: 'customer' }),
      Order.aggregate([{ $match: { status: 'delivered' } }, { $group: { _id: null, n: { $sum: '$totalQuantity' } } }]),
    ]);
    res.json({ success: true, products, orders, customers, itemsDelivered: items[0]?.n || 0 });
  })
);

// POST /api/public/visit – anonymous page-view tracking for the admin dashboard
router.post('/visit', analytics.trackVisit);

module.exports = router;
