import { useEffect, useState } from "react";

import { useQuery } from "@tanstack/react-query";

import { useAuth } from "@/features/auth/hooks/useAuth";
import { getUserChannels } from "@/features/channels/api/channels.api";
import { useSocket } from "@/realtime/useSocket";
import { useTheme } from "@/shared/theme/useTheme";

import { SIDEBAR_VIEW_ID } from "./sidebar-view-ids";
import { SidebarBottomBar } from "./SidebarBottomBar";
import { SidebarChannelsPanel } from "./SidebarChannelsPanel";
import { SidebarComingSoon } from "./SidebarComingSoon";
import { SidebarNavRail } from "./SidebarNavRail";
import { SidebarWorkspaceHeader } from "./SidebarWorkspaceHeader";
import type { SidebarProps, SidebarView } from "./types";

export function Sidebar({
  activeChannelId,
  onSelectChannel,
  onCreateChannel,
  unreadMap,
  previewMap,
}: SidebarProps) {
  const { user, logout } = useAuth();
  const { joinAllChannels } = useSocket();
  const { theme, toggleTheme } = useTheme();
  const [view, setView] = useState<SidebarView>(SIDEBAR_VIEW_ID.CHANNELS);

  const { data: channels = [] } = useQuery({
    queryKey: ["channels"],
    queryFn: getUserChannels,
    refetchOnWindowFocus: false,
  });

  useEffect(() => {
    if (!channels.length) {
      return;
    }

    void joinAllChannels();
  }, [channels, joinAllChannels]);

  return (
    <aside className="flex flex-col w-56 bg-slate-100 dark:bg-surface flex-shrink-0 border-r border-slate-200 dark:border-outline-var/10">
      <SidebarWorkspaceHeader />

      <SidebarNavRail view={view} onViewChange={setView} />

      <div className="flex-1 overflow-y-auto px-3 pb-3">
        {view === SIDEBAR_VIEW_ID.CHANNELS && (
          <SidebarChannelsPanel
            channels={channels}
            activeChannelId={activeChannelId}
            onSelectChannel={onSelectChannel}
            onCreateChannel={onCreateChannel}
            unreadMap={unreadMap}
            previewMap={previewMap}
          />
        )}

        {view === SIDEBAR_VIEW_ID.DMS && (
          <SidebarComingSoon message="Direct messages coming soon." />
        )}
      </div>

      <SidebarBottomBar user={user} theme={theme} onToggleTheme={toggleTheme} onLogout={logout} />
    </aside>
  );
}
