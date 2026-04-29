import {
  CheckCircleIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon,
  XCircleIcon,
  XMarkIcon,
} from '@heroicons/react/24/solid'

import type { AlertProps, AlertVariant } from './types'

type VariantStyle = {
  container: string
  icon: string
  title: string
  message: string
  IconComponent: React.ComponentType<React.SVGProps<SVGSVGElement>>
}

const VARIANTS: Record<AlertVariant, VariantStyle> = {
  success: {
    container: 'bg-green-50 border border-green-200',
    icon: 'text-green-500',
    title: 'text-green-800',
    message: 'text-green-700',
    IconComponent: CheckCircleIcon,
  },
  error: {
    container: 'bg-red-50 border border-red-200',
    icon: 'text-red-500',
    title: 'text-red-800',
    message: 'text-red-700',
    IconComponent: XCircleIcon,
  },
  warning: {
    container: 'bg-yellow-50 border border-yellow-200',
    icon: 'text-yellow-500',
    title: 'text-yellow-800',
    message: 'text-yellow-700',
    IconComponent: ExclamationTriangleIcon,
  },
  info: {
    container: 'bg-blue-50 border border-blue-200',
    icon: 'text-blue-500',
    title: 'text-blue-800',
    message: 'text-blue-700',
    IconComponent: InformationCircleIcon,
  },
}

export default function Alert({
  variant = 'info',
  title,
  message,
  dismissible = false,
  isExiting = false,
  onDismiss,
  className = '',
}: AlertProps) {
  const styles = VARIANTS[variant] ?? VARIANTS.info
  const { IconComponent } = styles

  const motionClass = isExiting
    ? 'translate-x-16 opacity-0 scale-[0.98] pointer-events-none'
    : 'translate-x-0 opacity-100 scale-100'

  return (
    <div
      className={`pointer-events-auto rounded-lg p-4 transition-all duration-300 ease-out will-change-transform ${motionClass} ${styles.container} ${className}`}
      role="alert"
    >
      <div className="flex items-start gap-3">
        <IconComponent className={`h-5 w-5 mt-0.5 shrink-0 ${styles.icon}`} />

        <div className="flex-1 min-w-0">
          {title ? (
            <>
              <p className={`text-sm font-semibold ${styles.title}`}>{title}</p>
              <p className={`mt-1 text-sm ${styles.message}`}>{message}</p>
            </>
          ) : (
            <p className={`text-sm ${styles.message}`}>{message}</p>
          )}
        </div>

        {dismissible && (
          <button
            type="button"
            onClick={onDismiss}
            className={`shrink-0 rounded-sm ${styles.icon} hover:opacity-70 transition-opacity`}
            aria-label="Dong thong bao"
          >
            <XMarkIcon className="h-4 w-4" />
          </button>
        )}
      </div>
    </div>
  )
}
