'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

interface SidebarProps {
  className?: string;
}

export function Sidebar({ className = '' }: SidebarProps) {
  const pathname = usePathname();

  const navItems = [
    { href: '/', label: 'Dashboard', icon: '📊' },
    { href: '/ideas', label: 'Ideas', icon: '💡' },
    { href: '/settings', label: 'Settings', icon: '⚙️' },
  ];

  return (
    <aside className={`w-64 bg-white border-r min-h-screen p-4 ${className}`}>
      <div className="mb-8">
        <h1 className="text-xl font-bold text-gray-900">Product Ideation</h1>
        <p className="text-xs text-gray-500">Discover opportunities</p>
      </div>

      <nav className="space-y-1">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors ${
                isActive
                  ? 'bg-blue-50 text-blue-700'
                  : 'text-gray-700 hover:bg-gray-50'
              }`}
            >
              <span>{item.icon}</span>
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="mt-8 pt-8 border-t">
        <div className="text-xs text-gray-400">
          <p>13 channels configured</p>
          <p>Auto-sync enabled</p>
        </div>
      </div>
    </aside>
  );
}
