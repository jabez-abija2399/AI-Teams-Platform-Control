'use client';

import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { FileText, Code2, Loader2, Play, Rocket } from 'lucide-react';
import type {
  PipelineActivity,
  PipelineApproval,
  PipelineArtifact,
  PipelinePhase,
  PendingDocument,
  LiveGenerationInfo,
} from '@/features/workspace/hooks/use-pipeline';
import { ApprovalReviewPanel } from './approval-review-panel';
import { LiveGenerationPanel } from './live-generation-panel';
import { DeliverablesPanel } from './deliverables-panel';

/**
 * Simplified Mission Control roster (landing + docs hierarchy).
 */
export const COMPANY_ROSTER = [
  { key: 'ceo', label: 'CEO · Vision', phases: ['discovery', 'strategy'] },
  {
    key: 'pm',
    label: 'Product Manager · Requirements',
    phases: ['clarification', 'proposal', 'product', 'analysis', 'planning'],
  },
  {
    key: 'architect',
    label: 'Architect · System design',
    phases: ['architecture', 'design'],
  },
  {
    key: 'engineers',
    label: 'Engineers · Implementation',
    phases: ['development'],
  },
  {
    key: 'qa',
    label: 'QA · Verification',
    phases: ['testing', 'review', 'security'],
  },
  {
    key: 'devops',
    label: 'DevOps · Release',
    phases: ['deployment'],
  },
] as const;

/**
 * Main workflow from doc/project-docs/05_WORKFLOWS.md
 */
export const DOC_WORKFLOW = [
  { id: 'idea', label: 'Idea', phases: ['discovery'] },
  {
    id: 'analysis',
    label: 'Analysis',
    phases: ['clarification', 'proposal', 'strategy', 'product', 'analysis'],
  },
  { id: 'planning', label: 'Planning', phases: ['planning'] },
  { id: 'architecture', label: 'Architecture', phases: ['architecture'] },
  { id: 'design', label: 'Design', phases: ['design'] },
  { id: 'development', label: 'Development', phases: ['development'] },
  { id: 'testing', label: 'Testing', phases: ['testing', 'review'] },
  { id: 'security', label: 'Security', phases: ['security'] },
  { id: 'preview', label: 'Preview', phases: ['deployment'] },
  { id: 'monitoring', label: 'Live', phases: ['completed'] },
] as const;

const PHASE_ORDER = [
  'discovery',
  'clarification',
  'proposal',
  'strategy',
  'product',
  'analysis',
  'planning',
  'architecture',
  'design',
  'development',
  'testing',
  'review',
  'security',
  'deployment',
  'completed',
] as const;

function rosterStatus(
  row: (typeof COMPANY_ROSTER)[number],
  currentPhase: string,
  phaseStatus: string,
): { label: 'Working' | 'Queued' | 'Standby' | 'Done'; active: boolean } {
  if (phaseStatus === 'waiting') return { label: 'Standby', active: false };
  if (currentPhase === 'completed') return { label: 'Done', active: false };

  if ((row.phases as readonly string[]).includes(currentPhase)) {
    if (phaseStatus === 'approval') {
      return { label: 'Queued', active: false };
    }
    return { label: 'Working', active: true };
  }

  const currentIdx = PHASE_ORDER.indexOf(currentPhase as (typeof PHASE_ORDER)[number]);
  const idxs = row.phases
    .map((p) => PHASE_ORDER.indexOf(p as (typeof PHASE_ORDER)[number]))
    .filter((i) => i >= 0);
  if (!idxs.length || currentIdx < 0) return { label: 'Standby', active: false };

  const first = Math.min(...idxs);
  const last = Math.max(...idxs);
  if (last < currentIdx) return { label: 'Done', active: false };
  if (phaseStatus === 'approval') {
    return last < currentIdx ? { label: 'Done', active: false } : { label: 'Standby', active: false };
  }
  if (first === currentIdx + 1) return { label: 'Queued', active: false };
  return { label: 'Standby', active: false };
}

function workflowStepStatus(
  step: (typeof DOC_WORKFLOW)[number],
  currentPhase: string,
  phaseStatus: string,
): 'active' | 'done' | 'pending' {
  if (phaseStatus === 'waiting') return 'pending';
  if (currentPhase === 'completed') {
    return step.id === 'monitoring' ? 'active' : 'done';
  }
  const currentIdx = PHASE_ORDER.indexOf(currentPhase as (typeof PHASE_ORDER)[number]);
  const stepIdxs = step.phases
    .map((p) => PHASE_ORDER.indexOf(p as (typeof PHASE_ORDER)[number]))
    .filter((i) => i >= 0);
  if (!stepIdxs.length || currentIdx < 0) return 'pending';
  const first = Math.min(...stepIdxs);
  const last = Math.max(...stepIdxs);
  if ((step.phases as readonly string[]).includes(currentPhase)) return 'active';
  if (last < currentIdx) return 'done';
  if (first > currentIdx) return 'pending';
  return 'pending';
}

function phaseDisplayName(phases: PipelinePhase[], currentPhase: string): string {
  const docStep = DOC_WORKFLOW.find((s) => (s.phases as readonly string[]).includes(currentPhase));
  if (docStep) return docStep.label;
  return phases.find((p) => p.id === currentPhase)?.name || currentPhase;
}

type RightTab = 'now' | 'deliverables';

/**
 * Cursor-style Mission Control:
 * - Full-width pipeline stepper (no empty middle column)
 * - Slim team rail (who is working)
 * - Main stage (what you do now)
 */
export function MissionControlBoard({
  projectId,
  projectName,
  currentPhase,
  phaseStatus,
  progress,
  phases,
  activities,
  artifacts,
  approvalRequests,
  pendingDocument,
  liveGeneration,
  revisionDiff,
  rightTab: controlledTab,
  onRightTabChange,
  onApprove,
  onRequestChanges,
  onRetryGeneration,
  onStart,
  starting,
  approving,
  regenerating,
  retrying,
  isWaiting,
  onOpenStudio,
  className,
}: {
  projectId?: string;
  projectName: string;
  currentPhase: string;
  phaseStatus: string;
  progress: number;
  phases: PipelinePhase[];
  activities: PipelineActivity[];
  artifacts?: PipelineArtifact[];
  approvalRequests: PipelineApproval[];
  pendingDocument?: PendingDocument | null;
  liveGeneration?: LiveGenerationInfo | null;
  revisionDiff?: {
    title: string;
    feedback?: string;
    before: unknown;
    after: unknown;
  } | null;
  rightTab?: RightTab;
  onRightTabChange?: (tab: RightTab) => void;
  onApprove?: (artifactName: string) => void;
  onRequestChanges?: (artifactName: string, comments: string) => void;
  onRetryGeneration?: () => void;
  onStart?: () => void;
  starting?: boolean;
  approving?: boolean;
  regenerating?: boolean;
  retrying?: boolean;
  isWaiting?: boolean;
  onOpenStudio?: (opts?: { focus?: 'preview' | 'deploy' }) => void;
  className?: string;
}) {
  const phaseName = phaseDisplayName(phases, currentPhase);
  const workflowSteps = DOC_WORKFLOW;
  const docs = artifacts ?? [];
  const [internalTab, setInternalTab] = useState<RightTab>('now');
  const rightTab = controlledTab ?? internalTab;
  const setRightTab = (tab: RightTab) => {
    onRightTabChange?.(tab);
    if (controlledTab === undefined) setInternalTab(tab);
  };

  useEffect(() => {
    if (phaseStatus === 'approval') setRightTab('now');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phaseStatus]);

  const activityLines =
    phaseStatus === 'failed' || liveGeneration?.kind === 'stuck'
      ? activities.length > 0
        ? activities.slice(0, 5).map((a) => a.action)
        : ['Generation stalled — use Retry to resume']
      : activities.length > 0
        ? activities.slice(0, 5).map((a) => a.action)
        : [];

  const liveFallback =
    phaseStatus === 'failed'
      ? {
          kind: 'failed' as const,
          tone: 'error' as const,
          title: 'Generation stopped',
          message: 'The pipeline stopped unexpectedly. You can retry from this step.',
          canRetry: true,
          actionLabel: 'Retry generation',
        }
      : null;

  const activeEmployee =
    COMPANY_ROSTER.find((row) => rosterStatus(row, currentPhase, phaseStatus).active) || null;

  return (
    <div
      className={cn(
        'relative flex min-h-0 flex-1 flex-col overflow-hidden bg-card',
        'before:pointer-events-none before:absolute before:inset-0 before:bg-[linear-gradient(to_right,rgba(36,95,115,0.03)_1px,transparent_1px),linear-gradient(to_bottom,rgba(36,95,115,0.03)_1px,transparent_1px)] before:bg-[size:28px_28px]',
        className,
      )}
    >
      {/* Status + full-width pipeline stepper (kills empty middle column) */}
      <div className="relative z-[1] shrink-0 border-b border-border/80 bg-background/80 backdrop-blur-sm">
        <div className="flex items-center gap-3 px-4 py-2.5 lg:px-6">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <p className="truncate font-heading text-sm font-semibold tracking-tight text-foreground">
                {phaseName}
                <span className="ml-2 font-mono text-[12px] font-normal text-muted-foreground">
                  {Math.round(progress)}%
                </span>
              </p>
              {!isWaiting && (
                <span
                  className={cn(
                    'shrink-0 rounded-md px-2 py-0.5 text-[11px] font-medium',
                    phaseStatus === 'approval' && 'bg-accent/15 text-accent',
                    phaseStatus === 'running' && 'bg-primary/10 text-primary',
                    phaseStatus === 'completed' && 'bg-primary/10 text-primary',
                    (phaseStatus === 'failed' || liveGeneration?.kind === 'credits') &&
                      'bg-destructive/10 text-destructive',
                    liveGeneration?.kind === 'stuck' && 'bg-accent/15 text-accent',
                  )}
                >
                  {phaseStatus === 'approval'
                    ? 'Needs your decision'
                    : phaseStatus === 'completed'
                      ? 'Complete'
                      : phaseStatus === 'failed' || liveGeneration?.kind === 'credits'
                        ? 'Needs attention'
                        : liveGeneration?.kind === 'stuck'
                          ? 'Stalled'
                          : phaseStatus === 'running' || liveGeneration?.kind === 'regenerating'
                            ? 'Live'
                            : 'Ready'}
                </span>
              )}
              {activeEmployee && phaseStatus === 'running' && (
                <span className="hidden text-[11px] text-muted-foreground sm:inline">
                  {activeEmployee.label.split('·')[0]?.trim()} working
                </span>
              )}
            </div>
            <div className="mt-1.5 h-1 max-w-md overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-primary transition-all duration-500"
                style={{ width: `${Math.max(isWaiting ? 0 : 2, Math.min(100, progress))}%` }}
              />
            </div>
          </div>
          <p className="hidden truncate text-xs text-muted-foreground xl:block">{projectName}</p>
        </div>

        {/* Single pipeline story — where we are in the company workflow */}
        <div className="flex gap-1 overflow-x-auto px-4 pb-3 lg:px-6">
          {workflowSteps.map((step, idx) => {
            const status = workflowStepStatus(step, currentPhase, phaseStatus || 'waiting');
            return (
              <div key={step.id} className="flex shrink-0 items-center gap-1">
                {idx > 0 && (
                  <span
                    className={cn(
                      'mx-0.5 h-px w-3 sm:w-4',
                      status === 'pending' ? 'bg-border' : 'bg-primary/40',
                    )}
                  />
                )}
                <div
                  className={cn(
                    'rounded-md px-2 py-1 text-[11px] font-medium whitespace-nowrap',
                    status === 'active' && 'bg-primary text-primary-foreground shadow-sm',
                    status === 'done' && 'bg-muted text-foreground/70',
                    status === 'pending' && 'text-muted-foreground',
                  )}
                >
                  {step.label}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Two columns only: Team | Main work */}
      <div
        className={cn(
          'relative z-[1] grid min-h-0 flex-1 overflow-hidden',
          'grid-cols-1',
          'md:grid-cols-[minmax(200px,240px)_minmax(0,1fr)]',
          'xl:grid-cols-[260px_minmax(0,1fr)]',
        )}
      >
        {/* Slim team rail — who is working (not a second pipeline) */}
        <aside className="flex min-h-0 flex-col gap-3 overflow-y-auto border-b border-border p-4 md:border-b-0 md:border-r lg:p-5">
          <div>
            <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
              Team
            </p>
            <p className="mt-0.5 text-[11px] text-muted-foreground">Who owns the current step</p>
          </div>

          <div className="space-y-1.5">
            {COMPANY_ROSTER.map((row) => {
              const status = rosterStatus(row, currentPhase, phaseStatus);
              return (
                <div
                  key={row.key}
                  className={cn(
                    'flex items-center justify-between rounded-lg px-2.5 py-2 transition-colors',
                    status.active
                      ? 'bg-primary/8 text-foreground'
                      : 'text-muted-foreground hover:bg-muted/40',
                  )}
                >
                  <span className={cn('text-sm', status.active && 'font-medium text-foreground')}>
                    {row.label}
                  </span>
                  <span
                    className={cn(
                      'text-[10px] font-medium uppercase tracking-wide',
                      status.active ? 'animate-soft-pulse text-primary' : 'text-muted-foreground/80',
                    )}
                  >
                    {status.label}
                  </span>
                </div>
              );
            })}
          </div>

          {activityLines.length > 0 && (
            <div className="mt-auto space-y-2 border-t border-border pt-3">
              <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                Activity
              </p>
              {activityLines.slice(0, 3).map((line, i) => (
                <p
                  key={`${line}-${i}`}
                  className={cn(
                    'text-xs leading-snug',
                    i === 0 ? 'text-foreground' : 'text-muted-foreground',
                  )}
                >
                  {line}
                </p>
              ))}
            </div>
          )}
        </aside>

        {/* Main stage — the only place decisions happen */}
        <section className="flex min-h-0 flex-col gap-3 overflow-y-auto p-4 lg:p-6">
          <div className="flex items-center gap-1 rounded-lg border border-border bg-muted/40 p-0.5">
            <button
              type="button"
              onClick={() => setRightTab('now')}
              className={cn(
                'flex-1 rounded-md px-3 py-1.5 text-xs font-medium transition-colors',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40',
                rightTab === 'now'
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground',
              )}
            >
              {phaseStatus === 'approval' ? 'Review' : isWaiting ? 'Start' : 'Now'}
            </button>
            <button
              type="button"
              onClick={() => setRightTab('deliverables')}
              className={cn(
                'flex-1 rounded-md px-3 py-1.5 text-xs font-medium transition-colors',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40',
                rightTab === 'deliverables'
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground',
              )}
            >
              <span className="inline-flex items-center gap-1.5">
                <FileText className="h-3 w-3" />
                Deliverables
                {docs.length > 0 && (
                  <span className="tabular-nums text-muted-foreground">({docs.length})</span>
                )}
              </span>
            </button>
          </div>

          {rightTab === 'deliverables' ? (
            <DeliverablesPanel
              projectId={projectId}
              artifacts={docs}
              className="min-h-0 flex-1"
            />
          ) : (
            <>
              {isWaiting && onStart && (
                <div className="mx-auto w-full max-w-xl rounded-2xl border border-border/80 bg-background/90 p-6 shadow-sm lg:p-8">
                  <p className="font-heading text-xl font-semibold tracking-tight text-foreground">
                    Ready when you are
                  </p>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                    Start the AI company. Pipeline progress stays on top; this panel is only for
                    decisions — start, review docs, approve, or request changes.
                  </p>
                  <p className="mt-3 text-[11px] text-muted-foreground">
                    <kbd className="rounded border border-border bg-muted px-1 py-0.5 font-mono text-[10px]">
                      ⌘K
                    </kbd>{' '}
                    opens commands anytime.
                  </p>
                  <Button
                    onClick={onStart}
                    disabled={starting}
                    size="lg"
                    className="mt-6 h-11 w-full rounded-xl font-semibold shadow-sm sm:w-auto sm:min-w-[220px]"
                  >
                    {starting ? (
                      <span className="flex items-center gap-2">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Starting…
                      </span>
                    ) : (
                      <span className="flex items-center gap-2">
                        <Play className="h-4 w-4" />
                        Start building
                      </span>
                    )}
                  </Button>
                </div>
              )}

              {!isWaiting && phaseStatus === 'completed' && (
                <div className="mx-auto w-full max-w-xl rounded-2xl border border-primary/20 bg-primary/[0.04] p-6 shadow-sm lg:p-8">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/15 text-primary">
                    <Rocket className="h-5 w-5" />
                  </div>
                  <p className="mt-4 font-heading text-xl font-semibold tracking-tight text-foreground">
                    Delivery complete
                  </p>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                    Opening Studio with live Preview. Files are in Explorer — edit, run, then
                    deploy only when you choose.
                  </p>
                  <div className="mt-6 flex flex-wrap gap-2">
                    {onOpenStudio && (
                      <Button
                        onClick={() => onOpenStudio({ focus: 'preview' })}
                        size="lg"
                        className="h-11 rounded-xl font-semibold shadow-sm"
                      >
                        <Code2 className="mr-2 h-4 w-4" />
                        Open Studio + Preview
                      </Button>
                    )}
                    {onOpenStudio && (
                      <Button
                        type="button"
                        variant="outline"
                        size="lg"
                        className="h-11 rounded-xl font-semibold border-accent/40 text-accent hover:bg-accent/10"
                        onClick={() => onOpenStudio({ focus: 'deploy' })}
                      >
                        <Rocket className="mr-2 h-4 w-4" />
                        Deploy
                      </Button>
                    )}
                    <Button
                      type="button"
                      variant="outline"
                      size="lg"
                      className="h-11 rounded-xl font-semibold"
                      onClick={() => setRightTab('deliverables')}
                    >
                      <FileText className="mr-2 h-4 w-4" />
                      View deliverables
                    </Button>
                  </div>
                  <p className="mt-4 text-[11px] text-muted-foreground">
                    Preview opens automatically · Deploy is always a deliberate click (never auto)
                  </p>
                </div>
              )}

              {!isWaiting && phaseStatus !== 'approval' && phaseStatus !== 'completed' && (
                <div className="mx-auto w-full max-w-2xl space-y-4">
                  <LiveGenerationPanel
                    projectId={projectId}
                    live={liveGeneration || liveFallback}
                    activityLines={activityLines}
                    onRetry={onRetryGeneration}
                    retrying={retrying}
                  />
                </div>
              )}

              {phaseStatus === 'approval' &&
                (approvalRequests[0] || pendingDocument) &&
                onApprove &&
                onRequestChanges && (
                  <div className="mx-auto min-h-0 w-full max-w-2xl flex-1">
                    <ApprovalReviewPanel
                      approvalTitle={
                        approvalRequests[0]?.title ||
                        pendingDocument?.title ||
                        'Approval required'
                      }
                      document={pendingDocument ?? null}
                      revisionDiff={revisionDiff}
                      approving={approving}
                      regenerating={regenerating}
                      onApprove={() =>
                        onApprove(
                          approvalRequests[0]?.artifactName ||
                            approvalRequests[0]?.title ||
                            pendingDocument?.type ||
                            'Architecture Approval',
                        )
                      }
                      onRequestChanges={(comments) =>
                        onRequestChanges(
                          approvalRequests[0]?.artifactName ||
                            approvalRequests[0]?.title ||
                            pendingDocument?.type ||
                            'Architecture Approval',
                          comments,
                        )
                      }
                    />
                  </div>
                )}
            </>
          )}
        </section>
      </div>
    </div>
  );
}
