'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { CalendarDays, ExternalLink, Video } from 'lucide-react';
import api, { getErrorMessage } from '@/lib/api';
import AccountShell from '@/components/account/AccountShell';
import { Badge, ConfirmDialog, EmptyState, PageHeader, Skeleton, Textarea } from '@/components/ui';
import { formatDate, formatTime } from '@/lib/utils';

const TONE = { booked: 'brand', completed: 'success', cancelled: 'danger' };

function Meetings() {
  const [meetings, setMeetings] = useState(null);
  const [cancelling, setCancelling] = useState(null);
  const [reason, setReason] = useState('');
  const [busy, setBusy] = useState(false);

  const load = useCallback(() => {
    api.get('/meetings/mine').then(({ data }) => setMeetings(data.meetings)).catch(() => setMeetings([]));
  }, []);
  useEffect(load, [load]);

  const now = new Date();
  const upcoming = (meetings || []).filter((m) => m.status === 'booked' && new Date(m.end) > now).sort((a, b) => new Date(a.start) - new Date(b.start));
  const past = (meetings || []).filter((m) => !upcoming.includes(m));

  const cancel = async () => {
    setBusy(true);
    try {
      const { data } = await api.post(`/meetings/slots/${cancelling._id}/cancel`, { reason });
      toast.success(data.message);
      setCancelling(null);
      setReason('');
      load();
    } catch (e) {
      toast.error(getErrorMessage(e));
    } finally {
      setBusy(false);
    }
  };

  const Card = ({ m, actions }) => (
    <li className="card flex flex-col gap-4 p-5 sm:flex-row sm:items-center">
      <div className="flex h-16 w-16 shrink-0 flex-col items-center justify-center rounded-xl bg-brand-soft text-brand">
        <span className="text-[11px] font-bold uppercase">{formatDate(m.start, { day: undefined, year: undefined, month: 'short' })}</span>
        <span className="font-display text-2xl font-extrabold leading-none">{formatDate(m.start, { month: undefined, year: undefined, day: 'numeric' })}</span>
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <p className="font-bold">{m.topic || 'Meeting'}</p>
          <Badge tone={TONE[m.status] || 'neutral'}>{m.status === 'booked' && new Date(m.end) < now ? 'finished' : m.status}</Badge>
        </div>
        <p className="text-sm text-muted">
          {formatDate(m.start, { weekday: 'long' })} · {formatTime(m.start)} – {formatTime(m.end)}
        </p>
        {m.notes && <p className="mt-1 line-clamp-2 text-sm text-muted">{m.notes}</p>}
      </div>
      {actions}
    </li>
  );

  return (
    <>
      <PageHeader title="My meetings" text="Video calls with our design team." actions={<Link href="/meetings" className="btn-primary">Book a meeting</Link>} />
      {!meetings ? (
        <div className="space-y-3">{[0, 1].map((i) => <Skeleton key={i} className="h-24" />)}</div>
      ) : !meetings.length ? (
        <EmptyState icon={CalendarDays} title="No meetings yet" text="Book a free 30-minute call to discuss your order." action={<Link href="/meetings" className="btn-primary">See open times</Link>} />
      ) : (
        <div className="space-y-8">
          <section>
            <h2 className="mb-3 text-sm font-bold uppercase tracking-wider text-muted">Upcoming</h2>
            {upcoming.length ? (
              <ul className="grid gap-3">
                {upcoming.map((m) => (
                  <Card
                    key={m._id}
                    m={m}
                    actions={
                      <div className="flex flex-wrap gap-2">
                        {m.meetLink ? (
                          <a href={m.meetLink} target="_blank" rel="noreferrer" className="btn-brand btn-sm"><Video className="h-4 w-4" /> Join Meet</a>
                        ) : (
                          <span className="text-xs text-muted">Link will be shared by email</span>
                        )}
                        {m.calendarHtmlLink && (
                          <a href={m.calendarHtmlLink} target="_blank" rel="noreferrer" className="btn-outline btn-sm"><ExternalLink className="h-4 w-4" /> Calendar</a>
                        )}
                        <button type="button" className="btn-ghost btn-sm text-danger" onClick={() => setCancelling(m)}>Cancel</button>
                      </div>
                    }
                  />
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted">Nothing coming up.</p>
            )}
          </section>
          {past.length > 0 && (
            <section>
              <h2 className="mb-3 text-sm font-bold uppercase tracking-wider text-muted">Past & cancelled</h2>
              <ul className="grid gap-3 opacity-80">
                {past.map((m) => <Card key={m._id} m={m} />)}
              </ul>
            </section>
          )}
        </div>
      )}
      <ConfirmDialog open={Boolean(cancelling)} onClose={() => setCancelling(null)} onConfirm={cancel} loading={busy} danger title="Cancel this meeting?" confirmLabel="Cancel meeting" text="The time becomes available for others and the calendar invite is removed.">
        <Textarea className="mt-4" label="Reason (optional)" value={reason} onChange={(e) => setReason(e.target.value)} rows={3} />
      </ConfirmDialog>
    </>
  );
}

export default function MyMeetingsPage() {
  return (
    <AccountShell>
      <Meetings />
    </AccountShell>
  );
}
