export default function Header({ currentPage, onNavigate }) {
  const items = [
    { key: 'feed', label: 'Лента' },
    { key: 'map', label: 'Карта' },
    { key: 'profile', label: 'Профиль' },
  ];

  return (
    <header className="header">
      <div className="header__inner">
        <div className="logo" onClick={() => onNavigate('feed')}>
          Hidden Trails
        </div>

        <nav className="nav">
          {items.map((item) => (
            <button
              key={item.key}
              className={`nav__button ${currentPage === item.key ? 'nav__button--active' : ''}`}
              onClick={() => onNavigate(item.key)}
            >
              {item.label}
            </button>
          ))}

          <button
            className="nav__button nav__button--logout"
            onClick={() => onNavigate('logout')}
          >
            Выйти
          </button>
        </nav>
      </div>
    </header>
  );
}