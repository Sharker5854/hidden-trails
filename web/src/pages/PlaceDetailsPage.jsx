import { useState } from 'react';

function isVideoUrl(url) {
  return /\.(mp4|webm|ogg|mov)$/i.test(url || '');
}

export default function PlaceDetailsPage({ place, onOpenOnMap, onEditPlace }) {
  const [commentText, setCommentText] = useState('');
  const [activeMediaIndex, setActiveMediaIndex] = useState(0);

  const mediaFiles = Array.isArray(place?.mediaFiles)
    ? place.mediaFiles.filter(Boolean)
    : [];
  const safePlace = {
    title: place?.title || 'Без названия',
    fullDescription: place?.fullDescription || place?.description || '',
    image: place?.image || mediaFiles[0] || '',
    author: place?.author || 'unknown',
    authorAvatar: place?.authorAvatar || null,
    likes: place?.likes || 0,
    views: place?.views || 0,
    comments: place?.comments || [],
    warnings: place?.warnings || '',
    tips: place?.tips || '',
    themes: Array.isArray(place?.themes) ? place.themes : [],
    mediaFiles,
  };

  const activeMedia =
    safePlace.mediaFiles[activeMediaIndex] || safePlace.image || null;
  const hasManyMedia = safePlace.mediaFiles.length > 1;

  const handleSubmit = (event) => {
    event.preventDefault();
    setCommentText('');
  };

  return (
    <main className="page">
      <section className="place-details">
        <div className="place-details__author">
          {safePlace.authorAvatar ? (
            <img
              src={safePlace.authorAvatar}
              alt="Аватар автора"
              className="place-details__avatar-image"
            />
          ) : (
            <div className="place-details__avatar">
              {safePlace.author.charAt(0).toUpperCase()}
            </div>
          )}

          <div>
            <div className="place-details__author-label">Автор</div>
            <div className="place-details__author-name">@{safePlace.author}</div>
          </div>
        </div>

        <div className="place-details__media">
          <div className="place-details__carousel-frame">
            {activeMedia ? (
              isVideoUrl(activeMedia) ? (
                <video src={activeMedia} className="place-details__image" controls />
              ) : (
                <img
                  src={activeMedia}
                  alt={safePlace.title}
                  className="place-details__image"
                />
              )
            ) : (
              <div className="place-details__image place-details__image--empty">
                Нет медиа
              </div>
            )}
          </div>

          {hasManyMedia ? (
            <div className="place-details__carousel-controls">
              <button
                type="button"
                className="secondary-button"
                onClick={() =>
                  setActiveMediaIndex((prev) =>
                    prev === 0 ? safePlace.mediaFiles.length - 1 : prev - 1
                  )
                }
              >
                Назад
              </button>
              <span>
                {activeMediaIndex + 1} / {safePlace.mediaFiles.length}
              </span>
              <button
                type="button"
                className="secondary-button"
                onClick={() =>
                  setActiveMediaIndex((prev) =>
                    prev === safePlace.mediaFiles.length - 1 ? 0 : prev + 1
                  )
                }
              >
                Вперед
              </button>
            </div>
          ) : null}

          <div className="place-details__stats">
            <div className="place-details__stat">♥ {safePlace.likes}</div>
            <div className="place-details__stat">👁 {safePlace.views}</div>
          </div>
        </div>

        <div className="place-details__content">
          <div className="place-details__content-top">
            <h1 className="place-details__title">{safePlace.title}</h1>

            <div className="place-details__content-actions">
              <button
                className="secondary-button"
                onClick={() => onOpenOnMap(place)}
              >
                На карту
              </button>

              <button
                className="secondary-button"
                onClick={() => onEditPlace(place)}
              >
                Редактировать
              </button>
            </div>
          </div>

          {safePlace.themes.length > 0 ? (
            <div className="place-details__themes">
              {safePlace.themes.map((theme) => (
                <span key={theme.id} className="theme-badge">
                  {theme.name}
                </span>
              ))}
            </div>
          ) : null}

          <p className="place-details__text">{safePlace.fullDescription}</p>

          {safePlace.warnings ? (
            <div className="place-details__note place-details__note--warning">
              <h3>Предупреждения</h3>
              <p>{safePlace.warnings}</p>
            </div>
          ) : null}

          {safePlace.tips ? (
            <div className="place-details__note place-details__note--tip">
              <h3>Совет</h3>
              <p>{safePlace.tips}</p>
            </div>
          ) : null}
        </div>

        <section className="comments-section">
          <h2 className="section-title">Комментарии</h2>

          {safePlace.comments.length > 0 ? (
            <div className="comments-list">
              {safePlace.comments.map((comment) => (
                <article key={comment.id} className="comment-card">
                  <div className="comment-card__author">@{comment.author}</div>
                  <p className="comment-card__text">{comment.text}</p>
                </article>
              ))}
            </div>
          ) : (
            <p className="comments-section__empty">
              Оставь первый комментарий!
            </p>
          )}

          <form className="comment-form" onSubmit={handleSubmit}>
            <textarea
              className="comment-form__textarea"
              placeholder="Напиши комментарий..."
              value={commentText}
              onChange={(event) => setCommentText(event.target.value)}
            />

            <button type="submit" className="primary-button comment-form__button">
              Отправить
            </button>
          </form>
        </section>
      </section>
    </main>
  );
}
