import { useCallback, useState } from 'react';
import {
  getProfileRequest,
  togglePremiumRequest,
  updateProfileRequest,
} from '../api/profileApi';
import { getErrorMessage } from '../utils/errors';
import { DEV_AUTH_ENABLED, DEV_USER } from '../constants/api';

export function useProfile() {
  const [profile, setProfile] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const loadProfile = useCallback(async () => {
    setIsLoading(true);

    try {
      const data = await getProfileRequest();
      setProfile(data);
      setError('');
      return data;
    } catch (err) {
      if (DEV_AUTH_ENABLED) {
        const devProfile = {
          email: DEV_USER.email,
          nickname: DEV_USER.nickname,
          phone: '',
          name: 'Eve',
          surname: '',
          is_moder: false,
          is_admin: false,
          is_premium: false,
          rating: 0,
          avatar_url: null,
        };

        setProfile(devProfile);
        setError('');
        return devProfile;
      }

      const message = getErrorMessage(err);
      setError(message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const updateProfile = useCallback(
    async (profileData) => {
      setIsLoading(true);

      try {
        if (DEV_AUTH_ENABLED) {
          const updatedProfile = {
            ...profile,
            ...profileData,
          };

          if (profileData.avatar_url instanceof File) {
            updatedProfile.avatar_url = URL.createObjectURL(profileData.avatar_url);
          }

          setProfile(updatedProfile);
          setError('');
          return updatedProfile;
        }

        const data = await updateProfileRequest(profileData);
        setProfile(data);
        setError('');
        return data;
      } catch (err) {
        const message = getErrorMessage(err);
        setError(message);
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    [profile]
  );

  const togglePremium = useCallback(async () => {
    setIsLoading(true);

    try {
      if (DEV_AUTH_ENABLED) {
        const updatedProfile = {
          ...profile,
          is_premium: !profile?.is_premium,
        };
        setProfile(updatedProfile);
        setError('');
        return updatedProfile;
      }

      const data = await togglePremiumRequest();
      setProfile(data);
      setError('');
      return data;
    } catch (err) {
      const message = getErrorMessage(err);
      setError(message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [profile]);

  return {
    profile,
    isLoading,
    error,
    loadProfile,
    updateProfile,
    togglePremium,
  };
}
