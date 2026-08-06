'use client';

import { useEffect } from 'react';
import { ErrorState } from '@/components/ui/error-state';
import { ROUTES } from '@/config/constants';

export default function RootError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('[app]', error);
  }, [error]);

  return (
    <div className="min-h-dvh bg-background">
      <ErrorState
        title="Something went wrong"
        description="We hit an unexpected error. You can try again or return home."
        onRetry={reset}
        backHref={ROUTES.home}
        backLabel="Go home"
      />
    </div>
  );
}
