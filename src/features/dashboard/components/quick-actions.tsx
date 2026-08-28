'use client';

import Link from 'next/link';
import { Plus, Bot, FolderKanban, ArrowRight } from 'lucide-react';
import { ROUTES } from '@/config/constants';

const ACTIONS = [
  {
    href: `${ROUTES.projects}/new`,
    label: 'New project',
    description: 'Describe an idea and open Mission Control',
    icon: Plus,
  },
  {
    href: ROUTES.projects,
    label: 'My projects',
    description: 'Open an existing AI company',
    icon: FolderKanban,
  },
  {
    href: ROUTES.aiTeams,
    label: 'AI teams',
    description: 'See agents across projects',
    icon: Bot,
  },
] as const;

export function QuickActions() {
  return (
    <div className="rounded-2xl border border-border/80 glass-card p-5">
      <h2 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Quick Actions</h2>
      <div className="mt-3 space-y-1.5">
        {ACTIONS.map(({ href, label, description, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className="group flex items-center gap-3 rounded-xl border border-transparent px-3 py-2.5 transition-all duration-200 hover:border-primary/30 hover:bg-muted/50 hover:shadow-xs"
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary border border-primary/20 transition-all duration-200 group-hover:scale-105 group-hover:bg-primary group-hover:text-primary-foreground">
              <Icon className="h-4.5 w-4.5" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-bold text-foreground">{label}</p>
              <p className="truncate text-[10px] text-muted-foreground/80">{description}</p>
            </div>
            <ArrowRight className="h-3.5 w-3.5 text-primary opacity-0 transition-all duration-200 group-hover:opacity-100 group-hover:translate-x-0.5" />
          </Link>
        ))}
      </div>
    </div>
  );
}
