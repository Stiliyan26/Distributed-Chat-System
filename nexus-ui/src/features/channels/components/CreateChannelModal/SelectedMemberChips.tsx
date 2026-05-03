import { X } from "lucide-react";

import { Avatar } from "@/components/ui/Avatar";
import type { UserSearchResult } from "@/types";

interface SelectedMemberChipsProps {
  members: UserSearchResult[];
  onRemoveMember: (memberId: string) => void;
}

export function SelectedMemberChips({
  members,
  onRemoveMember,
}: SelectedMemberChipsProps) {
  if (members.length === 0) {
    return null;
  }

  return (
    <ul className="mt-2 flex flex-wrap gap-1.5" aria-label="Selected members">
      {members.map((member) => (
        <li key={member.id}>
          <span className="flex items-center gap-1.5 rounded-md border border-slate-200 bg-slate-100 px-2.5 py-1 text-xs text-slate-800 dark:border-outline-var/30 dark:bg-surface-high dark:text-white">
            <Avatar
              name={member.username}
              size="sm"
              className="h-4 w-4 text-[9px]"
            />

            {member.username}

            <button
              type="button"
              onClick={() => onRemoveMember(member.id)}
              aria-label={`Remove ${member.username}`}
              className="ml-0.5 text-slate-500 transition-colors hover:text-slate-900 dark:text-outline-var dark:hover:text-white"
            >
              <X size={11} aria-hidden />
            </button>
          </span>
        </li>
      ))}
    </ul>
  );
}
