import { useState } from 'react';
import { searchUsersRequest } from '../api/usersApi';
import { getErrorMessage } from '../utils/errors';
import { normalizeUserMini } from '../utils/users';

export default function UserSearchPage({ onOpenUserProfile }) {
  const [query, setQuery] = useState('');
  const [users, setUsers] = useState([]);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();

    const nickname = query.trim();
    if (!nickname) return;

    setIsLoading(true);
    setError('');

    try {
      const data = await searchUsersRequest(nickname);
      setUsers((data?.users || []).map(normalizeUserMini).filter(Boolean));
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="page">
      <section className="hero">
        <h1>Поиск людей</h1>
        <p>Найди пользователя по никнейму, открой профиль и подпишись.</p>
      </section>

      <form className="user-search-form" onSubmit={handleSubmit}>
        <input
          className="auth-form__input"
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Никнейм"
        />
        <button className="primary-button" type="submit" disabled={isLoading}>
          {isLoading ? 'Ищем...' : 'Найти'}
        </button>
      </form>

      {error ? <p className="auth-form__error">{error}</p> : null}

      <section className="users-results">
        {users.map((user) => (
          <button
            key={user.id}
            type="button"
            className="user-result"
            onClick={() => onOpenUserProfile(user.id)}
          >
            {user.avatarUrl ? (
              <img src={user.avatarUrl} alt={user.nickname} />
            ) : (
              <span>{user.nickname.charAt(0).toUpperCase()}</span>
            )}
            <div>
              <strong>@{user.nickname}</strong>
              <small>Рейтинг: {user.rating}</small>
            </div>
          </button>
        ))}
      </section>
    </main>
  );
}
