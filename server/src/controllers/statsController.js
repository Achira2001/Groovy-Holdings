const Order = require('../models/Order');
const User = require('../models/User');
const Product = require('../models/Product');
const Category = require('../models/Category');
const MeetingSlot = require('../models/MeetingSlot');
const Conversation = require('../models/Conversation');
const Visit = require('../models/Visit');
const env = require('../config/env');
const asyncHandler = require('../utils/asyncHandler');

// Fixed offset (Sri Lanka has no DST), e.g. "+05:30" -> 330 minutes
const OFFSET_MIN = (() => {
  const m = /^([+-])(\d{2}):(\d{2})$/.exec(env.timezoneOffset);
  if (!m) return 330;
  return (m[1] === '-' ? -1 : 1) * (Number(m[2]) * 60 + Number(m[3]));
})();

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const RANGES = {
  daily: { unit: 'day', count: 30 },
  weekly: { unit: 'week', count: 12 },
  monthly: { unit: 'month', count: 12 },
  yearly: { unit: 'year', count: 5 },
};

/** Returns the local bucket start as a "local-clock" Date (UTC getters = local values). */
function bucketStart(date, unit) {
  const d = new Date(new Date(date).getTime() + OFFSET_MIN * 60000);
  const y = d.getUTCFullYear();
  const mo = d.getUTCMonth();
  const day = d.getUTCDate();
  if (unit === 'year') return new Date(Date.UTC(y, 0, 1));
  if (unit === 'month') return new Date(Date.UTC(y, mo, 1));
  const start = new Date(Date.UTC(y, mo, day));
  if (unit === 'week') {
    const dow = (start.getUTCDay() + 6) % 7; // Monday = 0
    start.setUTCDate(start.getUTCDate() - dow);
  }
  return start;
}

function stepBack(local, unit, n) {
  const d = new Date(local);
  if (unit === 'day') d.setUTCDate(d.getUTCDate() - n);
  if (unit === 'week') d.setUTCDate(d.getUTCDate() - 7 * n);
  if (unit === 'month') d.setUTCMonth(d.getUTCMonth() - n);
  if (unit === 'year') d.setUTCFullYear(d.getUTCFullYear() - n);
  return d;
}

const toRealDate = (local) => new Date(local.getTime() - OFFSET_MIN * 60000);

function label(local, unit) {
  const dd = String(local.getUTCDate()).padStart(2, '0');
  const mon = MONTHS[local.getUTCMonth()];
  if (unit === 'day') return `${mon} ${dd}`;
  if (unit === 'week') return `${mon} ${dd}`;
  if (unit === 'month') return `${mon} ${String(local.getUTCFullYear()).slice(2)}`;
  return String(local.getUTCFullYear());
}

const pct = (cur, prev) => (prev ? Math.round(((cur - prev) / prev) * 1000) / 10 : cur ? 100 : 0);

// GET /api/admin/stats?range=daily|weekly|monthly|yearly
exports.dashboard = asyncHandler(async (req, res) => {
  const range = RANGES[req.query.range] ? req.query.range : 'monthly';
  const { unit, count } = RANGES[range];

  const currentBucket = bucketStart(new Date(), unit);
  const firstBucket = stepBack(currentBucket, unit, count - 1);
  const prevFirstBucket = stepBack(firstBucket, unit, count);
  const windowStart = toRealDate(firstBucket);
  const prevWindowStart = toRealDate(prevFirstBucket);

  const [orders, prevOrders, newUsers, prevUsers, meetings, visits, prevVisitCount] = await Promise.all([
    Order.find({ createdAt: { $gte: windowStart } }).select('createdAt totalAmount amountPaid status totalQuantity').lean(),
    Order.find({ createdAt: { $gte: prevWindowStart, $lt: windowStart } }).select('amountPaid status').lean(),
    User.find({ role: 'customer', createdAt: { $gte: windowStart } }).select('createdAt').lean(),
    User.countDocuments({ role: 'customer', createdAt: { $gte: prevWindowStart, $lt: windowStart } }),
    MeetingSlot.find({ status: { $in: ['booked', 'completed'] }, start: { $gte: windowStart } }).select('start').lean(),
    Visit.find({ firstSeenAt: { $gte: windowStart } }).select('firstSeenAt pageViews visitorId isNewVisitor').lean(),
    Visit.countDocuments({ firstSeenAt: { $gte: prevWindowStart, $lt: windowStart } }),
  ]);

  // Build empty buckets
  const buckets = [];
  const index = new Map();
  for (let i = 0; i < count; i++) {
    const local = stepBack(currentBucket, unit, count - 1 - i);
    const key = local.getTime();
    index.set(key, buckets.length);
    buckets.push({ label: label(local, unit), start: toRealDate(local), revenue: 0, orderValue: 0, orders: 0, items: 0, customers: 0, meetings: 0, visits: 0, pageViews: 0, uniques: new Set() });
  }
  const bump = (date, fn) => {
    const i = index.get(bucketStart(date, unit).getTime());
    if (i !== undefined) fn(buckets[i]);
  };
  orders.forEach((o) =>
    bump(o.createdAt, (b) => {
      b.orders += 1;
      if (o.status !== 'cancelled') {
        b.revenue += o.amountPaid || 0;
        b.orderValue += o.totalAmount || 0;
        b.items += o.totalQuantity || 0;
      }
    })
  );
  newUsers.forEach((u) => bump(u.createdAt, (b) => (b.customers += 1)));
  meetings.forEach((m) => bump(m.start, (b) => (b.meetings += 1)));
  visits.forEach((v) =>
    bump(v.firstSeenAt, (b) => {
      b.pageViews += v.pageViews || 0;
      b.uniques.add(v.visitorId); // unique visitors inside the bucket (day/week/month/year)
    })
  );
  buckets.forEach((b) => {
    b.visits = b.uniques.size;
    delete b.uniques;
  });

  const sum = (arr, k) => arr.reduce((s, x) => s + (x[k] || 0), 0);
  const active = (arr) => arr.filter((o) => o.status !== 'cancelled');
  const periodRevenue = sum(active(orders), 'amountPaid');
  const prevRevenue = sum(active(prevOrders), 'amountPaid');

  const now = new Date();
  const todayKey = now.toLocaleDateString('en-CA', { timeZone: env.timezone });
  const [visitToday, visitAllTime, deviceAgg, pageAgg] = await Promise.all([
    Visit.aggregate([{ $match: { day: todayKey } }, { $group: { _id: null, visitors: { $sum: 1 }, views: { $sum: '$pageViews' } } }]),
    Visit.aggregate([{ $group: { _id: null, visits: { $sum: 1 }, views: { $sum: '$pageViews' }, uniques: { $addToSet: '$visitorId' } } }, { $project: { visits: 1, views: 1, uniques: { $size: '$uniques' } } }]),
    Visit.aggregate([{ $match: { firstSeenAt: { $gte: windowStart } } }, { $group: { _id: '$device', count: { $sum: 1 } } }]),
    Visit.aggregate([
      { $match: { firstSeenAt: { $gte: windowStart } } },
      { $unwind: '$paths' },
      { $group: { _id: '$paths', visitors: { $sum: 1 } } },
      { $sort: { visitors: -1 } },
      { $limit: 6 },
    ]),
  ]);
  const periodVisits = new Set(visits.map((v) => `${v.visitorId}`)).size;

  const [
    totalCustomers, totalAdmins, blockedUsers, totalProducts, activeProducts, totalCategories,
    totalOrders, statusAgg, moneyAgg, categoryAgg, topProducts, recentOrders, recentUsers,
    upcomingMeetings, availableSlots, unreadAgg,
  ] = await Promise.all([
    User.countDocuments({ role: 'customer' }),
    User.countDocuments({ role: 'admin' }),
    User.countDocuments({ isBlocked: true }),
    Product.countDocuments(),
    Product.countDocuments({ isActive: true }),
    Category.countDocuments(),
    Order.countDocuments(),
    Order.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }]),
    Order.aggregate([
      { $match: { status: { $ne: 'cancelled' } } },
      { $group: { _id: null, paid: { $sum: '$amountPaid' }, value: { $sum: '$totalAmount' }, items: { $sum: '$totalQuantity' } } },
    ]),
    Order.aggregate([
      { $match: { status: { $ne: 'cancelled' } } },
      { $group: { _id: '$productSnapshot.category', orders: { $sum: 1 }, revenue: { $sum: '$amountPaid' } } },
      { $sort: { orders: -1 } },
      { $limit: 8 },
    ]),
    Product.find().sort({ orderCount: -1, views: -1 }).limit(5).select('name slug images orderCount views price').lean(),
    Order.find().sort('-createdAt').limit(6).populate('customer', 'name avatar email').lean(),
    User.find({ role: 'customer' }).sort('-createdAt').limit(6).select('name email avatar createdAt authProvider').lean(),
    MeetingSlot.find({ status: 'booked', start: { $gte: now } }).sort('start').limit(6).populate('bookedBy', 'name email avatar').lean(),
    MeetingSlot.countDocuments({ status: 'available', start: { $gte: now } }),
    Conversation.aggregate([{ $group: { _id: null, unread: { $sum: '$unreadByAdmin' }, active: { $sum: 1 } } }]),
  ]);

  const statusCounts = Object.fromEntries(statusAgg.map((s) => [s._id, s.count]));
  const money = moneyAgg[0] || { paid: 0, value: 0, items: 0 };

  res.json({
    success: true,
    range,
    series: buckets,
    period: {
      revenue: periodRevenue,
      revenueGrowth: pct(periodRevenue, prevRevenue),
      orders: orders.length,
      ordersGrowth: pct(orders.length, prevOrders.length),
      customers: newUsers.length,
      customersGrowth: pct(newUsers.length, prevUsers),
      meetings: meetings.length,
      visitors: periodVisits,
      visits: visits.length,
      visitsGrowth: pct(visits.length, prevVisitCount),
      pageViews: sum(visits, 'pageViews'),
      newVisitors: visits.filter((v) => v.isNewVisitor).length,
      conversion: visits.length ? Math.round((orders.length / visits.length) * 1000) / 10 : 0,
      items: sum(active(orders), 'totalQuantity'),
      avgOrderValue: active(orders).length ? Math.round(sum(active(orders), 'totalAmount') / active(orders).length) : 0,
    },
    totals: {
      customers: totalCustomers,
      admins: totalAdmins,
      blockedUsers,
      products: totalProducts,
      activeProducts,
      categories: totalCategories,
      orders: totalOrders,
      pendingOrders: (statusCounts.pending || 0) + (statusCounts.reviewing || 0),
      inProduction: statusCounts.in_production || 0,
      revenue: money.paid,
      orderValue: money.value,
      outstanding: Math.max(0, money.value - money.paid),
      itemsProduced: money.items,
      upcomingMeetings: upcomingMeetings.length,
      availableSlots,
      unreadMessages: unreadAgg[0]?.unread || 0,
      visitorsToday: visitToday[0]?.visitors || 0,
      pageViewsToday: visitToday[0]?.views || 0,
      totalVisits: visitAllTime[0]?.visits || 0,
      totalPageViews: visitAllTime[0]?.views || 0,
      uniqueVisitors: visitAllTime[0]?.uniques || 0,
      conversations: unreadAgg[0]?.active || 0,
    },
    statusCounts,
    categoryBreakdown: categoryAgg.map((c) => ({ name: c._id || 'Other', orders: c.orders, revenue: c.revenue })),
    devices: deviceAgg.map((d) => ({ name: d._id || 'desktop', count: d.count })),
    topPages: pageAgg.map((p) => ({ path: p._id, visitors: p.visitors })),
    topProducts,
    recentOrders,
    recentUsers,
    upcomingMeetings,
  });
});
