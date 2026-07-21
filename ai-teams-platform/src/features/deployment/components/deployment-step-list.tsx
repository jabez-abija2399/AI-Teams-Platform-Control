'use client';

import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Loading } from '@/components/ui/loading';
import {
  useDeploymentSteps,
  useDeploymentLogs,
} from '@/features/deployment/hooks/use-deployments';
import {
  CheckCircle,
  XCircle,
  Clock,
  Loader2,
  FileText,
} from 'lucide-react';

const STEP_STATUS_STYLES: Record<string, string> = {
  PENDING: 'bg-gray-100 text-gray-800',
  RUNNING: 'bg-blue-100 text-blue-800',
  SUCCESS: 'bg-green-100 text-green-800',
  FAILED: 'bg-red-100 text-red-800',
};

const STEP_STATUS_ICONS: Record<string, typeof CheckCircle> = {
  PENDING: Clock,
  RUNNING: Loader2,
  SUCCESS: CheckCircle,
  FAILED: XCircle,
};

const LOG_TYPE_STYLES: Record<string, string> = {
  INFO: 'text-blue-600',
  STEP: 'text-green-600',
  ERROR: 'text-red-600',
  WARN: 'text-yellow-600',
};

export function DeploymentStepList({ deploymentId }: { deploymentId: string }) {
  const { data: steps, isLoading: stepsLoading } = useDeploymentSteps(deploymentId);
  const { data: logs, isLoading: logsLoading } = useDeploymentLogs(deploymentId);
  const [showLogs, setShowLogs] = useState(false);

  if (stepsLoading || logsLoading) {
    return <Loading label="Loading step details..." />;
  }

  const stepItems = steps ?? [];
  const logItems = logs ?? [];

  return (
    <div className="space-y-3">
      <div className="space-y-1">
        {stepItems.map((step) => {
          const Icon = STEP_STATUS_ICONS[step.status] ?? Clock;
          return (
            <div key={step.id} className="flex items-center gap-2 rounded-md px-2 py-1.5">
              <Icon
                className={`h-3.5 w-3.5 shrink-0 ${
                  step.status === 'RUNNING' ? 'animate-spin' : ''
                }`}
              />
              <span className="text-sm flex-1">{step.name}</span>
              <Badge className={STEP_STATUS_STYLES[step.status] ?? ''}>
                {step.status}
              </Badge>
            </div>
          );
        })}
      </div>

      <div>
        <button
          onClick={() => setShowLogs(!showLogs)}
          className="text-muted-foreground hover:text-foreground flex items-center gap-1.5 text-xs font-medium transition-colors"
        >
          <FileText className="h-3 w-3" />
          {showLogs ? 'Hide' : 'Show'} Logs ({logItems.length})
        </button>

        {showLogs && logItems.length > 0 && (
          <div className="bg-muted mt-2 max-h-48 space-y-1 overflow-auto rounded-md p-2">
            {logItems.map((log) => (
              <div key={log.id} className="flex gap-2 text-xs">
                <span className="text-muted-foreground shrink-0 font-mono">
                  {new Date(log.timestamp).toLocaleTimeString()}
                </span>
                <span className={`shrink-0 font-medium ${LOG_TYPE_STYLES[log.type] ?? 'text-foreground'}`}>
                  [{log.type}]
                </span>
                <span className="text-foreground">{log.message}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
