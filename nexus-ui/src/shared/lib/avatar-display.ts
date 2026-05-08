const AVATAR_BACKGROUND_CLASSES = [
  'bg-indigo-500',
  'bg-purple-500',
  'bg-violet-600',
  'bg-blue-500',
  'bg-teal-600',
  'bg-rose-500',
  'bg-amber-500',
];

/** Deterministic Tailwind background class from a display name. */
export function getAvatarBackgroundClass(displayName: string): string {
  let hash = 0;

  for (let i = 0; i < displayName.length; i++) {
    hash = displayName.charCodeAt(i) + ((hash << 5) - hash);
  }

  return AVATAR_BACKGROUND_CLASSES[Math.abs(hash) % AVATAR_BACKGROUND_CLASSES.length];
}

export function getInitialsFromDisplayName(displayName: string): string {
  return displayName
    .split(/[\s_-]/)
    .map((segment) => segment[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase();
}
