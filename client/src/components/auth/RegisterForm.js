'use client';

import { useState } from 'react';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { MailCheck } from 'lucide-react';
import api, { getErrorMessage } from '@/lib/api';
import { Button, Input, PasswordInput, PasswordStrength } from '@/components/ui';

/** Shared registration form for customers and admins (admins also send adminCode). */
export default function RegisterForm({ admin = false }) {
  const [form, setForm] = useState({ name: '', email: '', whatsapp: '', password: '', confirm: '', adminCode: '' });
  const [loading, setLoading] = useState(false);
  const [sentTo, setSentTo] = useState('');
  const [resending, setResending] = useState(false);
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    if (form.password !== form.confirm) return toast.error('Passwords do not match');
    setLoading(true);
    try {
      const { confirm, ...body } = form;
      if (!admin) delete body.adminCode;
      const { data } = await api.post(admin ? '/auth/register-admin' : '/auth/register', body);
      toast.success(data.message);
      setSentTo(form.email);
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const resend = async () => {
    setResending(true);
    try {
      const { data } = await api.post('/auth/resend-verification', { email: sentTo });
      toast.success(data.message);
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setResending(false);
    }
  };

  if (sentTo) {
    return (
      <div className="rounded-2xl border border-line bg-surface p-7 text-center">
        <span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-brand-soft text-brand">
          <MailCheck className="h-7 w-7" />
        </span>
        <h2 className="mt-4 text-xl font-bold">Check your inbox</h2>
        <p className="mt-2 text-sm text-muted">
          We sent a confirmation link to <b className="text-ink">{sentTo}</b>. Click it to activate your account. The link expires in 24 hours.
        </p>
        <div className="mt-6 flex flex-col gap-2">
          <Button variant="outline" loading={resending} onClick={resend}>Send the link again</Button>
          <Link href="/login" className="btn-ghost">Go to sign in</Link>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <Input label="Full name" name="name" autoComplete="name" value={form.name} onChange={set('name')} required />
      <Input label="Email" name="email" type="email" autoComplete="email" value={form.email} onChange={set('email')} required />
      <Input
        label="WhatsApp number"
        name="whatsapp"
        type="tel"
        autoComplete="tel"
        placeholder="077 123 4567"
        value={form.whatsapp}
        onChange={set('whatsapp')}
        required
        hint={admin ? 'Used for internal contact' : 'Our team uses this to contact you about orders'}
      />
      <div>
        <PasswordInput name="password" autoComplete="new-password" value={form.password} onChange={set('password')} required minLength={8} />
        <PasswordStrength value={form.password} />
        <p className="field-hint">At least 8 characters with letters and numbers</p>
      </div>
      <PasswordInput label="Confirm password" name="confirm" autoComplete="new-password" value={form.confirm} onChange={set('confirm')} required />
      {admin && (
        <Input label="Admin code" name="adminCode" type="password" value={form.adminCode} onChange={set('adminCode')} required hint="Ask the business owner for the current admin code" />
      )}
      <Button type="submit" className="w-full" size="lg" loading={loading}>
        {admin ? 'Create admin account' : 'Create account'}
      </Button>
    </form>
  );
}
