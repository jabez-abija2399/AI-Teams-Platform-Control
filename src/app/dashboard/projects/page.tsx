import { auth } from '@/lib/auth';
import { listProjects } from '@/features/projects/services/project.service';
import { ProjectCard } from '@/features/projects/components/project-card';
import { PageContainer } from '@/components/layout/page-container';
import { buttonVariants } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import Link from 'next/link';
import { EmptyProjectPrompt } from './empty-project-prompt';

export default async function ProjectsPage() {
  const session = await auth();
  const projects = await listProjects(session!.user!.id as string);

  return (
    <PageContainer>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Projects</h1>
          <p className="text-muted-foreground text-sm">All your software projects.</p>
        </div>
        <Link href="/dashboard/projects/new" className={buttonVariants({ className: 'gap-2' })}>
          <Plus className="h-4 w-4" /> New project
        </Link>
      </div>

      {projects.length === 0 ? (
        <div className="py-12">
          <EmptyProjectPrompt />
        </div>
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
