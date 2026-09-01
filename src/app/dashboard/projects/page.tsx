import Link from 'next/link';
import { redirect } from 'next/navigation';
import { Plus, FolderKanban } from 'lucide-react';
import { getAuthSession } from '@/lib/session-helper';
import { listProjects } from '@/features/projects/services/project.service';
import { ProjectCard } from '@/features/projects/components/project-card';
import { ROUTES } from '@/config/constants';
import { EmptyProjectPrompt } from './empty-project-prompt';

export default async function ProjectsPage() {
  const session = await getAuthSession();
  if (!session?.user?.id) redirect('/login');

  const projects = await listProjects(session.user.id);
  const activeCount = projects.filter((p) => p.status === 'IN_PROGRESS').length;
  const completedCount = projects.filter((p) => p.status === 'COMPLETED').length;

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-outline-variant/60 pb-5">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <FolderKanban className="w-4 h-4 text-primary" />
            <h1 className="font-sans text-2xl font-bold text-on-surface">Projects</h1>
          </div>
          <p className="font-mono text-xs text-on-surface-variant">
            {projects.length === 0
              ? 'No projects yet. Start your first autonomous build.'
              : `${projects.length} project${projects.length !== 1 ? 's' : ''} · ${activeCount} building · ${completedCount} completed`}
          </p>
        </div>

        {projects.length > 0 && (
          <Link href={`${ROUTES.projects}/new`}>
            <button
              type="button"
              className="bg-primary text-black font-mono text-xs font-bold px-4 py-2 rounded-sm flex items-center gap-1.5 hover:bg-primary-container transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              New Project
            </button>
          </Link>
        )}
      </div>

      {/* Filter strip (status labels) */}
      {projects.length > 0 && (
        <div className="flex items-center gap-2 font-mono text-[11px]">
          <span className="text-on-surface-variant uppercase tracking-wider">All</span>
          {activeCount > 0 && (
            <span className="border border-primary/30 bg-primary/5 text-primary px-2 py-0.5 rounded-sm uppercase font-bold">
              {activeCount} Building
            </span>
          )}
          {completedCount > 0 && (
            <span className="border border-success/30 bg-success/5 text-success px-2 py-0.5 rounded-sm uppercase font-bold">
              {completedCount} Completed
            </span>
          )}
        </div>
      )}

      {/* Grid */}
      {projects.length === 0 ? (
        <EmptyProjectPrompt />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {projects.map((p) => (
            <ProjectCard key={p.id} project={p} />
          ))}
        </div>
      )}
    </div>
  );
}
