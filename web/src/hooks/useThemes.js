import { useCallback, useState } from 'react';
import { getThemesRequest } from '../api/themesApi';
import { getErrorMessage } from '../utils/errors';

export function useThemes() {
  const [themes, setThemes] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const loadThemes = useCallback(async () => {
    setIsLoading(true);

    try {
      const data = await getThemesRequest();
      const normalizedThemes = Array.isArray(data) ? data : [];
      setThemes(normalizedThemes);
      setError('');
      return normalizedThemes;
    } catch (err) {
      const message = getErrorMessage(err);
      setThemes([]);
      setError(message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    themes,
    isLoading,
    error,
    loadThemes,
  };
}