import type { TextareaProps, TextareaSize } from './types';

const sizeClasses: Record<TextareaSize, string> = {
  sm: 'min-h-20 px-3 py-2 text-sm',
  md: 'min-h-28 px-3.5 py-2.5 text-sm',
  lg: 'min-h-36 px-4 py-3 text-base',
};

export const Textarea = ({
  id,
  label,
  helperText,
  error,
  textareaSize = 'md',
  showCount = false,
  maxLength,
  value,
  defaultValue,
  className = '',
  containerClassName = '',
  disabled,
  ...props
}: TextareaProps) => {
  const textareaId = id ?? props.name;
  const currentValue = value ?? defaultValue ?? '';
  const count = typeof currentValue === 'string' ? currentValue.length : 0;

  return (
    <div className={`w-full space-y-1.5 ${containerClassName}`}>
      {label && (
        <label htmlFor={textareaId} className="block text-sm font-medium text-gray-700">
          {label}
        </label>
      )}

      <textarea
        id={textareaId}
        disabled={disabled}
        maxLength={maxLength}
        value={value}
        defaultValue={defaultValue}
        aria-invalid={Boolean(error)}
        aria-describedby={error || helperText ? `${textareaId}-message` : undefined}
        className={`block w-full resize-y rounded-lg border bg-white text-gray-900 shadow-sm outline-none transition-colors placeholder:text-gray-400 focus:ring-2 focus:ring-offset-0 disabled:cursor-not-allowed disabled:bg-gray-100 disabled:text-gray-500 ${sizeClasses[textareaSize]} ${error ? 'border-rose-500 focus:border-rose-500 focus:ring-rose-500' : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500'} ${className}`}
        {...props}
      />

      <div className="flex items-start justify-between gap-3">
        {(error || helperText) && (
          <p
            id={`${textareaId}-message`}
            className={`text-sm ${error ? 'text-rose-600' : 'text-gray-500'}`}
          >
            {error ?? helperText}
          </p>
        )}
        {showCount && maxLength && (
          <p className="ml-auto text-sm text-gray-400">
            {count}/{maxLength}
          </p>
        )}
      </div>
    </div>
  );
};
