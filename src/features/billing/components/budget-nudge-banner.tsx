'use client';

import { useEffect, useState } from 'react';
import { AlertCircle, X } from 'lucide-react';

interface BudgetStatus {
  percentUsed: number;
  limitReached: boolean;
}

export function BudgetNudgeBanner({ organizationId }: { organizationId: string }) {
  const [status, setStatus] = useState<BudgetStatus | null>(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    fetch(`/api/billing/status?organizationId=${organizationId}`)
      .then((r) => r.json())
      .then((res) => res.success && setStatus(res.data))
      .catch(() => {});
  }, [organizationId]);

  if (!status || dismissed || status.percentUsed < 80) return null;

  return (
    <div className="flex items-center gap-2 border-b bg-amber-50 px-4 py-2 text-xs text-amber-900 dark:bg-amber-950/30 dark:text-amber-200">
      <AlertCircle className="h-3.5 w-3.5 shrink-0" />
      <span className="flex-1">
        {status.limitReached
          ? "You've reached your monthly AI usage limit. Some requests may be paused."
          : `You've used ${status.percentUsed}% of your monthly AI usage.`}
      </span>
      <button onClick={() => setDismissed(true)}>
        <X className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}
