import { useCallback } from "react";
import type { Socket } from "socket.io-client";

import type { SocketMessage } from "@/types";

import { emitJoinAllUserChannels, emitSendMessage } from "../socket-emit-actions";
import { syncJoinedChannelsFromApi } from "../sync-joined-channels-from-api";

function noopNewMessageUnsubscribe(): void { }

interface UseSocketActionsParams {
  socket: Socket | null;
}

export function useSocketActions({ socket }: UseSocketActionsParams) {
  const joinChannels = useCallback((channelIds: string[]) => {
    if (!socket) {
      return;
    }

    emitJoinAllUserChannels(socket, channelIds);
  },
    [socket],
  );

  const joinAllChannels = useCallback(async () => {
    if (!socket) {
      return;
    }

    await syncJoinedChannelsFromApi(socket, "joinAll");
  }, [socket]);

  const sendMessage = useCallback((channelId: string, senderUsername: string, content: string) => {
    if (!socket) {
      return;
    }

    emitSendMessage(socket, {
      channelId,
      senderUsername,
      content,
      sentAt: new Date().toISOString(),
    });
  }, [socket]);

  const onNewMessage = useCallback((handler: (msg: SocketMessage) => void) => {
    if (!socket) {
      return noopNewMessageUnsubscribe;
    }

    socket.on("new_message", handler);

    return () => {
      socket.off("new_message", handler);
    };
  }, [socket]);

  return {
    joinChannels,
    joinAllChannels,
    sendMessage,
    onNewMessage,
  };
}
