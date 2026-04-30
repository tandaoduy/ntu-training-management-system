import type { TooltipPlacement, TooltipProps } from './types';

const placementClasses: Record<TooltipPlacement, string> = {
  top: 'bottom-full left-1/2 mb-2 -translate-x-1/2',
  right: 'left-full top-1/2 ml-2 -translate-y-1/2',
  bottom: 'left-1/2 top-full mt-2 -translate-x-1/2',
  left: 'right-full top-1/2 mr-2 -translate-y-1/2',
};

export const Tooltip = ({
  content,
  children,
  placement = 'top',
  className = '',
}: TooltipProps) => (
  <span className={`group relative inline-flex ${className}`}>
    {children}
    <span
      role="tooltip"
      className={`pointer-events-none absolute z-50 whitespace-nowrap rounded-md bg-gray-900 px-2.5 py-1.5 text-xs font-medium text-white opacity-0 shadow-sm transition-opacity group-hover:opacity-100 group-focus-within:opacity-100 ${placementClasses[placement]}`}
    >
      {content}
    </span>
  </span>
);
