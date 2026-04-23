import { API_BASE_URL } from '@/constants/api';

export class ApiError extends Error {
  status: number;
  data: unknown;

  constructor(message: string, status: number, data: unknown = null) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.data = data;
  }
}

type RequestOptions = RequestInit & {
  token?: string | null;
};

async function parseJson(response: Response) {
  const contentType = response.headers.get('content-type') || '';

  if (!contentType.includes('application/json')) {
    return null;
  }

  return response.json();
}

export async function apiRequest(path: string, options: RequestOptions = {}) {
  const { token, headers, ...requestOptions } = options;
  const requestHeaders = new Headers(headers);

  if (token) {
    requestHeaders.set('Authorization', `Bearer ${token}`);
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    credentials: 'include',
    ...requestOptions,
    headers: requestHeaders,
  });
  const data = await parseJson(response);

  if (!response.ok) {
    let message = `Request failed: ${response.status}`;
    const detail = data && typeof data === 'object' && 'detail' in data ? data.detail : null;

    if (typeof detail === 'string') {
      message = detail;
    } else if (Array.isArray(detail)) {
      message = detail.map((item) => item?.msg || 'Validation error').join(', ');
    }

    throw new ApiError(message, response.status, data);
  }

  return data;
}

function buildUrlEncodedBody(data: Record<string, string>) {
  const params = new URLSearchParams();

  Object.entries(data).forEach(([key, value]) => {
    params.append(key, value);
  });

  return params.toString();
}

export async function loginRequest(email: string, password: string) {
  return apiRequest('/auth/login', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: buildUrlEncodedBody({ email, password }),
  });
}

export async function registerRequest(email: string, nickname: string, password: string) {
  return apiRequest('/auth/register', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: buildUrlEncodedBody({
      email,
      nickname,
      password,
      password_repeat: password,
    }),
  });
}

export async function getProfileRequest(token: string) {
  return apiRequest('/auth/me', {
    method: 'GET',
    token,
  });
}

export async function togglePremiumRequest(token: string) {
  return apiRequest('/auth/premium/toggle', {
    method: 'POST',
    token,
  });
}

export async function getFeedRequest(token: string) {
  return apiRequest('/geotag/feed?limit=50', {
    method: 'GET',
    token,
  });
}

export async function getMyRoutesRequest(token: string) {
  return apiRequest('/route/my', {
    method: 'GET',
    token,
  });
}

export async function getPublicRoutesRequest(token: string) {
  return apiRequest('/route/feed', {
    method: 'GET',
    token,
  });
}

export async function saveRouteRequest(
  token: string,
  route: {
    title: string;
    description: string;
    geotagIds: number[];
    points: { latitude: number; longitude: number }[];
    mode: string;
    isPublic: boolean;
  }
) {
  return apiRequest('/route/save', {
    method: 'POST',
    token,
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      title: route.title,
      description: route.description,
      geotag_ids: route.geotagIds,
      points: route.points,
      mode: route.mode,
      is_public: route.isPublic,
    }),
  });
}

export async function publishRouteRequest(token: string, routeId: number) {
  return apiRequest(`/route/${routeId}/publish`, {
    method: 'POST',
    token,
  });
}

export async function getConversationsRequest(token: string) {
  return apiRequest('/messages/conversations', {
    method: 'GET',
    token,
  });
}

export async function getConversationMessagesRequest(token: string, conversationId: number) {
  return apiRequest(`/messages/conversation/${conversationId}`, {
    method: 'GET',
    token,
  });
}

export async function sendMessageRequest(token: string, recipientId: number, text: string) {
  const formData = new FormData();
  formData.append('recipient_id', String(recipientId));
  formData.append('text', text);

  return apiRequest('/messages/send', {
    method: 'POST',
    token,
    body: formData,
  });
}

export async function getUsersPageRequest(token: string, page = 1, pageSize = 20) {
  return apiRequest(`/user/list?page=${page}&page_size=${pageSize}`, {
    method: 'GET',
    token,
  });
}

export async function getTopUsersRequest(token: string, limit = 7) {
  return apiRequest(`/user/top?limit=${limit}`, {
    method: 'GET',
    token,
  });
}

export async function getUserProfileRequest(token: string, userId: number) {
  return apiRequest(`/user/${userId}`, {
    method: 'GET',
    token,
  });
}

export async function searchUsersRequest(token: string, nickname: string) {
  const params = new URLSearchParams({ nickname });

  return apiRequest(`/user/search?${params.toString()}`, {
    method: 'GET',
    token,
  });
}
