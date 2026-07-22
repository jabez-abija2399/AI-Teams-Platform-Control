'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AgentAvatar } from '@/features/onboarding/components/agent-avatar';
import type { WorkflowProgress } from '@/ai/workflows/core/workflow.types';

interface WorkflowProgressProps {
  projectId: string;
}

export function WorkflowProgressCard({ projectId }: WorkflowProgressProps) {
  const [workflows, setWorkflows] = useState<WorkflowProgress[]>([]);

  useEffect(() => {
    async function fetchProgress() {
      try {
        const res = await fetch(`/api/projects/${projectId}/workflows`);
        if (res.ok) {
          const data = (await res.json()) as { workflows: WorkflowProgress[] };
          setWorkflows(data.workflows);
        }
      } catch {
        // ignore
      }
    }
    void fetchProgress();
    const interval = setInterval(() => void fetchProgress(), 5000);
    return () => clearInterval(interval);
  }, [projectId]);

  const statusColor: Record<string, string> = {
    PENDING: 'bg-gray-100 text-gray-800',
    RUNNING: 'bg-blue-100 text-blue-800',
    COMPLETED: 'bg-green-100 text-green-800',
    FAILED: 'bg-red-100 text-red-800',
    PAUSED: 'bg-yellow-100 text-yellow-800',
    CANCELLED: 'bg-gray-100 text-gray-800',
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Workflow Progress</CardTitle>
      </CardHeader>
      <CardContent>
        {workflows.length === 0 ? (
          <p className="text-muted-foreground text-sm">No workflows running.</p>
        ) : (
          <div className="space-y-4">
            {workflows.map((wf) => (
              <div key={wf.workflowId} className="rounded-lg border p-3">
                <div className="mb-2 flex items-center justify-between">
                  <span className="font-medium">Workflow</span>
                  <Badge variant="secondary" className={statusColor[wf.status] ?? ''}>
                    {wf.status}
                  </Badge>
                </div>
                <div className="mb-2 h-2 w-full rounded-full bg-gray-200">
                  <div
                    className="h-2 rounded-full bg-blue-600 transition-all"
                    style={{ width: `${wf.percentComplete}%` }}
                  />
                </div>
                <div className="space-y-1">
                  {wf.steps.map((step, i) => (
                    <div
                      key={`${wf.workflowId}-step-${i}`}
                      className="flex items-center gap-2 text-xs"
                    >
                      <AgentAvatar role={step.agentRole as 'CEO' | 'ARCHITECT' | 'DEVELOPER' | 'QA'} size="sm" />
                      <span className="text-muted-foreground">
                        {step.name}
                      </span>
                      <span
                        className={`ml-auto h-2 w-2 rounded-full ${
                          step.status === 'COMPLETED'
                            ? 'bg-green-500'
                            : step.status === 'RUNNING'
                              ? 'bg-blue-500'
                              : step.status === 'FAILED'
                                ? 'bg-red-500'
                                : 'bg-gray-300'
                        }`}
                      />
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
