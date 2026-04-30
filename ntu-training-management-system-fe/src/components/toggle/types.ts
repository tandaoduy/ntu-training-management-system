import type { InputHTMLAttributes, ReactNode } from 'react';

export type ToggleSize = 'sm' | 'md' | 'lg';

export interface ToggleProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, 'size' | 'type'> {
  label?: ReactNode;
  description?: ReactNode;
  toggleSize?: ToggleSize;
}
