import { Bell, CheckCheck, Inbox } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { useSelector } from 'react-redux';
import * as notificationService from '../../services/notificationService.js';
import { classNames } from '../../utils/helpers.js';

const formatTime = (value) => {
  if (!value) {
    return '';
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return '';
  }

  return new Intl.DateTimeFormat('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
};

export default function NotificationBell({ scope = 'user', className = '' }) {
  const { isAuthenticated, user } = useSelector((state) => state.auth);
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const wrapperRef = useRef(null);
  const canRender = isAuthenticated && (scope !== 'admin' || user?.role === 'admin');

  const loadCount = async () => {
    if (!canRender) {
      return;
    }

    try {
      setUnreadCount(await notificationService.getUnreadCount(scope));
    } catch {
      // Keep header quiet if notification-service is temporarily unavailable.
    }
  };

  const loadNotifications = async () => {
    if (!canRender) {
      return;
    }

    setIsLoading(true);

    try {
      const data = await notificationService.getNotifications({ scope, limit: 8 });
      setNotifications(data.items);
      setUnreadCount(data.unreadCount);
    } catch {
      setNotifications([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadCount();
    const interval = window.setInterval(loadCount, 60000);
    return () => window.clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canRender, scope]);

  useEffect(() => {
    if (!canRender) {
      return undefined;
    }

    return notificationService.connectNotificationSocket({
      scope,
      onNotification(notification, nextUnreadCount) {
        setUnreadCount(nextUnreadCount);
        setNotifications((current) => {
          if (!notification || current.some((item) => Number(item.id) === Number(notification.id))) {
            return current;
          }

          return [notification, ...current].slice(0, 8);
        });
      },
      onUnreadCount(nextUnreadCount) {
        setUnreadCount(nextUnreadCount);
      },
    });
  }, [canRender, scope]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (!canRender) {
    return null;
  }

  const openPanel = () => {
    setIsOpen((current) => {
      const next = !current;

      if (next) {
        loadNotifications();
      }

      return next;
    });
  };

  const markOneRead = async (notification) => {
    if (notification.is_read) {
      return;
    }

    await notificationService.markNotificationRead(notification.id, scope);
    await loadNotifications();
  };

  const markAllRead = async () => {
    await notificationService.markAllNotificationsRead(scope);
    await loadNotifications();
  };

  return (
    <div className={classNames('notification-bell', className)} ref={wrapperRef}>
      <button
        type="button"
        className="notification-trigger"
        aria-label="Thông báo"
        aria-expanded={isOpen}
        onClick={openPanel}
      >
        <Bell size={22} />
        {unreadCount > 0 && <span className="notification-count">{unreadCount > 9 ? '9+' : unreadCount}</span>}
      </button>

      {isOpen && (
        <div className="notification-panel">
          <div className="notification-panel-head">
            <div>
              <strong>Thông báo</strong>
              <small>{unreadCount > 0 ? `${unreadCount} chưa đọc` : 'Đã cập nhật'}</small>
            </div>
            <button type="button" onClick={markAllRead} disabled={unreadCount === 0}>
              <CheckCheck size={16} />
              <span>Đã đọc</span>
            </button>
          </div>

          <div className="notification-list">
            {isLoading ? (
              <div className="notification-empty">Đang tải thông báo...</div>
            ) : notifications.length === 0 ? (
              <div className="notification-empty">
                <Inbox size={22} />
                <span>Chưa có thông báo mới</span>
              </div>
            ) : (
              notifications.map((notification) => (
                <button
                  key={notification.id}
                  type="button"
                  className={classNames('notification-item', !notification.is_read && 'unread')}
                  onClick={() => markOneRead(notification)}
                >
                  <span className="notification-dot" />
                  <span>
                    <strong>{notification.title}</strong>
                    <small>{notification.message}</small>
                    <em>{formatTime(notification.created_at)}</em>
                  </span>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
