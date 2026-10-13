'use client';

import { Suspense, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { CheckCircle2, XCircle } from 'lucide-react';
import api, { getErrorMessage } from '@/lib/api';
import { useAuth, homeFor } from '@/context/AuthContext';
import { PageLoader, Spinner } from '@/components/ui';

function Verify() {
  const params = useSearchParams();
  const router = useRouter();
  const { setUser } = useAuth();
  const token = params.get('token');
  const [state, setState] = useState({ status: 'loading' });
  const ran = useRef(false);

  useEffect(() => {
    if (ran.current) return;
    ran.current = true;
    if (!token) return setState({ status: 'error', message: 'This link is missing its token.' });
    api
      .post('/auth/verify-email', { token })
      .then(({ data }) => {
        setUser(data.user);
        setState({ status: 'ok', user: data.user });
        setTimeout(() => router.replace(homeFor(data.user)), 1800);
      })
      .catch((err) => setState({ status: 'error', message: getErrorMessage(err) }));
  }, [token, router, setUser]);

  return (
    <div className="container grid min-h-[60vh] place-items-center py-16">
      <div className="w-full max-w-md rounded-2xl border border-line bg-surface p-8 text-center">
        {state.status === 'loading' && (
          <>
            <Spinner className="mx-auto h-8 w-8" />
            <p className="mt-4 font-semibold">Confirming your email…</p>
          </>
        )}
        {state.status === 'ok' && (
          <>
            <CheckCircle2 className="mx-auto h-12 w-12 text-success" />
            <h1 className="mt-4 text-2xl font-extrabold">Email confirmed</h1>
            <p className="mt-2 text-muted">You are signed in. Taking you to your account…</p>
          </>
        )}
        {state.status === 'error' && (
          <>
            <XCircle className="mx-auto h-12 w-12 text-danger" />
            <h1 className="mt-4 text-2xl font-extrabold">Link not valid</h1>
            <p className="mt-2 text-muted">{state.message}</p>
            <p className="mt-2 text-sm text-muted">Sign in with your email and password to request a new link.</p>
            <Link href="/login" className="btn-primary mt-6">Go to sign in</Link>
          </>
        )}
      </div>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={<PageLoader />}>
      <Verify />
    </Suspense>
  );
}
