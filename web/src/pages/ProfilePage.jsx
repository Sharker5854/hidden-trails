import { useEffect, useMemo, useState } from 'react';
import PlaceCard from '../components/place/PlaceCard';
import UserRelations from '../components/profile/UserRelations';
import { getUserProfileRequest } from '../api/usersApi';
import { getMyRoutesRequest } from '../api/routesApi';
import { useProfile } from '../hooks/useProfile';
import { resolveAvatarUrl } from '../utils/assets';
import { normalizeRoutes } from '../utils/routes';
import { normalizeUserProfile } from '../utils/users';

function profileToFormState(profile) {
  return {
    email: profile?.email || '',
    nickname: profile?.nickname || '',
    phone: profile?.phone || '',
    name: profile?.name || '',
    surname: profile?.surname || '',
  };
}

export default function ProfilePage({
  places = [],
  onOpenDetails,
  onOpenOnMap,
  onOpenUserProfile,
  onProfileLoaded,
}) {
  const {
    profile,
    isLoading,
    error,
    loadProfile,
    updateProfile,
    togglePremium,
  } = useProfile();
  const [publicProfile, setPublicProfile] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [avatarFile, setAvatarFile] = useState(null);
  const [savedRoutes, setSavedRoutes] = useState([]);
  const [successMessage, setSuccessMessage] = useState('');
  const [formState, setFormState] = useState(() => profileToFormState(null));

  useEffect(() => {
    const fetchProfile = async () => {
      const loadedProfile = await loadProfile();
      onProfileLoaded?.(loadedProfile);
    };

    fetchProfile();
  }, [loadProfile, onProfileLoaded]);

  useEffect(() => {
    if (!profile) return;
    onProfileLoaded?.(profile);
  }, [profile, onProfileLoaded]);

  useEffect(() => {
    if (!profile?.id) return;

    getUserProfileRequest(profile.id)
      .then((data) => setPublicProfile(normalizeUserProfile(data)))
      .catch(() => {});

    getMyRoutesRequest()
      .then((data) => setSavedRoutes(normalizeRoutes(data?.routes)))
      .catch(() => {});
  }, [profile?.id]);

  const avatarLetter = useMemo(() => {
    return (
      (isEditing ? formState.nickname : profile?.nickname)?.trim()?.charAt(0)?.toUpperCase() ||
      (isEditing ? formState.email : profile?.email)?.trim()?.charAt(0)?.toUpperCase() ||
      'U'
    );
  }, [formState.nickname, formState.email, isEditing, profile?.nickname, profile?.email]);
  const avatarUrl = resolveAvatarUrl(profile?.avatar_url);
  const ownPlaces =
    publicProfile?.geotags || places.filter((place) => place.author === profile?.nickname);

  const handleChange = (field) => (event) => {
    setFormState((prev) => ({
      ...prev,
      [field]: event.target.value,
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSuccessMessage('');

    const payload = {
      email: formState.email,
      nickname: formState.nickname,
      phone: formState.phone,
      name: formState.name,
      surname: formState.surname,
      is_premium: profile?.is_premium || false,
    };

    if (avatarFile) {
      payload.avatar_url = avatarFile;
    }

    const updatedProfile = await updateProfile(payload);
    setFormState(profileToFormState(updatedProfile));
    onProfileLoaded?.(updatedProfile);

    setIsEditing(false);
    setAvatarFile(null);
    setSuccessMessage('Профиль сохранён');
  };

  if (isLoading && !profile) {
    return (
      <main className="page">
        <section className="profile-card">
          <div>
            <h1>Загрузка профиля...</h1>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="page">
      <section className="profile-card profile-card--large">
        {avatarUrl ? (
          <img
            src={avatarUrl}
            alt="Аватар профиля"
            className="profile-card__avatar-image-large"
          />
        ) : (
          <div className="profile-card__avatar profile-card__avatar--large">
            {avatarLetter}
          </div>
        )}

        <div className="profile-card__body">
          {!isEditing ? (
            <>
              <div className="profile-card__top">
                <div>
                  <h1>{profile?.nickname || 'Пользователь'}</h1>
                  <p>{profile?.email || 'Нет email'}</p>
                </div>

                <button
                  className="secondary-button"
                  onClick={() => {
                    setFormState(profileToFormState(profile));
                    setSuccessMessage('');
                    setIsEditing(true);
                  }}
                >
                  Редактировать профиль
                </button>
                <button
                  className={profile?.is_premium ? 'primary-button' : 'secondary-button'}
                  onClick={async () => {
                    const updatedProfile = await togglePremium();
                    onProfileLoaded?.(updatedProfile);
                    setSuccessMessage(
                      updatedProfile.is_premium
                        ? 'Премиум включён. Можно строить маршруты.'
                        : 'Премиум выключен.'
                    );
                  }}
                  disabled={isLoading}
                >
                  {profile?.is_premium ? 'Премиум активен' : 'Получить премиум'}
                </button>
              </div>

              <div className="profile-details">
                <div className="profile-details__item">
                  <span className="profile-details__label">Имя</span>
                  <span>{profile?.name || '—'}</span>
                </div>

                <div className="profile-details__item">
                  <span className="profile-details__label">Фамилия</span>
                  <span>{profile?.surname || '—'}</span>
                </div>

                <div className="profile-details__item">
                  <span className="profile-details__label">Телефон</span>
                  <span>{profile?.phone || '—'}</span>
                </div>

                <div className="profile-details__item">
                  <span className="profile-details__label">Рейтинг</span>
                  <span>{profile?.rating ?? 0}</span>
                </div>
              </div>

              {successMessage ? (
                <p className="auth-form__success">{successMessage}</p>
              ) : null}

              {error ? <p className="auth-form__error">{error}</p> : null}
            </>
          ) : (
            <form className="profile-edit-form" onSubmit={handleSubmit}>
              <div className="profile-card__top">
                <h1>Редактирование профиля</h1>
              </div>

              <label className="auth-form__label">
                Никнейм
                <input
                  className="auth-form__input"
                  type="text"
                  value={formState.nickname}
                  onChange={handleChange('nickname')}
                />
              </label>

              <label className="auth-form__label">
                Email
                <input
                  className="auth-form__input"
                  type="email"
                  value={formState.email}
                  onChange={handleChange('email')}
                />
              </label>

              <label className="auth-form__label">
                Имя
                <input
                  className="auth-form__input"
                  type="text"
                  value={formState.name}
                  onChange={handleChange('name')}
                />
              </label>

              <label className="auth-form__label">
                Фамилия
                <input
                  className="auth-form__input"
                  type="text"
                  value={formState.surname}
                  onChange={handleChange('surname')}
                />
              </label>

              <label className="auth-form__label">
                Телефон
                <input
                  className="auth-form__input"
                  type="text"
                  value={formState.phone}
                  onChange={handleChange('phone')}
                />
              </label>

              <label className="auth-form__label">
                Аватар
                <input
                  className="auth-form__input"
                  type="file"
                  accept="image/*"
                  onChange={(event) => {
                    const file = event.target.files?.[0] || null;
                    setAvatarFile(file);
                  }}
                />
              </label>

              {error ? <p className="auth-form__error">{error}</p> : null}

              <div className="profile-edit-form__actions">
                <button
                  type="submit"
                  className="primary-button"
                  disabled={isLoading}
                >
                  {isLoading ? 'Сохраняем...' : 'Сохранить'}
                </button>

                <button
                  type="button"
                  className="secondary-button"
                  onClick={() => {
                    setIsEditing(false);
                    setAvatarFile(null);
                    setSuccessMessage('');
                  }}
                >
                  Отмена
                </button>
              </div>
            </form>
          )}
        </div>
      </section>

      <section className="profile-relations-grid">
        <UserRelations
          title="Подписчики"
          users={publicProfile?.followers || []}
          emptyText="Подписчиков пока нет"
          onOpenUserProfile={onOpenUserProfile}
        />
        <UserRelations
          title="Подписки"
          users={publicProfile?.following || []}
          emptyText="Подписок пока нет"
          onOpenUserProfile={onOpenUserProfile}
        />
      </section>

      <section className="profile-achievements">
        <h2 className="section-title">Достижения</h2>

        {publicProfile?.achievements?.length > 0 ? (
          <div className="achievements-grid">
            {publicProfile.achievements.map((achievement) => (
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
        <h2 className="section-title">Мои маршруты</h2>
        {savedRoutes.length > 0 ? (
          <div className="routes-profile-grid">
            {savedRoutes.map((route) => (
              <article key={route.id} className="route-profile-card">
                <h3>{route.title}</h3>
                <p>{route.distanceKm} км · {route.durationMin} мин</p>
                <span>{route.isPublic ? 'Опубликован' : 'В профиле'}</span>
              </article>
            ))}
          </div>
        ) : (
          <p className="profile-section-header__hint">Маршрутов пока нет</p>
        )}
      </section>

      <section>
        <h2 className="section-title">Мои публикации</h2>
        {ownPlaces.length > 0 ? (
          <div className="feed-grid">
            {ownPlaces.map((place) => (
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
