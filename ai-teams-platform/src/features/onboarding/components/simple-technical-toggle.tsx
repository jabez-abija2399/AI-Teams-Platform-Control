'use client';

import { cn } from '@/lib/utils';

interface SimpleTechnicalToggleProps {
  isSimple: boolean;
  onToggle: () => void;
  className?: string;
}

export function SimpleTechnicalToggle({ isSimple, onToggle, className }: SimpleTechnicalToggleProps) {
  return (
    <button
      onClick={onToggle}
      className={cn(
        'inline-flex h-7 items-center rounded-full border bg-muted p-0.5 text-xs font-medium transition-colors',
        className,
      )}
    >
      <span
        className={cn(
          'rounded-full px-2.5 py-0.5 transition-colors',
          isSimple ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground',
        )}
      >
        Simple
      </span>
      <span
        className={cn(
          'rounded-full px-2.5 py-0.5 transition-colors',
          !isSimple ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground',
        )}
      >
        Technical
      </span>
    </button>
  );
}
