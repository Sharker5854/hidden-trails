import { useState } from 'react';
import './App.css';

import Header from './components/layout/Header';
import FeedPage from './pages/FeedPage';
import MapPage from './pages/MapPage';
import ProfilePage from './pages/ProfilePage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';

export default function App() {
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [currentPage, setCurrentPage] = useState('login');

  const handleLogin = () => {
    setIsAuthorized(true);
    setCurrentPage('feed');
  };

  const handleRegister = () => {
    setIsAuthorized(true);
    setCurrentPage('feed');
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
      case 'login':
        return (
          <LoginPage
            onLogin={handleLogin}
            onGoToRegister={() => setCurrentPage('register')}
          />
        );
      case 'register':
        return (
          <RegisterPage
            onRegister={handleRegister}
            onGoToLogin={() => setCurrentPage('login')}
          />
        );
      case 'feed':
      default:
        return <FeedPage />;
    }
  };

  return (
    <div className="app-shell">
      {isAuthorized && (
        <Header currentPage={currentPage} onNavigate={setCurrentPage} />
      )}
      {renderPage()}
    </div>
  );
}