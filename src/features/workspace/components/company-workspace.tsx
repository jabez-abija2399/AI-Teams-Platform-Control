'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Building2, Code2, Command, Loader2, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import { PipelineProvider, usePipelineContext } from '../components/pipeline-provider';
import { MissionControlBoard } from './mission-control-board';
import { TokenMeter } from './token-meter';
import { MissionControlStackBadge } from './mission-control-stack-badge';
import {
  MissionCommandPalette,
  type CommandActionId,
} from './mission-command-palette';

import type { StudioOpenOptions } from '../types/studio.types';

interface CompanyWorkspaceProps {
  projectId: string;
  projectName: string;
  projectDescription: string;
  userName: string;
  onOpenStudio?: (opts?: StudioOpenOptions) => void;
}

function CompanyWorkspaceInner({
  projectId,
  projectName,
  projectDescription,
  userName,
  onOpenStudio,
}: CompanyWorkspaceProps) {
  const { state, loading, error, connectionStatus, refresh, approve, requestChanges, retryGeneration } =
    usePipelineContext();
  const [starting, setStarting] = useState(false);
  const [approving, setApproving] = useState(false);
  const [regenerating, setRegenerating] = useState(false);
  const [retrying, setRetrying] = useState(false);
  const [startError, setStartError] = useState<string | null>(null);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [rightTab, setRightTab] = useState<'now' | 'deliverables'>('now');
  const autoStudioSent = useRef(false);
  const prevPhaseStatus = useRef<string | null>(null);

  useEffect(() => {
    autoStudioSent.current = false;
    prevPhaseStatus.current = null;
  }, [projectId]);

  // Auto-open Studio only when we *transition* into Complete this session — not when
  // reopening an already-finished project (that felt like being yanked away from Mission Control).
  useEffect(() => {
    const prev = prevPhaseStatus.current;
    prevPhaseStatus.current = state.phaseStatus;
    if (!onOpenStudio) return;
    if (state.phaseStatus !== 'completed') return;
    // First hydrate already completed → stay on Mission Control; user opens Studio manually.
    if (prev === null || prev === 'completed') return;
    if (autoStudioSent.current) return;
    const key = `studio-auto-open:${projectId}`;
    try {
      if (sessionStorage.getItem(key) === '1') {
        autoStudioSent.current = true;
        return;
      }
    } catch {
      /* ignore */
    }
    autoStudioSent.current = true;
    const t = window.setTimeout(() => {
      try {
        sessionStorage.setItem(key, '1');
      } catch {
        /* ignore */
      }
      onOpenStudio({ focus: 'preview' });
    }, 900);
    return () => window.clearTimeout(t);
  }, [state.phaseStatus, onOpenStudio, projectId]);

  // Only brand-new projects (CREATED) show Start — never after leave/return mid-pipeline.
  const isWaiting = state.canStart === true;
  const isGenerating =
    state.phaseStatus === 'running' || state.liveGeneration?.kind === 'regenerating';
  const activeAgents = state.employees.filter((e) => e.status === 'active').length;

  const statusLabel =
    isGenerating
      ? state.liveGeneration?.title || 'Working'
      : state.phaseStatus === 'approval'
        ? 'Your approval needed'
        : state.phaseStatus === 'failed' ||
            state.liveGeneration?.kind === 'credits' ||
            state.liveGeneration?.kind === 'stuck'
          ? state.liveGeneration?.title || 'Needs attention'
          : state.phaseStatus === 'completed'
            ? 'Done'
            : 'Ready';

  const handleStartPipeline = async () => {
    setStarting(true);
    setStartError(null);
    try {
      const res = await fetch(`/api/projects/${projectId}/lifecycle/start`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userIdea: projectDescription || projectName,
        }),
      });
      const body = await res.json().catch(() => null);
      if (!res.ok) {
        throw new Error(body?.error?.message || `Could not start (${res.status})`);
      }
      await refresh();
      setTimeout(refresh, 1500);
      setTimeout(refresh, 4000);
    } catch (err) {
      setStartError(err instanceof Error ? err.message : 'Could not start the pipeline');
    } finally {
      setStarting(false);
    }
  };

  const handleApprove = async (artifact: string) => {
    setApproving(true);
    setStartError(null);
    try {
      await approve(artifact);
      setTimeout(refresh, 1200);
      setTimeout(refresh, 3500);
    } catch (err) {
      setStartError(err instanceof Error ? err.message : 'Could not approve');
    } finally {
      setApproving(false);
    }
  };

  const handleRequestChanges = async (artifact: string, comments: string) => {
    setRegenerating(true);
    setStartError(null);
    try {
      await requestChanges(artifact, comments);
      setTimeout(refresh, 1200);
      setTimeout(refresh, 3500);
      setTimeout(refresh, 7000);
    } catch (err) {
      setStartError(err instanceof Error ? err.message : 'Could not regenerate');
    } finally {
      setRegenerating(false);
    }
  };

  const handleRetryGeneration = async () => {
    setRetrying(true);
    setStartError(null);
    try {
      await retryGeneration();
      setTimeout(refresh, 1000);
      setTimeout(refresh, 3000);
    } catch (err) {
      setStartError(err instanceof Error ? err.message : 'Could not resume generation');
    } finally {
      setRetrying(false);
    }
  };

  const runCommand = (id: CommandActionId) => {
    if (id === 'studio') {
      onOpenStudio?.({ focus: 'preview' });
      return;
    }
    if (id === 'deliverables') {
      setRightTab('deliverables');
      return;
    }
    if (id === 'review' || id === 'approve') {
      setRightTab('now');
      if (id === 'approve' && state.approvalRequests[0]) {
        void handleApprove(
          state.approvalRequests[0].artifactName || state.approvalRequests[0].id,
        );
      }
      return;
    }
    if (id === 'retry') void handleRetryGeneration();
    if (id === 'start') void handleStartPipeline();
  };

  if (loading) {
    return (
      <div className="flex h-dvh items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <Loader2 className="h-6 w-6 animate-spin" />
          </div>
          <p className="font-heading text-lg font-semibold tracking-tight">
            Opening Mission Control…
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-dvh flex-col bg-background">
      <header className="relative z-20 flex h-12 shrink-0 items-center justify-between gap-3 border-b border-border/80 bg-card/90 px-3 backdrop-blur-md sm:px-4 lg:h-[52px] lg:px-5">
        <div className="flex min-w-0 items-center gap-2.5 sm:gap-3">
          <Link
            href="/dashboard/projects"
            className="rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
            aria-label="Back to projects"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-sm lg:h-9 lg:w-9 lg:rounded-xl">
            <Building2 className="h-3.5 w-3.5 lg:h-4 lg:w-4" />
          </div>
          <div className="min-w-0">
            <p className="truncate font-heading text-sm font-semibold leading-none tracking-tight lg:text-[15px]">
              {projectName}
            </p>
            <p className="mt-0.5 hidden text-[11px] text-muted-foreground sm:block">
              Mission Control
            </p>
          </div>
          <span className="hidden items-center gap-1.5 rounded-md border border-primary/15 bg-primary/8 px-2 py-0.5 text-[11px] font-medium text-primary xl:inline-flex">
            <Sparkles className="h-3 w-3" />
            AI company
          </span>
          <MissionControlStackBadge projectId={projectId} className="hidden sm:inline-flex" />
          <span
            title={
              connectionStatus === 'connected'
                ? 'Live stream connected'
                : connectionStatus === 'polling'
                  ? 'Status updates via polling (stream reconnecting in background)'
                  : connectionStatus === 'reconnecting'
                    ? 'Reconnecting to Mission Control…'
                    : error || 'Offline'
            }
            className={cn(
              'inline-flex items-center gap-1.5 rounded-md border px-2 py-0.5 text-[11px] font-medium',
              (connectionStatus === 'connected' || connectionStatus === 'polling') &&
                'border-primary/20 bg-primary/10 text-primary',
              connectionStatus === 'reconnecting' &&
                'border-border bg-muted/60 text-muted-foreground',
              connectionStatus === 'offline' &&
                'border-destructive/25 bg-destructive/10 text-destructive',
            )}
          >
            <span
              className={cn(
                'h-1.5 w-1.5 rounded-full',
                (connectionStatus === 'connected' || connectionStatus === 'polling') && 'bg-primary',
                connectionStatus === 'reconnecting' && 'animate-soft-pulse bg-muted-foreground',
                connectionStatus === 'offline' && 'bg-destructive',
              )}
            />
            {connectionStatus === 'connected' || connectionStatus === 'polling'
              ? 'Connected'
              : connectionStatus === 'reconnecting'
                ? 'Connecting…'
                : 'Offline'}
          </span>
          {error && connectionStatus === 'offline' && (
            <span className="hidden max-w-[140px] truncate text-[10px] text-destructive md:inline" title={error}>
              {error}
            </span>
          )}
        </div>

        <div className="flex shrink-0 items-center gap-2 sm:gap-3">
          <TokenMeter usage={state.usage} active={isGenerating} className="hidden sm:inline-flex" />

          {onOpenStudio && (
            <button
              type="button"
              onClick={() => onOpenStudio({ focus: 'preview' })}
              className={cn(
                'inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-[11px] font-semibold transition-colors',
                state.phaseStatus === 'completed'
                  ? 'border-primary bg-primary text-primary-foreground shadow-sm'
                  : 'border-border bg-background text-muted-foreground hover:border-primary/30 hover:text-foreground',
              )}
            >
              <Code2 className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">
                {state.phaseStatus === 'completed' ? 'Open Studio' : 'Studio'}
              </span>
            </button>
          )}

          {onOpenStudio && state.phaseStatus === 'completed' && (
            <button
              type="button"
              onClick={() => onOpenStudio({ focus: 'deploy' })}
              className="inline-flex items-center gap-1.5 rounded-lg border border-accent/35 bg-accent/10 px-2.5 py-1 text-[11px] font-semibold text-accent transition-colors hover:bg-accent/15"
            >
              Deploy
            </button>
          )}

          <button
            type="button"
            onClick={() => setPaletteOpen(true)}
            className="hidden items-center gap-1.5 rounded-lg border border-border bg-background px-2 py-1 text-[11px] text-muted-foreground transition-colors hover:border-primary/30 hover:text-foreground md:inline-flex"
            title="Command palette"
          >
            <Command className="h-3 w-3" />
            <kbd className="font-mono text-[10px]">⌘K</kbd>
          </button>

          <div className="hidden items-center gap-2 text-xs text-muted-foreground lg:flex">
            <div
              className={cn(
                'h-1.5 w-1.5 rounded-full',
                isGenerating ? 'animate-soft-pulse bg-primary' : 'bg-primary',
              )}
            />
            <span className="max-w-[160px] truncate xl:max-w-none">{statusLabel}</span>
            {!isWaiting && (
              <>
                <span className="text-border">·</span>
                <span className="font-mono tabular-nums">{state.progress}%</span>
                <span className="text-border">·</span>
                <span>
                  {Math.max(activeAgents, state.phaseStatus === 'running' ? 1 : 0)} active
                </span>
              </>
            )}
          </div>

          <div className="hidden border-l border-border pl-3 text-right sm:block">
            <p className="text-xs font-medium leading-none">{userName}</p>
            <p className="mt-1 text-[11px] text-muted-foreground">You · Owner</p>
          </div>
        </div>
      </header>

      {startError && (
        <div className="shrink-0 border-b border-destructive/25 bg-destructive/10 px-4 py-2 text-sm text-destructive">
          {startError}
        </div>
      )}

      <div className="flex min-h-0 flex-1 flex-col">
        <MissionControlBoard
          projectId={projectId}
          projectName={projectName}
          currentPhase={state.currentPhase}
          phaseStatus={state.phaseStatus}
          progress={state.progress}
          phases={state.phases}
          activities={state.activities}
          artifacts={state.artifacts}
          approvalRequests={state.approvalRequests}
          pendingDocument={state.pendingDocument}
          liveGeneration={state.liveGeneration}
          revisionDiff={state.revisionDiff}
          rightTab={rightTab}
          onRightTabChange={setRightTab}
          isWaiting={isWaiting}
          starting={starting}
          approving={approving}
          regenerating={regenerating}
          retrying={retrying}
          onStart={handleStartPipeline}
          onApprove={handleApprove}
          onRequestChanges={handleRequestChanges}
          onRetryGeneration={handleRetryGeneration}
          onOpenStudio={onOpenStudio}
          className="min-h-0 flex-1 rounded-none border-0 shadow-none"
        />
      </div>

      <MissionCommandPalette
        open={paletteOpen}
        onOpenChange={setPaletteOpen}
        onAction={runCommand}
        canApprove={
          state.phaseStatus === 'approval' &&
          Boolean(state.approvalRequests[0] || state.pendingDocument)
        }
        canRetry={
          state.phaseStatus === 'failed' ||
          state.liveGeneration?.kind === 'stuck' ||
          state.liveGeneration?.kind === 'credits' ||
          state.liveGeneration?.canRetry === true ||
          state.phaseStatus === 'running'
        }
        canStart={Boolean(isWaiting)}
        canOpenStudio={Boolean(onOpenStudio)}
        hasDeliverables={(state.artifacts?.length || 0) > 0}
      />
    </div>
  );
}

export function CompanyWorkspace(props: CompanyWorkspaceProps) {
  return (
    <PipelineProvider projectId={props.projectId}>
      <CompanyWorkspaceInner {...props} />
    </PipelineProvider>
  );
}
