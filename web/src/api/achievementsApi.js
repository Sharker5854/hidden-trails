import { apiRequest, handleApiResponse } from './client';

export async function getAchievementsRequest() {
  const response = await apiRequest('/achievment/all', {
    method: 'GET',
  });

  return handleApiResponse(response);
}