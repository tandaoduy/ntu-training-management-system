import {
  CheckCircleIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon,
  XCircleIcon,
  XMarkIcon,
} from '@heroicons/react/24/solid';
import type { AlertMessage, AlertVariant } from './types';

interface AlertNotificationProps {
  alert: AlertMessage;
  onDismiss: (id: string) => void;
}

interface AlertInlineProps {
  variant?: AlertVariant;
  type?: AlertVariant;
  title?: string;
  message?: string;
  description?: string;
  dismissible?: boolean;
  onDismiss?: () => void;
}

type AlertProps = AlertNotificationProps | AlertInlineProps;

const iconMap = {
  success: <CheckCircleIcon className="w-5 h-5" />,
  error: <XCircleIcon className="w-5 h-5" />,
  warning: <ExclamationTriangleIcon className="w-5 h-5" />,
  info: <InformationCircleIcon className="w-5 h-5" />,
};

const bgColorMap = {
  success: 'bg-green-50 border-green-200',
  error: 'bg-red-50 border-red-200',
  warning: 'bg-yellow-50 border-yellow-200',
  info: 'bg-blue-50 border-blue-200',
};

const iconColorMap = {
  success: 'text-green-600',
  error: 'text-red-600',
  warning: 'text-yellow-600',
  info: 'text-blue-600',
};

const titleColorMap = {
  success: 'text-green-900',
  error: 'text-red-900',
  warning: 'text-yellow-900',
  info: 'text-blue-900',
};

const descriptionColorMap = {
  success: 'text-green-700',
  error: 'text-red-700',
  warning: 'text-yellow-700',
  info: 'text-blue-700',
};

const closeButtonColorMap = {
  success: 'text-green-600 hover:bg-green-100',
  error: 'text-red-600 hover:bg-red-100',
  warning: 'text-yellow-600 hover:bg-yellow-100',
  info: 'text-blue-600 hover:bg-blue-100',
};

const isNotificationProps = (props: AlertProps): props is AlertNotificationProps => {
  return 'alert' in props;
};

export const Alert = (props: AlertProps) => {
  const alert = isNotificationProps(props)
    ? props.alert
    : {
        id: 'inline-alert',
        type: props.type ?? props.variant ?? 'info',
        title: props.title ?? '',
        description: props.description ?? props.message,
        dismissible: props.dismissible,
      };

  const handleDismiss = () => {
    if (isNotificationProps(props)) {
      props.onDismiss(alert.id);
      return;
    }

    props.onDismiss?.();
  };

  return (
    <div
      className={`
        flex items-start gap-3 p-4 rounded-lg border
        ${bgColorMap[alert.type]}
        animate-in fade-in slide-in-from-top-2 duration-300
      `}
      role="alert"
    >
      {/* Icon */}
      <div className={`flex-shrink-0 mt-0.5 ${iconColorMap[alert.type]}`}>
        {iconMap[alert.type]}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        {alert.title && (
          <h3 className={`font-semibold text-sm ${titleColorMap[alert.type]}`}>
            {alert.title}
          </h3>
        )}
        {alert.description && (
          <p className={`text-sm mt-1 ${descriptionColorMap[alert.type]}`}>
            {alert.description}
          </p>
        )}
      </div>

      {/* Close button */}
      {alert.dismissible && (
        <button
          onClick={handleDismiss}
          className={`
            flex-shrink-0 p-1 rounded transition-colors
            ${closeButtonColorMap[alert.type]}
          `}
          aria-label="Dismiss alert"
        >
          <XMarkIcon className="w-4 h-4" />
        </button>
      )}
    </div>
  );
};
