'use client';

import { AlertTriangle, Loader2, RefreshCw, Sparkles, Wallet } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { LiveGenerationState } from '@/core/company-orchestration/generation-status';
import { TokenStreamPanel } from './token-stream-panel';

/**
 * Live generation — prefers true SSE tokens from the model bus.
 */
export function LiveGenerationPanel({
  projectId,
  live,
  onRetry,
  retrying,
  activityLines,
}: {
  projectId?: string;
  live?: LiveGenerationState | null;
  onRetry?: () => void;
  retrying?: boolean;
  activityLines?: string[];
}) {
  const isWorkingLive =
    live && (live.kind === 'running' || live.kind === 'regenerating');

  if (!live || live.kind === 'idle' || live.kind === 'approval' || live.kind === 'completed') {
    if (activityLines && activityLines.length > 0 && live?.kind !== 'approval') {
      return (
        <div className="space-y-2.5 border-t border-border pt-4">
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Live activity
          </p>
          {activityLines.slice(0, 4).map((line, i) => (
            <div key={`${line}-${i}`} className="flex gap-3 text-sm text-muted-foreground">
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
      );
    }
    return null;
  }

  const isWorking = live.kind === 'running' || live.kind === 'regenerating';
  const isAlert =
    live.kind === 'stuck' ||
    live.kind === 'failed' ||
    live.kind === 'credits' ||
    live.kind === 'rate_limited';

  return (
    <div className="space-y-3">
      <div
        className={cn(
          'space-y-3 rounded-xl border p-4',
          isWorking && 'border-primary/20 bg-primary/5',
          live.kind === 'credits' && 'border-accent/30 bg-accent/5',
          (live.kind === 'stuck' || live.kind === 'rate_limited') &&
            'border-accent/25 bg-accent/5',
          live.kind === 'failed' && 'border-destructive/25 bg-destructive/5',
        )}
      >
        <div className="flex items-start gap-3">
          <div
            className={cn(
              'flex h-9 w-9 shrink-0 items-center justify-center rounded-xl',
              isWorking && 'bg-primary/15 text-primary',
              live.kind === 'credits' && 'bg-accent/15 text-accent',
              (live.kind === 'stuck' || live.kind === 'rate_limited') &&
                'bg-accent/15 text-accent',
              live.kind === 'failed' && 'bg-destructive/15 text-destructive',
            )}
          >
            {isWorking ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : live.kind === 'credits' ? (
              <Wallet className="h-4 w-4" />
            ) : (
              <AlertTriangle className="h-4 w-4" />
            )}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-sm font-semibold text-foreground">{live.title}</p>
              {isWorking && (
                <span className="inline-flex items-center gap-1 text-[11px] font-medium text-primary">
                  <Sparkles className="h-3 w-3" />
                  Generating
                </span>
              )}
            </div>
            {live.progressLabel && isWorking && (
              <p className="mt-1 text-[11px] font-medium text-primary/90">{live.progressLabel}</p>
            )}
            {!isWorking && (
              <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{live.message}</p>
            )}
            {live.kind === 'stuck' && (
              <p className="mt-2 text-xs text-muted-foreground">
                Generation went quiet. Use Retry — do not wait for looping status text.
              </p>
            )}
            {live.detail && (
              <p className="mt-1.5 text-[11px] text-muted-foreground">{live.detail}</p>
            )}
            {live.stuckSeconds != null && live.kind === 'stuck' && (
              <p className="mt-1 text-[11px] text-muted-foreground">
                Quiet for ~{live.stuckSeconds}s
              </p>
            )}
          </div>
        </div>

        {isAlert && live.canRetry && onRetry && (
          <Button
            type="button"
            variant={live.kind === 'failed' ? 'default' : 'outline'}
            className="h-10 w-full rounded-xl font-semibold"
            disabled={retrying}
            onClick={onRetry}
          >
            {retrying ? (
              <span className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                Resuming…
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <RefreshCw className="h-4 w-4" />
                {live.actionLabel || 'Retry generation'}
              </span>
            )}
          </Button>
        )}
      </div>

      {projectId && isWorkingLive && (
        <TokenStreamPanel
          projectId={projectId}
          active
          fallbackMessage={live.message}
        />
      )}

      {isWorking && activityLines && activityLines.length > 0 && (
        <div className="space-y-1.5 border-t border-border/60 pt-3">
          {activityLines.slice(0, 3).map((line, i) => (
            <p
              key={`${line}-${i}`}
              className={cn(
                'truncate text-xs',
                i === 0 ? 'text-foreground' : 'text-muted-foreground',
              )}
            >
              {line}
            </p>
          ))}
        </div>
      )}
    </div>
  );
}
