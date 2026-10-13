'use client';

import { useRef, useState } from 'react';
import toast from 'react-hot-toast';
import { Camera, KeyRound, ShieldCheck, Trash2, UserRound } from 'lucide-react';
import api, { getErrorMessage } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import RequireAuth from '@/components/layout/RequireAuth';
import AccountShell from '@/components/account/AccountShell';
import { Avatar, Badge, Button, Input, PasswordInput, PasswordStrength, Textarea } from '@/components/ui';
import { formatDate } from '@/lib/utils';

function ProfileContent() {
  const { user, setUser } = useAuth();
  const fileRef = useRef(null);
  const [form, setForm] = useState({
    name: user.name || '',
    whatsapp: user.whatsapp ? `+${user.whatsapp}` : '',
    companyName: user.companyName || '',
    bio: user.bio || '',
    line1: user.address?.line1 || '',
    city: user.address?.city || '',
    district: user.address?.district || '',
    postalCode: user.address?.postalCode || '',
  });
  const [saving, setSaving] = useState(false);
  const [photoBusy, setPhotoBusy] = useState(false);
  const [pw, setPw] = useState({ currentPassword: '', newPassword: '', confirm: '' });
  const [pwBusy, setPwBusy] = useState(false);

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const save = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const { data } = await api.patch('/profile', {
        name: form.name,
        whatsapp: form.whatsapp,
        companyName: form.companyName,
        bio: form.bio,
        address: { line1: form.line1, city: form.city, district: form.district, postalCode: form.postalCode },
      });
      setUser(data.user);
      toast.success(data.message);
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const photo = async (action, file) => {
    setPhotoBusy(true);
    try {
      let res;
      if (action === 'upload') {
        const fd = new FormData();
        fd.append('avatar', file);
        res = await api.post('/profile/avatar', fd);
      } else if (action === 'google') res = await api.post('/profile/avatar/google');
      else res = await api.delete('/profile/avatar');
      setUser(res.data.user);
      toast.success(res.data.message);
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setPhotoBusy(false);
    }
  };

  const changePassword = async (e) => {
    e.preventDefault();
    if (pw.newPassword !== pw.confirm) return toast.error('New passwords do not match');
    setPwBusy(true);
    try {
      const { data } = await api.patch('/profile/password', { currentPassword: pw.currentPassword, newPassword: pw.newPassword });
      setUser(data.user);
      setPw({ currentPassword: '', newPassword: '', confirm: '' });
      toast.success(user.hasPassword ? 'Password updated. Other devices were signed out' : 'Password set. You can now also sign in with email');
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setPwBusy(false);
    }
  };

  const usingGoogle = user.googleAvatar && user.avatar === user.googleAvatar;

  return (
    <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
      {/* Identity card */}
      <aside className="space-y-6">
        <div className="panel text-center">
          <div className="relative mx-auto w-fit">
            <Avatar user={user} size={112} className="ring-4 ring-surface-2" />
            <button type="button" onClick={() => fileRef.current?.click()} className="absolute bottom-0 right-0 grid h-9 w-9 place-items-center rounded-full bg-accent text-white shadow-lift" aria-label="Upload new photo" disabled={photoBusy}>
              <Camera className="h-4 w-4" />
            </button>
            <input ref={fileRef} type="file" accept="image/png,image/jpeg,image/webp,image/gif" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) photo('upload', f); e.target.value = ''; }} />
          </div>
          <h2 className="mt-4 text-xl font-bold">{user.name}</h2>
          <p className="text-sm text-muted">{user.email}</p>
          <div className="mt-3 flex flex-wrap justify-center gap-2">
            <Badge tone={user.role === 'admin' ? 'accent' : 'brand'}>{user.role}</Badge>
            <Badge tone={user.authProvider === 'google' ? 'neutral' : 'success'}>{user.authProvider === 'google' ? 'Google account' : 'Email account'}</Badge>
          </div>
          <div className="mt-5 grid gap-2">
            <Button variant="outline" size="sm" onClick={() => fileRef.current?.click()} loading={photoBusy}>
              <Camera className="h-4 w-4" /> Upload photo
            </Button>
            {user.googleAvatar && !usingGoogle && (
              <Button variant="outline" size="sm" onClick={() => photo('google')} disabled={photoBusy}>
                Use my Google photo
              </Button>
            )}
            {user.avatar && (
              <Button variant="ghost" size="sm" className="text-danger" onClick={() => photo('remove')} disabled={photoBusy}>
                <Trash2 className="h-4 w-4" /> Remove photo
              </Button>
            )}
          </div>
          <p className="mt-4 text-xs text-muted">Member since {formatDate(user.createdAt)}</p>
        </div>
      </aside>

      <div className="space-y-6">
        <form onSubmit={save} className="panel">
          <div className="mb-5 flex items-center gap-2">
            <UserRound className="h-5 w-5 text-brand" />
            <h2 className="text-lg font-bold">Personal details</h2>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Input label="Full name" value={form.name} onChange={set('name')} required />
            <Input label="Email" value={user.email} disabled hint="Email can't be changed" />
            <Input label="WhatsApp number" type="tel" value={form.whatsapp} onChange={set('whatsapp')} required={user.role === 'customer'} hint="Our team uses this to contact you about orders" />
            <Input label="Company / organisation" value={form.companyName} onChange={set('companyName')} placeholder="Optional" />
            <Textarea className="sm:col-span-2" label="About you" value={form.bio} onChange={set('bio')} rows={3} maxLength={500} placeholder="Optional – e.g. school, club or brand you order for" />
          </div>
          <h3 className="mb-3 mt-6 text-sm font-bold uppercase tracking-wider text-muted">Delivery address</h3>
          <div className="grid gap-4 sm:grid-cols-2">
            <Input className="sm:col-span-2" label="Address" value={form.line1} onChange={set('line1')} />
            <Input label="City" value={form.city} onChange={set('city')} />
            <Input label="District" value={form.district} onChange={set('district')} />
            <Input label="Postal code" value={form.postalCode} onChange={set('postalCode')} />
          </div>
          <div className="mt-6 flex justify-end">
            <Button type="submit" loading={saving}>Save changes</Button>
          </div>
        </form>

        <form onSubmit={changePassword} className="panel">
          <div className="mb-1 flex items-center gap-2">
            <KeyRound className="h-5 w-5 text-brand" />
            <h2 className="text-lg font-bold">{user.hasPassword ? 'Change password' : 'Set a password'}</h2>
          </div>
          <p className="mb-5 text-sm text-muted">
            {user.hasPassword
              ? 'Changing your password signs you out on all other devices.'
              : 'You signed up with Google. Set a password to also sign in with your email.'}
          </p>
          <div className="grid gap-4 sm:grid-cols-2">
            {user.hasPassword && (
              <PasswordInput className="sm:col-span-2" label="Current password" name="currentPassword" autoComplete="current-password" value={pw.currentPassword} onChange={(e) => setPw((p) => ({ ...p, currentPassword: e.target.value }))} required />
            )}
            <div>
              <PasswordInput label="New password" name="newPassword" autoComplete="new-password" value={pw.newPassword} onChange={(e) => setPw((p) => ({ ...p, newPassword: e.target.value }))} required minLength={8} />
              <PasswordStrength value={pw.newPassword} />
            </div>
            <PasswordInput label="Confirm new password" name="confirm" autoComplete="new-password" value={pw.confirm} onChange={(e) => setPw((p) => ({ ...p, confirm: e.target.value }))} required />
          </div>
          <div className="mt-6 flex items-center justify-between gap-3">
            <p className="flex items-center gap-1.5 text-xs text-muted"><ShieldCheck className="h-4 w-4 text-success" /> At least 8 characters with letters and numbers</p>
            <Button type="submit" variant="ink" loading={pwBusy}>{user.hasPassword ? 'Update password' : 'Set password'}</Button>
          </div>
        </form>
      </div>
    </div>
  );
}

function ProfilePage() {
  const { user } = useAuth();
  if (user?.role === 'admin') {
    return (
      <div className="container py-10">
        <h1 className="mb-6 text-3xl font-extrabold">Profile & security</h1>
        <ProfileContent />
      </div>
    );
  }
  return (
    <AccountShell>
      <ProfileContent />
    </AccountShell>
  );
}

export default function Page() {
  return (
    <RequireAuth>
      <ProfilePage />
    </RequireAuth>
  );
}
