const FEED_DESCRIPTION_LIMIT = 180;

function truncateText(text, limit = FEED_DESCRIPTION_LIMIT) {
  if (!text) return '';
  if (text.length <= limit) return text;

  return `${text.slice(0, limit).trim()}...`;
}

export default function PlaceCard({
  place,
  onOpenDetails,
  onOpenOnMap,
  onOpenUserProfile,
}) {
  const themes = Array.isArray(place.themes) ? place.themes : [];

  return (
    <article className="place-card">
      {place.image ? (
        <img className="place-card__image" src={place.image} alt={place.title} />
      ) : (
        <div className="place-card__image place-card__image--empty">
          {place.title?.charAt(0)?.toUpperCase() || 'H'}
        </div>
      )}

      <div className="place-card__content">
        <div className="place-card__meta">
          <button
            type="button"
            className="place-card__author-button"
            onClick={() => onOpenUserProfile?.(place.authorId)}
          >
            @{place.author}
          </button>
          <span>{place.likes} лайков</span>
          <span>{place.views} просмотров</span>
        </div>

        <h3 className="place-card__title">{place.title}</h3>
        <p className="place-card__description">
          {truncateText(place.description)}
        </p>

        {themes.length > 0 ? (
          <div className="place-card__themes">
            {themes.map((theme) => (
              <span key={theme.id} className="theme-badge">
                {theme.name}
              </span>
            ))}
          </div>
        ) : null}

        <div className="place-card__actions">
          <button
            className="primary-button"
            onClick={() => onOpenDetails(place)}
          >
            Подробнее
          </button>

          <button
            className="secondary-button"
            onClick={() => onOpenOnMap(place)}
          >
            На карту
          </button>
        </div>
      </div>
    </article>
  );
}
