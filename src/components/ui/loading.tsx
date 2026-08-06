import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { CSSProperties } from 'react';

interface LoadingProps {
  className?: string;
  label?: string;
  /** Full-viewport centered (Mission Control / auth) */
  fullScreen?: boolean;
}

export function Loading({
  className,
  label = 'Loading…',
  fullScreen = false,
}: LoadingProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center gap-3',
        fullScreen ? 'h-dvh bg-background' : 'py-16',
        className,
      )}
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
        <Loader2 className="h-5 w-5 animate-spin" />
      </div>
      <p className="text-sm text-muted-foreground">{label}</p>
    </div>
  );
}

export function LoadingSpinner({ className }: { className?: string }) {
  return <Loader2 className={cn('h-4 w-4 animate-spin', className)} aria-hidden />;
}

/** Soft pulse block for skeletons */
export function Skeleton({
  className,
  style,
}: {
  className?: string;
  style?: CSSProperties;
}) {
  return (
    <div
      className={cn('animate-pulse rounded-md bg-muted-foreground/15', className)}
      style={style}
      aria-hidden
    />
  );
}
