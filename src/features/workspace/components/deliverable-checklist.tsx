'use client';

import { cn } from '@/lib/utils';
import type { DeliverableCheckItem } from '@/features/workspace/hooks/use-pipeline';

const STATUS_LABEL: Record<DeliverableCheckItem['status'], string> = {
  done: 'Done',
  active: 'Now',
  blocked: 'Blocked',
  pending: 'Queued',
};

/**
 * Compact per-phase deliverable checklist for Mission Control.
 */
export function DeliverableChecklist({
  items,
  className,
}: {
  items?: DeliverableCheckItem[] | null;
  className?: string;
}) {
  if (!items?.length) return null;

  const done = items.filter((i) => i.status === 'done').length;

  return (
    <div className={cn('space-y-2 border-t border-border pt-3', className)}>
      <div className="flex items-center justify-between gap-2">
        <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
          Deliverables
        </p>
        <span className="font-mono text-[10px] tabular-nums text-muted-foreground">
          {done}/{items.length}
        </span>
      </div>
      <ul className="max-h-[220px] space-y-1 overflow-y-auto pr-0.5">
        {items.map((item) => (
          <li
            key={item.phase}
            className={cn(
              'flex items-start justify-between gap-2 rounded-md px-2 py-1.5 text-[11px] leading-snug',
              item.status === 'active' && 'bg-primary/8 text-foreground',
              item.status === 'blocked' && 'bg-destructive/10 text-destructive',
              item.status === 'done' && 'text-muted-foreground',
              item.status === 'pending' && 'text-muted-foreground/80',
            )}
            title={`${item.artifactType} · ${item.department}`}
          >
            <span className="min-w-0 truncate">
              <span
                className={cn(
                  'mr-1.5 inline-block h-1.5 w-1.5 shrink-0 rounded-full align-middle',
                  item.status === 'done' && 'bg-primary',
                  item.status === 'active' && 'animate-soft-pulse bg-primary',
                  item.status === 'blocked' && 'bg-destructive',
                  item.status === 'pending' && 'bg-border',
                )}
              />
              {item.department.replace(/ Management$/, '').replace(/ Engineering$/, '')}
            </span>
            <span
              className={cn(
                'shrink-0 text-[10px] font-medium uppercase tracking-wide',
                item.status === 'blocked' && 'text-destructive',
                item.status === 'active' && 'text-primary',
              )}
            >
              {STATUS_LABEL[item.status]}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
