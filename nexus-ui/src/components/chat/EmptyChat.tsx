import { MessageSquare } from 'lucide-react';

interface EmptyChatProps {
  channelName?: string;
  onSendFirst?: () => void;
}

export function EmptyChat({ onSendFirst }: EmptyChatProps) {
  return (
    <div className="flex-1 flex flex-col items-center justify-center text-center px-8 animate-fade-in">
      <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-200 dark:bg-surface-high">
        <MessageSquare size={28} className="text-slate-500 dark:text-outline-var" />
      </div>
      <h3 className="mb-2 text-xl font-semibold text-slate-900 dark:text-white">Silence is absolute</h3>
      <p className="max-w-xs text-sm leading-relaxed text-slate-500 dark:text-white/40">
        This channel has no active data streams. Be the first to broadcast a message to the network.
      </p>
      {onSendFirst && (
        <button onClick={onSendFirst} className="btn-primary mt-6 px-6">
          Say something!
        </button>
      )}
    </div>
  );
}

export function NoChannelSelected() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center px-8 text-center">
      <div className="mb-5 flex h-20 w-20 items-center justify-center rounded-2xl bg-slate-200 dark:bg-surface-high">
        <MessageSquare size={32} className="text-indigo-500/80 dark:text-indigo-400/60" />
      </div>
      <h3 className="mb-2 text-xl font-semibold text-slate-900 dark:text-white">Network Isolated</h3>
      <p className="max-w-xs text-sm leading-relaxed text-slate-500 dark:text-white/40">
        No communication nodes found in this cluster. Select a channel or establish a new one to begin distributed processing.
      </p>
    </div>
  );
}
