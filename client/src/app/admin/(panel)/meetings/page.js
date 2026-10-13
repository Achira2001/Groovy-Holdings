'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { AlertTriangle, CalendarPlus, CheckCircle2, Clock, Trash2, Video, XCircle } from 'lucide-react';
import api, { getErrorMessage } from '@/lib/api';
import { useSocket } from '@/context/SocketContext';
import { Avatar, Badge, Button, ConfirmDialog, Input, Modal, PageHeader, Select, Skeleton, Textarea, Toggle } from '@/components/ui';
import { cn, formatDate, formatTime, localDateKey, TZ } from '@/lib/utils';

const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const TONE = { available: 'success', booked: 'brand', completed: 'neutral', cancelled: 'danger' };

const todayKey = () => localDateKey(new Date());
const addDays = (key, n) => {
  const d = new Date(`${key}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
};

function CreateSlots({ open, onClose, onCreated }) {
  const [form, setForm] = useState({ from: todayKey(), to: addDays(todayKey(), 6), days: [0, 1, 2, 3, 4, 5], startTime: '10:00', endTime: '16:00', duration: 30, gap: 0 });
  const [busy, setBusy] = useState(false);

  const dates = useMemo(() => {
    const out = [];
    if (!form.from || !form.to || form.to < form.from) return out;
    for (let k = form.from; k <= form.to && out.length < 62; k = addDays(k, 1)) {
      const dow = (new Date(`${k}T00:00:00Z`).getUTCDay() + 6) % 7; // Mon = 0
      if (form.days.includes(dow)) out.push(k);
    }
    return out;
  }, [form.from, form.to, form.days]);

  const perDay = useMemo(() => {
    const toMin = (t) => Number(t.slice(0, 2)) * 60 + Number(t.slice(3, 5));
    const span = toMin(form.endTime) - toMin(form.startTime);
    const step = Number(form.duration) + Number(form.gap || 0);
    return span > 0 && step > 0 ? Math.floor((span + Number(form.gap || 0)) / step) : 0;
  }, [form]);

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      const { data } = await api.post('/meetings/slots', { dates, startTime: form.startTime, endTime: form.endTime, duration: form.duration, gap: form.gap });
      toast.success(data.message);
      onCreated();
      onClose();
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title="Add available times" description={`Times are in Sri Lanka time (${TZ}). Overlapping slots are skipped.`} size="lg">
      <form onSubmit={submit} className="space-y-5">
        <div className="grid gap-4 sm:grid-cols-2">
          <Input label="From date" type="date" min={todayKey()} value={form.from} onChange={(e) => setForm({ ...form, from: e.target.value })} required />
          <Input label="To date" type="date" min={form.from} value={form.to} onChange={(e) => setForm({ ...form, to: e.target.value })} required />
        </div>
        <div>
          <p className="field-label">On these days</p>
          <div className="flex flex-wrap gap-2">
            {WEEKDAYS.map((d, i) => (
              <button
                key={d}
                type="button"
                onClick={() => setForm((f) => ({ ...f, days: f.days.includes(i) ? f.days.filter((x) => x !== i) : [...f.days, i] }))}
                className={cn('h-10 w-14 rounded-lg border text-sm font-semibold', form.days.includes(i) ? 'border-brand bg-brand text-white' : 'border-line text-muted')}
              >
                {d}
              </button>
            ))}
          </div>
        </div>
        <div className="grid gap-4 sm:grid-cols-4">
          <Input label="Start time" type="time" value={form.startTime} onChange={(e) => setForm({ ...form, startTime: e.target.value })} required />
          <Input label="End time" type="time" value={form.endTime} onChange={(e) => setForm({ ...form, endTime: e.target.value })} required />
          <Select label="Meeting length" value={form.duration} onChange={(e) => setForm({ ...form, duration: Number(e.target.value) })}>
            {[15, 20, 30, 45, 60, 90].map((m) => <option key={m} value={m}>{m} min</option>)}
          </Select>
          <Select label="Break between" value={form.gap} onChange={(e) => setForm({ ...form, gap: Number(e.target.value) })}>
            {[0, 5, 10, 15, 30].map((m) => <option key={m} value={m}>{m} min</option>)}
          </Select>
        </div>
        <div className="rounded-xl bg-surface-2 p-4 text-sm">
          This creates about <strong>{dates.length * perDay}</strong> slot(s): {perDay} per day on {dates.length} day(s).
          {dates.length > 0 && <p className="mt-1 text-xs text-muted">{dates.slice(0, 8).map((d) => formatDate(`${d}T12:00:00+05:30`, { year: undefined })).join(', ')}{dates.length > 8 ? '…' : ''}</p>}
        </div>
        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
          <Button type="submit" loading={busy} disabled={!dates.length || !perDay}>Create slots</Button>
        </div>
      </form>
    </Modal>
  );
}

export default function AdminMeetingsPage() {
  const { socket } = useSocket();
  const [slots, setSlots] = useState(null);
  const [status, setStatus] = useState('all');
  const [range, setRange] = useState('upcoming');
  const [creating, setCreating] = useState(false);
  const [calendar, setCalendar] = useState(null);
  const [cancelling, setCancelling] = useState(null);
  const [cancelForm, setCancelForm] = useState({ reason: '', releaseSlot: true });
  const [deleting, setDeleting] = useState(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(() => {
    const now = Date.now();
    const params = range === 'upcoming' ? { from: new Date(now - 2 * 3600e3).toISOString(), to: new Date(now + 120 * 864e5).toISOString() } : { from: new Date(now - 90 * 864e5).toISOString(), to: new Date(now).toISOString() };
    api.get('/meetings/slots', { params: { ...params, status } }).then(({ data }) => setSlots(data.slots)).catch((e) => toast.error(getErrorMessage(e)));
  }, [status, range]);
  useEffect(load, [load]);

  useEffect(() => {
    api.get('/google/calendar/status').then(({ data }) => setCalendar(data)).catch(() => setCalendar(null));
  }, []);

  useEffect(() => {
    if (!socket) return undefined;
    socket.on('meetings:changed', load);
    return () => socket.off('meetings:changed', load);
  }, [socket, load]);

  const groups = useMemo(() => {
    const map = new Map();
    (range === 'past' ? [...(slots || [])].reverse() : slots || []).forEach((s) => {
      const k = localDateKey(s.start);
      if (!map.has(k)) map.set(k, []);
      map.get(k).push(s);
    });
    return [...map.entries()];
  }, [slots, range]);

  const counts = useMemo(() => {
    const c = { available: 0, booked: 0, completed: 0, cancelled: 0 };
    (slots || []).forEach((s) => (c[s.status] += 1));
    return c;
  }, [slots]);

  const act = async (fn, msg) => {
    setBusy(true);
    try {
      const { data } = await fn();
      toast.success(data.message || msg);
      load();
      return true;
    } catch (e) {
      toast.error(getErrorMessage(e));
      return false;
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <PageHeader title="Meetings" text="Publish free times; customers book them and get a Google Meet link automatically." actions={<Button onClick={() => setCreating(true)}><CalendarPlus className="h-4 w-4" /> Add available times</Button>} />

      {calendar && !calendar.connected && (
        <div className="mb-4 flex flex-col gap-3 rounded-2xl border border-warning/40 bg-warning/10 p-4 text-sm sm:flex-row sm:items-center">
          <AlertTriangle className="h-5 w-5 shrink-0 text-warning" />
          <p className="flex-1">Google Calendar isn&apos;t connected, so bookings won&apos;t get a Meet link or calendar invite yet (emails are still sent).</p>
          <Link href="/admin/settings" className="btn-outline btn-sm">Connect Google Calendar</Link>
        </div>
      )}

      <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {Object.entries(counts).map(([k, v]) => (
          <button key={k} type="button" onClick={() => setStatus(status === k ? 'all' : k)} className={cn('card p-4 text-left transition hover:shadow-lift', status === k && 'ring-2 ring-brand')}>
            <p className="text-xs capitalize text-muted">{k}</p>
            <p className="font-display text-2xl font-extrabold tabular-nums">{v}</p>
          </button>
        ))}
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-2">
        {[['upcoming', 'Upcoming'], ['past', 'Past 90 days']].map(([k, l]) => (
          <button key={k} type="button" onClick={() => setRange(k)} className={cn('chip', range === k && 'border-ink bg-ink text-bg')}>{l}</button>
        ))}
        {status !== 'all' && <button type="button" className="chip" onClick={() => setStatus('all')}>Status: {status} ✕</button>}
      </div>

      {!slots ? (
        <Skeleton className="h-80" />
      ) : !groups.length ? (
        <div className="rounded-2xl border border-dashed border-line p-10 text-center">
          <p className="font-display text-lg font-bold">No slots here</p>
          <p className="mt-1 text-sm text-muted">Add available times so customers can book a meeting.</p>
          <Button className="mt-4" onClick={() => setCreating(true)}>Add available times</Button>
        </div>
      ) : (
        <div className="space-y-6">
          {groups.map(([day, list]) => (
            <section key={day} className="card overflow-hidden">
              <header className="flex items-center justify-between border-b border-line bg-surface-2 px-4 py-2.5">
                <p className="font-bold">{formatDate(list[0].start, { weekday: 'long' })}</p>
                <p className="text-xs text-muted">{list.filter((s) => s.status === 'booked').length} booked · {list.filter((s) => s.status === 'available').length} free</p>
              </header>
              <ul className="divide-y divide-line">
                {list.map((s) => (
                  <li key={s._id} className="flex flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center">
                    <span className="flex w-40 shrink-0 items-center gap-2 text-sm font-semibold tabular-nums">
                      <Clock className="h-4 w-4 text-muted" /> {formatTime(s.start)} – {formatTime(s.end)}
                    </span>
                    <Badge tone={TONE[s.status]}>{s.status}</Badge>
                    <div className="min-w-0 flex-1">
                      {s.bookedBy ? (
                        <Link href={`/admin/users/${s.bookedBy._id}`} className="flex items-center gap-2">
                          <Avatar user={s.bookedBy} size={30} />
                          <span className="min-w-0">
                            <span className="block truncate text-sm font-semibold">{s.bookedBy.name} <span className="font-normal text-muted">· {s.topic}</span></span>
                            <span className="block truncate text-xs text-muted">{s.bookedBy.email}{s.bookedBy.whatsapp ? ` · +${s.bookedBy.whatsapp}` : ''}</span>
                          </span>
                        </Link>
                      ) : s.status === 'cancelled' ? (
                        <span className="text-xs text-muted">{s.cancelledReason || 'Cancelled'}</span>
                      ) : (
                        <span className="text-xs text-muted">Open for booking</span>
                      )}
                      {s.notes && <p className="mt-1 line-clamp-2 text-xs text-muted">“{s.notes}”</p>}
                    </div>
                    <div className="flex shrink-0 flex-wrap gap-1.5">
                      {s.meetLink && <a href={s.meetLink} target="_blank" rel="noreferrer" className="btn-brand btn-sm"><Video className="h-4 w-4" /> Join</a>}
                      {s.status === 'booked' && (
                        <>
                          <button type="button" className="btn-outline btn-sm" onClick={() => act(() => api.patch(`/meetings/slots/${s._id}/complete`))} disabled={busy}>
                            <CheckCircle2 className="h-4 w-4" /> Done
                          </button>
                          <button type="button" className="btn-ghost btn-sm text-danger" onClick={() => { setCancelling(s); setCancelForm({ reason: '', releaseSlot: new Date(s.start) > new Date() }); }}>
                            <XCircle className="h-4 w-4" /> Cancel
                          </button>
                        </>
                      )}
                      {['available', 'cancelled', 'completed'].includes(s.status) && (
                        <button type="button" className="btn-icon hover:text-danger" onClick={() => setDeleting(s)} aria-label="Delete slot"><Trash2 className="h-4 w-4" /></button>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      )}

      <CreateSlots open={creating} onClose={() => setCreating(false)} onCreated={load} />

      <Modal open={Boolean(cancelling)} onClose={() => setCancelling(null)} title="Cancel this meeting?" description={cancelling && `${cancelling.bookedBy?.name} · ${formatDate(cancelling.start, { weekday: 'long' })} ${formatTime(cancelling.start)}`} size="sm">
        <div className="space-y-4">
          <Textarea label="Reason (sent to the customer)" value={cancelForm.reason} onChange={(e) => setCancelForm({ ...cancelForm, reason: e.target.value })} rows={3} />
          <Toggle checked={cancelForm.releaseSlot} onChange={(v) => setCancelForm({ ...cancelForm, releaseSlot: v })} label="Make this time available again" description="Other customers can book it" />
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setCancelling(null)}>Keep it</Button>
            <Button
              variant="danger"
              loading={busy}
              onClick={async () => {
                if (await act(() => api.post(`/meetings/slots/${cancelling._id}/cancel`, cancelForm))) setCancelling(null);
              }}
            >
              Cancel meeting
            </Button>
          </div>
        </div>
      </Modal>

      <ConfirmDialog
        open={Boolean(deleting)}
        onClose={() => setDeleting(null)}
        onConfirm={async () => {
          if (await act(() => api.delete(`/meetings/slots/${deleting._id}`))) setDeleting(null);
        }}
        loading={busy}
        danger
        title="Delete this slot?"
        text="It will no longer be shown to customers."
        confirmLabel="Delete slot"
      />
    </>
  );
}
