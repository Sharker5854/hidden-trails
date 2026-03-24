export default function PlaceCard({ place }) {
  return (
    <article className="place-card">
      <img className="place-card__image" src={place.image} alt={place.title} />

      <div className="place-card__content">
        <div className="place-card__meta">
          <span>@{place.author}</span>
          <span>{place.likes} ❤️</span>
        </div>

        <h3 className="place-card__title">{place.title}</h3>
        <p className="place-card__description">{place.description}</p>

        <div className="place-card__actions">
          <button className="primary-button">Подробнее</button>
          <button className="secondary-button">Сохранить</button>
        </div>
      </div>
    </article>
  );
}