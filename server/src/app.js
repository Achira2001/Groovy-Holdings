const path = require('path');
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const compression = require('compression');
const morgan = require('morgan');
const env = require('./config/env');
const { apiLimiter } = require('./middleware/rateLimit');
const { notFound, errorHandler } = require('./middleware/error');
const { UPLOAD_ROOT } = require('./utils/helpers');

const app = express();

app.set('trust proxy', 1); // correct client IPs behind Next.js rewrites / reverse proxies
app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
app.use(cors({ origin: env.clientUrl, credentials: true }));
app.use(compression());
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));
app.use(cookieParser());
if (!env.isProd) app.use(morgan('dev'));

// Strip MongoDB operators from user input (basic NoSQL-injection protection)
app.use((req, _res, next) => {
  const clean = (obj) => {
    if (!obj || typeof obj !== 'object') return;
    Object.keys(obj).forEach((k) => {
      if (k.startsWith('$') || k.includes('.')) delete obj[k];
      else clean(obj[k]);
    });
  };
  clean(req.body);
  clean(req.params);
  clean(req.query);
  next();
});

// Public uploads (product images, avatars, category images). Private files use /api/files.
app.use('/uploads', express.static(path.join(UPLOAD_ROOT, 'public'), { maxAge: '7d', index: false }));

app.get('/api/health', (_req, res) => res.json({ success: true, status: 'ok', time: new Date() }));

app.use('/api', apiLimiter);
app.use('/api/public', require('./routes/publicRoutes'));
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/profile', require('./routes/profileRoutes'));
app.use('/api/admin', require('./routes/adminRoutes'));
app.use('/api/categories', require('./routes/categoryRoutes'));
app.use('/api/products', require('./routes/productRoutes'));
app.use('/api/orders', require('./routes/orderRoutes'));
app.use('/api/chat', require('./routes/chatRoutes'));
app.use('/api/meetings', require('./routes/meetingRoutes'));
app.use('/api/google', require('./routes/googleRoutes'));
app.use('/api/files', require('./routes/fileRoutes'));

app.use(notFound);
app.use(errorHandler);

module.exports = app;
