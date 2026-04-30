import type { CheckboxProps, CheckboxSize } from './types';

const sizeClasses: Record<CheckboxSize, string> = {
  sm: 'h-4 w-4',
  md: 'h-5 w-5',
  lg: 'h-6 w-6',
};

export const Checkbox = ({
  label,
  description,
  error,
  checkboxSize = 'md',
  className = '',
  disabled,
  ...props
}: CheckboxProps) => {
  return (
    <div className="space-y-1.5">
      <label className={`flex items-start gap-3 ${disabled ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'} ${className}`}>
        <input
          type="checkbox"
          disabled={disabled}
          aria-invalid={Boolean(error)}
          className={`${sizeClasses[checkboxSize]} mt-0.5 shrink-0 rounded border-gray-300 text-blue-600 focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 disabled:cursor-not-allowed`}
          {...props}
        />

        {(label || description) && (
          <span className="space-y-0.5">
            {label && <span className="block text-sm font-medium text-gray-900">{label}</span>}
            {description && <span className="block text-sm text-gray-500">{description}</span>}
          </span>
        )}
      </label>

      {error && <p className="pl-8 text-sm text-rose-600">{error}</p>}
    </div>
  );
};
