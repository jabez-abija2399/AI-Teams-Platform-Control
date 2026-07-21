import { notFound } from 'next/navigation';
import { auth } from '@/lib/auth';
import { getProject } from '@/features/projects/services/project.service';
import { ProjectDetails } from '@/features/projects/components/project-details';
import { ProjectTabsClient } from './project-tabs-client';

export default async function ProjectDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();

  if (!session?.user?.id) notFound();

  let project;
  try {
    project = await getProject(id, session.user.id);
  } catch (e: unknown) {
    console.error('getProject error:', e);
    throw e;
  }

  if (!project) notFound();

  return (
    <div className="space-y-6">
      <ProjectDetails project={project} />
      <ProjectTabsClient
        projectId={id}
        defaultIdea={project.description || project.name}
      />
    </div>
  );
}
