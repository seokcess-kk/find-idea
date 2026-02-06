'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

interface NavItem {
  href: string;
  label: string;
  icon?: React.ReactNode;
}

const navItems: NavItem[] = [
  { href: '/', label: 'Dashboard' },
  { href: '/ideas', label: 'Ideas' },
  { href: '/settings', label: 'Settings' },
];

export function Navigation() {
  const pathname = usePathname();

  return (
    <nav className="flex items-center gap-1 bg-gray-100 p-1 rounded-lg">
      {navItems.map((item) => {
        const isActive = pathname === item.href;
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`px-4 py-2 text-sm rounded-md transition-colors ${
              isActive
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
