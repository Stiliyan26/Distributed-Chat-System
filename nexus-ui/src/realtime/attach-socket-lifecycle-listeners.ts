import type { Dispatch, SetStateAction } from "react";
import type { Socket } from "socket.io-client";

import type { ConnectionStatus } from "@/shared/types";

import { syncJoinedChannelsFromApi } from "./sync-joined-channels-from-api";

interface SocketApplicationError {
  event: string;
  message: string;
  details?: string;
}

export function attachSocketLifecycleListeners(
  socketClient: Socket,
  setConnectionStatus: Dispatch<SetStateAction<ConnectionStatus>>,
): void {
  socketClient.on("connect", async () => {
    setConnectionStatus({
      type: "connected",
      message: "Connection established",
      latency: 0,
    });

    await syncJoinedChannelsFromApi(socketClient, "connect");
  });

  socketClient.on("disconnect", () => {
    setConnectionStatus({ type: "disconnected", message: "Disconnected" });
  });

  socketClient.on("connect_error", (err) => {
    setConnectionStatus({
      type: "error",
      message: err.message || "Connection error",
    });
  });

  socketClient.io.on("reconnect_attempt", () => {
    setConnectionStatus({
      type: "connecting",
      message: "Reconnecting to NODE-01...",
    });
  });

  socketClient.on("error", (err: SocketApplicationError) => {
    console.error("[Socket error]", err);
  });
}
