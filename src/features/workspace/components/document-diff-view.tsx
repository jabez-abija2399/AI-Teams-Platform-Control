'use client';

import { useMemo, useState } from 'react';
import { ArrowLeftRight, GitCompare } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatDocValue } from './document-reader';

export interface RevisionDiffData {
  title: string;
  feedback?: string;
  before: unknown;
  after: unknown;
}

function flattenLines(value: unknown): string[] {
  if (value == null) return ['(empty)'];
  if (typeof value === 'string') return value.split('\n');
  return formatDocValue(value).split('\n');
}

/**
 * Before → after diff for regenerated deliverables.
 */
export function DocumentDiffView({
  diff,
  className,
}: {
  diff: RevisionDiffData;
  className?: string;
}) {
  const [mode, setMode] = useState<'split' | 'unified'>('split');
  const beforeLines = useMemo(() => flattenLines(diff.before).slice(0, 120), [diff.before]);
  const afterLines = useMemo(() => flattenLines(diff.after).slice(0, 120), [diff.after]);

  const unified = useMemo(() => {
    const max = Math.max(beforeLines.length, afterLines.length);
    const rows: { kind: 'same' | 'add' | 'del' | 'change'; text: string }[] = [];
    for (let i = 0; i < max; i++) {
      const a = beforeLines[i];
      const b = afterLines[i];
      if (a === b && a != null) rows.push({ kind: 'same', text: a });
      else if (a != null && b == null) rows.push({ kind: 'del', text: a });
      else if (a == null && b != null) rows.push({ kind: 'add', text: b });
      else if (a !== b) {
        if (a) rows.push({ kind: 'del', text: a });
        if (b) rows.push({ kind: 'add', text: b });
      }
    }
    return rows.slice(0, 160);
  }, [beforeLines, afterLines]);

  return (
    <div className={cn('overflow-hidden rounded-xl border border-border bg-card', className)}>
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border px-3.5 py-2.5">
        <div className="flex min-w-0 items-center gap-2">
          <GitCompare className="h-4 w-4 shrink-0 text-primary" />
          <div className="min-w-0">
            <p className="truncate text-sm font-medium">Revision diff</p>
            <p className="truncate text-[11px] text-muted-foreground">
              {diff.title}
              {diff.feedback ? ` · “${diff.feedback.slice(0, 80)}”` : ''}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1 rounded-lg border border-border bg-muted/40 p-0.5">
          <button
            type="button"
            onClick={() => setMode('split')}
            className={cn(
              'rounded-md px-2 py-1 text-[11px] font-medium',
              mode === 'split' ? 'bg-background shadow-sm' : 'text-muted-foreground',
            )}
          >
            Split
          </button>
          <button
            type="button"
            onClick={() => setMode('unified')}
            className={cn(
              'rounded-md px-2 py-1 text-[11px] font-medium',
              mode === 'unified' ? 'bg-background shadow-sm' : 'text-muted-foreground',
            )}
          >
            Unified
          </button>
        </div>
      </div>

      {mode === 'split' ? (
        <div className="grid max-h-72 grid-cols-1 divide-y divide-border overflow-hidden md:grid-cols-2 md:divide-x md:divide-y-0">
          <div className="min-h-0 overflow-y-auto bg-destructive/[0.03]">
            <p className="sticky top-0 border-b border-border bg-card/95 px-3 py-1.5 text-[11px] font-medium uppercase tracking-wider text-muted-foreground backdrop-blur">
              Before
            </p>
            <pre className="whitespace-pre-wrap px-3 py-2 font-mono text-[11px] leading-relaxed text-foreground/90">
              {beforeLines.join('\n')}
            </pre>
          </div>
          <div className="min-h-0 overflow-y-auto bg-primary/[0.04]">
            <p className="sticky top-0 flex items-center gap-1.5 border-b border-border bg-card/95 px-3 py-1.5 text-[11px] font-medium uppercase tracking-wider text-muted-foreground backdrop-blur">
              After <ArrowLeftRight className="h-3 w-3" />
            </p>
            <pre className="whitespace-pre-wrap px-3 py-2 font-mono text-[11px] leading-relaxed text-foreground/90">
              {afterLines.join('\n')}
            </pre>
          </div>
        </div>
      ) : (
        <div className="max-h-72 overflow-y-auto font-mono text-[11px] leading-relaxed">
          {unified.map((row, i) => (
            <div
              key={`${row.kind}-${i}`}
              className={cn(
                'whitespace-pre-wrap border-l-2 px-3 py-0.5',
                row.kind === 'add' && 'border-primary bg-primary/5 text-foreground',
                row.kind === 'del' && 'border-destructive bg-destructive/5 text-muted-foreground line-through',
                row.kind === 'same' && 'border-transparent text-muted-foreground',
              )}
            >
              <span className="mr-2 inline-block w-3 text-muted-foreground/70">
                {row.kind === 'add' ? '+' : row.kind === 'del' ? '−' : ' '}
              </span>
              {row.text}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
