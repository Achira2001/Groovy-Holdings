const env = require('../config/env');

const BRAND_BLUE = '#1F7FC6';
const BRAND_ORANGE = '#F0672B';
const INK = '#13243B';

const esc = (s = '') =>
  String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);

const fmtDate = (d) =>
  new Date(d).toLocaleString('en-GB', {
    timeZone: env.timezone,
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

function layout({ title, preheader = '', body, cta, footerNote }) {
  const button = cta
    ? `<tr><td style="padding:8px 0 24px"><a href="${cta.url}" style="display:inline-block;background:${BRAND_ORANGE};color:#fff;text-decoration:none;font-weight:700;padding:13px 26px;border-radius:10px;font-size:15px">${esc(cta.label)}</a></td></tr>`
    : '';
  return `<!doctype html><html><body style="margin:0;background:#eef2f7;font-family:Segoe UI,Helvetica,Arial,sans-serif;color:${INK}">
<span style="display:none;opacity:0">${esc(preheader)}</span>
<table width="100%" cellpadding="0" cellspacing="0" style="padding:32px 12px"><tr><td align="center">
<table width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#fff;border-radius:16px;overflow:hidden">
<tr><td style="background:${INK};padding:22px 28px">
  <span style="font-size:20px;font-weight:800;color:#fff">Groovy</span><span style="font-size:20px;font-weight:800;color:${BRAND_ORANGE}"> Holdings</span>
  <div style="height:4px;width:64px;margin-top:10px;background:linear-gradient(90deg,${BRAND_BLUE} 50%,${BRAND_ORANGE} 50%);border-radius:2px"></div>
</td></tr>
<tr><td style="padding:28px">
  <table width="100%" cellpadding="0" cellspacing="0">
  <tr><td><h1 style="font-size:22px;margin:0 0 14px;color:${INK}">${esc(title)}</h1></td></tr>
  <tr><td style="font-size:15px;line-height:1.6;color:#33455e;padding-bottom:18px">${body}</td></tr>
  ${button}
  ${cta ? `<tr><td style="font-size:12px;color:#7a8799;word-break:break-all">If the button doesn't work, open this link:<br><a href="${cta.url}" style="color:${BRAND_BLUE}">${cta.url}</a></td></tr>` : ''}
  </table>
</td></tr>
<tr><td style="padding:18px 28px;background:#f6f8fb;font-size:12px;color:#7a8799">
  ${footerNote ? `${esc(footerNote)}<br><br>` : ''}
  ${esc(env.businessName)} · T-shirt & cap printing, embroidery, mugs and more<br>
  WhatsApp: <a style="color:${BRAND_BLUE}" href="https://wa.me/${env.businessWhatsapp}">+${env.businessWhatsapp}</a>
</td></tr>
</table></td></tr></table></body></html>`;
}

const detailRows = (rows) =>
  `<table cellpadding="0" cellspacing="0" style="width:100%;border:1px solid #e3e8ef;border-radius:10px;margin:8px 0">${rows
    .filter(([, v]) => v !== undefined && v !== null && v !== '')
    .map(
      ([k, v]) =>
        `<tr><td style="padding:9px 12px;color:#7a8799;font-size:13px;width:38%;border-bottom:1px solid #eef1f5">${esc(k)}</td><td style="padding:9px 12px;font-size:14px;border-bottom:1px solid #eef1f5">${v}</td></tr>`
    )
    .join('')}</table>`;

module.exports = {
  fmtDate,
  esc,

  verifyEmail: (name, url) => ({
    subject: 'Confirm your email – Groovy Holdings',
    html: layout({
      title: `Welcome, ${name}!`,
      preheader: 'Confirm your email to activate your account',
      body: 'Thanks for creating an account. Confirm your email address to start browsing products, sending design files and booking meetings with our team. This link expires in 24 hours.',
      cta: { label: 'Confirm email', url },
      footerNote: "If you didn't create this account, you can ignore this email.",
    }),
  }),

  resetPassword: (name, url) => ({
    subject: 'Reset your password – Groovy Holdings',
    html: layout({
      title: 'Reset your password',
      preheader: 'Use this link to choose a new password',
      body: `Hi ${esc(name)}, we received a request to reset your password. This link expires in 1 hour.`,
      cta: { label: 'Choose a new password', url },
      footerNote: "If you didn't ask for this, your password stays the same and you can ignore this email.",
    }),
  }),

  passwordChanged: (name) => ({
    subject: 'Your password was changed – Groovy Holdings',
    html: layout({
      title: 'Password changed',
      body: `Hi ${esc(name)}, the password for your account was just changed and all other sessions were signed out. If this wasn't you, reset your password immediately and contact us on WhatsApp.`,
      cta: { label: 'Go to sign in', url: `${env.clientUrl}/login` },
    }),
  }),

  newChatMessage: ({ recipientName, senderName, text, fileCount, url }) => ({
    subject: `New message from ${senderName} – Groovy Holdings`,
    html: layout({
      title: `${senderName} sent you a message`,
      preheader: text ? text.slice(0, 90) : `${fileCount} file(s) shared`,
      body: `Hi ${esc(recipientName)},<br><br>${
        text
          ? `<div style="border-left:3px solid ${BRAND_BLUE};padding:10px 14px;background:#f6f9fd;border-radius:6px;white-space:pre-wrap">${esc(text)}</div>`
          : ''
      }${fileCount ? `<p style="margin:12px 0 0">📎 ${fileCount} file${fileCount > 1 ? 's' : ''} attached</p>` : ''}`,
      cta: { label: 'Open chat', url },
    }),
  }),

  orderPlacedCustomer: (name, order) => ({
    subject: `Order ${order.orderNumber} received – Groovy Holdings`,
    html: layout({
      title: 'We received your order',
      body: `Hi ${esc(name)}, thank you! Our team will review your design and details, then confirm the final price with you on chat or WhatsApp.${detailRows([
        ['Order number', `<b>${order.orderNumber}</b>`],
        ['Product', esc(order.productSnapshot?.name)],
        ['Total quantity', order.totalQuantity],
        ['Design files', order.designFiles.length],
      ])}`,
      cta: { label: 'Track your order', url: `${env.clientUrl}/account/orders/${order._id}` },
    }),
  }),

  orderPlacedAdmin: (customer, order) => ({
    subject: `New order ${order.orderNumber} from ${customer.name}`,
    html: layout({
      title: 'New order request',
      body: detailRows([
        ['Order number', `<b>${order.orderNumber}</b>`],
        ['Customer', `${esc(customer.name)} (${esc(customer.email)})`],
        ['WhatsApp', esc(order.contactWhatsapp || customer.whatsapp)],
        ['Product', esc(order.productSnapshot?.name)],
        ['Items', order.items.map((i) => `${esc(i.size || '-')} / ${esc(i.color || '-')} × ${i.quantity}`).join('<br>')],
        ['Message', esc(order.message)],
      ]),
      cta: { label: 'Open order', url: `${env.clientUrl}/admin/orders/${order._id}` },
    }),
  }),

  orderStatus: (name, order, note) => ({
    subject: `Order ${order.orderNumber} is now "${order.status.replace('_', ' ')}"`,
    html: layout({
      title: 'Your order was updated',
      body: `Hi ${esc(name)}, here's the latest on your order.${detailRows([
        ['Order number', `<b>${order.orderNumber}</b>`],
        ['Status', `<b style="text-transform:capitalize">${order.status.replace('_', ' ')}</b>`],
        ['Total amount', order.totalAmount ? `LKR ${order.totalAmount.toLocaleString()}` : ''],
        ['Paid', order.amountPaid ? `LKR ${order.amountPaid.toLocaleString()}` : ''],
        ['Note', esc(note)],
      ])}`,
      cta: { label: 'View order', url: `${env.clientUrl}/account/orders/${order._id}` },
    }),
  }),

  meetingBooked: ({ recipientName, customer, slot, forAdmin }) => {
    const gcal = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(
      `Groovy Holdings meeting: ${slot.topic || 'Consultation'}`
    )}&dates=${toGCalDate(slot.start)}/${toGCalDate(slot.end)}&details=${encodeURIComponent(slot.meetLink || '')}`;
    return {
      subject: forAdmin
        ? `Meeting booked by ${customer.name} – ${fmtDate(slot.start)}`
        : `Your meeting is confirmed – ${fmtDate(slot.start)}`,
      html: layout({
        title: forAdmin ? 'A customer booked a meeting' : 'Your meeting is confirmed',
        body: `Hi ${esc(recipientName)},${detailRows([
          ['When', `<b>${fmtDate(slot.start)}</b> – ${new Date(slot.end).toLocaleTimeString('en-GB', { timeZone: env.timezone, hour: '2-digit', minute: '2-digit' })}`],
          ['Topic', esc(slot.topic)],
          forAdmin ? ['Customer', `${esc(customer.name)} · ${esc(customer.email)} · ${esc(customer.whatsapp || '')}`] : ['With', 'Groovy Holdings team'],
          ['Notes', esc(slot.notes)],
          ['Google Meet', slot.meetLink ? `<a href="${slot.meetLink}" style="color:${BRAND_BLUE}">${slot.meetLink}</a>` : 'The meeting link will be shared before the meeting'],
        ])}<p style="margin-top:10px"><a href="${gcal}" style="color:${BRAND_BLUE}">Add to Google Calendar</a></p>`,
        cta: slot.meetLink ? { label: 'Join Google Meet', url: slot.meetLink } : { label: 'View meetings', url: `${env.clientUrl}${forAdmin ? '/admin/meetings' : '/account/meetings'}` },
      }),
    };
  },

  meetingCancelled: ({ recipientName, slot, cancelledBy, reason }) => ({
    subject: `Meeting cancelled – ${fmtDate(slot.start)}`,
    html: layout({
      title: 'Meeting cancelled',
      body: `Hi ${esc(recipientName)}, the meeting on <b>${fmtDate(slot.start)}</b>${slot.topic ? ` about "${esc(slot.topic)}"` : ''} was cancelled by ${esc(cancelledBy)}.${reason ? `<br><br>Reason: ${esc(reason)}` : ''}<br><br>You can book another time from the meetings page.`,
      cta: { label: 'Book another time', url: `${env.clientUrl}/meetings` },
    }),
  }),
};

function toGCalDate(d) {
  return new Date(d).toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
}
