import { useEffect, useState } from 'react';

export default function GeotagForm({
  initialValues,
  themes,
  themesLoading,
  formError,
  isSubmitting,
  submitLabel,
  onSubmit,
  onCancel,
}) {
  const [title, setTitle] = useState('');
  const [text, setText] = useState('');
  const [latitude, setLatitude] = useState('');
  const [longitude, setLongitude] = useState('');
  const [warnings, setWarnings] = useState('');
  const [tips, setTips] = useState('');
  const [themeIds, setThemeIds] = useState([]);
  const [mediaFiles, setMediaFiles] = useState([]);

  useEffect(() => {
    if (!initialValues) return;

    setTitle(initialValues.title || '');
    setText(initialValues.fullDescription || initialValues.description || '');
    setLatitude(initialValues.latitude ?? '');
    setLongitude(initialValues.longitude ?? '');
    setWarnings(initialValues.warnings || '');
    setTips(initialValues.tips || '');
    setThemeIds(initialValues.themeIds || []);
  }, [initialValues]);

  const handleThemeToggle = (themeId) => {
    setThemeIds((prev) =>
      prev.includes(themeId)
        ? prev.filter((id) => id !== themeId)
        : [...prev, themeId]
    );
  };

  const handleSubmit = (event) => {
    event.preventDefault();

    onSubmit({
      title,
      text,
      latitude: Number(latitude),
      longitude: Number(longitude),
      warnings,
      tips,
      theme_ids: themeIds,
      media_files: mediaFiles,
    });
  };

  return (
    <form className="geotag-form" onSubmit={handleSubmit}>
      <label className="auth-form__label">
        Название
        <input
          className="auth-form__input"
          type="text"
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          placeholder="Название места"
          required
        />
      </label>

      <label className="auth-form__label">
        Полное описание
        <textarea
          className="comment-form__textarea"
          value={text}
          onChange={(event) => setText(event.target.value)}
          placeholder="Расскажи подробнее об этом месте"
        />
      </label>

      <div className="geotag-form__coords">
        <label className="auth-form__label">
          Широта
          <input
            className="auth-form__input"
            type="number"
            step="any"
            value={latitude}
            onChange={(event) => setLatitude(event.target.value)}
            placeholder="55.751244"
            required
          />
        </label>

        <label className="auth-form__label">
          Долгота
          <input
            className="auth-form__input"
            type="number"
            step="any"
            value={longitude}
            onChange={(event) => setLongitude(event.target.value)}
            placeholder="37.618423"
            required
          />
        </label>
      </div>

      <label className="auth-form__label">
        Предупреждения
        <textarea
          className="comment-form__textarea"
          value={warnings}
          onChange={(event) => setWarnings(event.target.value)}
          placeholder="Опасности, ограничения, особенности маршрута"
        />
      </label>

      <label className="auth-form__label">
        Советы
        <textarea
          className="comment-form__textarea"
          value={tips}
          onChange={(event) => setTips(event.target.value)}
          placeholder="Когда ехать, что взять с собой, что учесть"
        />
      </label>

      <div className="auth-form__label">
        Темы
        {themesLoading ? (
          <p className="geotag-form__hint">Загружаем темы...</p>
        ) : (
          <div className="theme-selector">
            {themes.map((theme) => (
              <label key={theme.id} className="theme-selector__item">
                <input
                  type="checkbox"
                  checked={themeIds.includes(theme.id)}
                  onChange={() => handleThemeToggle(theme.id)}
                />
                <span>{theme.name}</span>
              </label>
            ))}
          </div>
        )}
      </div>

      <label className="auth-form__label">
        Медиафайлы
        <input
          className="auth-form__input"
          type="file"
          multiple
          accept="image/*,video/*"
          onChange={(event) => {
            const files = Array.from(event.target.files || []);
            setMediaFiles(files);
          }}
        />
      </label>

      {mediaFiles.length > 0 ? (
        <p className="geotag-form__hint">
          Выбрано файлов: {mediaFiles.length}
        </p>
      ) : null}

      {formError ? <p className="auth-form__error">{formError}</p> : null}

      <div className="geotag-form__actions">
        <button
          type="submit"
          className="primary-button"
          disabled={isSubmitting}
        >
          {isSubmitting ? 'Сохраняем...' : submitLabel}
        </button>

        <button
          type="button"
          className="secondary-button"
          onClick={onCancel}
          disabled={isSubmitting}
        >
          Отмена
        </button>
      </div>
    </form>
  );
}