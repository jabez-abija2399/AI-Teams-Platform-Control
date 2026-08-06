'use client';

import { useEffect } from 'react';
import { ErrorState } from '@/components/ui/error-state';
import { ROUTES } from '@/config/constants';

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('[dashboard]', error);
  }, [error]);

  return (
    <ErrorState
      title="Couldn't load dashboard"
      description="Something went wrong while loading this page. Try again or go back to projects."
      onRetry={reset}
      backHref={ROUTES.projects}
      backLabel="Projects"
    />
  );
}
