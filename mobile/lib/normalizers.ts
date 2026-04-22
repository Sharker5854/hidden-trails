import { API_BASE_URL } from '@/constants/api';
import { ChatMessage, Conversation, Place, TrailRoute, UserMini } from '@/lib/mock-data';

function resolveMediaUrl(path?: string | null) {
  if (!path) return 'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=900&q=80';
  if (path.startsWith('http')) return path;
  if (path.startsWith('/')) return `${API_BASE_URL}${path}`;
  return `${API_BASE_URL}/static/media/geotag-media/${path}`;
}

function resolveAvatarUrl(path?: string | null) {
  if (!path) return 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=240&q=80';
  if (path.startsWith('http')) return path;
  if (path.startsWith('/')) return `${API_BASE_URL}${path}`;
  return `${API_BASE_URL}/static/media/user-avatars/${path}`;
}

export function normalizePlace(raw: any): Place {
  const mediaFiles = Array.isArray(raw?.media_files) ? raw.media_files : [];
  const themes = Array.isArray(raw?.themes) ? raw.themes : [];

  return {
    id: Number(raw?.id || 0),
    title: raw?.title || 'Без названия',
    description: raw?.text || raw?.description || '',
    area: themes.map((theme: any) => theme?.name).filter(Boolean).join(', ') || 'Без темы',
    authorId: Number(raw?.author_id || raw?.author?.id || 0),
    author: raw?.author_nickname || raw?.author?.nickname || 'unknown',
    image: resolveMediaUrl(mediaFiles[0]),
    tags: themes.map((theme: any) => theme?.name).filter(Boolean).slice(0, 3),
    latitude: Number(raw?.latitude || 0),
    longitude: Number(raw?.longitude || 0),
    warnings: raw?.warnings || '',
    tips: raw?.tips || '',
    likes: Number(raw?.likes_count || 0),
  };
}

export function normalizePlaces(rawList: any): Place[] {
  const list = Array.isArray(rawList) ? rawList : [];
  return list.map(normalizePlace).filter((place) => place.id > 0);
}

export function normalizeRoute(raw: any): TrailRoute {
  return {
    id: Number(raw?.id || Date.now()),
    title: raw?.title || 'Маршрут',
    description: raw?.description || '',
    distanceKm: Number(raw?.distance_km || raw?.distanceKm || 0),
    durationMin: Number(raw?.duration_min || raw?.durationMin || 0),
    mode: raw?.mode || 'walk',
    isPublic: Boolean(raw?.is_public ?? raw?.isPublic),
    placeIds: Array.isArray(raw?.geotag_ids)
      ? raw.geotag_ids.map(Number)
      : Array.isArray(raw?.placeIds)
        ? raw.placeIds.map(Number)
        : [],
    points: Array.isArray(raw?.coordinates)
      ? raw.coordinates.map(([longitude, latitude]: [number, number]) => ({
          latitude: Number(latitude),
          longitude: Number(longitude),
        }))
      : Array.isArray(raw?.points)
        ? raw.points
        : [],
  };
}

export function normalizeRoutes(rawList: any): TrailRoute[] {
  const list = Array.isArray(rawList) ? rawList : [];
  return list.map(normalizeRoute).filter((route) => route.id > 0);
}

export function normalizeConversation(raw: any): Conversation {
  const partner = raw?.partner || {};

  return {
    id: Number(raw?.id || 0),
    partnerId: Number(partner.id || 0),
    nickname: partner.nickname || 'unknown',
    avatar: resolveAvatarUrl(partner.avatar_url),
    lastMessage: raw?.last_message?.text || 'Пока без сообщений',
    unread: Number(raw?.unread_count || 0),
  };
}

export function normalizeConversations(rawList: any): Conversation[] {
  const list = Array.isArray(rawList) ? rawList : [];
  return list.map(normalizeConversation).filter((conversation) => conversation.id > 0);
}

export function normalizeMessage(raw: any): ChatMessage {
  return {
    id: Number(raw?.id || 0),
    conversationId: Number(raw?.conversation_id || raw?.conversationId || 0),
    text: raw?.text || '',
    isMine: Boolean(raw?.is_mine ?? raw?.isMine),
    createdAt: raw?.created_at || raw?.createdAt || null,
  };
}

export function normalizeMessages(rawList: any): ChatMessage[] {
  const list = Array.isArray(rawList) ? rawList : [];
  return list.map(normalizeMessage).filter((message) => message.id > 0);
}

export function normalizeUserMini(raw: any): UserMini {
  return {
    id: Number(raw?.id || 0),
    nickname: raw?.nickname || 'unknown',
    avatar: resolveAvatarUrl(raw?.avatar_url),
    rating: Number(raw?.rating || 0),
  };
}

export function normalizeUsers(rawList: any): UserMini[] {
  const list = Array.isArray(rawList) ? rawList : [];
  return list.map(normalizeUserMini).filter((user) => user.id > 0);
}

export function normalizeUser(raw: any) {
  if (!raw) return null;

  return {
    nickname: raw.nickname || 'traveler',
    email: raw.email || '',
    rating: Number(raw.rating || 0),
    isPremium: Boolean(raw.is_premium),
    avatar: resolveAvatarUrl(raw.avatar_url),
  };
}

export function normalizePublicProfile(raw: any) {
  if (!raw) return null;

  return {
    id: Number(raw.id || 0),
    nickname: raw.nickname || 'unknown',
    avatar: resolveAvatarUrl(raw.avatar_url),
    rating: Number(raw.rating || 0),
    name: raw.name || '',
    surname: raw.surname || '',
    followersCount: Number(raw.followers_count || 0),
    followingCount: Number(raw.following_count || 0),
    isFollowedByCurrentUser: Boolean(raw.is_followed_by_current_user),
    isCurrentUser: Boolean(raw.is_current_user),
    geotags: normalizePlaces(raw.geotags || []),
  };
}
