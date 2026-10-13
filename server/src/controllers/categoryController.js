const Category = require('../models/Category');
const Product = require('../models/Product');
const AppError = require('../utils/AppError');
const asyncHandler = require('../utils/asyncHandler');
const { slugify, removePublicFile } = require('../utils/helpers');

// GET /api/categories
exports.listCategories = asyncHandler(async (req, res) => {
  const isAdmin = req.user?.role === 'admin';
  const filter = isAdmin && req.query.all === 'true' ? {} : { isActive: true };
  const categories = await Category.find(filter).sort({ sortOrder: 1, name: 1 }).lean();
  const counts = await Product.aggregate([
    { $match: isAdmin ? {} : { isActive: true } },
    { $group: { _id: '$category', count: { $sum: 1 } } },
  ]);
  const map = Object.fromEntries(counts.map((c) => [String(c._id), c.count]));
  categories.forEach((c) => (c.productCount = map[String(c._id)] || 0));
  res.json({ success: true, categories });
});

async function uniqueSlug(name, excludeId) {
  const base = slugify(name) || 'category';
  let slug = base;
  let i = 1;
  // eslint-disable-next-line no-await-in-loop
  while (await Category.exists({ slug, _id: { $ne: excludeId } })) slug = `${base}-${i++}`;
  return slug;
}

// POST /api/categories  (multipart: image optional)
exports.createCategory = asyncHandler(async (req, res) => {
  const { name, description, sortOrder, isActive } = req.body;
  if (!name) throw new AppError('Category name is required');
  const category = await Category.create({
    name,
    slug: await uniqueSlug(name),
    description,
    sortOrder: Number(sortOrder) || 0,
    isActive: isActive === undefined ? true : String(isActive) === 'true',
    image: req.file ? `/uploads/categories/${req.file.filename}` : '',
  });
  res.status(201).json({ success: true, message: 'Category created', category });
});

// PATCH /api/categories/:id
exports.updateCategory = asyncHandler(async (req, res) => {
  const category = await Category.findById(req.params.id);
  if (!category) throw new AppError('Category not found', 404);
  const { name, description, sortOrder, isActive, removeImage } = req.body;
  if (name && name !== category.name) {
    category.name = name;
    category.slug = await uniqueSlug(name, category._id);
  }
  if (description !== undefined) category.description = description;
  if (sortOrder !== undefined) category.sortOrder = Number(sortOrder) || 0;
  if (isActive !== undefined) category.isActive = String(isActive) === 'true';
  if (req.file) {
    removePublicFile(category.image);
    category.image = `/uploads/categories/${req.file.filename}`;
  } else if (String(removeImage) === 'true') {
    removePublicFile(category.image);
    category.image = '';
  }
  await category.save();
  res.json({ success: true, message: 'Category saved', category });
});

// DELETE /api/categories/:id
exports.deleteCategory = asyncHandler(async (req, res) => {
  const category = await Category.findById(req.params.id);
  if (!category) throw new AppError('Category not found', 404);
  const used = await Product.countDocuments({ category: category._id });
  if (used) throw new AppError(`Move or delete the ${used} product(s) in this category first`, 409);
  removePublicFile(category.image);
  await category.deleteOne();
  res.json({ success: true, message: 'Category deleted' });
});
