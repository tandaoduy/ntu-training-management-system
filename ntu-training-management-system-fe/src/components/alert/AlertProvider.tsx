import { AlertContextProvider, useAlertContext } from './AlertContext';
import { Alert } from './Alert';
import type { ReactNode } from 'react';
import { createPortal } from 'react-dom';
import type { AlertPosition } from './types';

interface AlertProviderProps {
  position?: AlertPosition;
}

const AlertViewport = ({
  position = 'top-right',
}: AlertProviderProps) => {
  const { alerts, removeAlert } = useAlertContext();

  const positionClasses: Record<AlertPosition, string> = {
    'top-right': 'top-4 right-4',
    'top-left': 'top-4 left-4',
    'bottom-right': 'bottom-4 right-4',
    'bottom-left': 'bottom-4 left-4',
    'top-center': 'top-4 left-1/2 -translate-x-1/2',
    'bottom-center': 'bottom-4 left-1/2 -translate-x-1/2',
  };

  const viewport = (
    <div
      className={`
        fixed ${positionClasses[position]} z-[2147483647]
        flex w-full max-w-sm flex-col gap-2 px-4 pointer-events-none sm:px-0
      `}
    >
      {alerts.map((alert) => (
        <div key={alert.id} className="pointer-events-auto">
          <Alert alert={alert} onDismiss={removeAlert} />
        </div>
      ))}
    </div>
  );

  if (typeof document === 'undefined') {
    return viewport;
  }

  return createPortal(viewport, document.body);
};

export const AlertProvider = ({
  position = 'top-right',
  children,
}: AlertProviderProps & { children: ReactNode }) => (
  <AlertContextProvider>
    {children}
    <AlertViewport position={position} />
  </AlertContextProvider>
);

export { AlertViewport };
