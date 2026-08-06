import { Activity as ActivityIcon } from 'lucide-react';
import { EmptyState } from '@/components/ui/empty-state';
import { formatRelativeTime } from '@/utils/format';
import type { Activity } from '../../../../prisma/generated/prisma/client';

export function RecentActivity({ activities }: { activities: Activity[] }) {
  return (
    <div className="rounded-2xl border border-border/80 bg-card/90 p-5 shadow-[0_1px_0_rgba(36,95,115,0.04)]">
      <h2 className="text-sm font-semibold">Recent activity</h2>
      <div className="mt-3">
        {activities.length === 0 ? (
          <EmptyState
            icon={ActivityIcon}
            title="No activity yet"
            description="Actions across your projects will show up here."
            className="border-0 bg-transparent py-8"
          />
        ) : (
          <ul className="space-y-1">
            {activities.map((a) => (
              <li
                key={a.id}
                className="flex items-start justify-between gap-3 rounded-xl px-2 py-2.5 text-sm transition-colors hover:bg-muted/50"
              >
                <span className="min-w-0 leading-snug text-foreground">{a.action}</span>
                <span className="shrink-0 text-[11px] text-muted-foreground">
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
