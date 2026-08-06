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
    <aside className="hidden w-60 shrink-0 flex-col border-r border-border/70 bg-card/80 md:flex">
      <div className="flex h-14 items-center gap-2.5 border-b border-border/70 px-4">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-sm">
          <Sparkles className="h-3.5 w-3.5" />
        </div>
        <div className="min-w-0">
          <p className="truncate font-heading text-sm font-semibold tracking-tight">{APP_NAME}</p>
          <p className="truncate text-[10px] text-muted-foreground">Mission Control</p>
        </div>
      </div>

      <nav className="flex-1 space-y-0.5 overflow-y-auto p-3">
        <p className="mb-2 px-2.5 text-[10px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
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
                'flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors',
                active
                  ? 'bg-primary/10 text-primary'
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
            <p className="mb-2 mt-5 px-2.5 text-[10px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
              Platform
            </p>
            {ADMIN_NAV_ITEMS.map(({ href, label, icon: Icon, exact }) => {
              const active = isDashboardNavActive(pathname, href, exact);
              return (
                <Link
                  key={href}
                  href={href}
                  aria-current={active ? 'page' : undefined}
                  className={cn(
                    'flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors',
                    active
                      ? 'bg-primary/10 text-primary'
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

      <div className="border-t border-border/70 p-3">
        <div className="rounded-xl border border-border/60 bg-background/70 px-3 py-3">
          <div className="flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 animate-soft-pulse rounded-full bg-primary" />
            <p className="text-xs font-medium text-foreground">AI company online</p>
          </div>
          <p className="mt-1 text-[11px] leading-relaxed text-muted-foreground">
            Agents ready for your next project
          </p>
        </div>
      </div>
    </aside>
  );
}
