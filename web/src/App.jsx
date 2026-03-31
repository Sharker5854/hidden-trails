import { useState } from 'react';
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

export default function App() {
  const {
    user,
    isAuthorized,
    isLoading,
    authError,
    login,
    register,
    logout,
  } = useAuth();

  const [currentPage, setCurrentPage] = useState('login');
  const [selectedPlace, setSelectedPlace] = useState(null);
  const [mapFocusedPlace, setMapFocusedPlace] = useState(null);
  const [profileUser, setProfileUser] = useState(null);

  const activeUser = profileUser || user;

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

  const renderPage = () => {
    if (isLoading && !isAuthorized) {
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
            isLoading={isLoading}
            error={authError}
          />
        );
      }

      return (
        <LoginPage
          onLogin={handleLogin}
          onGoToRegister={() => setCurrentPage('register')}
          isLoading={isLoading}
          error={authError}
        />
      );
    }

    switch (currentPage) {
      case 'map':
        return <MapPage focusedPlace={mapFocusedPlace} />;
      case 'profile':
        return (
          <ProfilePage
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
          />
        ) : (
          <FeedPage
            onOpenDetails={handleOpenDetails}
            onOpenOnMap={handleOpenOnMap}
            onOpenCreateGeotag={handleOpenCreateGeotag}
          />
        );
      case 'create-geotag':
        return (
          <CreateGeotagPage
            onCreated={(createdGeotag) => {
              setSelectedPlace(createdGeotag);
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
              setSelectedPlace(updatedGeotag);
              setCurrentPage('place-details');
            }}
            onCancel={() => setCurrentPage('place-details')}
          />
        ) : (
          <FeedPage
            onOpenDetails={handleOpenDetails}
            onOpenOnMap={handleOpenOnMap}
            onOpenCreateGeotag={handleOpenCreateGeotag}
          />
        );
      case 'feed':
      default:
        return (
          <FeedPage
            onOpenDetails={handleOpenDetails}
            onOpenOnMap={handleOpenOnMap}
            onOpenCreateGeotag={handleOpenCreateGeotag}
          />
        );
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