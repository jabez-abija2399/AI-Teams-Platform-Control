// This component uses client interactive motion effects and routing links.
'use client';

// Import Next.js Link for client-side navigation.
import Link from 'next/link';
// Import Lucide icons for rich card metadata.
import { ArrowRight, FolderKanban, Layers, Calendar } from 'lucide-react';
// Import our centralized Atomic UI components.
import { GlassCard, StatusBadge } from '@/packages/ui';
// Import time and text formatting utilities.
import { formatRelativeTime, truncate } from '@/utils/format';
// Import application routing constants.
import { ROUTES } from '@/config/constants';
// Import Prisma client types.
import type { Project } from '../../../../prisma/generated/prisma/client';

// Define the properties for the ProjectCard component.
interface ProjectCardProps {
  // The database project entity to display.
  project: Project;
  // Optional stack label override if available.
  stack?: string;
}

/**
 * Ultra-Modern Cyber Void Project Portfolio Card.
 * Renders project metadata, live execution status, and workspace entry links inside an interactive GlassCard.
 */
export function ProjectCard({ project, stack }: ProjectCardProps) {
  // Map Prisma project status to our standardized StatusBadge status types
  const mapBadgeStatus = (status: string): 'RUNNING' | 'COMPLETED' | 'FAILED' | 'PAUSED' | 'IDLE' | 'HEALTHY' => {
    switch (status) {
      case 'IN_PROGRESS':
        return 'RUNNING';
      case 'COMPLETED':
        return 'COMPLETED';
      case 'FAILED':
        return 'FAILED';
      case 'REVIEW':
      case 'PAUSED':
        return 'PAUSED';
      case 'PLANNING':
      default:
        return 'IDLE';
    }
  };

  return (
    <Link
      href={`${ROUTES.projects}/${project.id}/workspace`}
      className="group block h-full focus:outline-none"
    >
      <GlassCard
        interactive={true}
        className="h-full flex flex-col justify-between p-6 border-white/10 hover:border-primary/50 transition-all duration-300 shadow-lg hover:shadow-[0_0_30px_rgba(99,102,241,0.15)]"
      >
        <div>
          {/* Header Row: Icon, Title, and Status Badge */}
          <div className="flex items-start justify-between gap-3 mb-4">
            <div className="flex min-w-0 items-center gap-3">
              {/* Folder Icon Container with subtle neon glow on hover */}
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary border border-primary/20 transition-all duration-300 group-hover:scale-105 group-hover:bg-primary group-hover:text-white group-hover:shadow-[0_0_15px_rgba(99,102,241,0.5)]">
                <FolderKanban className="h-5 w-5" />
              </div>
              
              <div className="min-w-0">
                <h3 className="truncate text-base font-bold tracking-tight text-foreground group-hover:text-primary transition-colors">
                  {project.name}
                </h3>
                <div className="flex items-center gap-1.5 mt-0.5 text-xs text-secondary font-mono">
                  <Calendar className="w-3 h-3" />
                  <span>Updated {formatRelativeTime(project.updatedAt)}</span>
                </div>
              </div>
            </div>

            {/* Glowing dynamic status pill */}
            <StatusBadge status={mapBadgeStatus(project.status)} />
          </div>

          {/* Project Description snippet */}
          {project.description ? (
            <p className="text-xs leading-relaxed text-secondary line-clamp-2 mt-2">
              {truncate(project.description, 120)}
            </p>
          ) : (
            <p className="text-xs italic text-secondary/50 mt-2">
              Autonomous software build in progress…
            </p>
          )}
        </div>

        {/* Footer Row: Delivery Stack and Action CTA */}
        <div className="mt-6 pt-4 border-t border-white/5 flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-[11px] font-mono text-secondary">
            <Layers className="w-3.5 h-3.5 text-primary" />
            <span className="uppercase tracking-wider font-semibold text-foreground/75">
              {stack || 'Full-Stack'}
            </span>
          </div>

          <div className="flex items-center gap-1.5 text-xs font-bold text-primary group-hover:text-secondary transition-colors">
            <span>Enter Workspace</span>
            <ArrowRight className="h-3.5 w-3.5 transition-transform duration-300 group-hover:translate-x-1" />
          </div>
        </div>
      </GlassCard>
    </Link>
  );
}
