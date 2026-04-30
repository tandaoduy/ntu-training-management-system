import { useState } from 'react';
import type { TabsProps } from './types';

export const Tabs = ({
  items,
  defaultActiveId,
  activeId,
  onChange,
  className = '',
}: TabsProps) => {
  const [internalActiveId, setInternalActiveId] = useState(defaultActiveId ?? items[0]?.id ?? '');
  const currentActiveId = activeId ?? internalActiveId;
  const activeItem = items.find((item) => item.id === currentActiveId);

  const handleChange = (id: string) => {
    if (activeId === undefined) {
      setInternalActiveId(id);
    }

    onChange?.(id);
  };

  return (
    <div className={className}>
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex gap-6 overflow-x-auto" aria-label="Tabs">
          {items.map((item) => (
            <button
              key={item.id}
              type="button"
              disabled={item.disabled}
              onClick={() => handleChange(item.id)}
              className={`whitespace-nowrap border-b-2 px-1 py-3 text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${
                item.id === currentActiveId
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
              }`}
            >
              {item.label}
            </button>
          ))}
        </nav>
      </div>
      <div className="py-4 text-sm text-gray-600">{activeItem?.content}</div>
    </div>
  );
};
