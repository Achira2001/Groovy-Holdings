const mongoose = require('mongoose');

const fileSchema = new mongoose.Schema(
  {
    filename: { type: String, required: true }, // stored name (private folder)
    originalName: String,
    mimeType: String,
    size: Number,
  },
  { _id: false, timestamps: false }
);

const ORDER_STATUSES = [
  'pending', // placed by customer, waiting for review
  'reviewing', // admin is checking design / details
  'quoted', // price confirmed with customer
  'confirmed', // customer accepted, ready for production
  'in_production',
  'ready', // ready for pickup / delivery
  'delivered',
  'cancelled',
];

const orderSchema = new mongoose.Schema(
  {
    orderNumber: { type: String, required: true, unique: true },
    customer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', index: true },
    productSnapshot: {
      name: String,
      slug: String,
      image: String,
      price: Number,
      category: String,
    },
    items: [
      {
        _id: false,
        size: { type: String, trim: true },
        color: { type: String, trim: true },
        quantity: { type: Number, min: 1, required: true },
      },
    ],
    totalQuantity: { type: Number, required: true, min: 1 },
    message: { type: String, trim: true, maxlength: 3000 },
    designFiles: [fileSchema],
    contactWhatsapp: { type: String, trim: true },
    deliveryAddress: { type: String, trim: true, maxlength: 400 },
    neededBy: Date,

    estimatedAmount: { type: Number, default: 0 }, // unit price * qty at order time
    totalAmount: { type: Number, default: 0 }, // final price set by admin
    amountPaid: { type: Number, default: 0 },
    paymentStatus: { type: String, enum: ['unpaid', 'partial', 'paid'], default: 'unpaid' },

    status: { type: String, enum: ORDER_STATUSES, default: 'pending', index: true },
    statusHistory: [
      {
        _id: false,
        status: String,
        note: String,
        at: { type: Date, default: Date.now },
        by: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      },
    ],
    adminNotes: { type: String, trim: true, maxlength: 2000 },
    expectedDelivery: Date,
  },
  { timestamps: true }
);

orderSchema.index({ createdAt: -1 });

orderSchema.pre('save', function paymentState(next) {
  if (this.amountPaid <= 0) this.paymentStatus = 'unpaid';
  else if (this.totalAmount > 0 && this.amountPaid >= this.totalAmount) this.paymentStatus = 'paid';
  else this.paymentStatus = 'partial';
  next();
});

const Order = mongoose.model('Order', orderSchema);
Order.STATUSES = ORDER_STATUSES;
module.exports = Order;
