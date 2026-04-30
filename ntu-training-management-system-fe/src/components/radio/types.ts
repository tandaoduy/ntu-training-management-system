import type { InputHTMLAttributes, ReactNode } from 'react';

export type RadioSize = 'sm' | 'md' | 'lg';

export interface RadioProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, 'size' | 'type'> {
  label: ReactNode;
  description?: ReactNode;
  radioSize?: RadioSize;
}

export interface RadioOption {
  label: ReactNode;
  value: string;
  description?: ReactNode;
  disabled?: boolean;
}

export interface RadioGroupProps {
  name: string;
  label?: string;
  options: RadioOption[];
  value?: string;
  defaultValue?: string;
  onChange?: (value: string) => void;
  error?: string;
  helperText?: string;
  radioSize?: RadioSize;
  direction?: 'vertical' | 'horizontal';
}
