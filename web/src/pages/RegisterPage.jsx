import { useState } from 'react';

export default function RegisterPage({
  onRegister,
  onGoToLogin,
  isLoading,
  error,
}) {
  const [nickname, setNickname] = useState('eve');
  const [email, setEmail] = useState('eve@example.com');
  const [password, setPassword] = useState('eve');
  const [passwordRepeat, setPasswordRepeat] = useState('eve');

  const handleSubmit = async (event) => {
    event.preventDefault();

    await onRegister({
      email,
      nickname,
      password,
      password_repeat: passwordRepeat,
    });
  };

  return (
    <main className="page auth-page">
      <form className="auth-form" onSubmit={handleSubmit}>
        <h1>Регистрация</h1>

        <label className="auth-form__label">
          Никнейм
          <input
            className="auth-form__input"
            type="text"
            value={nickname}
            onChange={(event) => setNickname(event.target.value)}
            placeholder="eve"
          />
        </label>

        <label className="auth-form__label">
          Email
          <input
            className="auth-form__input"
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="eve@example.com"
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

        <label className="auth-form__label">
          Повторите пароль
          <input
            className="auth-form__input"
            type="password"
            value={passwordRepeat}
            onChange={(event) => setPasswordRepeat(event.target.value)}
            placeholder="eve"
          />
        </label>

        {error ? <p className="auth-form__error">{error}</p> : null}

        <button
          type="submit"
          className="primary-button auth-form__button"
          disabled={isLoading}
        >
          {isLoading ? 'Создаём аккаунт...' : 'Создать аккаунт'}
        </button>

        <button
          type="button"
          className="auth-form__link-button"
          onClick={onGoToLogin}
          disabled={isLoading}
        >
          Уже есть аккаунт? Войти
        </button>
      </form>
    </main>
  );
}