'use client';

import { ErrorState } from '@/components/ui/error-state';

export default function ProjectError({ reset }: { error: Error; reset: () => void }) {
  return <ErrorState onRetry={reset} description="Couldn't load this project. Please try again." />;
}
