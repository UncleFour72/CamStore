import { Op } from 'sequelize';
import { Notification } from '../models/index.js';
import { broadcastNotification, broadcastUnreadCount } from '../websocket/notificationSocket.js';

const toPositiveInt = (value, fallback = null) => {
  const parsed = Number.parseInt(value, 10);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
};

const normalizeNotification = (notification) => {
  const plain = typeof notification?.get === 'function' ? notification.get({ plain: true }) : notification;

  if (!plain) {
    return null;
  }

  return {
    ...plain,
    is_read: Boolean(plain.read_at),
  };
};

const countUnread = async (scope) => {
  return Notification.count({
    where: {
      ...scope,
      read_at: { [Op.is]: null },
    },
  });
};

const getNotificationScope = (notification) => ({
  recipient_type: notification.recipient_type,
  recipient_id: notification.recipient_type === 'admin' ? null : Number(notification.recipient_id),
});

const resolveScope = (req) => {
  const scope = req.query.scope || (req.auth?.role === 'admin' ? 'admin' : 'user');

  if (scope === 'admin') {
    if (req.auth?.role !== 'admin') {
      const error = new Error('Admin permission is required');
      error.statusCode = 403;
      throw error;
    }

    return { recipient_type: 'admin', recipient_id: null };
  }

  return { recipient_type: 'user', recipient_id: Number(req.auth.id) };
};

const createOne = async (payload) => {
  const recipientType = payload.recipient_type;

  if (!['user', 'admin'].includes(recipientType)) {
    const error = new Error('recipient_type must be user or admin');
    error.statusCode = 400;
    throw error;
  }

  if (recipientType === 'user' && !toPositiveInt(payload.recipient_id)) {
    const error = new Error('recipient_id is required for user notifications');
    error.statusCode = 400;
    throw error;
  }

  const data = {
    recipient_type: recipientType,
    recipient_id: recipientType === 'admin' ? null : toPositiveInt(payload.recipient_id),
    title: String(payload.title || '').trim(),
    message: String(payload.message || '').trim(),
    type: payload.type || 'system',
    entity_type: payload.entity_type || null,
    entity_id: payload.entity_id ? String(payload.entity_id) : null,
    data: payload.data || null,
    dedupe_key: payload.dedupe_key || null,
  };

  if (!data.title || !data.message) {
    const error = new Error('title and message are required');
    error.statusCode = 400;
    throw error;
  }

  if (data.dedupe_key) {
    const existing = await Notification.findOne({ where: { dedupe_key: data.dedupe_key } });

    if (existing) {
      return { notification: existing, created: false };
    }
  }

  return {
    notification: await Notification.create(data),
    created: true,
  };
};

export const createNotification = async (req, res, next) => {
  try {
    const payloads = Array.isArray(req.body.notifications) ? req.body.notifications : [req.body];
    const notifications = [];

    for (const payload of payloads) {
      const result = await createOne(payload);
      const normalized = normalizeNotification(result.notification);
      notifications.push(normalized);

      if (result.created) {
        const scope = getNotificationScope(result.notification);
        broadcastNotification({
          notification: normalized,
          unreadCount: await countUnread(scope),
        });
      }
    }

    return res.status(201).json({
      notifications,
    });
  } catch (error) {
    return next(error);
  }
};

export const getNotifications = async (req, res, next) => {
  try {
    const page = toPositiveInt(req.query.page, 1);
    const limit = Math.min(toPositiveInt(req.query.limit, 10), 50);
    const offset = (page - 1) * limit;
    const scope = resolveScope(req);
    const where = { ...scope };

    if (req.query.unread === 'true') {
      where.read_at = { [Op.is]: null };
    }

    const { rows, count } = await Notification.findAndCountAll({
      where,
      limit,
      offset,
      order: [['created_at', 'DESC']],
    });

    const unreadCount = await countUnread(scope);

    return res.json({
      notifications: rows.map(normalizeNotification),
      unread_count: unreadCount,
      pagination: {
        page,
        limit,
        total: count,
        total_pages: Math.ceil(count / limit),
      },
    });
  } catch (error) {
    return next(error);
  }
};

export const getUnreadCount = async (req, res, next) => {
  try {
    const scope = resolveScope(req);
    const unreadCount = await countUnread(scope);

    return res.json({ unread_count: unreadCount });
  } catch (error) {
    return next(error);
  }
};

export const markNotificationRead = async (req, res, next) => {
  try {
    const scope = resolveScope(req);
    const notification = await Notification.findOne({
      where: {
        id: req.params.id,
        ...scope,
      },
    });

    if (!notification) {
      return res.status(404).json({ message: 'Notification not found' });
    }

    if (!notification.read_at) {
      await notification.update({ read_at: new Date() });
    }

    const normalized = normalizeNotification(notification);
    broadcastUnreadCount({
      recipientType: scope.recipient_type,
      recipientId: scope.recipient_id,
      unreadCount: await countUnread(scope),
    });

    return res.json({ notification: normalized });
  } catch (error) {
    return next(error);
  }
};

export const markAllNotificationsRead = async (req, res, next) => {
  try {
    const scope = resolveScope(req);
    const [updated] = await Notification.update(
      { read_at: new Date() },
      {
        where: {
          ...scope,
          read_at: { [Op.is]: null },
        },
      }
    );

    broadcastUnreadCount({
      recipientType: scope.recipient_type,
      recipientId: scope.recipient_id,
      unreadCount: await countUnread(scope),
    });

    return res.json({ updated });
  } catch (error) {
    return next(error);
  }
};
