import type { Socket } from "socket.io-client";

import type { SendMessagePayload } from "@/types";

import { SOCKET_EMIT_EVENTS } from "./constants/socket-events";

export function emitJoinAllUserChannels(socket: Socket, channelIds: string[]): void {
  if (!channelIds.length) {
    return;
  }

  socket.emit(SOCKET_EMIT_EVENTS.JOIN_ALL_USER_CHANNELS, { channelIds });
}

export function emitSendMessage(socket: Socket, payload: SendMessagePayload): void {
  socket.emit(SOCKET_EMIT_EVENTS.SEND_MESSAGE, payload);
}
