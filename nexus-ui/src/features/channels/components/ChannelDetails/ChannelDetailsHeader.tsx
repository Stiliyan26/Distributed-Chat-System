import { X } from "lucide-react";

interface ChannelDetailsHeaderProps {
  onClose: () => void;
}

export function ChannelDetailsHeader({ onClose }: ChannelDetailsHeaderProps) {
  return (
    <div className="flex items-center justify-between px-4 py-3.5 border-b border-slate-200 dark:border-outline-var/10">
      <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Channel Details</h3>
      <button
        type="button"
        onClick={onClose}
        className="text-outline-var hover:text-slate-900 dark:hover:text-white transition-colors"
      >
        <X size={16} />
      </button>
    </div>
  );
}
