import type { SpinnerProps, SpinnerSize, SpinnerVariant } from './types';

const sizeClasses: Record<SpinnerSize, string> = {
  sm: 'h-4 w-4 border-2',
  md: 'h-6 w-6 border-2',
  lg: 'h-8 w-8 border-2',
  xl: 'h-12 w-12 border-4',
};

const variantClasses: Record<SpinnerVariant, string> = {
  primary: 'border-blue-200 border-t-blue-600',
  secondary: 'border-gray-200 border-t-gray-700',
  white: 'border-white/40 border-t-white',
  success: 'border-green-200 border-t-green-600',
  danger: 'border-red-200 border-t-red-600',
};

export const Spinner = ({
  size = 'md',
  variant = 'primary',
  label = 'Loading',
  className = '',
}: SpinnerProps) => {
  return (
    <span
      className={`inline-flex items-center justify-center ${className}`}
      role="status"
      aria-label={label}
    >
      <span
        className={`inline-block animate-spin rounded-full border-solid ${sizeClasses[size]} ${variantClasses[variant]}`}
      />
      <span className="sr-only">{label}</span>
    </span>
  );
};
