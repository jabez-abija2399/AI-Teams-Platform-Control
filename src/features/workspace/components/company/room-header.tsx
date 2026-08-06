'use client';

import { cn } from '@/lib/utils';

export function RoomHeader({
  phaseNumber,
  totalPhases,
  title,
  subtitle,
  status,
}: {
  phaseNumber: number;
  totalPhases: number;
  title: string;
  subtitle?: string;
  status: 'running' | 'completed' | 'waiting' | 'approval';
}) {
  return (
    <div className="flex items-center justify-between border-b border-border bg-card/60 px-5 py-3.5">
      <div className="flex items-center gap-3">
        <div
          className={cn(
            'flex h-9 w-9 items-center justify-center rounded-xl text-xs font-bold',
            status === 'running' && 'bg-primary/10 text-primary',
            status === 'completed' && 'bg-primary/15 text-primary',
            status === 'waiting' && 'bg-muted text-muted-foreground',
            status === 'approval' && 'bg-accent/15 text-accent',
          )}
        >
          {status === 'completed' ? '✓' : phaseNumber}
        </div>
        <div>
          <h2 className="font-heading text-base font-semibold text-foreground">{title}</h2>
          {subtitle && <p className="text-xs text-muted-foreground">{subtitle}</p>}
        </div>
      </div>

      <div className="flex items-center gap-3">
        <span className="hidden text-xs text-muted-foreground sm:inline">
          Phase {phaseNumber}/{totalPhases}
        </span>
        <div
          className={cn(
            'flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-medium',
            status === 'running' && 'bg-primary/10 text-primary',
            status === 'completed' && 'bg-primary/10 text-primary',
            status === 'waiting' && 'bg-muted text-muted-foreground',
            status === 'approval' && 'bg-accent/15 text-accent',
          )}
        >
          <span
            className={cn(
              'h-1.5 w-1.5 rounded-full',
              status === 'running' && 'animate-soft-pulse bg-primary',
              status === 'completed' && 'bg-primary',
              status === 'waiting' && 'bg-muted-foreground',
              status === 'approval' && 'animate-soft-pulse bg-accent',
            )}
          />
          {status === 'running'
            ? 'In Progress'
            : status === 'completed'
              ? 'Complete'
              : status === 'waiting'
                ? 'Waiting'
                : 'Needs Approval'}
        </div>
      </div>
    </div>
  );
}
