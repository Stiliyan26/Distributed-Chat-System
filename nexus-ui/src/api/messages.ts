import api from './axios';
import type { Message } from '@/types';

// Response: array of { channelId, senderId, senderUsername, content, sentAt }
export const getMessages = (channelId: string) =>
  api.get<Message[]>('/messages', { params: { channelId } }).then((r) => r.data);

// Body: { channelId, senderUsername, content, sentAt }
// senderId comes from x-user-id header (injected by gateway from JWT cookie)
export const sendMessageRest = (channelId: string, senderUsername: string, content: string) =>
  api
    .post<{ success: string }>('/messages', {
      channelId,
      senderUsername,
      content,
      sentAt: new Date().toISOString(),
    })
    .then((r) => r.data);
