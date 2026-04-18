import { useEffect, useRef, useState } from 'react';
import Map, { Marker, NavigationControl, Popup } from 'react-map-gl/maplibre';

function hasValidLocation(place) {
  return Number.isFinite(Number(place?.latitude)) && Number.isFinite(Number(place?.longitude));
}

export default function MapPage({ places = [], focusedPlace, onOpenDetails }) {
  const [selectedPlace, setSelectedPlace] = useState(null);
  const [dismissedFocusedPlaceId, setDismissedFocusedPlaceId] = useState(null);
  const mapRef = useRef(null);
  const visiblePlace =
    selectedPlace ||
    (focusedPlace?.id === dismissedFocusedPlaceId ? null : focusedPlace);

  useEffect(() => {
    if (!focusedPlace || !mapRef.current || !hasValidLocation(focusedPlace)) return;

    mapRef.current.flyTo({
      center: [Number(focusedPlace.longitude), Number(focusedPlace.latitude)],
      zoom: 14,
      duration: 1400,
      essential: true,
    });
  }, [focusedPlace]);

  const visiblePlaces = places.filter(hasValidLocation);

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

          {visiblePlaces.map((place) => (
            <Marker
              key={place.id}
              longitude={Number(place.longitude)}
              latitude={Number(place.latitude)}
              anchor="bottom"
            >
              <button
                type="button"
                className="marker"
                onClick={(event) => {
                  event.stopPropagation();
                  setDismissedFocusedPlaceId(null);
                  setSelectedPlace(place);
                }}
              >
                📍
              </button>
            </Marker>
          ))}

          {visiblePlace && hasValidLocation(visiblePlace) ? (
            <Popup
              longitude={Number(visiblePlace.longitude)}
              latitude={Number(visiblePlace.latitude)}
              anchor="bottom"
              offset={20}
              closeOnClick={false}
              onClose={() => {
                setSelectedPlace(null);
                setDismissedFocusedPlaceId(visiblePlace.id);
              }}
            >
              <div className="popup-card">
                <h3>{visiblePlace.title}</h3>
                <p>{visiblePlace.description}</p>
                <span>@{visiblePlace.author}</span>
                <button
                  type="button"
                  className="secondary-button popup-card__button"
                  onClick={() => onOpenDetails(visiblePlace)}
                >
                  Открыть
                </button>
              </div>
            </Popup>
          ) : null}
        </Map>
      </div>
    </main>
  );
}
