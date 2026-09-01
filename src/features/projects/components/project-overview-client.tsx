'use client';

import React, { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import {
  ArrowRight,
  Brain,
  Layers,
  Sparkles,
  Terminal,
  CheckCircle2,
  Loader2,
  Clock,
  Package,
  Activity,
  ExternalLink,
  AlertTriangle,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { ROUTES } from '@/config/constants';

// ─── Types ────────────────────────────────────────────────────────────────────

interface PipelineStatus {
  currentPhase: string;
  phaseStatus: string;
  progress: number;
  phases: Array<{ name: string; status: string; label?: string }>;
  artifacts: Array<{ id: string; type: string; name: string; createdAt: string }>;
  activities: Array<{ id: string; type: string; message: string; createdAt: string; agentRole?: string }>;
  approvalRequests: Array<{ id: string; artifactName?: string }>;
}

interface ProjectOverviewClientProps {
  projectId: string;
  projectName: string;
  projectDescription: string;
  projectStatus: string;
  createdAt: string;
}

// ─── Agent phase map ──────────────────────────────────────────────────────────

const AGENT_PHASES = [
  { key: 'discovery', label: 'CEO', icon: Brain },
  { key: 'architecture', label: 'ARCHITECT', icon: Layers },
  { key: 'design', label: 'DESIGNER', icon: Sparkles },
  { key: 'development', label: 'DEVELOPER', icon: Terminal },
];

function getAgentPhaseStatus(
  phases: PipelineStatus['phases'],
  currentPhase: string,
  phaseStatus: string,
  agentKey: string,
): 'done' | 'active' | 'pending' {
  // Map agent keys → phase names that indicate completion
  const doneIndicators: Record<string, string[]> = {
    discovery: ['architecture', 'design', 'development', 'completed'],
    architecture: ['design', 'development', 'completed'],
    design: ['development', 'completed'],
    development: ['completed'],
  };
  const activeIndicators: Record<string, string[]> = {
    discovery: ['discovery', 'strategy', 'planning'],
    architecture: ['architecture', 'architect'],
    design: ['design', 'ui', 'designer'],
    development: ['development', 'developer', 'coding', 'implementation'],
  };

  const cp = currentPhase?.toLowerCase() ?? '';
  if (phaseStatus === 'completed' && agentKey === 'development') return 'done';
  if (doneIndicators[agentKey]?.some((d) => cp.includes(d))) return 'done';
  if (activeIndicators[agentKey]?.some((a) => cp.includes(a))) return 'active';
  // If current is past this agent
  const agentIdx = AGENT_PHASES.findIndex((a) => a.key === agentKey);
  const currentIdx = AGENT_PHASES.findIndex((a) =>
    activeIndicators[a.key]?.some((k) => cp.includes(k)),
  );
  if (currentIdx > agentIdx) return 'done';
  return 'pending';
}

// ─── Component ────────────────────────────────────────────────────────────────

export function ProjectOverviewClient({
  projectId,
  projectName,
  projectDescription,
  projectStatus,
  createdAt,
}: ProjectOverviewClientProps) {
  const [pipeline, setPipeline] = useState<PipelineStatus | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchPipeline = useCallback(async () => {
    try {
      const res = await fetch(`/api/projects/${projectId}/pipeline/status`, {
        credentials: 'same-origin',
        cache: 'no-store',
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setPipeline(data.data as PipelineStatus);
      }
    } catch {
      // silently ignore
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    void fetchPipeline();
    const interval = window.setInterval(() => void fetchPipeline(), 15_000);
    return () => window.clearInterval(interval);
  }, [fetchPipeline]);

  const isCompleted = projectStatus === 'COMPLETED' || pipeline?.phaseStatus === 'completed';
  const isBuilding = projectStatus === 'IN_PROGRESS' || pipeline?.phaseStatus === 'running';
  const needsApproval =
    pipeline?.phaseStatus === 'approval' && (pipeline?.approvalRequests?.length ?? 0) > 0;
  const progress = pipeline?.progress ?? 0;

  const statusVariant = isCompleted
    ? 'border-success/30 bg-success/10 text-success'
    : needsApproval
    ? 'border-warning/30 bg-warning/10 text-warning'
    : isBuilding
    ? 'border-primary/30 bg-primary/10 text-primary'
    : 'border-outline-variant/60 bg-surface-container text-on-surface-variant';

  const statusLabel = isCompleted
    ? 'COMPLETED'
    : needsApproval
    ? 'APPROVAL NEEDED'
    : isBuilding
    ? 'BUILDING'
    : projectStatus.replace('_', ' ');

  return (
    <div className="flex flex-col gap-6 p-6 md:p-8 max-w-5xl">
      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 pb-5 border-b border-outline-variant/60">
        <div className="min-w-0">
          <div className="flex items-center gap-2 mb-2">
            <span className="font-mono text-[10px] text-on-surface-variant uppercase tracking-wider">
              PROJECT
            </span>
            <span className="text-outline-variant/60">·</span>
            <span className="font-mono text-[10px] text-on-surface-variant">
              #{projectId.slice(-8).toUpperCase()}
            </span>
          </div>
          <h1 className="font-sans text-2xl md:text-3xl font-bold text-on-surface leading-tight truncate">
            {projectName}
          </h1>
          {projectDescription && (
            <p className="mt-1.5 font-sans text-sm text-on-surface-variant leading-relaxed max-w-xl">
              {projectDescription}
            </p>
          )}
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <span
            className={cn(
              'inline-flex items-center gap-1.5 border px-2.5 py-1 rounded-sm font-mono text-[11px] font-bold uppercase tracking-wider',
              statusVariant,
            )}
          >
            <span
              className={cn(
                'h-1.5 w-1.5 rounded-full',
                isCompleted && 'bg-success',
                needsApproval && 'bg-warning animate-pulse',
                isBuilding && 'bg-primary animate-pulse',
                !isCompleted && !needsApproval && !isBuilding && 'bg-on-surface-variant/40',
              )}
            />
            {statusLabel}
          </span>
          <Link href={`${ROUTES.projects}/${projectId}/workspace`}>
            <button
              type="button"
              className={cn(
                'font-mono text-xs font-bold px-4 py-1.5 rounded-sm flex items-center gap-1.5 transition-colors',
                isCompleted
                  ? 'bg-primary text-black hover:bg-primary-container'
                  : 'border border-primary/40 text-primary hover:bg-primary/10',
              )}
            >
              {isCompleted ? 'Open Studio' : 'Mission Control'}
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </Link>
        </div>
      </div>

      {/* ── Pipeline Bar ── */}
      <div className="border border-outline-variant/60 bg-surface-container-low p-4 rounded-sm">
        <div className="flex items-center justify-between mb-3">
          <p className="font-mono text-[11px] font-bold text-on-surface-variant uppercase tracking-wider">
            Build Pipeline
          </p>
          {loading ? (
            <Loader2 className="w-3.5 h-3.5 text-primary animate-spin" />
          ) : (
            <span className="font-mono text-[11px] text-primary font-bold tabular-nums">
              {progress}%
            </span>
          )}
        </div>

        {/* Progress track */}
        <div className="h-1 w-full bg-background border border-outline-variant/40 rounded-sm overflow-hidden mb-4">
          <div
            className="h-full bg-primary transition-all duration-700"
            style={{ width: `${Math.min(progress, 100)}%` }}
          />
        </div>

        {/* Agent nodes */}
        <div className="grid grid-cols-4 gap-2">
          {AGENT_PHASES.map((agent) => {
            const status = loading
              ? 'pending'
              : getAgentPhaseStatus(
                  pipeline?.phases ?? [],
                  pipeline?.currentPhase ?? '',
                  pipeline?.phaseStatus ?? '',
                  agent.key,
                );
            const Icon = agent.icon;
            return (
              <div
                key={agent.key}
                className={cn(
                  'flex flex-col items-center gap-1.5 p-2.5 border rounded-sm',
                  status === 'done' && 'border-outline-variant/40 bg-background',
                  status === 'active' && 'border-primary/40 bg-primary/5',
                  status === 'pending' && 'border-outline-variant/30 bg-background opacity-50',
                )}
              >
                {status === 'done' && <CheckCircle2 className="w-4 h-4 text-primary" />}
                {status === 'active' && <Loader2 className="w-4 h-4 text-primary animate-spin" />}
                {status === 'pending' && <Clock className="w-4 h-4 text-on-surface-variant/40" />}
                <Icon className={cn('w-3.5 h-3.5', status === 'active' ? 'text-primary' : 'text-on-surface-variant')} />
                <span
                  className={cn(
                    'font-mono text-[10px] font-bold uppercase',
                    status === 'active' ? 'text-primary' : 'text-on-surface-variant',
                    status === 'done' && 'line-through opacity-60',
                  )}
                >
                  {agent.label}
                </span>
              </div>
            );
          })}
        </div>

        {needsApproval && (
          <div className="mt-3 flex items-center gap-2 border border-warning/30 bg-warning/5 px-3 py-2 rounded-sm">
            <AlertTriangle className="w-3.5 h-3.5 text-warning shrink-0" />
            <p className="font-mono text-[11px] text-warning">
              Your approval is needed to continue the build.
            </p>
            <Link
              href={`${ROUTES.projects}/${projectId}/workspace`}
              className="ml-auto font-mono text-[11px] text-warning font-bold hover:underline flex items-center gap-1"
            >
              Review <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
        )}
      </div>

      {/* ── Artifacts + Activity ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Artifacts */}
        <div className="border border-outline-variant/60 bg-surface-container-low rounded-sm overflow-hidden">
          <div className="flex items-center justify-between px-4 py-2.5 border-b border-outline-variant/60">
            <div className="flex items-center gap-2">
              <Package className="w-3.5 h-3.5 text-primary" />
              <p className="font-mono text-[11px] font-bold text-on-surface-variant uppercase tracking-wider">
                Artifacts
              </p>
            </div>
            <span className="font-mono text-[10px] text-on-surface-variant">
              {pipeline?.artifacts?.length ?? 0} generated
            </span>
          </div>

          <div className="divide-y divide-outline-variant/40">
            {loading ? (
              <div className="p-4 flex items-center gap-2 text-on-surface-variant">
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span className="font-mono text-xs">Loading…</span>
              </div>
            ) : (pipeline?.artifacts?.length ?? 0) === 0 ? (
              <div className="p-4 font-mono text-xs text-on-surface-variant">
                No artifacts yet — start the pipeline to generate them.
              </div>
            ) : (
              (pipeline?.artifacts ?? []).slice(0, 6).map((artifact) => (
                <div
                  key={artifact.id}
                  className="flex items-center justify-between px-4 py-2.5 hover:bg-surface-container transition-colors"
                >
                  <div className="min-w-0">
                    <p className="font-sans text-xs font-medium text-on-surface truncate">
                      {artifact.name}
                    </p>
                    <p className="font-mono text-[10px] text-on-surface-variant uppercase">
                      {artifact.type.replace(/_/g, ' ')}
                    </p>
                  </div>
                  <Link
                    href={`${ROUTES.projects}/${projectId}/workspace`}
                    className="text-primary hover:text-primary/80 ml-2 shrink-0"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                  </Link>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="border border-outline-variant/60 bg-surface-container-low rounded-sm overflow-hidden">
          <div className="flex items-center gap-2 px-4 py-2.5 border-b border-outline-variant/60">
            <Activity className="w-3.5 h-3.5 text-primary" />
            <p className="font-mono text-[11px] font-bold text-on-surface-variant uppercase tracking-wider">
              Recent Activity
            </p>
          </div>

          <div className="divide-y divide-outline-variant/40">
            {loading ? (
              <div className="p-4 flex items-center gap-2 text-on-surface-variant">
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span className="font-mono text-xs">Loading…</span>
              </div>
            ) : (pipeline?.activities?.length ?? 0) === 0 ? (
              <div className="p-4 font-mono text-xs text-on-surface-variant">
                No activity yet.
              </div>
            ) : (
              (pipeline?.activities ?? []).slice(0, 6).map((activity) => (
                <div key={activity.id} className="px-4 py-2.5 flex items-start gap-2.5">
                  <div className="h-1.5 w-1.5 rounded-full bg-primary mt-1.5 shrink-0" />
                  <div className="min-w-0">
                    <p className="font-sans text-xs text-on-surface leading-snug">{activity.message}</p>
                    {activity.agentRole && (
                      <p className="font-mono text-[10px] text-primary uppercase mt-0.5">
                        {activity.agentRole}
                      </p>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* ── CTAs ── */}
      <div className="flex flex-wrap gap-3 pt-2">
        <Link href={`${ROUTES.projects}/${projectId}/workspace`}>
          <button
            type="button"
            className="bg-primary text-black font-mono text-xs font-bold px-5 py-2.5 rounded-sm hover:bg-primary-container transition-colors flex items-center gap-2"
          >
            {isCompleted ? 'Open Studio' : 'Open Mission Control'}
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </Link>
        {isCompleted && (
          <Link href={`${ROUTES.projects}/${projectId}/complete`}>
            <button
              type="button"
              className="font-mono text-xs text-on-surface-variant border border-outline-variant/60 px-5 py-2.5 rounded-sm hover:border-primary hover:text-primary transition-colors flex items-center gap-2"
            >
              View Completion Summary
              <ExternalLink className="w-3.5 h-3.5" />
            </button>
          </Link>
        )}
      </div>
    </div>
  );
}
