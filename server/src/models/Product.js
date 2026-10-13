const mongoose = require('mongoose');

const sizeChartSchema = new mongoose.Schema(
  {
    title: { type: String, trim: true, default: 'Size chart' },
    unit: { type: String, trim: true, default: 'inches' },
    columns: [{ type: String, trim: true }], // e.g. ["Size","Chest","Length","Sleeve"]
    rows: [[{ type: String, trim: true }]], // e.g. [["S","36","27","8"], ...]
    note: { type: String, trim: true, maxlength: 600 },
  },
  { _id: false }
);

const productSchema = new mongoose.Schema(
  {
    name: { type: String, required: [true, 'Product name is required'], trim: true, maxlength: 120 },
    slug: { type: String, required: true, unique: true, lowercase: true },
    category: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', required: true, index: true },
    shortDescription: { type: String, trim: true, maxlength: 220 },
    description: { type: String, trim: true, maxlength: 6000 },
    companyName: { type: String, trim: true, default: 'Groovy Holdings (Pvt) Ltd' },
    materials: [{ type: String, trim: true }],
    printMethods: [{ type: String, trim: true }], // Screen print, DTF, Sublimation, Embroidery...
    images: [{ type: String }],
    price: { type: Number, required: true, min: 0 },
    compareAtPrice: { type: Number, min: 0 },
    priceNote: { type: String, trim: true, default: 'per piece' },
    minOrderQty: { type: Number, default: 1, min: 1 },
    sizes: [{ type: String, trim: true }],
    colors: [{ type: String, trim: true }],
    sizeChart: { type: sizeChartSchema, default: () => ({ columns: [], rows: [] }) },
    customFields: [
      {
        _id: false,
        label: { type: String, trim: true },
        value: { type: String, trim: true },
      },
    ],
    tags: [{ type: String, trim: true, lowercase: true }],
    isFeatured: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true },
    orderCount: { type: Number, default: 0 },
    views: { type: Number, default: 0 },
  },
  { timestamps: true }
);

productSchema.index({ name: 'text', description: 'text', tags: 'text' });

module.exports = mongoose.model('Product', productSchema);
