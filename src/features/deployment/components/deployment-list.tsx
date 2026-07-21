'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { Loading } from '@/components/ui/loading';
import { DeploymentStepList } from '@/features/deployment/components/deployment-step-list';
import {
  useDeployments,
  useExecuteDeployment,
} from '@/features/deployment/hooks/use-deployments';
import {
  Rocket,
  ChevronDown,
  ChevronRight,
  CheckCircle,
  XCircle,
  Clock,
  Loader2,
  AlertCircle,
} from 'lucide-react';
import type { DeploymentInfo } from '@/features/deployment/types';

const STATUS_STYLES: Record<string, string> = {
  PENDING: 'bg-gray-100 text-gray-800',
  RUNNING: 'bg-blue-100 text-blue-800',
  SUCCESS: 'bg-green-100 text-green-800',
  FAILED: 'bg-red-100 text-red-800',
  CANCELLED: 'bg-yellow-100 text-yellow-800',
};

const STATUS_ICONS: Record<string, typeof CheckCircle> = {
  PENDING: Clock,
  RUNNING: Loader2,
  SUCCESS: CheckCircle,
  FAILED: XCircle,
  CANCELLED: AlertCircle,
};

function DeploymentRow({
  deployment,
  onExpand,
  expanded,
  onExecute,
  isExecuting,
}: {
  deployment: DeploymentInfo;
  onExpand: () => void;
  expanded: boolean;
  onExecute: () => void;
  isExecuting: boolean;
}) {
  const Icon = STATUS_ICONS[deployment.status] ?? Clock;
  const progress =
    deployment.stepCount > 0
      ? Math.round((deployment.completedSteps / deployment.stepCount) * 100)
      : 0;

  return (
    <div className="rounded-lg border">
      <div
        className="flex cursor-pointer items-center justify-between px-3 py-2"
        onClick={onExpand}
      >
        <div className="flex items-center gap-3 min-w-0 flex-1">
          {expanded ? (
            <ChevronDown className="text-muted-foreground h-4 w-4 shrink-0" />
          ) : (
            <ChevronRight className="text-muted-foreground h-4 w-4 shrink-0" />
          )}
          <Icon
            className={`h-4 w-4 shrink-0 ${deployment.status === 'RUNNING' ? 'animate-spin' : ''}`}
          />
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <p className="text-sm font-medium truncate">
                {deployment.environmentName}
              </p>
              <Badge className={STATUS_STYLES[deployment.status] ?? ''}>
                {deployment.status}
              </Badge>
            </div>
            <p className="text-muted-foreground text-xs">
              {deployment.provider}
              {deployment.stepCount > 0 && ` · ${deployment.completedSteps}/${deployment.stepCount} steps`}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {deployment.status === 'PENDING' && (
            <Button
              variant="ghost"
              size="xs"
              onClick={(e) => {
                e.stopPropagation();
                onExecute();
              }}
              disabled={isExecuting}
            >
              <Rocket className="h-3 w-3" />
              Execute
            </Button>
          )}
          {deployment.stepCount > 0 && (
            <div className="bg-muted h-1.5 w-16 overflow-hidden rounded-full">
              <div
                className="h-full rounded-full bg-green-500 transition-all"
                style={{ width: `${progress}%` }}
              />
            </div>
          )}
        </div>
      </div>
      {expanded && (
        <div className="border-t px-3 py-3">
          <DeploymentStepList deploymentId={deployment.id} />
        </div>
      )}
    </div>
  );
}

export function DeploymentList({ projectId }: { projectId: string }) {
  const { data: deployments, isLoading } = useDeployments(projectId);
  const executeMutation = useExecuteDeployment();
  const [expandedId, setExpandedId] = useState<string | null>(null);

  if (isLoading) return <Loading label="Loading deployments..." />;

  const items = deployments ?? [];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm font-medium">Deployments</CardTitle>
      </CardHeader>
      <CardContent>
        {items.length === 0 ? (
          <EmptyState
            icon={Rocket}
            title="No deployments"
            description="Create a deployment to start deploying your application."
          />
        ) : (
          <div className="space-y-2">
            {items.map((deployment) => (
              <DeploymentRow
                key={deployment.id}
                deployment={deployment}
                expanded={expandedId === deployment.id}
                onExpand={() =>
                  setExpandedId(expandedId === deployment.id ? null : deployment.id)
                }
                onExecute={() => executeMutation.mutate(deployment.id)}
                isExecuting={executeMutation.isPending}
              />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
