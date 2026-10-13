const Order = require('../models/Order');
const Product = require('../models/Product');
const Counter = require('../models/Counter');
const AppError = require('../utils/AppError');
const asyncHandler = require('../utils/asyncHandler');
const { parseJSON, escapeRegex, pagination, removePrivateFile, normalizeWhatsapp } = require('../utils/helpers');
const { sendEmail, adminEmails } = require('../utils/email');
const templates = require('../utils/emailTemplates');
const realtime = require('../utils/realtime');

const fileMeta = (f) => ({ filename: f.filename, originalName: f.originalname, mimeType: f.mimetype, size: f.size });

async function nextOrderNumber() {
  const year = new Date().getFullYear();
  const seq = await Counter.next(`order-${year}`);
  return `GH-${year}-${String(seq).padStart(4, '0')}`;
}

// POST /api/orders  (customer, multipart: files[] + productId, items JSON, message, ...)
exports.createOrder = asyncHandler(async (req, res) => {
  const files = req.files || [];
  if (!files.length) {
    throw new AppError(
      'Upload your design file to place the order. Need a design? Message us on WhatsApp and our team will create it for you',
      400,
      'DESIGN_REQUIRED'
    );
  }
  const product = await Product.findOne({ _id: req.body.productId, isActive: true }).populate('category', 'name');
  if (!product) throw new AppError('This product is no longer available', 404);

  const items = (parseJSON(req.body.items, []) || [])
    .map((i) => ({ size: String(i.size || '').trim(), color: String(i.color || '').trim(), quantity: Math.floor(Number(i.quantity)) }))
    .filter((i) => i.quantity > 0);
  if (!items.length) throw new AppError('Add a quantity for at least one size');
  const totalQuantity = items.reduce((s, i) => s + i.quantity, 0);
  if (totalQuantity < product.minOrderQty) {
    throw new AppError(`The minimum order for this product is ${product.minOrderQty} pieces`);
  }
  const whatsapp = normalizeWhatsapp(req.body.contactWhatsapp || req.user.whatsapp);

  const order = await Order.create({
    orderNumber: await nextOrderNumber(),
    customer: req.user._id,
    product: product._id,
    productSnapshot: {
      name: product.name,
      slug: product.slug,
      image: product.images[0],
      price: product.price,
      category: product.category?.name,
    },
    items,
    totalQuantity,
    message: req.body.message,
    designFiles: files.map(fileMeta),
    contactWhatsapp: whatsapp,
    deliveryAddress: req.body.deliveryAddress,
    neededBy: req.body.neededBy ? new Date(req.body.neededBy) : undefined,
    estimatedAmount: product.price * totalQuantity,
    statusHistory: [{ status: 'pending', note: 'Order placed by customer', by: req.user._id }],
  });
  await Product.updateOne({ _id: product._id }, { $inc: { orderCount: 1 } });

  const c = templates.orderPlacedCustomer(req.user.name, order);
  sendEmail({ to: req.user.email, ...c });
  const a = templates.orderPlacedAdmin(req.user, order);
  adminEmails().then((to) => sendEmail({ to, ...a }));
  realtime.notifyAdmins('New order', `${order.orderNumber} from ${req.user.name}`, `/admin/orders/${order._id}`, 'order');

  res.status(201).json({ success: true, message: 'Order placed', order });
});

// GET /api/orders/mine
exports.myOrders = asyncHandler(async (req, res) => {
  const orders = await Order.find({ customer: req.user._id }).sort('-createdAt').lean();
  res.json({ success: true, orders });
});

// GET /api/orders/:id (owner or admin)
exports.getOrder = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id)
    .populate('customer', 'name email whatsapp avatar companyName')
    .populate('statusHistory.by', 'name role');
  if (!order) throw new AppError('Order not found', 404);
  const isOwner = String(order.customer?._id) === String(req.user._id);
  if (!isOwner && req.user.role !== 'admin') throw new AppError('Order not found', 404);
  const json = order.toJSON();
  if (req.user.role !== 'admin') delete json.adminNotes;
  res.json({ success: true, order: json });
});

// PATCH /api/orders/:id/cancel (customer, only while pending/reviewing)
exports.cancelMyOrder = asyncHandler(async (req, res) => {
  const order = await Order.findOne({ _id: req.params.id, customer: req.user._id });
  if (!order) throw new AppError('Order not found', 404);
  if (!['pending', 'reviewing'].includes(order.status)) {
    throw new AppError('This order is already being processed. Contact us on chat to change it');
  }
  order.status = 'cancelled';
  order.statusHistory.push({ status: 'cancelled', note: req.body.reason || 'Cancelled by customer', by: req.user._id });
  await order.save();
  realtime.notifyAdmins('Order cancelled', `${order.orderNumber} was cancelled by the customer`, `/admin/orders/${order._id}`, 'order');
  res.json({ success: true, message: 'Order cancelled', order });
});

// GET /api/orders (admin)
exports.listOrders = asyncHandler(async (req, res) => {
  const { status, search, payment, from, to } = req.query;
  const { page, limit, skip } = pagination(req.query, 15);
  const filter = {};
  if (status && status !== 'all') filter.status = status;
  if (payment && payment !== 'all') filter.paymentStatus = payment;
  if (from || to) {
    filter.createdAt = {};
    if (from) filter.createdAt.$gte = new Date(from);
    if (to) filter.createdAt.$lte = new Date(`${to}T23:59:59`);
  }
  if (search) {
    const rx = new RegExp(escapeRegex(search), 'i');
    const User = require('../models/User');
    const users = await User.find({ $or: [{ name: rx }, { email: rx }] }).select('_id').lean();
    filter.$or = [{ orderNumber: rx }, { 'productSnapshot.name': rx }, { customer: { $in: users.map((u) => u._id) } }];
  }
  const [orders, total, statusCounts] = await Promise.all([
    Order.find(filter).populate('customer', 'name email whatsapp avatar').sort('-createdAt').skip(skip).limit(limit).lean(),
    Order.countDocuments(filter),
    Order.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }]),
  ]);
  res.json({
    success: true,
    orders,
    total,
    page,
    pages: Math.ceil(total / limit),
    statusCounts: Object.fromEntries(statusCounts.map((s) => [s._id, s.count])),
  });
});

// PATCH /api/orders/:id (admin)
exports.updateOrder = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id).populate('customer', 'name email');
  if (!order) throw new AppError('Order not found', 404);
  const { status, totalAmount, amountPaid, adminNotes, expectedDelivery, note, notifyCustomer = true } = req.body;
  const prevStatus = order.status;

  if (status && status !== order.status) {
    if (!Order.STATUSES.includes(status)) throw new AppError('Unknown status');
    order.status = status;
    order.statusHistory.push({ status, note, by: req.user._id });
  }
  if (totalAmount !== undefined) order.totalAmount = Math.max(0, Number(totalAmount) || 0);
  if (amountPaid !== undefined) order.amountPaid = Math.max(0, Number(amountPaid) || 0);
  if (adminNotes !== undefined) order.adminNotes = adminNotes;
  if (expectedDelivery !== undefined) order.expectedDelivery = expectedDelivery ? new Date(expectedDelivery) : undefined;
  await order.save();

  if (order.status !== prevStatus && notifyCustomer && order.customer) {
    const t = templates.orderStatus(order.customer.name, order, note);
    sendEmail({ to: order.customer.email, ...t });
    realtime.notifyUser(order.customer._id, `Order ${order.orderNumber}`, `Status: ${order.status.replace('_', ' ')}`, `/account/orders/${order._id}`, 'order');
  }
  await order.populate('statusHistory.by', 'name role');
  res.json({ success: true, message: 'Order updated', order });
});

// DELETE /api/orders/:id (admin)
exports.deleteOrder = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id);
  if (!order) throw new AppError('Order not found', 404);
  order.designFiles.forEach((f) => removePrivateFile(f.filename));
  await order.deleteOne();
  res.json({ success: true, message: 'Order deleted' });
});
