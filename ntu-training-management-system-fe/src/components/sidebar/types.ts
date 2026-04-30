import type { ReactNode } from 'react';

export interface SidebarItem {
  label: ReactNode;
  href?: string;
  icon?: ReactNode;
  active?: boolean;
  disabled?: boolean;
}

export interface SidebarProps {
  brand?: ReactNode;
  items: SidebarItem[];
  footer?: ReactNode;
  className?: string;
}
