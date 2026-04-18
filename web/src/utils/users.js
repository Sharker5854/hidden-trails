import { resolveAchievementImageUrl, resolveAvatarUrl } from './assets';
import { normalizeGeotags } from './geotags';

export function normalizeUserMini(user) {
  if (!user) return null;

  return {
    id: user.id,
    nickname: user.nickname || 'unknown',
    avatarUrl: resolveAvatarUrl(user.avatar_url),
    rating: user.rating ?? 0,
  };
}

export function normalizeUserProfile(profile) {
  if (!profile) return null;

  return {
    id: profile.id,
    nickname: profile.nickname || 'unknown',
    avatarUrl: resolveAvatarUrl(profile.avatar_url),
    name: profile.name || '',
    surname: profile.surname || '',
    rating: profile.rating ?? 0,
    registerAt: profile.register_at,
    followersCount: profile.followers_count ?? 0,
    followingCount: profile.following_count ?? 0,
    isFollowedByCurrentUser: Boolean(profile.is_followed_by_current_user),
    isCurrentUser: Boolean(profile.is_current_user),
    followers: Array.isArray(profile.followers)
      ? profile.followers.map(normalizeUserMini).filter(Boolean)
      : [],
    following: Array.isArray(profile.following)
      ? profile.following.map(normalizeUserMini).filter(Boolean)
      : [],
    achievements: Array.isArray(profile.achievements)
      ? profile.achievements.map((achievement) => ({
          id: achievement.id,
          title: achievement.title,
          pictureUrl: resolveAchievementImageUrl(achievement.picture_url),
        }))
      : [],
    geotags: normalizeGeotags(profile.geotags || []),
  };
}
