import { useAuth } from "@/context/hooks/useAuth";
import { useSocket } from "@/context/hooks/useSocket";
import type { Channel, Message } from "@/types";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useChatMessages } from "./useChatMessages";
import { useChatRealtimeUpdates } from "./useChatRealtimeUpdates";

export function useChatPageState() {
  const { user } = useAuth();
  const { connectionStatus, sendMessage, onNewMessage } = useSocket();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const [activeChannel, setActiveChannel] = useState<Channel | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [localMessages, setLocalMessages] = useState<Message[]>([]);
  const [typingUser, setTypingUser] = useState<string | null>(null);
  const [unreadMap, setUnreadMap] = useState<Record<string, number>>({});
  const [previewMap, setPreviewMap] = useState<Record<string, { sender: string; content: string }>>({});

  const activeChannelId = activeChannel?.channelId;
  const { isLoading, messages } = useChatMessages({
    activeChannelId,
    localMessages,
  });

  const usernameHints = useMemo(() => {
    const hints: Record<string, string> = {};

    for (const msg of messages) {
      if (msg.senderId && msg.senderUsername) {
        hints[msg.senderId] = msg.senderUsername;
      }
    }

    return hints;
  }, [messages]);

  useChatRealtimeUpdates({
    activeChannelId,
    onNewMessage,
    setLocalMessages,
    setPreviewMap,
    setTypingUser,
    setUnreadMap,
  });

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const selectChannel = useCallback((channel: Channel) => {
    setActiveChannel(channel);
    setLocalMessages([]);
    setUnreadMap((prev) => ({ ...prev, [channel.channelId]: 0 }));
    setPreviewMap((prev) => {
      const next = { ...prev };
      delete next[channel.channelId];
      return next;
    });
    setShowDetails(false);
  }, []);

  const sendChatMessage = useCallback(
    (content: string) => {
      if (!activeChannel || !user) {
        return;
      }

      const optimistic: Message = {
        _id: `opt-${Date.now()}`,
        _optimistic: true,
        channelId: activeChannel.channelId,
        senderId: user.id,
        senderUsername: user.username,
        content,
        sentAt: new Date().toISOString(),
      };

      setLocalMessages((prev) => [...prev, optimistic]);
      sendMessage(activeChannel.channelId, user.username, content);
    },
    [activeChannel, sendMessage, user],
  );

  return {
    activeChannel,
    connectionStatus,
    isLoading,
    messages,
    messagesEndRef,
    previewMap,
    showCreateModal,
    showDetails,
    typingUser,
    unreadMap,
    usernameHints,
    closeCreateModal: () => setShowCreateModal(false),
    openCreateModal: () => setShowCreateModal(true),
    selectChannel,
    sendChatMessage,
    setShowDetails,
  };
}
