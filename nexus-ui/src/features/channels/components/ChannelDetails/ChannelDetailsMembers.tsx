import { UserPlus } from "lucide-react";

import type { UserSearchResult } from "@/types";

import { ChannelMemberRow } from "./ChannelMemberRow";

interface ChannelDetailsMembersProps {
  memberCount: number;
  membersInChannelOrder: UserSearchResult[];
  hasUnresolvedMemberNames: boolean;
  isPresenceQueryError: boolean;
  onlineUserIdSet: ReadonlySet<string>;
  unknownPresenceUserIdSet: ReadonlySet<string>;
  onAddMemberClick: () => void;
}

export function ChannelDetailsMembers({
  memberCount,
  membersInChannelOrder,
  hasUnresolvedMemberNames,
  isPresenceQueryError,
  onlineUserIdSet,
  unknownPresenceUserIdSet,
  onAddMemberClick,
}: ChannelDetailsMembersProps) {
  return (
    <div className="p-4 border-b border-slate-200 dark:border-outline-var/10">
      <div className="flex items-center justify-between mb-3">
        <span className="label-sm">Members — {memberCount}</span>
      </div>

      {hasUnresolvedMemberNames && (
        <p className="text-xs text-amber-600 dark:text-amber-400/90 mb-2">
          Could not load member names for everyone. Names from chat are used when available.
        </p>
      )}
      {isPresenceQueryError && (
        <p className="text-xs text-amber-600 dark:text-amber-400/90 mb-2">
          Presence service unavailable. Your status reflects the live connection; others may show as
          unknown.
        </p>
      )}
      <div className="space-y-2">
        {membersInChannelOrder.map((member) => (
          <ChannelMemberRow
            key={member.id}
            member={member}
            isOnline={onlineUserIdSet.has(member.id)}
            presenceStatusUnknown={unknownPresenceUserIdSet.has(member.id)}
          />
        ))}
        {memberCount === 0 && <p className="text-outline-var/50 text-xs">No members found.</p>}
      </div>

      <button
        type="button"
        onClick={onAddMemberClick}
        className="w-full mt-3 flex items-center justify-center gap-1.5 py-2 rounded-md bg-slate-200/80 dark:bg-surface-mid border border-slate-300 dark:border-outline-var/20 text-sm text-slate-700 dark:text-white/80 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-surface-high transition-all"
      >
        <UserPlus size={14} />
        <span>Add Member</span>
      </button>
    </div>
  );
}
