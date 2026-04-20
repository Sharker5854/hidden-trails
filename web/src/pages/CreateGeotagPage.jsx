import { useEffect, useState } from 'react';
import GeotagForm from '../components/forms/GeotagForm';
import { useGeotags } from '../hooks/useGeotags';
import { useThemes } from '../hooks/useThemes';

export default function CreateGeotagPage({ onCreated, onCancel }) {
  const { themes, isLoading: themesLoading, error: themesError, loadThemes } = useThemes();
  const { createGeotag, isLoading, error } = useGeotags();
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    loadThemes().catch(() => {});
  }, [loadThemes]);

  const handleSubmit = async (data) => {
    setSuccessMessage('');

    try {
      const createdGeotag = await createGeotag(data);
      setSuccessMessage('Карточка создана');

      if (onCreated) {
        onCreated(createdGeotag);
      }
    } catch {
      // useGeotags already exposes the message in formError.
    }
  };

  return (
    <main className="page">
      <section className="hero">
        <h1>Создать место</h1>
        <p>Добавь карточку, отметь точку на карте и прикрепи фото или видео.</p>
      </section>

      <section className="geotag-page-card">
        <GeotagForm
          themes={themes}
          themesLoading={themesLoading}
          formError={error || themesError}
          isSubmitting={isLoading}
          submitLabel="Создать карточку"
          onSubmit={handleSubmit}
          onCancel={onCancel}
        />

        {successMessage ? (
          <p className="auth-form__success">{successMessage}</p>
        ) : null}
      </section>
    </main>
  );
}
