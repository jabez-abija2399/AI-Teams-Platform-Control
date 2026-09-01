'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Sun, Moon, Plus, HelpCircle } from 'lucide-react';
import { Logo } from '@/components/layout/logo';
import { useTheme } from 'next-themes';
import React from 'react';
import { cn } from '@/lib/utils';
import { APP_NAME, ROUTES } from '@/config/constants';
import { DASHBOARD_NAV_ITEMS, isDashboardNavActive } from './nav-items';

interface SidebarProps {
  isSuperAdmin?: boolean;
}

export function Sidebar({ isSuperAdmin = false }: SidebarProps) {
  const pathname = usePathname();
  const [mounted, setMounted] = React.useState(false);
  const { theme, setTheme } = useTheme();

  React.useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <aside className="hidden md:flex flex-col h-screen w-64 border-r border-outline-variant/60 bg-background shrink-0 z-20 overflow-y-auto px-4 py-6">
      {/* Brand Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="h-8 w-8 rounded bg-primary/10 border border-primary/40 text-primary flex items-center justify-center shrink-0">
          <Logo size={18} />
        </div>
        <div>
          <h1 className="font-mono text-sm font-bold text-on-surface leading-none">{APP_NAME}</h1>
          <span className="font-mono text-[10px] text-on-surface-variant">v2.4.0-stable</span>
        </div>
      </div>

      {/* Primary CTA */}
      <Link href={`${ROUTES.projects}/new`} className="mb-6">
        <button
          type="button"
          className="w-full bg-primary text-black font-mono text-xs font-bold h-10 rounded flex items-center justify-center gap-2 hover:bg-primary-container transition-all uppercase tracking-wider"
        >
          <Plus className="w-4 h-4" />
          <span>New Project</span>
        </button>
      </Link>

      {/* Main Navigation Links */}
      <nav className="flex-1 flex flex-col gap-1 font-sans text-xs font-medium">
        {DASHBOARD_NAV_ITEMS.map(({ href, label, icon: Icon, exact }) => {
          const active = isDashboardNavActive(pathname ?? '', href, exact);
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-150',
                active
                  ? 'border-l-2 border-primary bg-surface-container-high/60 text-on-surface font-bold'
                  : 'border-l-2 border-transparent text-on-surface-variant hover:bg-surface-container-high/30 hover:text-on-surface',
              )}
            >
              <Icon className={cn('w-4 h-4', active ? 'text-primary' : 'text-on-surface-variant')} />
              <span>{label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Footer Navigation */}
      <div className="mt-auto pt-4 border-t border-outline-variant/60 flex flex-col gap-1 font-sans text-xs font-medium">
        <a
          href="#support"
          className="flex items-center gap-3 px-3 py-2 rounded-lg text-on-surface-variant hover:bg-surface-container-high/30 hover:text-on-surface transition-colors"
        >
          <HelpCircle className="w-4 h-4 text-on-surface-variant" />
          <span>Support</span>
        </a>

        {mounted && (
          <button
            type="button"
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            className="mt-2 flex items-center justify-between px-3 py-2 rounded-lg border border-outline-variant/60 text-on-surface-variant hover:text-on-surface transition-colors font-mono text-[11px]"
          >
            <span>Theme: {theme === 'dark' ? 'Dark' : 'Light'}</span>
            {theme === 'dark' ? <Sun className="w-3.5 h-3.5 text-warning" /> : <Moon className="w-3.5 h-3.5 text-primary" />}
          </button>
        )}
      </div>
    </aside>
  );
}
