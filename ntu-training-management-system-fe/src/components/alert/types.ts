export type AlertVariant = 'success' | 'error' | 'warning' | 'info'

export interface AlertProps {
  variant?: AlertVariant
  title?: string
  message: string
  dismissible?: boolean
  onDismiss?: () => void
  className?: string
}

export interface AlertItem {
  id: string
  variant: AlertVariant
  title?: string
  message: string
  dismissible?: boolean
}

export interface AlertContextValue {
  alerts: AlertItem[]
  showAlert: (alert: Omit<AlertItem, 'id'>) => string
  dismissAlert: (id: string) => void
  clearAlerts: () => void
}
