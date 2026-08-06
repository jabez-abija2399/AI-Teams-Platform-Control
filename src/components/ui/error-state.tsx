'use client';

import Link from 'next/link';
import { AlertTriangle, ArrowLeft, RefreshCw } from 'lucide-react';
import { Button, buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { ROUTES } from '@/config/constants';

interface ErrorStateProps {
  title?: string;
  description?: string;
  onRetry?: () => void;
  /** Optional secondary navigation */
  backHref?: string;
  backLabel?: string;
  className?: string;
  compact?: boolean;
}

export function ErrorState({
  title = 'Something went wrong',
  description = 'An unexpected error occurred. Please try again.',
  onRetry,
  backHref = ROUTES.projects,
  backLabel = 'Back to projects',
  className,
  compact = false,
}: ErrorStateProps) {
  return (
    <div
      role="alert"
      className={cn(
        'flex flex-col items-center justify-center text-center',
        compact
          ? 'rounded-2xl border border-destructive/20 bg-destructive/[0.04] px-6 py-10'
          : 'min-h-[50vh] px-4 py-16',
        className,
      )}
    >
      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-destructive/10 text-destructive">
        <AlertTriangle className="h-5 w-5" />
      </div>
      <h2 className="font-heading text-xl font-semibold tracking-tight">{title}</h2>
      <p className="mt-2 max-w-md text-sm leading-relaxed text-muted-foreground">{description}</p>
      <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
        {onRetry && (
          <Button onClick={onRetry} size="sm" className="gap-1.5 rounded-xl">
            <RefreshCw className="h-3.5 w-3.5" />
            Try again
          </Button>
        )}
        {backHref && (
          <Link
            href={backHref}
            className={cn(buttonVariants({ variant: 'outline', size: 'sm' }), 'gap-1.5 rounded-xl')}
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            {backLabel}
          </Link>
        )}
      </div>
    </div>
  );
}
