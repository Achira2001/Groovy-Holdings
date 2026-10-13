const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const multer = require('multer');
const AppError = require('../utils/AppError');
const { UPLOAD_ROOT } = require('../utils/helpers');

const DIRS = {
  products: path.join(UPLOAD_ROOT, 'public', 'products'),
  avatars: path.join(UPLOAD_ROOT, 'public', 'avatars'),
  categories: path.join(UPLOAD_ROOT, 'public', 'categories'),
  private: path.join(UPLOAD_ROOT, 'private'),
};
Object.values(DIRS).forEach((d) => fs.mkdirSync(d, { recursive: true }));

const IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/avif'];

// Design / chat files: images, PDFs, vector & design sources, archives, office docs
const FILE_EXT = [
  '.jpg', '.jpeg', '.png', '.webp', '.gif', '.svg', '.pdf', '.ai', '.eps', '.psd',
  '.cdr', '.tif', '.tiff', '.zip', '.rar', '.doc', '.docx', '.xls', '.xlsx', '.txt',
];

function storage(dir) {
  return multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, dir),
    filename: (_req, file, cb) => {
      const ext = path.extname(file.originalname).toLowerCase().slice(0, 10);
      cb(null, `${Date.now()}-${crypto.randomBytes(8).toString('hex')}${ext}`);
    },
  });
}

const imageFilter = (_req, file, cb) => {
  if (IMAGE_TYPES.includes(file.mimetype)) return cb(null, true);
  cb(new AppError('Only JPG, PNG, WEBP, GIF or AVIF images are allowed', 400));
};

const designFilter = (_req, file, cb) => {
  const ext = path.extname(file.originalname).toLowerCase();
  if (FILE_EXT.includes(ext)) return cb(null, true);
  cb(new AppError(`File type ${ext || 'unknown'} is not allowed`, 400));
};

const MB = 1024 * 1024;

module.exports = {
  productImages: multer({ storage: storage(DIRS.products), fileFilter: imageFilter, limits: { fileSize: 8 * MB, files: 12 } }).array('images', 12),
  categoryImage: multer({ storage: storage(DIRS.categories), fileFilter: imageFilter, limits: { fileSize: 5 * MB } }).single('image'),
  avatar: multer({ storage: storage(DIRS.avatars), fileFilter: imageFilter, limits: { fileSize: 3 * MB } }).single('avatar'),
  designFiles: multer({ storage: storage(DIRS.private), fileFilter: designFilter, limits: { fileSize: 25 * MB, files: 10 } }).array('files', 10),
  DIRS,
};
