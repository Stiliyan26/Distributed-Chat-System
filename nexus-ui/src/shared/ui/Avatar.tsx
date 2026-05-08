import { getAvatarBackgroundClass, getInitialsFromDisplayName } from '@/shared/lib/avatar-display';
import { cn } from '@/shared/lib/cn';

interface AvatarProps {
  name: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const sizeMap = { sm: 'w-7 h-7 text-xs', md: 'w-8 h-8 text-sm', lg: 'w-10 h-10 text-base' };

export function Avatar({ name, size = 'md', className }: AvatarProps) {
  return (
    <div
      className={cn(
        'avatar',
        sizeMap[size],
        getAvatarBackgroundClass(name),
        className,
      )}
    >
      {getInitialsFromDisplayName(name)}
    </div>
  );
}
