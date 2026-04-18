import { apiRequest, handleApiResponse } from './client';

export async function getConversationsRequest() {
  const response = await apiRequest('/messages/conversations', {
    method: 'GET',
  });

  return handleApiResponse(response);
}

export async function getConversationMessagesRequest(conversationId) {
  const response = await apiRequest(`/messages/conversation/${conversationId}`, {
    method: 'GET',
  });

  return handleApiResponse(response);
}

export async function sendMessageRequest({ recipientId, text }) {
  const formData = new FormData();
  formData.append('recipient_id', recipientId);
  formData.append('text', text);

  const response = await apiRequest('/messages/send', {
    method: 'POST',
    body: formData,
  });

  return handleApiResponse(response);
}
