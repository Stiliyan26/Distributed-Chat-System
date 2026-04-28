import type { Channel, ChannelMembersResponse } from "../models/http-types";

import api from "../client/axios";

export const getUserChannels = () =>
  api.get<Channel[]>("/channels/user").then((r) => r.data);

export const getChannelMembers = (channelId: string) =>
  api.get<ChannelMembersResponse>(`/channels/${channelId}/members`).then((r) => r.data);

export const createChannel = (channelName: string, memberIds: string[]) =>
  api.post<Channel>("/channels/create", { channelName, memberIds }).then((r) => r.data);

export const addChannelMember = (channelId: string, memberId: string) =>
  api.post(`/channels/${channelId}/members`, { memberId });
