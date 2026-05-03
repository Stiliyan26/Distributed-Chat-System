import type { ReactNode, RefObject } from "react";

import { EmptyChat } from "@/components/chat/EmptyChat";
import { MessageBubble } from "@/components/chat/MessageBubble";
import { formatChatDaySeparatorLabel } from "@/lib/chat-datetime";
import type { Message } from "@/types";

type ChatMessagesPanelProps = {
  isLoading: boolean;
  messages: Message[];
  ownUserId?: string;
  messagesEndRef: RefObject<HTMLDivElement | null>;
};

function renderGroupedMessages(
  messages: Message[],
  ownUserId?: string,
): ReactNode[] {
  const result: ReactNode[] = [];
  let lastDate = "";
  let lastSenderId = "";

  messages.forEach((msg, idx) => {
    const date = formatChatDaySeparatorLabel(msg.sentAt);

    if (date !== lastDate) {
      result.push(
        <div key={`sep-${idx}`} className="flex items-center gap-3 px-4 py-3">
          <div className="flex-1 h-px bg-outline-var/15" />
          <span className="label-sm text-outline-var/60">{date}</span>
          <div className="flex-1 h-px bg-outline-var/15" />
        </div>,
      );
      lastDate = date;
      lastSenderId = "";
    }

    const showHeader = msg.senderId !== lastSenderId;

    result.push(
      <MessageBubble
        key={msg._id ?? `${msg.senderId}-${msg.sentAt}-${idx}`}
        message={msg}
        isOwn={msg.senderId === ownUserId}
        showHeader={showHeader}
      />,
    );
    lastSenderId = msg.senderId;
  });

  return result;
}

export function ChatMessagesPanel({
  isLoading,
  messages,
  ownUserId,
  messagesEndRef,
}: ChatMessagesPanelProps) {
  return (
    <div className="flex-1 overflow-y-auto py-4 space-y-0.5">
      {isLoading ? (
        <div className="flex items-center justify-center h-full">
          <span className="animate-spin border-2 border-indigo-500/30 border-t-indigo-500 rounded-full w-6 h-6" />
        </div>
      ) : messages.length === 0 ? (
        <EmptyChat
          onSendFirst={() =>
            (
              document.querySelector("textarea") as HTMLTextAreaElement | null
            )?.focus()
          }
        />
      ) : (
        <>
          {renderGroupedMessages(messages, ownUserId)}

          <div ref={messagesEndRef} />
        </>
      )}
    </div>
  );
}
