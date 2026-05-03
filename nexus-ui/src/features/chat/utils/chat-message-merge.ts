import type { ChatMessageFingerprintFields, Message } from '@/shared/types';

/** Groups the same logical message from optimistic UI, socket echo, and REST refetch (second precision). */
export function chatMessageFingerprint(message: ChatMessageFingerprintFields): string {
  const sec = Math.floor(new Date(message.sentAt).getTime() / 1000);
  return `${message.channelId}|${message.senderId}|${sec}|${message.content}`;
}

/** Merges API + local rows; prefers non-optimistic copies when fingerprints collide. */
export function mergeChatMessages(fetched: Message[], local: Message[]): Message[] {
  const messagesByFingerprint = new Map<string, Message>();

  const upsertByFingerprint = (incoming: Message) => {
    const fingerprint = chatMessageFingerprint(incoming);
    const existing = messagesByFingerprint.get(fingerprint);

    if (!existing) {
      messagesByFingerprint.set(fingerprint, incoming);
      return;
    }

    const existingIsOptimistic = Boolean(existing._optimistic);
    const incomingIsOptimistic = Boolean(incoming._optimistic);

    const replaceOptimisticWithConfirmedCopy = existingIsOptimistic && !incomingIsOptimistic;
    const skipIncomingOptimisticDuplicate = !existingIsOptimistic && incomingIsOptimistic;

    if (replaceOptimisticWithConfirmedCopy) {
      messagesByFingerprint.set(fingerprint, incoming);
      return;
    }

    if (skipIncomingOptimisticDuplicate) {
      return;
    }

    // Both optimistic or both confirmed — same fingerprint bucket; latest upsert wins.
    messagesByFingerprint.set(fingerprint, incoming);
  };

  fetched.forEach(upsertByFingerprint);
  local.forEach(upsertByFingerprint);

  return [...messagesByFingerprint.values()]
    .sort((firstMessage, secondMessage) => {
      return new Date(firstMessage.sentAt).getTime() - new Date(secondMessage.sentAt).getTime();
    });
}
