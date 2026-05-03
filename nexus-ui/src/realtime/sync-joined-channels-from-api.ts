import type { Socket } from "socket.io-client";

import { getUserChannels } from "@/features/channels/api/channels.api";

import { emitJoinAllUserChannels } from "./socket-emit-actions";

const WARN_CONNECT = "[Socket] Could not fetch channels on connect:";
const WARN_JOIN_ALL = "[Socket] Failed to fetch channels for join:";

export async function syncJoinedChannelsFromApi(
  socket: Socket,
  context: "connect" | "joinAll" = "connect",
): Promise<void> {
  const warnMessage = context === "connect" ? WARN_CONNECT : WARN_JOIN_ALL;

  try {
    const channels = await getUserChannels();
    const channelIds = channels.map((channel) => channel.channelId);
    emitJoinAllUserChannels(socket, channelIds);
  } catch (error) {
    console.warn(warnMessage, error);
  }
}
