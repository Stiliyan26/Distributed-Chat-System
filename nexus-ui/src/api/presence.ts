import api from './axios';
import type { PresenceStatusResponse } from '@/types';

export const getUsersPresenceStatus = (userIds: string[]) =>
  api.post<PresenceStatusResponse>('/presence/status', { userIds }).then((r) => r.data);
