import { Server } from 'socket.io';
import { verifyJwt } from '../middleware/auth.js';

let io = null;

const makeRoomName = ({ recipientType, recipientId = null }) => {
  return recipientType === 'admin' ? 'admin' : `user:${recipientId}`;
};

const normalizeScope = (value) => {
  return value === 'admin' ? 'admin' : 'user';
};

const resolveClient = (socket) => {
  const token = socket.handshake.auth?.token || socket.handshake.query?.token;
  const scope = normalizeScope(socket.handshake.auth?.scope || socket.handshake.query?.scope);

  if (!token) {
    return null;
  }

  const auth = verifyJwt(String(token));

  if (scope === 'admin') {
    if (auth.role !== 'admin') {
      return null;
    }

    return {
      room: makeRoomName({ recipientType: 'admin' }),
      scope,
      auth,
    };
  }

  return {
    room: makeRoomName({ recipientType: 'user', recipientId: auth.id }),
    scope,
    auth,
  };
};

export const setupNotificationWebSocket = (server, { allowedOrigins = [] } = {}) => {
  io = new Server(server, {
    path: process.env.NOTIFICATION_SOCKET_PATH || '/ws/notifications',
    cors: {
      origin(origin, callback) {
        if (!origin || allowedOrigins.includes(origin)) {
          return callback(null, true);
        }

        return callback(new Error('Not allowed by CORS'));
      },
      credentials: true,
    },
    transports: ['websocket', 'polling'],
  });

  io.use((socket, next) => {
    try {
      const client = resolveClient(socket);

      if (!client) {
        return next(new Error('Unauthorized'));
      }

      socket.data.auth = client.auth;
      socket.data.scope = client.scope;
      socket.data.room = client.room;
      return next();
    } catch {
      return next(new Error('Unauthorized'));
    }
  });

  io.on('connection', (socket) => {
    socket.join(socket.data.room);
    socket.emit('notification.connected', {
      scope: socket.data.scope,
    });
  });

  return io;
};

export const broadcastToScope = ({ recipientType, recipientId = null, event, payload }) => {
  if (!io) {
    return;
  }

  io.to(makeRoomName({ recipientType, recipientId })).emit(event, payload);
};

export const broadcastNotification = ({ notification, unreadCount }) => {
  if (!notification) {
    return;
  }

  broadcastToScope({
    recipientType: notification.recipient_type,
    recipientId: notification.recipient_id,
    event: 'notification.created',
    payload: {
      notification,
      unread_count: unreadCount,
    },
  });
};

export const broadcastUnreadCount = ({ recipientType, recipientId = null, unreadCount }) => {
  broadcastToScope({
    recipientType,
    recipientId,
    event: 'notification.unread_count',
    payload: {
      unread_count: unreadCount,
    },
  });
};
