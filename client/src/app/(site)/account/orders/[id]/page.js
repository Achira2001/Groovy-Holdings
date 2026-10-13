'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import toast from 'react-hot-toast';
import { ArrowLeft, CalendarClock, MapPin, MessageSquare, Phone } from 'lucide-react';
import api, { getErrorMessage } from '@/lib/api';
import { useSocket } from '@/context/SocketContext';
import AccountShell from '@/components/account/AccountShell';
import { ConfirmDialog, PageLoader, StatusBadge, Textarea } from '@/components/ui';
import { FileGrid } from '@/components/shared/Attachments';
import { OrderHistory, OrderItems, OrderMoney, OrderProgress } from '@/components/orders/OrderParts';
import { formatDate, formatDateTime } from '@/lib/utils';

function OrderDetail() {
  const { id } = useParams();
  const { socket } = useSocket();
  const [order, setOrder] = useState(null);
  const [error, setError] = useState('');
  const [cancelOpen, setCancelOpen] = useState(false);
  const [reason, setReason] = useState('');
  const [busy, setBusy] = useState(false);

  const load = useCallback(() => {
    api.get(`/orders/${id}`).then(({ data }) => setOrder(data.order)).catch((e) => setError(getErrorMessage(e)));
  }, [id]);

  useEffect(load, [load]);

  // Refresh when the team updates this order
  useEffect(() => {
    if (!socket) return undefined;
    const onNotify = (n) => n.link?.includes(id) && load();
    socket.on('notify', onNotify);
    return () => socket.off('notify', onNotify);
  }, [socket, id, load]);

  const cancel = async () => {
    setBusy(true);
    try {
      const { data } = await api.patch(`/orders/${id}/cancel`, { reason });
      toast.success(data.message);
      setCancelOpen(false);
      load();
    } catch (e) {
      toast.error(getErrorMessage(e));
    } finally {
      setBusy(false);
    }
  };

  if (error) return <p className="text-danger">{error}</p>;
  if (!order) return <PageLoader />;

  return (
    <>
      <Link href="/account/orders" className="mb-4 inline-flex items-center gap-1.5 text-sm font-semibold text-muted hover:text-ink">
        <ArrowLeft className="h-4 w-4" /> All orders
      </Link>
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-center gap-4">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          {order.productSnapshot?.image && <img src={order.productSnapshot.image} alt="" className="h-16 w-16 rounded-xl object-cover" />}
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-sm font-bold text-muted">{order.orderNumber}</span>
              <StatusBadge status={order.status} />
            </div>
            <h1 className="mt-1 text-2xl font-extrabold sm:text-3xl">{order.productSnapshot?.name}</h1>
            <p className="text-sm text-muted">Placed {formatDateTime(order.createdAt)}</p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href="/chat" className="btn-outline">
            <MessageSquare className="h-4 w-4" /> Message the team
          </Link>
          {['pending', 'reviewing'].includes(order.status) && (
            <button type="button" className="btn-ghost text-danger" onClick={() => setCancelOpen(true)}>
              Cancel order
            </button>
          )}
        </div>
      </div>

      <div className="panel mb-6">
        <OrderProgress status={order.status} />
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.5fr_1fr]">
        <div className="space-y-6">
          <section className="panel">
            <h2 className="mb-4 text-lg font-bold">Sizes & quantities</h2>
            <OrderItems order={order} />
          </section>
          <section className="panel">
            <h2 className="mb-4 text-lg font-bold">Your design files</h2>
            <FileGrid files={order.designFiles} />
          </section>
          {order.message && (
            <section className="panel">
              <h2 className="mb-2 text-lg font-bold">Your message</h2>
              <p className="whitespace-pre-wrap text-sm leading-relaxed text-muted">{order.message}</p>
            </section>
          )}
        </div>
        <div className="space-y-6">
          <section className="panel">
            <h2 className="mb-2 text-lg font-bold">Price</h2>
            <OrderMoney order={order} />
            <p className="mt-3 text-xs text-muted">The final price is confirmed by our team after checking your design, material and quantity.</p>
          </section>
          <section className="panel space-y-3 text-sm">
            <h2 className="text-lg font-bold">Delivery</h2>
            <p className="flex gap-2"><Phone className="mt-0.5 h-4 w-4 shrink-0 text-muted" /> +{order.contactWhatsapp || '—'}</p>
            <p className="flex gap-2"><MapPin className="mt-0.5 h-4 w-4 shrink-0 text-muted" /> {order.deliveryAddress || 'Pick up / to be confirmed'}</p>
            <p className="flex gap-2"><CalendarClock className="mt-0.5 h-4 w-4 shrink-0 text-muted" /> Needed by {order.neededBy ? formatDate(order.neededBy) : 'not specified'}</p>
            {order.expectedDelivery && <p className="rounded-lg bg-success/10 px-3 py-2 font-semibold text-success">Expected ready: {formatDate(order.expectedDelivery)}</p>}
          </section>
          <section className="panel">
            <h2 className="mb-4 text-lg font-bold">History</h2>
            <OrderHistory history={order.statusHistory} />
          </section>
        </div>
      </div>

      <ConfirmDialog open={cancelOpen} onClose={() => setCancelOpen(false)} onConfirm={cancel} loading={busy} danger title="Cancel this order?" confirmLabel="Cancel order" text="Our team will be notified. You can place a new order any time.">
        <Textarea className="mt-4" label="Reason (optional)" value={reason} onChange={(e) => setReason(e.target.value)} rows={3} />
      </ConfirmDialog>
    </>
  );
}

export default function OrderDetailPage() {
  return (
    <AccountShell>
      <OrderDetail />
    </AccountShell>
  );
}
