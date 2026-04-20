import PlaceCard from '../components/place/PlaceCard';

export default function FeedPage({
  places = [],
  isLoading,
  error,
  onOpenDetails,
  onOpenOnMap,
  onOpenUserProfile,
  onOpenCreateGeotag,
}) {
  return (
    <main className="page">
      <section className="hero hero--with-action">
        <div>
          <h1>Лента мест</h1>
          <p>Находи красивые локации и делись своими открытиями.</p>
        </div>

        <button className="primary-button" onClick={onOpenCreateGeotag}>
          Создать место
        </button>
      </section>

      {error ? <p className="auth-form__error">{error}</p> : null}

      {isLoading && places.length === 0 ? (
        <p className="page-state">Загружаем рекомендации...</p>
      ) : null}

      {!isLoading && places.length === 0 ? (
        <section className="empty-state">
          <h2>Пока нет карточек</h2>
          <p>Создай первое место, и оно появится здесь и на карте.</p>
          <button className="primary-button" onClick={onOpenCreateGeotag}>
            Добавить место
          </button>
        </section>
      ) : null}

      {places.length > 0 ? (
        <section className="feed-grid">
          {places.map((place) => (
            <PlaceCard
              key={place.id}
              place={place}
              onOpenDetails={onOpenDetails}
              onOpenOnMap={onOpenOnMap}
              onOpenUserProfile={onOpenUserProfile}
            />
          ))}
        </section>
      ) : null}
    </main>
  );
}
