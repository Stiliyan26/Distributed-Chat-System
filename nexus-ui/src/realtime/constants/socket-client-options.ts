import type { ManagerOptions } from "socket.io-client";

export const SOCKET_CLIENT_OPTIONS: Partial<ManagerOptions> = {
  path: "/api/socket.io",
  withCredentials: true,
  transports: ["websocket"],
  reconnection: false,
  reconnectionAttempts: 0,
  reconnectionDelay: 1500,
};
