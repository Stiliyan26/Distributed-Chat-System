interface AuthErrorAlertProps {
  message: string;
  /** For `aria-describedby` on fields that trigger this alert. */
  id?: string;
}

export function AuthErrorAlert({ message, id }: AuthErrorAlertProps) {
  if (!message) {
    return null;
  }

  return (
    <div
      id={id}
      role="alert"
      className="rounded-md border border-red-500/20 bg-red-900/20 px-3 py-2 text-xs text-red-400"
    >
      {message}
    </div>
  );
}
