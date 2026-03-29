import { API_BASE_URL } from '../constants/api';

export async function apiRequest(path, options = {}) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    credentials: 'include',
    ...options,
  });

  return response;
}

export async function parseJsonResponse(response) {
  const contentType = response.headers.get('content-type') || '';

  if (contentType.includes('application/json')) {
    return response.json();
  }

  return null;
}

export async function handleApiResponse(response) {
  if (!response.ok) {
    let errorMessage = `Request failed: ${response.status}`;

    try {
      const data = await parseJsonResponse(response);

      if (data?.detail) {
        if (typeof data.detail === 'string') {
          errorMessage = data.detail;
        } else if (Array.isArray(data.detail) && data.detail.length > 0) {
          errorMessage = data.detail.map((item) => item.msg).join(', ');
        }
      }
    } catch {
      // ignore parse errors
    }

    throw new Error(errorMessage);
  }

  return parseJsonResponse(response);
}