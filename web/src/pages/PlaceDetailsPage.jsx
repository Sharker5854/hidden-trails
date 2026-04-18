import { useEffect, useState } from 'react';
import {
  createCommentRequest,
  getCommentsRequest,
} from '../api/commentsApi';
import {
  likeGeotagRequest,
  unlikeGeotagRequest,
} from '../api/geotagsApi';
import EmojiPicker from '../components/forms/EmojiPicker';
import { getErrorMessage } from '../utils/errors';

function isVideoUrl(url) {
  return /\.(mp4|webm|ogg|mov)$/i.test(url || '');
}

function normalizeComment(comment) {
  return {
    id: comment.id,
    text: comment.text || '',
    authorId: comment.author?.id || comment.author_id || null,
    author:
      comment.author?.nickname ||
      comment.author ||
      comment.author_nickname ||
      'unknown',
    likes: comment.likes_count ?? comment.likes ?? 0,
    replies: Array.isArray(comment.replies)
      ? comment.replies.map(normalizeComment)
      : [],
  };
}

function CommentAuthor({ comment, onOpenUserProfile }) {
  return (
    <button
      type="button"
      className="comment-card__author"
      onClick={() => onOpenUserProfile?.(comment.authorId)}
      disabled={!comment.authorId}
    >
      @{comment.author}
    </button>
  );
}

export default function PlaceDetailsPage({
  place,
  onOpenOnMap,
  onEditPlace,
  onOpenUserProfile,
  onPlaceUpdated,
}) {
  const [commentText, setCommentText] = useState('');
  const [comments, setComments] = useState([]);
  const [commentsError, setCommentsError] = useState('');
  const [isCommentSubmitting, setIsCommentSubmitting] = useState(false);
  const [activeMediaIndex, setActiveMediaIndex] = useState(0);
  const [likes, setLikes] = useState(place?.likes || 0);
  const [isLiked, setIsLiked] = useState(Boolean(place?.likedByCurrentUser));
  const [likeError, setLikeError] = useState('');
  const [isLikeSubmitting, setIsLikeSubmitting] = useState(false);

  useEffect(() => {
    setLikes(place?.likes || 0);
    setIsLiked(Boolean(place?.likedByCurrentUser));
    setActiveMediaIndex(0);
  }, [place?.id, place?.likes, place?.likedByCurrentUser]);

  useEffect(() => {
    if (!place?.id) return;

    let isMounted = true;
    setCommentsError('');

    getCommentsRequest(place.id)
      .then((data) => {
        if (!isMounted) return;
        setComments((data?.comments || []).map(normalizeComment));
      })
      .catch((error) => {
        if (!isMounted) return;
        setCommentsError(getErrorMessage(error));
      });

    return () => {
      isMounted = false;
    };
  }, [place?.id]);

  const mediaFiles = Array.isArray(place?.mediaFiles)
    ? place.mediaFiles.filter(Boolean)
    : [];
  const safePlace = {
    title: place?.title || 'Без названия',
    fullDescription: place?.fullDescription || place?.description || '',
    image: place?.image || mediaFiles[0] || '',
    author: place?.author || 'unknown',
    authorAvatar: place?.authorAvatar || null,
    views: place?.views || 0,
    warnings: place?.warnings || '',
    tips: place?.tips || '',
    themes: Array.isArray(place?.themes) ? place.themes : [],
    mediaFiles,
  };

  const activeMedia =
    safePlace.mediaFiles[activeMediaIndex] || safePlace.image || null;
  const hasManyMedia = safePlace.mediaFiles.length > 1;

  const appendCommentEmoji = (emoji) => {
    setCommentText((prev) => `${prev}${emoji}`);
  };

  const updatePlaceLikes = (nextLikes, nextIsLiked) => {
    setLikes(nextLikes);
    setIsLiked(nextIsLiked);

    if (onPlaceUpdated) {
      onPlaceUpdated({
        ...place,
        likes: nextLikes,
        likedByCurrentUser: nextIsLiked,
      });
    }
  };

  const handleLikeToggle = async () => {
    if (!place?.id || isLikeSubmitting) return;

    setIsLikeSubmitting(true);
    setLikeError('');

    try {
      const data = isLiked
        ? await unlikeGeotagRequest(place.id)
        : await likeGeotagRequest(place.id);
      const nextLikes =
        data.total_likes ?? (isLiked ? Math.max(0, likes - 1) : likes + 1);

      updatePlaceLikes(nextLikes, !isLiked);
    } catch (error) {
      setLikeError(getErrorMessage(error));
    } finally {
      setIsLikeSubmitting(false);
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    const text = commentText.trim();
    if (!text || !place?.id) return;

    setIsCommentSubmitting(true);
    setCommentsError('');

    try {
      const createdComment = await createCommentRequest({
        geotag_id: place.id,
        text,
      });

      setComments((prev) => [normalizeComment(createdComment), ...prev]);
      setCommentText('');
    } catch (error) {
      setCommentsError(getErrorMessage(error));
    } finally {
      setIsCommentSubmitting(false);
    }
  };

  return (
    <main className="page">
      <section className="place-details">
        <div className="place-details__author">
          {safePlace.authorAvatar ? (
            <img
              src={safePlace.authorAvatar}
              alt="Аватар автора"
              className="place-details__avatar-image"
            />
          ) : (
            <div className="place-details__avatar">
              {safePlace.author.charAt(0).toUpperCase()}
            </div>
          )}

          <div>
            <div className="place-details__author-label">Автор</div>
            <button
              type="button"
              className="place-details__author-name place-details__author-button"
              onClick={() => onOpenUserProfile?.(place?.authorId)}
            >
              @{safePlace.author}
            </button>
          </div>
        </div>

        <div className="place-details__media">
          <div className="place-details__carousel-frame">
            {activeMedia ? (
              isVideoUrl(activeMedia) ? (
                <video src={activeMedia} className="place-details__image" controls />
              ) : (
                <img
                  src={activeMedia}
                  alt={safePlace.title}
                  className="place-details__image"
                />
              )
            ) : (
              <div className="place-details__image place-details__image--empty">
                Нет фото
              </div>
            )}
          </div>

          {hasManyMedia ? (
            <div className="place-details__carousel-controls">
              <button
                type="button"
                className="secondary-button"
                onClick={() =>
                  setActiveMediaIndex((prev) =>
                    prev === 0 ? safePlace.mediaFiles.length - 1 : prev - 1
                  )
                }
              >
                Назад
              </button>
              <span>
                {activeMediaIndex + 1} / {safePlace.mediaFiles.length}
              </span>
              <button
                type="button"
                className="secondary-button"
                onClick={() =>
                  setActiveMediaIndex((prev) =>
                    prev === safePlace.mediaFiles.length - 1 ? 0 : prev + 1
                  )
                }
              >
                Вперед
              </button>
            </div>
          ) : null}

          <div className="place-details__stats">
            <button
              type="button"
              className={`like-button ${isLiked ? 'like-button--active' : ''}`}
              onClick={handleLikeToggle}
              disabled={isLikeSubmitting}
            >
              {likes} лайков
            </button>
            <div className="place-details__stat">{safePlace.views} просмотров</div>
          </div>

          {likeError ? <p className="auth-form__error">{likeError}</p> : null}
        </div>

        <div className="place-details__content">
          <div className="place-details__content-top">
            <h1 className="place-details__title">{safePlace.title}</h1>

            <div className="place-details__content-actions">
              <button
                className="secondary-button"
                onClick={() => onOpenOnMap(place)}
              >
                На карту
              </button>

              <button
                className="secondary-button"
                onClick={() => onEditPlace(place)}
              >
                Редактировать
              </button>
            </div>
          </div>

          {safePlace.themes.length > 0 ? (
            <div className="place-details__themes">
              {safePlace.themes.map((theme) => (
                <span key={theme.id} className="theme-badge">
                  {theme.name}
                </span>
              ))}
            </div>
          ) : null}

          <p className="place-details__text">{safePlace.fullDescription}</p>

          {safePlace.warnings ? (
            <div className="place-details__note place-details__note--warning">
              <h3>Предупреждения</h3>
              <p>{safePlace.warnings}</p>
            </div>
          ) : null}

          {safePlace.tips ? (
            <div className="place-details__note place-details__note--tip">
              <h3>Совет</h3>
              <p>{safePlace.tips}</p>
            </div>
          ) : null}
        </div>

        <section className="comments-section">
          <h2 className="section-title">Комментарии</h2>

          {commentsError ? (
            <p className="auth-form__error">{commentsError}</p>
          ) : null}

          {comments.length > 0 ? (
            <div className="comments-list">
              {comments.map((comment) => (
                <article key={comment.id} className="comment-card">
                  <CommentAuthor
                    comment={comment}
                    onOpenUserProfile={onOpenUserProfile}
                  />
                  <p className="comment-card__text">{comment.text}</p>
                  {comment.replies.length > 0 ? (
                    <div className="comment-card__replies">
                      {comment.replies.map((reply) => (
                        <article key={reply.id} className="comment-card comment-card--reply">
                          <CommentAuthor
                            comment={reply}
                            onOpenUserProfile={onOpenUserProfile}
                          />
                          <p className="comment-card__text">{reply.text}</p>
                        </article>
                      ))}
                    </div>
                  ) : null}
                </article>
              ))}
            </div>
          ) : (
            <p className="comments-section__empty">
              Оставь первый комментарий!
            </p>
          )}

          <form className="comment-form" onSubmit={handleSubmit}>
            <textarea
              className="comment-form__textarea"
              placeholder="Напиши комментарий..."
              value={commentText}
              onChange={(event) => setCommentText(event.target.value)}
              required
            />

            <div className="comment-form__bottom">
              <EmojiPicker onSelect={appendCommentEmoji} />
              <button
                type="submit"
                className="primary-button comment-form__button"
                disabled={isCommentSubmitting}
              >
                {isCommentSubmitting ? 'Отправляем...' : 'Отправить'}
              </button>
            </div>
          </form>
        </section>
      </section>
    </main>
  );
}
