import { mockPlaces } from '../data/mockPlaces';
import PlaceCard from '../components/place/PlaceCard';

export default function ProfilePage() {
  return (
    <main className="page">
      <section className="profile-card">
        <div className="profile-card__avatar">A</div>
        <div>
          <h1>anna_trails</h1>
          <p>Люблю лесные тропы, озёра и тихие места без толпы.</p>
        </div>
      </section>

      <section>
        <h2 className="section-title">Мои публикации</h2>
        <div className="feed-grid">
          {mockPlaces.slice(0, 2).map((place) => (
            <PlaceCard key={place.id} place={place} />
          ))}
        </div>
      </section>
    </main>
  );
}