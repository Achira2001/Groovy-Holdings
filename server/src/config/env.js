require('dotenv').config();

const bool = (v, d = false) => (v === undefined || v === '' ? d : String(v).toLowerCase() === 'true');

const env = {
  port: Number(process.env.PORT) || 5000,
  nodeEnv: process.env.NODE_ENV || 'development',
  isProd: process.env.NODE_ENV === 'production',
  mongoUri: process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/groovy_holdings',
  clientUrl: (process.env.CLIENT_URL || 'http://localhost:3000').replace(/\/$/, ''),

  jwtSecret: process.env.JWT_SECRET || 'dev_only_secret_change_me',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  cookieSecure: bool(process.env.COOKIE_SECURE, false),
  cookieSameSite: process.env.COOKIE_SAMESITE || 'lax',

  adminCode: process.env.ADMIN_CODE || 'GroovyAdmin123',

  smtp: {
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT) || 465,
    secure: bool(process.env.SMTP_SECURE, true),
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
    from: process.env.MAIL_FROM || 'Groovy Holdings <no-reply@groovyholdings.lk>',
  },
  adminNotifyEmails: (process.env.ADMIN_NOTIFY_EMAILS || '')
    .split(',')
    .map((e) => e.trim())
    .filter(Boolean),
  chatEmailNotifications: bool(process.env.CHAT_EMAIL_NOTIFICATIONS, true),

  google: {
    clientId: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    redirectUri:
      process.env.GOOGLE_REDIRECT_URI || 'http://localhost:5000/api/google/calendar/callback',
    calendarId: process.env.GOOGLE_CALENDAR_ID || 'primary',
    refreshToken: process.env.GOOGLE_CALENDAR_REFRESH_TOKEN,
  },

  businessName: process.env.BUSINESS_NAME || 'Groovy Holdings (Pvt) Ltd',
  businessWhatsapp: process.env.BUSINESS_WHATSAPP || '94777660791',
  timezone: process.env.TIMEZONE || 'Asia/Colombo',
  timezoneOffset: process.env.TIMEZONE_OFFSET || '+05:30',
};

if (env.isProd && env.jwtSecret === 'dev_only_secret_change_me') {
  // Fail fast: never run production with the default secret
  throw new Error('JWT_SECRET must be set in production');
}

module.exports = env;
