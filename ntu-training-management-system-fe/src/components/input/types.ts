import type { InputHTMLAttributes, ReactNode } from 'react';

export type InputSize = 'sm' | 'md' | 'lg';
export type InputState = 'default' | 'success' | 'error';

export interface InputProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, 'size'> {
  label?: string;
  helperText?: string;
  error?: string;
  inputSize?: InputSize;
  state?: InputState;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
  containerClassName?: string;
}
