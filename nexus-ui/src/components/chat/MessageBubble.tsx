import { Avatar } from '@/components/ui/Avatar';
import { formatTime, isCodeBlock, parseCodeBlock } from '@/lib/utils';
import type { Message } from '@/types';

interface MessageBubbleProps {
  message: Message;
  isOwn: boolean;
  showHeader: boolean;
}

export function MessageBubble({ message, isOwn, showHeader }: MessageBubbleProps) {
  const isCode = isCodeBlock(message.content);
  const { lang, code } = isCode ? parseCodeBlock(message.content) : { lang: '', code: '' };

  return (
    <div className={`flex gap-3 px-4 py-0.5 group animate-fade-in ${isOwn ? 'flex-row-reverse' : ''}`}>
      {showHeader && (
        <div className="flex-shrink-0 mt-0.5">
          <Avatar name={message.senderUsername} size="md" />
        </div>
      )}
      {!showHeader && <div className="w-8 flex-shrink-0" />}

      <div className={`max-w-[70%] flex flex-col ${isOwn ? 'items-end' : 'items-start'}`}>
        {showHeader && (
          <div className={`flex items-baseline gap-2 mb-1 ${isOwn ? 'flex-row-reverse' : ''}`}>
            <span className="text-sm font-semibold text-slate-900 dark:text-white">{message.senderUsername}</span>
            <span className="label-sm">{formatTime(message.sentAt)}</span>
          </div>
        )}

        {isCode ? (
          <div className="code-block min-w-[280px]">
            <div className="flex items-center justify-between mb-2 pb-2 border-b border-outline-var/20">
              <span className="label-sm text-indigo-400">{lang.toUpperCase()}</span>
              <button
                onClick={() => navigator.clipboard.writeText(code)}
                className="text-[10px] uppercase tracking-wide text-outline-var transition-colors hover:text-slate-900 dark:hover:text-white"
              >
                Copy
              </button>
            </div>
            <pre className="whitespace-pre-wrap break-words">{code}</pre>
          </div>
        ) : isOwn ? (
          <div className="bg-indigo-500/25 dark:bg-indigo-600/30 border border-indigo-500/35 text-slate-900 dark:text-white text-sm rounded-xl rounded-tr-sm px-4 py-2.5 leading-relaxed shadow-sm">
            {message.content}
          </div>
        ) : (
          <div className="bg-slate-200/90 dark:bg-slate-800/70 border border-slate-300/90 dark:border-slate-600/35 text-slate-900 dark:text-white/90 text-sm rounded-xl rounded-tl-sm px-4 py-2.5 leading-relaxed shadow-sm">
            {message.content}
          </div>
        )}

        {!showHeader && (
          <span className="label-sm opacity-0 group-hover:opacity-100 transition-opacity mt-0.5">
            {formatTime(message.sentAt)}
          </span>
        )}
      </div>
    </div>
  );
}
