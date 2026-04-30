import type { BadgeProps, BadgeSize, BadgeVariant } from './types';

const variantClasses: Record<BadgeVariant, string> = {
  default: 'bg-blue-50 text-blue-700 ring-blue-600/20',
  success: 'bg-green-50 text-green-700 ring-green-600/20',
  warning: 'bg-yellow-50 text-yellow-800 ring-yellow-600/20',
  danger: 'bg-red-50 text-red-700 ring-red-600/20',
  info: 'bg-cyan-50 text-cyan-700 ring-cyan-600/20',
  neutral: 'bg-gray-100 text-gray-700 ring-gray-600/20',
};

const dotClasses: Record<BadgeVariant, string> = {
  default: 'bg-blue-500',
  success: 'bg-green-500',
  warning: 'bg-yellow-500',
  danger: 'bg-red-500',
  info: 'bg-cyan-500',
  neutral: 'bg-gray-500',
};

const sizeClasses: Record<BadgeSize, string> = {
  sm: 'gap-1 px-2 py-0.5 text-xs',
  md: 'gap-1.5 px-2.5 py-1 text-sm',
  lg: 'gap-2 px-3 py-1.5 text-base',
};

const dotSizeClasses: Record<BadgeSize, string> = {
  sm: 'h-1.5 w-1.5',
  md: 'h-2 w-2',
  lg: 'h-2.5 w-2.5',
};

export const Badge = ({
  children,
  variant = 'default',
  size = 'md',
  icon,
  dot = false,
  pill = true,
  className = '',
}: BadgeProps) => {
  return (
    <span
      className={`inline-flex w-fit items-center font-medium ring-1 ring-inset ${pill ? 'rounded-full' : 'rounded-md'} ${variantClasses[variant]} ${sizeClasses[size]} ${className}`}
    >
      {dot && (
        <span
          className={`shrink-0 rounded-full ${dotClasses[variant]} ${dotSizeClasses[size]}`}
          aria-hidden="true"
        />
      )}
      {icon && <span className="inline-flex shrink-0 items-center">{icon}</span>}
      {children}
    </span>
  );
};
