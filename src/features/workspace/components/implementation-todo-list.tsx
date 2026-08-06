'use client';

import { cn } from '@/lib/utils';

export interface DeliveryTodoItem {
  id: string;
  title: string;
  description?: string;
  files?: string[];
  status: 'pending' | 'in_progress' | 'done' | 'failed';
}

/**
 * Compact Architect → Developer → QA todo list for Mission Control.
 */
export function ImplementationTodoList({
  todos,
  qaTodos,
  progress,
  className,
}: {
  todos?: DeliveryTodoItem[] | null;
  qaTodos?: DeliveryTodoItem[] | null;
  progress?: { done: number; total: number; percent: number } | null;
  className?: string;
}) {
  if (!todos?.length && !qaTodos?.length) return null;

  return (
    <div className={cn('space-y-3 border-t border-border pt-3', className)}>
      {todos && todos.length > 0 && (
        <div className="space-y-1.5">
          <div className="flex items-center justify-between gap-2">
            <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
              Dev todos
            </p>
            {progress && (
              <span className="font-mono text-[10px] tabular-nums text-muted-foreground">
                {progress.done}/{progress.total}
              </span>
            )}
          </div>
          <ul className="max-h-[180px] space-y-1 overflow-y-auto">
            {todos.map((t) => (
              <li
                key={t.id}
                className={cn(
                  'rounded-md px-2 py-1.5 text-[11px] leading-snug',
                  t.status === 'done' && 'text-muted-foreground',
                  t.status === 'in_progress' && 'bg-primary/8 text-foreground',
                  t.status === 'failed' && 'bg-destructive/10 text-destructive',
                  t.status === 'pending' && 'text-muted-foreground/80',
                )}
                title={t.description || t.files?.join(', ')}
              >
                <span className="font-medium">{t.title}</span>
                <span className="ml-2 text-[10px] uppercase tracking-wide opacity-70">
                  {t.status.replace('_', ' ')}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {qaTodos && qaTodos.length > 0 && (
        <div className="space-y-1.5">
          <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
            QA todos
          </p>
          <ul className="max-h-[120px] space-y-1 overflow-y-auto">
            {qaTodos.map((t) => (
              <li
                key={t.id}
                className={cn(
                  'rounded-md px-2 py-1.5 text-[11px]',
                  t.status === 'done' ? 'text-muted-foreground' : 'text-muted-foreground/80',
                )}
              >
                {t.title}
                <span className="ml-2 text-[10px] uppercase opacity-70">{t.status}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
