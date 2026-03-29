import { apiRequest, handleApiResponse } from './client';
import { buildFormData } from '../utils/formData';

export async function getProfileRequest() {
  const response = await apiRequest('/auth/me', {
    method: 'GET',
  });

  return handleApiResponse(response);
}

export async function updateProfileRequest(profileData) {
  const formData = buildFormData(profileData);

  const response = await apiRequest('/auth/me', {
    method: 'POST',
    body: formData,
  });

  return handleApiResponse(response);
}