'use client';

import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  FileText,
  Code2,
  Loader2,
  Play,
  Rocket,
  Crown,
  ClipboardList,
  Cpu,
  ShieldCheck,
  Sparkles,
  CheckCircle2,
  Activity,
  ArrowRight,
} from 'lucide-react';
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
import { DeliverableChecklist } from './deliverable-checklist';
import { ImplementationTodoList } from './implementation-todo-list';
import type { DeliverableCheckItem } from '@/features/workspace/hooks/use-pipeline';

/**
 * Simplified Mission Control roster with icon metadata.
 */
export const COMPANY_ROSTER = [
  { key: 'ceo', label: 'CEO', sublabel: 'Vision & Strategy', icon: Crown, phases: ['discovery', 'strategy'] },
  {
    key: 'pm',
    label: 'Product Manager',
    sublabel: 'Requirements & Scope',
    icon: ClipboardList,
    phases: ['clarification', 'proposal', 'product', 'analysis', 'planning'],
  },
  {
    key: 'architect',
    label: 'Architect',
    sublabel: 'System Design & APIs',
    icon: Cpu,
    phases: ['architecture', 'design'],
  },
  {
    key: 'engineers',
    label: 'Developer Agent',
    sublabel: 'Implementation & Code',
    icon: Code2,
    phases: ['development'],
  },
  {
    key: 'qa',
    label: 'QA Engineer',
    sublabel: 'Verification & Quality',
    icon: ShieldCheck,
    phases: ['testing', 'review', 'security'],
  },
  {
    key: 'devops',
    label: 'DevOps & Cloud',
    sublabel: 'Release & Delivery',
    icon: Rocket,
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
 * Ultra-Modern Mission Control Board:
 * - High-contrast pipeline stepper with dynamic glowing nodes
 * - Polished AI Employee rail with active status pulses & role avatars
 * - Dynamic Main Stage with Decision Review & Real-time generation streaming
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
  deliverableChecklist,
  deliveryPlan,
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
  deliverableChecklist?: DeliverableCheckItem[] | null;
  deliveryPlan?: {
    implementationTodos?: Array<{
      id: string;
      title: string;
      description?: string;
      files?: string[];
      status: 'pending' | 'in_progress' | 'done' | 'failed';
    }>;
    qaTodos?: Array<{
      id: string;
      title: string;
      description?: string;
      status: 'pending' | 'in_progress' | 'done' | 'failed';
    }>;
    progress?: { done: number; total: number; percent: number };
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
  onOpenStudio?: (opts?: { focus?: 'preview' | 'deploy' | 'editor' | 'ai'; agentTab?: string }) => void;
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
        : ['Generation stalled — use Resume to continue this step']
      : activities.length > 0
        ? activities.slice(0, 5).map((a) => a.action)
        : [];

  const liveFallback =
    phaseStatus === 'failed'
      ? {
          kind: 'failed' as const,
          tone: 'error' as const,
          title: 'Pipeline stopped',
          message:
            'This step did not finish. Resume to continue from here — we never skip unfinished work.',
          canRetry: true,
          actionLabel: 'Resume pipeline',
        }
      : null;

  const activeEmployee =
    COMPANY_ROSTER.find((row) => rosterStatus(row, currentPhase, phaseStatus).active) || null;

  return (
    <div
      className={cn(
        'relative flex min-h-0 flex-1 flex-col overflow-hidden bg-background',
        'before:pointer-events-none before:absolute before:inset-0 before:bg-[radial-gradient(#245f73_1px,transparent_1px)] before:opacity-[0.04] before:bg-[size:24px_24px]',
        className,
      )}
    >
      {/* Top Header & Pipeline Stepper */}
      <div className="relative z-[1] shrink-0 border-b border-border/80 bg-card/60 backdrop-blur-md">
        <div className="flex items-center justify-between gap-4 px-4 py-3 lg:px-6">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2.5">
              <div className="flex items-center gap-2">
                <span className="font-heading text-sm font-bold tracking-tight text-foreground">
                  {phaseName}
                </span>
                <span className="rounded-md border border-primary/20 bg-primary/10 px-2 py-0.5 font-mono text-[11px] font-semibold text-primary">
                  {Math.round(progress)}%
                </span>
              </div>

              {!isWaiting && (
                <div
                  className={cn(
                    'inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-semibold tracking-wide shadow-xs',
                    phaseStatus === 'approval' && 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30',
                    phaseStatus === 'running' && 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30',
                    phaseStatus === 'completed' && 'bg-primary/15 text-primary border border-primary/30',
                    (phaseStatus === 'failed' || liveGeneration?.kind === 'credits') &&
                      'bg-destructive/15 text-destructive border border-destructive/30',
                    liveGeneration?.kind === 'stuck' && 'bg-amber-500/15 text-amber-600 border border-amber-500/30',
                  )}
                >
                  <span
                    className={cn(
                      'h-1.5 w-1.5 rounded-full',
                      phaseStatus === 'running' && 'animate-pulse bg-emerald-500',
                      phaseStatus === 'approval' && 'bg-amber-500',
                      phaseStatus === 'completed' && 'bg-primary',
                      phaseStatus === 'failed' && 'bg-destructive',
                    )}
                  />
                  <span>
                    {phaseStatus === 'approval'
                      ? 'Decision Required'
                      : phaseStatus === 'completed'
                        ? 'Completed'
                        : phaseStatus === 'failed' || liveGeneration?.kind === 'credits'
                          ? 'Needs Attention'
                          : liveGeneration?.kind === 'stuck'
                            ? 'Stalled'
                            : phaseStatus === 'running' || liveGeneration?.kind === 'regenerating'
                              ? 'Active Generation'
                              : 'Ready'}
                  </span>
                </div>
              )}

              {activeEmployee && phaseStatus === 'running' && (
                <span className="hidden items-center gap-1 text-xs text-muted-foreground sm:inline-flex">
                  <Activity className="h-3 w-3 text-emerald-500 animate-pulse" />
                  <span className="font-medium text-foreground">{activeEmployee.label}</span> is working
                </span>
              )}
            </div>

            {/* Dynamic Shimmer Progress Bar */}
            <div className="mt-2 h-1.5 max-w-md overflow-hidden rounded-full bg-secondary/80">
              <div
                className="h-full rounded-full bg-gradient-to-r from-primary to-primary/80 transition-all duration-500"
                style={{ width: `${Math.max(isWaiting ? 0 : 2, Math.min(100, progress))}%` }}
              />
            </div>
          </div>

          <div className="hidden shrink-0 items-center gap-2 xl:flex">
            <span className="text-xs font-semibold text-foreground/80">{projectName}</span>
            <span className="rounded-md border border-border bg-muted/50 px-2 py-0.5 font-mono text-[10px] text-muted-foreground">
              Autonomous
            </span>
          </div>
        </div>

        {/* 10-Phase Pipeline Stepper */}
        <div className="flex gap-1.5 overflow-x-auto px-4 pb-3 lg:px-6">
          {workflowSteps.map((step, idx) => {
            const status = workflowStepStatus(step, currentPhase, phaseStatus || 'waiting');
            return (
              <div key={step.id} className="flex shrink-0 items-center gap-1">
                {idx > 0 && (
                  <span
                    className={cn(
                      'mx-0.5 h-px w-3 sm:w-4 transition-colors',
                      status === 'pending' ? 'bg-border' : 'bg-primary/50',
                    )}
                  />
                )}
                <div
                  className={cn(
                    'flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-medium whitespace-nowrap transition-all',
                    status === 'active' && 'bg-primary text-primary-foreground shadow-sm ring-2 ring-primary/30',
                    status === 'done' && 'bg-secondary/60 text-secondary-foreground hover:bg-secondary',
                    status === 'pending' && 'text-muted-foreground/80 hover:text-foreground',
                  )}
                >
                  {status === 'done' && <CheckCircle2 className="h-3 w-3 text-primary" />}
                  {status === 'active' && <Sparkles className="h-3 w-3 animate-spin" />}
                  <span>{step.label}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Main Grid: AI Team Rail | Action Stage */}
      <div
        className={cn(
          'relative z-[1] grid min-h-0 flex-1 overflow-hidden',
          'grid-cols-1 md:grid-cols-[minmax(220px,260px)_minmax(0,1fr)] xl:grid-cols-[280px_minmax(0,1fr)]',
        )}
      >
        {/* Left AI Team Rail */}
        <aside className="flex min-h-0 flex-col gap-4 overflow-y-auto border-b border-border/80 bg-card/30 p-4 backdrop-blur-xs md:border-b-0 md:border-r lg:p-5">
          <div>
            <div className="flex items-center justify-between">
              <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                AI Engineering Team
              </p>
              <span className="text-[10px] font-semibold text-primary">5 Agents</span>
            </div>
            <p className="mt-0.5 text-[11px] text-muted-foreground">Live autonomous workforce</p>
          </div>

          <div className="space-y-2">
            {COMPANY_ROSTER.map((row) => {
              const status = rosterStatus(row, currentPhase, phaseStatus);
              const Icon = row.icon;
              const agentTabKey = row.key === 'engineers' ? 'developer' : row.key;
              return (
                <button
                  type="button"
                  key={row.key}
                  onClick={() => onOpenStudio?.({ focus: 'ai', agentTab: agentTabKey })}
                  title={`Click to open direct chat with ${row.label}`}
                  className={cn(
                    'group relative flex w-full items-center justify-between rounded-xl border p-3 text-left transition-all duration-200 cursor-pointer',
                    status.active
                      ? 'border-primary/40 bg-primary/10 shadow-md ring-1 ring-primary/30 glow-teal hover:bg-primary/15'
                      : 'border-border/60 bg-card/60 hover:border-primary/30 hover:bg-card/90 hover:shadow-sm',
                  )}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className={cn(
                        'flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border transition-all duration-200',
                        status.active
                          ? 'border-primary/40 bg-primary/20 text-primary shadow-xs'
                          : 'border-border/80 bg-secondary/80 text-muted-foreground group-hover:text-primary group-hover:border-primary/30 group-hover:bg-primary/5',
                      )}
                    >
                      <Icon className="h-4.5 w-4.5" />
                    </div>
                    <div className="min-w-0">
                      <p className={cn('truncate text-xs font-bold tracking-tight', status.active ? 'text-foreground' : 'text-muted-foreground group-hover:text-foreground')}>
                        {row.label}
                      </p>
                      <p className="truncate text-[10px] font-medium text-muted-foreground/80">{row.sublabel}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <span
                      className={cn(
                        'rounded-md px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wider transition-colors',
                        status.active && 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 animate-pulse border border-emerald-500/30',
                        status.label === 'Queued' && 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/20',
                        status.label === 'Done' && 'bg-primary/15 text-primary border border-primary/20',
                        status.label === 'Standby' && 'text-muted-foreground/60 border border-transparent',
                      )}
                    >
                      {status.label}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>

          <DeliverableChecklist items={deliverableChecklist} />
          <ImplementationTodoList
            todos={deliveryPlan?.implementationTodos}
            qaTodos={deliveryPlan?.qaTodos}
            progress={deliveryPlan?.progress}
          />

          {activityLines.length > 0 && (
            <div className="mt-auto space-y-2 border-t border-border/80 pt-4">
              <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                Activity Stream
              </p>
              {activityLines.slice(0, 3).map((line, i) => (
                <p
                  key={`${line}-${i}`}
                  className={cn(
                    'text-xs leading-snug',
                    i === 0 ? 'font-medium text-foreground' : 'text-muted-foreground',
                  )}
                >
                  {line}
                </p>
              ))}
            </div>
          )}
        </aside>

        {/* Right Stage: Decision Action Stage */}
        <section className="flex min-h-0 flex-col gap-4 overflow-y-auto p-4 lg:p-6">
          <div className="flex items-center gap-1.5 rounded-xl border border-border bg-card p-1 shadow-xs">
            <button
              type="button"
              onClick={() => setRightTab('now')}
              className={cn(
                'flex-1 rounded-lg px-4 py-2 text-xs font-semibold transition-all',
                rightTab === 'now'
                  ? 'bg-primary text-primary-foreground shadow-xs'
                  : 'text-muted-foreground hover:text-foreground',
              )}
            >
              {phaseStatus === 'approval' ? 'Review Deliverable' : isWaiting ? 'Start Pipeline' : 'Active Execution'}
            </button>
            <button
              type="button"
              onClick={() => setRightTab('deliverables')}
              className={cn(
                'flex-1 rounded-lg px-4 py-2 text-xs font-semibold transition-all',
                rightTab === 'deliverables'
                  ? 'bg-primary text-primary-foreground shadow-xs'
                  : 'text-muted-foreground hover:text-foreground',
              )}
            >
              <span className="inline-flex items-center justify-center gap-1.5">
                <FileText className="h-3.5 w-3.5" />
                Deliverables
                {docs.length > 0 && (
                  <span className="rounded-full bg-background/30 px-1.5 py-0.2 text-[10px] font-bold">
                    {docs.length}
                  </span>
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
                <div className="mx-auto w-full max-w-xl rounded-2xl border border-border bg-card p-6 shadow-sm sm:p-8">
                  <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <Play className="h-6 w-6 fill-current" />
                  </div>
                  <h2 className="font-heading text-xl font-bold tracking-tight text-foreground">
                    Launch AI Software Team
                  </h2>
                  <p className="mt-2 text-xs leading-relaxed text-muted-foreground sm:text-sm">
                    Click to start the autonomous pipeline. Your AI team will sequentially handle strategy, PRD, architecture, UI design, code implementation, and QA testing.
                  </p>
                  <Button
                    onClick={onStart}
                    disabled={starting}
                    size="lg"
                    className="mt-6 h-12 w-full rounded-xl font-bold shadow-md transition-all hover:shadow-lg active:scale-98"
                  >
                    {starting ? (
                      <span className="flex items-center gap-2">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Initiating Pipeline…
                      </span>
                    ) : (
                      <span className="flex items-center gap-2">
                        <Play className="h-4 w-4 fill-current" />
                        Start Autonomous Pipeline
                        <ArrowRight className="h-4 w-4 ml-1" />
                      </span>
                    )}
                  </Button>
                </div>
              )}

              {!isWaiting && phaseStatus === 'completed' && (
                <div className="mx-auto w-full max-w-xl rounded-2xl border border-primary/30 bg-primary/5 p-6 shadow-sm sm:p-8">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/20 text-primary">
                    <Rocket className="h-6 w-6" />
                  </div>
                  <h2 className="mt-4 font-heading text-xl font-bold tracking-tight text-foreground">
                    Product Delivery Complete
                  </h2>
                  <p className="mt-2 text-xs leading-relaxed text-muted-foreground sm:text-sm">
                    All 5 AI departments have verified and committed deliverables. Your project files are ready in the Studio IDE for live preview and deployment.
                  </p>
                  <div className="mt-6 flex flex-wrap gap-3">
                    {onOpenStudio && (
                      <Button
                        onClick={() => onOpenStudio({ focus: 'preview' })}
                        size="lg"
                        className="h-11 rounded-xl font-bold shadow-sm"
                      >
                        <Code2 className="mr-2 h-4 w-4" />
                        Open Studio IDE
                      </Button>
                    )}
                    <Button
                      type="button"
                      variant="outline"
                      size="lg"
                      className="h-11 rounded-xl font-bold"
                      onClick={() => setRightTab('deliverables')}
                    >
                      <FileText className="mr-2 h-4 w-4" />
                      View Deliverables
                    </Button>
                  </div>
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
