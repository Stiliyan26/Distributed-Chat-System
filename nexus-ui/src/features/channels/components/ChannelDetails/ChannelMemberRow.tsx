import { cn } from "@/shared/lib/cn";
import type { UserSearchResult } from "@/shared/types";
import { Avatar } from "@/shared/ui/Avatar";

interface ChannelMemberRowProps {
  member: UserSearchResult;
  isOnline: boolean;
  presenceStatusUnknown: boolean;
}

export function ChannelMemberRow({
  member,
  isOnline,
  presenceStatusUnknown,
}: ChannelMemberRowProps) {
  return (
    <div className="flex items-center gap-2.5">
      <div className="relative flex-shrink-0">
        <Avatar name={member.username} size="sm" />
        <span
          className={cn(
            "absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-slate-100 dark:border-surface",
            isOnline && "bg-emerald-500 dark:bg-emerald-400",
            !isOnline && presenceStatusUnknown && "bg-amber-400",
            !isOnline && !presenceStatusUnknown && "bg-slate-400 dark:bg-outline-var",
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
          ) : presenceStatusUnknown ? (
            <span className="text-amber-600 dark:text-amber-400/80">Unknown</span>
          ) : (
            <span className="text-slate-500 dark:text-outline-var/50">Offline</span>
          )}
        </p>
      </div>
    </div>
  );
}
