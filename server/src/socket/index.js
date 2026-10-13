const { Server } = require('socket.io');
const env = require('../config/env');
const User = require('../models/User');
const Conversation = require('../models/Conversation');
const { verifyToken, COOKIE_NAME } = require('../utils/jwt');
const realtime = require('../utils/realtime');

const onlineUsers = new Map(); // userId -> number of open sockets

function readCookieToken(header = '') {
  const part = header.split(';').map((s) => s.trim()).find((s) => s.startsWith(`${COOKIE_NAME}=`));
  return part ? decodeURIComponent(part.slice(COOKIE_NAME.length + 1)) : null;
}

function initSocket(httpServer) {
  const io = new Server(httpServer, {
    cors: { origin: env.clientUrl, credentials: true },
    maxHttpBufferSize: 1e6,
  });
  realtime.setIO(io);

  // Authenticate every socket with the short-lived socket token (or the auth cookie)
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth?.token || readCookieToken(socket.handshake.headers.cookie);
      if (!token) return next(new Error('UNAUTHENTICATED'));
      const payload = verifyToken(token);
      const user = await User.findById(payload.id).select('+tokenVersion name role avatar isBlocked');
      if (!user || user.isBlocked || (user.tokenVersion || 0) !== (payload.v || 0)) return next(new Error('UNAUTHENTICATED'));
      socket.user = { id: String(user._id), role: user.role, name: user.name };
      next();
    } catch {
      next(new Error('UNAUTHENTICATED'));
    }
  });

  io.on('connection', (socket) => {
    const { id, role } = socket.user;
    socket.join(`user:${id}`);
    if (role === 'admin') socket.join('admins');

    onlineUsers.set(id, (onlineUsers.get(id) || 0) + 1);
    io.to('admins').emit('presence', { userId: id, online: true });
    if (role === 'admin') io.emit('presence:admins', { online: true });

    socket.on('presence:list', (cb) => {
      if (typeof cb === 'function') cb({ online: [...onlineUsers.keys()], adminOnline: [...io.sockets.adapter.rooms.get('admins') || []].length > 0 });
    });

    socket.on('chat:join', async (conversationId, cb) => {
      try {
        const conv = await Conversation.findById(conversationId).lean();
        const ok = conv && (role === 'admin' || String(conv.customer) === id);
        if (ok) socket.join(`conv:${conversationId}`);
        if (typeof cb === 'function') cb({ ok: Boolean(ok) });
      } catch {
        if (typeof cb === 'function') cb({ ok: false });
      }
    });

    socket.on('chat:leave', (conversationId) => socket.leave(`conv:${conversationId}`));

    socket.on('chat:typing', ({ conversationId, typing }) => {
      if (!socket.rooms.has(`conv:${conversationId}`)) return;
      socket.to(`conv:${conversationId}`).emit('chat:typing', { conversationId, typing: Boolean(typing), name: socket.user.name, role });
    });

    socket.on('disconnect', () => {
      const n = (onlineUsers.get(id) || 1) - 1;
      if (n <= 0) {
        onlineUsers.delete(id);
        io.to('admins').emit('presence', { userId: id, online: false });
      } else onlineUsers.set(id, n);
      if (role === 'admin' && !(io.sockets.adapter.rooms.get('admins')?.size > 0)) {
        io.emit('presence:admins', { online: false });
      }
    });
  });

  return io;
}

module.exports = initSocket;
