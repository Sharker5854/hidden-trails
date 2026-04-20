import { resolveAvatarUrl } from './assets';

export function normalizeMessage(rawMessage) {
  if (!rawMessage) return null;

  return {
    id: rawMessage.id,
    conversationId: rawMessage.conversation_id ?? rawMessage.conversationId,
    senderId: rawMessage.sender_id ?? rawMessage.senderId,
    recipientId: rawMessage.recipient_id ?? rawMessage.recipientId,
    text: rawMessage.text ?? '',
    createdAt: rawMessage.created_at ?? rawMessage.createdAt,
    isRead: rawMessage.is_read ?? rawMessage.isRead ?? false,
    isMine: rawMessage.is_mine ?? rawMessage.isMine ?? false,
  };
}

export function normalizeConversation(rawConversation) {
  if (!rawConversation) return null;

  const partner = rawConversation.partner ?? {};

  return {
    id: rawConversation.id,
    partner: {
      id: partner.id,
      nickname: partner.nickname ?? 'unknown',
      avatarUrl: resolveAvatarUrl(partner.avatar_url ?? partner.avatarUrl),
      rating: partner.rating ?? 0,
    },
    lastMessage: normalizeMessage(
      rawConversation.last_message ?? rawConversation.lastMessage
    ),
    unreadCount: rawConversation.unread_count ?? rawConversation.unreadCount ?? 0,
    updatedAt: rawConversation.updated_at ?? rawConversation.updatedAt,
  };
}

export function normalizeConversations(list) {
  if (!Array.isArray(list)) return [];
  return list.map(normalizeConversation).filter(Boolean);
}

export function normalizeMessages(list) {
  if (!Array.isArray(list)) return [];
  return list.map(normalizeMessage).filter(Boolean);
}
