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
    <div className="rounded-2xl border border-border/80 bg-card/90 p-5 shadow-[0_1px_0_rgba(36,95,115,0.04)]">
      <h2 className="text-sm font-semibold">Quick actions</h2>
      <div className="mt-3 space-y-1">
        {ACTIONS.map(({ href, label, description, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className="group flex items-center gap-3 rounded-xl border border-transparent px-2.5 py-2.5 transition-colors hover:border-border/70 hover:bg-muted/50"
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
              <Icon className="h-4 w-4" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium">{label}</p>
              <p className="truncate text-[11px] text-muted-foreground">{description}</p>
            </div>
            <ArrowRight className="h-3.5 w-3.5 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
          </Link>
        ))}
      </div>
    </div>
  );
}
