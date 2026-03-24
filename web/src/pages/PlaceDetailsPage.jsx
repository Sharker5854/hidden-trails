import { useState } from 'react';

export default function PlaceDetailsPage({ place }) {
  const [commentText, setCommentText] = useState('');

  const handleSubmit = (event) => {
    event.preventDefault();
    setCommentText('');
  };

  return (
    <main className="page">
      <section className="place-details">
        <div className="place-details__author">
          <div className="place-details__avatar">{place.authorAvatar}</div>
          <div>
            <div className="place-details__author-label">Автор</div>
            <div className="place-details__author-name">@{place.author}</div>
          </div>
        </div>

        <div className="place-details__media">
          <img src={place.image} alt={place.title} className="place-details__image" />
        </div>

        <div className="place-details__content">
          <h1 className="place-details__title">{place.title}</h1>
          <p className="place-details__text">{place.fullDescription}</p>
        </div>

        <section className="comments-section">
          <h2 className="section-title">Комментарии</h2>

          {place.comments.length > 0 ? (
            <div className="comments-list">
              {place.comments.map((comment) => (
                <article key={comment.id} className="comment-card">
                  <div className="comment-card__author">@{comment.author}</div>
                  <p className="comment-card__text">{comment.text}</p>
                </article>
              ))}
            </div>
          ) : (
            <p className="comments-section__empty">Оставь первый комментарий!</p>
          )}

          <form className="comment-form" onSubmit={handleSubmit}>
            <textarea
              className="comment-form__textarea"
              placeholder="Напиши комментарий..."
              value={commentText}
              onChange={(event) => setCommentText(event.target.value)}
            />

            <button type="submit" className="primary-button comment-form__button">
              Отправить
            </button>
          </form>
        </section>
      </section>
    </main>
  );
}