import { cn } from '@/lib/utils';

const EMPLOYEES = [
  { role: 'CEO', task: 'Directing product vision', status: 'Working', active: true },
  { role: 'Product', task: 'Writing requirements', status: 'Working', active: true },
  { role: 'Architect', task: 'System design', status: 'Queued', active: false },
  { role: 'Engineers', task: 'Implementation', status: 'Standby', active: false },
  { role: 'QA · Security', task: 'Verification', status: 'Standby', active: false },
  { role: 'DevOps', task: 'Deployment', status: 'Standby', active: false },
] as const;

const PHASES = [
  { label: 'Discovery', done: true },
  { label: 'Architecture', done: false, current: true },
  { label: 'Build', done: false },
  { label: 'Ship', done: false },
] as const;

const PIPELINE_LINES = [
  'Product Manager drafting user stories & acceptance criteria',
  'Architect preparing system diagram for approval',
  'Frontend & Backend standing by for handoff',
] as const;

export function MissionControlPreview({
  className,
  progressLabel = 'Architecture · awaiting approval',
  progressPercent = 38,
  employees = EMPLOYEES,
  lines = PIPELINE_LINES,
  dense = false,
}: {
  className?: string;
  progressLabel?: string;
  progressPercent?: number;
  employees?: ReadonlyArray<{
    role: string;
    task?: string;
    status: string;
    active: boolean;
  }>;
  lines?: ReadonlyArray<string>;
  /** Compact layout for auth / narrow panels */
  dense?: boolean;
}) {
  const shown = dense ? employees.slice(0, 4) : employees;

  return (
    <div
      className={cn(
        'overflow-hidden rounded-2xl border border-border/80 bg-card/90 shadow-[0_24px_80px_-32px_rgba(36,95,115,0.45)] backdrop-blur-sm',
        className,
      )}
    >
      <div className="flex items-center gap-2 border-b border-border/70 bg-muted/30 px-4 py-3">
        <span className="h-2.5 w-2.5 rounded-full bg-brand-gray/80" />
        <span className="h-2.5 w-2.5 rounded-full bg-brand-gray/80" />
        <span className="h-2.5 w-2.5 rounded-full bg-brand-gray/80" />
        <span className="ml-3 text-xs font-medium tracking-wide text-muted-foreground">
          Mission Control
        </span>
        <span className="ml-auto flex items-center gap-1.5 text-[11px] font-medium text-primary">
          <span className="h-1.5 w-1.5 animate-soft-pulse rounded-full bg-primary" />
          Live
        </span>
      </div>

      {!dense && (
        <div className="flex items-center gap-1.5 overflow-x-auto border-b border-border/60 px-4 py-2.5">
          {PHASES.map((phase, i) => (
            <div key={phase.label} className="flex items-center gap-1.5">
              {i > 0 && <span className="mx-0.5 h-px w-4 bg-border sm:w-6" />}
              <span
                className={cn(
                  'whitespace-nowrap rounded-full px-2.5 py-1 text-[11px] font-medium',
                  phase.done && 'bg-primary/10 text-primary',
                  'current' in phase && phase.current && 'bg-accent/15 text-accent',
                  !phase.done && !('current' in phase && phase.current) && 'text-muted-foreground',
                )}
              >
                {phase.label}
              </span>
            </div>
          ))}
        </div>
      )}

      <div className={cn('grid grid-cols-1', dense ? '' : 'lg:grid-cols-[1fr_1.15fr]')}>
        <div
          className={cn(
            'space-y-2 border-b border-border/60 p-4 sm:p-5',
            !dense && 'lg:border-b-0 lg:border-r',
          )}
        >
          <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
            AI employees
          </p>
          {shown.map((employee) => (
            <div
              key={employee.role}
              className={cn(
                'flex items-center justify-between gap-3 rounded-xl border px-3 py-2.5 transition-colors',
                employee.active
                  ? 'border-primary/25 bg-primary/[0.04]'
                  : 'border-border/70 bg-background/80',
              )}
            >
              <div className="min-w-0 text-left">
                <p className="truncate text-sm font-medium text-foreground">{employee.role}</p>
                {employee.task && !dense && (
                  <p className="truncate text-[11px] text-muted-foreground">{employee.task}</p>
                )}
              </div>
              <span
                className={cn(
                  'shrink-0 text-[11px] font-medium',
                  employee.active ? 'animate-soft-pulse text-primary' : 'text-muted-foreground',
                )}
              >
                {employee.status}
              </span>
            </div>
          ))}
        </div>

        <div className="space-y-4 p-4 sm:p-5">
          <div className="flex items-center justify-between gap-3">
            <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
              Pipeline
            </p>
            <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-[11px] font-medium text-primary">
              {progressLabel}
            </span>
          </div>
          <div className="h-1.5 overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-gradient-to-r from-primary to-primary/70 transition-all"
              style={{ width: `${Math.max(0, Math.min(100, progressPercent))}%` }}
            />
          </div>
          <div className="space-y-2.5 text-left">
            {lines.map((line, i) => (
              <div key={line} className="flex gap-3 text-sm text-muted-foreground">
                <span
                  className={cn(
                    'mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full',
                    i === 0 ? 'animate-soft-pulse bg-primary' : 'bg-brand-gray',
                  )}
                />
                <span className={i === 0 ? 'text-foreground' : undefined}>{line}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
