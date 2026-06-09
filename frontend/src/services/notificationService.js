import { io } from 'socket.io-client';
import api, { TOKEN_KEY, unwrapData } from './api.js';

const getSocketConfig = () => {
  const configuredSocketUrl = import.meta.env.VITE_NOTIFICATION_SOCKET_URL;
  const configuredSocketPath = import.meta.env.VITE_NOTIFICATION_SOCKET_PATH;
  const legacyWsUrl = import.meta.env.VITE_NOTIFICATION_WS_URL;

  if (configuredSocketUrl) {
    return {
      url: configuredSocketUrl,
      path: configuredSocketPath || '/ws/notifications',
    };
  }

  if (legacyWsUrl) {
    const url = new URL(legacyWsUrl);
    const path = url.pathname || '/ws/notifications';
    url.protocol = url.protocol === 'wss:' ? 'https:' : 'http:';
    url.pathname = '';
    url.search = '';

    return {
      url: url.toString().replace(/\/$/, ''),
      path,
    };
  }

  const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api';
  const url = new URL(apiBaseUrl);
  const isLocalGateway = ['localhost', '127.0.0.1'].includes(url.hostname) && url.port === '3000';

  if (isLocalGateway) {
    url.port = '3008';
  }

  url.pathname = '';
  url.search = '';

  return {
    url: url.toString().replace(/\/$/, ''),
    path: configuredSocketPath || '/ws/notifications',
  };
};

export const connectNotificationSocket = ({ scope = 'user', onNotification, onUnreadCount, onError } = {}) => {
  const token = localStorage.getItem(TOKEN_KEY);

  if (!token) {
    return () => {};
  }

  const { url, path } = getSocketConfig();
  const socket = io(url, {
    path,
    auth: {
      token,
      scope,
    },
    query: {
      scope,
    },
    transports: ['websocket', 'polling'],
    reconnection: true,
    reconnectionAttempts: Infinity,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 30000,
  });

  socket.on('notification.created', (payload = {}) => {
    onNotification?.(payload.notification, Number(payload.unread_count || 0));
  });

  socket.on('notification.unread_count', (payload = {}) => {
    onUnreadCount?.(Number(payload.unread_count || 0));
  });

  socket.on('connect_error', (error) => {
    onError?.(error);

    if (error.message === 'Unauthorized') {
      socket.disconnect();
    }
  });

  return () => {
    socket.disconnect();
  };
};

export const getNotifications = async ({ scope = 'user', page = 1, limit = 8, unread = false } = {}) => {
  const data = await api
    .get('/notifications', {
      params: {
        scope,
        page,
        limit,
        unread: unread ? 'true' : undefined,
      },
    })
    .then(unwrapData);

  return {
    items: data.notifications || [],
    unreadCount: Number(data.unread_count || 0),
    pagination: data.pagination || {},
  };
};

export const getUnreadCount = async (scope = 'user') => {
  const data = await api.get('/notifications/unread-count', { params: { scope } }).then(unwrapData);
  return Number(data.unread_count || 0);
};

export const markNotificationRead = async (id, scope = 'user') => {
  const data = await api.patch(`/notifications/${id}/read`, null, { params: { scope } }).then(unwrapData);
  return data.notification;
};

export const markAllNotificationsRead = async (scope = 'user') => {
  return api.patch('/notifications/read-all', null, { params: { scope } }).then(unwrapData);
};
