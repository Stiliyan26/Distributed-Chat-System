import { useState, useEffect, useRef, useCallback } from 'react';
import { X, Search } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Avatar } from '@/components/ui/Avatar';
import { createChannel } from '@/api/channels';
import { searchUsers } from '@/api/users';
import { useSocket } from "@/context/socket/useSocket";
import type { UserSearchResult } from '@/types';

interface CreateChannelModalProps {
  onClose: () => void;
}

export function CreateChannelModal({ onClose }: CreateChannelModalProps) {
  const qc = useQueryClient();
  const { joinAllChannels } = useSocket();
  const [name, setName] = useState('');
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<UserSearchResult[]>([]);
  const [selected, setSelected] = useState<UserSearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const searchTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  const mutation = useMutation({
    mutationFn: () => createChannel(name.trim(), selected.map((u) => u.id)),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ['channels'] });
      // Re-join all channels so the new one is included in the socket room
      await joinAllChannels();
      onClose();
    },
  });

  const doSearch = useCallback(async (q: string) => {
    if (!q.trim()) { setResults([]); return; }
    setSearching(true);
    try {
      const data = await searchUsers(q);
      setResults(data.filter((u) => !selected.find((s) => s.id === u.id)));
    } finally {
      setSearching(false);
    }
  }, [selected]);

  useEffect(() => {
    if (searchTimeout.current) clearTimeout(searchTimeout.current);
    searchTimeout.current = setTimeout(() => doSearch(query), 300);
    return () => { if (searchTimeout.current) clearTimeout(searchTimeout.current); };
  }, [query, doSearch]);

  const addMember = (user: UserSearchResult) => {
    setSelected((prev) => [...prev, user]);
    setResults((prev) => prev.filter((u) => u.id !== user.id));
    setQuery('');
  };

  const removeMember = (userId: string) => {
    setSelected((prev) => prev.filter((u) => u.id !== userId));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    mutation.mutate();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm dark:bg-black/60" onClick={onClose} />
      <div className="relative z-10 w-full max-w-md rounded-xl border border-slate-200 bg-white shadow-modal animate-fade-in dark:border-outline-var/20 dark:bg-surface-low">
        {/* Header */}
        <div className="flex items-start justify-between border-b border-slate-100 px-6 py-5 dark:border-outline-var/10">
          <div>
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Create Channel</h2>
            <p className="mt-0.5 text-[11px] font-medium uppercase tracking-[0.05em] text-slate-500 dark:text-outline-var">
              Distributed Node Provisioning
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="mt-0.5 rounded-md text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900 dark:text-outline-var dark:hover:bg-surface-mid dark:hover:text-white"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 px-6 pb-6 pt-4">
          {/* Channel name */}
          <div>
            <label className="label-sm block mb-2">Channel Name</label>
            <input
              type="text"
              className="input-field"
              placeholder="e.g. quantum-protocol"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              autoFocus
            />
          </div>

          {/* Member search */}
          <div>
            <label className="label-sm block mb-2">Add Members</label>
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-outline-var" />
              <input
                type="text"
                className="input-field pl-8"
                placeholder="Search by name or node-ID..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </div>

            {/* Selected chips */}
            {selected.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-2">
                {selected.map((u) => (
                  <span
                    key={u.id}
                    className="flex items-center gap-1.5 rounded-md border border-slate-200 bg-slate-100 px-2.5 py-1 text-xs text-slate-800 dark:border-outline-var/30 dark:bg-surface-high dark:text-white"
                  >
                    <Avatar name={u.username} size="sm" className="h-4 w-4 text-[9px]" />
                    {u.username}
                    <button
                      type="button"
                      onClick={() => removeMember(u.id)}
                      className="ml-0.5 text-slate-500 transition-colors hover:text-slate-900 dark:text-outline-var dark:hover:text-white"
                    >
                      <X size={11} />
                    </button>
                  </span>
                ))}
              </div>
            )}

            {/* Search results */}
            {results.length > 0 && (
              <div className="mt-1 max-h-[min(50vh,280px)] overflow-y-auto overscroll-y-contain rounded-md border border-slate-200 bg-slate-50 dark:border-outline-var/20 dark:bg-surface">
                {results.map((u) => (
                  <button
                    key={u.id}
                    type="button"
                    onClick={() => addMember(u)}
                    className="flex w-full items-center gap-3 px-3 py-2.5 text-left transition-colors hover:bg-white dark:hover:bg-surface-mid"
                  >
                    <Avatar name={u.username} size="sm" />
                    <span className="flex-1 text-sm text-slate-900 dark:text-white">{u.username}</span>
                    <span className="max-w-[120px] truncate font-mono text-[9px] uppercase tracking-wide text-slate-500 dark:text-outline-var/60">
                      {u.email}
                    </span>
                  </button>
                ))}
              </div>
            )}
            {searching && (
              <p className="text-xs text-outline-var mt-2">Searching nodes...</p>
            )}
          </div>

          {/* Error */}
          {mutation.isError && (
            <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-800 dark:border-red-500/20 dark:bg-red-900/20 dark:text-red-300">
              Failed to create channel. Try again.
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={onClose} className="btn-secondary px-4">
              Cancel
            </button>
            <button
              type="submit"
              disabled={!name.trim() || mutation.isPending}
              className="btn-primary flex items-center gap-2"
            >
              {mutation.isPending ? (
                <span className="animate-spin border-2 border-white/30 border-t-white rounded-full w-3.5 h-3.5" />
              ) : (
                'Create'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
