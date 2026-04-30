import { useCallback } from 'react';
import { useAlertContext } from './AlertContext';
import type { AlertType, ShowAlertOptions } from './types';

export const useAlert = () => {
  const { addAlert, removeAlert, clearAlerts } = useAlertContext();

  const showAlert = useCallback(
    ({ type, variant, title, description, message, duration, dismissible }: ShowAlertOptions) => {
      return addAlert({
        type: type ?? variant ?? 'info',
        title,
        description: description ?? message,
        message,
        duration,
        dismissible,
      });
    },
    [addAlert]
  );

  const showSuccess = useCallback(
    (title: string, description?: string, duration?: number) => {
      return addAlert({ type: 'success', title, description, duration });
    },
    [addAlert]
  );

  const showError = useCallback(
    (title: string, description?: string, duration?: number) => {
      return addAlert({ type: 'error', title, description, duration });
    },
    [addAlert]
  );

  const showWarning = useCallback(
    (title: string, description?: string, duration?: number) => {
      return addAlert({ type: 'warning', title, description, duration });
    },
    [addAlert]
  );

  const showInfo = useCallback(
    (title: string, description?: string, duration?: number) => {
      return addAlert({ type: 'info', title, description, duration });
    },
    [addAlert]
  );

  const show = useCallback(
    (type: AlertType, title: string, description?: string, duration?: number) => {
      return addAlert({ type, title, description, duration });
    },
    [addAlert]
  );

  return {
    showSuccess,
    showError,
    showWarning,
    showInfo,
    show,
    showAlert,
    dismiss: removeAlert,
    clearAlerts,
    clearAll: clearAlerts,
  };
};
