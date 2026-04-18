import { useEffect, useState } from 'react';
import PlaceCard from '../components/place/PlaceCard';
import UserRelations from '../components/profile/UserRelations';
import {
  followUserRequest,
  getUserProfileRequest,
  unfollowUserRequest,
} from '../api/usersApi';
import { getErrorMessage } from '../utils/errors';
import { normalizeUserProfile } from '../utils/users';

export default function UserProfilePage({
  userId,
  onOpenDetails,
  onOpenOnMap,
  onOpenUserProfile,
}) {
  const [profile, setProfile] = useState(null);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isFollowSubmitting, setIsFollowSubmitting] = useState(false);

  useEffect(() => {
    if (!userId) return;

    setIsLoading(true);
    setError('');

    getUserProfileRequest(userId)
      .then((data) => setProfile(normalizeUserProfile(data)))
      .catch((err) => setError(getErrorMessage(err)))
      .finally(() => setIsLoading(false));
  }, [userId]);

  const handleFollowToggle = async () => {
    if (!profile || profile.isCurrentUser) return;

    setIsFollowSubmitting(true);
    setError('');

    try {
      if (profile.isFollowedByCurrentUser) {
        await unfollowUserRequest(profile.id);
        setProfile((prev) => ({
          ...prev,
          isFollowedByCurrentUser: false,
          followersCount: Math.max(0, prev.followersCount - 1),
        }));
      } else {
        await followUserRequest(profile.id);
        setProfile((prev) => ({
          ...prev,
          isFollowedByCurrentUser: true,
          followersCount: prev.followersCount + 1,
        }));
      }
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setIsFollowSubmitting(false);
    }
  };

  if (isLoading && !profile) {
    return (
      <main className="page">
        <section className="profile-card">
          <h1>Загрузка профиля...</h1>
        </section>
      </main>
    );
  }

  if (!profile) {
    return (
      <main className="page">
        <p className="auth-form__error">{error || 'Профиль не найден'}</p>
      </main>
    );
  }

  const avatarLetter = profile.nickname.charAt(0).toUpperCase();

  return (
    <main className="page">
      <section className="profile-card profile-card--large">
        {profile.avatarUrl ? (
          <img
            src={profile.avatarUrl}
            alt="Аватар профиля"
            className="profile-card__avatar-image-large"
          />
        ) : (
          <div className="profile-card__avatar profile-card__avatar--large">
            {avatarLetter}
          </div>
        )}

        <div className="profile-card__body">
          <div className="profile-card__top">
            <div>
              <h1>@{profile.nickname}</h1>
              <p>
                {[profile.name, profile.surname].filter(Boolean).join(' ') ||
                  'Пользователь Hidden Trails'}
              </p>
            </div>

            {!profile.isCurrentUser ? (
              <button
                type="button"
                className="primary-button"
                onClick={handleFollowToggle}
                disabled={isFollowSubmitting}
              >
                {profile.isFollowedByCurrentUser ? 'Отписаться' : 'Подписаться'}
              </button>
            ) : null}
          </div>

          <div className="profile-details">
            <div className="profile-details__item">
              <span className="profile-details__label">Рейтинг</span>
              <span>{profile.rating}</span>
            </div>
            <div className="profile-details__item">
              <span className="profile-details__label">Подписчики</span>
              <span>{profile.followersCount}</span>
            </div>
            <div className="profile-details__item">
              <span className="profile-details__label">Подписки</span>
              <span>{profile.followingCount}</span>
            </div>
          </div>

          {error ? <p className="auth-form__error">{error}</p> : null}
        </div>
      </section>

      <section className="profile-relations-grid">
        <UserRelations
          title="Подписчики"
          users={profile.followers}
          emptyText="Подписчиков пока нет"
          onOpenUserProfile={onOpenUserProfile}
        />
        <UserRelations
          title="Подписки"
          users={profile.following}
          emptyText="Подписок пока нет"
          onOpenUserProfile={onOpenUserProfile}
        />
      </section>

      <section className="profile-achievements">
        <h2 className="section-title">Достижения</h2>
        {profile.achievements.length > 0 ? (
          <div className="achievements-grid">
            {profile.achievements.map((achievement) => (
              <article key={achievement.id || achievement.title} className="achievement-card">
                {achievement.pictureUrl ? (
                  <img
                    src={achievement.pictureUrl}
                    alt={achievement.title}
                    className="achievement-card__image"
                  />
                ) : (
                  <div className="achievement-card__placeholder">🏆</div>
                )}
                <div className="achievement-card__content">
                  <h3>{achievement.title}</h3>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <p className="profile-section-header__hint">Достижений пока нет</p>
        )}
      </section>

      <section>
        <h2 className="section-title">Публикации</h2>
        {profile.geotags.length > 0 ? (
          <div className="feed-grid">
            {profile.geotags.map((place) => (
              <PlaceCard
                key={place.id}
                place={place}
                onOpenDetails={onOpenDetails}
                onOpenOnMap={onOpenOnMap}
                onOpenUserProfile={onOpenUserProfile}
              />
            ))}
          </div>
        ) : (
          <p className="profile-section-header__hint">Публикаций пока нет</p>
        )}
      </section>
    </main>
  );
}
