import { UserIcon } from '@heroicons/react/24/solid';
import type { AvatarProps, AvatarSize, AvatarStatus } from './types';

const sizeClasses: Record<AvatarSize, string> = {
  xs: 'h-6 w-6 text-xs',
  sm: 'h-8 w-8 text-sm',
  md: 'h-10 w-10 text-base',
  lg: 'h-12 w-12 text-lg',
  xl: 'h-16 w-16 text-xl',
};

const iconSizeClasses: Record<AvatarSize, string> = {
  xs: 'h-3.5 w-3.5',
  sm: 'h-4 w-4',
  md: 'h-5 w-5',
  lg: 'h-6 w-6',
  xl: 'h-8 w-8',
};

const statusClasses: Record<AvatarStatus, string> = {
  online: 'bg-emerald-500',
  offline: 'bg-gray-400',
  busy: 'bg-rose-500',
  away: 'bg-amber-500',
};

const getInitials = (name?: string) => {
  if (!name) {
    return '';
  }

  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('');
};

export const Avatar = ({
  src,
  name,
  icon,
  size = 'md',
  status,
  className = '',
  alt,
  ...props
}: AvatarProps) => {
  const initials = getInitials(name);

  return (
    <span className={`relative inline-flex shrink-0 ${className}`}>
      <span
        className={`inline-flex items-center justify-center overflow-hidden rounded-full bg-gray-100 font-semibold text-gray-700 ring-1 ring-gray-200 ${sizeClasses[size]}`}
      >
        {src ? (
          <img src={src} alt={alt ?? name ?? 'Avatar'} className="h-full w-full object-cover" {...props} />
        ) : initials ? (
          initials
        ) : (
          icon ?? <UserIcon className={iconSizeClasses[size]} />
        )}
      </span>

      {status && (
        <span
          className={`absolute bottom-0 right-0 block h-2.5 w-2.5 rounded-full ring-2 ring-white ${statusClasses[status]}`}
          aria-label={status}
        />
      )}
    </span>
  );
};
