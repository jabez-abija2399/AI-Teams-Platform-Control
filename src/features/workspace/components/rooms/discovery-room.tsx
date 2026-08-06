'use client';

import { useMemo } from 'react';
import { cn } from '@/lib/utils';
import { ApprovalDialog } from '../company/approval-dialog';
import { RoomHeader } from '../company/room-header';
import { ThinkingPanel } from '../company/thinking-panel';
import { usePipelineContext } from '../../hooks/use-pipeline';

interface DiscoveryRoomProps {
  projectId: string;
  projectName: string;
  projectDescription: string;
}

const THINKING_STEPS = [
  {
    label: 'Market Research',
    content: 'Analyzing market trends, competitor landscape, and growth opportunities for your business idea.',
    keywords: ['market', 'competitor', 'trend', 'research'],
  },
  {
    label: 'Business Model Analysis',
    content: 'Evaluating revenue streams, cost structure, and value proposition to ensure business viability.',
    keywords: ['revenue', 'cost', 'value', 'model'],
  },
  {
    label: 'User Persona Development',
    content: 'Identifying target users, their pain points, behaviors, and needs to shape the product direction.',
    keywords: ['user', 'persona', 'pain', 'behavior'],
  },
  {
    label: 'Technical Feasibility',
    content: 'Assessing technology requirements, integration needs, and implementation complexity.',
    keywords: ['technical', 'feasibility', 'architecture'],
  },
  {
    label: 'Risk Assessment',
    content: 'Evaluating potential risks, mitigation strategies, and success factors for your project.',
    keywords: ['risk', 'assessment', 'mitigation'],
  },
  {
    label: 'Product Specification',
    content: 'Compiling all findings into a comprehensive product specification document.',
    keywords: ['specification', 'document', 'compile'],
  },
];

function statusLabel(status: string): string {
  switch (status) {
    case 'active':
      return 'Working';
    case 'waiting':
      return 'Queued';
    case 'completed':
      return 'Done';
    case 'error':
      return 'Error';
    default:
      return 'Standby';
  }
}

export function DiscoveryRoom({
  projectName,
  projectDescription,
}: DiscoveryRoomProps) {
  const { state, approve } = usePipelineContext();
  const isComplete = state.phaseStatus === 'completed';
  const isApproval = state.phaseStatus === 'approval';
  const isActive = state.phaseStatus === 'running';

  const thinkingSteps = useMemo(() => {
    const stepCount = THINKING_STEPS.length;
    const completedSteps = Math.floor((state.progress / 100) * stepCount);
    const activeIdx = Math.min(completedSteps, stepCount - 1);

    return THINKING_STEPS.map((step, i) => {
      let status: 'completed' | 'active' | 'pending' = 'pending';
      if (i < completedSteps) status = 'completed';
      else if (i === activeIdx && state.progress > 0) status = 'active';
      return { ...step, status };
    });
  }, [state.progress]);

  const pipelineLines = useMemo(() => {
    const fromActivities = state.activities.slice(0, 3).map((a) => a.action);
    if (fromActivities.length > 0) return fromActivities;
    return THINKING_STEPS.slice(0, 3).map((s) => s.label);
  }, [state.activities]);

  const employees = state.employees.length
    ? state.employees.slice(0, 6).map((e) => ({
        role: `${e.name} · ${e.role}`,
        status: statusLabel(e.status),
        active: e.status === 'active',
      }))
    : [
        { role: 'CEO · Vision', status: isActive ? 'Working' : 'Standby', active: isActive },
        { role: 'Architect · System design', status: 'Standby', active: false },
        { role: 'Engineers · Implementation', status: 'Standby', active: false },
        { role: 'QA · Verification', status: 'Standby', active: false },
      ];

  return (
    <div className="flex h-full flex-col bg-background">
      <RoomHeader
        phaseNumber={1}
        totalPhases={12}
        title="Discovery Room"
        subtitle={
          isComplete
            ? 'CEO completed the analysis'
            : isApproval
              ? 'CEO needs your approval to proceed'
              : 'CEO is analyzing your business idea'
        }
        status={isComplete ? 'completed' : isApproval ? 'approval' : 'running'}
      />

      <div className="flex-1 overflow-auto p-4 sm:p-6">
        <div className="mx-auto grid max-w-6xl gap-5 lg:grid-cols-[1fr_1.15fr]">
          <div className="space-y-4">
            <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
              <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Project vision
              </p>
              <h3 className="font-heading mt-2 text-lg font-semibold">{projectName}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{projectDescription}</p>
            </div>

            <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
              <div className="border-b border-border bg-muted/40 px-4 py-3">
                <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  AI employees
                </p>
              </div>
              <div className="space-y-2.5 p-4">
                {employees.map((employee) => (
                  <div
                    key={employee.role}
                    className="flex items-center justify-between rounded-xl border border-border/80 bg-background px-3 py-2.5"
                  >
                    <span className="text-sm font-medium">{employee.role}</span>
                    <span
                      className={cn(
                        'text-[11px] font-medium',
                        employee.active ? 'animate-soft-pulse text-primary' : 'text-muted-foreground',
                      )}
                    >
                      {employee.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
              <div className="flex items-center justify-between border-b border-border bg-muted/40 px-4 py-3">
                <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Pipeline
                </p>
                <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-[11px] font-medium text-primary">
                  Discovery {state.progress}%
                </span>
              </div>
              <div className="space-y-4 p-5">
                <div className="h-2 overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full bg-primary transition-all"
                    style={{ width: `${state.progress}%` }}
                  />
                </div>
                <div className="space-y-2.5">
                  {pipelineLines.map((line, i) => (
                    <div key={`${line}-${i}`} className="flex gap-3 text-sm text-muted-foreground">
                      <span
                        className={cn(
                          'mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full',
                          i === 0 ? 'animate-soft-pulse bg-primary' : 'bg-brand-gray',
                        )}
                      />
                      <span className={i === 0 ? 'text-foreground' : undefined}>{line}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-border bg-card p-4 shadow-sm">
              <div className="mb-3 flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-sm">
                  👔
                </div>
                <div>
                  <span className="text-xs font-medium text-foreground">CEO AI</span>
                  <span className="ml-2 text-[10px] text-muted-foreground">
                    {isComplete
                      ? 'Analysis complete'
                      : isActive
                        ? 'Analyzing business opportunity'
                        : 'Waiting to start…'}
                  </span>
                </div>
              </div>
              <ThinkingPanel steps={thinkingSteps} isActive={isActive} />
            </div>

            {isApproval && state.approvalRequests[0] && (
              <ApprovalDialog
                request={state.approvalRequests[0]}
                onApprove={() =>
                  approve(state.approvalRequests[0]!.artifactName || 'PRODUCT_APPROVAL')
                }
                onRequestChanges={() => {}}
                onReject={() => {}}
              />
            )}

            {isComplete && (
              <div className="rounded-2xl border border-primary/20 bg-primary/5 p-4">
                <p className="text-sm font-medium text-primary">Analysis complete</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  The CEO finished business analysis and is ready for the next phase.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
