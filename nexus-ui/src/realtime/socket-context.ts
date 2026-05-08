import { createContext } from "react";

import type { Socket } from "socket.io-client";

import type { ConnectionStatus, SocketMessage } from "@/shared/types";

export interface SocketContextType {
  socket: Socket | null;
  connectionStatus: ConnectionStatus;
  joinChannels: (channelIds: string[]) => void;
  joinAllChannels: () => Promise<void>;
  sendMessage: (channelId: string, senderUsername: string, content: string) => void;
  onNewMessage: (handler: (msg: SocketMessage) => void) => () => void;
}

export const SocketContext = createContext<SocketContextType | null>(null);
