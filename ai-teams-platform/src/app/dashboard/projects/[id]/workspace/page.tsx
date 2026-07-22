import { notFound } from 'next/navigation';
import { auth } from '@/lib/auth';
import { getProject } from '@/features/projects/services/project.service';
import { WorkspaceShell } from '@/features/workspace/components/workspace-shell';
import { CommandPaletteProvider } from '@/features/editor';
import { WorkspaceSidebarContent } from '@/features/workspace/components/workspace-sidebar-content';
import { ProjectInitializer } from '@/features/workspace/components/project-initializer';
import { AssistantChatWrapper } from './assistant-chat-wrapper';

export default async function WorkspacePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user?.id) notFound();

  const project = await getProject(id, session.user.id);
  if (!project) notFound();

  return (
    <CommandPaletteProvider>
      <ProjectInitializer projectId={id}>
        <WorkspaceShell
          projectName={project.name}
          userName={session.user.name ?? 'User'}
          projectId={id}
          sidebarContent={<WorkspaceSidebarContent />}
          aiPanelContent={<AssistantChatWrapper projectId={id} />}
        />
      </ProjectInitializer>
    </CommandPaletteProvider>
  );
}
