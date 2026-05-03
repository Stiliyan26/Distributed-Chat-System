interface ChannelDetailsIdSectionProps {
  channelId: string;
}

export function ChannelDetailsIdSection({ channelId }: ChannelDetailsIdSectionProps) {
  return (
    <div className="p-4">
      <p className="label-sm mb-2">Channel ID</p>
      <p className="font-mono text-[10px] text-outline-var/60 break-all">{channelId}</p>
    </div>
  );
}
