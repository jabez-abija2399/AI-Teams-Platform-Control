'use client';

// Import Next.js routing primitives.
import Link from 'next/link';
import { usePathname } from 'next/navigation';
// Import Lucide icons for sidebar navigation.
import { Sparkles, Bot } from 'lucide-react';
// Import utility for dynamic class names.
import { cn } from '@/lib/utils';
// Import application name constant.
import { APP_NAME } from '@/config/constants';
// Import navigation items configuration.
import {
  ADMIN_NAV_ITEMS,
  DASHBOARD_NAV_ITEMS,
  isDashboardNavActive,
} from '@/components/layout/nav-items';
// Import our centralized Atomic UI components.
import { GlassCard, StatusBadge } from '@/packages/ui';

interface SidebarProps {
  isSuperAdmin?: boolean;
}

/**
 * Ultra-Modern Cyber Void Global Sidebar.
 * Displays persistent workspace navigation, platform administration links,
 * and live AI company health telemetry with frosted glass aesthetics.
 */
export function Sidebar({ isSuperAdmin = false }: SidebarProps) {
  const pathname = usePathname();

  return (
    <aside className="hidden w-64 shrink-0 flex-col border-r border-white/10 bg-surface-glass/80 backdrop-blur-2xl md:flex shadow-2xl z-20">
      {/* Brand & Platform Header */}
      <div className="flex h-16 items-center gap-3 border-b border-white/10 px-5 bg-white/[0.02]">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-secondary text-white shadow-[0_0_15px_rgba(99,102,241,0.5)]">
          <Sparkles className="h-4.5 w-4.5" />
        </div>
        <div className="min-w-0">
          <p className="truncate text-sm font-bold tracking-tight text-white">{APP_NAME}</p>
          <p className="truncate text-[10px] font-mono font-medium text-white/40 uppercase tracking-widest">
            Mission Control
          </p>
        </div>
      </div>

      {/* Main Navigation Links */}
      <nav className="flex-1 space-y-1.5 overflow-y-auto p-4 scrollbar-hide">
        <p className="mb-2 px-3 text-[10px] font-bold uppercase tracking-widest font-mono text-white/40">
          Workspace
        </p>
        {DASHBOARD_NAV_ITEMS.map(({ href, label, icon: Icon, exact }) => {
          const active = isDashboardNavActive(pathname, href, exact);
          return (
            <Link
              key={href}
              href={href}
              aria-current={active ? 'page' : undefined}
              className={cn(
                'group relative flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-xs font-semibold transition-all duration-200',
                active
                  ? 'border border-primary/40 bg-primary/15 text-white shadow-[0_0_20px_rgba(99,102,241,0.2)] ring-1 ring-primary/40'
                  : 'text-white/60 hover:bg-white/5 hover:text-white',
              )}
            >
              {/* Active left indicator bar */}
              {active && (
                <span className="absolute left-0 top-1/2 -translate-y-1/2 h-4 w-1 rounded-r-full bg-primary shadow-[0_0_8px_#6366f1]" />
              )}
              <Icon
                className={cn(
                  'h-4 w-4 transition-colors',
                  active ? 'text-primary' : 'text-white/40 group-hover:text-white',
                )}
              />
              <span className="tracking-tight">{label}</span>
            </Link>
          );
        })}

        {/* SuperAdmin Navigation Links */}
        {isSuperAdmin && (
          <div className="pt-4">
            <p className="mb-2 px-3 text-[10px] font-bold uppercase tracking-widest font-mono text-white/40">
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
                    'group relative flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-xs font-semibold transition-all duration-200',
                    active
                      ? 'border border-primary/40 bg-primary/15 text-white shadow-[0_0_20px_rgba(99,102,241,0.2)] ring-1 ring-primary/40'
                      : 'text-white/60 hover:bg-white/5 hover:text-white',
                  )}
                >
                  {active && (
                    <span className="absolute left-0 top-1/2 -translate-y-1/2 h-4 w-1 rounded-r-full bg-primary shadow-[0_0_8px_#6366f1]" />
                  )}
                  <Icon
                    className={cn(
                      'h-4 w-4 transition-colors',
                      active ? 'text-primary' : 'text-white/40 group-hover:text-white',
                    )}
                  />
                  <span className="tracking-tight">{label}</span>
                </Link>
              );
            })}
          </div>
        )}
      </nav>

      {/* AI Workforce Live Telemetry Widget */}
      <div className="border-t border-white/10 p-4 bg-white/[0.01]">
        <GlassCard className="p-3.5 border-white/10 bg-white/[0.03]">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Bot className="w-3.5 h-3.5 text-success" />
              <p className="text-xs font-bold text-white tracking-tight">AI Workforce</p>
            </div>
            <StatusBadge status="HEALTHY" />
          </div>
          <p className="mt-1.5 text-[11px] font-mono text-white/50">
            5 autonomous specialists online
          </p>
        </GlassCard>
      </div>
    </aside>
  );
}
