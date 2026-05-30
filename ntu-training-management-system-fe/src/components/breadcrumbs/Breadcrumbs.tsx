import { ChevronRightIcon, HomeIcon } from '@heroicons/react/24/outline';
import type { BreadcrumbsProps } from './types';

export const Breadcrumbs = ({ items, className = '' }: BreadcrumbsProps) => (
  <nav className={`flex items-center text-sm text-gray-500 ${className}`} aria-label="Breadcrumb">
    <ol className="inline-flex flex-wrap items-center gap-1">
      {items.map((item, index) => {
        const last = index === items.length - 1;

        return (
          <li key={index} className="inline-flex items-center gap-1">
            {index > 0 && <ChevronRightIcon className="h-4 w-4 text-gray-400" />}
            {index === 0 && <HomeIcon className="h-4 w-4 text-gray-400" />}
            {item.href && !last ? (
              <a href={item.href} className="font-medium text-gray-600 hover:text-blue-600">
                {item.label}
              </a>
            ) : (
              <span className={last ? 'font-medium text-gray-900' : 'font-medium text-gray-600'}>
                {item.label}
              </span>
            )}
          </li>
        );
      })}
    </ol>
  </nav>
);
