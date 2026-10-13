'use client';

import Link from 'next/link';
import Navbar from '@/components/layout/Navbar';
import AuthShell from '@/components/auth/AuthShell';
import RegisterForm from '@/components/auth/RegisterForm';

export default function AdminRegisterPage() {
  return (
    <>
      <Navbar />
      <AuthShell
        side="admin"
        title="Create an admin account"
        subtitle="Admin accounts need the admin code. You'll confirm your email before signing in."
        footer={<>Already an admin? <Link href="/login" className="link">Sign in</Link></>}
      >
        <RegisterForm admin />
      </AuthShell>
    </>
  );
}
