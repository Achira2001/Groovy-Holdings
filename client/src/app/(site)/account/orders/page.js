'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { Package, Search } from 'lucide-react';
import api, { getErrorMessage } from '@/lib/api';
import AccountShell from '@/components/account/AccountShell';
import { EmptyState, PageHeader, Skeleton, StatusBadge } from '@/components/ui';
import { cn, formatDate, formatLKR } from '@/lib/utils';

const FILTERS = [
  { key: 'all', label: 'All' },
  { key: 'active', label: 'In progress' },
  { key: 'delivered', label: 'Delivered' },
  { key: 'cancelled', label: 'Cancelled' },
];

function Orders() {
  const [orders, setOrders] = useState(null);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('all');
  const [q, setQ] = useState('');

  useEffect(() => {
    api.get('/orders/mine').then(({ data }) => setOrders(data.orders)).catch((e) => setError(getErrorMessage(e)));
  }, []);

  const shown = useMemo(() => {
    if (!orders) return [];
    return orders.filter((o) => {
      if (filter === 'active' && ['delivered', 'cancelled'].includes(o.status)) return false;
      if (['delivered', 'cancelled'].includes(filter) && o.status !== filter) return false;
      if (q && !`${o.orderNumber} ${o.productSnapshot?.name}`.toLowerCase().includes(q.toLowerCase())) return false;
      return true;
    });
  }, [orders, filter, q]);

  return (
    <>
      <PageHeader title="My orders" text="Every order with its status, design files and price." actions={<Link href="/products" className="btn-primary">New order</Link>} />
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-2">
          {FILTERS.map((f) => (
            <button key={f.key} type="button" onClick={() => setFilter(f.key)} className={cn('chip', filter === f.key && 'border-ink bg-ink text-bg')}>
              {f.label}
            </button>
          ))}
        </div>
        <label className="relative sm:w-72">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
          <input className="input pl-9" placeholder="Search order no. or product" value={q} onChange={(e) => setQ(e.target.value)} />
        </label>
      </div>

      {error && <p className="text-danger">{error}</p>}
      {!orders && !error ? (
        <div className="space-y-3">{[0, 1, 2, 3].map((i) => <Skeleton key={i} className="h-24" />)}</div>
      ) : shown.length ? (
        <ul className="grid gap-3">
          {shown.map((o) => (
            <li key={o._id}>
              <Link href={`/account/orders/${o._id}`} className="card flex flex-col gap-4 p-4 transition hover:shadow-lift sm:flex-row sm:items-center">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                {o.productSnapshot?.image ? <img src={o.productSnapshot.image} alt="" className="h-16 w-16 rounded-xl object-cover" /> : <span className="h-16 w-16 rounded-xl bg-surface-2" />}
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono text-xs font-bold text-muted">{o.orderNumber}</span>
                    <StatusBadge status={o.status} />
                  </div>
                  <p className="mt-1 truncate font-display text-lg font-bold">{o.productSnapshot?.name}</p>
                  <p className="text-sm text-muted">
                    {o.totalQuantity} pieces · {o.designFiles?.length || 0} design file(s) · placed {formatDate(o.createdAt)}
                  </p>
                </div>
                <div className="text-left sm:text-right">
                  <p className="text-xs text-muted">{o.totalAmount ? 'Final price' : 'Estimate'}</p>
                  <p className="font-display text-lg font-bold tabular-nums">{formatLKR(o.totalAmount || o.estimatedAmount)}</p>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      ) : (
        <EmptyState icon={Package} title={orders?.length ? 'No orders match' : 'No orders yet'} text={orders?.length ? 'Try another filter.' : 'Browse our past work and place your first order.'} action={!orders?.length && <Link href="/products" className="btn-primary">Browse products</Link>} />
      )}
    </>
  );
}

export default function MyOrdersPage() {
  return (
    <AccountShell>
      <Orders />
    </AccountShell>
  );
}
