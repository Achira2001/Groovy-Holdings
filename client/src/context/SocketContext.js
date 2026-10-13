'use client';

import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { io } from 'socket.io-client';
import toast from 'react-hot-toast';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import { useAuth } from './AuthContext';

const SocketContext = createContext({ socket: null, connected: false, unread: 0, adminOnline: false, refreshUnread: () => {} });

const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:5000';

export function SocketProvider({ children }) {
  const { user } = useAuth();
  const router = useRouter();
  const [socket, setSocket] = useState(null);
  const [connected, setConnected] = useState(false);
  const [unread, setUnread] = useState(0);
  const [adminOnline, setAdminOnline] = useState(false);
  const routerRef = useRef(router);
  routerRef.current = router;

  const refreshUnread = useCallback(async () => {
    try {
      const { data } = await api.get('/chat/unread');
      setUnread(data.unread || 0);
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    if (!user?._id) {
      setSocket(null);
      setUnread(0);
      return undefined;
    }

    const s = io(SOCKET_URL, {
      withCredentials: true,
      transports: ['websocket', 'polling'],
      // Fetch a fresh short-lived token on every (re)connect
      auth: (cb) =>
        api
          .get('/auth/socket-token')
          .then(({ data }) => cb({ token: data.token }))
          .catch(() => cb({})),
    });

    s.on('connect', () => {
      setConnected(true);
      s.emit('presence:list', (res) => setAdminOnline(Boolean(res?.adminOnline)));
    });
    s.on('disconnect', () => setConnected(false));
    s.on('presence:admins', ({ online }) => setAdminOnline(online));
    s.on('chat:conversation', () => refreshUnread());
    s.on('notify', (n) => {
      toast(
        (t) => (
          <button
            type="button"
            className="text-left"
            onClick={() => {
              toast.dismiss(t.id);
              if (n.link) routerRef.current.push(n.link);
            }}
          >
            <span className="block font-semibold">{n.title}</span>
            {n.body && <span className="block text-sm opacity-80">{n.body}</span>}
          </button>
        ),
        { duration: 6000, icon: n.type === 'order' ? '🧾' : n.type === 'meeting' ? '📅' : '🔔' }
      );
    });

    setSocket(s);
    refreshUnread();
    return () => {
      s.disconnect();
    };
  }, [user?._id, refreshUnread]);

  return (
    <SocketContext.Provider value={{ socket, connected, unread, setUnread, adminOnline, refreshUnread }}>
      {children}
    </SocketContext.Provider>
  );
}

export const useSocket = () => useContext(SocketContext);
