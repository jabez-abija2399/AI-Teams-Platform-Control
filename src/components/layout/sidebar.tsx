'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import { APP_NAME } from '@/config/constants';
import {
  ADMIN_NAV_ITEMS,
  DASHBOARD_NAV_ITEMS,
  isDashboardNavActive,
} from '@/components/layout/nav-items';

export function Sidebar({ isSuperAdmin = false }: { isSuperAdmin?: boolean }) {
  const pathname = usePathname();

  return (
    <aside className="hidden w-64 shrink-0 flex-col border-r border-border/80 glass-card md:flex">
      <div className="flex h-16 items-center gap-3 border-b border-border/70 px-5">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-md">
          <Sparkles className="h-4 w-4" />
        </div>
        <div className="min-w-0">
          <p className="truncate font-heading text-sm font-bold tracking-tight text-foreground">{APP_NAME}</p>
          <p className="truncate text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Mission Control</p>
        </div>
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto p-3.5">
        <p className="mb-2.5 px-3 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
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
                'flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-xs font-semibold transition-all duration-200',
                active
                  ? 'border border-primary/30 bg-primary/10 text-primary shadow-xs glow-teal'
                  : 'text-muted-foreground hover:bg-muted/70 hover:text-foreground',
              )}
            >
              <Icon className={cn('h-4 w-4', active ? 'text-primary' : 'text-muted-foreground')} />
              {label}
            </Link>
          );
        })}

        {isSuperAdmin && (
          <>
            <p className="mb-2.5 mt-6 px-3 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
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
                    'flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-xs font-semibold transition-all duration-200',
                    active
                      ? 'border border-primary/30 bg-primary/10 text-primary shadow-xs glow-teal'
                      : 'text-muted-foreground hover:bg-muted/70 hover:text-foreground',
                  )}
                >
                  <Icon
                    className={cn('h-4 w-4', active ? 'text-primary' : 'text-muted-foreground')}
                  />
                  {label}
                </Link>
              );
            })}
          </>
        )}
      </nav>

      <div className="border-t border-border/70 p-3.5">
        <div className="rounded-xl border border-border/70 glass-card p-3.5 shadow-xs">
          <div className="flex items-center gap-2">
            <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            <p className="text-xs font-bold text-foreground">AI Workforce Online</p>
          </div>
          <p className="mt-1 text-[11px] leading-relaxed text-muted-foreground">
            5 autonomous agents ready
          </p>
        </div>
      </div>
    </aside>
  );
}
