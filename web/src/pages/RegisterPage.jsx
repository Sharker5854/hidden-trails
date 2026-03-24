export default function RegisterPage() {
  return (
    <main className="page auth-page">
      <form className="auth-form">
        <h1>Регистрация</h1>

        <label className="auth-form__label">
          Username
          <input className="auth-form__input" type="text" placeholder="anna_trails" />
        </label>

        <label className="auth-form__label">
          Email
          <input className="auth-form__input" type="email" placeholder="you@example.com" />
        </label>

        <label className="auth-form__label">
          Пароль
          <input className="auth-form__input" type="password" placeholder="••••••••" />
        </label>

        <button type="submit" className="primary-button auth-form__button">
          Создать аккаунт
        </button>
      </form>
    </main>
  );
}