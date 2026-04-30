import type { ReactNode } from 'react';

export interface NavbarItem {
  label: ReactNode;
  href?: string;
  active?: boolean;
}

export interface NavbarProps {
  brand: ReactNode;
  items?: NavbarItem[];
  actions?: ReactNode;
  className?: string;
}
