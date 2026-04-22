import { useState } from 'react';

export default function LoginPage({ onLogin, onGoToRegister, isLoading, error }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = async (event) => {
    event.preventDefault();
    await onLogin({ email, password });
  };

  return (
    <main className="page auth-page">
      <form className="auth-form" onSubmit={handleSubmit}>
        <h1>Вход</h1>

        <label className="auth-form__label">
          Email
          <input
            className="auth-form__input"
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="eve@example.com"
            autoComplete="email"
            required
          />
        </label>

        <label className="auth-form__label">
          Пароль
          <input
            className="auth-form__input"
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="Введите пароль"
            autoComplete="current-password"
            required
          />
        </label>

        {error ? <p className="auth-form__error">{error}</p> : null}

        <button
          type="submit"
          className="primary-button auth-form__button"
          disabled={isLoading}
        >
          {isLoading ? 'Входим...' : 'Войти'}
        </button>

        <button
          type="button"
          className="auth-form__link-button"
          onClick={onGoToRegister}
          disabled={isLoading}
        >
          Зарегистрироваться
        </button>
      </form>
    </main>
  );
}
