import type { RadioGroupProps, RadioProps, RadioSize } from './types';

const sizeClasses: Record<RadioSize, string> = {
  sm: 'h-4 w-4',
  md: 'h-5 w-5',
  lg: 'h-6 w-6',
};

export const Radio = ({
  label,
  description,
  radioSize = 'md',
  className = '',
  disabled,
  ...props
}: RadioProps) => {
  return (
    <label className={`flex items-start gap-3 ${disabled ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'} ${className}`}>
      <input
        type="radio"
        disabled={disabled}
        className={`${sizeClasses[radioSize]} mt-0.5 shrink-0 border-gray-300 text-blue-600 focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 disabled:cursor-not-allowed`}
        {...props}
      />
      <span className="space-y-0.5">
        <span className="block text-sm font-medium text-gray-900">{label}</span>
        {description && <span className="block text-sm text-gray-500">{description}</span>}
      </span>
    </label>
  );
};

export const RadioGroup = ({
  name,
  label,
  options,
  value,
  defaultValue,
  onChange,
  error,
  helperText,
  radioSize = 'md',
  direction = 'vertical',
}: RadioGroupProps) => {
  return (
    <fieldset className="space-y-3">
      {label && <legend className="text-sm font-medium text-gray-900">{label}</legend>}

      <div className={direction === 'horizontal' ? 'flex flex-wrap gap-5' : 'space-y-3'}>
        {options.map((option) => (
          <Radio
            key={option.value}
            name={name}
            value={option.value}
            label={option.label}
            description={option.description}
            disabled={option.disabled}
            radioSize={radioSize}
            checked={value === undefined ? undefined : value === option.value}
            defaultChecked={defaultValue === option.value}
            onChange={(event) => onChange?.(event.target.value)}
          />
        ))}
      </div>

      {(error || helperText) && (
        <p className={`text-sm ${error ? 'text-rose-600' : 'text-gray-500'}`}>
          {error ?? helperText}
        </p>
      )}
    </fieldset>
  );
};
