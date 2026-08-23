'use client';

import Link from 'next/link';
import { AlertTriangle, Loader2, RefreshCw, Sparkles, Wallet, KeyRound, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { LiveGenerationState } from '@/core/company-orchestration/generation-status';
import { TokenStreamPanel } from './token-stream-panel';
import { ROUTES } from '@/config/constants';

/**
 * Live generation panel for Mission Control:
 * - Real-time SSE token streaming
 * - High-visibility token/credits exhaustion alerts with one-click Settings link & Resume button
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
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Live Activity
          </p>
          {activityLines.slice(0, 4).map((line, i) => (
            <div key={`${line}-${i}`} className="flex gap-3 text-sm text-muted-foreground">
              <span
                className={cn(
                  'mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full',
                  i === 0 ? 'animate-soft-pulse bg-primary' : 'bg-muted-foreground/40',
                )}
              />
              <span className={i === 0 ? 'font-medium text-foreground' : undefined}>{line}</span>
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
    <div className="space-y-4">
      <div
        className={cn(
          'space-y-4 rounded-2xl border p-5 shadow-sm transition-all',
          isWorking && 'border-primary/30 bg-primary/[0.04]',
          live.kind === 'credits' && 'border-amber-500/40 bg-amber-500/[0.06]',
          (live.kind === 'stuck' || live.kind === 'rate_limited') &&
            'border-amber-500/30 bg-amber-500/[0.04]',
          live.kind === 'failed' && 'border-destructive/40 bg-destructive/[0.06]',
        )}
      >
        <div className="flex items-start gap-3.5">
          <div
            className={cn(
              'flex h-10 w-10 shrink-0 items-center justify-center rounded-xl',
              isWorking && 'bg-primary/15 text-primary',
              live.kind === 'credits' && 'bg-amber-500/20 text-amber-600 dark:text-amber-400',
              (live.kind === 'stuck' || live.kind === 'rate_limited') &&
                'bg-amber-500/15 text-amber-600 dark:text-amber-400',
              live.kind === 'failed' && 'bg-destructive/20 text-destructive',
            )}
          >
            {isWorking ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : live.kind === 'credits' ? (
              <Wallet className="h-5 w-5" />
            ) : (
              <AlertTriangle className="h-5 w-5" />
            )}
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <p className="font-heading text-sm font-bold text-foreground">{live.title}</p>
              {isWorking && (
                <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-primary">
                  <Sparkles className="h-3 w-3 animate-spin" />
                  Generating…
                </span>
              )}
            </div>

            {live.progressLabel && isWorking && (
              <p className="mt-1 text-xs font-semibold text-primary">{live.progressLabel}</p>
            )}

            {!isWorking && (
              <p className="mt-1.5 text-xs leading-relaxed text-foreground/90 font-medium">
                {live.message}
              </p>
            )}

            {live.kind === 'credits' && (
              <div className="mt-3 space-y-2 rounded-xl border border-amber-500/30 bg-background/80 p-3 text-xs text-foreground">
                <p className="font-semibold text-amber-600 dark:text-amber-400">
                  How to fix:
                </p>
                <ul className="list-inside list-disc space-y-1 text-muted-foreground">
                  <li>Top up your credit balance on your AI provider dashboard (OpenAI, Anthropic, Gemini, Groq).</li>
                  <li>Or update your API key in Platform Settings.</li>
                </ul>
                <Link
                  href={ROUTES.settings}
                  className="mt-2 inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:underline"
                >
                  <KeyRound className="h-3.5 w-3.5" />
                  Go to AI Provider Settings
                  <ArrowRight className="h-3 w-3" />
                </Link>
              </div>
            )}

            {live.detail && (
              <p className="mt-2 rounded-md bg-muted/60 px-2.5 py-1 font-mono text-[11px] text-muted-foreground break-all">
                {live.detail}
              </p>
            )}
          </div>
        </div>

        {isAlert && live.canRetry && onRetry && (
          <div className="flex flex-wrap items-center gap-2 pt-1">
            <Button
              type="button"
              variant={live.kind === 'failed' || live.kind === 'credits' ? 'default' : 'outline'}
              className="h-10 w-full sm:w-auto font-bold rounded-xl shadow-xs"
              disabled={retrying}
              onClick={onRetry}
            >
              {retrying ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Resuming Pipeline…
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <RefreshCw className="h-4 w-4" />
                  {live.actionLabel || 'Resume Pipeline'}
                </span>
              )}
            </Button>
          </div>
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
        <div className="space-y-1.5 border-t border-border/80 pt-3">
          {activityLines.slice(0, 3).map((line, i) => (
            <p
              key={`${line}-${i}`}
              className={cn(
                'truncate text-xs',
                i === 0 ? 'font-semibold text-foreground' : 'text-muted-foreground',
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
