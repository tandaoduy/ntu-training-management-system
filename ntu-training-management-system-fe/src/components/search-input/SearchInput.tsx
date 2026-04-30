import { MagnifyingGlassIcon, XMarkIcon } from '@heroicons/react/24/outline';
import type { SearchInputProps } from './types';

export const SearchInput = ({
  value,
  defaultValue,
  onClear,
  className = '',
  containerClassName = '',
  placeholder = 'Search',
  disabled,
  ...props
}: SearchInputProps) => {
  const currentValue = value ?? defaultValue ?? '';
  const hasValue = String(currentValue).length > 0;

  return (
    <div className={`relative w-full ${containerClassName}`}>
      <MagnifyingGlassIcon className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
      <input
        type="search"
        value={value}
        defaultValue={defaultValue}
        placeholder={placeholder}
        disabled={disabled}
        className={`h-10 w-full rounded-lg border border-gray-300 bg-white pl-10 pr-10 text-sm text-gray-900 shadow-sm outline-none transition-colors placeholder:text-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 disabled:cursor-not-allowed disabled:bg-gray-100 disabled:text-gray-500 ${className}`}
        {...props}
      />
      {hasValue && onClear && !disabled && (
        <button
          type="button"
          onClick={onClear}
          className="absolute right-2 top-1/2 inline-flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-md text-gray-400 hover:bg-gray-100 hover:text-gray-700"
          aria-label="Clear search"
        >
          <XMarkIcon className="h-4 w-4" />
        </button>
      )}
    </div>
  );
};
