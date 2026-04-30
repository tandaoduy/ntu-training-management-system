import type { ImgHTMLAttributes, ReactNode } from 'react';

export type AvatarSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';
export type AvatarStatus = 'online' | 'offline' | 'busy' | 'away';

export interface AvatarProps extends Omit<ImgHTMLAttributes<HTMLImageElement>, 'src'> {
  src?: string;
  name?: string;
  icon?: ReactNode;
  size?: AvatarSize;
  status?: AvatarStatus;
  className?: string;
}
