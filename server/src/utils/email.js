const nodemailer = require('nodemailer');
const env = require('../config/env');

let transporter = null;
const configured = Boolean(env.smtp.host && env.smtp.user && env.smtp.pass);

if (configured) {
  transporter = nodemailer.createTransport({
  host: env.smtp.host,
  port: env.smtp.port,
  secure: env.smtp.secure,
  auth: {
    user: env.smtp.user,
    pass: env.smtp.pass,
  },
  tls: {
    rejectUnauthorized: false,
  },
});
  transporter
    .verify()
    .then(() => console.log('✔ SMTP ready'))
    .catch((e) => console.warn('⚠ SMTP verify failed:', e.message));
} else {
  console.warn('⚠ SMTP not configured – emails will be printed to the console instead.');
}

/**
 * Send an email. Never throws – email failures must not break the request.
 * @returns {Promise<boolean>} true when sent
 */
async function sendEmail({ to, subject, html, text, replyTo }) {
  const recipients = [].concat(to).filter(Boolean);
  if (!recipients.length) return false;

  if (!transporter) {
    console.log('\n──── EMAIL (dev) ────');
    console.log('To:', recipients.join(', '));
    console.log('Subject:', subject);
    console.log(text || html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').slice(0, 600));
    console.log('─────────────────────\n');
    return false;
  }
  try {
    await transporter.sendMail({ from: env.smtp.from, to: recipients.join(', '), subject, html, text, replyTo });
    return true;
  } catch (err) {
    console.error('✖ Email failed:', subject, err.message);
    return false;
  }
}

/** Resolve the list of admin emails to notify. */
async function adminEmails() {
  if (env.adminNotifyEmails.length) return env.adminNotifyEmails;
  const User = require('../models/User');
  const admins = await User.find({ role: 'admin', isBlocked: false }).select('email').lean();
  return admins.map((a) => a.email);
}

module.exports = { sendEmail, adminEmails, emailConfigured: configured };
