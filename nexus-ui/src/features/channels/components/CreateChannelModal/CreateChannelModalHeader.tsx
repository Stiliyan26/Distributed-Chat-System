import { X } from "lucide-react";

interface CreateChannelModalHeaderProps {
  titleId: string;
  onRequestClose: () => void;
}

export function CreateChannelModalHeader({
  titleId,
  onRequestClose,
}: CreateChannelModalHeaderProps) {
  return (
    <div className="flex items-start justify-between border-b border-slate-100 px-6 py-5 dark:border-outline-var/10">
      <div>
        <h2
          id={titleId}
          className="text-lg font-semibold text-slate-900 dark:text-white"
        >
          Create Channel
        </h2>

        <p className="mt-0.5 text-[11px] font-medium uppercase tracking-[0.05em] text-slate-500 dark:text-outline-var">
          Distributed Node Provisioning
        </p>
      </div>

      <button
        type="button"
        onClick={onRequestClose}
        aria-label="Close"
        className="mt-0.5 rounded-md text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900 dark:text-outline-var dark:hover:bg-surface-mid dark:hover:text-white"
      >
        <X size={18} aria-hidden />
      </button>
    </div>
  );
}
