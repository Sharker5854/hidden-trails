import { apiRequest, handleApiResponse } from './client';

export async function getNotificationsRequest() {
  const response = await apiRequest('/notifications', {
    method: 'GET',
  });

  return handleApiResponse(response);
}

export async function readAllNotificationsRequest() {
  const response = await apiRequest('/notifications/read-all', {
    method: 'POST',
  });

  return handleApiResponse(response);
}
