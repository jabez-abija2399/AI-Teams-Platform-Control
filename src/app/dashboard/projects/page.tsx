import Link from 'next/link';
import { redirect } from 'next/navigation';
import { Plus, Sparkles, FolderKanban } from 'lucide-react';
import { getAuthSession } from '@/lib/session-helper';
import { listProjects } from '@/features/projects/services/project.service';
import { ProjectCard } from '@/features/projects/components/project-card';
import { NeonButton } from '@/packages/ui';
import { ROUTES } from '@/config/constants';
import { EmptyProjectPrompt } from './empty-project-prompt';

export default async function ProjectsPage() {
  const session = await getAuthSession();

  if (!session?.user?.id) {
    redirect('/login');
  }

  const projects = await listProjects(session.user.id);
  const activeCount = projects.filter((p) => p.status === 'IN_PROGRESS').length;

  return (
    <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8 flex flex-col gap-8">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-white/10 pb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <FolderKanban className="w-6 h-6 text-primary" />
            <h1 className="text-3xl font-bold tracking-tight text-white">Software Portfolio</h1>
          </div>
          <p className="text-sm text-white/50">
            {projects.length === 0
              ? 'Launch your first autonomous software engineering project.'
              : `${projects.length} active project${projects.length === 1 ? '' : 's'}${
                  activeCount > 0 ? ` · ${activeCount} currently building` : ''
                }`}
          </p>
        </div>

        {projects.length > 0 && (
          <Link href={`${ROUTES.projects}/new`}>
            <NeonButton variant="primary">
              <Plus className="h-4 w-4 mr-1.5" />
              New Project
            </NeonButton>
          </Link>
        )}
      </div>

      {/* Main Content Area */}
      {projects.length === 0 ? (
        <EmptyProjectPrompt />
      ) : (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {projects.map((p) => (
            <ProjectCard key={p.id} project={p} />
          ))}
        </div>
      )}
    </div>
  );
}
