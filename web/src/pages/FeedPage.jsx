import PlaceCard from '../components/place/PlaceCard';
import { mockPlaces } from '../data/mockPlaces';

export default function FeedPage({
  onOpenDetails,
  onOpenOnMap,
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

      <section className="feed-grid">
        {mockPlaces.map((place) => (
          <PlaceCard
            key={place.id}
            place={place}
            onOpenDetails={onOpenDetails}
            onOpenOnMap={onOpenOnMap}
          />
        ))}
      </section>
    </main>
  );
}