export default function UserRelations({
  title,
  users = [],
  emptyText,
  onOpenUserProfile,
}) {
  return (
    <details className="relations-list">
      <summary>
        {title} <span>{users.length}</span>
      </summary>

      {users.length > 0 ? (
        <div className="relations-list__items">
          {users.map((user) => (
            <button
              key={user.id}
              type="button"
              className="relations-list__item"
              onClick={() => onOpenUserProfile(user.id)}
            >
              {user.avatarUrl ? (
                <img src={user.avatarUrl} alt={user.nickname} />
              ) : (
                <span>{user.nickname.charAt(0).toUpperCase()}</span>
              )}
              <strong>@{user.nickname}</strong>
            </button>
          ))}
        </div>
      ) : (
        <p className="profile-section-header__hint">{emptyText}</p>
      )}
    </details>
  );
}
