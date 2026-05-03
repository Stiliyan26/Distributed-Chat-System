import { Avatar } from "@/components/ui/Avatar";
import type { UserSearchResult } from "@/types";

interface MemberSearchHitListProps {
  hits: UserSearchResult[];
  onSelectMember: (member: UserSearchResult) => void;
}

export function MemberSearchHitList({ hits, onSelectMember }: MemberSearchHitListProps) {
  if (hits.length === 0) {
    return null;
  }

  return (
    <ul className="mt-1 max-h-[min(50vh,280px)] overflow-y-auto overscroll-y-contain rounded-md border border-slate-200 bg-slate-50 dark:border-outline-var/20 dark:bg-surface">
      {hits.map((hit) => (
        <li key={hit.id}>
          <button
            type="button"
            onClick={() => onSelectMember(hit)}
            className="flex w-full items-center gap-3 px-3 py-2.5 text-left transition-colors hover:bg-white dark:hover:bg-surface-mid"
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
