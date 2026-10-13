/**
 * Seeds starter categories and sample products.
 *   npm run seed
 * Optional: SEED_ADMIN_EMAIL / SEED_ADMIN_PASSWORD / SEED_ADMIN_NAME to create a verified admin.
 */
const mongoose = require('mongoose');
const env = require('../config/env');
const Category = require('../models/Category');
const Product = require('../models/Product');
const User = require('../models/User');
const { slugify } = require('../utils/helpers');

const TSHIRT_CHART = {
  title: 'T-shirt size chart',
  unit: 'inches',
  columns: ['Size', 'Chest', 'Length', 'Sleeve'],
  rows: [
    ['XS', '34', '26', '7.5'],
    ['S', '36', '27', '8'],
    ['M', '38', '28', '8'],
    ['L', '40', '29', '8.5'],
    ['XL', '42', '30', '9'],
    ['2XL', '44', '31', '9'],
    ['3XL', '46', '32', '9.5'],
  ],
  note: 'Measure a T-shirt that fits you well, laid flat. Chest is measured armpit to armpit × 2.',
};

const categories = [
  { name: 'T-Shirts', description: 'Crew neck, V-neck and oversized tees – screen print, DTF or sublimation.', sortOrder: 1 },
  { name: 'Polo Shirts', description: 'Corporate and uniform polos with embroidered logos.', sortOrder: 2 },
  { name: 'Caps', description: 'Baseball, trucker and bucket caps with embroidery or print.', sortOrder: 3 },
  { name: 'Embroidery', description: 'Logo embroidery on garments, bags and patches.', sortOrder: 4 },
  { name: 'Mugs', description: 'Sublimation mugs, magic mugs and bottles.', sortOrder: 5 },
  { name: 'Hoodies', description: 'Pullover and zip hoodies for teams and events.', sortOrder: 6 },
];

async function run() {
  await mongoose.connect(env.mongoUri);
  console.log('Connected. Seeding…');

  const catDocs = {};
  for (const c of categories) {
    // eslint-disable-next-line no-await-in-loop
    catDocs[c.name] = await Category.findOneAndUpdate(
      { slug: slugify(c.name) },
      { ...c, slug: slugify(c.name) },
      { upsert: true, new: true }
    );
  }

  const products = [
    {
      name: 'Classic Crew Neck T-Shirt',
      category: 'T-Shirts',
      shortDescription: '180 GSM combed cotton tee – ideal for events, teams and brands.',
      description:
        'Our best-selling everyday tee. Soft combed cotton that holds screen print and DTF colours well wash after wash.\n\nGreat for company events, school batches, clubs and merchandise.',
      materials: ['100% combed cotton', '180 GSM', 'Pre-shrunk'],
      printMethods: ['Screen printing', 'DTF', 'Embroidery'],
      price: 1450,
      priceNote: 'per piece (from)',
      minOrderQty: 12,
      sizes: ['XS', 'S', 'M', 'L', 'XL', '2XL', '3XL'],
      colors: ['White', 'Black', 'Navy', 'Maroon', 'Bottle green'],
      sizeChart: TSHIRT_CHART,
      customFields: [{ label: 'Turnaround', value: '5–7 working days after approval' }],
      isFeatured: true,
    },
    {
      name: 'Embroidered Corporate Polo',
      category: 'Polo Shirts',
      shortDescription: 'Pique polo with your logo embroidered on the chest.',
      description: 'Breathable pique fabric, reinforced collar and a clean embroidered logo – the classic office and staff uniform.',
      materials: ['Cotton-poly pique', '220 GSM'],
      printMethods: ['Embroidery'],
      price: 2350,
      priceNote: 'per piece incl. chest logo',
      minOrderQty: 10,
      sizes: ['S', 'M', 'L', 'XL', '2XL'],
      colors: ['White', 'Black', 'Navy', 'Sky blue'],
      sizeChart: { ...TSHIRT_CHART, title: 'Polo size chart' },
      isFeatured: true,
    },
    {
      name: 'Embroidered Baseball Cap',
      category: 'Caps',
      shortDescription: '6-panel cotton twill cap with 3D or flat embroidery.',
      description: 'Adjustable strap, pre-curved peak and a sharp embroidered front logo.',
      materials: ['Cotton twill'],
      printMethods: ['Flat embroidery', '3D puff embroidery'],
      price: 1250,
      minOrderQty: 12,
      sizes: ['Free size'],
      colors: ['Black', 'White', 'Navy', 'Red'],
      sizeChart: { title: 'Cap fit', unit: 'cm', columns: ['Size', 'Head circumference'], rows: [['Free size', '54 – 60']], note: 'Adjustable back strap.' },
      isFeatured: true,
    },
    {
      name: 'Custom Sublimation Mug',
      category: 'Mugs',
      shortDescription: '11 oz ceramic mug printed edge to edge with your design.',
      description: 'Dishwasher-safe sublimation print. Perfect for gifts, corporate giveaways and events.',
      materials: ['Ceramic', 'Sublimation coating'],
      printMethods: ['Sublimation'],
      price: 950,
      minOrderQty: 1,
      sizes: ['11 oz'],
      colors: ['White', 'Magic (black to white)'],
      isFeatured: true,
    },
  ];

  for (const p of products) {
    const slug = slugify(p.name);
    // eslint-disable-next-line no-await-in-loop
    await Product.findOneAndUpdate(
      { slug },
      { ...p, slug, category: catDocs[p.category]._id, companyName: env.businessName },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
  }

  if (process.env.SEED_ADMIN_EMAIL && process.env.SEED_ADMIN_PASSWORD) {
    const email = process.env.SEED_ADMIN_EMAIL.toLowerCase();
    let admin = await User.findOne({ email });
    if (!admin) {
      admin = new User({
        name: process.env.SEED_ADMIN_NAME || 'Groovy Admin',
        email,
        password: process.env.SEED_ADMIN_PASSWORD,
        whatsapp: env.businessWhatsapp,
        role: 'admin',
        isEmailVerified: true,
      });
      await admin.save();
      console.log(`Admin created: ${email}`);
    }
  }

  console.log('✔ Seed complete');
  await mongoose.disconnect();
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
