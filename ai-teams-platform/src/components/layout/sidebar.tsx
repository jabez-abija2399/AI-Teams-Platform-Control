'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, FolderKanban, Bot, Settings } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ROUTES, APP_NAME } from '@/config/constants';

const NAV_ITEMS = [
  { href: ROUTES.dashboard, label: 'Dashboard', icon: LayoutDashboard },
  { href: ROUTES.projects, label: 'Projects', icon: FolderKanban },
  { href: ROUTES.aiTeams, label: 'AI Teams', icon: Bot },
  { href: ROUTES.settings, label: 'Settings', icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="bg-card hidden w-60 flex-col border-r md:flex">
      <div className="flex h-14 items-center border-b px-5">
        <span className="text-sm font-semibold tracking-tight">{APP_NAME}</span>
      </div>
      <nav className="flex-1 space-y-1 p-3">
        {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(`${href}/`);
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex items-center gap-2.5 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                active
                  ? 'bg-secondary text-secondary-foreground'
                  : 'text-muted-foreground hover:bg-secondary/60 hover:text-foreground',
              )}
            >
              <Icon className="h-4 w-4" />
              {label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
