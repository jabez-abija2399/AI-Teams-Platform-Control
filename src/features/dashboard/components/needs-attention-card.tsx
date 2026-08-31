'use client';

import React from 'react';
import Link from 'next/link';
import { AlertTriangle, Eye } from 'lucide-react';
import { ROUTES } from '@/config/constants';
import type { Project } from '../../../../prisma/generated/prisma/client';

interface NeedsAttentionCardProps {
  project?: Project | null;
}

export function NeedsAttentionCard({ project }: NeedsAttentionCardProps) {
  const name = project?.name || 'StudyMate';
  const projectId = project?.id;

  return (
    <section className="bg-surface rounded-lg p-6 flex flex-col justify-between border-t-[3px] border-t-primary border-x border-b border-white/10">
      <div>
        <div className="flex items-center gap-2 mb-4 text-primary">
          <AlertTriangle className="w-5 h-5 text-primary" />
          <h3 className="font-mono text-xs font-bold uppercase tracking-wider">NEEDS YOUR ATTENTION</h3>
        </div>
        <div className="p-4 bg-background border border-white/10 rounded relative mb-4">
          <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-primary" />
          <p className="font-sans text-xs font-semibold text-foreground mb-1">
            Design specification ready for review
          </p>
          <p className="font-mono text-[11px] text-on-surface-variant">
            Project: {name} • Agent: Designer
          </p>
        </div>
      </div>

      {projectId && (
        <Link href={`${ROUTES.projects}/${projectId}/workspace`}>
          <button
            type="button"
            className="w-full bg-transparent border border-primary text-primary font-mono text-xs font-bold py-2.5 rounded hover:bg-primary/10 transition-colors flex items-center justify-center gap-2 uppercase tracking-wider"
          >
            <Eye className="w-4 h-4" />
            <span>Review Design</span>
          </button>
        </Link>
      )}
    </section>
  );
}
