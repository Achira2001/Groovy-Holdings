'use client';

import { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { PageLoader } from '@/components/ui';

/** Client-side guard. The API enforces the same rules server-side. */
export default function RequireAuth({ role, children, allowMissingWhatsapp = false }) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  const wrongRole = user && role && user.role !== role;
  const needsWhatsapp = user && user.role === 'customer' && !user.whatsapp && !allowMissingWhatsapp;

  useEffect(() => {
    if (loading) return;
    if (!user) router.replace(`/login?next=${encodeURIComponent(pathname)}`);
    else if (wrongRole) router.replace(user.role === 'admin' ? '/admin' : '/account');
    else if (needsWhatsapp) router.replace('/complete-profile');
  }, [loading, user, wrongRole, needsWhatsapp, router, pathname]);

  if (loading || !user || wrongRole || needsWhatsapp) return <PageLoader />;
  return children;
}
