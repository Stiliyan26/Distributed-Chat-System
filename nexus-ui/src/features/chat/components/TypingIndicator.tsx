interface TypingIndicatorProps {
  username: string;
}

export function TypingIndicator({ username }: TypingIndicatorProps) {
  return (
    <div className="flex items-center gap-2 px-4 py-2 text-xs text-slate-500 dark:text-outline-var">
      <div className="flex gap-0.5">
        <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse-dot" style={{ animationDelay: '0ms' }} />
        <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse-dot" style={{ animationDelay: '200ms' }} />
        <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse-dot" style={{ animationDelay: '400ms' }} />
      </div>
      <span className="uppercase tracking-wide text-[10px]">{username} is typing</span>
    </div>
  );
}
