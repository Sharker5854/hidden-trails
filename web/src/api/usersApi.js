import { apiRequest, handleApiResponse } from './client';

export async function searchUsersRequest(nickname) {
  const params = new URLSearchParams({ nickname });
  const response = await apiRequest(`/user/search?${params.toString()}`, {
    method: 'GET',
  });

  return handleApiResponse(response);
}

export async function getUserProfileRequest(userId) {
  const response = await apiRequest(`/user/${userId}`, {
    method: 'GET',
  });

  return handleApiResponse(response);
}

export async function followUserRequest(userId) {
  const response = await apiRequest(`/user/follow/${userId}`, {
    method: 'POST',
  });

  return handleApiResponse(response);
}

export async function unfollowUserRequest(userId) {
  const response = await apiRequest(`/user/unfollow/${userId}`, {
    method: 'POST',
  });

  return handleApiResponse(response);
}
