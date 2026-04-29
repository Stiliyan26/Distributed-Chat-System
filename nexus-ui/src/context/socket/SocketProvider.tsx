import React, { useEffect, useState } from "react";
import { io, Socket } from "socket.io-client";
import { SocketContext } from "./socket-context";

import type { ConnectionStatus } from "@/types";
import { useAuth } from "@/context/auth/useAuth";

import { attachSocketLifecycleListeners } from "./attach-socket-lifecycle-listeners";
import { SOCKET_CLIENT_OPTIONS } from "./constants/socket-client-options";
import { useSocketActions } from "./hooks/useSocketActions";

export function SocketProvider({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuth();

  const [socket, setSocket] = useState<Socket | null>(null);

  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>({
    type: "disconnected",
  });

  useEffect(() => {
    if (!isAuthenticated) {
      return;
    }

    // eslint-disable-next-line react-hooks/set-state-in-effect -- intentional connecting state when opening socket
    setConnectionStatus({ type: "connecting", message: "Connecting..." });

    const socketClient = io("/", SOCKET_CLIENT_OPTIONS);

    setSocket(socketClient);

    attachSocketLifecycleListeners(socketClient, setConnectionStatus);

    return () => {
      socketClient.disconnect();
      setSocket(null);
    };
  }, [isAuthenticated]);

  const { joinChannels, joinAllChannels, sendMessage, onNewMessage } = useSocketActions({
    socket,
  });

  return (
    <SocketContext.Provider
      value={{
        socket,
        connectionStatus,
        joinChannels,
        joinAllChannels,
        sendMessage,
        onNewMessage,
      }}
    >
      {children}
    </SocketContext.Provider>
  );
}
