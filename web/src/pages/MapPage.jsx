import { useEffect, useRef, useState } from 'react';
import Map, { Marker, NavigationControl, Popup } from 'react-map-gl/maplibre';

const MAP_DESCRIPTION_LIMIT = 420;

function hasValidLocation(place) {
  return Number.isFinite(Number(place?.latitude)) && Number.isFinite(Number(place?.longitude));
}

function getPopupDescription(place) {
  const text = place?.fullDescription || place?.description || '';

  if (text.length <= MAP_DESCRIPTION_LIMIT) {
    return text;
  }

  return `${text.slice(0, MAP_DESCRIPTION_LIMIT).trim()}...`;
}

export default function MapPage({
  places = [],
  focusedPlace,
  onOpenDetails,
  onOpenUserProfile,
}) {
  const [selectedPlace, setSelectedPlace] = useState(null);
  const [dismissedFocusedPlaceId, setDismissedFocusedPlaceId] = useState(null);
  const mapRef = useRef(null);

  const focusedPlaceVisible =
    focusedPlace?.id === dismissedFocusedPlaceId ? null : focusedPlace;
  const visiblePlace = selectedPlace || focusedPlaceVisible;

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
  const selectedMarkerId = visiblePlace?.id;

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
                className={`marker ${
                  place.id === selectedMarkerId ? 'marker--active' : ''
                }`}
                aria-label={`Открыть ${place.title}`}
                onClick={(event) => {
                  event.stopPropagation();
                  setDismissedFocusedPlaceId(null);
                  setSelectedPlace(place);
                }}
              />
            </Marker>
          ))}

          {visiblePlace && hasValidLocation(visiblePlace) ? (
            <Popup
              key={`${visiblePlace.id}-${selectedPlace ? 'selected' : 'focused'}`}
              longitude={Number(visiblePlace.longitude)}
              latitude={Number(visiblePlace.latitude)}
              anchor="bottom"
              offset={28}
              closeOnClick={false}
              maxWidth="340px"
              onClose={() => {
                setSelectedPlace(null);
                if (visiblePlace.id === focusedPlace?.id) {
                  setDismissedFocusedPlaceId(visiblePlace.id);
                }
              }}
            >
              <div className="popup-card">
                {visiblePlace.image ? (
                  <img
                    className="popup-card__image"
                    src={visiblePlace.image}
                    alt={visiblePlace.title}
                  />
                ) : (
                  <div className="popup-card__image popup-card__image--empty">
                    {visiblePlace.title?.charAt(0)?.toUpperCase() || 'H'}
                  </div>
                )}

                <div className="popup-card__body">
                  <h3>{visiblePlace.title}</h3>
                  <p>{getPopupDescription(visiblePlace)}</p>
                </div>

                <div className="popup-card__footer">
                  <button
                    type="button"
                    className="popup-card__author"
                    onClick={() => onOpenUserProfile?.(visiblePlace.authorId)}
                  >
                    @{visiblePlace.author}
                  </button>
                  <button
                    type="button"
                    className="primary-button popup-card__button"
                    onClick={() => onOpenDetails(visiblePlace)}
                  >
                    Подробнее
                  </button>
                </div>
              </div>
            </Popup>
          ) : null}
        </Map>
      </div>
    </main>
  );
}
