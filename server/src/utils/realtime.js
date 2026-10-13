/** Small helpers so controllers can push realtime events without knowing Socket.io internals. */
let io = null;

module.exports = {
  setIO(instance) {
    io = instance;
  },
  getIO() {
    return io;
  },
  toAdmins(event, payload) {
    io?.to('admins').emit(event, payload);
  },
  toUser(userId, event, payload) {
    io?.to(`user:${userId}`).emit(event, payload);
  },
  toConversation(conversationId, event, payload) {
    io?.to(`conv:${conversationId}`).emit(event, payload);
  },
  /** Lightweight in-app notification shown as a toast in the UI. */
  notifyAdmins(title, body, link, type = 'info') {
    io?.to('admins').emit('notify', { title, body, link, type, at: new Date() });
  },
  notifyUser(userId, title, body, link, type = 'info') {
    io?.to(`user:${userId}`).emit('notify', { title, body, link, type, at: new Date() });
  },
};
