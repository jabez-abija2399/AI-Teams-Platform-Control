'use client';

import { useEffect } from 'react';
import { ErrorState } from '@/components/ui/error-state';
import { ROUTES } from '@/config/constants';

export default function ProjectsError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('[projects]', error);
  }, [error]);

  return (
    <ErrorState
      title="Couldn't load projects"
      description="We couldn't load your project list. Check your connection and try again."
      onRetry={reset}
      backHref={ROUTES.dashboard}
      backLabel="Dashboard"
    />
  );
}
