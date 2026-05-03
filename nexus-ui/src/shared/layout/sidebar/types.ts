import type { ChatPreviewMap } from "@/features/chat/models/chat-preview-message";
import type { Channel } from "@/types";

export type { SidebarView } from "./sidebar-view-ids";
export { SIDEBAR_VIEW_ID } from "./sidebar-view-ids";

export interface SidebarProps {
  activeChannelId: string | null;
  onSelectChannel: (channel: Channel) => void;
  onCreateChannel: () => void;
  unreadMap: Record<string, number>;
  previewMap: ChatPreviewMap;
}
