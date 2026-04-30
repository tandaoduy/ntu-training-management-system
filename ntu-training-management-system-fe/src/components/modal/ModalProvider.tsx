import { useEffect } from 'react';
import type { ReactNode } from 'react';
import { Modal } from './Modal';
import { ModalContextProvider, useModalContext } from './ModalContext';

const ModalRenderer = () => {
  const { modal, closeModal } = useModalContext();

  useEffect(() => {
    if (!modal?.closeOnEscape) {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        closeModal();
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [closeModal, modal?.closeOnEscape]);

  if (!modal) {
    return null;
  }

  return <Modal modal={modal} onClose={closeModal} />;
};

export const ModalProvider = ({ children }: { children: ReactNode }) => {
  return (
    <ModalContextProvider>
      {children}
      <ModalRenderer />
    </ModalContextProvider>
  );
};
