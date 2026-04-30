export type AlertType = 'success' | 'error' | 'warning' | 'info';
export type AlertVariant = AlertType;
export type AlertPosition = 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left' | 'top-center' | 'bottom-center';

export interface AlertMessage {
  id: string;
  type: AlertType;
  title: string;
  description?: string;
  message?: string;
  duration?: number; // milliseconds, 0 = no auto-dismiss
  dismissible?: boolean;
}

export interface ShowAlertOptions {
  type?: AlertType;
  variant?: AlertVariant;
  title: string;
  description?: string;
  message?: string;
  duration?: number;
  dismissible?: boolean;
}

export interface AlertContextType {
  alerts: AlertMessage[];
  addAlert: (alert: Omit<AlertMessage, 'id'>) => string;
  removeAlert: (id: string) => void;
  clearAlerts: () => void;
}
