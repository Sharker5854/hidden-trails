import { useEffect, useMemo, useState } from 'react';
import Map, { Layer, Marker, NavigationControl, Source } from 'react-map-gl/maplibre';
import PlaceCard from '../components/place/PlaceCard';
import {
  calculateRouteByPointsRequest,
  calculateRouteRequest,
  getMyRoutesRequest,
  getPublicRoutesRequest,
  publishRouteRequest,
  saveRouteRequest,
  shareRouteRequest,
} from '../api/routesApi';
import { getErrorMessage } from '../utils/errors';
import { normalizeRoute, normalizeRoutes } from '../utils/routes';

const MODE_LABELS = {
  drive: 'Авто',
  walk: 'Пешком',
  bicycle: 'Велосипед',
};

const ROUTE_PLACE_DISTANCE_KM = 1;

function hasValidLocation(place) {
  return Number.isFinite(Number(place?.latitude)) && Number.isFinite(Number(place?.longitude));
}

function routeToGeoJson(route) {
  return {
    type: 'Feature',
    geometry: {
      type: 'LineString',
      coordinates: route?.coordinates || [],
    },
    properties: {},
  };
}

function toRadians(value) {
  return (Number(value) * Math.PI) / 180;
}

function distanceKm(a, b) {
  const radius = 6371;
  const dLat = toRadians(b.latitude - a.latitude);
  const dLng = toRadians(b.longitude - a.longitude);
  const lat1 = toRadians(a.latitude);
  const lat2 = toRadians(b.latitude);
  const sinLat = Math.sin(dLat / 2);
  const sinLng = Math.sin(dLng / 2);
  const h = sinLat * sinLat + Math.cos(lat1) * Math.cos(lat2) * sinLng * sinLng;
  return 2 * radius * Math.asin(Math.min(1, Math.sqrt(h)));
}

function distancePointToSegmentKm(point, start, finish) {
  const latFactor = 111.32;
  const lngFactor = 111.32 * Math.cos(toRadians(point.latitude));
  const px = point.longitude * lngFactor;
  const py = point.latitude * latFactor;
  const ax = start.longitude * lngFactor;
  const ay = start.latitude * latFactor;
  const bx = finish.longitude * lngFactor;
  const by = finish.latitude * latFactor;
  const dx = bx - ax;
  const dy = by - ay;

  if (dx === 0 && dy === 0) {
    return distanceKm(point, start);
  }

  const t = Math.max(0, Math.min(1, ((px - ax) * dx + (py - ay) * dy) / (dx * dx + dy * dy)));
  const projected = {
    longitude: (ax + t * dx) / lngFactor,
    latitude: (ay + t * dy) / latFactor,
  };

  return distanceKm(point, projected);
}

function findPlacesAlongRoute(places, coordinates) {
  if (!Array.isArray(coordinates) || coordinates.length < 2) return [];

  const routePoints = coordinates.map(([longitude, latitude]) => ({
    longitude: Number(longitude),
    latitude: Number(latitude),
  }));

  return places.filter((place) => {
    const point = {
      latitude: Number(place.latitude),
      longitude: Number(place.longitude),
    };

    for (let index = 1; index < routePoints.length; index += 1) {
      if (
        distancePointToSegmentKm(point, routePoints[index - 1], routePoints[index]) <=
        ROUTE_PLACE_DISTANCE_KM
      ) {
        return true;
      }
    }

    return false;
  });
}

export default function RoutesPage({
  places = [],
  onOpenDetails,
  onOpenOnMap,
  onOpenUserProfile,
}) {
  const [activeTab, setActiveTab] = useState('my');
  const [myRoutes, setMyRoutes] = useState([]);
  const [publicRoutes, setPublicRoutes] = useState([]);
  const [selectedRoute, setSelectedRoute] = useState(null);
  const [selectedGeotagIds, setSelectedGeotagIds] = useState([]);
  const [mapPoints, setMapPoints] = useState([]);
  const [buildMode, setBuildMode] = useState('places');
  const [mode, setMode] = useState('drive');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [shareRecipientId, setShareRecipientId] = useState('');
  const [previewRoute, setPreviewRoute] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const routePlaces = useMemo(
    () => places.filter(hasValidLocation),
    [places]
  );

  const visibleRoutes = activeTab === 'my' ? myRoutes : publicRoutes;
  const displayedRoute = selectedRoute || previewRoute;
  const displayedGeotags = displayedRoute?.geotags || [];
  const isMapBuildMode = buildMode === 'map';

  useEffect(() => {
    loadRoutes();
  }, []);

  const loadRoutes = async () => {
    setError('');
    try {
      const [myData, publicData] = await Promise.all([
        getMyRoutesRequest(),
        getPublicRoutesRequest(),
      ]);
      const loadedMyRoutes = normalizeRoutes(myData?.routes);
      const loadedPublicRoutes = normalizeRoutes(publicData?.routes);

      setMyRoutes(loadedMyRoutes);
      setPublicRoutes(loadedPublicRoutes);
      setSelectedRoute((prev) => prev || loadedMyRoutes[0] || loadedPublicRoutes[0] || null);
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  const toggleGeotag = (geotagId) => {
    setSelectedRoute(null);
    setMessage('');
    setSelectedGeotagIds((prev) =>
      prev.includes(geotagId)
        ? prev.filter((id) => id !== geotagId)
        : [...prev, geotagId]
    );
  };

  const handleAddMapPoint = (event) => {
    if (!isMapBuildMode) return;

    const { lng, lat } = event.lngLat;
    setSelectedRoute(null);
    setMessage('');
    setMapPoints((prev) => [
      ...prev,
      {
        latitude: lat,
        longitude: lng,
      },
    ]);
  };

  const handlePreview = async () => {
    if (!isMapBuildMode && selectedGeotagIds.length < 2) {
      setError('Выбери минимум две точки.');
      return;
    }
    if (isMapBuildMode && mapPoints.length < 2) {
      setError('Поставь на карте минимум точки A и Б.');
      return;
    }

    setIsLoading(true);
    setError('');
    setMessage('');

    try {
      const data = isMapBuildMode
        ? await calculateRouteByPointsRequest({
            points: mapPoints,
            mode,
          })
        : await calculateRouteRequest({
            geotagIds: selectedGeotagIds,
            mode,
          });
      const selectedGeotags = isMapBuildMode
        ? findPlacesAlongRoute(routePlaces, data?.coordinates)
        : selectedGeotagIds
            .map((id) => routePlaces.find((place) => place.id === id))
            .filter(Boolean);

      setPreviewRoute({
        ...normalizeRoute({
          ...data,
          title: title || 'Новый маршрут',
          description,
          geotags: selectedGeotags,
          geotag_ids: selectedGeotags.map((place) => place.id),
        }),
        geotags: selectedGeotags,
      });
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async (isPublic = false) => {
    if (!isMapBuildMode && selectedGeotagIds.length < 2) {
      setError('Выбери минимум две точки.');
      return;
    }
    if (isMapBuildMode && mapPoints.length < 2) {
      setError('Поставь на карте минимум точки A и Б.');
      return;
    }

    setIsLoading(true);
    setError('');
    setMessage('');

    try {
      let geotagIds = selectedGeotagIds;
      if (isMapBuildMode) {
        const routeData = await calculateRouteByPointsRequest({
          points: mapPoints,
          mode,
        });
        geotagIds = findPlacesAlongRoute(routePlaces, routeData?.coordinates).map(
          (place) => place.id
        );
      }

      const savedRoute = normalizeRoute(
        await saveRouteRequest({
          title: title || 'Новый маршрут',
          description,
          warnings: '',
          tips: '',
          geotagIds,
          points: isMapBuildMode ? mapPoints : [],
          mode,
          isPublic,
        })
      );

      setMyRoutes((prev) => [
        savedRoute,
        ...prev.filter((route) => route.id !== savedRoute.id),
      ]);
      if (savedRoute.isPublic) {
        setPublicRoutes((prev) => [
          savedRoute,
          ...prev.filter((route) => route.id !== savedRoute.id),
        ]);
      }
      setSelectedRoute(savedRoute);
      setPreviewRoute(null);
      setMessage(isPublic ? 'Маршрут сохранён и опубликован.' : 'Маршрут сохранён в профиль.');
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  };

  const handlePublish = async () => {
    if (!selectedRoute?.id) return;

    setIsLoading(true);
    setError('');
    setMessage('');

    try {
      const publishedRoute = normalizeRoute(await publishRouteRequest(selectedRoute.id));
      setSelectedRoute(publishedRoute);
      setMyRoutes((prev) =>
        prev.map((route) => (route.id === publishedRoute.id ? publishedRoute : route))
      );
      setPublicRoutes((prev) => [
        publishedRoute,
        ...prev.filter((route) => route.id !== publishedRoute.id),
      ]);
      setMessage('Маршрут опубликован.');
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  };

  const handleShare = async () => {
    const recipientId = Number(shareRecipientId);
    if (!selectedRoute?.id || !recipientId) {
      setError('Укажи ID пользователя для отправки.');
      return;
    }

    setIsLoading(true);
    setError('');
    setMessage('');

    try {
      await shareRouteRequest({
        routeId: selectedRoute.id,
        recipientId,
      });
      setShareRecipientId('');
      setMessage('Маршрут отправлен в сообщения.');
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="page routes-page">
      <section className="hero">
        <h1>Маршруты</h1>
        <p>Собирай путь из мест, сохраняй его себе и отправляй тем, кто пойдёт рядом.</p>
      </section>

      <section className="routes-layout">
        <aside className="routes-panel">
          <div className="routes-tabs">
            <button
              type="button"
              className={activeTab === 'my' ? 'routes-tabs__button routes-tabs__button--active' : 'routes-tabs__button'}
              onClick={() => setActiveTab('my')}
            >
              Мои
            </button>
            <button
              type="button"
              className={activeTab === 'public' ? 'routes-tabs__button routes-tabs__button--active' : 'routes-tabs__button'}
              onClick={() => setActiveTab('public')}
            >
              Посты
            </button>
          </div>

          <div className="routes-list">
            {visibleRoutes.length > 0 ? (
              visibleRoutes.map((route) => (
                <button
                  type="button"
                  key={route.id}
                  className={selectedRoute?.id === route.id ? 'route-list-item route-list-item--active' : 'route-list-item'}
                  onClick={() => {
                    setSelectedRoute(route);
                    setPreviewRoute(null);
                    setMessage('');
                  }}
                >
                  <strong>{route.title}</strong>
                  <span>{route.distanceKm} км · {route.durationMin} мин · {MODE_LABELS[route.mode]}</span>
                </button>
              ))
            ) : (
              <p className="routes-empty">Маршрутов пока нет.</p>
            )}
          </div>
        </aside>

        <section className="routes-main">
          <div className="route-builder">
            <div className="route-builder__header">
              <h2>Новый маршрут</h2>
              <p>Выбери места в нужном порядке.</p>
            </div>

            <label className="auth-form__label">
              Название
              <input
                className="auth-form__input"
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                placeholder="Прогулка по тихим дворикам"
              />
            </label>

            <label className="auth-form__label">
              Описание
              <textarea
                className="auth-form__input"
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                rows={3}
                placeholder="Что стоит знать перед стартом"
              />
            </label>

            <div className="route-builder__modes">
              <button
                type="button"
                className={buildMode === 'places' ? 'route-mode route-mode--active' : 'route-mode'}
                onClick={() => {
                  setBuildMode('places');
                  setPreviewRoute(null);
                }}
              >
                По карточкам
              </button>
              <button
                type="button"
                className={buildMode === 'map' ? 'route-mode route-mode--active' : 'route-mode'}
                onClick={() => {
                  setBuildMode('map');
                  setPreviewRoute(null);
                }}
              >
                Точки на карте
              </button>
            </div>

            <div className="route-builder__modes">
              {Object.entries(MODE_LABELS).map(([value, label]) => (
                <button
                  type="button"
                  key={value}
                  className={mode === value ? 'route-mode route-mode--active' : 'route-mode'}
                  onClick={() => setMode(value)}
                >
                  {label}
                </button>
              ))}
            </div>

            {isMapBuildMode ? (
              <div className="route-map-points">
                <p>
                  Точки: {mapPoints.length}. Кликни по карте ниже: первая точка будет A,
                  последняя Б.
                </p>
                <button
                  type="button"
                  className="secondary-button"
                  onClick={() => {
                    setMapPoints([]);
                    setPreviewRoute(null);
                  }}
                >
                  Очистить точки
                </button>
              </div>
            ) : (
              <div className="route-builder__points">
                {routePlaces.map((place) => (
                  <label key={place.id} className="route-point-option">
                    <input
                      type="checkbox"
                      checked={selectedGeotagIds.includes(place.id)}
                      onChange={() => toggleGeotag(place.id)}
                    />
                    <span>{place.title}</span>
                  </label>
                ))}
              </div>
            )}

            <div className="route-builder__actions">
              <button
                type="button"
                className="secondary-button"
                onClick={handlePreview}
                disabled={isLoading}
              >
                Построить
              </button>
              <button
                type="button"
                className="primary-button"
                onClick={() => handleSave(false)}
                disabled={isLoading}
              >
                Сохранить
              </button>
              <button
                type="button"
                className="secondary-button"
                onClick={() => handleSave(true)}
                disabled={isLoading}
              >
                Сохранить как пост
              </button>
            </div>
          </div>

          {error ? <p className="auth-form__error">{error}</p> : null}
          {message ? <p className="auth-form__success">{message}</p> : null}

          <div className="route-map">
            <Map
              initialViewState={{
                longitude: 37.618423,
                latitude: 55.751244,
                zoom: 10,
              }}
              style={{ width: '100%', height: '100%' }}
              mapStyle={`https://api.maptiler.com/maps/streets-v2/style.json?key=${import.meta.env.VITE_MAPTILER_KEY}`}
              onClick={handleAddMapPoint}
            >
              <NavigationControl position="top-right" />

              {displayedRoute?.coordinates?.length > 1 ? (
                <Source id="selected-route" type="geojson" data={routeToGeoJson(displayedRoute)}>
                  <Layer
                    id="selected-route-line"
                    type="line"
                    paint={{
                      'line-color': '#0f766e',
                      'line-width': 5,
                      'line-opacity': 0.86,
                    }}
                  />
                </Source>
              ) : null}

              {displayedGeotags.filter(hasValidLocation).map((place, index) => (
                <Marker
                  key={`${place.id}-${index}`}
                  longitude={Number(place.longitude)}
                  latitude={Number(place.latitude)}
                  anchor="bottom"
                >
                  <button type="button" className="route-marker">
                    {index + 1}
                  </button>
                </Marker>
              ))}

              {isMapBuildMode && !selectedRoute ? mapPoints.map((point, index) => (
                <Marker
                  key={`${point.longitude}-${point.latitude}-${index}`}
                  longitude={Number(point.longitude)}
                  latitude={Number(point.latitude)}
                  anchor="bottom"
                >
                  <button type="button" className="route-marker route-marker--waypoint">
                    {index === 0 ? 'A' : index === mapPoints.length - 1 ? 'Б' : index + 1}
                  </button>
                </Marker>
              )) : null}
            </Map>
          </div>

          {displayedRoute ? (
            <section className="route-details">
              <div className="route-details__header">
                <div>
                  <h2>{displayedRoute.title}</h2>
                  <p>
                    {displayedRoute.distanceKm} км · {displayedRoute.durationMin} мин · {MODE_LABELS[displayedRoute.mode]}
                  </p>
                </div>

                {selectedRoute?.id ? (
                  <div className="route-details__actions">
                    {!selectedRoute.isPublic ? (
                      <button
                        type="button"
                        className="secondary-button"
                        onClick={handlePublish}
                        disabled={isLoading}
                      >
                        Опубликовать
                      </button>
                    ) : null}
                    <input
                      className="auth-form__input route-share-input"
                      value={shareRecipientId}
                      onChange={(event) => setShareRecipientId(event.target.value)}
                      placeholder="ID пользователя"
                    />
                    <button
                      type="button"
                      className="primary-button"
                      onClick={handleShare}
                      disabled={isLoading}
                    >
                      Отправить
                    </button>
                  </div>
                ) : null}
              </div>

              {displayedRoute.description ? <p>{displayedRoute.description}</p> : null}

              <div className="feed-grid">
                {displayedGeotags.map((place) => (
                  <PlaceCard
                    key={place.id}
                    place={place}
                    onOpenDetails={onOpenDetails}
                    onOpenOnMap={onOpenOnMap}
                    onOpenUserProfile={onOpenUserProfile}
                  />
                ))}
              </div>
            </section>
          ) : null}
        </section>
      </section>
    </main>
  );
}
