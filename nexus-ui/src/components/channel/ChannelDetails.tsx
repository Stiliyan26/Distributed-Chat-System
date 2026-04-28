import { useState, useMemo } from 'react';
import { X, UserPlus, Calendar } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { Avatar } from '@/components/ui/Avatar';
import { getChannelMembers } from "@/api/channels/channels.api";
import { resolveUsersByIds } from "@/api/users/users.api";
import { getUsersPresenceStatus } from "@/api/presence/presence.api";
import { cn } from '@/lib/cn';
import { AddMemberModal } from './AddMemberModal';
import { useAuth } from "@/context/auth/useAuth";
import { useSocket } from "@/context/socket/useSocket";
import type { Channel, UserSearchResult } from '@/types';

interface ChannelDetailsProps {
  channel: Channel;
  onClose: () => void;
  /** senderId → username from chat history when /users/resolve is unavailable. */
  usernameHints?: Record<string, string>;
}

export function ChannelDetails({ channel, onClose, usernameHints = {} }: ChannelDetailsProps) {
  const [showAddMember, setShowAddMember] = useState(false);
  const { user } = useAuth();
  const { connectionStatus } = useSocket();

  const hints = useMemo(() => {
    const h: Record<string, string> = { ...usernameHints };
    if (user) h[user.id] = user.username;
    return h;
  }, [usernameHints, user]);

  const { data: membersResponse } = useQuery({
    queryKey: ['channel-members', channel.channelId],
    queryFn: () => getChannelMembers(channel.channelId),
    enabled: !!channel.channelId,
  });

  const memberIds = membersResponse?.memberIds ?? [];

  const {
    data: resolvedUsers,
    isError: resolveError,
  } = useQuery({
    queryKey: ['resolve-users', channel.channelId, memberIds],
    queryFn: () => resolveUsersByIds(memberIds),
    enabled: memberIds.length > 0,
  });

  const {
    data: presence,
    isError: presenceError,
  } = useQuery({
    queryKey: ['presence', channel.channelId, memberIds],
    queryFn: () => getUsersPresenceStatus(memberIds),
    enabled: memberIds.length > 0,
    refetchInterval: 15_000,
    retry: 1,
  });

  const byId = new Map(
    !resolveError && resolvedUsers ? resolvedUsers.map((u) => [u.id, u]) : [],
  );
  const membersOrdered: UserSearchResult[] = memberIds.map((id) => {
    const u = byId.get(id);
    if (u) return u;
    const hint = hints[id];
    if (hint) return { id, username: hint, email: '' };
    return { id, username: `user-${id.slice(0, 8)}`, email: '' };
  });

  const stillMissingName = resolveError && memberIds.some((id) => !byId.get(id) && !hints[id]);

  const onlineSet = new Set(presence?.onlineUserIds ?? []);
  const unknownSet = new Set(presence?.statusUnknownUserIds ?? []);
  if (presenceError) {
    memberIds.forEach((id) => unknownSet.add(id));
    if (user && connectionStatus.type === 'connected') {
      unknownSet.delete(user.id);
      onlineSet.add(user.id);
    }
  }

  const memberCount = memberIds.length;

  return (
    <aside className="w-64 flex-shrink-0 bg-slate-100 dark:bg-surface border-l border-slate-200 dark:border-outline-var/10 flex flex-col animate-fade-in">
      <div className="flex items-center justify-between px-4 py-3.5 border-b border-slate-200 dark:border-outline-var/10">
        <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Channel Details</h3>
        <button
          onClick={onClose}
          className="text-outline-var hover:text-slate-900 dark:hover:text-white transition-colors"
        >
          <X size={16} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="p-4 border-b border-slate-200 dark:border-outline-var/10">
          <p className="label-sm mb-2">Description</p>
          <p className="text-sm text-slate-600 dark:text-white/60 leading-relaxed">
            {channel.description ?? 'No description set for this channel.'}
          </p>
          {channel.createdAt && (
            <div className="flex items-center gap-1.5 mt-3 text-outline-var/80 text-xs">
              <Calendar size={11} />
              <span className="label-sm">
                Created{' '}
                {new Date(channel.createdAt).toLocaleDateString('en-US', {
                  month: 'long',
                  year: 'numeric',
                })}
              </span>
            </div>
          )}
        </div>

        <div className="p-4 border-b border-slate-200 dark:border-outline-var/10">
          <div className="flex items-center justify-between mb-3">
            <span className="label-sm">Members — {memberCount}</span>
          </div>

          {stillMissingName && (
            <p className="text-xs text-amber-600 dark:text-amber-400/90 mb-2">
              Could not load member names for everyone. Names from chat are used when available.
            </p>
          )}
          {presenceError && (
            <p className="text-xs text-amber-600 dark:text-amber-400/90 mb-2">
              Presence service unavailable. Your status reflects the live connection; others may show as unknown.
            </p>
          )}
          <div className="space-y-2">
            {membersOrdered.map((member) => {
              const isOnline = onlineSet.has(member.id);
              const isUnknown = unknownSet.has(member.id);
              return (
                <div key={member.id} className="flex items-center gap-2.5">
                  <div className="relative flex-shrink-0">
                    <Avatar name={member.username} size="sm" />
                    <span
                      className={cn(
                        'absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-slate-100 dark:border-surface',
                        isOnline && 'bg-emerald-500 dark:bg-emerald-400',
                        !isOnline && isUnknown && 'bg-amber-400',
                        !isOnline && !isUnknown && 'bg-slate-400 dark:bg-outline-var',
                      )}
                    />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm text-slate-900 dark:text-white truncate font-medium">
                      {member.username}
                    </p>
                    <p className="label-sm text-[9px]">
                      {isOnline ? (
                        <span className="text-slate-700 dark:text-slate-300">Online</span>
                      ) : isUnknown ? (
                        <span className="text-amber-600 dark:text-amber-400/80">Unknown</span>
                      ) : (
                        <span className="text-slate-500 dark:text-outline-var/50">Offline</span>
                      )}
                    </p>
                  </div>
                </div>
              );
            })}
            {memberCount === 0 && (
              <p className="text-outline-var/50 text-xs">No members found.</p>
            )}
          </div>

          <button
            type="button"
            onClick={() => setShowAddMember(true)}
            className="w-full mt-3 flex items-center justify-center gap-1.5 py-2 rounded-md bg-slate-200/80 dark:bg-surface-mid border border-slate-300 dark:border-outline-var/20 text-sm text-slate-700 dark:text-white/80 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-surface-high transition-all"
          >
            <UserPlus size={14} />
            <span>Add Member</span>
          </button>
        </div>

        <div className="p-4">
          <p className="label-sm mb-2">Channel ID</p>
          <p className="font-mono text-[10px] text-outline-var/60 break-all">{channel.channelId}</p>
        </div>
      </div>

      {showAddMember && (
        <AddMemberModal
          channelId={channel.channelId}
          existingMemberIds={memberIds}
          onClose={() => setShowAddMember(false)}
        />
      )}
    </aside>
  );
}
