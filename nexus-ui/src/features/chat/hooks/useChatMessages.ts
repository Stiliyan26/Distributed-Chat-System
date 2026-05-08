import { useMemo } from "react";

import { useQuery } from "@tanstack/react-query";

import { getMessages } from "@/features/chat/api/messages.api";
import { mergeChatMessages } from "@/features/chat/utils/chat-message-merge";
import { QUERY_KEYS } from "@/shared/constants/queryKeys";
import type { Message } from "@/shared/types";

import { CHAT_UI } from "../constants/chat";

type UseChatMessagesParams = {
  activeChannelId?: string;
  localMessages: Message[];
};

export function useChatMessages({
  activeChannelId,
  localMessages,
}: UseChatMessagesParams) {
  const { data: fetchedMessages = [], isLoading } = useQuery({
    queryKey: [QUERY_KEYS.messages, activeChannelId],
    queryFn: () => {
      if (!activeChannelId) {
        return Promise.resolve([]);
      }

      return getMessages(activeChannelId);
    },
    enabled: !!activeChannelId,
    staleTime: CHAT_UI.messageStaleTimeMs,
  });

  const messages = useMemo(() => {
    if (localMessages.length === 0) {
      return fetchedMessages;
    }

    return mergeChatMessages(fetchedMessages, localMessages);
  }, [fetchedMessages, localMessages]);

  return {
    isLoading,
    messages,
  };
}
