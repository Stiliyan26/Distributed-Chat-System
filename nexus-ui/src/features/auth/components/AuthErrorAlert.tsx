export function AuthErrorAlert({ message }: { message: string }) {
  if (!message) {
    return null;
  }

  return (
    <div className="bg-red-900/20 border border-red-500/20 rounded-md px-3 py-2 text-red-400 text-xs">
      {message}
    </div>
  );
}
