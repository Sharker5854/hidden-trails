import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  getModerationDashboardRequest,
  getModerationQueueRequest,
  moderateGeotagRequest,
  updateModeratorRoleRequest,
} from '../api/moderationApi';
import { getUsersPageRequest, searchUsersRequest } from '../api/usersApi';
import { getErrorMessage } from '../utils/errors';
import { normalizeGeotags } from '../utils/geotags';
import { normalizeUserMini, normalizeUsersPage } from '../utils/users';

const MODERATION_ACTIONS = [
  { value: 'approve', label: 'Одобрить' },
  { value: 'revision', label: 'На доработку' },
  { value: 'block', label: 'Заблокировать' },
];

function ModerationQueueCard({
  place,
  comment,
  action,
  isSubmitting,
  onChangeComment,
  onChangeAction,
  onSubmit,
  onOpenUserProfile,
}) {
  return (
    <article className="moderation-card">
      <div className="moderation-card__media">
        {place.image ? (
          <img src={place.image} alt={place.title} className="moderation-card__image" />
        ) : (
          <div className="moderation-card__image moderation-card__image--empty">
            {place.title?.charAt(0)?.toUpperCase() || 'H'}
          </div>
        )}
      </div>

      <div className="moderation-card__body">
        <div className="moderation-card__header">
          <div>
            <span className={`moderation-status moderation-status--${place.moderationStatus}`}>
              {place.moderationStatus === 'revision'
                ? 'На доработке'
                : place.moderationStatus === 'approved'
                ? 'Одобрено'
                : 'На проверке'}
            </span>
            <h3>{place.title}</h3>
          </div>
          <button
            type="button"
            className="place-card__author-button"
            onClick={() => onOpenUserProfile?.(place.authorId)}
          >
            @{place.author}
          </button>
        </div>

        <p className="moderation-card__text">{place.description || 'Без описания'}</p>

        {place.moderatorComment ? (
          <div className="moderation-card__note">
            <strong>Последний комментарий:</strong> {place.moderatorComment}
          </div>
        ) : null}

        <div className="moderation-card__stats">
          <span>{place.likes} лайков</span>
          <span>{place.views} просмотров</span>
        </div>

        <div className="moderation-card__controls">
          <select
            className="auth-form__input"
            value={action}
            onChange={(event) => onChangeAction(event.target.value)}
          >
            {MODERATION_ACTIONS.map((item) => (
              <option key={item.value} value={item.value}>
                {item.label}
              </option>
            ))}
          </select>

          <textarea
            className="comment-form__textarea"
            value={comment}
            onChange={(event) => onChangeComment(event.target.value)}
            placeholder="Комментарий модератора"
          />
        </div>

        <div className="moderation-card__actions">
          <button
            type="button"
            className="primary-button"
            onClick={onSubmit}
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Сохраняем...' : 'Применить'}
          </button>
        </div>
      </div>
    </article>
  );
}

export default function ModerationPage({ user, onOpenUserProfile }) {
  const [queue, setQueue] = useState([]);
  const [dashboard, setDashboard] = useState({ moderators: [] });
  const [usersPage, setUsersPage] = useState({
    users: [],
    page: 1,
    totalPages: 1,
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [error, setError] = useState('');
  const [commentById, setCommentById] = useState({});
  const [actionById, setActionById] = useState({});
  const [submittingId, setSubmittingId] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isAdminLoading, setIsAdminLoading] = useState(false);

  const canManageRoles = Boolean(user?.is_admin);

  const loadQueue = useCallback(async () => {
    setIsLoading(true);
    setError('');

    try {
      const data = await getModerationQueueRequest();
      const items = normalizeGeotags(data?.geotags || []);
      setQueue(items);
      setCommentById(
        items.reduce(
          (acc, item) => ({ ...acc, [item.id]: item.moderatorComment || '' }),
          {}
        )
      );
      setActionById(
        items.reduce(
          (acc, item) => ({
            ...acc,
            [item.id]: item.moderationStatus === 'revision' ? 'revision' : 'approve',
          }),
          {}
        )
      );
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  }, []);

  const loadDashboard = useCallback(async () => {
    if (!canManageRoles) return;

    setIsAdminLoading(true);
    setError('');
    try {
      const [dashboardData, usersData] = await Promise.all([
        getModerationDashboardRequest(),
        getUsersPageRequest({ page: 1, pageSize: 20 }),
      ]);
      setDashboard(dashboardData || { moderators: [] });
      setUsersPage(normalizeUsersPage(usersData));
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setIsAdminLoading(false);
    }
  }, [canManageRoles]);

  useEffect(() => {
    loadQueue();
    loadDashboard();
  }, [loadDashboard, loadQueue]);

  const moderatorMap = useMemo(() => {
    return new Map(
      (dashboard?.moderators || []).map((moderator) => [
        moderator.moderator_id,
        moderator,
      ])
    );
  }, [dashboard]);

  const handleModerate = async (placeId) => {
    const action = actionById[placeId] || 'approve';
    const moderatorComment = commentById[placeId] || '';

    setSubmittingId(placeId);
    setError('');

    try {
      await moderateGeotagRequest(placeId, { action, moderator_comment: moderatorComment });
      setQueue((prev) => prev.filter((item) => item.id !== placeId));
      await loadDashboard();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSubmittingId(null);
    }
  };

  const handleRoleToggle = async (targetUser) => {
    setIsAdminLoading(true);
    setError('');

    try {
      await updateModeratorRoleRequest(targetUser.id, !targetUser.isModer);
      await loadDashboard();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setIsAdminLoading(false);
    }
  };

  const handleSearch = async (event) => {
    event.preventDefault();
    const query = searchQuery.trim();
    if (!query) {
      setSearchResults([]);
      return;
    }

    setIsAdminLoading(true);
    setError('');
    try {
      const data = await searchUsersRequest(query);
      setSearchResults((data?.users || []).map(normalizeUserMini).filter(Boolean));
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setIsAdminLoading(false);
    }
  };

  const roleUsers = searchQuery.trim() ? searchResults : usersPage.users;

  return (
    <main className="page">
      <section className="hero">
        <h1>Проверка</h1>
        <p>Здесь собираются карточки пользователей и история решений команды модерации.</p>
      </section>

      {error ? <p className="auth-form__error">{error}</p> : null}

      <section className="people-section">
        <div className="profile-section-header">
          <div>
            <h2 className="section-title">Очередь карточек</h2>
            <span className="profile-section-header__hint">
              {isLoading ? 'Обновляем...' : `${queue.length} ждут решения`}
            </span>
          </div>
        </div>

        {queue.length > 0 ? (
          <div className="moderation-grid">
            {queue.map((place) => (
              <ModerationQueueCard
                key={place.id}
                place={place}
                comment={commentById[place.id] || ''}
                action={actionById[place.id] || 'approve'}
                isSubmitting={submittingId === place.id}
                onChangeComment={(value) =>
                  setCommentById((prev) => ({ ...prev, [place.id]: value }))
                }
                onChangeAction={(value) =>
                  setActionById((prev) => ({ ...prev, [place.id]: value }))
                }
                onSubmit={() => handleModerate(place.id)}
                onOpenUserProfile={onOpenUserProfile}
              />
            ))}
          </div>
        ) : (
          <p className="page-state">Сейчас очередь пустая.</p>
        )}
      </section>

      {canManageRoles ? (
        <>
          <section className="people-section">
            <div className="profile-section-header">
              <div>
                <h2 className="section-title">Big Bro</h2>
                <span className="profile-section-header__hint">
                  {isAdminLoading ? 'Собираем статистику...' : 'Оценка работы модераторов'}
                </span>
              </div>
            </div>

            <div className="moderator-summary-list">
              {(dashboard?.moderators || []).map((moderator) => (
                <article key={moderator.moderator_id} className="moderator-summary-card">
                  <div className="moderator-summary-card__header">
                    <button
                      type="button"
                      className="place-card__author-button"
                      onClick={() => onOpenUserProfile?.(moderator.moderator_id)}
                    >
                      @{moderator.moderator_nickname}
                    </button>
                    <div className="moderator-summary-card__stats">
                      <span>Одобрил: {moderator.approved_count}</span>
                      <span>Вернул: {moderator.revision_count}</span>
                      <span>Заблокировал: {moderator.blocked_count}</span>
                    </div>
                  </div>

                  {moderator.actions?.length > 0 ? (
                    <div className="moderator-actions-list">
                      {moderator.actions.map((action) => (
                        <div key={action.id} className="moderator-actions-list__item">
                          <strong>{action.geotag_title}</strong>
                          <span>
                            {action.action === 'approve'
                              ? 'одобрил'
                              : action.action === 'revision'
                              ? 'вернул на доработку'
                              : 'заблокировал'}{' '}
                            карточку @{action.author_nickname}
                          </span>
                          {action.comment ? <small>{action.comment}</small> : null}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="profile-section-header__hint">Пока без действий.</p>
                  )}
                </article>
              ))}
            </div>
          </section>

          <section className="people-section">
            <div className="profile-section-header">
              <div>
                <h2 className="section-title">Права модерации</h2>
                <span className="profile-section-header__hint">
                  Назначай модераторов и снимай права, когда нужно.
                </span>
              </div>
            </div>

            <form className="user-search-form" onSubmit={handleSearch}>
              <input
                className="auth-form__input"
                type="search"
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder="Найти пользователя"
              />
              <button className="primary-button" type="submit" disabled={isAdminLoading}>
                Найти
              </button>
            </form>

            <div className="people-list">
              {roleUsers.map((targetUser) => {
                const moderatorStats = moderatorMap.get(targetUser.id);

                return (
                  <div key={targetUser.id} className="user-result user-result--admin">
                    <button
                      type="button"
                      className="user-result__identity"
                      onClick={() => onOpenUserProfile?.(targetUser.id)}
                    >
                      {targetUser.avatarUrl ? (
                        <img src={targetUser.avatarUrl} alt={targetUser.nickname} />
                      ) : (
                        <span>{targetUser.nickname.charAt(0).toUpperCase()}</span>
                      )}
                      <div>
                        <strong>@{targetUser.nickname}</strong>
                        <small>
                          {targetUser.rating} баллов
                          {targetUser.isAdmin ? ' • Big Bro' : targetUser.isModer ? ' • модератор' : ''}
                        </small>
                        {moderatorStats ? (
                          <small>
                            {moderatorStats.approved_count} / {moderatorStats.revision_count} / {moderatorStats.blocked_count}
                          </small>
                        ) : null}
                      </div>
                    </button>

                    {!targetUser.isAdmin ? (
                      <button
                        type="button"
                        className={targetUser.isModer ? 'secondary-button' : 'primary-button'}
                        onClick={() => handleRoleToggle(targetUser)}
                        disabled={isAdminLoading}
                      >
                        {targetUser.isModer ? 'Снять права' : 'Сделать модератором'}
                      </button>
                    ) : null}
                  </div>
                );
              })}
            </div>
          </section>
        </>
      ) : null}
    </main>
  );
}
