'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowRight, CalendarDays, MessageSquare, Package, Shirt, Video } from 'lucide-react';
import api from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { useSocket } from '@/context/SocketContext';
import AccountShell from '@/components/account/AccountShell';
import { EmptyState, Skeleton, StatusBadge } from '@/components/ui';
import { formatDate, formatDateTime, formatLKR, whatsappLink } from '@/lib/utils';

function Overview() {
  const { user } = useAuth();
  const { unread } = useSocket();
  const [orders, setOrders] = useState(null);
  const [meetings, setMeetings] = useState(null);

  useEffect(() => {
    api.get('/orders/mine').then(({ data }) => setOrders(data.orders)).catch(() => setOrders([]));
    api.get('/meetings/mine').then(({ data }) => setMeetings(data.meetings)).catch(() => setMeetings([]));
  }, []);

  const active = orders?.filter((o) => !['delivered', 'cancelled'].includes(o.status)) || [];
  const upcoming = (meetings || []).filter((m) => m.status === 'booked' && new Date(m.end) > new Date()).sort((a, b) => new Date(a.start) - new Date(b.start));
  const hour = Number(new Date().toLocaleString('en-GB', { hour: 'numeric', hour12: false, timeZone: 'Asia/Colombo' }));
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

  const stats = [
    { label: 'Active orders', value: orders ? active.length : null, icon: Package, href: '/account/orders' },
    { label: 'All orders', value: orders ? orders.length : null, icon: Shirt, href: '/account/orders' },
    { label: 'Upcoming meetings', value: meetings ? upcoming.length : null, icon: CalendarDays, href: '/account/meetings' },
    { label: 'Unread messages', value: unread, icon: MessageSquare, href: '/chat' },
  ];

  return (
    <>
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-semibold text-accent">{greeting}</p>
          <h1 className="mt-1 text-3xl font-extrabold sm:text-4xl">{user.name.split(' ')[0]}, here&apos;s your print desk.</h1>
          <p className="mt-2 text-sm text-muted">Track orders, talk to our team and book design meetings in one place.</p>
        </div>
        <Link href="/products" className="btn-primary">
          Start a new order <ArrowRight className="h-4 w-4" />
        </Link>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {stats.map(({ label, value, icon: Icon, href }) => (
          <Link key={label} href={href} className="card group p-5 transition hover:-translate-y-0.5 hover:shadow-lift">
            <Icon className="h-5 w-5 text-brand" />
            <p className="mt-4 font-display text-3xl font-extrabold tabular-nums">{value === null ? <Skeleton className="h-8 w-10" /> : value}</p>
            <p className="mt-1 text-sm text-muted">{label}</p>
          </Link>
        ))}
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-[1.6fr_1fr]">
        <section className="panel">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-bold">Recent orders</h2>
            <Link href="/account/orders" className="link text-sm">View all</Link>
          </div>
          {!orders ? (
            <div className="space-y-3">{[0, 1, 2].map((i) => <Skeleton key={i} className="h-16" />)}</div>
          ) : orders.length ? (
            <ul className="divide-y divide-line">
              {orders.slice(0, 5).map((o) => (
                <li key={o._id}>
                  <Link href={`/account/orders/${o._id}`} className="flex items-center gap-4 py-3 hover:opacity-90">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    {o.productSnapshot?.image ? <img src={o.productSnapshot.image} alt="" className="h-12 w-12 rounded-lg object-cover" /> : <span className="h-12 w-12 rounded-lg bg-surface-2" />}
                    <span className="min-w-0 flex-1">
                      <span className="block truncate font-semibold">{o.productSnapshot?.name}</span>
                      <span className="block text-xs text-muted">{o.orderNumber} · {o.totalQuantity} pcs · {formatDate(o.createdAt)}</span>
                    </span>
                    <StatusBadge status={o.status} />
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <EmptyState icon={Package} title="No orders yet" text="Pick a product, add your sizes and upload your design to place your first order." action={<Link href="/products" className="btn-primary">Browse products</Link>} />
          )}
        </section>

        <div className="space-y-6">
          <section className="panel">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-bold">Next meeting</h2>
              <Link href="/meetings" className="link text-sm">Book</Link>
            </div>
            {upcoming[0] ? (
              <div className="rounded-xl bg-brand-soft p-4">
                <p className="text-sm font-bold text-brand">{formatDateTime(upcoming[0].start)}</p>
                <p className="mt-1 font-semibold">{upcoming[0].topic}</p>
                {upcoming[0].meetLink && (
                  <a href={upcoming[0].meetLink} target="_blank" rel="noreferrer" className="btn-brand btn-sm mt-3">
                    <Video className="h-4 w-4" /> Join Google Meet
                  </a>
                )}
              </div>
            ) : (
              <p className="text-sm text-muted">No meetings booked. Talk to our designers about fabrics, sizes and prices on a quick video call.</p>
            )}
          </section>

          <section className="overflow-hidden rounded-2xl bg-[#13243B] p-6 text-white">
            <p className="font-display text-xl font-bold">Need a design made?</p>
            <p className="mt-2 text-sm text-white/75">Our designers can create your artwork. Send your idea on WhatsApp and we&apos;ll take it from there.</p>
            <a href={whatsappLink(`Hi Groovy Holdings! I'm ${user.name} and I need a design for my order.`)} target="_blank" rel="noreferrer" className="btn mt-4 bg-[#1FAF5A] text-white hover:bg-[#199a4e]">
              Message on WhatsApp
            </a>
          </section>
        </div>
      </div>
      {orders?.some((o) => o.totalAmount > 0) && (
        <p className="mt-6 text-xs text-muted">
          Total confirmed order value: {formatLKR(orders.filter((o) => o.status !== 'cancelled').reduce((s, o) => s + (o.totalAmount || 0), 0))}
        </p>
      )}
    </>
  );
}

export default function AccountPage() {
  return (
    <AccountShell>
      <Overview />
    </AccountShell>
  );
}
