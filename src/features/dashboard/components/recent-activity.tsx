import { Activity as ActivityIcon } from 'lucide-react';
import { EmptyState } from '@/components/ui/empty-state';
import { formatRelativeTime } from '@/utils/format';
import type { Activity } from '../../../../prisma/generated/prisma/client';
import { cn } from '@/lib/utils';

export function RecentActivity({ activities }: { activities: Activity[] }) {
  return (
    <div className="rounded-2xl border border-border/80 glass-card p-5">
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Recent Activity</h2>
        <span className="flex h-2 w-2 rounded-full bg-primary animate-pulse" />
      </div>
      <div className="mt-3">
        {activities.length === 0 ? (
          <EmptyState
            icon={ActivityIcon}
            title="No activity yet"
            description="Actions across your projects will show up here."
            className="border-0 bg-transparent py-8"
          />
        ) : (
          <ul className="space-y-1.5">
            {activities.map((a, i) => (
              <li
                key={a.id}
                className="flex items-start justify-between gap-3 rounded-xl px-2.5 py-2 text-xs transition-colors hover:bg-muted/50"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <span
                    className={cn(
                      'h-1.5 w-1.5 shrink-0 rounded-full',
                      i === 0 ? 'bg-primary animate-pulse' : 'bg-muted-foreground/50',
                    )}
                  />
                  <span className="min-w-0 truncate font-medium text-foreground">{a.action}</span>
                </div>
                <span className="shrink-0 text-[10px] font-mono text-muted-foreground/80">
                  {formatRelativeTime(a.createdAt)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
