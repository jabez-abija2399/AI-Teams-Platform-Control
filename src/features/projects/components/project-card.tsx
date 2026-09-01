'use client';

import Link from 'next/link';
import { cn } from '@/lib/utils';
import { ROUTES } from '@/config/constants';
import type { Project } from '../../../../prisma/generated/prisma/client';
import { ArrowUpRight, Clock, CheckCircle2, Loader2 } from 'lucide-react';

interface ProjectCardProps {
  project: Project;
  stack?: string;
}

const STATUS_MAP: Record<string, { label: string; chipClass: string; dotClass: string }> = {
  IN_PROGRESS: {
    label: 'BUILDING',
    chipClass: 'border-primary/30 bg-primary/10 text-primary',
    dotClass: 'bg-primary animate-pulse',
  },
  COMPLETED: {
    label: 'COMPLETED',
    chipClass: 'border-success/30 bg-success/10 text-success',
    dotClass: 'bg-success',
  },
  PLANNING: {
    label: 'PLANNING',
    chipClass: 'border-outline-variant/60 bg-surface-container text-on-surface-variant',
    dotClass: 'bg-on-surface-variant/40',
  },
  REVIEW: {
    label: 'REVIEW',
    chipClass: 'border-warning/30 bg-warning/10 text-warning',
    dotClass: 'bg-warning animate-pulse',
  },
  ARCHIVED: {
    label: 'ARCHIVED',
    chipClass: 'border-outline-variant/40 bg-surface-container text-on-surface-variant/60',
    dotClass: 'bg-on-surface-variant/20',
  },
};

export function ProjectCard({ project, stack }: ProjectCardProps) {
  const statusInfo = (STATUS_MAP[project.status as string] || STATUS_MAP.PLANNING)!;
  const isBuilding = project.status === 'IN_PROGRESS';
  const isCompleted = project.status === 'COMPLETED';

  return (
    <Link
      href={`${ROUTES.projects}/${project.id}/workspace`}
      className="group block focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 rounded-sm"
    >
      <article className="border border-outline-variant/60 bg-surface-container-low flex flex-col p-5 hover:border-primary/60 transition-colors duration-200 group h-full relative overflow-hidden rounded-sm">
        {/* Corner arrow */}
        <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
          <ArrowUpRight className="w-3.5 h-3.5 text-primary" />
        </div>

        {/* Header */}
        <div className="mb-3 pr-5">
          <h3 className="font-sans text-sm font-bold text-on-surface group-hover:text-primary transition-colors leading-snug truncate">
            {project.name}
          </h3>
        </div>

        {/* Chips */}
        <div className="flex items-center gap-1.5 mb-3 flex-wrap">
          <span
            className={cn(
              'inline-flex items-center gap-1 border px-2 py-0.5 font-mono text-[10px] font-bold uppercase tracking-wider rounded-sm',
              statusInfo.chipClass,
            )}
          >
            <span className={cn('h-1.5 w-1.5 rounded-full shrink-0', statusInfo.dotClass)} />
            {statusInfo.label}
          </span>
          <span className="border border-outline-variant/40 bg-surface-container px-2 py-0.5 font-mono text-[10px] text-on-surface-variant uppercase font-bold rounded-sm">
            {stack ?? 'NEXT.JS'}
          </span>
        </div>

        {/* Description */}
        <p className="font-sans text-xs text-on-surface-variant line-clamp-2 leading-relaxed mb-4 flex-1">
          {project.description || 'No description provided.'}
        </p>

        {/* Footer */}
        <div className="pt-3 border-t border-outline-variant/40 flex justify-between items-center font-mono text-[10px] text-on-surface-variant">
          <span>#{project.id.slice(-6).toUpperCase()}</span>
          <div className="flex items-center gap-1">
            {isBuilding && <Loader2 className="w-3 h-3 text-primary animate-spin" />}
            {isCompleted && <CheckCircle2 className="w-3 h-3 text-success" />}
            {!isBuilding && !isCompleted && <Clock className="w-3 h-3" />}
            <span>{isBuilding ? 'Live' : isCompleted ? 'Done' : 'Idle'}</span>
          </div>
        </div>
      </article>
    </Link>
  );
}
