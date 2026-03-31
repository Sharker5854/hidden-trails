import { useEffect, useState } from 'react';
import GeotagForm from '../components/forms/GeotagForm';
import { useThemes } from '../hooks/useThemes';
import { useGeotags } from '../hooks/useGeotags';

export default function CreateGeotagPage({ onCreated, onCancel }) {
  const { themes, isLoading: themesLoading, loadThemes } = useThemes();
  const { createGeotag, isLoading, error } = useGeotags();
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    loadThemes();
  }, [loadThemes]);

  const handleSubmit = async (data) => {
    setSuccessMessage('');

    const createdGeotag = await createGeotag(data);
    setSuccessMessage('Место успешно создано');

    if (onCreated) {
      onCreated(createdGeotag);
    }
  };

  return (
    <main className="page">
      <section className="hero">
        <h1>Создать место</h1>
        <p>Добавь новую геометку и заполни информацию о ней.</p>
      </section>

      <section className="geotag-page-card">
        <GeotagForm
          initialValues={null}
          themes={themes}
          themesLoading={themesLoading}
          formError={error}
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