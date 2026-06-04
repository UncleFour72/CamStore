import { Router } from 'express';
import {
  createNotification,
  getNotifications,
  getUnreadCount,
  markAllNotificationsRead,
  markNotificationRead,
} from '../controllers/notificationController.js';
import { authenticate, requireInternal } from '../middleware/auth.js';

const router = Router();

router.post('/notifications/internal', requireInternal, createNotification);
router.get('/notifications', authenticate, getNotifications);
router.get('/notifications/unread-count', authenticate, getUnreadCount);
router.patch('/notifications/read-all', authenticate, markAllNotificationsRead);
router.patch('/notifications/:id/read', authenticate, markNotificationRead);

export default router;
