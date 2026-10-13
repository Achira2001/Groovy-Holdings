'use client';

import { Suspense, useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowLeft, MessageCircle, MessagesSquare, Search } from 'lucide-react';
import api from '@/lib/api';
import { useSocket } from '@/context/SocketContext';
import ChatWindow from '@/components/chat/ChatWindow';
import { Avatar, EmptyState, Skeleton } from '@/components/ui';
import { cn, timeAgo } from '@/lib/utils';

function Inbox() {
  const router = useRouter();
  const params = useSearchParams();
  const activeId = params.get('c');
  const { socket } = useSocket();
  const [conversations, setConversations] = useState(null);
  const [q, setQ] = useState('');
  const [online, setOnline] = useState(new Set());
  const [filter, setFilter] = useState('all');

  const load = useCallback(() => {
    api.get('/chat/conversations', { params: { search: q || undefined } }).then(({ data }) => setConversations(data.conversations)).catch(() => setConversations([]));
  }, [q]);

  useEffect(() => {
    const t = setTimeout(load, 250);
    return () => clearTimeout(t);
  }, [load]);

  useEffect(() => {
    if (!socket) return undefined;
    const onConv = (conv) => {
      setConversations((list) => {
        if (!list) return list;
        const existing = list.find((c) => c._id === conv._id);
        const merged = { ...existing, ...conv, customer: existing?.customer || conv.customer };
        if (!merged.customer?.name) {
          load();
          return list;
        }
        return [merged, ...list.filter((c) => c._id !== conv._id)].sort((a, b) => new Date(b.lastMessageAt) - new Date(a.lastMessageAt));
      });
    };
    const onPresence = ({ userId, online: isOn }) =>
      setOnline((s) => {
        const n = new Set(s);
        if (isOn) n.add(userId);
        else n.delete(userId);
        return n;
      });
    const syncPresence = () => socket.emit('presence:list', (res) => setOnline(new Set(res?.online || [])));
    syncPresence();
    socket.on('connect', syncPresence);
    socket.on('chat:conversation', onConv);
    socket.on('presence', onPresence);
    return () => {
      socket.off('connect', syncPresence);
      socket.off('chat:conversation', onConv);
      socket.off('presence', onPresence);
    };
  }, [socket, load]);

  const shown = useMemo(() => (conversations || []).filter((c) => (filter === 'unread' ? c.unreadByAdmin > 0 : true)), [conversations, filter]);
  const active = conversations?.find((c) => c._id === activeId);
  const select = (id) => router.push(`/admin/chat?c=${id}`, { scroll: false });

  return (
    <div className="flex h-[calc(100vh-7rem)] min-h-[560px] gap-4 lg:h-[calc(100vh-4rem)]">
      {/* Conversation list */}
      <aside className={cn('card flex w-full flex-col overflow-hidden md:w-80 md:shrink-0', activeId && 'hidden md:flex')}>
        <div className="border-b border-line p-4">
          <h1 className="text-xl font-extrabold">Messages</h1>
          <label className="relative mt-3 block">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
            <input className="input pl-9" placeholder="Search customers" value={q} onChange={(e) => setQ(e.target.value)} />
          </label>
          <div className="mt-3 flex gap-2">
            {['all', 'unread'].map((f) => (
              <button key={f} type="button" onClick={() => setFilter(f)} className={cn('chip capitalize', filter === f && 'border-ink bg-ink text-bg')}>{f}</button>
            ))}
          </div>
        </div>
        <ul className="scrollbar-thin flex-1 overflow-y-auto">
          {!conversations ? (
            <li className="space-y-2 p-3">{[0, 1, 2, 3].map((i) => <Skeleton key={i} className="h-16" />)}</li>
          ) : shown.length ? (
            shown.map((c) => (
              <li key={c._id}>
                <button
                  type="button"
                  onClick={() => select(c._id)}
                  className={cn('flex w-full items-center gap-3 border-b border-line px-4 py-3 text-left transition', c._id === activeId ? 'bg-brand-soft' : 'hover:bg-surface-2')}
                >
                  <span className="relative">
                    <Avatar user={c.customer} size={42} />
                    {online.has(c.customer?._id) && <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full bg-success ring-2 ring-surface" />}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center justify-between gap-2">
                      <span className={cn('truncate text-sm', c.unreadByAdmin ? 'font-extrabold' : 'font-semibold')}>{c.customer?.name}</span>
                      <span className="shrink-0 text-[11px] text-muted">{timeAgo(c.lastMessageAt)}</span>
                    </span>
                    <span className="flex items-center justify-between gap-2">
                      <span className={cn('truncate text-xs', c.unreadByAdmin ? 'font-semibold text-ink' : 'text-muted')}>
                        {c.lastSenderRole === 'admin' && 'You: '}
                        {c.lastMessage || 'No messages yet'}
                      </span>
                      {c.unreadByAdmin > 0 && <span className="grid h-5 min-w-5 place-items-center rounded-full bg-accent px-1.5 text-[10px] font-bold text-white">{c.unreadByAdmin}</span>}
                    </span>
                  </span>
                </button>
              </li>
            ))
          ) : (
            <li className="p-6 text-center text-sm text-muted">No conversations{filter === 'unread' ? ' with unread messages' : ''}.</li>
          )}
        </ul>
      </aside>

      {/* Conversation */}
      <div className={cn('min-w-0 flex-1', !activeId && 'hidden md:block')}>
        {activeId ? (
          <ChatWindow
            key={activeId}
            conversationId={activeId}
            className="h-full"
            header={
              <div className="flex items-center gap-3">
                <button type="button" className="btn-icon md:hidden" onClick={() => router.push('/admin/chat')} aria-label="Back"><ArrowLeft className="h-5 w-5" /></button>
                {active?.customer ? (
                  <>
                    <Avatar user={active.customer} size={38} />
                    <div className="min-w-0">
                      <Link href={`/admin/users/${active.customer._id}`} className="block truncate font-bold hover:text-brand">{active.customer.name}</Link>
                      <p className="truncate text-xs text-muted">
                        {online.has(active.customer._id) ? <span className="font-semibold text-success">Online · </span> : null}
                        {active.customer.email}
                      </p>
                    </div>
                    {active.customer.whatsapp && (
                      <a href={`https://wa.me/${active.customer.whatsapp}`} target="_blank" rel="noreferrer" className="btn-sm btn ml-auto hidden bg-[#1FAF5A] text-white hover:bg-[#199a4e] sm:inline-flex" title={`+${active.customer.whatsapp}`}>
                        <MessageCircle className="h-4 w-4" /> WhatsApp
                      </a>
                    )}
                  </>
                ) : (
                  <p className="font-bold">Conversation</p>
                )}
              </div>
            }
          />
        ) : (
          <div className="card grid h-full place-items-center p-6">
            <EmptyState icon={MessagesSquare} title="Select a conversation" text="Customer messages arrive here in real time. You also get each message by email." className="border-0" />
          </div>
        )}
      </div>
    </div>
  );
}

export default function AdminChatPage() {
  return (
    <Suspense>
      <Inbox />
    </Suspense>
  );
}
