import type { InputHTMLAttributes, ReactNode } from 'react';

export type CheckboxSize = 'sm' | 'md' | 'lg';

export interface CheckboxProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, 'size' | 'type'> {
  label?: ReactNode;
  description?: ReactNode;
  error?: string;
  checkboxSize?: CheckboxSize;
}
