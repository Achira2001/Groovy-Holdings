'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth, homeFor } from '@/context/AuthContext';
import AuthShell, { Divider } from '@/components/auth/AuthShell';
import RegisterForm from '@/components/auth/RegisterForm';
import GoogleButton from '@/components/ui/GoogleButton';

export default function RegisterPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  useEffect(() => {
    if (!loading && user) router.replace(homeFor(user));
  }, [loading, user, router]);

  return (
    <AuthShell
      title="Create your account"
      subtitle="Order custom prints, share your designs and talk to our team in one place."
      footer={
        <>
          Already have an account? <Link href="/login" className="link">Sign in</Link>
        </>
      }
    >
      <GoogleButton text="signup_with" />
      {process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID && <Divider>or register with email</Divider>}
      <RegisterForm />
    </AuthShell>
  );
}
