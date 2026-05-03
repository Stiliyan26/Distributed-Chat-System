interface CreateChannelFormActionsProps {
  onRequestClose: () => void;
  isSubmitDisabled: boolean;
  isSubmitPending: boolean;
}

export function CreateChannelFormActions({
  onRequestClose,
  isSubmitDisabled,
  isSubmitPending,
}: CreateChannelFormActionsProps) {
  return (
    <div className="flex justify-end gap-3 pt-2">
      <button type="button" onClick={onRequestClose} className="btn-secondary px-4">
        Cancel
      </button>

      <button
        type="submit"
        disabled={isSubmitDisabled}
        aria-busy={isSubmitPending}
        className="btn-primary flex items-center gap-2"
      >
        {isSubmitPending ? (
          <span
            className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/30 border-t-white"
            aria-hidden
          />
        ) : (
          "Create"
        )}
      </button>
    </div>
  );
}
