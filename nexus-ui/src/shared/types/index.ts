export interface User {
  id: string;
  username: string;
  email: string;
}

export interface AuthResponse {
  id: string;
  username: string;
  email: string;
}

export interface Channel {
  channelId: string;
  channelName: string;
  createdAt?: string;
  description?: string;
  unreadCount?: number;
}

export interface ChannelMembersResponse {
  memberIds: string[];
}

export interface ChannelMember {
  id: string;
  username: string;
  email: string;
  role?: 'admin' | 'member';
  status?: 'online' | 'offline' | 'away';
}

/** Fields used to compute stable merge/dedupe keys for chat rows (second-precision `sentAt`). */
export interface ChatMessageFingerprintFields {
  channelId: string;
  senderId: string;
  content: string;
  sentAt: string;
}

export interface Message extends ChatMessageFingerprintFields {
  senderUsername: string;
  // local-only fields for UI
  _id?: string;
  _optimistic?: boolean;
}

export interface SocketMessage {
  content: string;
  senderId: string;
  senderUsername: string;
  sentAt: string;
  channelId?: string;
}

export interface SendMessagePayload {
  channelId: string;
  senderUsername: string;
  content: string;
  sentAt: string;
}

export interface UserSearchResult {
  id: string;
  username: string;
  email: string;
}

export interface UserListResponse {
  data: UserSearchResult[];
  nextCursor: string | null;
}

export interface ConnectionStatus {
  type: 'connecting' | 'connected' | 'disconnected' | 'error';
  message?: string;
  latency?: number;
}

export interface PresenceStatusResponse {
  onlineUserIds: string[];
  offlineUserIds: string[];
  statusUnknownUserIds: string[];
}
