import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  getConversationMessagesRequest,
  getConversationsRequest,
  sendMessageRequest,
} from '../api/messagesApi';
import { getUserProfileRequest } from '../api/usersApi';
import EmojiPicker from '../components/forms/EmojiPicker';
import { getErrorMessage } from '../utils/errors';
import {
  normalizeConversations,
  normalizeMessages,
} from '../utils/messages';
import { normalizeUserProfile } from '../utils/users';

function Avatar({ user }) {
  const letter = user?.nickname?.charAt(0)?.toUpperCase() || 'U';

  if (user?.avatarUrl) {
    return <img src={user.avatarUrl} alt={user.nickname} />;
  }

  return <span>{letter}</span>;
}

export default function MessagesPage({
  initialRecipientId,
  onOpenUserProfile,
}) {
  const [conversations, setConversations] = useState([]);
  const [selectedConversationId, setSelectedConversationId] = useState(null);
  const [draftRecipientId, setDraftRecipientId] = useState(initialRecipientId ?? null);
  const [draftRecipient, setDraftRecipient] = useState(null);
  const [messages, setMessages] = useState([]);
  const [messageText, setMessageText] = useState('');
  const [error, setError] = useState('');
  const [isLoadingConversations, setIsLoadingConversations] = useState(false);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [isSending, setIsSending] = useState(false);

  const selectedConversation = useMemo(
    () => conversations.find((conversation) => conversation.id === selectedConversationId),
    [conversations, selectedConversationId]
  );

  const activePartner = selectedConversation?.partner || draftRecipient;

  const loadConversations = useCallback(async () => {
    setIsLoadingConversations(true);
    setError('');

    try {
      const data = await getConversationsRequest();
      const loadedConversations = normalizeConversations(data?.conversations);
      setConversations(loadedConversations);
      return loadedConversations;
    } catch (err) {
      setError(getErrorMessage(err));
      return [];
    } finally {
      setIsLoadingConversations(false);
    }
  }, []);

  const loadMessages = useCallback(async (conversationId) => {
    if (!conversationId) return;

    setIsLoadingMessages(true);
    setError('');

    try {
      const data = await getConversationMessagesRequest(conversationId);
      setMessages(normalizeMessages(data?.messages));
      setConversations((prev) =>
        prev.map((conversation) =>
          conversation.id === conversationId
            ? { ...conversation, unreadCount: 0 }
            : conversation
        )
      );
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setIsLoadingMessages(false);
    }
  }, []);

  useEffect(() => {
    loadConversations().then((loadedConversations) => {
      if (initialRecipientId) {
        const existingConversation = loadedConversations.find(
          (conversation) => conversation.partner.id === initialRecipientId
        );

        if (existingConversation) {
          setSelectedConversationId(existingConversation.id);
          setDraftRecipientId(null);
        } else {
          setSelectedConversationId(null);
          setDraftRecipientId(initialRecipientId);
          setMessages([]);
        }
      }
    });
  }, [initialRecipientId, loadConversations]);

  useEffect(() => {
    if (!draftRecipientId || selectedConversation) {
      setDraftRecipient(null);
      return;
    }

    getUserProfileRequest(draftRecipientId)
      .then((data) => setDraftRecipient(normalizeUserProfile(data)))
      .catch((err) => setError(getErrorMessage(err)));
  }, [draftRecipientId, selectedConversation]);

  useEffect(() => {
    if (selectedConversationId) {
      loadMessages(selectedConversationId);
    }
  }, [selectedConversationId, loadMessages]);

  const handleSelectConversation = (conversation) => {
    setDraftRecipientId(null);
    setSelectedConversationId(conversation.id);
  };

  const appendMessageEmoji = (emoji) => {
    setMessageText((prev) => `${prev}${emoji}`);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    const recipientId = selectedConversation?.partner.id || draftRecipientId;
    if (!recipientId || !messageText.trim()) return;

    setIsSending(true);
    setError('');

    try {
      const data = await sendMessageRequest({
        recipientId,
        text: messageText,
      });
      const sentMessage = data?.message;
      setMessageText('');

      const loadedConversations = await loadConversations();
      const conversationId = sentMessage?.conversation_id ?? sentMessage?.conversationId;
      const nextConversationId =
        conversationId ||
        loadedConversations.find((conversation) => conversation.partner.id === recipientId)?.id;

      if (nextConversationId) {
        setDraftRecipientId(null);
        setSelectedConversationId(nextConversationId);
        await loadMessages(nextConversationId);
      }
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setIsSending(false);
    }
  };

  return (
    <main className="page">
      <section className="hero">
        <h1>Сообщения</h1>
        <p>Пиши людям, с которыми хочется обсудить маршрут или место.</p>
      </section>

      <section className="messages-layout">
        <aside className="messages-sidebar">
          <h2>Диалоги</h2>

          {isLoadingConversations ? (
            <p className="page-state">Загружаем диалоги...</p>
          ) : null}

          {!isLoadingConversations && conversations.length === 0 ? (
            <p className="page-state">Диалогов пока нет.</p>
          ) : null}

          <div className="conversation-list">
            {conversations.map((conversation) => (
              <button
                key={conversation.id}
                type="button"
                className={`conversation-item ${
                  conversation.id === selectedConversationId
                    ? 'conversation-item--active'
                    : ''
                }`}
                onClick={() => handleSelectConversation(conversation)}
              >
                <Avatar user={conversation.partner} />
                <div>
                  <strong>@{conversation.partner.nickname}</strong>
                  <small>
                    {conversation.lastMessage?.text || 'Пока без сообщений'}
                  </small>
                </div>
                {conversation.unreadCount > 0 ? (
                  <b>{conversation.unreadCount}</b>
                ) : null}
              </button>
            ))}
          </div>
        </aside>

        <section className="messages-thread">
          {activePartner ? (
            <>
              <div className="messages-thread__header">
                <button
                  type="button"
                  className="messages-thread__partner"
                  onClick={() => onOpenUserProfile?.(activePartner.id)}
                >
                  <Avatar user={activePartner} />
                  <span>@{activePartner.nickname}</span>
                </button>
              </div>

              <div className="messages-list">
                {isLoadingMessages ? (
                  <p className="page-state">Загружаем сообщения...</p>
                ) : null}

                {!isLoadingMessages && messages.length === 0 ? (
                  <p className="messages-list__empty">
                    Начни разговор первым сообщением.
                  </p>
                ) : null}

                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`message-bubble ${
                      message.isMine ? 'message-bubble--mine' : ''
                    }`}
                  >
                    <p>{message.text}</p>
                    <time dateTime={message.createdAt}>
                      {message.createdAt
                        ? new Date(message.createdAt).toLocaleString('ru-RU', {
                            day: '2-digit',
                            month: '2-digit',
                            hour: '2-digit',
                            minute: '2-digit',
                          })
                        : ''}
                    </time>
                  </div>
                ))}
              </div>

              <form className="message-form" onSubmit={handleSubmit}>
                <textarea
                  className="input message-form__input"
                  value={messageText}
                  onChange={(event) => setMessageText(event.target.value)}
                  placeholder="Напиши сообщение"
                  maxLength={4000}
                />
                <div className="message-form__side">
                  <EmojiPicker onSelect={appendMessageEmoji} />
                  <button
                    type="submit"
                    className="primary-button"
                    disabled={isSending || !messageText.trim()}
                  >
                    Отправить
                  </button>
                </div>
              </form>
            </>
          ) : (
            <div className="messages-empty">
              <h2>Выбери диалог</h2>
              <p>Переписка откроется здесь.</p>
            </div>
          )}

          {error ? <p className="auth-form__error">{error}</p> : null}
        </section>
      </section>
    </main>
  );
}
