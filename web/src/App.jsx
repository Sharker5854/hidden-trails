import { useEffect, useRef, useState } from 'react';
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
import UserSearchPage from './pages/UserSearchPage';
import UserProfilePage from './pages/UserProfilePage';
import MessagesPage from './pages/MessagesPage';
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
  const [selectedUserId, setSelectedUserId] = useState(null);
  const [mapFocusedPlace, setMapFocusedPlace] = useState(null);
  const [profileUser, setProfileUser] = useState(null);
  const [messageRecipientId, setMessageRecipientId] = useState(null);
  const viewedGeotagIdsRef = useRef(new Set());

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
    setSelectedUserId(null);
    setMapFocusedPlace(null);
    setProfileUser(null);
    setMessageRecipientId(null);
    viewedGeotagIdsRef.current.clear();
  };

  const handleNavigate = (page) => {
    if (page === 'logout') {
      handleLogout();
      return;
    }

    if (page === 'messages') {
      setMessageRecipientId(null);
    }

    setCurrentPage(page);
  };

  const handleOpenDetails = (place) => {
    setSelectedPlace(place);
    setCurrentPage('place-details');

    if (place?.id) {
      const shouldTrackView = !viewedGeotagIdsRef.current.has(place.id);
      loadGeotagById(place.id, { trackView: shouldTrackView })
        .then((freshPlace) => {
          viewedGeotagIdsRef.current.add(place.id);
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

  const handleOpenUserProfile = (userId) => {
    if (!userId) return;

    if (user?.id === userId) {
      setCurrentPage('profile');
      return;
    }

    setSelectedUserId(userId);
    setCurrentPage('user-profile');
  };

  const handleOpenMessages = (userId = null) => {
    setMessageRecipientId(userId);
    setCurrentPage('messages');
  };

  const renderFeed = () => (
    <FeedPage
      places={places}
      isLoading={geotagsLoading}
      error={geotagsError}
      onOpenDetails={handleOpenDetails}
      onOpenOnMap={handleOpenOnMap}
      onOpenUserProfile={handleOpenUserProfile}
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
            onOpenUserProfile={handleOpenUserProfile}
          />
        );
      case 'profile':
        return (
          <ProfilePage
            places={places}
            onOpenDetails={handleOpenDetails}
            onOpenOnMap={handleOpenOnMap}
            onOpenUserProfile={handleOpenUserProfile}
            onProfileLoaded={setProfileUser}
          />
        );
      case 'users-search':
        return <UserSearchPage onOpenUserProfile={handleOpenUserProfile} />;
      case 'messages':
        return (
          <MessagesPage
            initialRecipientId={messageRecipientId}
            onOpenUserProfile={handleOpenUserProfile}
          />
        );
      case 'user-profile':
        return selectedUserId ? (
          <UserProfilePage
            userId={selectedUserId}
            onOpenDetails={handleOpenDetails}
            onOpenOnMap={handleOpenOnMap}
            onOpenUserProfile={handleOpenUserProfile}
            onOpenMessages={handleOpenMessages}
          />
        ) : (
          renderFeed()
        );
      case 'place-details':
        return selectedPlace ? (
          <PlaceDetailsPage
            place={selectedPlace}
            onOpenOnMap={handleOpenOnMap}
            onEditPlace={handleOpenEditGeotag}
            onOpenUserProfile={handleOpenUserProfile}
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
