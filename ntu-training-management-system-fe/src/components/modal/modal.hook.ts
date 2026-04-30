import { useCallback } from 'react';
import { useModalContext } from './ModalContext';
import type { ModalOptions } from './types';

export const useModal = () => {
  const { modal, openModal, closeModal } = useModalContext();

  const open = useCallback(
    (options: ModalOptions) => {
      return openModal(options);
    },
    [openModal]
  );

  const confirm = useCallback(
    (
      title: string,
      content: ModalOptions['content'],
      onConfirm: () => void,
      options?: Omit<ModalOptions, 'title' | 'content' | 'actions'>
    ) => {
      return openModal({
        title,
        content,
        ...options,
        actions: [
          { label: 'Cancel', variant: 'secondary' },
          {
            label: 'Confirm',
            variant: 'primary',
            onClick: onConfirm,
          },
        ],
      });
    },
    [openModal]
  );

  return {
    modal,
    open,
    confirm,
    close: closeModal,
  };
};
