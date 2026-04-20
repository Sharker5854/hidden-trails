import { apiRequest, handleApiResponse } from './client';

function buildUrlEncodedBody(data) {
  const params = new URLSearchParams();

  Object.entries(data).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      params.append(key, value);
    }
  });

  return params;
}

export async function loginRequest({ email, password }) {
  const response = await apiRequest('/auth/login', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: buildUrlEncodedBody({
      email,
      password,
    }),
  });

  return handleApiResponse(response);
}

export async function registerRequest({
  email,
  nickname,
  password,
  password_repeat,
}) {
  const response = await apiRequest('/auth/register', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: buildUrlEncodedBody({
      email,
      nickname,
      password,
      password_repeat,
    }),
  });

  return handleApiResponse(response);
}

export async function meRequest() {
  const response = await apiRequest('/auth/me', {
    method: 'GET',
  });

  return handleApiResponse(response);
}

export async function sessionRequest() {
  const response = await apiRequest('/auth/session', {
    method: 'GET',
  });

  return handleApiResponse(response);
}

export async function refreshRequest() {
  const response = await apiRequest('/auth/refresh', {
    method: 'POST',
  });

  return handleApiResponse(response);
}

export async function logoutRequest() {
  const response = await apiRequest('/auth/logout', {
    method: 'GET',
  });

  return handleApiResponse(response);
}
