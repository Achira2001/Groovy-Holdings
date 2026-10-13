'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, ComposedChart, Legend, Line, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from 'recharts';
import {
  ArrowDownRight, ArrowUpRight, CalendarDays, Eye, MessageSquare, MonitorSmartphone, Package, RefreshCw, ShoppingBag, Target, Users, Wallet,
} from 'lucide-react';
import api, { getErrorMessage } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { useSocket } from '@/context/SocketContext';
import useChartColors from '@/components/admin/useChartColors';
import { Avatar, Badge, EmptyState, Skeleton, StatusBadge } from '@/components/ui';
import { cn, compactNumber, formatDate, formatDateTime, formatLKR, ORDER_STATUS, timeAgo } from '@/lib/utils';

const RANGES = [
  { key: 'daily', label: 'Daily', hint: 'last 30 days' },
  { key: 'weekly', label: 'Weekly', hint: 'last 12 weeks' },
  { key: 'monthly', label: 'Monthly', hint: 'last 12 months' },
  { key: 'yearly', label: 'Yearly', hint: 'last 5 years' },
];

function Growth({ value }) {
  if (value === undefined || value === null) return null;
  const up = value >= 0;
  return (
    <span className={cn('inline-flex items-center gap-0.5 rounded-md px-1.5 py-0.5 text-xs font-bold', up ? 'bg-success/10 text-success' : 'bg-danger/10 text-danger')}>
      {up ? <ArrowUpRight className="h-3.5 w-3.5" /> : <ArrowDownRight className="h-3.5 w-3.5" />}
      {Math.abs(value)}%
    </span>
  );
}

function Kpi({ icon: Icon, label, value, growth, sub, tone = 'brand' }) {
  const tones = { brand: 'bg-brand-soft text-brand', accent: 'bg-accent-soft text-accent', success: 'bg-success/10 text-success', warning: 'bg-warning/15 text-warning' };
  return (
    <div className="card p-5">
      <div className="flex items-start justify-between">
        <span className={cn('grid h-10 w-10 place-items-center rounded-xl', tones[tone])}>
          <Icon className="h-5 w-5" />
        </span>
        <Growth value={growth} />
      </div>
      <p className="mt-4 font-display text-[28px] font-extrabold leading-none tabular-nums">{value}</p>
      <p className="mt-1.5 text-sm font-semibold">{label}</p>
      {sub && <p className="mt-0.5 text-xs text-muted">{sub}</p>}
    </div>
  );
}

function Panel({ title, text, action, children, className }) {
  return (
    <section className={cn('panel', className)}>
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <h2 className="font-bold">{title}</h2>
          {text && <p className="text-xs text-muted">{text}</p>}
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}

function ChartTooltip({ active, payload, label, money }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl border border-line bg-surface px-3 py-2 text-xs shadow-pop">
      <p className="mb-1 font-bold">{label}</p>
      {payload.map((p) => (
        <p key={p.dataKey} className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full" style={{ background: p.color }} />
          <span className="text-muted">{p.name}:</span>
          <span className="font-semibold tabular-nums">{money?.includes(p.dataKey) ? formatLKR(p.value) : p.value}</span>
        </p>
      ))}
    </div>
  );
}

export default function DashboardPage() {
  const { user } = useAuth();
  const { socket } = useSocket();
  const c = useChartColors();
  const [range, setRange] = useState('daily');
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(
    async (quiet) => {
      if (!quiet) setData(null);
      setRefreshing(true);
      try {
        const res = await api.get('/admin/stats', { params: { range } });
        setData(res.data);
        setError('');
      } catch (e) {
        setError(getErrorMessage(e));
      } finally {
        setRefreshing(false);
      }
    },
    [range]
  );

  useEffect(() => {
    load();
  }, [load]);

  // Live: refresh numbers when orders / meetings / messages come in
  useEffect(() => {
    if (!socket) return undefined;
    const refresh = () => load(true);
    socket.on('notify', refresh);
    socket.on('meetings:changed', refresh);
    return () => {
      socket.off('notify', refresh);
      socket.off('meetings:changed', refresh);
    };
  }, [socket, load]);

  const statusData = useMemo(
    () =>
      Object.entries(data?.statusCounts || {})
        .filter(([, v]) => v > 0)
        .map(([k, v]) => ({ name: ORDER_STATUS[k]?.label || k, key: k, value: v })),
    [data]
  );

  const statusColor = (key) => {
    if (!c) return '#999';
    const tone = ORDER_STATUS[key]?.tone;
    return { warning: c.warning, brand: c.brand, accent: c.accent, success: c.success, danger: c.danger }[tone] || c.muted;
  };

  const hint = RANGES.find((r) => r.key === range)?.hint;
  const p = data?.period;
  const t = data?.totals;

  return (
    <div>
      <div className="mb-6 flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
        <div>
          <p className="text-sm font-semibold text-accent">{formatDate(new Date(), { weekday: 'long' })}</p>
          <h1 className="text-2xl font-extrabold sm:text-3xl">Welcome back, {user?.name?.split(' ')[0]}</h1>
          <p className="text-sm text-muted">Everything happening on the Groovy Holdings website, live.</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="inline-flex rounded-xl border border-line bg-surface p-1" role="tablist">
            {RANGES.map((r) => (
              <button
                key={r.key}
                type="button"
                role="tab"
                aria-selected={range === r.key}
                onClick={() => setRange(r.key)}
                className={cn('rounded-lg px-3 py-1.5 text-sm font-semibold transition', range === r.key ? 'bg-ink text-bg' : 'text-muted hover:text-ink')}
              >
                {r.label}
              </button>
            ))}
          </div>
          <button type="button" className="btn-icon border border-line bg-surface" onClick={() => load(true)} aria-label="Refresh">
            <RefreshCw className={cn('h-4 w-4', refreshing && 'animate-spin')} />
          </button>
        </div>
      </div>

      {error && <p className="mb-4 rounded-xl bg-danger/10 px-4 py-3 text-sm text-danger">{error}</p>}

      {/* Today strip */}
      <div className="mb-6 grid grid-cols-2 gap-2 rounded-2xl border border-dashed border-line p-2 sm:grid-cols-3 xl:grid-cols-6">
        {[
          ['Visitors today', t?.visitorsToday, Eye],
          ['Page views today', t?.pageViewsToday, MonitorSmartphone],
          ['Orders to review', t?.pendingOrders, Package, '/admin/orders?status=pending'],
          ['In production', t?.inProduction, ShoppingBag, '/admin/orders?status=in_production'],
          ['Unread messages', t?.unreadMessages, MessageSquare, '/admin/chat'],
          ['Upcoming meetings', t?.upcomingMeetings, CalendarDays, '/admin/meetings'],
        ].map(([label, value, Icon, href]) => {
          const inner = (
            <>
              <Icon className="h-4 w-4 text-muted" />
              <span className="font-display text-xl font-extrabold tabular-nums">{value ?? '–'}</span>
              <span className="text-xs text-muted">{label}</span>
            </>
          );
          return href ? (
            <Link key={label} href={href} className="flex flex-col gap-1 rounded-xl bg-surface p-3 transition hover:shadow-lift">{inner}</Link>
          ) : (
            <div key={label} className="flex flex-col gap-1 rounded-xl bg-surface p-3">{inner}</div>
          );
        })}
      </div>

      {!data ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {[...Array(8)].map((_, i) => <Skeleton key={i} className={i > 3 ? 'h-72 sm:col-span-2' : 'h-36'} />)}
        </div>
      ) : (
        <>
          {/* KPIs */}
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <Kpi icon={Eye} label="Website visitors" value={compactNumber(p.visitors)} growth={p.visitsGrowth} sub={`${compactNumber(p.pageViews)} page views · ${hint}`} />
            <Kpi icon={Package} label="Orders" value={p.orders} growth={p.ordersGrowth} sub={`${compactNumber(p.items)} pieces · ${hint}`} tone="accent" />
            <Kpi icon={Wallet} label="Revenue received" value={formatLKR(p.revenue)} growth={p.revenueGrowth} sub={`Avg order ${formatLKR(p.avgOrderValue)}`} tone="success" />
            <Kpi icon={Users} label="New customers" value={p.customers} growth={p.customersGrowth} sub={`${p.newVisitors} first-time visitors · ${p.conversion}% visit→order`} tone="warning" />
          </div>

          {/* Traffic */}
          <div className="mt-4 grid gap-4 xl:grid-cols-3">
            <Panel title="Website traffic" text={`Unique visitors and page views · ${hint}`} className="xl:col-span-2">
              <div className="h-72">
                {c && (
                  <ResponsiveContainer>
                    <AreaChart data={data.series} margin={{ left: -18, right: 8, top: 8 }}>
                      <defs>
                        <linearGradient id="gVisits" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor={c.brand} stopOpacity={0.35} />
                          <stop offset="100%" stopColor={c.brand} stopOpacity={0} />
                        </linearGradient>
                        <linearGradient id="gViews" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor={c.accent} stopOpacity={0.25} />
                          <stop offset="100%" stopColor={c.accent} stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid stroke={c.line} strokeDasharray="4 4" vertical={false} />
                      <XAxis dataKey="label" tick={{ fill: c.muted, fontSize: 11 }} tickLine={false} axisLine={false} interval="preserveStartEnd" minTickGap={16} />
                      <YAxis allowDecimals={false} tick={{ fill: c.muted, fontSize: 11 }} tickLine={false} axisLine={false} />
                      <Tooltip content={<ChartTooltip />} />
                      <Legend iconType="circle" wrapperStyle={{ fontSize: 12 }} />
                      <Area type="monotone" dataKey="pageViews" name="Page views" stroke={c.accent} strokeWidth={2} fill="url(#gViews)" />
                      <Area type="monotone" dataKey="visits" name="Visitors" stroke={c.brand} strokeWidth={2.5} fill="url(#gVisits)" />
                    </AreaChart>
                  </ResponsiveContainer>
                )}
              </div>
            </Panel>
            <Panel title="Devices & top pages" text={hint}>
              {data.devices.length ? (
                <>
                  <div className="h-36">
                    {c && (
                      <ResponsiveContainer>
                        <PieChart>
                          <Pie data={data.devices} dataKey="count" nameKey="name" innerRadius={38} outerRadius={60} paddingAngle={3} stroke="none">
                            {data.devices.map((d, i) => <Cell key={d.name} fill={[c.brand, c.accent, c.success][i % 3]} />)}
                          </Pie>
                          <Tooltip content={<ChartTooltip />} />
                          <Legend iconType="circle" layout="vertical" align="right" verticalAlign="middle" wrapperStyle={{ fontSize: 12, textTransform: 'capitalize' }} />
                        </PieChart>
                      </ResponsiveContainer>
                    )}
                  </div>
                  <ul className="mt-3 space-y-2 text-sm">
                    {data.topPages.map((pg) => {
                      const max = data.topPages[0]?.visitors || 1;
                      return (
                        <li key={pg.path}>
                          <div className="flex justify-between gap-2">
                            <span className="truncate font-mono text-xs">{pg.path}</span>
                            <span className="text-xs font-semibold tabular-nums">{pg.visitors}</span>
                          </div>
                          <div className="mt-1 h-1.5 rounded-full bg-surface-2">
                            <div className="h-full rounded-full bg-brand" style={{ width: `${(pg.visitors / max) * 100}%` }} />
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                </>
              ) : (
                <p className="py-10 text-center text-sm text-muted">No visits recorded yet.</p>
              )}
            </Panel>
          </div>

          {/* Orders & revenue */}
          <div className="mt-4 grid gap-4 xl:grid-cols-3">
            <Panel title="Orders & revenue" text={`Orders placed and payments received · ${hint}`} className="xl:col-span-2">
              <div className="h-72">
                {c && (
                  <ResponsiveContainer>
                    <ComposedChart data={data.series} margin={{ left: -6, right: 0, top: 8 }}>
                      <CartesianGrid stroke={c.line} strokeDasharray="4 4" vertical={false} />
                      <XAxis dataKey="label" tick={{ fill: c.muted, fontSize: 11 }} tickLine={false} axisLine={false} minTickGap={16} />
                      <YAxis yAxisId="l" allowDecimals={false} tick={{ fill: c.muted, fontSize: 11 }} tickLine={false} axisLine={false} width={30} />
                      <YAxis yAxisId="r" orientation="right" tick={{ fill: c.muted, fontSize: 11 }} tickLine={false} axisLine={false} tickFormatter={compactNumber} width={44} />
                      <Tooltip content={<ChartTooltip money={['revenue', 'orderValue']} />} />
                      <Legend iconType="circle" wrapperStyle={{ fontSize: 12 }} />
                      <Bar yAxisId="l" dataKey="orders" name="Orders" fill={c.accent} radius={[6, 6, 0, 0]} maxBarSize={28} />
                      <Line yAxisId="r" type="monotone" dataKey="orderValue" name="Order value (LKR)" stroke={c['brand-deep']} strokeWidth={2} dot={false} strokeDasharray="5 4" />
                      <Line yAxisId="r" type="monotone" dataKey="revenue" name="Revenue (LKR)" stroke={c.success} strokeWidth={2.5} dot={false} />
                    </ComposedChart>
                  </ResponsiveContainer>
                )}
              </div>
            </Panel>
            <Panel title="Orders by status" text="All time" action={<Link href="/admin/orders" className="link text-xs">Manage</Link>}>
              {statusData.length ? (
                <>
                  <div className="h-44">
                    {c && (
                      <ResponsiveContainer>
                        <PieChart>
                          <Pie data={statusData} dataKey="value" nameKey="name" innerRadius={48} outerRadius={78} paddingAngle={2} stroke="none">
                            {statusData.map((s) => <Cell key={s.key} fill={statusColor(s.key)} />)}
                          </Pie>
                          <Tooltip content={<ChartTooltip />} />
                        </PieChart>
                      </ResponsiveContainer>
                    )}
                  </div>
                  <ul className="mt-3 grid grid-cols-2 gap-x-3 gap-y-1.5 text-xs">
                    {statusData.map((s) => (
                      <li key={s.key} className="flex items-center gap-2">
                        <span className="h-2.5 w-2.5 rounded-full" style={{ background: statusColor(s.key) }} />
                        <span className="flex-1 truncate text-muted">{s.name}</span>
                        <span className="font-bold tabular-nums">{s.value}</span>
                      </li>
                    ))}
                  </ul>
                </>
              ) : (
                <p className="py-10 text-center text-sm text-muted">No orders yet.</p>
              )}
            </Panel>
          </div>

          {/* Customers, meetings, categories */}
          <div className="mt-4 grid gap-4 lg:grid-cols-2">
            <Panel title="New customers & meetings" text={hint}>
              <div className="h-60">
                {c && (
                  <ResponsiveContainer>
                    <BarChart data={data.series} margin={{ left: -18, right: 8, top: 8 }}>
                      <CartesianGrid stroke={c.line} strokeDasharray="4 4" vertical={false} />
                      <XAxis dataKey="label" tick={{ fill: c.muted, fontSize: 11 }} tickLine={false} axisLine={false} minTickGap={16} />
                      <YAxis allowDecimals={false} tick={{ fill: c.muted, fontSize: 11 }} tickLine={false} axisLine={false} />
                      <Tooltip content={<ChartTooltip />} />
                      <Legend iconType="circle" wrapperStyle={{ fontSize: 12 }} />
                      <Bar dataKey="customers" name="New customers" fill={c.brand} radius={[6, 6, 0, 0]} maxBarSize={22} />
                      <Bar dataKey="meetings" name="Meetings" fill={c.warning} radius={[6, 6, 0, 0]} maxBarSize={22} />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>
            </Panel>
            <Panel title="Orders by category" text="All time, excluding cancelled">
              {data.categoryBreakdown.length ? (
                <div className="h-60">
                  {c && (
                    <ResponsiveContainer>
                      <BarChart data={data.categoryBreakdown} layout="vertical" margin={{ left: 10, right: 16 }}>
                        <CartesianGrid stroke={c.line} strokeDasharray="4 4" horizontal={false} />
                        <XAxis type="number" allowDecimals={false} tick={{ fill: c.muted, fontSize: 11 }} tickLine={false} axisLine={false} />
                        <YAxis type="category" dataKey="name" tick={{ fill: c.ink, fontSize: 12 }} tickLine={false} axisLine={false} width={90} />
                        <Tooltip content={<ChartTooltip money={['revenue']} />} />
                        <Bar dataKey="orders" name="Orders" fill={c.accent} radius={[0, 6, 6, 0]} maxBarSize={20} />
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                </div>
              ) : (
                <p className="py-10 text-center text-sm text-muted">No category data yet.</p>
              )}
            </Panel>
          </div>

          {/* Totals */}
          <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-4 xl:grid-cols-8">
            {[
              ['Customers', t.customers, '/admin/users?role=customer'],
              ['Admins', t.admins, '/admin/users?role=admin'],
              ['Products', `${t.activeProducts}/${t.products}`, '/admin/products'],
              ['Categories', t.categories, '/admin/categories'],
              ['All orders', t.orders, '/admin/orders'],
              ['Outstanding', formatLKR(t.outstanding), '/admin/orders'],
              ['Total visits', compactNumber(t.totalVisits)],
              ['Unique visitors', compactNumber(t.uniqueVisitors)],
            ].map(([label, value, href]) => {
              const cls = 'card block p-4';
              const body = (
                <>
                  <p className="text-xs text-muted">{label}</p>
                  <p className="mt-1 truncate font-display text-lg font-extrabold tabular-nums">{value}</p>
                </>
              );
              return href ? <Link key={label} href={href} className={cn(cls, 'hover:shadow-lift')}>{body}</Link> : <div key={label} className={cls}>{body}</div>;
            })}
          </div>

          {/* Lists */}
          <div className="mt-4 grid gap-4 xl:grid-cols-3">
            <Panel title="Recent orders" action={<Link href="/admin/orders" className="link text-xs">View all</Link>} className="xl:col-span-2">
              {data.recentOrders.length ? (
                <div className="-mx-2 overflow-x-auto">
                  <table className="w-full min-w-[560px] text-sm">
                    <thead className="text-left text-xs text-muted">
                      <tr>
                        <th className="px-2 pb-2 font-semibold">Order</th>
                        <th className="px-2 pb-2 font-semibold">Customer</th>
                        <th className="px-2 pb-2 font-semibold">Qty</th>
                        <th className="px-2 pb-2 font-semibold">Status</th>
                        <th className="px-2 pb-2 text-right font-semibold">Placed</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.recentOrders.map((o) => (
                        <tr key={o._id} className="border-t border-line">
                          <td className="px-2 py-2.5">
                            <Link href={`/admin/orders/${o._id}`} className="font-semibold hover:text-brand">{o.orderNumber}</Link>
                            <p className="max-w-[180px] truncate text-xs text-muted">{o.productSnapshot?.name}</p>
                          </td>
                          <td className="px-2 py-2.5">
                            <span className="flex items-center gap-2">
                              <Avatar user={o.customer} size={26} />
                              <span className="max-w-[140px] truncate">{o.customer?.name || 'Deleted user'}</span>
                            </span>
                          </td>
                          <td className="px-2 py-2.5 tabular-nums">{o.totalQuantity}</td>
                          <td className="px-2 py-2.5"><StatusBadge status={o.status} /></td>
                          <td className="px-2 py-2.5 text-right text-xs text-muted">{timeAgo(o.createdAt)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <EmptyState icon={Package} title="No orders yet" text="New orders appear here in real time." />
              )}
            </Panel>

            <Panel title="Upcoming meetings" action={<Link href="/admin/meetings" className="link text-xs">Calendar</Link>}>
              {data.upcomingMeetings.length ? (
                <ul className="space-y-3">
                  {data.upcomingMeetings.map((m) => (
                    <li key={m._id} className="flex items-center gap-3">
                      <Avatar user={m.bookedBy} size={34} />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-semibold">{m.bookedBy?.name}</span>
                        <span className="block truncate text-xs text-muted">{formatDateTime(m.start)} · {m.topic}</span>
                      </span>
                      {m.meetLink && <a href={m.meetLink} target="_blank" rel="noreferrer" className="btn-outline btn-sm">Join</a>}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-muted">No meetings booked. {t.availableSlots} open slot(s) available.</p>
              )}
            </Panel>

            <Panel title="Top products" text="By orders and views" action={<Link href="/admin/products" className="link text-xs">Products</Link>}>
              <ul className="space-y-3">
                {data.topProducts.map((pr, i) => (
                  <li key={pr._id} className="flex items-center gap-3">
                    <span className="w-4 text-xs font-bold text-muted">{i + 1}</span>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    {pr.images?.[0] ? <img src={pr.images[0]} alt="" className="h-10 w-10 rounded-lg object-cover" /> : <span className="h-10 w-10 rounded-lg bg-surface-2" />}
                    <span className="min-w-0 flex-1">
                      <Link href={`/admin/products/${pr._id}`} className="block truncate text-sm font-semibold hover:text-brand">{pr.name}</Link>
                      <span className="text-xs text-muted">{pr.orderCount} orders · {pr.views} views</span>
                    </span>
                  </li>
                ))}
                {!data.topProducts.length && <p className="text-sm text-muted">Add products to see rankings.</p>}
              </ul>
            </Panel>

            <Panel title="Newest customers" action={<Link href="/admin/users" className="link text-xs">Users</Link>}>
              <ul className="space-y-3">
                {data.recentUsers.map((u) => (
                  <li key={u._id}>
                    <Link href={`/admin/users/${u._id}`} className="flex items-center gap-3 hover:opacity-90">
                      <Avatar user={u} size={34} />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-semibold">{u.name}</span>
                        <span className="block truncate text-xs text-muted">{u.email}</span>
                      </span>
                      <Badge tone={u.authProvider === 'google' ? 'neutral' : 'brand'}>{u.authProvider}</Badge>
                    </Link>
                  </li>
                ))}
                {!data.recentUsers.length && <p className="text-sm text-muted">No customers yet.</p>}
              </ul>
            </Panel>

            <Panel title="Conversion snapshot" text={hint}>
              <div className="space-y-4">
                {[
                  ['Visitors', p.visitors, Eye],
                  ['Orders', p.orders, Package],
                  ['Meetings', p.meetings, CalendarDays],
                ].map(([label, value, Icon], i, arr) => {
                  const max = Math.max(1, arr[0][1]);
                  return (
                    <div key={label}>
                      <div className="flex items-center justify-between text-sm">
                        <span className="flex items-center gap-2 font-semibold"><Icon className="h-4 w-4 text-muted" /> {label}</span>
                        <span className="font-bold tabular-nums">{value}</span>
                      </div>
                      <div className="mt-1.5 h-2 rounded-full bg-surface-2">
                        <div className={cn('h-full rounded-full', ['bg-brand', 'bg-accent', 'bg-warning'][i])} style={{ width: `${Math.min(100, (value / max) * 100)}%` }} />
                      </div>
                    </div>
                  );
                })}
                <p className="flex items-center gap-2 rounded-xl bg-surface-2 px-3 py-2 text-sm">
                  <Target className="h-4 w-4 text-accent" /> <strong>{p.conversion}%</strong> of visits led to an order
                </p>
              </div>
            </Panel>
          </div>
        </>
      )}
    </div>
  );
}
