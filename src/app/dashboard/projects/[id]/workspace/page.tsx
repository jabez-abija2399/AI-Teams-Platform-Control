import { redirect } from 'next/navigation';
import { getAuthSession } from '@/lib/session-helper';
import { prisma } from '@/lib/prisma';
import { ROUTES } from '@/config/constants';
import { WorkspaceClientShell } from '@/features/workspace/components/workspace-client-shell';

export default async function WorkspacePage({ params }: { params: Promise<{ id: string }> }) {
  const session = await getAuthSession();
  if (!session?.user?.id) redirect('/login');

  const { id } = await params;

  const project = await prisma.project.findUnique({
    where: { id, ownerId: session.user.id },
  });

  if (!project) redirect(ROUTES.dashboard);

  return (
    <WorkspaceClientShell
      projectId={project.id}
      projectName={project.name}
    />
  );
}
