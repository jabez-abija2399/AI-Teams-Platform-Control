'use client';

import { cn } from '@/lib/utils';

export type AIEmployeeStatus = 'active' | 'idle' | 'completed' | 'waiting' | 'error';

export interface AIEmployee {
  id: string;
  name: string;
  role: string;
  avatar: string;
  status: AIEmployeeStatus;
  currentTask?: string;
  confidence?: number;
  progress?: number;
}

const statusConfig: Record<AIEmployeeStatus, { color: string; pulse: boolean; label: string }> = {
  active: { color: 'bg-primary', pulse: true, label: 'Working' },
  idle: { color: 'bg-brand-gray', pulse: false, label: 'Idle' },
  completed: { color: 'bg-primary', pulse: false, label: 'Completed' },
  waiting: { color: 'bg-accent', pulse: false, label: 'Waiting' },
  error: { color: 'bg-destructive', pulse: false, label: 'Error' },
};

export function AIEmployeeCard({ employee }: { employee: AIEmployee }) {
  const config = statusConfig[employee.status];

  return (
    <div
      className={cn(
        'group relative rounded-2xl border border-border bg-card p-3.5 shadow-sm transition-all duration-200',
        'hover:border-primary/25 hover:shadow-md',
        employee.status === 'active' && 'border-primary/30 bg-primary/[0.04]',
      )}
    >
      <div className="flex items-start gap-3">
        <div className="relative shrink-0">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-lg">
            {employee.avatar}
          </div>
          <div
            className={cn(
              'absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-card',
              config.color,
              config.pulse && 'animate-soft-pulse',
            )}
          />
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm font-semibold text-foreground">{employee.name}</span>
            <span className="text-[11px] text-muted-foreground">{employee.role}</span>
          </div>

          {employee.currentTask && (
            <p className="mt-1 truncate text-xs text-muted-foreground">{employee.currentTask}</p>
          )}

          {employee.confidence !== undefined && (
            <div className="mt-2 flex items-center gap-2">
              <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
                <div
                  className={cn('h-full rounded-full transition-all duration-500', config.color)}
                  style={{ width: `${employee.confidence}%` }}
                />
              </div>
              <span className="text-[10px] text-muted-foreground">{employee.confidence}%</span>
            </div>
          )}
        </div>

        <span
          className={cn(
            'shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium',
            employee.status === 'active' && 'bg-primary/10 text-primary',
            employee.status === 'idle' && 'bg-muted text-muted-foreground',
            employee.status === 'completed' && 'bg-primary/10 text-primary',
            employee.status === 'waiting' && 'bg-accent/15 text-accent',
            employee.status === 'error' && 'bg-destructive/10 text-destructive',
          )}
        >
          {config.label}
        </span>
      </div>
    </div>
  );
}

export function AIEmployeeGrid({ employees }: { employees: AIEmployee[] }) {
  if (!employees.length) {
    return (
      <div className="rounded-2xl border border-dashed border-border bg-muted/30 px-4 py-8 text-center text-sm text-muted-foreground">
        No agents assigned to this phase yet.
      </div>
    );
  }

  return (
    <div className="grid gap-2.5 sm:grid-cols-2">
      {employees.map((employee) => (
        <AIEmployeeCard key={employee.id} employee={employee} />
      ))}
    </div>
  );
}
