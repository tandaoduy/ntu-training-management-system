import type { InputProps, InputSize, InputState } from './types';

const sizeClasses: Record<InputSize, string> = {
  sm: 'h-9 px-3 text-sm',
  md: 'h-10 px-3.5 text-sm',
  lg: 'h-12 px-4 text-base',
};

const stateClasses: Record<InputState, string> = {
  default: 'border-gray-300 focus:border-blue-500 focus:ring-blue-500',
  success: 'border-emerald-500 focus:border-emerald-500 focus:ring-emerald-500',
  error: 'border-rose-500 focus:border-rose-500 focus:ring-rose-500',
};

export const Input = ({
  id,
  label,
  helperText,
  error,
  inputSize = 'md',
  state = 'default',
  leftIcon,
  rightIcon,
  className = '',
  containerClassName = '',
  disabled,
  ...props
}: InputProps) => {
  const inputId = id ?? props.name;
  const visualState = error ? 'error' : state;

  return (
    <div className={`w-full space-y-1.5 ${containerClassName}`}>
      {label && (
        <label htmlFor={inputId} className="block text-sm font-medium text-gray-700">
          {label}
        </label>
      )}

      <div className="relative">
        {leftIcon && (
          <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400">
            {leftIcon}
          </span>
        )}

        <input
          id={inputId}
          disabled={disabled}
          aria-invalid={Boolean(error)}
          aria-describedby={error || helperText ? `${inputId}-message` : undefined}
          className={`block w-full rounded-lg border bg-white text-gray-900 shadow-sm outline-none transition-colors placeholder:text-gray-400 focus:ring-2 focus:ring-offset-0 disabled:cursor-not-allowed disabled:bg-gray-100 disabled:text-gray-500 ${sizeClasses[inputSize]} ${stateClasses[visualState]} ${leftIcon ? 'pl-10' : ''} ${rightIcon ? 'pr-10' : ''} ${className}`}
          {...props}
        />

        {rightIcon && (
          <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400">
            {rightIcon}
          </span>
        )}
      </div>

      {(error || helperText) && (
        <p
          id={`${inputId}-message`}
          className={`text-sm ${error ? 'text-rose-600' : 'text-gray-500'}`}
        >
          {error ?? helperText}
        </p>
      )}
    </div>
  );
};
