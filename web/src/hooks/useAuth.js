import { useCallback, useEffect, useState } from 'react';
import {
  loginRequest,
  logoutRequest,
  meRequest,
  refreshRequest,
  registerRequest,
  sessionRequest,
} from '../api/authApi';
import { getErrorMessage } from '../utils/errors';

import { DEV_AUTH_ENABLED, DEV_USER } from '../constants/api';

function isUnauthorized(error) {
  return error?.status === 401;
}

function isBackendUnavailable(error) {
  return !error?.status;
}

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
      const session = await sessionRequest();

      if (session.user) {
        setUser(session.user);
        setIsAuthorized(true);
        setAuthError('');
        return;
      }

      if (!session.can_refresh) {
        setUser(null);
        setIsAuthorized(false);
        setAuthError('');
        return;
      }

      await refreshRequest();
      await loadMe();
    } catch (refreshError) {
      setUser(null);
      setIsAuthorized(false);

      if (isUnauthorized(refreshError)) {
        setAuthError('');
      } else if (DEV_AUTH_ENABLED && isBackendUnavailable(refreshError)) {
        console.warn('Backend unavailable. Using DEV auth.');

        setUser(DEV_USER);
        setIsAuthorized(true);
        setAuthError('');
      } else {
        setAuthError(getErrorMessage(refreshError));
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
