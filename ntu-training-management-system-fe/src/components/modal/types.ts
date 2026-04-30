import type { ReactNode } from 'react';

export type ModalSize = 'sm' | 'md' | 'lg' | 'xl';
export type ModalActionVariant = 'primary' | 'secondary' | 'danger';

export interface ModalAction {
  label: string;
  variant?: ModalActionVariant;
  onClick?: () => void;
  autoClose?: boolean;
}

export interface ModalOptions {
  title: string;
  content?: ReactNode;
  size?: ModalSize;
  actions?: ModalAction[];
  closeOnOverlayClick?: boolean;
  closeOnEscape?: boolean;
  dismissible?: boolean;
}

export interface ActiveModal extends ModalOptions {
  id: string;
}

export interface ModalContextType {
  modal: ActiveModal | null;
  openModal: (options: ModalOptions) => string;
  closeModal: () => void;
}
