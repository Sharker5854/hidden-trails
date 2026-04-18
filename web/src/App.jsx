import { useEffect, useState } from 'react';
import './App.css';

import Header from './components/layout/Header';
import FeedPage from './pages/FeedPage';
import MapPage from './pages/MapPage';
import ProfilePage from './pages/ProfilePage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import PlaceDetailsPage from './pages/PlaceDetailsPage';
import CreateGeotagPage from './pages/CreateGeotagPage';
import EditGeotagPage from './pages/EditGeotagPage';
import { useAuth } from './hooks/useAuth';
import { useGeotags } from './hooks/useGeotags';

export default function App() {
  const {
    user,
    isAuthorized,
    isLoading: authLoading,
    authError,
    login,
    register,
    logout,
  } = useAuth();
  const {
    isLoading: geotagsLoading,
    error: geotagsError,
    loadFeed,
    loadGeotagById,
  } = useGeotags();

  const [currentPage, setCurrentPage] = useState('login');
  const [places, setPlaces] = useState([]);
  const [selectedPlace, setSelectedPlace] = useState(null);
  const [mapFocusedPlace, setMapFocusedPlace] = useState(null);
  const [profileUser, setProfileUser] = useState(null);

  const activeUser = profileUser || user;

  useEffect(() => {
    if (!isAuthorized) {
      return;
    }

    loadFeed()
      .then((loadedPlaces) => setPlaces(loadedPlaces))
      .catch(() => {});
  }, [isAuthorized, loadFeed]);

  const upsertPlace = (place) => {
    if (!place) return;

    setPlaces((prev) => [
      place,
      ...prev.filter((existingPlace) => existingPlace.id !== place.id),
    ]);
  };

  const handleLogin = async ({ email, password }) => {
    await login({ email, password });
    setCurrentPage('feed');
  };

  const handleRegister = async ({
    email,
    nickname,
    password,
    password_repeat,
  }) => {
    await register({
      email,
      nickname,
      password,
      password_repeat,
    });
    setCurrentPage('feed');
  };

  const handleLogout = async () => {
    await logout();
    setCurrentPage('login');
    setPlaces([]);
    setSelectedPlace(null);
    setMapFocusedPlace(null);
    setProfileUser(null);
  };

  const handleNavigate = (page) => {
    if (page === 'logout') {
      handleLogout();
      return;
    }

    setCurrentPage(page);
  };

  const handleOpenDetails = (place) => {
    setSelectedPlace(place);
    setCurrentPage('place-details');

    if (place?.id) {
      loadGeotagById(place.id)
        .then((freshPlace) => {
          setSelectedPlace(freshPlace);
          upsertPlace(freshPlace);
        })
        .catch(() => {});
    }
  };

  const handleOpenOnMap = (place) => {
    setSelectedPlace(place);
    setMapFocusedPlace(place);
    setCurrentPage('map');
  };

  const handleOpenCreateGeotag = () => {
    setCurrentPage('create-geotag');
  };

  const handleOpenEditGeotag = (place) => {
    setSelectedPlace(place);
    setCurrentPage('edit-geotag');
  };

  const renderFeed = () => (
    <FeedPage
      places={places}
      isLoading={geotagsLoading}
      error={geotagsError}
      onOpenDetails={handleOpenDetails}
      onOpenOnMap={handleOpenOnMap}
      onOpenCreateGeotag={handleOpenCreateGeotag}
    />
  );

  const renderPage = () => {
    if (authLoading && !isAuthorized) {
      return (
        <main className="page auth-page">
          <div className="auth-form">
            <h1>Загрузка...</h1>
          </div>
        </main>
      );
    }

    if (!isAuthorized) {
      if (currentPage === 'register') {
        return (
          <RegisterPage
            onRegister={handleRegister}
            onGoToLogin={() => setCurrentPage('login')}
            isLoading={authLoading}
            error={authError}
          />
        );
      }

      return (
        <LoginPage
          onLogin={handleLogin}
          onGoToRegister={() => setCurrentPage('register')}
          isLoading={authLoading}
          error={authError}
        />
      );
    }

    switch (currentPage) {
      case 'map':
        return (
          <MapPage
            places={places}
            focusedPlace={mapFocusedPlace}
            onOpenDetails={handleOpenDetails}
          />
        );
      case 'profile':
        return (
          <ProfilePage
            places={places}
            onOpenDetails={handleOpenDetails}
            onOpenOnMap={handleOpenOnMap}
            onProfileLoaded={setProfileUser}
          />
        );
      case 'place-details':
        return selectedPlace ? (
          <PlaceDetailsPage
            place={selectedPlace}
            onOpenOnMap={handleOpenOnMap}
            onEditPlace={handleOpenEditGeotag}
            onPlaceUpdated={(updatedPlace) => {
              setSelectedPlace(updatedPlace);
              upsertPlace(updatedPlace);
            }}
          />
        ) : (
          renderFeed()
        );
      case 'create-geotag':
        return (
          <CreateGeotagPage
            onCreated={(createdGeotag) => {
              upsertPlace(createdGeotag);
              setSelectedPlace(createdGeotag);
              setMapFocusedPlace(createdGeotag);
              setCurrentPage('place-details');
            }}
            onCancel={() => setCurrentPage('feed')}
          />
        );
      case 'edit-geotag':
        return selectedPlace ? (
          <EditGeotagPage
            geotagId={selectedPlace.id}
            initialGeotag={selectedPlace}
            onUpdated={(updatedGeotag) => {
              upsertPlace(updatedGeotag);
              setSelectedPlace(updatedGeotag);
              setMapFocusedPlace(updatedGeotag);
              setCurrentPage('place-details');
            }}
            onCancel={() => setCurrentPage('place-details')}
          />
        ) : (
          renderFeed()
        );
      case 'feed':
      default:
        return renderFeed();
    }
  };

  return (
    <div className="app-shell">
      {isAuthorized && (
        <Header
          currentPage={currentPage}
          onNavigate={handleNavigate}
          user={activeUser}
        />
      )}
      {renderPage()}
    </div>
  );
}
