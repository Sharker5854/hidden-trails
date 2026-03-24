import { useState } from 'react';

export default function RegisterPage({ onRegister, onGoToLogin }) {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('eve');
  const [password, setPassword] = useState('eve');

  const handleSubmit = (event) => {
    event.preventDefault();
    onRegister({ username, email, password });
  };

  return (
    <main className="page auth-page">
      <form className="auth-form" onSubmit={handleSubmit}>
        <h1>Регистрация</h1>

        <label className="auth-form__label">
          Username
          <input
            className="auth-form__input"
            type="text"
            value={username}
            onChange={(event) => setUsername(event.target.value)}
            placeholder="eve"
          />
        </label>

        <label className="auth-form__label">
          Email
          <input
            className="auth-form__input"
            type="text"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="eve"
          />
        </label>

        <label className="auth-form__label">
          Пароль
          <input
            className="auth-form__input"
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="eve"
          />
        </label>

        <button type="submit" className="primary-button auth-form__button">
          Создать аккаунт
        </button>

        <button
          type="button"
          className="auth-form__link-button"
          onClick={onGoToLogin}
        >
          Уже есть аккаунт? Войти
        </button>
      </form>
    </main>
  );
}