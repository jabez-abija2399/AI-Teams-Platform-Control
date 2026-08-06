'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Menu, Sparkles } from 'lucide-react';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { APP_NAME } from '@/config/constants';
import { DASHBOARD_NAV_ITEMS, isDashboardNavActive } from '@/components/layout/nav-items';

export function MobileMenu() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger
        render={<Button variant="ghost" size="icon" className="md:hidden" aria-label="Open menu" />}
      >
        <Menu className="h-5 w-5" />
      </SheetTrigger>
      <SheetContent side="left" className="w-64 p-0">
        <div className="flex h-14 items-center gap-2.5 border-b border-border/70 px-5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Sparkles className="h-3.5 w-3.5" />
          </div>
          <span className="font-heading text-sm font-semibold tracking-tight">{APP_NAME}</span>
        </div>
        <nav className="space-y-0.5 p-3">
          <p className="mb-2 px-2.5 text-[10px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
            Workspace
          </p>
          {DASHBOARD_NAV_ITEMS.map(({ href, label, icon: Icon, exact }) => {
            const active = isDashboardNavActive(pathname, href, exact);
            return (
              <Link
                key={href}
                href={href}
                onClick={() => setOpen(false)}
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
        </nav>
      </SheetContent>
    </Sheet>
  );
}
