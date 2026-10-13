'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { ArrowLeft, CalendarClock, Mail, MapPin, MessageCircle, MessageSquare, Save, Trash2 } from 'lucide-react';
import api, { getErrorMessage } from '@/lib/api';
import { Avatar, Button, ConfirmDialog, Input, PageLoader, Select, StatusBadge, Textarea, Toggle } from '@/components/ui';
import { FileGrid } from '@/components/shared/Attachments';
import { OrderHistory, OrderItems, OrderMoney, OrderProgress } from '@/components/orders/OrderParts';
import { formatDate, formatDateTime, formatLKR, ORDER_STATUS } from '@/lib/utils';

const toDateInput = (d) => (d ? new Date(d).toISOString().slice(0, 10) : '');

export default function AdminOrderPage() {
  const { id } = useParams();
  const router = useRouter();
  const [order, setOrder] = useState(null);
  const [form, setForm] = useState(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [busy, setBusy] = useState(false);

  const hydrate = (o) => {
    setOrder(o);
    setForm({
      status: o.status,
      note: '',
      totalAmount: o.totalAmount || '',
      amountPaid: o.amountPaid || '',
      expectedDelivery: toDateInput(o.expectedDelivery),
      adminNotes: o.adminNotes || '',
      notifyCustomer: true,
    });
  };

  const load = useCallback(() => {
    api.get(`/orders/${id}`).then(({ data }) => hydrate(data.order)).catch((e) => toast.error(getErrorMessage(e)));
  }, [id]);
  useEffect(load, [load]);

  const save = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const { data } = await api.patch(`/orders/${id}`, {
        ...form,
        totalAmount: form.totalAmount === '' ? 0 : form.totalAmount,
        amountPaid: form.amountPaid === '' ? 0 : form.amountPaid,
        expectedDelivery: form.expectedDelivery || null,
      });
      toast.success(form.status !== order.status && form.notifyCustomer ? 'Order updated — customer notified by email' : 'Order updated');
      hydrate({ ...data.order, customer: order.customer });
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const openChat = async () => {
    try {
      const { data } = await api.post(`/chat/start/${order.customer._id}`);
      router.push(`/admin/chat?c=${data.conversation._id}`);
    } catch (e) {
      toast.error(getErrorMessage(e));
    }
  };

  const remove = async () => {
    setBusy(true);
    try {
      await api.delete(`/orders/${id}`);
      toast.success('Order deleted');
      router.replace('/admin/orders');
    } catch (e) {
      toast.error(getErrorMessage(e));
      setBusy(false);
    }
  };

  if (!order || !form) return <PageLoader />;
  const c = order.customer;
  const waText = encodeURIComponent(`Hi ${c?.name || ''}, this is Groovy Holdings about your order ${order.orderNumber}.`);

  return (
    <>
      <Link href="/admin/orders" className="mb-4 inline-flex items-center gap-1.5 text-sm font-semibold text-muted hover:text-ink">
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
            <h1 className="mt-1 text-2xl font-extrabold">{order.productSnapshot?.name}</h1>
            <p className="text-sm text-muted">
              {order.productSnapshot?.category} · {formatLKR(order.productSnapshot?.price)} list price · placed {formatDateTime(order.createdAt)}
            </p>
          </div>
        </div>
        <button type="button" className="btn-ghost text-danger" onClick={() => setDeleting(true)}>
          <Trash2 className="h-4 w-4" /> Delete
        </button>
      </div>

      <div className="panel mb-6"><OrderProgress status={order.status} /></div>

      <div className="grid gap-6 xl:grid-cols-[1.4fr_1fr]">
        <div className="space-y-6">
          <section className="panel">
            <h2 className="mb-4 text-lg font-bold">Design files ({order.designFiles.length})</h2>
            <FileGrid files={order.designFiles} />
          </section>
          <section className="panel">
            <h2 className="mb-4 text-lg font-bold">Sizes & quantities</h2>
            <OrderItems order={order} />
          </section>
          <section className="panel">
            <h2 className="mb-2 text-lg font-bold">Customer message</h2>
            <p className="whitespace-pre-wrap text-sm leading-relaxed text-muted">{order.message || 'No message.'}</p>
            <div className="mt-4 grid gap-2 text-sm sm:grid-cols-2">
              <p className="flex gap-2"><MapPin className="mt-0.5 h-4 w-4 shrink-0 text-muted" /> {order.deliveryAddress || 'No address given'}</p>
              <p className="flex gap-2"><CalendarClock className="mt-0.5 h-4 w-4 shrink-0 text-muted" /> Needed by {order.neededBy ? formatDate(order.neededBy) : '—'}</p>
            </div>
          </section>
          <section className="panel">
            <h2 className="mb-4 text-lg font-bold">History</h2>
            <OrderHistory history={order.statusHistory} />
          </section>
        </div>

        <div className="space-y-6">
          <section className="panel">
            <h2 className="mb-4 text-lg font-bold">Customer</h2>
            {c ? (
              <>
                <Link href={`/admin/users/${c._id}`} className="flex items-center gap-3">
                  <Avatar user={c} size={44} />
                  <span className="min-w-0">
                    <span className="block truncate font-semibold hover:text-brand">{c.name}</span>
                    <span className="block truncate text-sm text-muted">{c.email}</span>
                    {c.companyName && <span className="block truncate text-xs text-muted">{c.companyName}</span>}
                  </span>
                </Link>
                <div className="mt-4 grid grid-cols-3 gap-2">
                  {order.contactWhatsapp && (
                    <a href={`https://wa.me/${order.contactWhatsapp}?text=${waText}`} target="_blank" rel="noreferrer" className="btn btn-sm bg-[#1FAF5A] text-white hover:bg-[#199a4e]">
                      <MessageCircle className="h-4 w-4" /> WhatsApp
                    </a>
                  )}
                  <button type="button" className="btn-outline btn-sm" onClick={openChat}><MessageSquare className="h-4 w-4" /> Chat</button>
                  <a href={`mailto:${c.email}?subject=${encodeURIComponent(`Your order ${order.orderNumber}`)}`} className="btn-outline btn-sm"><Mail className="h-4 w-4" /> Email</a>
                </div>
                {order.contactWhatsapp && <p className="mt-2 text-xs text-muted">WhatsApp: +{order.contactWhatsapp}</p>}
              </>
            ) : (
              <p className="text-sm text-muted">This customer account was deleted.</p>
            )}
          </section>

          <form onSubmit={save} className="panel space-y-4">
            <h2 className="text-lg font-bold">Update order</h2>
            <Select label="Status" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
              {Object.entries(ORDER_STATUS).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
            </Select>
            {form.status !== order.status && (
              <>
                <Textarea label="Note for the customer (optional)" value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} rows={2} placeholder="e.g. Printing starts tomorrow, ready in 5 days" />
                <Toggle checked={form.notifyCustomer} onChange={(v) => setForm({ ...form, notifyCustomer: v })} label="Email the customer" description="Also shows a live notification in their account" />
              </>
            )}
            <div className="grid gap-3 sm:grid-cols-2">
              <Input label="Final price (LKR)" type="number" min="0" value={form.totalAmount} onChange={(e) => setForm({ ...form, totalAmount: e.target.value })} hint={`Estimate ${formatLKR(order.estimatedAmount)}`} />
              <Input label="Amount paid (LKR)" type="number" min="0" value={form.amountPaid} onChange={(e) => setForm({ ...form, amountPaid: e.target.value })} />
            </div>
            <Input label="Expected ready date" type="date" value={form.expectedDelivery} onChange={(e) => setForm({ ...form, expectedDelivery: e.target.value })} />
            <Textarea label="Internal notes (admins only)" value={form.adminNotes} onChange={(e) => setForm({ ...form, adminNotes: e.target.value })} rows={3} />
            <Button type="submit" className="w-full" loading={saving}><Save className="h-4 w-4" /> Save</Button>
          </form>

          <section className="panel">
            <h2 className="mb-2 text-lg font-bold">Money</h2>
            <OrderMoney order={order} />
          </section>
        </div>
      </div>

      <ConfirmDialog open={deleting} onClose={() => setDeleting(false)} onConfirm={remove} loading={busy} danger title={`Delete ${order.orderNumber}?`} text="The order and its design files are permanently removed. Consider marking it cancelled instead." confirmLabel="Delete order" />
    </>
  );
}
