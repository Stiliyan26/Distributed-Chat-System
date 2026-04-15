import type { Channel } from "@/types";
import { Hash, Info, Pin, Star, Users } from "lucide-react";
import { CHAT_TITLES } from "../constants/chat";

type ChatHeaderProps = {
  channel: Channel;
  showDetails: boolean;
  onToggleDetails: () => void;
};

export function ChatHeader({ channel, showDetails, onToggleDetails }: ChatHeaderProps) {
  return (
    <header className="flex items-center gap-3 px-4 py-3 border-b border-slate-200 dark:border-outline-var/10 flex-shrink-0">
      <Hash size={18} className="text-outline-var flex-shrink-0" />
      <h2 className="font-semibold text-slate-900 dark:text-white">{channel.channelName}</h2>
      <div className="flex items-center gap-1 text-xs text-emerald-500 dark:text-emerald-400 ml-1">
        <Users size={12} />
        <span>online</span>
      </div>
      <div className="ml-auto flex items-center gap-2 text-outline-var">
        <button
          className="rounded p-1.5 transition-colors hover:text-slate-900 dark:hover:text-white"
          title={CHAT_TITLES.star}
        >
          <Star size={16} />
        </button>
        <button
          className="rounded p-1.5 transition-colors hover:text-slate-900 dark:hover:text-white"
          title={CHAT_TITLES.pinned}
        >
          <Pin size={16} />
        </button>
        <button
          className={`rounded p-1.5 transition-colors ${
            showDetails ? "text-primary" : "hover:text-slate-900 dark:hover:text-white"
          }`}
          title={CHAT_TITLES.details}
          onClick={onToggleDetails}
        >
          <Info size={16} />
        </button>
      </div>
    </header>
  );
}
