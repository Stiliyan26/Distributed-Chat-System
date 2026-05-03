interface CreateChannelModalBackdropProps {
  onRequestClose: () => void;
}

export function CreateChannelModalBackdrop({
  onRequestClose,
}: CreateChannelModalBackdropProps) {
  return (
    <div
      className="absolute inset-0 bg-black/40 backdrop-blur-sm dark:bg-black/60"
      onClick={onRequestClose}
      aria-hidden
    />
  );
}
