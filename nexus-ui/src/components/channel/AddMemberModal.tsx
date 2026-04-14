import { useState, useEffect, useRef, useCallback } from 'react';
import { X, Search } from 'lucide-react';
import axios from 'axios';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Avatar } from '@/components/ui/Avatar';
import { addChannelMember } from '@/api/channels';
import { searchUsers } from '@/api/users';
import { useSocket } from '@/context/useSocket';
import type { UserSearchResult } from '@/types';

interface AddMemberModalProps {
  channelId: string;
  existingMemberIds: string[];
  onClose: () => void;
}

function getMutationErrorMessage(err: unknown): string {
  if (axios.isAxiosError(err)) {
    const data = err.response?.data as { message?: string | string[] } | undefined;
    const m = data?.message;
    if (Array.isArray(m)) return m.join(' ');
    if (typeof m === 'string' && m.trim()) return m;
  }
  if (err instanceof Error && err.message) return err.message;
  return 'Could not add member.';
}

export function AddMemberModal({ channelId, existingMemberIds, onClose }: AddMemberModalProps) {
  const qc = useQueryClient();
  const { joinChannels } = useSocket();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<UserSearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const searchTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  const mutation = useMutation({
    mutationFn: (memberId: string) => addChannelMember(channelId, memberId),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ['channel-members', channelId] });
      await qc.invalidateQueries({ queryKey: ['channels'] });
      joinChannels([channelId]);
      onClose();
    },
  });

  const doSearch = useCallback(
    async (q: string) => {
      if (!q.trim()) {
        setResults([]);
        return;
      }
      setSearching(true);
      try {
        const data = await searchUsers(q);
        setResults(
          data.filter((u) => !existingMemberIds.includes(u.id)),
        );
      } finally {
        setSearching(false);
      }
    },
    [existingMemberIds],
  );

  useEffect(() => {
    if (searchTimeout.current) clearTimeout(searchTimeout.current);
    searchTimeout.current = setTimeout(() => doSearch(query), 300);
    return () => {
      if (searchTimeout.current) clearTimeout(searchTimeout.current);
    };
  }, [query, doSearch]);

  const pickUser = (u: UserSearchResult) => {
    mutation.mutate(u.id);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 dark:bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div
        className="relative z-10 flex w-full max-w-md max-h-[min(90vh,560px)] flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-modal animate-fade-in dark:border-outline-var/20 dark:bg-surface-low"
        role="dialog"
        aria-labelledby="add-member-title"
      >
        <div className="flex flex-shrink-0 items-start justify-between border-b border-slate-100 px-6 py-5 dark:border-outline-var/10">
          <div>
            <h2 id="add-member-title" className="text-lg font-semibold text-slate-900 dark:text-white">
              Add member
            </h2>
            <p className="mt-0.5 text-[11px] font-medium uppercase tracking-[0.05em] text-slate-500 dark:text-outline-var">
              Search users by username
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900 dark:text-outline-var dark:hover:bg-surface-mid dark:hover:text-white"
          >
            <X size={18} />
          </button>
        </div>

        <div className="flex flex-col gap-4 px-6 pb-6 pt-4">
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-outline-var" />
            <input
              type="text"
              className="input-field pl-8"
              placeholder="Search username…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              autoFocus
            />
          </div>

          {results.length > 0 && (
            <ul
              className="list-none space-y-0 overflow-y-auto overscroll-y-contain rounded-md border border-slate-200 bg-slate-50 py-0.5 [scrollbar-gutter:stable] dark:border-outline-var/20 dark:bg-surface max-h-[min(50vh,280px)]"
              role="listbox"
              aria-label="Search results"
            >
              {results.map((u) => (
                <li key={u.id} className="border-b border-slate-200/80 last:border-b-0 dark:border-outline-var/10">
                  <button
                    type="button"
                    role="option"
                    onClick={() => pickUser(u)}
                    disabled={mutation.isPending}
                    className="flex w-full items-center gap-3 px-3 py-2.5 text-left transition-colors hover:bg-white disabled:opacity-50 dark:hover:bg-surface-mid"
                  >
                    <Avatar name={u.username} size="sm" />
                    <span className="flex-1 text-sm text-slate-900 dark:text-white">{u.username}</span>
                    <span className="max-w-[120px] truncate font-mono text-[9px] uppercase tracking-wide text-slate-500 dark:text-outline-var/60">
                      {u.email}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}

          {searching && <p className="text-xs text-slate-500 dark:text-outline-var">Searching…</p>}

          {mutation.isError && (
            <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-800 dark:border-red-500/20 dark:bg-red-900/20 dark:text-red-300">
              {getMutationErrorMessage(mutation.error)}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
