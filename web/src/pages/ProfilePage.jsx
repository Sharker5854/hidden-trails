import { useEffect, useMemo, useState } from 'react';
import { mockPlaces } from '../data/mockPlaces';
import PlaceCard from '../components/place/PlaceCard';
import { useProfile } from '../hooks/useProfile';

export default function ProfilePage({ onOpenDetails, onOpenOnMap, onProfileLoaded }) {
  const { profile, isLoading, error, loadProfile, updateProfile } = useProfile();

  const [isEditing, setIsEditing] = useState(false);
  const [avatarFile, setAvatarFile] = useState(null);
  const [successMessage, setSuccessMessage] = useState('');

  const [formState, setFormState] = useState({
    email: '',
    nickname: '',
    phone: '',
    name: '',
    surname: '',
    rating: 0,
  });

  useEffect(() => {
    const fetchProfile = async () => {
      const loadedProfile = await loadProfile();
      if (onProfileLoaded) {
        onProfileLoaded(loadedProfile);
      }
    };

    fetchProfile();
  }, [loadProfile, onProfileLoaded]);

  useEffect(() => {
    if (!profile) return;

    setFormState({
      email: profile.email || '',
      nickname: profile.nickname || '',
      phone: profile.phone || '',
      name: profile.name || '',
      surname: profile.surname || '',
      rating: profile.rating ?? 0,
    });

    if (onProfileLoaded) {
      onProfileLoaded(profile);
    }
  }, [profile, onProfileLoaded]);

  const avatarLetter = useMemo(() => {
    return (
      formState.nickname?.trim()?.charAt(0)?.toUpperCase() ||
      formState.email?.trim()?.charAt(0)?.toUpperCase() ||
      'U'
    );
  }, [formState.nickname, formState.email]);

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
      rating: Number(formState.rating) || 0,
    };

    if (avatarFile) {
      payload.avatar_url = avatarFile;
    }

    const updatedProfile = await updateProfile(payload);

    if (onProfileLoaded) {
      onProfileLoaded(updatedProfile);
    }

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
        {profile?.avatar_url ? (
          <img
            src={profile.avatar_url}
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
                    setSuccessMessage('');
                    setIsEditing(true);
                  }}
                >
                  Редактировать профиль
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
                Рейтинг
                <input
                  className="auth-form__input"
                  type="number"
                  value={formState.rating}
                  onChange={handleChange('rating')}
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

      <section>
        <h2 className="section-title">Мои публикации</h2>
        <div className="feed-grid">
          {mockPlaces.slice(0, 2).map((place) => (
            <PlaceCard
              key={place.id}
              place={place}
              onOpenDetails={onOpenDetails}
              onOpenOnMap={onOpenOnMap}
            />
          ))}
        </div>
      </section>
    </main>
  );
}