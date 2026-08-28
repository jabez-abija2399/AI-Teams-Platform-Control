'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AgentAvatar } from '@/features/onboarding/components/agent-avatar';
import type { WorkflowProgress } from '@/ai/workflows/core/workflow.types';
import { cn } from '@/lib/utils';

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
    PENDING: 'bg-muted text-muted-foreground',
    RUNNING: 'bg-primary/15 text-primary border border-primary/30',
    COMPLETED: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30',
    FAILED: 'bg-destructive/15 text-destructive border border-destructive/30',
    PAUSED: 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30',
    CANCELLED: 'bg-muted text-muted-foreground',
  };

  return (
    <Card className="rounded-2xl border border-border/80 glass-card shadow-sm">
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-bold text-foreground">Workflow Progress</CardTitle>
      </CardHeader>
      <CardContent>
        {workflows.length === 0 ? (
          <p className="text-muted-foreground text-xs">No workflows running.</p>
        ) : (
          <div className="space-y-4">
            {workflows.map((wf) => (
              <div key={wf.workflowId} className="rounded-xl border border-border/70 glass-card p-4">
                <div className="mb-2.5 flex items-center justify-between">
                  <span className="text-xs font-bold text-foreground">Active Lifecycle</span>
                  <Badge variant="secondary" className={cn('rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider', statusColor[wf.status] ?? '')}>
                    {wf.status}
                  </Badge>
                </div>
                <div className="mb-3 h-1.5 w-full rounded-full bg-secondary/80 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-primary transition-all duration-500"
                    style={{ width: `${wf.percentComplete}%` }}
                  />
                </div>
                <div className="space-y-1.5">
                  {wf.steps.map((step, i) => (
                    <div
                      key={`${wf.workflowId}-step-${i}`}
                      className="flex items-center gap-2.5 rounded-lg px-2 py-1 text-xs transition-colors hover:bg-muted/40"
                    >
                      <AgentAvatar role={step.agentRole as 'CEO' | 'ARCHITECT' | 'DEVELOPER' | 'QA'} size="sm" />
                      <span className="text-xs font-medium text-foreground">
                        {step.name}
                      </span>
                      <span
                        className={cn(
                          'ml-auto h-2 w-2 rounded-full',
                          step.status === 'COMPLETED'
                            ? 'bg-emerald-500'
                            : step.status === 'RUNNING'
                              ? 'bg-primary animate-pulse'
                              : step.status === 'FAILED'
                                ? 'bg-destructive'
                                : 'bg-muted-foreground/30',
                        )}
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
