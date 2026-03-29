import { useCallback, useMemo, useState, type ReactNode } from 'react'

import Alert from './Alert'
import { AlertContext } from './AlertContext'
import type { AlertContextValue, AlertItem, AlertVariant } from './types'

type AlertProviderProps = {
  children: ReactNode
  maxAlerts?: number
}

const createAlertId = () => {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }

  return `${Date.now()}-${Math.random().toString(36).slice(2)}`
}

export function AlertProvider({ children, maxAlerts = 3 }: AlertProviderProps) {
  const [alerts, setAlerts] = useState<AlertItem[]>([])

  const dismissAlert = useCallback((id: string) => {
    setAlerts((prev) => prev.filter((alert) => alert.id !== id))
  }, [])

  const clearAlerts = useCallback(() => {
    setAlerts([])
  }, [])

  const showAlert = useCallback(
    (alert: Omit<AlertItem, 'id'>) => {
      const id = createAlertId()
      const nextAlert: AlertItem = {
        id,
        variant: (alert.variant ?? 'info') as AlertVariant,
        title: alert.title,
        message: alert.message,
        dismissible: alert.dismissible ?? true,
      }

      setAlerts((prev) => [nextAlert, ...prev].slice(0, maxAlerts))
      return id
    },
    [maxAlerts],
  )

  const contextValue = useMemo<AlertContextValue>(
    () => ({
      alerts,
      showAlert,
      dismissAlert,
      clearAlerts,
    }),
    [alerts, showAlert, dismissAlert, clearAlerts],
  )

  return (
    <AlertContext.Provider value={contextValue}>
      {children}

      {alerts.length > 0 && (
        <div className="fixed right-4 top-4 z-50 w-[min(420px,calc(100vw-2rem))] space-y-2">
          {alerts.map((alert) => (
            <Alert
              key={alert.id}
              variant={alert.variant}
              title={alert.title}
              message={alert.message}
              dismissible={alert.dismissible}
              onDismiss={() => dismissAlert(alert.id)}
            />
          ))}
        </div>
      )}
    </AlertContext.Provider>
  )
}
