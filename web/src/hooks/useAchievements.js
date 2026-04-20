import { useCallback, useState } from 'react';
import { getAchievementsRequest } from '../api/achievementsApi';
import { getErrorMessage } from '../utils/errors';

export function useAchievements() {
  const [achievements, setAchievements] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const loadAchievements = useCallback(async () => {
    setIsLoading(true);

    try {
      const data = await getAchievementsRequest();
      const normalizedAchievements = Array.isArray(data) ? data : [];
      setAchievements(normalizedAchievements);
      setError('');
      return normalizedAchievements;
    } catch (err) {
      const message = getErrorMessage(err);
      setAchievements([]);
      setError(message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    achievements,
    isLoading,
    error,
    loadAchievements,
  };
}