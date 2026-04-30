import { createContext, useCallback, useContext, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import type { ActiveModal, ModalContextType, ModalOptions } from './types';

const ModalContext = createContext<ModalContextType | undefined>(undefined);

export const ModalContextProvider = ({ children }: { children: ReactNode }) => {
  const [modal, setModal] = useState<ActiveModal | null>(null);

  const openModal = useCallback((options: ModalOptions): string => {
    const id = `modal-${Date.now()}-${Math.random()}`;

    setModal({
      ...options,
      id,
      size: options.size ?? 'md',
      closeOnOverlayClick: options.closeOnOverlayClick ?? true,
      closeOnEscape: options.closeOnEscape ?? true,
      dismissible: options.dismissible ?? true,
    });

    return id;
  }, []);

  const closeModal = useCallback(() => {
    setModal(null);
  }, []);

  const value = useMemo(
    () => ({ modal, openModal, closeModal }),
    [modal, openModal, closeModal]
  );

  return <ModalContext.Provider value={value}>{children}</ModalContext.Provider>;
};

export const useModalContext = (): ModalContextType => {
  const context = useContext(ModalContext);

  if (!context) {
    throw new Error('useModalContext must be used within ModalProvider');
  }

  return context;
};
