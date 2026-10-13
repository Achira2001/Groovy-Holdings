const multer = require('multer');
const env = require('../config/env');
const { removePrivateFile, removePublicFile } = require('../utils/helpers');

function cleanupUploads(req) {
  const files = [].concat(req.files || [], req.file ? [req.file] : []);
  files.forEach((f) => {
    if (f.destination && f.destination.includes('private')) removePrivateFile(f.filename);
    else if (f.path) {
      const url = `/uploads/${f.path.split(/[\\/]public[\\/]/)[1]?.replace(/\\/g, '/')}`;
      removePublicFile(url);
    }
  });
}

function notFound(req, _res, next) {
  const err = new Error(`Route not found: ${req.method} ${req.originalUrl}`);
  err.statusCode = 404;
  next(err);
}

// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, _next) {
  cleanupUploads(req); // never keep files from a failed request

  let status = err.statusCode || 500;
  let message = err.message || 'Something went wrong';
  let details;

  if (err instanceof multer.MulterError) {
    status = 400;
    message =
      err.code === 'LIMIT_FILE_SIZE'
        ? 'A file is larger than the allowed size'
        : err.code === 'LIMIT_FILE_COUNT' || err.code === 'LIMIT_UNEXPECTED_FILE'
          ? 'Too many files uploaded'
          : err.message;
  } else if (err.name === 'ValidationError') {
    status = 400;
    details = Object.values(err.errors).map((e) => e.message);
    message = details[0] || 'Invalid data';
  } else if (err.name === 'CastError') {
    status = 400;
    message = `Invalid ${err.path}`;
  } else if (err.code === 11000) {
    status = 409;
    const field = Object.keys(err.keyValue || {})[0] || 'field';
    message = `This ${field} is already in use`;
  } else if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
    status = 401;
    message = 'Your session has expired. Please sign in again';
  }

  if (status >= 500) {
    console.error('✖', err);
    if (env.isProd) message = 'Something went wrong on our side. Please try again';
  }

  res.status(status).json({ success: false, message, code: err.code, details });
}

module.exports = { notFound, errorHandler };
