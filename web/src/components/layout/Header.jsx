import { useEffect, useRef, useState } from 'react';
import { resolveAvatarUrl } from '../../utils/assets';

export default function Header({ currentPage, onNavigate, user }) {
  const items = [
    { key: 'feed', label: 'Лента' },
    { key: 'map', label: 'Карта' },
    { key: 'users-search', label: 'Люди' },
    { key: 'messages', label: 'Сообщения' },
  ];

  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleProfileClick = () => {
    setIsMenuOpen(false);
    onNavigate('profile');
  };

  const handleLogoutClick = () => {
    setIsMenuOpen(false);
    onNavigate('logout');
  };

  const avatarLetter =
    user?.nickname?.trim()?.charAt(0)?.toUpperCase() ||
    user?.email?.trim()?.charAt(0)?.toUpperCase() ||
    'U';

  const avatarUrl = user?.avatarUrl || resolveAvatarUrl(user?.avatar_url);

  return (
    <header className="header">
      <div className="header__inner">
        <div className="logo" onClick={() => onNavigate('feed')}>
          Hidden Trails
        </div>

        <div className="header__right">
          <nav className="nav">
            {items.map((item) => (
              <button
                key={item.key}
                className={`nav__button ${
                  currentPage === item.key ? 'nav__button--active' : ''
                }`}
                onClick={() => onNavigate(item.key)}
              >
                {item.label}
              </button>
            ))}
          </nav>

          <div className="profile-menu" ref={menuRef}>
            <button
              type="button"
              className="profile-menu__trigger"
              onClick={() => setIsMenuOpen((prev) => !prev)}
              aria-label="Открыть меню профиля"
            >
              {avatarUrl ? (
                <img
                  src={avatarUrl}
                  alt="Аватар пользователя"
                  className="profile-menu__avatar-image"
                />
              ) : (
                <div className="profile-menu__avatar">{avatarLetter}</div>
              )}
            </button>

            {isMenuOpen && (
              <div className="profile-menu__dropdown">
                <button
                  type="button"
                  className="profile-menu__item"
                  onClick={handleProfileClick}
                >
                  Профиль
                </button>

                <button
                  type="button"
                  className="profile-menu__item profile-menu__item--danger"
                  onClick={handleLogoutClick}
                >
                  Выйти
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
