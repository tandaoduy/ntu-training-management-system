import type { InputHTMLAttributes } from 'react';

export type DatePickerSize = 'sm' | 'md' | 'lg';

export interface DatePickerProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, 'size' | 'type'> {
  label?: string;
  helperText?: string;
  error?: string;
  inputSize?: DatePickerSize;
  containerClassName?: string;
}
