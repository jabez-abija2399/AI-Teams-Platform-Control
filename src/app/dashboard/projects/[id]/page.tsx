import { redirect, notFound } from 'next/navigation';
import { getAuthSession } from '@/lib/session-helper';
import { getProject } from '@/features/projects/services/project.service';
import { ProjectOverviewClient } from '@/features/projects/components/project-overview-client';

export default async function ProjectDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getAuthSession();

  if (!session?.user?.id) redirect('/login');

  let project;
  try {
    project = await getProject(id, session.user.id);
  } catch (e: unknown) {
    console.error('getProject error:', e);
    throw e;
  }

  if (!project) notFound();

  return (
    <ProjectOverviewClient
      projectId={project.id}
      projectName={project.name}
      projectDescription={project.description ?? ''}
      projectStatus={project.status}
      createdAt={project.createdAt.toISOString()}
    />
  );
}
