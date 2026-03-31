import { useEffect, useState } from 'react';
import GeotagForm from '../components/forms/GeotagForm';
import { useThemes } from '../hooks/useThemes';
import { useGeotags } from '../hooks/useGeotags';

export default function EditGeotagPage({ geotagId, initialGeotag, onUpdated, onCancel }) {
  const { themes, isLoading: themesLoading, loadThemes } = useThemes();
  const { updateGeotag, loadGeotagById, selectedGeotag, isLoading, error } = useGeotags();
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    loadThemes();
  }, [loadThemes]);

  useEffect(() => {
    if (initialGeotag || !geotagId) return;
    loadGeotagById(geotagId);
  }, [initialGeotag, geotagId, loadGeotagById]);

  const geotag = initialGeotag || selectedGeotag;

  const handleSubmit = async (data) => {
    setSuccessMessage('');

    const updatedGeotag = await updateGeotag(geotagId, data);
    setSuccessMessage('Место успешно обновлено');

    if (onUpdated) {
      onUpdated(updatedGeotag);
    }
  };

  return (
    <main className="page">
      <section className="hero">
        <h1>Редактировать место</h1>
        <p>Обнови информацию о геометке.</p>
      </section>

      <section className="geotag-page-card">
        {geotag ? (
          <GeotagForm
            initialValues={geotag}
            themes={themes}
            themesLoading={themesLoading}
            formError={error}
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