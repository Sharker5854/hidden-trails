import { normalizeGeotags } from './geotags';

export function normalizeRoute(rawRoute) {
  if (!rawRoute) return null;

  const geotags = normalizeGeotags(rawRoute.geotags || []);

  return {
    id: rawRoute.id ?? null,
    title: rawRoute.title ?? '',
    description: rawRoute.description ?? '',
    warnings: rawRoute.warnings ?? '',
    tips: rawRoute.tips ?? '',
    authorId: rawRoute.author_id ?? null,
    author: rawRoute.author_nickname ?? 'unknown',
    createdAt: rawRoute.created_at ?? null,
    geotagIds: rawRoute.geotag_ids ?? geotags.map((geotag) => geotag.id),
    geotags,
    coordinates: Array.isArray(rawRoute.coordinates) ? rawRoute.coordinates : [],
    distanceKm: rawRoute.distance_km ?? 0,
    durationMin: rawRoute.duration_min ?? 0,
    mode: rawRoute.mode ?? 'drive',
    isPublic: rawRoute.is_public ?? false,
  };
}

export function normalizeRoutes(list) {
  if (!Array.isArray(list)) return [];
  return list.map(normalizeRoute).filter(Boolean);
}
