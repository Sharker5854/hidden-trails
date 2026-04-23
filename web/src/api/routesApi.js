import { apiRequest, handleApiResponse } from './client';

export async function calculateRouteRequest({ geotagIds, mode }) {
  const response = await apiRequest('/route/calculate', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      geotag_ids: geotagIds,
      mode,
    }),
  });

  return handleApiResponse(response);
}

export async function calculateRouteByPointsRequest({ points, mode }) {
  const response = await apiRequest('/route/calculate-points', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      points,
      mode,
    }),
  });

  return handleApiResponse(response);
}

export async function saveRouteRequest(routeData) {
  const response = await apiRequest('/route/save', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      title: routeData.title,
      description: routeData.description,
      warnings: routeData.warnings,
      tips: routeData.tips,
      geotag_ids: routeData.geotagIds,
      points: routeData.points || [],
      mode: routeData.mode,
      is_public: routeData.isPublic,
    }),
  });

  return handleApiResponse(response);
}

export async function getMyRoutesRequest() {
  const response = await apiRequest('/route/my', {
    method: 'GET',
  });

  return handleApiResponse(response);
}

export async function getPublicRoutesRequest() {
  const response = await apiRequest('/route/feed', {
    method: 'GET',
  });

  return handleApiResponse(response);
}

export async function publishRouteRequest(routeId) {
  const response = await apiRequest(`/route/${routeId}/publish`, {
    method: 'POST',
  });

  return handleApiResponse(response);
}

export async function shareRouteRequest({ routeId, recipientId }) {
  const response = await apiRequest(`/route/${routeId}/share`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      recipient_id: recipientId,
    }),
  });

  return handleApiResponse(response);
}
