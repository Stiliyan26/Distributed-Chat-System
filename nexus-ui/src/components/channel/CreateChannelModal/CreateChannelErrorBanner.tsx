interface CreateChannelErrorBannerProps {
  message: string;
}

export function CreateChannelErrorBanner({ message }: CreateChannelErrorBannerProps) {
  if (!message) {
    return null;
  }

  return (
    <div
      role="alert"
      className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-800 dark:border-red-500/20 dark:bg-red-900/20 dark:text-red-300"
    >
      {message}
    </div>
  );
}
