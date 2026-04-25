import { useState, useEffect } from 'react';
import { Hash, MessageSquare, FolderOpen, Settings, LogOut, Sun, Moon, Plus } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { Avatar } from '@/components/ui/Avatar';
import { getUserChannels } from '@/api/channels';
import { useAuth } from "@/context/auth/useAuth";
import { useSocket } from "@/context/socket/useSocket";
import { useTheme } from "@/context/theme/useTheme";
import { Theme } from '@/shared/constants/theme';
import { cn } from '@/lib/cn';
import type { Channel } from '@/types';

interface PreviewMessage {
  sender: string;
  content: string;
}

interface SidebarProps {
  activeChannelId: string | null;
  onSelectChannel: (channel: Channel) => void;
  onCreateChannel: () => void;
  unreadMap: Record<string, number>;
  previewMap: Record<string, PreviewMessage>;
}

type SidebarView = 'channels' | 'dms' | 'files' | 'settings';

export function Sidebar({ activeChannelId, onSelectChannel, onCreateChannel, unreadMap, previewMap }: SidebarProps) {
  const { user, logout } = useAuth();
  const { joinChannels } = useSocket();
  const { theme, toggleTheme } = useTheme();
  const [view, setView] = useState<SidebarView>('channels');

  const { data: channels = [] } = useQuery({
    queryKey: ['channels'],
    queryFn: getUserChannels,
    refetchOnWindowFocus: false,
  });

  // Whenever the channel list loads or changes, re-join all rooms
  useEffect(() => {
    if (channels.length) {
      joinChannels(channels.map((c) => c.channelId));
    }
  }, [channels, joinChannels]);

  const navItems: { id: SidebarView; icon: React.ReactNode; label: string }[] = [
    { id: 'channels', icon: <Hash size={18} />, label: 'Channels' },
    { id: 'dms', icon: <MessageSquare size={18} />, label: 'Direct Messages' },
    { id: 'files', icon: <FolderOpen size={18} />, label: 'Files' },
    { id: 'settings', icon: <Settings size={18} />, label: 'Settings' },
  ];

  return (
    <aside className="flex flex-col w-56 bg-slate-100 dark:bg-surface flex-shrink-0 border-r border-slate-200 dark:border-outline-var/10">
      {/* Workspace header */}
      <div className="px-4 py-4 border-b border-slate-200 dark:border-outline-var/10">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-md bg-brand-gradient flex items-center justify-center flex-shrink-0">
            <span className="text-white text-xs font-bold">N</span>
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">Nexus System</p>
            <p className="label-sm text-slate-500 dark:text-slate-400 flex items-center gap-1 mt-0.5">
              <span className="w-1.5 h-1.5 rounded-full bg-slate-500 dark:bg-slate-500" />
              Active Node: 01
            </p>
          </div>
        </div>
      </div>

      {/* Nav icons */}
      <div className="px-3 py-3 space-y-0.5">
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setView(item.id)}
            className={cn('nav-item w-full text-left', view === item.id && 'nav-item-active')}
          >
            {item.icon}
            <span>{item.label}</span>
          </button>
        ))}
      </div>

      {/* Channel list */}
      <div className="flex-1 overflow-y-auto px-3 pb-3">
        {view === 'channels' && (
          <>
            <div className="flex items-center justify-between mb-1 mt-1">
              <span className="label-sm">Channels</span>
              <button
                onClick={onCreateChannel}
                className="p-0.5 text-outline-var transition-colors hover:text-slate-900 dark:hover:text-white"
                title="Create channel"
              >
                <Plus size={14} />
              </button>
            </div>
            <div className="space-y-0.5">
              {channels.map((ch) => {
                const hasUnread = (unreadMap[ch.channelId] ?? 0) > 0;
                const preview = previewMap[ch.channelId];
                const isActive = activeChannelId === ch.channelId;
                return (
                  <button
                    key={ch.channelId}
                    onClick={() => onSelectChannel(ch)}
                    className={cn(
                      'w-full flex items-start gap-2 px-2.5 rounded-md text-sm transition-all duration-150 cursor-pointer',
                      preview ? 'py-2' : 'py-1.5',
                      isActive
                        ? 'bg-slate-200 dark:bg-surface-high text-slate-900 dark:text-white'
                        : 'text-slate-600 dark:text-white/55 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/80 dark:hover:bg-surface-high/50',
                    )}
                  >
                    <Hash size={14} className="flex-shrink-0 opacity-70 mt-0.5" />
                    <div className="flex-1 min-w-0 text-left">
                      <div className="flex items-center justify-between gap-1">
                        <span className={cn('truncate', hasUnread && !isActive && 'font-semibold text-slate-900 dark:text-white')}>
                          {ch.channelName}
                        </span>
                        {hasUnread && (
                          <span className="bg-brand-gradient text-white text-[10px] font-bold rounded-full px-1.5 py-0.5 min-w-[18px] text-center flex-shrink-0">
                            {unreadMap[ch.channelId]}
                          </span>
                        )}
                      </div>
                      {preview && !isActive && (
                        <p className="text-[11px] truncate text-slate-500 dark:text-white/40 mt-0.5">
                          <span className="font-medium text-slate-700 dark:text-white/60">{preview.sender}:</span>
                          {' '}{preview.content}
                        </p>
                      )}
                    </div>
                  </button>
                );
              })}
              {channels.length === 0 && (
                <p className="text-outline-var/50 text-xs px-2 py-3">No channels yet</p>
              )}
            </div>
          </>
        )}
        {view === 'dms' && (
          <p className="text-outline-var/50 text-xs px-2 py-3 mt-2">Direct messages coming soon.</p>
        )}
      </div>

      {/* Bottom bar */}
      <div className="border-t border-slate-200 dark:border-outline-var/10 px-3 py-3 space-y-1">
        <button
          type="button"
          onClick={toggleTheme}
          className="nav-item w-full"
        >
          {theme === Theme.DARK ? <Sun size={15} /> : <Moon size={15} />}
          <span>{theme === Theme.DARK ? 'Light mode' : 'Dark mode'}</span>
        </button>
        <button onClick={logout} className="nav-item w-full text-red-400/70 hover:text-red-400 hover:bg-red-900/20">
          <LogOut size={15} />
          <span>Logout</span>
        </button>
        {user && (
          <div className="flex items-center gap-2 px-2 pt-2 mt-1 border-t border-outline-var/10">
            <Avatar name={user.username} size="sm" />
            <div className="min-w-0">
              <p className="text-xs font-medium text-slate-900 dark:text-white truncate">{user.username}</p>
              <p className="text-[10px] text-primary/70 truncate">Developer</p>
            </div>
          </div>
        )}
      </div>
    </aside>
  );
}
