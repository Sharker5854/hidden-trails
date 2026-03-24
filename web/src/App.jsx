import { useEffect, useState } from 'react';
import './App.css';

import Header from './components/layout/Header';
import FeedPage from './pages/FeedPage';
import MapPage from './pages/MapPage';
import ProfilePage from './pages/ProfilePage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';

const AUTH_STORAGE_KEY = 'hidden-trails-auth';

export default function App() {
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [currentPage, setCurrentPage] = useState('login');
  const [isReady, setIsReady] = useState(false);

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
  };

  const handleNavigate = (page) => {
    if (page === 'logout') {
      handleLogout();
      return;
    }

    setCurrentPage(page);
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
        return <MapPage />;
      case 'profile':
        return <ProfilePage />;
      case 'feed':
      default:
        return <FeedPage />;
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