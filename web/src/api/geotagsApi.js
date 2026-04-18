import { apiRequest, handleApiResponse } from './client';
import { buildFormData } from '../utils/formData';

export async function getGeotagByIdRequest(geotagId) {
  const response = await apiRequest(`/geotag/show/${geotagId}`, {
    method: 'GET',
  });

  return handleApiResponse(response);
}

export async function createGeotagRequest(geotagData) {
  const formData = buildFormData(geotagData);

  const response = await apiRequest('/geotag/create', {
    method: 'POST',
    body: formData,
  });

  return handleApiResponse(response);
}

export async function updateGeotagRequest(geotagId, geotagData) {
  const formData = buildFormData(geotagData);

  const response = await apiRequest(`/geotag/update/${geotagId}`, {
    method: 'POST',
    body: formData,
  });

  return handleApiResponse(response);
}

export async function getFeedRequest(limit = 50) {
  const response = await apiRequest(`/geotag/feed?limit=${limit}`, {
    method: 'GET',
  });

  return handleApiResponse(response);
}

export async function likeGeotagRequest(geotagId) {
  const response = await apiRequest(`/geotag/like/${geotagId}`, {
    method: 'POST',
  });

  return handleApiResponse(response);
}

export async function unlikeGeotagRequest(geotagId) {
  const response = await apiRequest(`/geotag/unlike/${geotagId}`, {
    method: 'POST',
  });

  return handleApiResponse(response);
}
