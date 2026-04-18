import { API_BASE_URL } from '../constants/api';

const DEFAULT_AVATAR = 'default.png';

export function resolveAvatarUrl(avatarUrl) {
  if (!avatarUrl || avatarUrl === DEFAULT_AVATAR) {
    return null;
  }

  if (/^(blob:|data:|https?:\/\/)/.test(avatarUrl)) {
    return avatarUrl;
  }

  const normalizedPath = avatarUrl.startsWith('/static/')
    ? avatarUrl
    : `/static/media/user-avatars/${avatarUrl}`;

  return `${API_BASE_URL}${normalizedPath}`;
}

export function resolveGeotagMediaUrl(mediaUrl) {
  if (!mediaUrl) {
    return null;
  }

  if (/^(blob:|data:|https?:\/\/)/.test(mediaUrl)) {
    return mediaUrl;
  }

  const normalizedPath = mediaUrl.startsWith('/static/')
    ? mediaUrl
    : `/static/media/geotag-media/${mediaUrl}`;

  return `${API_BASE_URL}${normalizedPath}`;
}

export function resolveAchievementImageUrl(imageUrl) {
  if (!imageUrl || imageUrl === DEFAULT_AVATAR) {
    return null;
  }

  if (/^(blob:|data:|https?:\/\/)/.test(imageUrl)) {
    return imageUrl;
  }

  const normalizedPath = imageUrl.startsWith('/static/')
    ? imageUrl
    : `/static/media/achievment-pictures/${imageUrl}`;

  return `${API_BASE_URL}${normalizedPath}`;
}
