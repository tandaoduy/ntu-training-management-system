import type { SidebarProps } from './types';

export const Sidebar = ({ brand, items, footer, className = '' }: SidebarProps) => (
  <aside className={`flex h-full w-64 flex-col border-r border-gray-200 bg-white ${className}`}>
    {brand && <div className="border-b border-gray-200 px-5 py-4 text-sm font-bold text-gray-900">{brand}</div>}
    <nav className="flex-1 space-y-1 px-3 py-4" aria-label="Sidebar navigation">
      {items.map((item, index) => (
        <a
          key={index}
          href={item.href ?? '#'}
          aria-disabled={item.disabled}
          className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
            item.active
              ? 'bg-blue-50 text-blue-700'
              : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
          } ${item.disabled ? 'pointer-events-none opacity-50' : ''}`}
        >
          {item.icon && <span className="h-5 w-5">{item.icon}</span>}
          {item.label}
        </a>
      ))}
    </nav>
    {footer && <div className="border-t border-gray-200 px-4 py-3">{footer}</div>}
  </aside>
);
