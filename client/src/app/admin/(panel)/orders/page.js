'use client';

import { Suspense, useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import toast from 'react-hot-toast';
import { Package, Paperclip, Search } from 'lucide-react';
import api, { getErrorMessage } from '@/lib/api';
import { useSocket } from '@/context/SocketContext';
import { Avatar, Badge, EmptyState, PageHeader, Pagination, Select, Skeleton, StatusBadge } from '@/components/ui';
import { cn, formatDate, formatLKR, ORDER_STATUS, timeAgo } from '@/lib/utils';

function OrdersAdmin() {
  const params = useSearchParams();
  const { socket } = useSocket();
  const [status, setStatus] = useState(params.get('status') || 'all');
  const [payment, setPayment] = useState('all');
  const [q, setQ] = useState('');
  const [search, setSearch] = useState('');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [page, setPage] = useState(1);
  const [data, setData] = useState(null);

  useEffect(() => {
    const t = setTimeout(() => {
      setSearch(q);
      setPage(1);
    }, 350);
    return () => clearTimeout(t);
  }, [q]);

  const load = useCallback(() => {
    api
      .get('/orders', { params: { status, payment, search, from: from || undefined, to: to || undefined, page } })
      .then(({ data: d }) => setData(d))
      .catch((e) => toast.error(getErrorMessage(e)));
  }, [status, payment, search, from, to, page]);
  useEffect(load, [load]);

  useEffect(() => {
    if (!socket) return undefined;
    const onNotify = (n) => n.type === 'order' && load();
    socket.on('notify', onNotify);
    return () => socket.off('notify', onNotify);
  }, [socket, load]);

  const counts = data?.statusCounts || {};
  const all = Object.values(counts).reduce((a, b) => a + b, 0);

  return (
    <>
      <PageHeader title="Orders" text="Review designs, confirm prices and move orders through production." />
      <div className="scrollbar-thin -mx-1 mb-4 flex gap-2 overflow-x-auto px-1 pb-1">
        {[['all', 'All', all], ...Object.entries(ORDER_STATUS).map(([k, v]) => [k, v.label, counts[k] || 0])].map(([k, label, n]) => (
          <button key={k} type="button" onClick={() => { setStatus(k); setPage(1); }} className={cn('chip shrink-0', status === k && 'border-ink bg-ink text-bg')}>
            {label} <span className="tabular-nums opacity-70">{n}</span>
          </button>
        ))}
      </div>
      <div className="panel mb-4 grid gap-3 p-4 md:grid-cols-[1fr_160px_150px_150px]">
        <label className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
          <input className="input pl-9" placeholder="Order no., product, customer name or email" value={q} onChange={(e) => setQ(e.target.value)} />
        </label>
        <Select value={payment} onChange={(e) => { setPayment(e.target.value); setPage(1); }} aria-label="Payment">
          <option value="all">Any payment</option>
          <option value="unpaid">Unpaid</option>
          <option value="partial">Partly paid</option>
          <option value="paid">Paid</option>
        </Select>
        <input type="date" className="input" value={from} onChange={(e) => { setFrom(e.target.value); setPage(1); }} aria-label="From date" />
        <input type="date" className="input" value={to} onChange={(e) => { setTo(e.target.value); setPage(1); }} aria-label="To date" />
      </div>

      {!data ? (
        <Skeleton className="h-96" />
      ) : data.orders.length ? (
        <div className="card overflow-x-auto">
          <table className="w-full min-w-[980px] text-sm">
            <thead className="bg-surface-2 text-left text-xs uppercase tracking-wider text-muted">
              <tr>
                <th className="px-4 py-3 font-semibold">Order</th>
                <th className="px-4 py-3 font-semibold">Customer</th>
                <th className="px-4 py-3 font-semibold">Qty</th>
                <th className="px-4 py-3 font-semibold">Amount</th>
                <th className="px-4 py-3 font-semibold">Payment</th>
                <th className="px-4 py-3 font-semibold">Status</th>
                <th className="px-4 py-3 font-semibold">Needed by</th>
              </tr>
            </thead>
            <tbody>
              {data.orders.map((o) => (
                <tr key={o._id} className={cn('border-t border-line', o.status === 'pending' && 'bg-warning/5')}>
                  <td className="px-4 py-3">
                    <Link href={`/admin/orders/${o._id}`} className="flex items-center gap-3">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      {o.productSnapshot?.image ? <img src={o.productSnapshot.image} alt="" className="h-11 w-11 rounded-lg object-cover" /> : <span className="h-11 w-11 rounded-lg bg-surface-2" />}
                      <span>
                        <span className="block font-mono text-xs font-bold hover:text-brand">{o.orderNumber}</span>
                        <span className="block max-w-[200px] truncate font-semibold">{o.productSnapshot?.name}</span>
                        <span className="flex items-center gap-1 text-xs text-muted"><Paperclip className="h-3 w-3" /> {o.designFiles?.length} · {timeAgo(o.createdAt)}</span>
                      </span>
                    </Link>
                  </td>
                  <td className="px-4 py-3">
                    <span className="flex items-center gap-2">
                      <Avatar user={o.customer} size={30} />
                      <span className="min-w-0">
                        <span className="block max-w-[160px] truncate font-semibold">{o.customer?.name || 'Deleted user'}</span>
                        {o.contactWhatsapp && <a href={`https://wa.me/${o.contactWhatsapp}`} target="_blank" rel="noreferrer" className="text-xs text-[#1FAF5A] hover:underline">+{o.contactWhatsapp}</a>}
                      </span>
                    </span>
                  </td>
                  <td className="px-4 py-3 tabular-nums">{o.totalQuantity}</td>
                  <td className="px-4 py-3 tabular-nums">
                    <span className="font-semibold">{o.totalAmount ? formatLKR(o.totalAmount) : '—'}</span>
                    <span className="block text-xs text-muted">est. {formatLKR(o.estimatedAmount)}</span>
                  </td>
                  <td className="px-4 py-3">
                    <Badge tone={{ paid: 'success', partial: 'warning', unpaid: 'neutral' }[o.paymentStatus]}>{o.paymentStatus}</Badge>
                  </td>
                  <td className="px-4 py-3"><StatusBadge status={o.status} /></td>
                  <td className="px-4 py-3 text-muted">{o.neededBy ? formatDate(o.neededBy) : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="px-4 pb-4"><Pagination page={data.page} pages={data.pages} onChange={setPage} /></div>
        </div>
      ) : (
        <EmptyState icon={Package} title="No orders found" text="Orders placed by customers show up here instantly." />
      )}
    </>
  );
}

export default function Page() {
  return (
    <Suspense>
      <OrdersAdmin />
    </Suspense>
  );
}
