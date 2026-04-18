import { apiRequest, handleApiResponse } from './client';
import { buildFormData } from '../utils/formData';

export async function getCommentsRequest(geotagId) {
  const response = await apiRequest(`/comment/comments/${geotagId}`, {
    method: 'GET',
  });

  return handleApiResponse(response);
}

export async function createCommentRequest({ geotag_id, text, parent_id }) {
  const formData = buildFormData({
    geotag_id,
    text,
    parent_id,
  });

  const response = await apiRequest('/comment/create', {
    method: 'POST',
    body: formData,
  });

  return handleApiResponse(response);
}
