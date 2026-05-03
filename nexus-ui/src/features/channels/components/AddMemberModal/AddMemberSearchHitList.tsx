import type { UserSearchResult } from "@/shared/types";
import { Avatar } from "@/shared/ui/Avatar";

interface AddMemberSearchHitListProps {
  hits: UserSearchResult[];
  onSelectUser: (user: UserSearchResult) => void;
  isAddRequestPending: boolean;
}

export function AddMemberSearchHitList({
  hits,
  onSelectUser,
  isAddRequestPending,
}: AddMemberSearchHitListProps) {
  if (hits.length === 0) {
    return null;
  }

  return (
    <ul
      className="max-h-[min(50vh,280px)] list-none space-y-0 overflow-y-auto overscroll-y-contain rounded-md border border-slate-200 bg-slate-50 py-0.5 [scrollbar-gutter:stable] dark:border-outline-var/20 dark:bg-surface"
      role="listbox"
      aria-label="Search results"
    >
      {hits.map((hit) => (
        <li
          key={hit.id}
          className="border-b border-slate-200/80 last:border-b-0 dark:border-outline-var/10"
        >
          <button
            type="button"
            role="option"
            onClick={() => onSelectUser(hit)}
            disabled={isAddRequestPending}
            className="flex w-full items-center gap-3 px-3 py-2.5 text-left transition-colors hover:bg-white disabled:opacity-50 dark:hover:bg-surface-mid"
          >
            <Avatar name={hit.username} size="sm" />

            <span className="flex-1 text-sm text-slate-900 dark:text-white">
              {hit.username}
            </span>

            <span className="max-w-[120px] truncate font-mono text-[9px] uppercase tracking-wide text-slate-500 dark:text-outline-var/60">
              {hit.email}
            </span>
          </button>
        </li>
      ))}
    </ul>
  );
}
