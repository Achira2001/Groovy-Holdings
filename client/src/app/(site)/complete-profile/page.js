'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import api, { getErrorMessage } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import RequireAuth from '@/components/layout/RequireAuth';
import AuthShell from '@/components/auth/AuthShell';
import { Avatar, Button, Input } from '@/components/ui';

function CompleteForm() {
  const { user, setUser } = useAuth();
  const router = useRouter();
  const [whatsapp, setWhatsapp] = useState(user?.whatsapp || '');
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data } = await api.patch('/profile', { whatsapp });
      setUser(data.user);
      toast.success('All set!');
      router.replace('/account');
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell title="One last step" subtitle="Add your WhatsApp number so our team can reach you about orders and designs.">
      <div className="mb-6 flex items-center gap-3 rounded-xl border border-line bg-surface p-3">
        <Avatar user={user} size={44} />
        <div className="min-w-0">
          <p className="truncate font-semibold">{user?.name}</p>
          <p className="truncate text-sm text-muted">{user?.email}</p>
        </div>
      </div>
      <form onSubmit={submit} className="space-y-4">
        <Input label="WhatsApp number" type="tel" placeholder="077 123 4567" value={whatsapp} onChange={(e) => setWhatsapp(e.target.value)} required autoFocus />
        <Button type="submit" className="w-full" size="lg" loading={loading}>Save and continue</Button>
      </form>
    </AuthShell>
  );
}

export default function CompleteProfilePage() {
  return (
    <RequireAuth allowMissingWhatsapp>
      <CompleteForm />
    </RequireAuth>
  );
}
