'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowRight, CheckCircle2, Loader2, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ROUTES } from '@/config/constants';
import type { Project } from '../../../../prisma/generated/prisma/client';

interface ActiveProjectHeroProps {
  project?: Project | null;
}

const PIPELINE_STEPS = ['CEO', 'ARCHITECT', 'DESIGNER', 'DEVELOPER'] as const;

export function ActiveProjectHero({ project }: ActiveProjectHeroProps) {
  const name = project?.name ?? 'No active project';
  const description = project?.description ?? '';
  const projectId = project?.id;
  const isBuilding = project?.status === 'IN_PROGRESS';
  const isCompleted = project?.status === 'COMPLETED';

  const [currentPhase, setCurrentPhase] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (projectId && isBuilding) {
      fetch(`/api/projects/${projectId}/pipeline/status`)
        .then((res) => res.json())
        .then((json) => {
          if (json.success && json.data?.currentPhase) {
            setCurrentPhase(json.data.currentPhase.toUpperCase());
          }
        })
        .catch(() => {});
    }
  }, [projectId, isBuilding]);

  return (
    <section className="lg:col-span-2 border border-outline-variant/60 bg-surface-container-low p-5 flex flex-col justify-between gap-4 rounded-sm relative overflow-hidden">
      {/* Blueprint bg */}
      <div
        className="pointer-events-none absolute inset-0 opacity-15"
        aria-hidden="true"
        style={{
          backgroundImage:
            'linear-gradient(to right, rgba(60,73,73,0.5) 0.5px, transparent 0.5px), linear-gradient(to bottom, rgba(60,73,73,0.5) 0.5px, transparent 0.5px)',
          backgroundSize: '48px 48px',
        }}
      />

      <div className="relative z-10 flex items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="inline-flex items-center gap-1.5 border border-outline-variant/60 bg-surface-container px-2.5 py-0.5 rounded-sm mb-2">
            {isBuilding && <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />}
            {isCompleted && <span className="h-1.5 w-1.5 rounded-full bg-success" />}
            {!isBuilding && !isCompleted && <span className="h-1.5 w-1.5 rounded-full bg-on-surface-variant/40" />}
            <span className="font-mono text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">
              {isBuilding ? 'Active Build' : isCompleted ? 'Completed' : 'Latest Project'}
            </span>
          </div>
          <h3 className="font-sans text-xl md:text-2xl font-bold text-on-surface leading-tight truncate">
            {name}
          </h3>
          {description && (
            <p className="font-sans text-xs text-on-surface-variant mt-1 line-clamp-2 max-w-sm leading-relaxed">
              {description}
            </p>
          )}
        </div>

        {projectId && (
          <Link href={`${ROUTES.projects}/${projectId}/workspace`} className="shrink-0">
            <button
              type="button"
              className="bg-primary text-black font-mono text-xs font-bold px-3.5 py-1.5 rounded-sm hover:bg-primary-container transition-colors flex items-center gap-1.5"
            >
              {isCompleted ? 'Open Studio' : 'Continue'}
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </Link>
        )}
      </div>

      {/* Pipeline bar */}
      <div className="relative z-10 border border-outline-variant/40 bg-background p-3.5 rounded-sm">
        <div className="flex items-center justify-between mb-2.5 font-mono text-[10px] text-on-surface-variant">
          <span className="uppercase tracking-wider">Build Pipeline</span>
          {isBuilding && (
            <span className="text-primary font-bold flex items-center gap-1">
              <Loader2 className="w-3 h-3 animate-spin" /> Running
            </span>
          )}
          {isCompleted && (
            <span className="text-success font-bold flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3" /> Complete
            </span>
          )}
        </div>

        <div className="flex items-center justify-between gap-1">
          {PIPELINE_STEPS.map((step, i) => {
            const stepPhaseIndex = currentPhase
              ? PIPELINE_STEPS.findIndex((s) => currentPhase.includes(s))
              : -1;

            const isDone = isCompleted || (stepPhaseIndex >= 0 ? i < stepPhaseIndex : i < 2);
            const isActive = isBuilding && (stepPhaseIndex >= 0 ? i === stepPhaseIndex : i === 2);
            const isPending = !isDone && !isActive;

            return (
              <React.Fragment key={step}>
                <div className="flex flex-col items-center gap-1 flex-1">
                  <div
                    className={cn(
                      'flex items-center justify-center w-5 h-5 rounded-sm border',
                      isDone && 'border-primary/30 bg-primary/10 text-primary',
                      isActive && 'border-primary bg-primary/10 text-primary',
                      isPending && 'border-outline-variant/40 bg-background text-on-surface-variant/30',
                    )}
                  >
                    {isDone && <CheckCircle2 className="w-3 h-3" />}
                    {isActive && <Loader2 className="w-3 h-3 animate-spin" />}
                    {isPending && <Clock className="w-3 h-3" />}
                  </div>
                  <span
                    className={cn(
                      'font-mono text-[9px] font-bold uppercase',
                      isDone && 'text-on-surface-variant line-through opacity-60',
                      isActive && 'text-primary',
                      isPending && 'text-on-surface-variant/30',
                    )}
                  >
                    {step}
                  </span>
                </div>
                {i < PIPELINE_STEPS.length - 1 && (
                  <div
                    className={cn(
                      'h-px flex-1 mb-3',
                      isDone ? 'bg-primary/30' : 'bg-outline-variant/30',
                    )}
                  />
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>
    </section>
  );
}
