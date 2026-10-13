'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { CalendarCheck2, CalendarDays, Clock, Mail, Video } from 'lucide-react';
import api, { getErrorMessage } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { useSocket } from '@/context/SocketContext';
import { Button, EmptyState, Input, Modal, Skeleton, Textarea } from '@/components/ui';
import { cn, formatDate, formatTime, localDateKey, TZ, whatsappLink } from '@/lib/utils';

const TOPICS = ['New T-shirt order', 'Caps / embroidery', 'Mugs & gifts', 'Design discussion', 'Bulk / corporate order'];

export default function MeetingsPage() {
  const { user } = useAuth();
  const { socket } = useSocket();
  const router = useRouter();
  const [slots, setSlots] = useState(null);
  const [day, setDay] = useState(null);
  const [picked, setPicked] = useState(null);
  const [topic, setTopic] = useState('');
  const [notes, setNotes] = useState('');
  const [booking, setBooking] = useState(false);
  const [done, setDone] = useState(null);

  const load = useCallback(() => {
    api
      .get('/meetings/available')
      .then(({ data }) => setSlots(data.slots))
      .catch(() => setSlots([]));
  }, []);

  useEffect(load, [load]);

  // Live availability: when anyone books or frees a slot, refresh the list
  useEffect(() => {
    if (!socket) return undefined;
    socket.on('meetings:availability', load);
    return () => socket.off('meetings:availability', load);
  }, [socket, load]);

  const days = useMemo(() => {
    const map = new Map();
    (slots || []).forEach((s) => {
      const k = localDateKey(s.start);
      if (!map.has(k)) map.set(k, []);
      map.get(k).push(s);
    });
    return [...map.entries()];
  }, [slots]);

  useEffect(() => {
    if (days.length && !days.some(([k]) => k === day)) setDay(days[0][0]);
  }, [days, day]);

  const daySlots = days.find(([k]) => k === day)?.[1] || [];

  const choose = (slot) => {
    if (!user) {
      router.push('/login?next=/meetings');
      return;
    }
    if (user.role === 'admin') {
      toast('Admins manage slots from the dashboard');
      return;
    }
    setPicked(slot);
    setTopic((t) => t || TOPICS[0]);
  };

  const book = async (e) => {
    e.preventDefault();
    setBooking(true);
    try {
      const { data } = await api.post(`/meetings/slots/${picked._id}/book`, { topic, notes });
      setDone(data.slot);
      setPicked(null);
      setNotes('');
      toast.success(data.message);
      load();
    } catch (err) {
      toast.error(getErrorMessage(err));
      if (err.response?.status === 409) {
        setPicked(null);
        load();
      }
    } finally {
      setBooking(false);
    }
  };

  return (
    <div className="container py-10 sm:py-14">
      <div className="grid gap-10 lg:grid-cols-[1fr_1.4fr]">
        <div>
          <p className="chip mb-4"><Video className="h-3.5 w-3.5 text-brand" /> Google Meet · 30 min</p>
          <h1 className="text-4xl font-extrabold leading-[1.05] sm:text-5xl text-balance">Talk it through before we print.</h1>
          <p className="mt-4 max-w-md text-muted">
            Fabric, fit, print method, colours and quantities are easier to agree on face to face. Pick a free time and we&apos;ll send a Google Meet link to you and our team — it goes straight into your Google Calendar.
          </p>
          <ul className="mt-8 space-y-4 text-sm">
            {[
              [CalendarDays, 'Choose any open slot — booked times disappear instantly for everyone else.'],
              [Mail, 'You get an email with the Meet link and a calendar invite with reminders.'],
              [CalendarCheck2, 'Reschedule by cancelling from your account; the slot opens up again.'],
            ].map(([Icon, text]) => (
              <li key={text} className="flex gap-3">
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-brand-soft text-brand"><Icon className="h-4 w-4" /></span>
                <span className="pt-1.5 text-muted">{text}</span>
              </li>
            ))}
          </ul>
          <p className="mt-8 text-sm text-muted">
            Prefer a quick chat? <a className="link" href={whatsappLink('Hi! I would like to talk about an order.')} target="_blank" rel="noreferrer">Message us on WhatsApp</a>
          </p>
        </div>

        <div className="panel p-0">
          <div className="border-b border-line p-5">
            <h2 className="text-lg font-bold">Pick a date</h2>
            <p className="text-xs text-muted">Times shown in Sri Lanka time ({TZ})</p>
          </div>
          {!slots ? (
            <div className="space-y-3 p-5">
              <Skeleton className="h-16" />
              <Skeleton className="h-40" />
            </div>
          ) : !days.length ? (
            <div className="p-5">
              <EmptyState icon={CalendarDays} title="No open slots right now" text="New times are added every week. Message us on WhatsApp or chat and we'll arrange a time." action={<a className="btn-primary" href={whatsappLink('Hi! Can we arrange a meeting?')} target="_blank" rel="noreferrer">WhatsApp us</a>} />
            </div>
          ) : (
            <>
              <div className="scrollbar-thin flex gap-2 overflow-x-auto border-b border-line p-4">
                {days.map(([k, list]) => {
                  const d = new Date(list[0].start);
                  return (
                    <button
                      key={k}
                      type="button"
                      onClick={() => setDay(k)}
                      className={cn(
                        'flex min-w-[72px] flex-col items-center rounded-xl border px-3 py-2.5 transition',
                        day === k ? 'border-ink bg-ink text-bg' : 'border-line hover:border-ink/40'
                      )}
                    >
                      <span className="text-[11px] font-semibold uppercase opacity-70">{d.toLocaleDateString('en-GB', { weekday: 'short', timeZone: TZ })}</span>
                      <span className="font-display text-2xl font-extrabold">{d.toLocaleDateString('en-GB', { day: 'numeric', timeZone: TZ })}</span>
                      <span className="text-[11px] opacity-70">{d.toLocaleDateString('en-GB', { month: 'short', timeZone: TZ })}</span>
                      <span className={cn('mt-1 text-[10px] font-bold', day === k ? 'text-accent' : 'text-brand')}>{list.length} open</span>
                    </button>
                  );
                })}
              </div>
              <div className="p-5">
                <p className="mb-3 text-sm font-semibold">{day && formatDate(daySlots[0]?.start, { weekday: 'long' })}</p>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                  {daySlots.map((s) => (
                    <button key={s._id} type="button" onClick={() => choose(s)} className="rounded-xl border border-line px-3 py-3 text-sm font-semibold transition hover:border-brand hover:bg-brand-soft hover:text-brand">
                      <Clock className="mr-1.5 inline h-3.5 w-3.5" />
                      {formatTime(s.start)} – {formatTime(s.end)}
                    </button>
                  ))}
                </div>
                {!user && (
                  <p className="mt-5 text-sm text-muted">
                    <Link href="/login?next=/meetings" className="link">Sign in</Link> to book — we need your email to send the meeting link.
                  </p>
                )}
              </div>
            </>
          )}
        </div>
      </div>

      <Modal
        open={Boolean(picked)}
        onClose={() => setPicked(null)}
        title="Confirm your meeting"
        description={picked && `${formatDate(picked.start, { weekday: 'long' })} · ${formatTime(picked.start)} – ${formatTime(picked.end)}`}
      >
        <form onSubmit={book} className="space-y-4">
          <div>
            <p className="field-label">What would you like to discuss?</p>
            <div className="mb-2 flex flex-wrap gap-2">
              {TOPICS.map((t) => (
                <button key={t} type="button" onClick={() => setTopic(t)} className={cn('chip', topic === t && 'border-brand bg-brand-soft text-brand')}>
                  {t}
                </button>
              ))}
            </div>
            <Input value={topic} onChange={(e) => setTopic(e.target.value)} required maxLength={160} aria-label="Topic" />
          </div>
          <Textarea label="Details for our team (optional)" value={notes} onChange={(e) => setNotes(e.target.value)} rows={4} maxLength={1500} placeholder="Quantity, sizes, deadline, links to reference designs…" />
          <p className="text-xs text-muted">The Google Meet link is emailed to {user?.email} and added to your Google Calendar.</p>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setPicked(null)}>Back</Button>
            <Button type="submit" loading={booking}>Book meeting</Button>
          </div>
        </form>
      </Modal>

      <Modal open={Boolean(done)} onClose={() => setDone(null)} title="You're booked! 🎉" size="sm">
        {done && (
          <div className="space-y-4 text-sm">
            <p>
              <strong>{formatDate(done.start, { weekday: 'long' })}</strong> at <strong>{formatTime(done.start)}</strong>
            </p>
            <p className="text-muted">We emailed the details to you. You can also find this meeting in your account.</p>
            <div className="flex flex-wrap gap-2">
              {done.meetLink && (
                <a href={done.meetLink} target="_blank" rel="noreferrer" className="btn-brand">
                  <Video className="h-4 w-4" /> Open Meet link
                </a>
              )}
              <Link href="/account/meetings" className="btn-outline">My meetings</Link>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
