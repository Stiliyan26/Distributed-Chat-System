import api from './axios';
import type { Channel, ChannelMembersResponse } from '@/types';

// Response: array of { channelId, channelName }
export const getUserChannels = () =>
  api.get<Channel[]>('/channels/user').then((r) => r.data);

// Response: { memberIds: string[] }
export const getChannelMembers = (channelId: string) =>
  api
    .get<ChannelMembersResponse>(`/channels/${channelId}/members`)
    .then((r) => r.data);

// Body: { channelName, memberIds }
export const createChannel = (channelName: string, memberIds: string[]) =>
  api.post<Channel>('/channels/create', { channelName, memberIds }).then((r) => r.data);

export const addChannelMember = (channelId: string, memberId: string) =>
  api.post(`/channels/${channelId}/members`, { memberId });
