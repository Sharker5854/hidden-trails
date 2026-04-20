import { useMemo, useState } from 'react';
import Map, { Marker, NavigationControl } from 'react-map-gl/maplibre';

const MAX_MEDIA_FILES = 7;

const DEFAULT_LOCATION = {
  latitude: 55.751244,
  longitude: 37.618423,
};

function getInitialFormValues(initialValues) {
  return {
    title: initialValues?.title || '',
    text: initialValues?.fullDescription || initialValues?.description || '',
    latitude: initialValues?.latitude ?? DEFAULT_LOCATION.latitude,
    longitude: initialValues?.longitude ?? DEFAULT_LOCATION.longitude,
    warnings: initialValues?.warnings || '',
    tips: initialValues?.tips || '',
    themeIds: initialValues?.themeIds || [],
  };
}

function isVideoFile(file) {
  return file?.type?.startsWith('video/');
}

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
  const initialFormValues = getInitialFormValues(initialValues);
  const [title, setTitle] = useState(initialFormValues.title);
  const [text, setText] = useState(initialFormValues.text);
  const [latitude, setLatitude] = useState(initialFormValues.latitude);
  const [longitude, setLongitude] = useState(initialFormValues.longitude);
  const [warnings, setWarnings] = useState(initialFormValues.warnings);
  const [tips, setTips] = useState(initialFormValues.tips);
  const [themeIds, setThemeIds] = useState(initialFormValues.themeIds);
  const [mediaFiles, setMediaFiles] = useState([]);
  const [mediaError, setMediaError] = useState('');
  const [activeMediaIndex, setActiveMediaIndex] = useState(0);

  const mediaPreviews = useMemo(
    () =>
      mediaFiles.map((file) => ({
        file,
        url: URL.createObjectURL(file),
      })),
    [mediaFiles]
  );

  const selectedLocation = {
    latitude: Number(latitude),
    longitude: Number(longitude),
  };

  const handleThemeToggle = (themeId) => {
    setThemeIds((prev) =>
      prev.includes(themeId)
        ? prev.filter((id) => id !== themeId)
        : [...prev, themeId]
    );
  };

  const handleMapClick = (event) => {
    const { lng, lat } = event.lngLat;
    setLatitude(Number(lat.toFixed(6)));
    setLongitude(Number(lng.toFixed(6)));
  };

  const handleSubmit = (event) => {
    event.preventDefault();

    if (mediaFiles.length > MAX_MEDIA_FILES) {
      setMediaError(`Можно прикрепить максимум ${MAX_MEDIA_FILES} фото.`);
      return;
    }

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

  const activePreview = mediaPreviews[activeMediaIndex];

  return (
    <form className="geotag-form" onSubmit={handleSubmit}>
      <label className="auth-form__label">
        Название карточки
        <input
          className="auth-form__input"
          type="text"
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          placeholder="Например: Тайная смотровая у старого моста"
          minLength={3}
          required
        />
      </label>

      <label className="auth-form__label">
        Текст карточки
        <textarea
          className="comment-form__textarea"
          value={text}
          onChange={(event) => setText(event.target.value)}
          placeholder="Расскажи, чем интересно это место и почему туда стоит заглянуть"
          required
        />
      </label>

      <section className="geotag-map-picker">
        <div className="geotag-map-picker__header">
          <div>
            <h2>Место на карте</h2>
            <p>Кликни по карте, чтобы поставить метку будущей карточки.</p>
          </div>
          <div className="geotag-map-picker__coords">
            {Number(latitude).toFixed(6)}, {Number(longitude).toFixed(6)}
          </div>
        </div>

        <div className="geotag-map-picker__map">
          <Map
            initialViewState={{
              longitude: selectedLocation.longitude,
              latitude: selectedLocation.latitude,
              zoom: 10,
            }}
            style={{ width: '100%', height: '100%' }}
            mapStyle={`https://api.maptiler.com/maps/streets-v2/style.json?key=${import.meta.env.VITE_MAPTILER_KEY}`}
            onClick={handleMapClick}
          >
            <NavigationControl position="top-right" />
            <Marker
              longitude={selectedLocation.longitude}
              latitude={selectedLocation.latitude}
              anchor="bottom"
            >
              <div className="marker">📍</div>
            </Marker>
          </Map>
        </div>
      </section>

      <div className="geotag-form__coords">
        <label className="auth-form__label">
          Широта
          <input
            className="auth-form__input"
            type="number"
            step="any"
            value={latitude}
            onChange={(event) => setLatitude(event.target.value)}
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
        Совет
        <textarea
          className="comment-form__textarea"
          value={tips}
          onChange={(event) => setTips(event.target.value)}
          placeholder="Когда ехать, что взять с собой, что учесть"
        />
      </label>

      <div className="auth-form__label">
        Теги
        {themesLoading ? (
          <p className="geotag-form__hint">Загружаем теги...</p>
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
        <p className="geotag-form__hint">Нужно выбрать от 1 до 5 тегов.</p>
      </div>

      <label className="auth-form__label">
        Фото
        <input
          className="auth-form__input"
          type="file"
          multiple
          accept="image/*"
          onChange={(event) => {
            const files = Array.from(event.target.files || []);
            const imageFiles = files.filter((file) => file.type.startsWith('image/'));

            if (files.length > MAX_MEDIA_FILES) {
              setMediaError(`Можно прикрепить максимум ${MAX_MEDIA_FILES} фото.`);
              setMediaFiles(imageFiles.slice(0, MAX_MEDIA_FILES));
            } else if (imageFiles.length !== files.length) {
              setMediaError('Можно прикреплять только фото.');
              setMediaFiles(imageFiles);
            } else {
              setMediaError('');
              setMediaFiles(imageFiles);
            }

            setActiveMediaIndex(0);
          }}
        />
        <p className="geotag-form__hint">Можно выбрать до 7 фото.</p>
      </label>

      {mediaPreviews.length > 0 ? (
        <section className="media-preview">
          <div className="media-preview__frame">
            {isVideoFile(activePreview.file) ? (
              <video src={activePreview.url} controls />
            ) : (
              <img src={activePreview.url} alt={activePreview.file.name} />
            )}
          </div>

          <div className="media-preview__controls">
            <button
              type="button"
              className="secondary-button"
              onClick={() =>
                setActiveMediaIndex((prev) =>
                  prev === 0 ? mediaPreviews.length - 1 : prev - 1
                )
              }
            >
              Назад
            </button>
            <span>
              {activeMediaIndex + 1} / {mediaPreviews.length}
            </span>
            <button
              type="button"
              className="secondary-button"
              onClick={() =>
                setActiveMediaIndex((prev) =>
                  prev === mediaPreviews.length - 1 ? 0 : prev + 1
                )
              }
            >
              Вперед
            </button>
          </div>
        </section>
      ) : null}

      {mediaError ? <p className="auth-form__error">{mediaError}</p> : null}
      {formError ? <p className="auth-form__error">{formError}</p> : null}

      <div className="geotag-form__actions">
        <button
          type="submit"
          className="primary-button"
          disabled={isSubmitting || themeIds.length === 0}
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
