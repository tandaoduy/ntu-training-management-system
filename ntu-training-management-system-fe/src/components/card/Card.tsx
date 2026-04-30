import type { CardHeaderProps, CardProps, CardSectionProps } from './types';

export const Card = ({ children, className = '', ...props }: CardProps) => (
  <div className={`rounded-lg border border-gray-200 bg-white shadow-sm ${className}`} {...props}>
    {children}
  </div>
);

export const CardHeader = ({
  title,
  description,
  action,
  children,
  className = '',
  ...props
}: CardHeaderProps) => (
  <div className={`flex items-start justify-between gap-4 border-b border-gray-200 px-5 py-4 ${className}`} {...props}>
    {children ?? (
      <div>
        {title && <h3 className="text-base font-semibold text-gray-900">{title}</h3>}
        {description && <p className="mt-1 text-sm text-gray-500">{description}</p>}
      </div>
    )}
    {action && <div className="shrink-0">{action}</div>}
  </div>
);

export const CardContent = ({ children, className = '', ...props }: CardSectionProps) => (
  <div className={`px-5 py-4 ${className}`} {...props}>
    {children}
  </div>
);

export const CardFooter = ({ children, className = '', ...props }: CardSectionProps) => (
  <div className={`border-t border-gray-200 px-5 py-4 ${className}`} {...props}>
    {children}
  </div>
);
