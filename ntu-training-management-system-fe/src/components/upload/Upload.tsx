import { ArrowUpTrayIcon } from '@heroicons/react/24/outline';
import type { UploadProps } from './types';

export const Upload = ({
  id,
  label,
  helperText,
  error,
  browseText = 'Chọn tệp',
  className = '',
  containerClassName = '',
  disabled,
  ...props
}: UploadProps) => {
  const inputId = id ?? props.name;

  return (
    <div className={`w-full space-y-1.5 ${containerClassName}`}>
      {label && <p className="block text-sm font-medium text-gray-700">{label}</p>}

      <label
        htmlFor={inputId}
        className={`flex min-h-36 cursor-pointer flex-col items-center justify-center rounded-lg border border-dashed bg-white px-6 py-8 text-center transition-colors ${error ? 'border-rose-400 bg-rose-50' : 'border-gray-300 hover:border-blue-400 hover:bg-blue-50/40'} ${disabled ? 'cursor-not-allowed opacity-60' : ''} ${className}`}
      >
        <ArrowUpTrayIcon className="mb-3 h-8 w-8 text-gray-400" />
        <span className="text-sm font-medium text-gray-900">{browseText}</span>
        <span className="mt-1 text-sm text-gray-500">hoặc kéo thả vào đây</span>
        {props.accept && <span className="mt-2 text-xs text-gray-400">Định dạng hỗ trợ: {props.accept}</span>}
      </label>

      <input
        id={inputId}
        type="file"
        disabled={disabled}
        aria-invalid={Boolean(error)}
        className="sr-only"
        {...props}
      />

      {(error || helperText) && (
        <p className={`text-sm ${error ? 'text-rose-600' : 'text-gray-500'}`}>
          {error ?? helperText}
        </p>
      )}
    </div>
  );
};
