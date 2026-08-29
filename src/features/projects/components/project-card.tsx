'use client';

import Link from 'next/link';
import { cn } from '@/lib/utils';
import { ROUTES } from '@/config/constants';
import type { Project } from '../../../../prisma/generated/prisma/client';

interface ProjectCardProps {
  project: Project;
  stack?: string;
}

export function ProjectCard({ project, stack }: ProjectCardProps) {
  const isRunning = project.status === 'IN_PROGRESS';
  return (
    <Link href={`${ROUTES.projects}/${project.id}/workspace`} className="group block focus:outline-none h-full">
      <article className="brutal-border bg-surface flex flex-col p-6 hover:bg-surface-container-low transition-colors group h-full justify-between">
        <div>
          <div className="flex justify-between items-start mb-6">
            <h3 className="font-heading text-lg font-bold text-on-surface group-hover:text-primary transition-colors">
              {project.name}
            </h3>
            <div className={cn(
              "border px-2 py-1 flex items-center gap-2 font-mono text-[10px] uppercase font-bold",
              isRunning ? "border-primary text-primary" : "border-white/10 text-on-surface-variant bg-surface-container"
            )}>
              <div className={cn("w-1.5 h-1.5 rounded-full", isRunning ? "bg-primary animate-pulse" : "bg-on-surface-variant")}></div>
              {project.status}
            </div>
          </div>
          <div className="mb-6">
            <p className="font-mono text-xs text-on-surface-variant mb-4 line-clamp-2 leading-relaxed">
              {project.description || 'Autonomous software build in progress…'}
            </p>
            {/* Mini Graph Mock */}
            <div className="h-12 w-full flex items-end gap-1 mb-4 opacity-75">
              <div className="w-full bg-surface-container-highest h-[30%]"></div>
              <div className="w-full bg-surface-container-highest h-[50%]"></div>
              <div className="w-full bg-surface-container-highest h-[40%]"></div>
              <div className="w-full bg-surface-container-highest h-[70%]"></div>
              <div className="w-full bg-primary h-[90%]"></div>
              <div className="w-full bg-primary h-[85%]"></div>
            </div>
            <div className="flex gap-2 flex-wrap">
              <span className="bg-surface-container px-2 py-1 font-mono text-[10px] text-on-surface-variant brutal-border uppercase">
                {stack || 'NEXTJS'}
              </span>
            </div>
          </div>
        </div>
        <div className="pt-4 border-t border-white/10 flex justify-between items-center text-on-surface-variant mt-auto">
          <span className="font-mono text-[10px]">Build #{project.id.slice(-4).toUpperCase()}</span>
          <span className="font-mono text-[10px]">Updated recently</span>
        </div>
      </article>
    </Link>
  );
}
