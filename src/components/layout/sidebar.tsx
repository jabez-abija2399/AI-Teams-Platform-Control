'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Sun, Moon } from 'lucide-react';
import { Logo } from '@/components/layout/logo';
import { useTheme } from 'next-themes';
import React from 'react';
import { cn } from '@/lib/utils';
import { APP_NAME } from '@/config/constants';
import {
  ADMIN_NAV_ITEMS,
  DASHBOARD_NAV_ITEMS,
  isDashboardNavActive,
} from '@/components/layout/nav-items';

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
    <aside className="hidden w-64 shrink-0 flex-col border-r border-white/10 bg-surface/90 backdrop-blur-2xl md:flex shadow-2xl z-20">
      {/* Brand Header */}
      <div className="flex h-16 items-center gap-3 border-b border-white/10 px-5 bg-white/[0.02]">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-surface border border-primary/40 text-primary shadow-[0_0_12px_rgba(0,242,254,0.25)]">
          <Logo size={20} />
        </div>
        <div className="min-w-0">
          <p className="truncate text-base font-bold tracking-tight text-white font-heading">{APP_NAME}</p>
        </div>
      </div>

      {/* Main Navigation Links */}
      <nav className="flex-1 space-y-1.5 overflow-y-auto p-4 scrollbar-hide">
        <p className="mb-2 px-3 text-[10px] font-bold uppercase tracking-widest font-mono text-on-surface-variant">
          Main Workspace
        </p>
        {DASHBOARD_NAV_ITEMS.map(({ href, label, icon: Icon, exact }) => {
          const active = isDashboardNavActive(pathname, href, exact);
          return (
            <Link
              key={href}
              href={href}
              aria-current={active ? 'page' : undefined}
              className={cn(
                'group relative flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-xs font-semibold transition-all duration-200 font-mono uppercase tracking-wider',
                active
                  ? 'border border-primary/50 bg-primary/15 text-white shadow-[0_0_20px_rgba(0,242,254,0.15)] font-bold'
                  : 'text-on-surface-variant hover:bg-white/5 hover:text-white',
              )}
            >
              {active && (
                <span className="absolute left-0 top-1/2 -translate-y-1/2 h-5 w-1 rounded-r-full bg-primary glow-cyan" />
              )}
              <Icon
                className={cn(
                  'h-4 w-4 transition-colors',
                  active ? 'text-primary' : 'text-on-surface-variant group-hover:text-white',
                )}
              />
              <span className="truncate">{label}</span>
            </Link>
          );
        })}

        {/* SuperAdmin Navigation Links */}
        {isSuperAdmin && (
          <div className="pt-4 border-t border-white/10 mt-4">
            <p className="mb-2 px-3 text-[10px] font-bold uppercase tracking-widest font-mono text-on-surface-variant">
              Platform Admin
            </p>
            {ADMIN_NAV_ITEMS.map(({ href, label, icon: Icon, exact }) => {
              const active = isDashboardNavActive(pathname, href, exact);
              return (
                <Link
                  key={href}
                  href={href}
                  aria-current={active ? 'page' : undefined}
                  className={cn(
                    'group relative flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-xs font-semibold transition-all duration-200 font-mono uppercase tracking-wider',
                    active
                      ? 'border border-primary/50 bg-primary/15 text-white shadow-[0_0_20px_rgba(0,242,254,0.15)] font-bold'
                      : 'text-on-surface-variant hover:bg-white/5 hover:text-white',
                  )}
                >
                  {active && (
                    <span className="absolute left-0 top-1/2 -translate-y-1/2 h-5 w-1 rounded-r-full bg-primary glow-cyan" />
                  )}
                  <Icon
                    className={cn(
                      'h-4 w-4 transition-colors',
                      active ? 'text-primary' : 'text-on-surface-variant group-hover:text-white',
                    )}
                  />
                  <span className="truncate">{label}</span>
                </Link>
              );
            })}
          </div>
        )}
      </nav>

      {/* Sidebar Footer Theme Control */}
      <div className="p-4 border-t border-white/10 bg-surface-container-high/30 flex justify-between items-center">
        <span className="font-mono text-[10px] text-on-surface-variant uppercase tracking-wider font-bold">
          Workspace Mode
        </span>
        {mounted && (
          <button
            type="button"
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            className="p-1.5 rounded-lg border border-white/10 hover:border-primary text-on-surface-variant hover:text-white transition-colors"
            title="Toggle Theme"
          >
            {theme === 'dark' ? <Sun className="w-3.5 h-3.5 text-warning" /> : <Moon className="w-3.5 h-3.5 text-primary" />}
          </button>
        )}
      </div>
    </aside>
  );
}
