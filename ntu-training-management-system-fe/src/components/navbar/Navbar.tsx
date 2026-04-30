import type { NavbarProps } from './types';

export const Navbar = ({ brand, items = [], actions, className = '' }: NavbarProps) => (
  <header className={`border-b border-gray-200 bg-white ${className}`}>
    <div className="flex min-h-16 items-center justify-between gap-6 px-5">
      <div className="flex items-center gap-8">
        <div className="text-sm font-bold text-gray-900">{brand}</div>
        <nav className="hidden items-center gap-1 md:flex" aria-label="Main navigation">
          {items.map((item, index) => (
            <a
              key={index}
              href={item.href ?? '#'}
              className={`rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                item.active ? 'bg-blue-50 text-blue-700' : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
              }`}
            >
              {item.label}
            </a>
          ))}
        </nav>
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  </header>
);
