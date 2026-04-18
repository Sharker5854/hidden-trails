import { resolveAvatarUrl, resolveGeotagMediaUrl } from './assets';

export function normalizeGeotag(rawGeotag) {
  if (!rawGeotag) return null;

  const mediaArray = Array.isArray(rawGeotag.media_files)
    ? rawGeotag.media_files
    : Array.isArray(rawGeotag.media)
    ? rawGeotag.media
    : [];

  const firstMedia =
    mediaArray.find((item) => typeof item === 'string') ||
    mediaArray.find((item) => item?.url)?.url ||
    rawGeotag.image ||
    null;

  const themes = Array.isArray(rawGeotag.themes)
    ? rawGeotag.themes
    : Array.isArray(rawGeotag.theme_ids)
    ? rawGeotag.theme_ids.map((id) => ({ id, name: `Тема ${id}` }))
    : [];

  return {
    id: rawGeotag.id ?? null,
    title: rawGeotag.title ?? '',
    description: rawGeotag.text ?? '',
    fullDescription: rawGeotag.text ?? '',
    latitude: rawGeotag.latitude ?? 0,
    longitude: rawGeotag.longitude ?? 0,
    warnings: rawGeotag.warnings ?? '',
    tips: rawGeotag.tips ?? '',
    themeIds: rawGeotag.theme_ids ?? themes.map((theme) => theme.id),
    themes,
    mediaFiles: mediaArray.map(resolveGeotagMediaUrl).filter(Boolean),
    image: resolveGeotagMediaUrl(firstMedia),
    author:
      rawGeotag.author?.nickname ??
      rawGeotag.author_nickname ??
      rawGeotag.nickname ??
      'unknown',
    authorAvatar: resolveAvatarUrl(
      rawGeotag.author?.avatar_url ?? rawGeotag.author_avatar_url ?? null
    ),
    likes: rawGeotag.likes_count ?? rawGeotag.likes ?? 0,
    likedByCurrentUser:
      rawGeotag.liked_by_current_user ?? rawGeotag.likedByCurrentUser ?? false,
    views: rawGeotag.views_count ?? rawGeotag.views ?? 0,
    comments: rawGeotag.comments ?? [],
  };
}

export function normalizeGeotags(list) {
  if (!Array.isArray(list)) return [];
  return list.map(normalizeGeotag).filter(Boolean);
}
