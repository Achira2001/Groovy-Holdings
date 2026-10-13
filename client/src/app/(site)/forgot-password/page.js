'use client';

import { useState } from 'react';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { MailCheck } from 'lucide-react';
import api, { getErrorMessage } from '@/lib/api';
import AuthShell from '@/components/auth/AuthShell';
import { Button, Input } from '@/components/ui';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post('/auth/forgot-password', { email });
      setSent(true);
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell
      title="Forgot your password?"
      subtitle="Enter your account email and we'll send you a link to choose a new password."
      footer={<>Remembered it? <Link href="/login" className="link">Sign in</Link></>}
    >
      {sent ? (
        <div className="rounded-2xl border border-line bg-surface p-7 text-center">
          <MailCheck className="mx-auto h-10 w-10 text-brand" />
          <h2 className="mt-4 text-xl font-bold">Check your email</h2>
          <p className="mt-2 text-sm text-muted">
            If an account exists for <b className="text-ink">{email}</b>, a reset link is on its way. It expires in 1 hour.
          </p>
          <Button variant="outline" className="mt-6" onClick={() => setSent(false)}>Use a different email</Button>
        </div>
      ) : (
        <form onSubmit={submit} className="space-y-4">
          <Input label="Email" type="email" name="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          <Button type="submit" className="w-full" size="lg" loading={loading}>Send reset link</Button>
          <p className="text-xs text-muted">Signed up with Google? You can use this to set a password too.</p>
        </form>
      )}
    </AuthShell>
  );
}
