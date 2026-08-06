import Link from 'next/link';
import { redirect } from 'next/navigation';
import { Plus } from 'lucide-react';
import { getAuthSession } from '@/lib/session-helper';
import { listProjects } from '@/features/projects/services/project.service';
import { ProjectCard } from '@/features/projects/components/project-card';
import { PageContainer } from '@/components/layout/page-container';
import { buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';
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
    <PageContainer>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-heading text-3xl font-semibold tracking-tight">Projects</h1>
          <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
            {projects.length === 0
              ? 'Create a project to launch your AI software company.'
              : `${projects.length} project${projects.length === 1 ? '' : 's'}${
                  activeCount > 0 ? ` · ${activeCount} building` : ''
                }`}
          </p>
        </div>
        {projects.length > 0 && (
          <Link
            href={`${ROUTES.projects}/new`}
            className={cn(buttonVariants({ size: 'sm' }), 'gap-1.5 rounded-xl shadow-sm')}
          >
            <Plus className="h-4 w-4" />
            New project
          </Link>
        )}
      </div>

      {projects.length === 0 ? (
        <EmptyProjectPrompt />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {projects.map((p) => (
            <ProjectCard key={p.id} project={p} />
          ))}
        </div>
      )}
    </PageContainer>
  );
}
