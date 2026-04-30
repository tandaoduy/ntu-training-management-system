import type { ToggleProps, ToggleSize } from './types';

const trackSizeClasses: Record<ToggleSize, string> = {
  sm: 'h-5 w-9',
  md: 'h-6 w-11',
  lg: 'h-7 w-14',
};

const thumbSizeClasses: Record<ToggleSize, string> = {
  sm: 'h-4 w-4 translate-x-0.5 peer-checked:translate-x-4',
  md: 'h-5 w-5 translate-x-0.5 peer-checked:translate-x-5',
  lg: 'h-6 w-6 translate-x-0.5 peer-checked:translate-x-7',
};

export const Toggle = ({
  label,
  description,
  toggleSize = 'md',
  className = '',
  disabled,
  ...props
}: ToggleProps) => {
  return (
    <label className={`inline-flex items-start gap-3 ${disabled ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'} ${className}`}>
      <span className="relative inline-flex shrink-0">
        <input type="checkbox" disabled={disabled} className="peer sr-only" {...props} />
        <span className={`${trackSizeClasses[toggleSize]} rounded-full bg-gray-200 transition-colors peer-checked:bg-blue-600 peer-focus:ring-2 peer-focus:ring-blue-500 peer-focus:ring-offset-2`} />
        <span className={`absolute left-0 top-0.5 rounded-full bg-white shadow transition-transform ${thumbSizeClasses[toggleSize]}`} />
      </span>
      {(label || description) && (
        <span className="space-y-0.5">
          {label && <span className="block text-sm font-medium text-gray-900">{label}</span>}
          {description && <span className="block text-sm text-gray-500">{description}</span>}
        </span>
      )}
    </label>
  );
};
