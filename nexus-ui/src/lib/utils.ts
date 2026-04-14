import type { Message } from '@/types';

const AVATAR_COLORS = [
  'bg-indigo-500',
  'bg-purple-500',
  'bg-violet-600',
  'bg-blue-500',
  'bg-teal-600',
  'bg-rose-500',
  'bg-amber-500',
];

export function getAvatarColor(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

export function getInitials(name: string): string {
  return name
    .split(/[\s_-]/)
    .map((p) => p[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

export function formatTime(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

export function formatDate(iso: string): string {
  const d = new Date(iso);
  const today = new Date();
  const diff = today.getDate() - d.getDate();
  if (diff === 0 && today.getMonth() === d.getMonth() && today.getFullYear() === d.getFullYear())
    return 'TODAY';
  if (diff === 1) return 'YESTERDAY';
  return d.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' }).toUpperCase();
}

export function isCodeBlock(content: string): boolean {
  return content.startsWith('```') && content.endsWith('```');
}

export function parseCodeBlock(content: string): { lang: string; code: string } {
  const firstLine = content.slice(3, content.indexOf('\n'));
  const code = content.slice(content.indexOf('\n') + 1, -3);
  return { lang: firstLine || 'bash', code };
}

/** Groups the same logical message from optimistic UI, socket echo, and REST refetch (second precision). */
export function chatMessageFingerprint(m: {
  channelId: string;
  senderId: string;
  content: string;
  sentAt: string;
}): string {
  const sec = Math.floor(new Date(m.sentAt).getTime() / 1000);
  return `${m.channelId}|${m.senderId}|${sec}|${m.content}`;
}

/** Merges API + local rows; prefers non-optimistic copies when fingerprints collide. */
export function mergeChatMessages(fetched: Message[], local: Message[]): Message[] {
  const map = new Map<string, Message>();

  const consider = (m: Message) => {
    const k = chatMessageFingerprint(m);
    const cur = map.get(k);
    if (!cur) {
      map.set(k, m);
      return;
    }
    if (cur._optimistic && !m._optimistic) {
      map.set(k, m);
    } else if (!cur._optimistic && m._optimistic) {
      return;
    } else {
      map.set(k, m);
    }
  };

  fetched.forEach(consider);
  local.forEach(consider);

  return [...map.values()].sort(
    (a, b) => new Date(a.sentAt).getTime() - new Date(b.sentAt).getTime(),
  );
}
