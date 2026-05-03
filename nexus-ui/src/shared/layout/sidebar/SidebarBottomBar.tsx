import { LogOut, Moon, Sun } from "lucide-react";

import { Theme } from "@/shared/constants/theme";
import type { AuthResponse } from "@/shared/types";
import { Avatar } from "@/shared/ui/Avatar";

interface SidebarBottomBarProps {
  user: AuthResponse | null;
  theme: Theme;
  onToggleTheme: () => void;
  onLogout: () => void;
}

export function SidebarBottomBar({ user, theme, onToggleTheme, onLogout }: SidebarBottomBarProps) {
  const themeIcon = theme === Theme.DARK ? <Sun size={15} /> : <Moon size={15} />;

  const themeLabel = theme === Theme.DARK ? "Light mode" : "Dark mode";

  return (
    <div className="border-t border-slate-200 dark:border-outline-var/10 px-3 py-3 space-y-1">
      <button type="button" onClick={onToggleTheme} className="nav-item w-full">
        {themeIcon}
        <span>{themeLabel}</span>
      </button>

      <button
        type="button"
        onClick={onLogout}
        className="nav-item w-full text-red-400/70 hover:text-red-400 hover:bg-red-900/20"
      >
        <LogOut size={15} />
        <span>Logout</span>
      </button>

      {user && (
        <div className="flex items-center gap-2 px-2 pt-2 mt-1 border-t border-outline-var/10">
          <Avatar name={user.username} size="sm" />

          <div className="min-w-0">
            <p className="text-xs font-medium text-slate-900 dark:text-white truncate">
              {user.username}
            </p>

            <p className="text-[10px] text-primary/70 truncate">Developer</p>
          </div>
        </div>
      )}
    </div>
  );
}
