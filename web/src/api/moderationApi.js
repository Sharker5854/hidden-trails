import { apiRequest, handleApiResponse } from './client';

export async function getModerationQueueRequest() {
  const response = await apiRequest('/moderation/queue', {
    method: 'GET',
  });

  return handleApiResponse(response);
}

export async function getModerationGeotagRequest(geotagId) {
  const response = await apiRequest(`/moderation/geotag/${geotagId}`, {
    method: 'GET',
  });

  return handleApiResponse(response);
}

export async function moderateGeotagRequest(geotagId, payload) {
  const response = await apiRequest(`/moderation/geotag/${geotagId}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  return handleApiResponse(response);
}

export async function getModerationDashboardRequest() {
  const response = await apiRequest('/moderation/admin/dashboard', {
    method: 'GET',
  });

  return handleApiResponse(response);
}

export async function updateModeratorRoleRequest(userId, isModer) {
  const response = await apiRequest(`/moderation/admin/roles/${userId}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ is_moder: isModer }),
  });

  return handleApiResponse(response);
}
