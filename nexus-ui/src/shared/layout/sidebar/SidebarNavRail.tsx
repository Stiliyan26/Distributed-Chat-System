import { FolderOpen, Hash, MessageSquare, Settings } from "lucide-react";
import type { ReactNode } from "react";

import { cn } from "@/shared/lib/cn";

import { SIDEBAR_VIEW_ID, type SidebarView } from "./sidebar-view-ids";

interface SidebarNavRailProps {
  view: SidebarView;
  onViewChange: (next: SidebarView) => void;
}

interface SidebarNavItem {
  id: SidebarView;
  icon: ReactNode;
  label: string;
}

const NAV_ITEMS: SidebarNavItem[] = [
  {
    id: SIDEBAR_VIEW_ID.CHANNELS,
    icon: <Hash size={18} />,
    label: "Channels",
  },
  {
    id: SIDEBAR_VIEW_ID.DMS,
    icon: <MessageSquare size={18} />,
    label: "Direct Messages",
  },
  {
    id: SIDEBAR_VIEW_ID.FILES,
    icon: <FolderOpen size={18} />,
    label: "Files",
  },
  {
    id: SIDEBAR_VIEW_ID.SETTINGS,
    icon: <Settings size={18} />,
    label: "Settings",
  },
];

export function SidebarNavRail({ view, onViewChange }: SidebarNavRailProps) {
  return (
    <div className="p-3 space-y-0.5">
      {NAV_ITEMS.map((item) => (
        <button
          key={item.id}
          type="button"
          onClick={() => onViewChange(item.id)}
          className={cn("nav-item w-full text-left", view === item.id && "nav-item-active")}
        >
          {item.icon}
          <span>{item.label}</span>
        </button>
      ))}
    </div>
  );
}
