import { XMarkIcon } from '@heroicons/react/24/outline';
import type { ActiveModal, ModalActionVariant, ModalSize } from './types';

interface ModalProps {
  modal: ActiveModal;
  onClose: () => void;
}

const sizeClasses: Record<ModalSize, string> = {
  sm: 'max-w-sm',
  md: 'max-w-lg',
  lg: 'max-w-2xl',
  xl: 'max-w-4xl',
};

const actionClasses: Record<ModalActionVariant, string> = {
  primary: 'bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500',
  secondary: 'bg-gray-100 text-gray-900 hover:bg-gray-200 focus:ring-gray-400',
  danger: 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500',
};

export const Modal = ({ modal, onClose }: ModalProps) => {
  const handleOverlayClick = () => {
    if (modal.closeOnOverlayClick) {
      onClose();
    }
  };

  return (
    <div
      className="ntu-modal-overlay fixed inset-0 z-[1000] flex items-center justify-center bg-black/50 px-4 py-6"
      role="presentation"
      onMouseDown={handleOverlayClick}
      style={{ zIndex: 1000 }}
    >
      <div
        className={`ntu-modal-panel w-full ${sizeClasses[modal.size ?? 'md']} rounded-lg bg-white shadow-xl flex flex-col max-h-[90vh]`}
        role="dialog"
        aria-modal="true"
        aria-labelledby={`${modal.id}-title`}
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4 border-b border-gray-200 px-6 py-4 flex-shrink-0">
          <h2 id={`${modal.id}-title`} className="text-lg font-semibold text-gray-900">
            {modal.title}
          </h2>

          {modal.dismissible && (
            <button
              type="button"
              className="rounded-md p-1 text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
              aria-label="Close modal"
              onClick={onClose}
            >
              <XMarkIcon className="h-5 w-5" />
            </button>
          )}
        </div>

        {modal.content && (
          <div className="px-6 py-5 text-sm leading-6 text-gray-700 overflow-y-auto flex-grow">{modal.content}</div>
        )}

        {modal.actions && modal.actions.length > 0 && (
          <div className="flex flex-col-reverse gap-2 border-t border-gray-200 px-6 py-4 sm:flex-row sm:justify-end">
            {modal.actions.map((action) => {
              const variant = action.variant ?? 'primary';

              return (
                <button
                  key={action.label}
                  type="button"
                  className={`inline-flex items-center justify-center rounded-md px-4 py-2 text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 ${actionClasses[variant]}`}
                  onClick={() => {
                    action.onClick?.();

                    if (action.autoClose !== false) {
                      onClose();
                    }
                  }}
                >
                  {action.label}
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
