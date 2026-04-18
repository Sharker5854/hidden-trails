import { useCallback, useState } from 'react';
import {
  createGeotagRequest,
  getFeedRequest,
  getGeotagByIdRequest,
  likeGeotagRequest,
  unlikeGeotagRequest,
  updateGeotagRequest,
} from '../api/geotagsApi';
import { normalizeGeotag, normalizeGeotags } from '../utils/geotags';
import { getErrorMessage } from '../utils/errors';

const FEED_LAST_VISIT_KEY = 'hidden-trails:last-feed-visit';

export function useGeotags() {
  const [selectedGeotag, setSelectedGeotag] = useState(null);
  const [geotags, setGeotags] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const loadGeotagById = useCallback(async (geotagId) => {
    setIsLoading(true);

    try {
      const data = await getGeotagByIdRequest(geotagId);
      const normalized = normalizeGeotag(data);

      setSelectedGeotag(normalized);
      setError('');

      return normalized;
    } catch (err) {
      const message = getErrorMessage(err);
      setError(message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const loadFeed = useCallback(async () => {
    setIsLoading(true);

    try {
      const lastFeedVisit = localStorage.getItem(FEED_LAST_VISIT_KEY);
      const data = await getFeedRequest(50, lastFeedVisit);
      const normalized = normalizeGeotags(data?.geotags || []);

      setGeotags(normalized);
      localStorage.setItem(FEED_LAST_VISIT_KEY, new Date().toISOString());
      setError('');

      return normalized;
    } catch (err) {
      const message = getErrorMessage(err);
      setError(message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const createGeotag = useCallback(async (geotagData) => {
    setIsLoading(true);

    try {
      const data = await createGeotagRequest(geotagData);
      const normalized = normalizeGeotag(data);

      setSelectedGeotag(normalized);
      setError('');

      return normalized;
    } catch (err) {
      const message = getErrorMessage(err);
      setError(message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const updateGeotag = useCallback(async (geotagId, geotagData) => {
    setIsLoading(true);

    try {
      const data = await updateGeotagRequest(geotagId, geotagData);
      const normalized = normalizeGeotag(data);

      setSelectedGeotag(normalized);
      setError('');

      return normalized;
    } catch (err) {
      const message = getErrorMessage(err);
      setError(message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const likeGeotag = useCallback(async (geotagId) => {
    const data = await likeGeotagRequest(geotagId);

    setGeotags((prev) =>
      prev.map((geotag) =>
        geotag.id === geotagId
          ? {
              ...geotag,
              likes: data.total_likes ?? geotag.likes + 1,
              likedByCurrentUser: true,
            }
          : geotag
      )
    );

    return data;
  }, []);

  const unlikeGeotag = useCallback(async (geotagId) => {
    const data = await unlikeGeotagRequest(geotagId);

    setGeotags((prev) =>
      prev.map((geotag) =>
        geotag.id === geotagId
          ? {
              ...geotag,
              likes: data.total_likes ?? Math.max(0, geotag.likes - 1),
              likedByCurrentUser: false,
            }
          : geotag
      )
    );

    return data;
  }, []);

  return {
    selectedGeotag,
    geotags,
    isLoading,
    error,
    loadFeed,
    loadGeotagById,
    createGeotag,
    likeGeotag,
    unlikeGeotag,
    updateGeotag,
  };
}
