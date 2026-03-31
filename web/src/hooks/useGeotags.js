import { useCallback, useState } from 'react';
import {
  createGeotagRequest,
  getGeotagByIdRequest,
  updateGeotagRequest,
} from '../api/geotagsApi';
import { normalizeGeotag } from '../utils/geotags';
import { getErrorMessage } from '../utils/errors';

export function useGeotags() {
  const [selectedGeotag, setSelectedGeotag] = useState(null);
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

  return {
    selectedGeotag,
    isLoading,
    error,
    loadGeotagById,
    createGeotag,
    updateGeotag,
  };
}