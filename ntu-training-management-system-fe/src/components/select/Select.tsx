import type { SelectProps, SelectSize } from './types';

const sizeClasses: Record<SelectSize, string> = {
  sm: 'h-9 px-3 text-sm',
  md: 'h-10 px-3.5 text-sm',
  lg: 'h-12 px-4 text-base',
};

export const Select = ({
  id,
  label,
  helperText,
  error,
  placeholder,
  selectSize = 'md',
  options,
  className = '',
  containerClassName = '',
  disabled,
  ...props
}: SelectProps) => {
  const selectId = id ?? props.name;

  return (
    <div className={`w-full space-y-1.5 ${containerClassName}`}>
      {label && (
        <label htmlFor={selectId} className="block text-sm font-medium text-gray-700">
          {label}
        </label>
      )}

      <select
        id={selectId}
        disabled={disabled}
        aria-invalid={Boolean(error)}
        aria-describedby={error || helperText ? `${selectId}-message` : undefined}
        className={`block w-full rounded-lg border bg-white text-gray-900 shadow-sm outline-none transition-colors focus:ring-2 focus:ring-offset-0 disabled:cursor-not-allowed disabled:bg-gray-100 disabled:text-gray-500 ${sizeClasses[selectSize]} ${error ? 'border-rose-500 focus:border-rose-500 focus:ring-rose-500' : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500'} ${className}`}
        {...props}
      >
        {placeholder && <option value="">{placeholder}</option>}
        {options.map((option) => (
          <option key={option.value} value={option.value} disabled={option.disabled}>
            {option.label}
          </option>
        ))}
      </select>

      {(error || helperText) && (
        <p
          id={`${selectId}-message`}
          className={`text-sm ${error ? 'text-rose-600' : 'text-gray-500'}`}
        >
          {error ?? helperText}
        </p>
      )}
    </div>
  );
};
