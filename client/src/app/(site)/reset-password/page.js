'use client';

import { Suspense, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import toast from 'react-hot-toast';
import api, { getErrorMessage } from '@/lib/api';
import AuthShell from '@/components/auth/AuthShell';
import { Button, PageLoader, PasswordInput, PasswordStrength } from '@/components/ui';

function ResetForm() {
  const params = useSearchParams();
  const router = useRouter();
  const token = params.get('token');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    if (password !== confirm) return toast.error('Passwords do not match');
    setLoading(true);
    try {
      const { data } = await api.post('/auth/reset-password', { token, password });
      toast.success(data.message);
      router.replace('/login');
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  if (!token) {
    return (
      <AuthShell title="Link not valid" subtitle="This reset link is missing its token.">
        <Link href="/forgot-password" className="btn-primary w-full">Request a new link</Link>
      </AuthShell>
    );
  }

  return (
    <AuthShell title="Choose a new password" subtitle="After saving, you'll be signed out of other devices.">
      <form onSubmit={submit} className="space-y-4">
        <div>
          <PasswordInput label="New password" name="password" autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={8} />
          <PasswordStrength value={password} />
        </div>
        <PasswordInput label="Confirm new password" name="confirm" autoComplete="new-password" value={confirm} onChange={(e) => setConfirm(e.target.value)} required />
        <Button type="submit" className="w-full" size="lg" loading={loading}>Save new password</Button>
      </form>
    </AuthShell>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<PageLoader />}>
      <ResetForm />
    </Suspense>
  );
}
