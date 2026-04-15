import { getMessages } from "@/api/messages";
import { QUERY_KEYS } from "@/shared/constants/queryKeys";
import { mergeChatMessages } from "@/lib/utils";
import type { Message } from "@/types";
import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
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
    queryFn: () => getMessages(activeChannelId!),
    enabled: !!activeChannelId,
    staleTime: CHAT_UI.messageStaleTimeMs,
  });

  const messages = useMemo(
    () => mergeChatMessages(fetchedMessages, localMessages),
    [fetchedMessages, localMessages],
  );

  return {
    isLoading,
    messages,
  };
}
