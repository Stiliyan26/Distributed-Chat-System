function isSameCalendarDay(left: Date, right: Date): boolean {
  return (
    left.getFullYear() === right.getFullYear() &&
    left.getMonth() === right.getMonth() &&
    left.getDate() === right.getDate()
  );
}

export function formatChatMessageTime(chatMessageTime: string): string {
  const parsed = new Date(chatMessageTime);

  return parsed.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

export function formatChatDaySeparatorLabel(chatMessageTime: string): string {
  const messageDay = new Date(chatMessageTime);
  const today = new Date();

  if (isSameCalendarDay(messageDay, today)) {
    return 'TODAY';
  }

  const yesterday = new Date(today.getFullYear(), today.getMonth(), today.getDate() - 1);
  if (isSameCalendarDay(messageDay, yesterday)) {
    return 'YESTERDAY';
  }

  return messageDay
    .toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })
    .toUpperCase();
}
