import { useEffect, useState } from 'react';
import './App.css';

import Header from './components/layout/Header';
import FeedPage from './pages/FeedPage';
import MapPage from './pages/MapPage';
import ProfilePage from './pages/ProfilePage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import PlaceDetailsPage from './pages/PlaceDetailsPage';

const AUTH_STORAGE_KEY = 'hidden-trails-auth';

export default function App() {
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [currentPage, setCurrentPage] = useState('login');
  const [isReady, setIsReady] = useState(false);
  const [selectedPlace, setSelectedPlace] = useState(null);
  const [mapFocusedPlace, setMapFocusedPlace] = useState(null);

  useEffect(() => {
    const savedAuth = localStorage.getItem(AUTH_STORAGE_KEY);

    if (savedAuth === 'true') {
      setIsAuthorized(true);
      setCurrentPage('feed');
    } else {
      setIsAuthorized(false);
      setCurrentPage('login');
    }

    setIsReady(true);
  }, []);

  const handleLogin = () => {
    localStorage.setItem(AUTH_STORAGE_KEY, 'true');
    setIsAuthorized(true);
    setCurrentPage('feed');
  };

  const handleRegister = () => {
    localStorage.setItem(AUTH_STORAGE_KEY, 'true');
    setIsAuthorized(true);
    setCurrentPage('feed');
  };

  const handleLogout = () => {
    localStorage.removeItem(AUTH_STORAGE_KEY);
    setIsAuthorized(false);
    setCurrentPage('login');
    setSelectedPlace(null);
    setMapFocusedPlace(null);
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

  const renderPage = () => {
    if (!isAuthorized) {
      if (currentPage === 'register') {
        return (
          <RegisterPage
            onRegister={handleRegister}
            onGoToLogin={() => setCurrentPage('login')}
          />
        );
      }

      return (
        <LoginPage
          onLogin={handleLogin}
          onGoToRegister={() => setCurrentPage('register')}
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
          />
        );
      case 'place-details':
        return selectedPlace ? (
          <PlaceDetailsPage
            place={selectedPlace}
            onOpenOnMap={handleOpenOnMap}
          />
        ) : (
          <FeedPage
            onOpenDetails={handleOpenDetails}
            onOpenOnMap={handleOpenOnMap}
          />
        );
      case 'feed':
      default:
        return (
          <FeedPage
            onOpenDetails={handleOpenDetails}
            onOpenOnMap={handleOpenOnMap}
          />
        );
    }
  };

  if (!isReady) {
    return null;
  }

  return (
    <div className="app-shell">
      {isAuthorized && (
        <Header currentPage={currentPage} onNavigate={handleNavigate} />
      )}
      {renderPage()}
    </div>
  );
}