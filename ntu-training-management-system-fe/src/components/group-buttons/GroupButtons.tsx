import { useState } from 'react';
import type { GroupButtonsProps, GroupButtonSize } from './types';

const sizeClasses: Record<GroupButtonSize, string> = {
  sm: 'px-3 py-1.5 text-xs',
  md: 'px-4 py-2 text-sm',
  lg: 'px-5 py-2.5 text-base',
};

export const GroupButtons = ({
  options,
  value,
  defaultValue,
  onChange,
  size = 'md',
  fullWidth = false,
  className = '',
}: GroupButtonsProps) => {
  const [internalValue, setInternalValue] = useState(defaultValue ?? options[0]?.value ?? '');
  const selectedValue = value ?? internalValue;

  const handleChange = (nextValue: string) => {
    if (value === undefined) {
      setInternalValue(nextValue);
    }

    onChange?.(nextValue);
  };

  return (
    <div className={`inline-flex rounded-lg border border-gray-200 bg-gray-100 p-1 ${fullWidth ? 'w-full' : ''} ${className}`}>
      {options.map((option) => {
        const selected = selectedValue === option.value;

        return (
          <button
            key={option.value}
            type="button"
            disabled={option.disabled}
            onClick={() => handleChange(option.value)}
            className={`${fullWidth ? 'flex-1' : ''} rounded-md font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${sizeClasses[size]} ${selected ? 'bg-white text-blue-700 shadow-sm' : 'text-gray-600 hover:text-gray-900'}`}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
};
