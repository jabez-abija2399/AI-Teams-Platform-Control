'use client';

import { cn } from '@/lib/utils';
import {
  STACK_OPTIONS,
  type ProjectStackId,
} from '@/core/project-stack/stack-catalog';

interface StackSelectProps {
  value: ProjectStackId | null;
  onChange: (stack: ProjectStackId) => void;
  /** Compact for Mission Control / modals */
  compact?: boolean;
  disabled?: boolean;
  className?: string;
  /** Highlight detection suggestion (Preview change only) */
  suggestedId?: ProjectStackId | null;
}

/**
 * Shared Yacht Club stack picker — create form, Preview Change, and dialogs.
 * One component; options include Recommended / Default for non-tech users.
 */
export function StackSelect({
  value,
  onChange,
  compact,
  disabled,
  className,
  suggestedId,
}: StackSelectProps) {
  return (
    <div className={cn('flex flex-col gap-2', className)}>
      {STACK_OPTIONS.map((opt) => {
        const selected = value === opt.id;
        return (
          <button
            key={opt.id}
            type="button"
            disabled={disabled}
            onClick={() => onChange(opt.id)}
            className={cn(
              'rounded-xl border text-left transition-colors',
              compact ? 'px-3 py-2.5' : 'px-3.5 py-3',
              selected
                ? 'border-primary/45 bg-primary/8 shadow-sm'
                : 'border-border/80 bg-background hover:border-primary/30 hover:bg-primary/5',
              disabled && 'opacity-60',
            )}
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className={cn('font-semibold text-foreground', compact ? 'text-xs' : 'text-sm')}>
                {opt.label}
              </span>
              <div className="flex flex-wrap items-center gap-1">
                {opt.recommended && (
                  <span className="rounded bg-primary px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-primary-foreground">
                    Recommended
                  </span>
                )}
                {opt.isDefault && (
                  <span className="rounded border border-primary/30 bg-primary/10 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-primary">
                    Default
                  </span>
                )}
                {suggestedId === opt.id && !opt.recommended && (
                  <span className="rounded bg-muted px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-muted-foreground">
                    From files
                  </span>
                )}
                <span className="rounded bg-muted px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-muted-foreground">
                  {opt.speed}
                </span>
              </div>
            </div>
            <p className={cn('mt-1 text-muted-foreground', compact ? 'text-[10px]' : 'text-[11px]')}>
              {opt.plainLanguage}
            </p>
            {!compact && (
              <>
                <p className="mt-1 text-[10px] text-foreground/65">{opt.description}</p>
                <p className="mt-1.5 text-[10px] leading-relaxed text-foreground/70">{opt.honesty}</p>
              </>
            )}
          </button>
        );
      })}
    </div>
  );
}
