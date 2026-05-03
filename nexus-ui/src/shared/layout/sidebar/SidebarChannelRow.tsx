import { Hash } from "lucide-react";

import type { ChatPreviewMessage } from "@/features/chat/models/chat-preview-message";
import { cn } from "@/lib/cn";
import type { Channel } from "@/types";

interface SidebarChannelRowProps {
  channel: Channel;
  activeChannelId: string | null;
  unreadCount: number;
  preview?: ChatPreviewMessage;
  onSelect: () => void;
}

export function SidebarChannelRow({
  channel,
  activeChannelId,
  unreadCount,
  preview,
  onSelect,
}: SidebarChannelRowProps) {
  const hasUnread = unreadCount > 0;
  const isActive = activeChannelId === channel.channelId;

  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        "w-full flex items-start gap-2 px-2.5 rounded-md text-sm transition-all duration-150 cursor-pointer",
        preview ? "py-2" : "py-1.5",
        isActive
          ? "bg-slate-200 dark:bg-surface-high text-slate-900 dark:text-white"
          : "text-slate-600 dark:text-white/55 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/80 dark:hover:bg-surface-high/50",
      )}
    >
      <Hash size={14} className="flex-shrink-0 opacity-70 mt-0.5" />

      <div className="flex-1 min-w-0 text-left">
        <div className="flex items-center justify-between gap-1">
          <span
            className={cn(
              "truncate",
              hasUnread && !isActive && "font-semibold text-slate-900 dark:text-white",
            )}
          >
            {channel.channelName}
          </span>

          {hasUnread && (
            <span
              className="inline-flex h-[18px] min-w-[18px] shrink-0 items-center justify-center rounded-full bg-brand-gradient px-1 text-[10px] font-bold tabular-nums leading-none text-white"
              aria-label={`${unreadCount} unread`}
            >
              {unreadCount > 99 ? "99+" : unreadCount}
            </span>
          )}
        </div>

        {preview && !isActive && (
          <p className="text-[11px] truncate text-slate-500 dark:text-white/40 mt-0.5">
            <span className="font-medium text-slate-700 dark:text-white/60">{preview.sender}:</span>{" "}
            {preview.content}
          </p>
        )}
      </div>
    </button>
  );
}
