import { useState } from 'react';
import Header from './components/layout/Header';
import FeedPage from './pages/FeedPage';
import MapPage from './pages/MapPage';
import ProfilePage from './pages/ProfilePage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';

export default function App() {
  const [currentPage, setCurrentPage] = useState('feed');

  const renderPage = () => {
    switch (currentPage) {
      case 'map':
        return <MapPage />;
      case 'profile':
        return <ProfilePage />;
      case 'login':
        return <LoginPage />;
      case 'register':
        return <RegisterPage />;
      case 'feed':
      default:
        return <FeedPage />;
    }
  };

  return (
    <div className="app-shell">
      <Header currentPage={currentPage} onNavigate={setCurrentPage} />
      {renderPage()}
    </div>
  );
}