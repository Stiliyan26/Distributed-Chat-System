import { useCallback, useRef, useState } from "react";

import { AtSign, Plus, Send, Smile, Terminal } from "lucide-react";

interface MessageInputProps {
  channelName: string;
  onSend: (content: string) => void;
  disabled?: boolean;
}

export function MessageInput({ channelName, onSend, disabled }: MessageInputProps) {
  const [text, setText] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSend = useCallback(() => {
    const trimmed = text.trim();

    if (!trimmed || disabled) {
      return;
    }

    onSend(trimmed);
    setText("");

    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }
  }, [text, onSend, disabled]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setText(e.target.value);
    const target = e.target;
    target.style.height = "auto";
    target.style.height = `${Math.min(target.scrollHeight, 160)}px`;
  };

  return (
    <div className="px-4 pb-4 pt-2 flex-shrink-0">
      <div className="bg-slate-200/90 dark:bg-surface-mid rounded-xl border border-slate-300 dark:border-outline-var/20 focus-within:border-indigo-500/40 transition-colors">
        <textarea
          ref={textareaRef}
          rows={1}
          value={text}
          onChange={handleInput}
          onKeyDown={handleKeyDown}
          disabled={disabled}
          placeholder={`Message #${channelName}...`}
          className="w-full bg-transparent text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-outline-var px-4 pt-3 pb-2 resize-none outline-none min-h-[44px] max-h-40"
        />

        <div className="flex items-center justify-between px-3 pb-2.5">
          <div className="flex items-center gap-1 text-outline-var">
            <button
              className="p-1.5 hover:text-slate-900 dark:hover:text-white rounded transition-colors"
              title="Attach"
            >
              <Plus size={16} />
            </button>
            <button
              className="p-1.5 hover:text-slate-900 dark:hover:text-white rounded transition-colors"
              title="Mention"
            >
              <AtSign size={16} />
            </button>
            <button
              className="p-1.5 hover:text-slate-900 dark:hover:text-white rounded transition-colors"
              title="Emoji"
            >
              <Smile size={16} />
            </button>
            <button
              onClick={() => setText((t) => (t ? t + "\n```bash\n\n```" : "```bash\n\n```"))}
              className="p-1.5 hover:text-slate-900 dark:hover:text-white rounded transition-colors"
              title="Code block"
            >
              <Terminal size={16} />
            </button>
          </div>
          <button
            onClick={handleSend}
            disabled={!text.trim() || disabled}
            className="w-8 h-8 rounded-md bg-brand-gradient flex items-center justify-center transition-all hover:opacity-90 active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <Send size={14} className="text-white" />
          </button>
        </div>
      </div>
    </div>
  );
}
