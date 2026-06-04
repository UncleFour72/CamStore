import api, { unwrapData } from './api.js';

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
