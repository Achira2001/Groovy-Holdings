'use client';

import { Fragment, useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import toast from 'react-hot-toast';
import { Check, CheckCheck, FolderOpen, Loader2, Paperclip, Send, Trash2, X } from 'lucide-react';
import api, { getErrorMessage } from '@/lib/api';
import { useSocket } from '@/context/SocketContext';
import { useAuth } from '@/context/AuthContext';
import { Avatar, Spinner } from '@/components/ui';
import { FileTile } from '@/components/shared/Attachments';
import { bytes, cn, formatDate, formatTime, localDateKey } from '@/lib/utils';

const MAX_FILES = 10;
const MAX_MB = 25;

/**
 * Real-time conversation between one customer and the Groovy team.
 * Used by the customer chat page and the admin inbox.
 */
export default function ChatWindow({ conversationId, header, onActivity, className }) {
  const { user } = useAuth();
  const { socket, refreshUnread } = useSocket();
  const myRole = user?.role === 'admin' ? 'admin' : 'customer';

  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [hasMore, setHasMore] = useState(false);
  const [loadingOlder, setLoadingOlder] = useState(false);
  const [text, setText] = useState('');
  const [files, setFiles] = useState([]);
  const [sending, setSending] = useState(false);
  const [typing, setTyping] = useState(null);
  const [otherReadAt, setOtherReadAt] = useState(null);
  const [showFiles, setShowFiles] = useState(false);
  const [sharedFiles, setSharedFiles] = useState([]);
  const [filesLoading, setFilesLoading] = useState(false);

  const listRef = useRef(null);
  const fileRef = useRef(null);
  const stickToBottom = useRef(true);
  const typingTimer = useRef(null);
  const typingSent = useRef(false);

  const scrollToBottom = useCallback((smooth = false) => {
    const el = listRef.current;
    if (el) el.scrollTo({ top: el.scrollHeight, behavior: smooth ? 'smooth' : 'auto' });
  }, []);

  const markRead = useCallback(async () => {
    try {
      await api.post(`/chat/conversations/${conversationId}/read`);
      refreshUnread();
    } catch {
      /* ignore */
    }
  }, [conversationId, refreshUnread]);

  // Initial load
  useEffect(() => {
    let alive = true;
    setLoading(true);
    setMessages([]);
    setTyping(null);
    setShowFiles(false);
    api
      .get(`/chat/conversations/${conversationId}/messages`, { params: { limit: 40 } })
      .then(({ data }) => {
        if (!alive) return;
        setMessages(data.messages);
        setHasMore(data.hasMore);
        const lastOtherRead = [...data.messages].reverse().find((m) => m.senderRole === myRole && m.readAt);
        setOtherReadAt(lastOtherRead?.readAt || null);
        stickToBottom.current = true;
        markRead();
      })
      .catch((err) => toast.error(getErrorMessage(err)))
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, [conversationId, markRead, myRole]);

  useLayoutEffect(() => {
    if (stickToBottom.current) scrollToBottom();
  }, [messages, typing, scrollToBottom]);

  // Socket room + live events
  useEffect(() => {
    if (!socket) return undefined;
    const join = () => socket.emit('chat:join', conversationId);
    join();
    socket.on('connect', join);

    const onMessage = (msg) => {
      if (String(msg.conversation) !== String(conversationId)) return;
      setMessages((list) => (list.some((m) => m._id === msg._id) ? list : [...list, msg]));
      if (msg.senderRole !== myRole) {
        setTyping(null);
        markRead();
        const el = listRef.current;
        stickToBottom.current = !el || el.scrollHeight - el.scrollTop - el.clientHeight < 160;
      }
      if (msg.attachments?.length) setSharedFiles((f) => [...msg.attachments.map((a) => ({ ...a, sender: msg.sender, createdAt: msg.createdAt })), ...f]);
      onActivity?.();
    };
    const onTyping = (t) => {
      if (String(t.conversationId) !== String(conversationId) || t.role === myRole) return;
      setTyping(t.typing ? t.name : null);
    };
    const onRead = (r) => {
      if (String(r.conversationId) === String(conversationId) && r.by !== myRole) setOtherReadAt(r.at);
    };
    const onDeleted = ({ messageId }) => setMessages((list) => list.filter((m) => m._id !== messageId));

    socket.on('chat:message', onMessage);
    socket.on('chat:typing', onTyping);
    socket.on('chat:read', onRead);
    socket.on('chat:deleted', onDeleted);
    return () => {
      socket.emit('chat:leave', conversationId);
      socket.off('connect', join);
      socket.off('chat:message', onMessage);
      socket.off('chat:typing', onTyping);
      socket.off('chat:read', onRead);
      socket.off('chat:deleted', onDeleted);
    };
  }, [socket, conversationId, myRole, markRead, onActivity]);

  const loadOlder = async () => {
    if (!messages.length) return;
    setLoadingOlder(true);
    const el = listRef.current;
    const prevHeight = el?.scrollHeight || 0;
    try {
      const { data } = await api.get(`/chat/conversations/${conversationId}/messages`, {
        params: { before: messages[0].createdAt, limit: 40 },
      });
      stickToBottom.current = false;
      setMessages((list) => [...data.messages, ...list]);
      setHasMore(data.hasMore);
      requestAnimationFrame(() => {
        if (el) el.scrollTop = el.scrollHeight - prevHeight;
      });
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setLoadingOlder(false);
    }
  };

  const emitTyping = (value) => {
    if (!socket) return;
    if (!typingSent.current && value) {
      socket.emit('chat:typing', { conversationId, typing: true });
      typingSent.current = true;
    }
    clearTimeout(typingTimer.current);
    typingTimer.current = setTimeout(() => {
      socket.emit('chat:typing', { conversationId, typing: false });
      typingSent.current = false;
    }, 1800);
  };

  const addFiles = (list) => {
    const incoming = Array.from(list || []);
    const big = incoming.find((f) => f.size > MAX_MB * 1024 * 1024);
    if (big) toast.error(`${big.name} is larger than ${MAX_MB} MB`);
    setFiles((f) => [...f, ...incoming.filter((x) => x.size <= MAX_MB * 1024 * 1024)].slice(0, MAX_FILES));
  };

  const send = async (e) => {
    e?.preventDefault();
    if (sending || (!text.trim() && !files.length)) return;
    const fd = new FormData();
    fd.append('text', text.trim());
    files.forEach((f) => fd.append('files', f));
    setSending(true);
    try {
      const { data } = await api.post(`/chat/conversations/${conversationId}/messages`, fd);
      stickToBottom.current = true;
      setMessages((list) => (list.some((m) => m._id === data.message._id) ? list : [...list, data.message]));
      setText('');
      setFiles([]);
      clearTimeout(typingTimer.current);
      socket?.emit('chat:typing', { conversationId, typing: false });
      typingSent.current = false;
      onActivity?.();
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setSending(false);
    }
  };

  const remove = async (id) => {
    try {
      await api.delete(`/chat/messages/${id}`);
      setMessages((list) => list.filter((m) => m._id !== id));
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  };

  const openFiles = async () => {
    setShowFiles((s) => !s);
    if (showFiles) return;
    setFilesLoading(true);
    try {
      const { data } = await api.get(`/chat/conversations/${conversationId}/files`);
      setSharedFiles(data.files);
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setFilesLoading(false);
    }
  };

  const lastMine = [...messages].reverse().find((m) => m.senderRole === myRole);

  return (
    <div className={cn('relative flex h-full min-h-0 flex-col overflow-hidden rounded-2xl border border-line bg-surface', className)}>
      {/* Header */}
      <div className="flex items-center gap-3 border-b border-line px-4 py-3">
        <div className="min-w-0 flex-1">{header}</div>
        <button type="button" onClick={openFiles} className={cn('btn-outline btn-sm', showFiles && 'border-brand text-brand')}>
          <FolderOpen className="h-4 w-4" /> <span className="hidden sm:inline">Shared files</span>
        </button>
      </div>

      <div className="relative flex min-h-0 flex-1">
        {/* Messages */}
        <div
          ref={listRef}
          onScroll={(e) => {
            const el = e.currentTarget;
            stickToBottom.current = el.scrollHeight - el.scrollTop - el.clientHeight < 80;
          }}
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault();
            addFiles(e.dataTransfer.files);
          }}
          className="scrollbar-thin flex-1 overflow-y-auto bg-bg/60 px-3 py-4 sm:px-5"
        >
          {loading ? (
            <div className="grid h-full place-items-center">
              <Spinner />
            </div>
          ) : (
            <>
              {hasMore && (
                <div className="mb-4 text-center">
                  <button type="button" className="btn-outline btn-sm" onClick={loadOlder} disabled={loadingOlder}>
                    {loadingOlder && <Loader2 className="h-3.5 w-3.5 animate-spin" />} Load earlier messages
                  </button>
                </div>
              )}
              {!messages.length && (
                <div className="mx-auto mt-10 max-w-sm rounded-2xl border border-dashed border-line bg-surface p-6 text-center">
                  <p className="font-display text-lg font-bold">Start the conversation</p>
                  <p className="mt-1 text-sm text-muted">
                    {myRole === 'customer'
                      ? 'Share your idea, attach your design files or ask about materials, sizes and prices. We reply here and by email.'
                      : 'Send the first message to this customer. They will also get it by email.'}
                  </p>
                </div>
              )}
              {messages.map((m, i) => {
                const mine = m.senderRole === myRole;
                const prev = messages[i - 1];
                const newDay = !prev || localDateKey(prev.createdAt) !== localDateKey(m.createdAt);
                const grouped = prev && !newDay && prev.senderRole === m.senderRole && new Date(m.createdAt) - new Date(prev.createdAt) < 5 * 60000;
                const seen = mine && m._id === lastMine?._id && otherReadAt && new Date(otherReadAt) >= new Date(m.createdAt);
                return (
                  <Fragment key={m._id}>
                    {newDay && (
                      <div className="my-4 flex items-center gap-3 text-[11px] font-semibold uppercase tracking-wider text-muted">
                        <span className="stitch flex-1" />
                        {formatDate(m.createdAt, { weekday: 'short' })}
                        <span className="stitch flex-1" />
                      </div>
                    )}
                    <div className={cn('group flex items-end gap-2', mine ? 'justify-end' : 'justify-start', grouped ? 'mt-1' : 'mt-3')}>
                      {!mine && (
                        <span className="w-8 shrink-0">{!grouped && <Avatar user={m.sender} size={32} />}</span>
                      )}
                      {mine && (
                        <button
                          type="button"
                          onClick={() => remove(m._id)}
                          className="btn-icon h-7 w-7 opacity-0 transition group-hover:opacity-100 focus:opacity-100"
                          aria-label="Delete message"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      )}
                      <div className={cn('max-w-[82%] sm:max-w-[70%]', mine && 'items-end')}>
                        {!mine && !grouped && (
                          <p className="mb-1 ml-1 text-xs font-semibold text-muted">
                            {m.sender?.name}
                            {m.senderRole === 'admin' && <span className="ml-1 text-brand">· Groovy team</span>}
                          </p>
                        )}
                        <div
                          className={cn(
                            'rounded-2xl px-3.5 py-2.5 text-sm shadow-sm',
                            mine ? 'rounded-br-md bg-brand text-white' : 'rounded-bl-md border border-line bg-surface text-ink'
                          )}
                        >
                          {m.text && <p className="whitespace-pre-wrap break-words leading-relaxed">{m.text}</p>}
                          {m.attachments?.length > 0 && (
                            <div className={cn('grid gap-2', m.text && 'mt-2')}>
                              {m.attachments.map((a) => (
                                <FileTile key={a.filename} file={a} dark={mine} className="min-w-[220px]" />
                              ))}
                            </div>
                          )}
                        </div>
                        <p className={cn('mt-1 flex items-center gap-1 text-[11px] text-muted', mine ? 'justify-end' : 'ml-1')}>
                          {formatTime(m.createdAt)}
                          {mine && (seen ? <CheckCheck className="h-3.5 w-3.5 text-brand" aria-label="Seen" /> : <Check className="h-3.5 w-3.5" aria-label="Sent" />)}
                        </p>
                      </div>
                    </div>
                  </Fragment>
                );
              })}
              {typing && (
                <div className="mt-3 flex items-center gap-2 pl-10 text-xs text-muted">
                  <span className="flex gap-1">
                    <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-muted [animation-delay:-0.3s]" />
                    <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-muted [animation-delay:-0.15s]" />
                    <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-muted" />
                  </span>
                  {typing} is typing…
                </div>
              )}
            </>
          )}
        </div>

        {/* Shared files drawer */}
        {showFiles && (
          <aside className="absolute inset-0 z-10 flex flex-col border-l border-line bg-surface md:static md:w-80">
            <div className="flex items-center justify-between border-b border-line px-4 py-3">
              <p className="font-bold">Shared files</p>
              <button type="button" className="btn-icon h-8 w-8" onClick={() => setShowFiles(false)} aria-label="Close files">
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="scrollbar-thin flex-1 space-y-2 overflow-y-auto p-3">
              {filesLoading ? (
                <div className="grid place-items-center py-10">
                  <Spinner />
                </div>
              ) : sharedFiles.length ? (
                sharedFiles.map((f) => (
                  <div key={`${f.filename}`}>
                    <FileTile file={f} />
                    <p className="mt-1 px-1 text-[11px] text-muted">
                      {f.sender?.name} · {formatDate(f.createdAt)}
                    </p>
                  </div>
                ))
              ) : (
                <p className="py-10 text-center text-sm text-muted">No files shared yet.</p>
              )}
            </div>
          </aside>
        )}
      </div>

      {/* Composer */}
      <form onSubmit={send} className="border-t border-line bg-surface p-3">
        {files.length > 0 && (
          <ul className="mb-2 flex flex-wrap gap-2">
            {files.map((f, i) => (
              <li key={`${f.name}-${i}`} className="flex items-center gap-2 rounded-lg border border-line bg-surface-2 py-1 pl-2.5 pr-1 text-xs">
                <span className="max-w-[160px] truncate font-medium">{f.name}</span>
                <span className="text-muted">{bytes(f.size)}</span>
                <button type="button" className="btn-icon h-6 w-6" onClick={() => setFiles((l) => l.filter((_, j) => j !== i))} aria-label={`Remove ${f.name}`}>
                  <X className="h-3.5 w-3.5" />
                </button>
              </li>
            ))}
          </ul>
        )}
        <div className="flex items-end gap-2">
          <button type="button" className="btn-icon h-11 w-11 shrink-0" onClick={() => fileRef.current?.click()} aria-label="Attach files">
            <Paperclip className="h-5 w-5" />
          </button>
          <input
            ref={fileRef}
            type="file"
            multiple
            className="hidden"
            onChange={(e) => {
              addFiles(e.target.files);
              e.target.value = '';
            }}
          />
          <textarea
            rows={1}
            value={text}
            onChange={(e) => {
              setText(e.target.value);
              emitTyping(e.target.value);
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                send();
              }
            }}
            placeholder="Write a message… (Shift + Enter for a new line)"
            className="input max-h-40 min-h-[44px] flex-1 resize-none py-2.5"
            aria-label="Message"
          />
          <button type="submit" className="btn-primary h-11 w-11 shrink-0 p-0" disabled={sending || (!text.trim() && !files.length)} aria-label="Send">
            {sending ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
          </button>
        </div>
      </form>
    </div>
  );
}
