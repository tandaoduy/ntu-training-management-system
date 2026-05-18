import type { ChangeEventHandler, FormEventHandler } from 'react';
import type { DatePickerProps, DatePickerSize } from './types';
import { sanitizeDateInputValue } from '@/utils/dateInput';

const sizeClasses: Record<DatePickerSize, string> = {
  sm: 'h-9 px-3 text-sm',
  md: 'h-10 px-3.5 text-sm',
  lg: 'h-12 px-4 text-base',
};

export const DatePicker = ({
  id,
  label,
  helperText,
  error,
  inputSize = 'md',
  className = '',
  containerClassName = '',
  disabled,
  ...props
}: DatePickerProps) => {
  const inputId = id ?? props.name;
  const limitDateYear = (input: HTMLInputElement) => {
    const sanitizedValue = sanitizeDateInputValue(input.value);

    if (sanitizedValue !== input.value) {
      input.value = sanitizedValue;
    }
  };

  const handleInput: FormEventHandler<HTMLInputElement> = (event) => {
    limitDateYear(event.currentTarget);
    props.onInput?.(event as never);
  };

  const handleChange: ChangeEventHandler<HTMLInputElement> = (event) => {
    const sanitizedValue = sanitizeDateInputValue(event.currentTarget.value);

    if (sanitizedValue !== event.currentTarget.value) {
      event.currentTarget.value = sanitizedValue;
    }

    props.onChange?.(event);
  };

  return (
    <div className={`w-full space-y-1.5 ${containerClassName}`}>
      {label && (
        <label htmlFor={inputId} className="block text-sm font-medium text-gray-700">
          {label}
        </label>
      )}

      <input
        id={inputId}
        type="date"
        disabled={disabled}
        aria-invalid={Boolean(error)}
        aria-describedby={error || helperText ? `${inputId}-message` : undefined}
        className={`block w-full rounded-lg border bg-white text-gray-900 shadow-sm outline-none transition-colors focus:ring-2 focus:ring-offset-0 disabled:cursor-not-allowed disabled:bg-gray-100 disabled:text-gray-500 ${sizeClasses[inputSize]} ${error ? 'border-rose-500 focus:border-rose-500 focus:ring-rose-500' : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500'} ${className}`}
        {...props}
        max={props.max ?? '9999-12-31'}
        onChange={handleChange}
        onInput={handleInput}
      />

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
