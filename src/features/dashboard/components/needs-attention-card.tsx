'use client';

import React from 'react';
import Link from 'next/link';
import { AlertTriangle, Eye, CheckCircle2 } from 'lucide-react';
import { ROUTES } from '@/config/constants';
import type { Project } from '../../../../prisma/generated/prisma/client';

interface NeedsAttentionCardProps {
  project?: Project | null;
}

export function NeedsAttentionCard({ project }: NeedsAttentionCardProps) {
  const name = project?.name ?? '';
  const projectId = project?.id;
  const isCompleted = project?.status === 'COMPLETED';

  return (
    <section className="border border-outline-variant/60 bg-surface-container-low p-5 flex flex-col justify-between gap-4 rounded-sm">
      <div>
        <div className="flex items-center gap-2 mb-4">
          {isCompleted ? (
            <CheckCircle2 className="w-4 h-4 text-success" />
          ) : (
            <AlertTriangle className="w-4 h-4 text-warning" />
          )}
          <p className="font-mono text-[11px] font-bold text-on-surface-variant uppercase tracking-wider">
            {isCompleted ? 'Build Finished' : 'Needs Attention'}
          </p>
        </div>

        {project ? (
          <div className="border border-outline-variant/40 bg-background p-3.5 rounded-sm relative">
            <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-primary rounded-l-sm" />
            <p className="font-sans text-xs font-semibold text-on-surface mb-1 pl-1">
              {isCompleted
                ? 'All phases complete — ready for deployment'
                : 'Review and approve the latest agent output'}
            </p>
            {name && (
              <p className="font-mono text-[10px] text-on-surface-variant pl-1">
                Project: {name}
              </p>
            )}
          </div>
        ) : (
          <div className="border border-outline-variant/40 bg-background p-3.5 rounded-sm">
            <p className="font-sans text-xs text-on-surface-variant">
              No active projects. Start a new build to get going.
            </p>
          </div>
        )}
      </div>

      {projectId && (
        <Link href={`${ROUTES.projects}/${projectId}/workspace`}>
          <button
            type="button"
            className="w-full border border-primary/40 text-primary font-mono text-xs font-bold py-2 rounded-sm hover:bg-primary/10 transition-colors flex items-center justify-center gap-1.5 uppercase tracking-wider"
          >
            <Eye className="w-3.5 h-3.5" />
            {isCompleted ? 'Open Studio' : 'Review in Mission Control'}
          </button>
        </Link>
      )}
    </section>
  );
}
