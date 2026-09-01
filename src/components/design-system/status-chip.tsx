import { cn } from '@/lib/utils';

type ChipVariant = 'active' | 'done' | 'pending' | 'error' | 'warning' | 'neutral';

interface StatusChipProps {
  label: string;
  variant?: ChipVariant;
  dot?: boolean;
  className?: string;
}

const VARIANT_CLASSES: Record<ChipVariant, string> = {
  active:  'border-primary/30 bg-primary/10 text-primary',
  done:    'border-success/30 bg-success/10 text-success',
  pending: 'border-outline/60 bg-surface-container text-on-surface-variant',
  error:   'border-danger/30 bg-danger/10 text-danger',
  warning: 'border-warning/30 bg-warning/10 text-warning',
  neutral: 'border-outline-variant bg-surface-container text-on-surface-variant',
};

const DOT_VARIANT: Record<ChipVariant, string> = {
  active:  'bg-primary animate-pulse',
  done:    'bg-success',
  pending: 'bg-on-surface-variant/40',
  error:   'bg-danger',
  warning: 'bg-warning',
  neutral: 'bg-on-surface-variant/40',
};

export function StatusChip({ label, variant = 'neutral', dot = false, className }: StatusChipProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-sm border px-2 py-0.5',
        'font-mono text-[11px] font-medium tracking-wider uppercase',
        VARIANT_CLASSES[variant],
        className,
      )}
    >
      {dot && <span className={cn('h-1.5 w-1.5 rounded-full shrink-0', DOT_VARIANT[variant])} />}
      {label}
    </span>
  );
}
