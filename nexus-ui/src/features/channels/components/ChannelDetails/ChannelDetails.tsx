import { useMemo, useState } from "react";

import { useQuery } from "@tanstack/react-query";

import { useAuth } from "@/features/auth/hooks/useAuth";
import { getChannelMembers } from "@/features/channels/api/channels.api";
import { getUsersPresenceStatus } from "@/features/presence/api/presence.api";
import { useSocket } from "@/realtime/useSocket";
import { resolveUsersByIds } from "@/shared/api/users.api";
import type { Channel, UserSearchResult } from "@/shared/types";

import { AddMemberModal } from "../AddMemberModal";
import { ChannelDetailsDescription } from "./ChannelDetailsDescription";
import { ChannelDetailsHeader } from "./ChannelDetailsHeader";
import { ChannelDetailsIdSection } from "./ChannelDetailsIdSection";
import { ChannelDetailsMembers } from "./ChannelDetailsMembers";

interface ChannelDetailsProps {
  channel: Channel;
  onClose: () => void;
  /** senderId → username from chat history when /users/resolve is unavailable. */
  usernameHints?: Record<string, string>;
}

export function ChannelDetails({ channel, onClose, usernameHints = {} }: ChannelDetailsProps) {
  const [isAddMemberModalOpen, setAddMemberModalOpen] = useState(false);
  const { user } = useAuth();
  const { connectionStatus } = useSocket();

  const usernameByUserId = useMemo(() => {
    const lookup: Record<string, string> = { ...usernameHints };

    if (user) {
      lookup[user.id] = user.username;
    }
    return lookup;
  }, [usernameHints, user]);

  const { data: membersResponse } = useQuery({
    queryKey: ["channel-members", channel.channelId],
    queryFn: () => getChannelMembers(channel.channelId),
    enabled: !!channel.channelId,
  });

  const memberIds = membersResponse?.memberIds ?? [];

  const { data: resolvedMemberProfiles, isError: isResolveUsersError } = useQuery({
    queryKey: ["resolve-users", channel.channelId, memberIds],
    queryFn: () => resolveUsersByIds(memberIds),
    enabled: memberIds.length > 0,
  });

  const { data: presenceSnapshot, isError: isPresenceQueryError } = useQuery({
    queryKey: ["presence", channel.channelId, memberIds],
    queryFn: () => getUsersPresenceStatus(memberIds),
    enabled: memberIds.length > 0,
    refetchInterval: 15_000,
    retry: 1,
  });

  const resolvedMemberById = new Map(
    !isResolveUsersError && resolvedMemberProfiles
      ? resolvedMemberProfiles.map((profile) => [profile.id, profile] as const)
      : [],
  );

  const membersInChannelOrder: UserSearchResult[] = memberIds.map((memberId) => {
    const resolvedProfile = resolvedMemberById.get(memberId);

    if (resolvedProfile) {
      return resolvedProfile;
    }

    const hintedUsername = usernameByUserId[memberId];

    if (hintedUsername) {
      return { id: memberId, username: hintedUsername, email: "" };
    }

    return { id: memberId, username: `user-${memberId.slice(0, 8)}`, email: "" };
  });

  const hasUnresolvedMemberNames =
    isResolveUsersError &&
    memberIds.some((memberId) => !resolvedMemberById.get(memberId) && !usernameByUserId[memberId]);

  const onlineUserIdSet = new Set(presenceSnapshot?.onlineUserIds ?? []);
  const unknownPresenceUserIdSet = new Set(presenceSnapshot?.statusUnknownUserIds ?? []);

  if (isPresenceQueryError) {
    memberIds.forEach((memberId) => unknownPresenceUserIdSet.add(memberId));
    if (user && connectionStatus.type === "connected") {
      unknownPresenceUserIdSet.delete(user.id);
      onlineUserIdSet.add(user.id);
    }
  }

  const memberCount = memberIds.length;

  return (
    <aside className="w-64 flex-shrink-0 bg-slate-100 dark:bg-surface border-l border-slate-200 dark:border-outline-var/10 flex flex-col animate-fade-in">
      <ChannelDetailsHeader onClose={onClose} />

      <div className="flex-1 overflow-y-auto">
        <ChannelDetailsDescription channel={channel} />

        <ChannelDetailsMembers
          memberCount={memberCount}
          membersInChannelOrder={membersInChannelOrder}
          hasUnresolvedMemberNames={hasUnresolvedMemberNames}
          isPresenceQueryError={isPresenceQueryError}
          onlineUserIdSet={onlineUserIdSet}
          unknownPresenceUserIdSet={unknownPresenceUserIdSet}
          onAddMemberClick={() => setAddMemberModalOpen(true)}
        />

        <ChannelDetailsIdSection channelId={channel.channelId} />
      </div>

      {isAddMemberModalOpen && (
        <AddMemberModal
          channelId={channel.channelId}
          existingMemberIds={memberIds}
          onClose={() => setAddMemberModalOpen(false)}
        />
      )}
    </aside>
  );
}
