'use client';

import { Suspense, useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import toast from 'react-hot-toast';
import { Ban, CheckCircle2, MessageSquare, MoreHorizontal, Search, ShieldCheck, Trash2, UserCheck, Users } from 'lucide-react';
import api, { getErrorMessage } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { Avatar, Badge, ConfirmDialog, EmptyState, PageHeader, Pagination, Select, Skeleton } from '@/components/ui';
import { cn, formatDate, formatLKR, timeAgo } from '@/lib/utils';

function RowMenu({ u, me, onAction }) {
  const [open, setOpen] = useState(false);
  const self = u._id === me._id;
  const item = 'flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm hover:bg-surface-2 disabled:opacity-40';
  return (
    <div className="relative" onMouseLeave={() => setOpen(false)}>
      <button type="button" className="btn-icon" onClick={() => setOpen((o) => !o)} aria-label="Actions">
        <MoreHorizontal className="h-4 w-4" />
      </button>
      {open && (
        <div className="absolute right-0 z-20 mt-1 w-52 rounded-xl border border-line bg-surface p-1.5 shadow-pop">
          <Link href={`/admin/users/${u._id}`} className={item}><UserCheck className="h-4 w-4" /> View details</Link>
          {u.role === 'customer' && (
            <button type="button" className={item} onClick={() => onAction('chat', u)}><MessageSquare className="h-4 w-4" /> Open chat</button>
          )}
          {!u.isEmailVerified && (
            <button type="button" className={item} onClick={() => onAction('verify', u)}><CheckCircle2 className="h-4 w-4" /> Mark email verified</button>
          )}
          <button type="button" className={item} disabled={self} onClick={() => onAction('role', u)}>
            <ShieldCheck className="h-4 w-4" /> {u.role === 'admin' ? 'Make customer' : 'Make admin'}
          </button>
          <button type="button" className={item} disabled={self} onClick={() => onAction('block', u)}>
            <Ban className="h-4 w-4" /> {u.isBlocked ? 'Unblock' : 'Block'}
          </button>
          <button type="button" className={cn(item, 'text-danger')} disabled={self} onClick={() => onAction('delete', u)}>
            <Trash2 className="h-4 w-4" /> Delete
          </button>
        </div>
      )}
    </div>
  );
}

function UsersPage() {
  const { user: me } = useAuth();
  const router = useRouter();
  const params = useSearchParams();
  const [q, setQ] = useState('');
  const [search, setSearch] = useState('');
  const [role, setRole] = useState(params.get('role') || 'all');
  const [status, setStatus] = useState('all');
  const [page, setPage] = useState(1);
  const [data, setData] = useState(null);
  const [confirm, setConfirm] = useState(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => {
      setSearch(q);
      setPage(1);
    }, 350);
    return () => clearTimeout(t);
  }, [q]);

  const load = useCallback(() => {
    api
      .get('/admin/users', { params: { search, role: role === 'all' ? undefined : role, status: status === 'all' ? undefined : status, page } })
      .then(({ data: d }) => setData(d))
      .catch((e) => toast.error(getErrorMessage(e)));
  }, [search, role, status, page]);

  useEffect(load, [load]);

  const update = async (u, body, msg) => {
    try {
      await api.patch(`/admin/users/${u._id}`, body);
      toast.success(msg);
      load();
    } catch (e) {
      toast.error(getErrorMessage(e));
    }
  };

  const onAction = async (action, u) => {
    if (action === 'chat') {
      try {
        const { data: d } = await api.post(`/chat/start/${u._id}`);
        router.push(`/admin/chat?c=${d.conversation._id}`);
      } catch (e) {
        toast.error(getErrorMessage(e));
      }
    }
    if (action === 'verify') update(u, { isEmailVerified: true }, 'Email marked as verified');
    if (action === 'block') setConfirm({ action, u });
    if (action === 'role') setConfirm({ action, u });
    if (action === 'delete') setConfirm({ action, u });
  };

  const runConfirm = async () => {
    const { action, u } = confirm;
    setBusy(true);
    try {
      if (action === 'delete') {
        await api.delete(`/admin/users/${u._id}`);
        toast.success('User deleted');
      } else if (action === 'block') {
        await api.patch(`/admin/users/${u._id}`, { isBlocked: !u.isBlocked });
        toast.success(u.isBlocked ? 'User unblocked' : 'User blocked and signed out');
      } else if (action === 'role') {
        await api.patch(`/admin/users/${u._id}`, { role: u.role === 'admin' ? 'customer' : 'admin' });
        toast.success('Role updated');
      }
      setConfirm(null);
      load();
    } catch (e) {
      toast.error(getErrorMessage(e));
    } finally {
      setBusy(false);
    }
  };

  const confirmText = confirm && {
    delete: [`Delete ${confirm.u.name}?`, 'Their chat history is removed and future meetings are freed. Orders stay for your records.', 'Delete user'],
    block: [confirm.u.isBlocked ? `Unblock ${confirm.u.name}?` : `Block ${confirm.u.name}?`, confirm.u.isBlocked ? 'They will be able to sign in again.' : 'They are signed out everywhere and cannot sign in.', confirm.u.isBlocked ? 'Unblock' : 'Block'],
    role: [confirm.u.role === 'admin' ? `Remove admin access from ${confirm.u.name}?` : `Give ${confirm.u.name} admin access?`, 'Their current sessions will be signed out.', 'Change role'],
  }[confirm.action];

  return (
    <>
      <PageHeader title="Users" text={data ? `${data.total} account(s)` : 'Customers and admins'} />
      <div className="panel mb-4 grid gap-3 p-4 sm:grid-cols-[1fr_180px_180px]">
        <label className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
          <input className="input pl-9" placeholder="Search name, email, WhatsApp, company" value={q} onChange={(e) => setQ(e.target.value)} />
        </label>
        <Select value={role} onChange={(e) => { setRole(e.target.value); setPage(1); }} aria-label="Role">
          <option value="all">All roles</option>
          <option value="customer">Customers</option>
          <option value="admin">Admins</option>
        </Select>
        <Select value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }} aria-label="Status">
          <option value="all">Any status</option>
          <option value="active">Active</option>
          <option value="blocked">Blocked</option>
          <option value="unverified">Email not verified</option>
        </Select>
      </div>

      {!data ? (
        <Skeleton className="h-96" />
      ) : data.users.length ? (
        <div className="card overflow-x-auto">
          <table className="w-full min-w-[900px] text-sm">
            <thead className="bg-surface-2 text-left text-xs uppercase tracking-wider text-muted">
              <tr>
                <th className="px-4 py-3 font-semibold">User</th>
                <th className="px-4 py-3 font-semibold">WhatsApp</th>
                <th className="px-4 py-3 font-semibold">Sign-in</th>
                <th className="px-4 py-3 font-semibold">Status</th>
                <th className="px-4 py-3 font-semibold">Orders</th>
                <th className="px-4 py-3 font-semibold">Joined</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {data.users.map((u) => (
                <tr key={u._id} className="border-t border-line align-middle">
                  <td className="px-4 py-3">
                    <Link href={`/admin/users/${u._id}`} className="flex items-center gap-3">
                      <Avatar user={u} size={36} />
                      <span className="min-w-0">
                        <span className="flex items-center gap-1.5 font-semibold">
                          <span className="truncate">{u.name}</span>
                          {u.role === 'admin' && <Badge tone="accent">admin</Badge>}
                        </span>
                        <span className="block truncate text-xs text-muted">{u.email}</span>
                      </span>
                    </Link>
                  </td>
                  <td className="px-4 py-3">
                    {u.whatsapp ? (
                      <a href={`https://wa.me/${u.whatsapp}`} target="_blank" rel="noreferrer" className="font-medium text-[#1FAF5A] hover:underline">+{u.whatsapp}</a>
                    ) : (
                      <span className="text-muted">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <Badge tone={u.authProvider === 'google' ? 'neutral' : 'brand'}>{u.authProvider}</Badge>
                    <p className="mt-1 text-xs text-muted">{u.lastLoginAt ? `Seen ${timeAgo(u.lastLoginAt)}` : 'Never signed in'}</p>
                  </td>
                  <td className="px-4 py-3">
                    {u.isBlocked ? <Badge tone="danger">Blocked</Badge> : u.isEmailVerified ? <Badge tone="success">Active</Badge> : <Badge tone="warning">Unverified</Badge>}
                  </td>
                  <td className="px-4 py-3 tabular-nums">
                    {u.orderCount}
                    {u.totalSpent > 0 && <p className="text-xs text-muted">{formatLKR(u.totalSpent)}</p>}
                  </td>
                  <td className="px-4 py-3 text-muted">{formatDate(u.createdAt)}</td>
                  <td className="px-4 py-3 text-right">
                    <RowMenu u={u} me={me} onAction={onAction} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="px-4 pb-4">
            <Pagination page={data.page} pages={data.pages} onChange={setPage} />
          </div>
        </div>
      ) : (
        <EmptyState icon={Users} title="No users found" text="Try a different search or filter." />
      )}

      <ConfirmDialog
        open={Boolean(confirm)}
        onClose={() => setConfirm(null)}
        onConfirm={runConfirm}
        loading={busy}
        danger={confirm?.action !== 'role'}
        title={confirmText?.[0]}
        text={confirmText?.[1]}
        confirmLabel={confirmText?.[2]}
      />
    </>
  );
}

export default function Page() {
  return (
    <Suspense>
      <UsersPage />
    </Suspense>
  );
}
