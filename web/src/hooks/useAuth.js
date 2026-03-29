import { useCallback, useEffect, useState } from 'react';
import {
  loginRequest,
  logoutRequest,
  meRequest,
  refreshRequest,
  registerRequest,
} from '../api/authApi';
import { getErrorMessage } from '../utils/errors';

import { DEV_AUTH_ENABLED, DEV_USER } from '../constants/api';

export function useAuth() {
  const [user, setUser] = useState(null);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [authError, setAuthError] = useState('');

  const loadMe = useCallback(async () => {
    try {
      const userData = await meRequest();
      setUser(userData);
      setIsAuthorized(true);
      setAuthError('');
      return userData;
    } catch (error) {
      setUser(null);
      setIsAuthorized(false);
      setAuthError(getErrorMessage(error));
      throw error;
    }
  }, []);

const initializeAuth = useCallback(async () => {
  setIsLoading(true);

  try {
    await loadMe();
  } catch (error) {

    if (DEV_AUTH_ENABLED) {
      console.warn('Backend unavailable. Using DEV auth.');

      setUser(DEV_USER);
      setIsAuthorized(true);
      setIsLoading(false);

      return;
    }

    try {
      await refreshRequest();
      await loadMe();
    } catch {
      setUser(null);
      setIsAuthorized(false);
    }
  } finally {
    setIsLoading(false);
  }
}, [loadMe]);

  useEffect(() => {
    initializeAuth();
  }, [initializeAuth]);

const login = async ({ email, password }) => {
  setIsLoading(true);

  try {

    if (DEV_AUTH_ENABLED && email === 'eve' && password === 'eve') {
      console.warn('DEV LOGIN');

      setUser(DEV_USER);
      setIsAuthorized(true);
      setAuthError('');

      return DEV_USER;
    }

    await loginRequest({ email, password });
    const userData = await loadMe();

    return userData;

  } catch (error) {
    setAuthError(getErrorMessage(error));
    throw error;

  } finally {
    setIsLoading(false);
  }
};

  const register = async ({ email, nickname, password, password_repeat }) => {
    setIsLoading(true);

    try {
      await registerRequest({
        email,
        nickname,
        password,
        password_repeat,
      });

      const userData = await loadMe();
      return userData;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {

  if (DEV_AUTH_ENABLED) {
    setUser(null);
    setIsAuthorized(false);
    return;
  }

  setIsLoading(true);

  try {
    await logoutRequest();
  } finally {
    setUser(null);
    setIsAuthorized(false);
    setIsLoading(false);
  }
};

  return {
    user,
    isAuthorized,
    isLoading,
    authError,
    login,
    register,
    logout,
    initializeAuth,
  };
}