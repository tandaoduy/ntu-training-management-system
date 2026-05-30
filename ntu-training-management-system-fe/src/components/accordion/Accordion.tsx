import { ChevronDownIcon } from '@heroicons/react/24/outline';
import { useState } from 'react';
import type { AccordionProps } from './types';

export const Accordion = ({
  items,
  defaultOpenId,
  allowClose = true,
  className = '',
}: AccordionProps) => {
  const [openId, setOpenId] = useState(defaultOpenId ?? items[0]?.id ?? '');

  const handleToggle = (id: string) => {
    setOpenId((currentId) => (allowClose && currentId === id ? '' : id));
  };

  return (
    <div className={`divide-y divide-gray-200 rounded-lg border border-gray-200 bg-white ${className}`}>
      {items.map((item) => {
        const open = openId === item.id;

        return (
          <div key={item.id}>
            <button
              type="button"
              disabled={item.disabled}
              onClick={() => handleToggle(item.id)}
              className="flex w-full items-center justify-between gap-3 px-5 py-4 text-left text-sm font-medium text-gray-900 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60"
              aria-expanded={open}
            >
              {item.title}
              <ChevronDownIcon className={`h-5 w-5 text-gray-500 transition-transform ${open ? 'rotate-180' : ''}`} />
            </button>
            {open && <div className="px-5 pb-5 text-sm leading-6 text-gray-600">{item.content}</div>}
          </div>
        );
      })}
    </div>
  );
};
