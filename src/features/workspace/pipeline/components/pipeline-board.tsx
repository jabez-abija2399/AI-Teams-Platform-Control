'use client';

import { useState, useEffect, useRef } from 'react';
import { Loader2, CheckCircle2, XCircle, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { PipelineState, PipelineStep, PipelineStepId } from '../types/pipeline.types';

interface PipelineBoardProps {
  projectId: string;
}

const STEP_LABELS: Record<PipelineStepId, { icon: string; label: string }> = {
  ceo: { icon: '🎯', label: 'Planning' },
  ceo_review: { icon: '🔍', label: 'Reviewing Plan' },
  product_manager: { icon: '📋', label: 'Refining' },
  pm_review: { icon: '🔍', label: 'Reviewing Specs' },
  architect: { icon: '🏗️', label: 'Designing' },
  architect_review: { icon: '🔍', label: 'Reviewing Design' },
  developer: { icon: '💻', label: 'Building' },
  qa: { icon: '🧪', label: 'Testing' },
  security: { icon: '🔒', label: 'Security' },
  deploy: { icon: '🚀', label: 'Deploying' },
};

function formatDuration(ms: number): string {
  if (ms <= 0) return '';
  const seconds = Math.floor(ms / 1000);
  if (seconds < 60) return `${seconds}s`;
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}m ${secs}s`;
}

function StepCard({ step }: { step: PipelineStep }) {
  const config = STEP_LABELS[step.id];
  const Icon = {
    waiting: Clock,
    running: Loader2,
    complete: CheckCircle2,
    failed: XCircle,
  }[step.status];

  const endTime = step.completedAt ?? undefined;

  return (
    <div
      className={cn(
        'flex flex-col gap-2 rounded-lg border p-3 transition-all',
        step.status === 'running' && 'border-blue-400 bg-blue-50 dark:border-blue-600 dark:bg-blue-950/30',
        step.status === 'complete' && 'border-green-300 bg-green-50 dark:border-green-600 dark:bg-green-950/30',
        step.status === 'failed' && 'border-red-300 bg-red-50 dark:border-red-600 dark:bg-red-950/30',
        step.status === 'waiting' && 'border-muted bg-card opacity-60',
      )}
    >
      <div className="flex items-center gap-2">
        <Icon
          className={cn(
            'h-4 w-4 shrink-0',
            step.status === 'running' && 'animate-spin text-blue-500',
            step.status === 'complete' && 'text-green-500',
            step.status === 'failed' && 'text-red-500',
            step.status === 'waiting' && 'text-muted-foreground',
          )}
        />
        <span className="text-xs font-medium">{config.label}</span>
      </div>
      <div className="flex items-center justify-between">
        {step.message && (
          <p className="text-[10px] leading-relaxed text-muted-foreground">{step.message}</p>
        )}
        {step.startedAt && endTime && (
          <span className="text-[10px] text-muted-foreground shrink-0 ml-2">
            {formatDuration(endTime - step.startedAt)}
          </span>
        )}
      </div>
    </div>
  );
}

export function PipelineBoard({ projectId }: PipelineBoardProps) {
  const [pipeline, setPipeline] = useState<PipelineState | null>(null);
  const [loading, setLoading] = useState(true);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  async function fetchStatus() {
    try {
      const res = await fetch(`/api/projects/${projectId}/build-status`);
      const json = await res.json();
      if (json.success && json.data.pipeline) {
        setPipeline(json.data.pipeline);
        if (!json.data.running) {
          if (pollRef.current) {
            clearInterval(pollRef.current);
            pollRef.current = null;
          }
        }
      } else if (!json.success) {
        setPipeline(null);
      }
    } catch {
      // ignore
    }
    setLoading(false);
  }

  useEffect(() => {
    const timer = setTimeout(() => fetchStatus(), 0);
    pollRef.current = setInterval(fetchStatus, 2000);
    return () => {
      clearTimeout(timer);
      if (pollRef.current) clearInterval(pollRef.current);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId]);

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!pipeline || !pipeline.running) {
    return (
      <div className="flex h-full items-center justify-center p-4 text-xs text-muted-foreground">
        No active build. Use the Developer AI tab or "Run Full Build" to start
        a new pipeline.
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col gap-2 overflow-y-auto p-3">
      <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
        <Loader2 className="h-3.5 w-3.5 animate-spin" />
        Pipeline Running
      </div>
      <div className="flex flex-col gap-1.5">
        {pipeline.steps.map((step) => (
          <StepCard key={step.id} step={step} />
        ))}
      </div>
    </div>
  );
}
