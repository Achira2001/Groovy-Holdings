'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { ArrowLeft, Building2, Mail, MapPin, MessageCircle, MessageSquare, Save } from 'lucide-react';
import api, { getErrorMessage } from '@/lib/api';
import { Avatar, Badge, Button, Input, PageLoader, StatusBadge, Toggle } from '@/components/ui';
import { formatDate, formatDateTime, formatLKR } from '@/lib/utils';

export default function UserDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const [data, setData] = useState(null);
  const [form, setForm] = useState(null);
  const [saving, setSaving] = useState(false);

  const load = useCallback(() => {
    api
      .get(`/admin/users/${id}`)
      .then(({ data: d }) => {
        setData(d);
        setForm({ name: d.user.name, whatsapp: d.user.whatsapp ? `+${d.user.whatsapp}` : '', companyName: d.user.companyName || '', isEmailVerified: d.user.isEmailVerified });
      })
      .catch((e) => toast.error(getErrorMessage(e)));
  }, [id]);
  useEffect(load, [load]);

  const save = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.patch(`/admin/users/${id}`, form);
      toast.success('User updated');
      load();
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const openChat = async () => {
    try {
      const { data: d } = await api.post(`/chat/start/${id}`);
      router.push(`/admin/chat?c=${d.conversation._id}`);
    } catch (e) {
      toast.error(getErrorMessage(e));
    }
  };

  if (!data || !form) return <PageLoader />;
  const { user, orders, meetings } = data;
  const addr = [user.address?.line1, user.address?.city, user.address?.district, user.address?.postalCode].filter(Boolean).join(', ');

  return (
    <>
      <Link href="/admin/users" className="mb-4 inline-flex items-center gap-1.5 text-sm font-semibold text-muted hover:text-ink">
        <ArrowLeft className="h-4 w-4" /> All users
      </Link>
      <div className="grid gap-6 xl:grid-cols-[340px_1fr]">
        <aside className="space-y-4">
          <div className="panel text-center">
            <Avatar user={user} size={96} className="mx-auto" />
            <h1 className="mt-3 text-xl font-bold">{user.name}</h1>
            <p className="text-sm text-muted">{user.email}</p>
            <div className="mt-3 flex flex-wrap justify-center gap-2">
              <Badge tone={user.role === 'admin' ? 'accent' : 'brand'}>{user.role}</Badge>
              <Badge>{user.authProvider}</Badge>
              {user.isBlocked && <Badge tone="danger">blocked</Badge>}
            </div>
            <div className="mt-5 grid gap-2">
              {user.whatsapp && (
                <a href={`https://wa.me/${user.whatsapp}?text=${encodeURIComponent(`Hi ${user.name}, this is Groovy Holdings.`)}`} target="_blank" rel="noreferrer" className="btn bg-[#1FAF5A] text-white hover:bg-[#199a4e]">
                  <MessageCircle className="h-4 w-4" /> WhatsApp +{user.whatsapp}
                </a>
              )}
              {user.role === 'customer' && (
                <button type="button" className="btn-outline" onClick={openChat}>
                  <MessageSquare className="h-4 w-4" /> Open chat
                </button>
              )}
              <a href={`mailto:${user.email}`} className="btn-ghost"><Mail className="h-4 w-4" /> Email</a>
            </div>
          </div>
          <div className="panel space-y-2 text-sm">
            {user.companyName && <p className="flex gap-2"><Building2 className="h-4 w-4 text-muted" /> {user.companyName}</p>}
            {addr && <p className="flex gap-2"><MapPin className="h-4 w-4 shrink-0 text-muted" /> {addr}</p>}
            {user.bio && <p className="text-muted">{user.bio}</p>}
            <p className="text-xs text-muted">Joined {formatDate(user.createdAt)} · Last sign-in {user.lastLoginAt ? formatDateTime(user.lastLoginAt) : 'never'}</p>
          </div>
        </aside>

        <div className="space-y-6">
          <form onSubmit={save} className="panel">
            <h2 className="mb-4 text-lg font-bold">Edit details</h2>
            <div className="grid gap-4 sm:grid-cols-3">
              <Input label="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
              <Input label="WhatsApp" value={form.whatsapp} onChange={(e) => setForm({ ...form, whatsapp: e.target.value })} />
              <Input label="Company" value={form.companyName} onChange={(e) => setForm({ ...form, companyName: e.target.value })} />
            </div>
            <div className="mt-4 max-w-sm">
              <Toggle checked={form.isEmailVerified} onChange={(v) => setForm({ ...form, isEmailVerified: v })} label="Email verified" description="Unverified email accounts cannot sign in" />
            </div>
            <div className="mt-5 flex justify-end">
              <Button type="submit" loading={saving}><Save className="h-4 w-4" /> Save</Button>
            </div>
          </form>

          <section className="panel">
            <h2 className="mb-4 text-lg font-bold">Orders ({orders.length})</h2>
            {orders.length ? (
              <ul className="divide-y divide-line">
                {orders.map((o) => (
                  <li key={o._id}>
                    <Link href={`/admin/orders/${o._id}`} className="flex items-center gap-3 py-3 hover:opacity-90">
                      <span className="font-mono text-xs font-bold text-muted">{o.orderNumber}</span>
                      <span className="flex-1 truncate font-semibold">{o.productSnapshot?.name}</span>
                      <span className="text-sm tabular-nums text-muted">{o.totalQuantity} pcs · {formatLKR(o.totalAmount || o.estimatedAmount)}</span>
                      <StatusBadge status={o.status} />
                    </Link>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted">No orders yet.</p>
            )}
          </section>

          <section className="panel">
            <h2 className="mb-4 text-lg font-bold">Meetings ({meetings.length})</h2>
            {meetings.length ? (
              <ul className="divide-y divide-line text-sm">
                {meetings.map((m) => (
                  <li key={m._id} className="flex items-center gap-3 py-3">
                    <span className="flex-1">
                      <span className="block font-semibold">{m.topic}</span>
                      <span className="text-muted">{formatDateTime(m.start)}</span>
                    </span>
                    <Badge tone={m.status === 'booked' ? 'brand' : m.status === 'completed' ? 'success' : 'danger'}>{m.status}</Badge>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted">No meetings.</p>
            )}
          </section>
        </div>
      </div>
    </>
  );
}
