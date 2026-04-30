import type { ButtonProps, ButtonVariant } from './types';

const variantClasses: Record<ButtonVariant, string> = {
  primary: 'bg-blue-600 text-white border-transparent hover:bg-blue-700 focus:ring-blue-500',
  default: 'bg-blue-600 text-white border-transparent hover:bg-blue-700 focus:ring-blue-500',
  secondary: 'bg-gray-100 text-gray-900 border-gray-200 hover:bg-gray-200 focus:ring-gray-400',
  tertiary: 'bg-white text-gray-700 border-gray-200 shadow-sm hover:bg-gray-50 focus:ring-gray-400',
  success: 'bg-emerald-600 text-white border-transparent hover:bg-emerald-700 focus:ring-emerald-500',
  danger: 'bg-rose-600 text-white border-transparent hover:bg-rose-700 focus:ring-rose-500',
  warning: 'bg-orange-500 text-white border-transparent hover:bg-orange-600 focus:ring-orange-400',
  dark: 'bg-gray-900 text-white border-transparent hover:bg-gray-800 focus:ring-gray-700',
  ghost: 'bg-transparent text-gray-900 border-transparent hover:bg-gray-100 focus:ring-gray-400',
};

const outlineVariantClasses: Record<ButtonVariant, string> = {
  primary: 'bg-white text-blue-700 border-blue-600 hover:bg-blue-50 focus:ring-blue-500',
  default: 'bg-white text-blue-700 border-blue-600 hover:bg-blue-50 focus:ring-blue-500',
  secondary: 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50 focus:ring-gray-400',
  tertiary: 'bg-white text-gray-500 border-gray-200 hover:bg-gray-50 focus:ring-gray-400',
  success: 'bg-white text-emerald-700 border-emerald-600 hover:bg-emerald-50 focus:ring-emerald-500',
  danger: 'bg-white text-rose-700 border-rose-600 hover:bg-rose-50 focus:ring-rose-500',
  warning: 'bg-white text-orange-700 border-orange-500 hover:bg-orange-50 focus:ring-orange-400',
  dark: 'bg-white text-gray-900 border-gray-900 hover:bg-gray-100 focus:ring-gray-700',
  ghost: 'bg-transparent text-gray-700 border-transparent hover:bg-gray-100 focus:ring-gray-400',
};

export const Button = ({
  children,
  className = '',
  outline = false,
  type = 'button',
  variant = 'primary',
  ...props
}: ButtonProps) => (
  <button
    type={type}
    className={`inline-flex items-center justify-center rounded-lg border px-5 py-2.5 text-sm font-medium shadow-sm transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 ${outline ? outlineVariantClasses[variant] : variantClasses[variant]} ${className}`}
    {...props}
  >
    {children}
  </button>
);
