'use client';

import Link from 'next/link';
import { cn } from '@/lib/utils';
import { ROUTES } from '@/config/constants';
import type { Project } from '../../../../prisma/generated/prisma/client';
import { ArrowUpRight, Cpu } from 'lucide-react';

interface ProjectCardProps {
  project: Project;
  stack?: string;
}

export function ProjectCard({ project, stack }: ProjectCardProps) {
  const isRunning = project.status === 'IN_PROGRESS';
  return (
    <Link href={`${ROUTES.projects}/${project.id}/workspace`} className="group block focus:outline-none h-full">
      <article className="border border-white/10 bg-surface flex flex-col p-6 hover:border-primary/50 transition-all duration-300 group h-full justify-between offset-shadow relative overflow-hidden">
        <div className="absolute top-0 right-0 p-4 opacity-0 group-hover:opacity-100 transition-opacity">
          <ArrowUpRight className="w-4 h-4 text-primary" />
        </div>

        <div>
          <div className="flex justify-between items-start mb-4 pr-6">
            <h3 className="font-heading text-lg font-bold text-white group-hover:text-primary transition-colors leading-tight">
              {project.name}
            </h3>
          </div>

          <div className="flex items-center gap-2 mb-4">
            <div
              className={cn(
                'border px-2.5 py-0.5 flex items-center gap-1.5 font-mono text-[10px] uppercase font-bold',
                isRunning ? 'border-primary/60 text-primary bg-primary/10' : 'border-white/10 text-on-surface-variant bg-surface-container-high',
              )}
            >
              <div className={cn('w-1.5 h-1.5 rounded-full', isRunning ? 'bg-primary animate-pulse' : 'bg-on-surface-variant')} />
              {project.status}
            </div>
            <span className="bg-surface-container-high px-2.5 py-0.5 font-mono text-[10px] text-on-surface-variant border border-white/10 uppercase font-bold">
              {stack || 'NEXTJS'}
            </span>
          </div>

          <p className="font-sans text-xs text-on-surface-variant mb-6 line-clamp-2 leading-relaxed">
            {project.description || 'Autonomous software build in progress…'}
          </p>

          {/* Mini Visual Meter Mock */}
          <div className="h-10 w-full flex items-end gap-1 mb-4 opacity-85">
            <div className="w-full bg-surface-container-highest h-[30%]" />
            <div className="w-full bg-surface-container-highest h-[50%]" />
            <div className="w-full bg-surface-container-highest h-[40%]" />
            <div className="w-full bg-surface-container-highest h-[70%]" />
            <div className="w-full bg-primary/70 h-[90%]" />
            <div className="w-full bg-primary h-[100%] glow-cyan" />
          </div>
        </div>

        <div className="pt-4 border-t border-white/10 flex justify-between items-center text-on-surface-variant mt-auto font-mono text-[10px]">
          <span className="flex items-center gap-1">
            <Cpu className="w-3 h-3 text-primary" /> Build #{project.id.slice(-4).toUpperCase()}
          </span>
          <span>Updated recently</span>
        </div>
      </article>
    </Link>
  );
}
