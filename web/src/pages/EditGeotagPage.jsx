import { useEffect, useState } from 'react';
import GeotagForm from '../components/forms/GeotagForm';
import { useGeotags } from '../hooks/useGeotags';
import { useThemes } from '../hooks/useThemes';

export default function EditGeotagPage({
  geotagId,
  initialGeotag,
  onUpdated,
  onCancel,
}) {
  const { themes, isLoading: themesLoading, error: themesError, loadThemes } = useThemes();
  const { updateGeotag, loadGeotagById, selectedGeotag, isLoading, error } = useGeotags();
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    loadThemes().catch(() => {});
  }, [loadThemes]);

  useEffect(() => {
    if (initialGeotag || !geotagId) return;
    loadGeotagById(geotagId).catch(() => {});
  }, [initialGeotag, geotagId, loadGeotagById]);

  const geotag = initialGeotag || selectedGeotag;

  const handleSubmit = async (data) => {
    setSuccessMessage('');

    try {
      const updatedGeotag = await updateGeotag(geotagId, data);
      setSuccessMessage('Место обновлено');

      if (onUpdated) {
        onUpdated(updatedGeotag);
      }
    } catch {
      // useGeotags already exposes the message in formError.
    }
  };

  return (
    <main className="page">
      <section className="hero">
        <h1>Редактировать место</h1>
        <p>Обнови карточку, метку на карте, теги или медиа.</p>
      </section>

      <section className="geotag-page-card">
        {geotag?.moderationComment ? (
          <div className="place-details__note place-details__note--warning">
            <h3>
              {geotag?.moderationStatus === 'blocked'
                ? 'Карточка скрыта'
                : 'Комментарий модератора'}
            </h3>
            <p>{geotag.moderationComment}</p>
          </div>
        ) : null}

        {geotag ? (
          <GeotagForm
            key={geotag.id || geotagId}
            initialValues={geotag}
            themes={themes}
            themesLoading={themesLoading}
            formError={error || themesError}
            isSubmitting={isLoading}
            submitLabel="Сохранить изменения"
            onSubmit={handleSubmit}
            onCancel={onCancel}
          />
        ) : (
          <p className="geotag-form__hint">Загружаем данные места...</p>
        )}

        {successMessage ? (
          <p className="auth-form__success">{successMessage}</p>
        ) : null}
      </section>
    </main>
  );
}
