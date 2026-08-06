'use client';

import { useEffect } from 'react';
import { ErrorState } from '@/components/ui/error-state';
import { ROUTES } from '@/config/constants';

export default function WorkspaceError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('[workspace]', error);
  }, [error]);

  return (
    <div className="flex h-dvh items-center justify-center bg-background">
      <ErrorState
        title="Couldn't open workspace"
        description="Mission Control failed to load. Retry, or go back to your projects."
        onRetry={reset}
        backHref={ROUTES.projects}
        backLabel="Back to projects"
      />
    </div>
  );
}
