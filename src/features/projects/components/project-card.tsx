'use client';

import Link from 'next/link';
import { cn } from '@/lib/utils';
import { ROUTES } from '@/config/constants';
import type { Project } from '../../../../prisma/generated/prisma/client';
import { ArrowUpRight, Cpu, CheckCircle2, Clock } from 'lucide-react';

interface ProjectCardProps {
  project: Project;
  stack?: string;
}

export function ProjectCard({ project, stack }: ProjectCardProps) {
  const isRunning = project.status === 'IN_PROGRESS';
  const isCompleted = project.status === 'COMPLETED';

  const getStatusLabel = () => {
    switch (project.status) {
      case 'IN_PROGRESS':
        return 'BUILDING';
      case 'COMPLETED':
        return 'COMPLETED';
      default:
        return project.status.replace('_', ' ');
    }
  };

  return (
    <Link href={`${ROUTES.projects}/${project.id}/workspace`} className="group block focus:outline-none h-full">
      <article className="border border-white/10 bg-surface flex flex-col p-6 hover:border-primary transition-all duration-300 group h-full justify-between offset-shadow rounded-2xl relative overflow-hidden glass-card">
        <div className="absolute top-0 right-0 p-4 opacity-0 group-hover:opacity-100 transition-opacity">
          <ArrowUpRight className="w-4 h-4 text-primary" />
        </div>

        <div>
          <div className="flex justify-between items-start mb-3 pr-6">
            <h3 className="font-heading text-lg font-bold text-white group-hover:text-primary transition-colors leading-tight">
              {project.name}
            </h3>
          </div>

          <div className="flex items-center gap-2 mb-4">
            <div
              className={cn(
                'border px-2.5 py-1 flex items-center gap-1.5 font-mono text-[10px] uppercase font-bold rounded-full',
                isRunning
                  ? 'border-primary text-primary bg-primary/10 glow-border'
                  : isCompleted
                  ? 'border-success text-success bg-success/10'
                  : 'border-white/10 text-on-surface-variant bg-surface-container-high',
              )}
            >
              <div
                className={cn(
                  'w-1.5 h-1.5 rounded-full',
                  isRunning ? 'bg-primary animate-pulse' : isCompleted ? 'bg-success' : 'bg-on-surface-variant',
                )}
              />
              {getStatusLabel()}
            </div>
            <span className="bg-surface-container-high px-2.5 py-1 font-mono text-[10px] text-white border border-white/10 uppercase font-bold rounded-full">
              {stack || 'NEXT.JS'}
            </span>
          </div>

          <p className="font-sans text-xs text-on-surface-variant mb-6 line-clamp-2 leading-relaxed">
            {project.description || 'Autonomous multi-agent software build in progress…'}
          </p>

          {/* Mini Visual Metric Meter */}
          <div className="h-9 w-full flex items-end gap-1 mb-4 opacity-90">
            <div className="w-full bg-surface-container-high h-[30%] rounded-t-sm" />
            <div className="w-full bg-surface-container-high h-[50%] rounded-t-sm" />
            <div className="w-full bg-surface-container-high h-[40%] rounded-t-sm" />
            <div className="w-full bg-surface-container-high h-[70%] rounded-t-sm" />
            <div className="w-full bg-primary/70 h-[90%] rounded-t-sm" />
            <div className="w-full bg-primary h-[100%] rounded-t-sm glow-cyan" />
          </div>
        </div>

        <div className="pt-4 border-t border-white/10 flex justify-between items-center text-on-surface-variant mt-auto font-mono text-[10px]">
          <span className="flex items-center gap-1 font-bold">
            <Cpu className="w-3.5 h-3.5 text-primary" /> Build #{project.id.slice(-4).toUpperCase()}
          </span>
          <span className="flex items-center gap-1">
            <Clock className="w-3 h-3 text-on-surface-variant" /> Active
          </span>
        </div>
      </article>
    </Link>
  );
}
