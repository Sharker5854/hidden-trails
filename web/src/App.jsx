import Map, { Marker, Popup, NavigationControl } from 'react-map-gl/maplibre';
import { useState } from 'react';

const places = [
  {
    id: 1,
    name: 'Красная площадь',
    description: 'Тестовая геометка в центре Москвы',
    longitude: 37.620795,
    latitude: 55.75393,
  },
  {
    id: 2,
    name: 'Парк Горького',
    description: 'Пример карточки места',
    longitude: 37.603943,
    latitude: 55.729876,
  },
];

export default function App() {
  const [selectedPlace, setSelectedPlace] = useState(null);

  return (
    <div className="app">
      <header className="header">
        <h1>Hidden Trails</h1>
        <p>Карта с пользовательскими метками</p>
      </header>

      <main className="main">
        <div className="map-wrapper">
          <Map
            initialViewState={{
              longitude: 37.618423,
              latitude: 55.751244,
              zoom: 11,
            }}
            style={{ width: '100%', height: '100%' }}
            mapStyle="https://api.maptiler.com/maps/streets-v2/style.json?key=5qPdBRdyS5TmY2C2HAV4"
          >
            <NavigationControl position="top-right" />

            {places.map((place) => (
              <Marker
                key={place.id}
                longitude={place.longitude}
                latitude={place.latitude}
                anchor="bottom"
              >
                <button
                  className="marker"
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedPlace(place);
                  }}
                  aria-label={place.name}
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
                  <h3>{selectedPlace.name}</h3>
                  <p>{selectedPlace.description}</p>
                </div>
              </Popup>
            )}
          </Map>
        </div>
      </main>
    </div>
  );
}