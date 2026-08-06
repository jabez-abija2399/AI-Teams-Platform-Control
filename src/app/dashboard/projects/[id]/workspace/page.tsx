import { redirect, notFound } from 'next/navigation';
import { getAuthSession } from '@/lib/session-helper';
import { getProject } from '@/features/projects/services/project.service';
import { CommandPaletteProvider } from '@/features/editor';
import { ProjectInitializer } from '@/features/workspace/components/project-initializer';
import { WorkspaceBuildSync } from '@/features/workspace/components/workspace-build-sync';
import { CompanyWorkspaceWrapper } from './company-workspace-wrapper';

export default async function WorkspacePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await getAuthSession();
  if (!session?.user?.id) redirect('/login');

  const project = await getProject(id, session.user.id);
  if (!project) notFound();

  return (
    <CommandPaletteProvider>
      <ProjectInitializer projectId={id}>
        <WorkspaceBuildSync projectId={id} />
        <CompanyWorkspaceWrapper
          projectId={id}
          projectName={project.name}
          projectDescription={project.description || ''}
          userName={session.user.name ?? 'User'}
        />
      </ProjectInitializer>
    </CommandPaletteProvider>
  );
}
