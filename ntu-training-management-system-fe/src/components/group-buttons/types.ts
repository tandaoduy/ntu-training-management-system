import type { ReactNode } from 'react';

export type GroupButtonSize = 'sm' | 'md' | 'lg';

export interface GroupButtonOption {
  label: ReactNode;
  value: string;
  disabled?: boolean;
}

export interface GroupButtonsProps {
  options: GroupButtonOption[];
  value?: string;
  defaultValue?: string;
  onChange?: (value: string) => void;
  size?: GroupButtonSize;
  fullWidth?: boolean;
  className?: string;
}
