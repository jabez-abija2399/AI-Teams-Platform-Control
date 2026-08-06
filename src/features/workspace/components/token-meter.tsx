'use client';

import { Coins, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface TokenUsageInfo {
  totalTokens: number;
  totalCostUsd: number;
  sessionTokens: number;
  sessionCostUsd: number;
}

/**
 * Cursor-style token / credit meter for the Mission Control header.
 */
export function TokenMeter({
  usage,
  active,
  className,
}: {
  usage?: TokenUsageInfo | null;
  active?: boolean;
  className?: string;
}) {
  if (!usage) return null;

  const tokens = active ? usage.sessionTokens : usage.totalTokens;
  const cost = active ? usage.sessionCostUsd : usage.totalCostUsd;
  const label = active ? 'session' : 'project';

  return (
    <div
      className={cn(
        'inline-flex items-center gap-2 rounded-lg border border-border/80 bg-background/80 px-2.5 py-1 font-mono text-[11px] tabular-nums text-muted-foreground',
        active && 'border-primary/25 bg-primary/5 text-foreground',
        className,
      )}
      title={`AI usage (${label})`}
    >
      {active ? (
        <Zap className="h-3 w-3 animate-soft-pulse text-primary" />
      ) : (
        <Coins className="h-3 w-3 text-muted-foreground" />
      )}
      <span>
        {tokens.toLocaleString()}
        <span className="text-muted-foreground/80"> tok</span>
      </span>
      {cost > 0 && (
        <>
          <span className="text-border">·</span>
          <span>${cost < 0.01 ? cost.toFixed(4) : cost.toFixed(3)}</span>
        </>
      )}
    </div>
  );
}
