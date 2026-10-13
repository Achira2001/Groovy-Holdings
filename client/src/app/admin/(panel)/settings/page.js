'use client';

import { Suspense, useCallback, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import toast from 'react-hot-toast';
import { CalendarCheck2, CalendarX2, KeyRound, Mail, MessageCircle, ShieldCheck } from 'lucide-react';
import api, { getErrorMessage } from '@/lib/api';
import { Badge, Button, ConfirmDialog, PageHeader, Skeleton } from '@/components/ui';
import { formatDateTime, WHATSAPP_DISPLAY } from '@/lib/utils';

function Settings() {
  const params = useSearchParams();
  const router = useRouter();
  const [status, setStatus] = useState(null);
  const [busy, setBusy] = useState(false);
  const [confirm, setConfirm] = useState(false);

  const load = useCallback(() => {
    api.get('/google/calendar/status').then(({ data }) => setStatus(data)).catch((e) => toast.error(getErrorMessage(e)));
  }, []);
  useEffect(load, [load]);

  useEffect(() => {
    const r = params.get('calendar');
    if (r === 'connected') toast.success('Google Calendar connected. New bookings will get Meet links');
    if (r === 'error') toast.error('Google Calendar connection failed. Please try again');
    if (r) router.replace('/admin/settings');
  }, [params, router]);

  const connect = async () => {
    setBusy(true);
    try {
      const { data } = await api.get('/google/calendar/auth-url');
      window.location.href = data.url;
    } catch (e) {
      toast.error(getErrorMessage(e));
      setBusy(false);
    }
  };

  const disconnect = async () => {
    setBusy(true);
    try {
      const { data } = await api.delete('/google/calendar');
      toast.success(data.message);
      setConfirm(false);
      load();
    } catch (e) {
      toast.error(getErrorMessage(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <PageHeader title="Settings" text="Integrations and how the website is configured." />
      <div className="grid gap-6 xl:grid-cols-2">
        <section className="panel">
          <div className="flex items-start gap-4">
            <span className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-brand-soft text-brand">
              {status?.connected ? <CalendarCheck2 className="h-6 w-6" /> : <CalendarX2 className="h-6 w-6" />}
            </span>
            <div className="flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-lg font-bold">Google Calendar & Meet</h2>
                {status && <Badge tone={status.connected ? 'success' : 'warning'}>{status.connected ? 'Connected' : 'Not connected'}</Badge>}
              </div>
              <p className="mt-1 text-sm text-muted">
                When a customer books a slot we create an event in this Google account&apos;s calendar with a Google Meet link and invite the customer and all admins.
                Google Calendar then sends its own reminders to everyone.
              </p>
              {!status ? (
                <Skeleton className="mt-4 h-10 w-48" />
              ) : (
                <div className="mt-4 space-y-3">
                  {status.connected && (
                    <p className="text-sm">
                      {status.email ? <>Calendar account: <strong>{status.email}</strong></> : 'Using the refresh token from the server .env file'}
                      {status.connectedAt && <span className="text-muted"> · since {formatDateTime(status.connectedAt)}</span>}
                    </p>
                  )}
                  {!status.oauthConfigured && (
                    <p className="rounded-xl bg-warning/10 px-3 py-2 text-sm text-warning">Add GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET to the server .env file first.</p>
                  )}
                  <div className="flex flex-wrap gap-2">
                    <Button onClick={connect} loading={busy} disabled={!status.oauthConfigured}>
                      {status.connected ? 'Reconnect another account' : 'Connect Google Calendar'}
                    </Button>
                    {status.source === 'dashboard' && (
                      <Button variant="outline" onClick={() => setConfirm(true)}>Disconnect</Button>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </section>

        <section className="panel space-y-4 text-sm">
          <h2 className="text-lg font-bold">How things are set up</h2>
          {[
            [KeyRound, 'Admin code', 'New admin accounts need the admin code. Change ADMIN_CODE in server/.env and restart the server.'],
            [Mail, 'Email notifications', 'Verification, password reset, order updates, meeting invites and every chat message are sent with Nodemailer (SMTP_* in server/.env). Set CHAT_EMAIL_NOTIFICATIONS=false to stop chat emails.'],
            [MessageCircle, 'WhatsApp', `Design requests and quick questions go to ${WHATSAPP_DISPLAY}. Change NEXT_PUBLIC_WHATSAPP (client) and BUSINESS_WHATSAPP (server).`],
            [ShieldCheck, 'Security', 'Sign-in uses an httpOnly JWT cookie. Changing a password or blocking a user signs them out everywhere.'],
          ].map(([Icon, title, text]) => (
            <div key={title} className="flex gap-3">
              <Icon className="mt-0.5 h-5 w-5 shrink-0 text-accent" />
              <p><strong>{title}.</strong> <span className="text-muted">{text}</span></p>
            </div>
          ))}
        </section>
      </div>
      <ConfirmDialog open={confirm} onClose={() => setConfirm(false)} onConfirm={disconnect} loading={busy} danger title="Disconnect Google Calendar?" text="New bookings will no longer get Meet links until you connect again." confirmLabel="Disconnect" />
    </>
  );
}

export default function SettingsPage() {
  return (
    <Suspense>
      <Settings />
    </Suspense>
  );
}
