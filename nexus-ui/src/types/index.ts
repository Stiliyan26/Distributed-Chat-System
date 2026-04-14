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

// Backend returns { channelId, channelName }
export interface Channel {
  channelId: string;
  channelName: string;
  createdAt?: string;
  description?: string;
  unreadCount?: number;
}

// Backend returns { memberIds: string[] } from GET /channels/:id/members
export interface ChannelMembersResponse {
  memberIds: string[];
}

// Enriched member (after fetching user details for each id)
export interface ChannelMember {
  id: string;
  username: string;
  email: string;
  role?: 'admin' | 'member';
  status?: 'online' | 'offline' | 'away';
}

// Backend message shape from GET /messages and socket new_message
export interface Message {
  channelId: string;
  senderId: string;
  senderUsername: string;
  content: string;
  sentAt: string;
  // local-only fields for UI
  _id?: string;
  _optimistic?: boolean;
}

// Socket new_message payload (may or may not include channelId)
export interface SocketMessage {
  content: string;
  senderId: string;
  senderUsername: string;
  sentAt: string;
  channelId?: string;
}

// User search: backend returns { data: [...], nextCursor }
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
