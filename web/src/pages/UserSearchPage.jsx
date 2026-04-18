import { useEffect, useState } from 'react';
import {
  getTopUsersRequest,
  getUsersPageRequest,
  searchUsersRequest,
} from '../api/usersApi';
import { getErrorMessage } from '../utils/errors';
import {
  normalizeUserMini,
  normalizeUsersPage,
} from '../utils/users';

const PAGE_SIZE = 10;

function UserAvatar({ user }) {
  if (user.avatarUrl) {
    return <img src={user.avatarUrl} alt={user.nickname} />;
  }

  return <span>{user.nickname.charAt(0).toUpperCase()}</span>;
}

function UserRow({ user, onOpenUserProfile }) {
  return (
    <button
      type="button"
      className="user-result"
      onClick={() => onOpenUserProfile(user.id)}
    >
      <UserAvatar user={user} />
      <div>
        <strong>@{user.nickname}</strong>
        <small>{user.rating} баллов</small>
      </div>
    </button>
  );
}

export default function UserSearchPage({ onOpenUserProfile }) {
  const [query, setQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [topUsers, setTopUsers] = useState([]);
  const [usersPage, setUsersPage] = useState({
    users: [],
    page: 1,
    pageSize: PAGE_SIZE,
    total: 0,
    totalPages: 1,
  });
  const [error, setError] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [isTopLoading, setIsTopLoading] = useState(false);
  const [isPageLoading, setIsPageLoading] = useState(false);

  const loadTopUsers = async () => {
    setIsTopLoading(true);
    setError('');

    try {
      const data = await getTopUsersRequest(7);
      setTopUsers((data?.users || []).map(normalizeUserMini).filter(Boolean));
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setIsTopLoading(false);
    }
  };

  const loadUsersPage = async (page = 1) => {
    setIsPageLoading(true);
    setError('');

    try {
      const data = await getUsersPageRequest({ page, pageSize: PAGE_SIZE });
      setUsersPage(normalizeUsersPage(data));
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setIsPageLoading(false);
    }
  };

  useEffect(() => {
    loadTopUsers();
    loadUsersPage(1);
  }, []);

  const handleSubmit = async (event) => {
    event.preventDefault();

    const nickname = query.trim();
    if (!nickname) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    setError('');

    try {
      const data = await searchUsersRequest(nickname);
      setSearchResults((data?.users || []).map(normalizeUserMini).filter(Boolean));
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setIsSearching(false);
    }
  };

  const hasSearchQuery = Boolean(query.trim());

  return (
    <main className="page">
      <section className="hero">
        <h1>Люди</h1>
        <p>Ищи путешественников, открывай профили и находи тех, за кем хочется следить.</p>
      </section>

      <form className="user-search-form" onSubmit={handleSubmit}>
        <input
          className="auth-form__input"
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Никнейм"
        />
        <button className="primary-button" type="submit" disabled={isSearching}>
          {isSearching ? 'Ищем...' : 'Найти'}
        </button>
      </form>

      {error ? <p className="auth-form__error">{error}</p> : null}

      <section className="people-top">
        <div className="profile-section-header">
          <h2 className="section-title">Топ пользователей</h2>
          {isTopLoading ? (
            <span className="profile-section-header__hint">Обновляем рейтинг...</span>
          ) : null}
        </div>

        <div className="people-top__grid">
          {topUsers.map((user, index) => (
            <button
              key={user.id}
              type="button"
              className={`people-top__item people-top__item--rank-${index + 1}`}
              onClick={() => onOpenUserProfile(user.id)}
            >
              <div className="people-top__rank">{index + 1}</div>
              <div className="people-top__avatar">
                <UserAvatar user={user} />
              </div>
              <strong>@{user.nickname}</strong>
              <small>{user.rating} баллов</small>
            </button>
          ))}
        </div>
      </section>

      {hasSearchQuery ? (
        <section className="people-section">
          <h2 className="section-title">Результаты поиска</h2>
          {searchResults.length > 0 ? (
            <div className="users-results">
              {searchResults.map((user) => (
                <UserRow
                  key={user.id}
                  user={user}
                  onOpenUserProfile={onOpenUserProfile}
                />
              ))}
            </div>
          ) : (
            <p className="page-state">Никого не нашли по этому запросу.</p>
          )}
        </section>
      ) : null}

      <section className="people-section">
        <div className="profile-section-header">
          <div>
            <h2 className="section-title">Все пользователи</h2>
            <span className="profile-section-header__hint">
              {usersPage.total} зарегистрировано
            </span>
          </div>
          {isPageLoading ? (
            <span className="profile-section-header__hint">Загружаем...</span>
          ) : null}
        </div>

        <div className="people-list">
          {usersPage.users.map((user) => (
            <UserRow
              key={user.id}
              user={user}
              onOpenUserProfile={onOpenUserProfile}
            />
          ))}
        </div>

        <div className="pagination">
          <button
            type="button"
            className="secondary-button"
            disabled={usersPage.page <= 1 || isPageLoading}
            onClick={() => loadUsersPage(usersPage.page - 1)}
          >
            Назад
          </button>
          <span>
            Страница {usersPage.page} из {usersPage.totalPages}
          </span>
          <button
            type="button"
            className="secondary-button"
            disabled={usersPage.page >= usersPage.totalPages || isPageLoading}
            onClick={() => loadUsersPage(usersPage.page + 1)}
          >
            Вперед
          </button>
        </div>
      </section>
    </main>
  );
}
