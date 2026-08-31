'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Sun, Moon, Plus, LayoutDashboard, Layers, Workflow, Terminal, Activity, Settings, HelpCircle } from 'lucide-react';
import { Logo } from '@/components/layout/logo';
import { useTheme } from 'next-themes';
import React from 'react';
import { cn } from '@/lib/utils';
import { APP_NAME, ROUTES } from '@/config/constants';

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

  const navItems = [
    { href: ROUTES.dashboard, label: 'Dashboard', icon: LayoutDashboard },
    { href: ROUTES.projects, label: 'Workspace', icon: Layers },
    { href: '#pipeline', label: 'Agent Pipeline', icon: Workflow },
    { href: '#artifacts', label: 'Artifacts', icon: Terminal },
    { href: '#status', label: 'System Status', icon: Activity },
  ];

  return (
    <aside className="hidden md:flex flex-col h-screen w-64 border-r border-white/10 bg-background shrink-0 z-20 overflow-y-auto px-4 py-6">
      {/* Brand Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="h-8 w-8 rounded-lg bg-primary text-black flex items-center justify-center shrink-0 font-bold">
          <Logo size={18} />
        </div>
        <div>
          <h1 className="font-heading text-base font-bold text-white leading-none">{APP_NAME}</h1>
          <span className="font-mono text-[10px] text-on-surface-variant">v2.4.0-stable</span>
        </div>
      </div>

      {/* Primary CTA */}
      <Link href={`${ROUTES.projects}/new`} className="mb-6">
        <button
          type="button"
          className="w-full bg-primary text-black font-mono text-xs font-bold h-10 rounded-lg flex items-center justify-center gap-2 hover:opacity-90 transition-all uppercase tracking-wider glow-cyan"
        >
          <Plus className="w-4 h-4" />
          <span>New Project</span>
        </button>
      </Link>

      {/* Main Navigation Links */}
      <nav className="flex-1 flex flex-col gap-1 font-sans text-xs font-medium">
        {navItems.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || (href !== ROUTES.dashboard && pathname?.startsWith(href));
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-150',
                active
                  ? 'border-l-2 border-primary bg-surface-container-high/60 text-white font-bold'
                  : 'border-l-2 border-transparent text-on-surface-variant hover:bg-surface-container-high/30 hover:text-white',
              )}
            >
              <Icon className={cn('w-4 h-4', active ? 'text-primary' : 'text-on-surface-variant')} />
              <span>{label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Footer Navigation */}
      <div className="mt-auto pt-4 border-t border-white/10 flex flex-col gap-1 font-sans text-xs font-medium">
        <a
          href="#settings"
          className="flex items-center gap-3 px-3 py-2 rounded-lg text-on-surface-variant hover:bg-surface-container-high/30 hover:text-white transition-colors"
        >
          <Settings className="w-4 h-4 text-on-surface-variant" />
          <span>Settings</span>
        </a>
        <a
          href="#support"
          className="flex items-center gap-3 px-3 py-2 rounded-lg text-on-surface-variant hover:bg-surface-container-high/30 hover:text-white transition-colors"
        >
          <HelpCircle className="w-4 h-4 text-on-surface-variant" />
          <span>Support</span>
        </a>

        {mounted && (
          <button
            type="button"
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            className="mt-2 flex items-center justify-between px-3 py-2 rounded-lg border border-white/10 text-on-surface-variant hover:text-white transition-colors font-mono text-[11px]"
          >
            <span>Theme: {theme === 'dark' ? 'Dark' : 'Light'}</span>
            {theme === 'dark' ? <Sun className="w-3.5 h-3.5 text-warning" /> : <Moon className="w-3.5 h-3.5 text-primary" />}
          </button>
        )}
      </div>
    </aside>
  );
}
