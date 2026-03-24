import PlaceCard from '../components/place/PlaceCard';
import { mockPlaces } from '../data/mockPlaces';

export default function FeedPage({ onOpenDetails }) {
  return (
    <main className="page">
      <section className="hero">
        <h1>Лента мест</h1>
        <p>Находи красивые локации и делись своими открытиями.</p>
      </section>

      <section className="feed-grid">
        {mockPlaces.map((place) => (
          <PlaceCard
            key={place.id}
            place={place}
            onOpenDetails={onOpenDetails}
          />
        ))}
      </section>
    </main>
  );
}