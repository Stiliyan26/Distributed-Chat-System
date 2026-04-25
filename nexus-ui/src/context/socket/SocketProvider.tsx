import { getUserChannels } from "@/api/channels";
import type { ConnectionStatus, SocketMessage } from "@/types";
import { useAuth } from "@/context/auth/useAuth";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { io, Socket } from "socket.io-client";
import { SocketContext } from "./socket-context";

export function SocketProvider({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuth();

  const [socket, setSocket] = useState<Socket | null>(null);
  const socketRef = useRef<Socket | null>(null);

  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>({
    type: "disconnected",
  });

  useEffect(() => {
    if (!isAuthenticated) return;

    // Immediate UX before socket.io fires connect / error events
    // eslint-disable-next-line react-hooks/set-state-in-effect -- intentional connecting state when opening socket
    setConnectionStatus({ type: "connecting", message: "Connecting..." });

    const s = io("/", {
      path: "/api/socket.io",
      withCredentials: true,
      transports: ["websocket"],
      reconnectionAttempts: 10,
      reconnectionDelay: 1500,
    });

    socketRef.current = s;
    setSocket(s);

    s.on("connect", async () => {
      setConnectionStatus({
        type: "connected",
        message: "Connection established",
        latency: 0,
      });
      try {
        const channels = await getUserChannels();
        const ids = channels.map((c) => c.channelId);
        if (ids.length) {
          s.emit("join_all_user_channels", { channelIds: ids });
        }
      } catch (e) {
        console.warn("[Socket] Could not fetch channels on connect:", e);
      }
    });

    s.on("disconnect", () => {
      setConnectionStatus({ type: "disconnected", message: "Disconnected" });
    });

    s.on("connect_error", (err) => {
      setConnectionStatus({
        type: "error",
        message: err.message || "Connection error",
      });
    });

    s.io.on("reconnect_attempt", () => {
      setConnectionStatus({
        type: "connecting",
        message: "Reconnecting to NODE-01...",
      });
    });

    s.on("error", (err: { event: string; message: string; details?: string }) => {
      console.error("[Socket error]", err);
    });

    return () => {
      s.disconnect();
      socketRef.current = null;
      setSocket(null);
    };
  }, [isAuthenticated]);

  const joinChannels = useCallback((channelIds: string[]) => {
    if (!channelIds.length) return;
    socketRef.current?.emit("join_all_user_channels", { channelIds });
  }, []);

  const joinAllChannels = useCallback(async () => {
    try {
      const channels = await getUserChannels();
      const ids = channels.map((c) => c.channelId);
      if (ids.length) {
        socketRef.current?.emit("join_all_user_channels", { channelIds: ids });
      }
    } catch (e) {
      console.warn("[Socket] Failed to fetch channels for join:", e);
    }
  }, []);

  const sendMessage = useCallback(
    (channelId: string, senderUsername: string, content: string) => {
      socketRef.current?.emit("send_message", {
        channelId,
        senderUsername,
        content,
        sentAt: new Date().toISOString(),
      });
    },
    [],
  );

  const onNewMessage = useCallback(
    (handler: (msg: SocketMessage) => void) => {
      if (!socket) return () => {};
      socket.on("new_message", handler);
      return () => {
        socket.off("new_message", handler);
      };
    },
    [socket],
  );

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
