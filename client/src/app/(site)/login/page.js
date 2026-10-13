'use client';

import { Suspense, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import toast from 'react-hot-toast';
import api, { getErrorMessage } from '@/lib/api';
import { useAuth, homeFor } from '@/context/AuthContext';
import AuthShell, { Divider } from '@/components/auth/AuthShell';
import GoogleButton from '@/components/ui/GoogleButton';
import { Button, Input, PageLoader, PasswordInput } from '@/components/ui';

function LoginForm() {
  const { login, user, loading: authLoading } = useAuth();
  const router = useRouter();
  const params = useSearchParams();
  const next = params.get('next');
  const [form, setForm] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [unverified, setUnverified] = useState(false);

  useEffect(() => {
    if (!authLoading && user) router.replace(homeFor(user, next));
  }, [authLoading, user, router, next]);

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setUnverified(false);
    try {
      const u = await login(form.email, form.password);
      toast.success(`Welcome back, ${u.name.split(' ')[0]}!`);
      router.replace(homeFor(u, next));
    } catch (err) {
      if (err?.response?.data?.code === 'EMAIL_NOT_VERIFIED') setUnverified(true);
      toast.error(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const resend = async () => {
    try {
      const { data } = await api.post('/auth/resend-verification', { email: form.email });
      toast.success(data.message);
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  };

  return (
    <AuthShell
      title="Sign in"
      subtitle="Welcome back. Sign in to track orders, chat with the team and manage meetings."
      footer={
        <>
          New to Groovy Holdings? <Link href="/register" className="link">Create an account</Link>
        </>
      }
    >
      <GoogleButton next={next} text="signin_with" />
      {process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID && <Divider>or sign in with email</Divider>}
      <form onSubmit={submit} className="space-y-4">
        <Input label="Email" name="email" type="email" autoComplete="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
        <div>
          <PasswordInput name="password" autoComplete="current-password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required />
          <div className="mt-2 text-right">
            <Link href="/forgot-password" className="text-sm font-semibold text-brand hover:underline">Forgot password?</Link>
          </div>
        </div>
        {unverified && (
          <div className="rounded-xl border border-warning/30 bg-warning/10 p-3 text-sm">
            Your email isn&apos;t confirmed yet.{' '}
            <button type="button" onClick={resend} className="font-semibold text-brand hover:underline">Send a new confirmation link</button>
          </div>
        )}
        <Button type="submit" className="w-full" size="lg" loading={loading}>Sign in</Button>
      </form>
      <p className="mt-6 text-center text-xs text-muted">
        Admins sign in here with email and password. Google sign-in is for customers.
      </p>
    </AuthShell>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<PageLoader />}>
      <LoginForm />
    </Suspense>
  );
}
