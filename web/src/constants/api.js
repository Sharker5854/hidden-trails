export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL?.trim() || 'http://localhost:8000';

export const DEV_AUTH_ENABLED = false;

export const DEV_USER = {
  id: 1,
  email: 'eve@example.com',
  nickname: 'eve',
  rating: 0,
  avatar_url: null,
};
