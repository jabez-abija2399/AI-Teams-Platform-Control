import Link from 'next/link';
import { ArrowRight, FolderKanban } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatRelativeTime, truncate } from '@/utils/format';
import { ROUTES } from '@/config/constants';
import type { Project } from '../../../../prisma/generated/prisma/client';

const STATUS_META: Record<string, { label: string; className: string }> = {
  PLANNING: {
    label: 'Ready to start',
    className: 'bg-muted text-muted-foreground',
  },
  IN_PROGRESS: {
    label: 'Building',
    className: 'bg-primary/10 text-primary',
  },
  REVIEW: {
    label: 'Needs review',
    className: 'bg-accent/15 text-accent',
  },
  COMPLETED: {
    label: 'Completed',
    className: 'bg-primary/10 text-primary',
  },
  ARCHIVED: {
    label: 'Archived',
    className: 'bg-muted text-muted-foreground',
  },
};

export function ProjectCard({ project }: { project: Project }) {
  const status = STATUS_META[project.status] ?? {
    label: project.status,
    className: 'bg-muted text-muted-foreground',
  };

  return (
    <Link
      href={`${ROUTES.projects}/${project.id}/workspace`}
      className="group flex h-full flex-col rounded-2xl border border-border/80 bg-card/90 p-5 shadow-[0_1px_0_rgba(36,95,115,0.04)] transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-md"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
            <FolderKanban className="h-4 w-4" />
          </div>
          <div className="min-w-0">
            <h3 className="truncate text-sm font-semibold tracking-tight">{project.name}</h3>
            <p className="mt-0.5 text-[11px] text-muted-foreground">
              Updated {formatRelativeTime(project.updatedAt)}
            </p>
          </div>
        </div>
        <span
          className={cn(
            'shrink-0 rounded-full px-2.5 py-1 text-[10px] font-medium',
            status.className,
          )}
        >
          {status.label}
        </span>
      </div>

      {project.description ? (
        <p className="mt-4 flex-1 text-sm leading-relaxed text-muted-foreground">
          {truncate(project.description, 110)}
        </p>
      ) : (
        <p className="mt-4 flex-1 text-sm italic text-muted-foreground/70">No description yet</p>
      )}

      <div className="mt-5 flex items-center gap-1.5 text-xs font-medium text-primary">
        Open Mission Control
        <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
      </div>
    </Link>
  );
}
