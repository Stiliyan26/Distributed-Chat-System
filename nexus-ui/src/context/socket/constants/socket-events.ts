export const SOCKET_EMIT_EVENTS = {
  JOIN_ALL_USER_CHANNELS: "join_all_user_channels",
  SEND_MESSAGE: "send_message",
} as const;

export type SocketEmitEventName =
  (typeof SOCKET_EMIT_EVENTS)[keyof typeof SOCKET_EMIT_EVENTS];
