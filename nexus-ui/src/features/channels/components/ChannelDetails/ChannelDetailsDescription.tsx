import { Calendar } from "lucide-react";

import type { Channel } from "@/types";

interface ChannelDetailsDescriptionProps {
  channel: Channel;
}

export function ChannelDetailsDescription({ channel }: ChannelDetailsDescriptionProps) {
  return (
    <div className="p-4 border-b border-slate-200 dark:border-outline-var/10">
      <p className="label-sm mb-2">Description</p>
      <p className="text-sm text-slate-600 dark:text-white/60 leading-relaxed">
        {channel.description ?? "No description set for this channel."}
      </p>
      {channel.createdAt && (
        <div className="flex items-center gap-1.5 mt-3 text-outline-var/80 text-xs">
          <Calendar size={11} />
          <span className="label-sm">
            Created{" "}
            {new Date(channel.createdAt).toLocaleDateString("en-US", {
              month: "long",
              year: "numeric",
            })}
          </span>
        </div>
      )}
    </div>
  );
}
