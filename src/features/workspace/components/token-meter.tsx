'use client';

import { Coins, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { CreditBalanceInfo, TokenUsageInfo } from '@/features/workspace/hooks/use-pipeline';

/**
 * Cursor-style token + credit meter for the Mission Control header.
 * Tokens = provider usage this session/project; Credits = remaining balance.
 */
export function TokenMeter({
  usage,
  credits,
  active,
  className,
}: {
  usage?: TokenUsageInfo | null;
  credits?: CreditBalanceInfo | null;
  active?: boolean;
  className?: string;
}) {
  const hasUsage = Boolean(usage);
  const hasCredits = credits?.balance != null;

  if (!hasUsage && !hasCredits) return null;

  const tokens = usage ? (active ? usage.sessionTokens : usage.totalTokens) : 0;
  const cost = usage ? (active ? usage.sessionCostUsd : usage.totalCostUsd) : 0;
  const label = active ? 'session' : 'project';
  const balance = credits?.balance;
  const low = Boolean(credits?.lowBalance) || (typeof balance === 'number' && balance <= 0);

  return (
    <div
      className={cn(
        'inline-flex items-center gap-2 rounded-lg border border-border/80 bg-background/80 px-2.5 py-1 font-mono text-[11px] tabular-nums text-muted-foreground',
        active && 'border-primary/25 bg-primary/5 text-foreground',
        low && 'border-destructive/30 bg-destructive/5 text-destructive',
        className,
      )}
      title={
        [
          hasCredits ? `Credits: ${balance}` : null,
          hasUsage ? `AI tokens (${label}): ${tokens.toLocaleString()}` : null,
        ]
          .filter(Boolean)
          .join(' · ')
      }
    >
      {active ? (
        <Zap className="h-3 w-3 animate-soft-pulse text-primary" />
      ) : (
        <Coins className={cn('h-3 w-3', low ? 'text-destructive' : 'text-muted-foreground')} />
      )}
      {hasCredits && (
        <span className={cn(low && 'font-semibold')}>
          {Number(balance).toLocaleString()}
          <span className="opacity-80"> cr</span>
        </span>
      )}
      {hasCredits && hasUsage && <span className="text-border">·</span>}
      {hasUsage && (
        <span>
          {tokens.toLocaleString()}
          <span className="opacity-80"> tok</span>
        </span>
      )}
      {hasUsage && cost > 0 && (
        <>
          <span className="text-border">·</span>
          <span>${cost < 0.01 ? cost.toFixed(4) : cost.toFixed(3)}</span>
        </>
      )}
    </div>
  );
}
