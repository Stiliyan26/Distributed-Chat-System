import { Plus } from "lucide-react";

import type { ChatPreviewMap } from "@/features/chat/models/chat-preview-message";
import type { Channel } from "@/types";

import { SidebarChannelRow } from "./SidebarChannelRow";

interface SidebarChannelsPanelProps {
  channels: Channel[];
  activeChannelId: string | null;
  onSelectChannel: (channel: Channel) => void;
  onCreateChannel: () => void;
  unreadMap: Record<string, number>;
  previewMap: ChatPreviewMap;
}

export function SidebarChannelsPanel({
  channels,
  activeChannelId,
  onSelectChannel,
  onCreateChannel,
  unreadMap,
  previewMap,
}: SidebarChannelsPanelProps) {
  return (
    <>
      <div className="flex items-center justify-between mb-1 mt-1">
        <span className="label-sm">Channels</span>

        <button
          type="button"
          onClick={onCreateChannel}
          className="p-0.5 text-outline-var transition-colors hover:text-slate-900 dark:hover:text-white"
          title="Create channel"
        >
          <Plus size={14} />
        </button>
      </div>

      <div className="space-y-0.5">
        {channels.map((ch) => (
          <SidebarChannelRow
            key={ch.channelId}
            channel={ch}
            activeChannelId={activeChannelId}
            unreadCount={unreadMap[ch.channelId] ?? 0}
            preview={previewMap[ch.channelId]}
            onSelect={() => onSelectChannel(ch)}
          />
        ))}

        {channels.length === 0 && (
          <p className="text-outline-var/50 text-xs px-2 py-3">No channels yet</p>
        )}
      </div>
    </>
  );
}
