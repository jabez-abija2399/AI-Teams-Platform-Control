'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowRight, CheckCircle2, RefreshCw, Clock } from 'lucide-react';
import { ROUTES } from '@/config/constants';
import type { Project } from '../../../../prisma/generated/prisma/client';

interface ActiveProjectHeroProps {
  project?: Project | null;
}

export function ActiveProjectHero({ project }: ActiveProjectHeroProps) {
  const name = project?.name || 'StudyMate';
  const description = project?.description || 'AI-powered study assistant application';
  const projectId = project?.id;

  return (
    <section className="lg:col-span-2 bg-surface rounded-lg p-6 relative overflow-hidden flex flex-col justify-between min-h-[320px] border border-white/10">
      <div>
        <div className="flex items-center justify-between mb-6">
          <div>
            <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded bg-surface-container-high border border-white/10 mb-3">
              <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
              <span className="font-mono text-[10px] uppercase tracking-wider text-foreground font-bold">
                ACTIVE PROJECT
              </span>
            </div>
            <h3 className="font-heading text-3xl font-extrabold text-foreground mb-1">{name}</h3>
            <p className="font-sans text-xs text-on-surface-variant">{description}</p>
          </div>

          {projectId && (
            <Link href={`${ROUTES.projects}/${projectId}/workspace`}>
              <button
                type="button"
                className="bg-primary text-black font-mono text-xs font-bold px-4 py-2.5 rounded hover:bg-primary-container transition-colors flex items-center gap-2 uppercase tracking-wider glow-cyan"
              >
                <span>Continue Building</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </Link>
          )}
        </div>
      </div>

      {/* Pipeline Progress Footer */}
      <div className="mt-auto bg-background/80 p-4 rounded border border-white/10 backdrop-blur-sm">
        <div className="flex items-center justify-between mb-2 font-mono text-xs">
          <span className="text-on-surface-variant">
            PHASE: <span className="text-primary font-bold">DESIGN</span>
          </span>
          <span className="text-on-surface-variant font-bold">STEP 03/04</span>
        </div>

        {/* Progress Bar */}
        <div className="h-1 w-full bg-white/10 rounded-full overflow-hidden mb-3 flex">
          <div className="h-full bg-primary w-1/4" />
          <div className="h-full bg-primary w-1/4" />
          <div className="h-full bg-primary w-1/4 animate-pulse" />
          <div className="h-full bg-transparent w-1/4" />
        </div>

        <div className="flex items-center justify-between font-mono text-[11px] uppercase">
          <div className="flex items-center gap-1.5 text-on-surface-variant opacity-60">
            <CheckCircle2 className="w-3.5 h-3.5 text-on-surface-variant" />
            <span>CEO</span>
          </div>
          <div className="w-4 h-px bg-white/10" />
          <div className="flex items-center gap-1.5 text-on-surface-variant opacity-60">
            <CheckCircle2 className="w-3.5 h-3.5 text-on-surface-variant" />
            <span>ARCHITECT</span>
          </div>
          <div className="w-4 h-px bg-white/10" />
          <div className="flex items-center gap-1.5 text-primary font-bold">
            <RefreshCw className="w-3.5 h-3.5 text-primary animate-spin" />
            <span>DESIGNER</span>
          </div>
          <div className="w-4 h-px bg-white/10" />
          <div className="flex items-center gap-1.5 text-on-surface-variant opacity-30">
            <Clock className="w-3.5 h-3.5" />
            <span>DEVELOPER</span>
          </div>
        </div>
      </div>
    </section>
  );
}
