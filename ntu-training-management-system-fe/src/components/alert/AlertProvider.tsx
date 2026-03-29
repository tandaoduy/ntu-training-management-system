import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'

import Alert from './Alert'
import { AlertContext } from './AlertContext'
import type { AlertContextValue, AlertItem, AlertVariant } from './types'

type AlertProviderProps = {
  children: ReactNode
  maxAlerts?: number
}

const ALERT_AUTO_DISMISS_MS = 5000
const ALERT_EXIT_ANIMATION_MS = 300

const createAlertId = () => {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }

  return `${Date.now()}-${Math.random().toString(36).slice(2)}`
}

export function AlertProvider({ children, maxAlerts = 3 }: AlertProviderProps) {
  const [alerts, setAlerts] = useState<AlertItem[]>([])
  const [exitingIds, setExitingIds] = useState<string[]>([])
  const timeoutMapRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map())
  const exitTimeoutMapRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map())

  const clearAlertTimeout = useCallback((id: string) => {
    const timeoutId = timeoutMapRef.current.get(id)

    if (timeoutId) {
      clearTimeout(timeoutId)
      timeoutMapRef.current.delete(id)
    }
  }, [])

  const clearExitTimeout = useCallback((id: string) => {
    const timeoutId = exitTimeoutMapRef.current.get(id)

    if (timeoutId) {
      clearTimeout(timeoutId)
      exitTimeoutMapRef.current.delete(id)
    }
  }, [])

  const startDismiss = useCallback(
    (id: string) => {
      clearAlertTimeout(id)
      clearExitTimeout(id)

      let shouldScheduleRemove = false

      setExitingIds((prev) => {
        if (prev.includes(id)) {
          return prev
        }

        shouldScheduleRemove = true
        return [...prev, id]
      })

      if (!shouldScheduleRemove) {
        return
      }

      const timeoutId = setTimeout(() => {
        setAlerts((prev) => prev.filter((alert) => alert.id !== id))
        setExitingIds((prev) => prev.filter((exitingId) => exitingId !== id))
        exitTimeoutMapRef.current.delete(id)
      }, ALERT_EXIT_ANIMATION_MS)

      exitTimeoutMapRef.current.set(id, timeoutId)
    },
    [clearAlertTimeout, clearExitTimeout],
  )

  const scheduleAutoDismiss = useCallback(
    (id: string) => {
      clearAlertTimeout(id)

      const timeoutId = setTimeout(() => {
        startDismiss(id)
        timeoutMapRef.current.delete(id)
      }, ALERT_AUTO_DISMISS_MS)

      timeoutMapRef.current.set(id, timeoutId)
    },
    [clearAlertTimeout, startDismiss],
  )

  const dismissAlert = useCallback((id: string) => {
    startDismiss(id)
  }, [startDismiss])

  const clearAlerts = useCallback(() => {
    timeoutMapRef.current.forEach((timeoutId) => clearTimeout(timeoutId))
    timeoutMapRef.current.clear()
    exitTimeoutMapRef.current.forEach((timeoutId) => clearTimeout(timeoutId))
    exitTimeoutMapRef.current.clear()
    setExitingIds([])
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

      setAlerts((prev) => {
        const nextAlerts = [nextAlert, ...prev].slice(0, maxAlerts)

        prev
          .filter((oldAlert) => !nextAlerts.some((currentAlert) => currentAlert.id === oldAlert.id))
          .forEach((removedAlert) => {
            clearAlertTimeout(removedAlert.id)
            clearExitTimeout(removedAlert.id)
          })

        return nextAlerts
      })

      scheduleAutoDismiss(id)
      return id
    },
    [maxAlerts, clearAlertTimeout, clearExitTimeout, scheduleAutoDismiss],
  )

  useEffect(() => {
    const timeoutMap = timeoutMapRef.current
    const exitTimeoutMap = exitTimeoutMapRef.current

    return () => {
      timeoutMap.forEach((timeoutId) => clearTimeout(timeoutId))
      timeoutMap.clear()
      exitTimeoutMap.forEach((timeoutId) => clearTimeout(timeoutId))
      exitTimeoutMap.clear()
    }
  }, [])

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
              isExiting={exitingIds.includes(alert.id)}
              onDismiss={() => dismissAlert(alert.id)}
            />
          ))}
        </div>
      )}
    </AlertContext.Provider>
  )
}
