import { useCallback, useEffect, useState } from 'react';
import {
  getNotificationsRequest,
  readAllNotificationsRequest,
} from '../api/notificationsApi';
import { getErrorMessage } from '../utils/errors';

function formatDate(value) {
  if (!value) return '';
  return new Date(value).toLocaleString('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function NotificationsPage({
  onOpenDetails,
  onNotificationsChanged,
}) {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const loadNotifications = useCallback(async () => {
    setIsLoading(true);
    setError('');

    try {
      const data = await getNotificationsRequest();
      setNotifications(data?.notifications || []);
      setUnreadCount(data?.unread_count || 0);
      onNotificationsChanged?.(data?.unread_count || 0);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  }, [onNotificationsChanged]);

  useEffect(() => {
    loadNotifications();
  }, [loadNotifications]);

  const handleReadAll = async () => {
    try {
      await readAllNotificationsRequest();
      setNotifications((prev) => prev.map((item) => ({ ...item, is_read: true })));
      setUnreadCount(0);
      onNotificationsChanged?.(0);
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  return (
    <main className="page">
      <section className="hero">
        <h1>Уведомления</h1>
        <p>Здесь появляются ответы на твои комментарии и другие важные события.</p>
      </section>

      <section className="people-section">
        <div className="profile-section-header">
          <div>
            <h2 className="section-title">Колокольчик</h2>
            <span className="profile-section-header__hint">
              {unreadCount > 0 ? `Непрочитанных: ${unreadCount}` : 'Новых уведомлений нет'}
            </span>
          </div>

          <button
            type="button"
            className="secondary-button"
            onClick={handleReadAll}
            disabled={unreadCount === 0}
          >
            Прочитать всё
          </button>
        </div>

        {error ? <p className="auth-form__error">{error}</p> : null}

        {isLoading ? <p className="page-state">Загружаем уведомления...</p> : null}

        {!isLoading && notifications.length === 0 ? (
          <p className="page-state">Пока пусто.</p>
        ) : (
          <div className="notifications-list">
            {notifications.map((notification) => (
              <button
                key={notification.id}
                type="button"
                className={`notification-item ${
                  notification.is_read ? '' : 'notification-item--unread'
                }`}
                onClick={() => {
                  if (notification.geotag_id) {
                    onOpenDetails?.({ id: notification.geotag_id });
                  }
                }}
              >
                <div>
                  <strong>{notification.text}</strong>
                  <small>{formatDate(notification.created_at)}</small>
                </div>
              </button>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
