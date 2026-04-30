import { createContext, useCallback, useContext, useState } from 'react';
import type { ReactNode } from 'react';
import type { AlertContextType, AlertMessage } from './types';

const AlertContext = createContext<AlertContextType | undefined>(undefined);

export const AlertContextProvider = ({ children }: { children: ReactNode }) => {
  const [alerts, setAlerts] = useState<AlertMessage[]>([]);

  const addAlert = useCallback((alert: Omit<AlertMessage, 'id'>): string => {
    const id = `alert-${Date.now()}-${Math.random()}`;
    const duration = alert.duration ?? 5000;
    const newAlert: AlertMessage = {
      ...alert,
      id,
      dismissible: alert.dismissible !== false,
      duration, // Default 5 seconds
    };

    setAlerts((prev) => [...prev, newAlert]);

    // Auto-dismiss if duration is set
    if (duration > 0) {
      setTimeout(() => {
        removeAlert(id);
      }, duration);
    }

    return id;
  }, []);

  const removeAlert = useCallback((id: string) => {
    setAlerts((prev) => prev.filter((alert) => alert.id !== id));
  }, []);

  const clearAlerts = useCallback(() => {
    setAlerts([]);
  }, []);

  return (
    <AlertContext.Provider value={{ alerts, addAlert, removeAlert, clearAlerts }}>
      {children}
    </AlertContext.Provider>
  );
};

export { AlertContextProvider as AlertProvider };

export const useAlertContext = (): AlertContextType => {
  const context = useContext(AlertContext);
  if (!context) {
    throw new Error('useAlertContext must be used within AlertProvider');
  }
  return context;
};
