import { useEffect, useRef, useState } from 'react';
import Map, { Marker, Popup, NavigationControl } from 'react-map-gl/maplibre';
import { mockPlaces } from '../data/mockPlaces';

export default function MapPage({ focusedPlace }) {
  const [selectedPlace, setSelectedPlace] = useState(focusedPlace || null);
  const mapRef = useRef(null);

  useEffect(() => {
    if (!focusedPlace || !mapRef.current) return;

    setSelectedPlace(focusedPlace);

    mapRef.current.flyTo({
      center: [focusedPlace.longitude, focusedPlace.latitude],
      zoom: 14,
      duration: 1800,
      essential: true,
    });
  }, [focusedPlace]);

  return (
    <main className="page">
      <section className="hero">
        <h1>Карта мест</h1>
        <p>Смотри геометки и открывай карточки локаций.</p>
      </section>

      <div className="map-wrapper">
        <Map
          ref={mapRef}
          initialViewState={{
            longitude: 37.618423,
            latitude: 55.751244,
            zoom: 10,
          }}
          style={{ width: '100%', height: '100%' }}
          mapStyle={`https://api.maptiler.com/maps/streets-v2/style.json?key=${import.meta.env.VITE_MAPTILER_KEY}`}
        >
          <NavigationControl position="top-right" />

          {mockPlaces.map((place) => (
            <Marker
              key={place.id}
              longitude={place.longitude}
              latitude={place.latitude}
              anchor="bottom"
            >
              <button
                type="button"
                className="marker"
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedPlace(place);
                }}
              >
                📍
              </button>
            </Marker>
          ))}

          {selectedPlace && (
            <Popup
              longitude={selectedPlace.longitude}
              latitude={selectedPlace.latitude}
              anchor="bottom"
              offset={20}
              closeOnClick={false}
              onClose={() => setSelectedPlace(null)}
            >
              <div className="popup-card">
                <h3>{selectedPlace.title}</h3>
                <p>{selectedPlace.description}</p>
                <span>@{selectedPlace.author}</span>
              </div>
            </Popup>
          )}
        </Map>
      </div>
    </main>
  );
}