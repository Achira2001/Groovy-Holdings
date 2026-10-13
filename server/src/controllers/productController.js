const Product = require('../models/Product');
const Category = require('../models/Category');
const AppError = require('../utils/AppError');
const asyncHandler = require('../utils/asyncHandler');
const { slugify, parseJSON, removePublicFile, escapeRegex, pagination } = require('../utils/helpers');

const MAX_IMAGES = 12;

async function uniqueSlug(name, excludeId) {
  const base = slugify(name) || 'product';
  let slug = base;
  let i = 1;
  // eslint-disable-next-line no-await-in-loop
  while (await Product.exists({ slug, _id: { $ne: excludeId } })) slug = `${base}-${i++}`;
  return slug;
}

const cleanList = (arr) =>
  (Array.isArray(arr) ? arr : [])
    .map((s) => String(s).trim())
    .filter(Boolean);

function cleanSizeChart(sc) {
  if (!sc || typeof sc !== 'object') return { columns: [], rows: [] };
  const columns = cleanList(sc.columns);
  const rows = (Array.isArray(sc.rows) ? sc.rows : [])
    .map((r) => (Array.isArray(r) ? r.slice(0, columns.length).map((c) => String(c ?? '').trim()) : []))
    .filter((r) => r.some(Boolean));
  return { title: sc.title || 'Size chart', unit: sc.unit || 'inches', note: sc.note || '', columns, rows };
}

/** Builds the product fields from a multipart body (arrays/objects arrive as JSON strings). */
function buildFields(body) {
  const f = {};
  const simple = ['name', 'shortDescription', 'description', 'companyName', 'priceNote'];
  simple.forEach((k) => body[k] !== undefined && (f[k] = body[k]));
  if (body.category !== undefined) f.category = body.category;
  if (body.price !== undefined) f.price = Number(body.price);
  if (body.compareAtPrice !== undefined) f.compareAtPrice = body.compareAtPrice === '' ? undefined : Number(body.compareAtPrice);
  if (body.minOrderQty !== undefined) f.minOrderQty = Math.max(1, Number(body.minOrderQty) || 1);
  if (body.isFeatured !== undefined) f.isFeatured = String(body.isFeatured) === 'true';
  if (body.isActive !== undefined) f.isActive = String(body.isActive) === 'true';
  ['materials', 'printMethods', 'sizes', 'colors', 'tags'].forEach((k) => {
    if (body[k] !== undefined) f[k] = cleanList(parseJSON(body[k], []));
  });
  if (body.sizeChart !== undefined) f.sizeChart = cleanSizeChart(parseJSON(body.sizeChart, {}));
  if (body.customFields !== undefined) {
    f.customFields = (parseJSON(body.customFields, []) || [])
      .map((c) => ({ label: String(c.label || '').trim(), value: String(c.value || '').trim() }))
      .filter((c) => c.label && c.value);
  }
  return f;
}

// GET /api/products?category=&search=&featured=&sort=&page=&limit=&includeInactive=
exports.listProducts = asyncHandler(async (req, res) => {
  const { category, search, featured, sort = 'newest', minPrice, maxPrice } = req.query;
  const { page, limit, skip } = pagination(req.query, 12, 60);
  const isAdmin = req.user?.role === 'admin';
  const filter = {};
  if (!(isAdmin && req.query.includeInactive === 'true')) filter.isActive = true;
  if (featured === 'true') filter.isFeatured = true;
  if (category && category !== 'all') {
    const cat = /^[a-f\d]{24}$/i.test(category)
      ? await Category.findById(category).lean()
      : await Category.findOne({ slug: category }).lean();
    if (!cat) return res.json({ success: true, products: [], total: 0, page, pages: 0 });
    filter.category = cat._id;
  }
  if (search) {
    const rx = new RegExp(escapeRegex(search), 'i');
    filter.$or = [{ name: rx }, { shortDescription: rx }, { tags: rx }, { materials: rx }];
  }
  if (minPrice || maxPrice) {
    filter.price = {};
    if (minPrice) filter.price.$gte = Number(minPrice);
    if (maxPrice) filter.price.$lte = Number(maxPrice);
  }
  const sorts = {
    newest: { createdAt: -1 },
    oldest: { createdAt: 1 },
    price_asc: { price: 1 },
    price_desc: { price: -1 },
    popular: { orderCount: -1, views: -1 },
    name: { name: 1 },
  };
  const [products, total] = await Promise.all([
    Product.find(filter)
      .populate('category', 'name slug')
      .sort(sorts[sort] || sorts.newest)
      .skip(skip)
      .limit(limit)
      .select('-description -sizeChart -customFields')
      .lean(),
    Product.countDocuments(filter),
  ]);
  res.json({ success: true, products, total, page, pages: Math.ceil(total / limit) });
});

// GET /api/products/:idOrSlug
exports.getProduct = asyncHandler(async (req, res) => {
  const { idOrSlug } = req.params;
  const query = /^[a-f\d]{24}$/i.test(idOrSlug) ? { _id: idOrSlug } : { slug: idOrSlug };
  const isAdmin = req.user?.role === 'admin';
  if (!isAdmin) query.isActive = true;
  const product = await Product.findOne(query).populate('category', 'name slug');
  if (!product) throw new AppError('Product not found', 404);
  if (!isAdmin) Product.updateOne({ _id: product._id }, { $inc: { views: 1 } }).exec();

  const related = await Product.find({ category: product.category?._id, _id: { $ne: product._id }, isActive: true })
    .limit(4)
    .select('name slug images price priceNote')
    .lean();
  res.json({ success: true, product, related });
});

// POST /api/products (multipart: images[] + fields)
exports.createProduct = asyncHandler(async (req, res) => {
  const fields = buildFields(req.body);
  if (!fields.name) throw new AppError('Product name is required');
  if (!fields.category || !(await Category.exists({ _id: fields.category }))) throw new AppError('Choose a valid category');
  if (Number.isNaN(fields.price) || fields.price === undefined) throw new AppError('Enter a valid price');
  const images = (req.files || []).map((f) => `/uploads/products/${f.filename}`).slice(0, MAX_IMAGES);
  const product = await Product.create({ ...fields, images, slug: await uniqueSlug(fields.name) });
  res.status(201).json({ success: true, message: 'Product published', product });
});

// PATCH /api/products/:id (multipart: images[] new files, existingImages JSON = kept urls in order)
exports.updateProduct = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id);
  if (!product) throw new AppError('Product not found', 404);
  const fields = buildFields(req.body);
  if (fields.category && !(await Category.exists({ _id: fields.category }))) throw new AppError('Choose a valid category');
  if (fields.name && fields.name !== product.name) fields.slug = await uniqueSlug(fields.name, product._id);

  const kept = parseJSON(req.body.existingImages, null);
  if (Array.isArray(kept)) {
    const keptSet = new Set(kept);
    product.images.filter((img) => !keptSet.has(img)).forEach(removePublicFile);
    product.images = kept.filter((img) => product.images.includes(img));
  }
  const newImages = (req.files || []).map((f) => `/uploads/products/${f.filename}`);
  product.images = [...product.images, ...newImages].slice(0, MAX_IMAGES);

  Object.assign(product, fields);
  await product.save();
  await product.populate('category', 'name slug');
  res.json({ success: true, message: 'Product saved', product });
});

// DELETE /api/products/:id
exports.deleteProduct = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id);
  if (!product) throw new AppError('Product not found', 404);
  product.images.forEach(removePublicFile);
  await product.deleteOne();
  res.json({ success: true, message: 'Product deleted' });
});
