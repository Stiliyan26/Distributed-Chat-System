import { useEffect } from "react";

import type { Dispatch, SetStateAction } from "react";

import type { Message, SocketMessage } from "@/types";

import type { ChatPreviewMap } from "../models/chat-preview-message";

type UseChatRealtimeUpdatesParams = {
  activeChannelId?: string;
  onNewMessage: (handler: (msg: SocketMessage) => void) => () => void;
  setLocalMessages: Dispatch<SetStateAction<Message[]>>;
  setPreviewMap: Dispatch<SetStateAction<ChatPreviewMap>>;
  setTypingUser: Dispatch<SetStateAction<string | null>>;
  setUnreadMap: Dispatch<SetStateAction<Record<string, number>>>;
};

export function useChatRealtimeUpdates({
  activeChannelId,
  onNewMessage,
  setLocalMessages,
  setPreviewMap,
  setTypingUser,
  setUnreadMap,
}: UseChatRealtimeUpdatesParams) {
  useEffect(() => {
    const unsubscribe = onNewMessage((msg: SocketMessage) => {
      const inActiveChannel = msg.channelId === activeChannelId;

      if (inActiveChannel && activeChannelId) {
        const newMsg: Message = {
          channelId: msg.channelId ?? activeChannelId,
          senderId: msg.senderId,
          senderUsername: msg.senderUsername,
          content: msg.content,
          sentAt: msg.sentAt,
          _id: `sock-${msg.sentAt}-${msg.senderId}`,
        };

        setLocalMessages((prev) => {
          if (prev.find((m) => m._id === newMsg._id)) {
            return prev;
          }

          return [...prev, newMsg];
        });

        setTypingUser(null);
      } else if (msg.channelId) {
        const channelId = msg.channelId;

        setUnreadMap((prev) => ({
          ...prev,
          [channelId]: (prev[channelId] ?? 0) + 1,
        }));

        setPreviewMap((prev) => ({
          ...prev,
          [channelId]: { sender: msg.senderUsername, content: msg.content },
        }));
      }
    });

    return unsubscribe;
  }, [
    activeChannelId,
    onNewMessage,
    setLocalMessages,
    setPreviewMap,
    setTypingUser,
    setUnreadMap,
  ]);
}
