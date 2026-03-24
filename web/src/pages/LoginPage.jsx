export default function LoginPage() {
  return (
    <main className="page auth-page">
      <form className="auth-form">
        <h1>Вход</h1>

        <label className="auth-form__label">
          Email
          <input className="auth-form__input" type="email" placeholder="you@example.com" />
        </label>

        <label className="auth-form__label">
          Пароль
          <input className="auth-form__input" type="password" placeholder="••••••••" />
        </label>

        <button type="submit" className="primary-button auth-form__button">
          Войти
        </button>
      </form>
    </main>
  );
}