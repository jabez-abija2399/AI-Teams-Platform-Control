import { redirect, notFound } from 'next/navigation';
import Link from 'next/link';
import { getAuthSession } from '@/lib/session-helper';
import { getProject } from '@/features/projects/services/project.service';
import { ProjectHistoryStageView } from '@/components/workspace/stages/project-history-stage-view';
import { ROUTES } from '@/config/constants';
import { ArrowLeft, Clock, Code2 } from 'lucide-react';

export const metadata = {
  title: 'Project Engineering History | HibirDev AI',
};

export default async function ProjectHistoryPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await getAuthSession();
  if (!session?.user?.id) redirect('/login');

  let project;
  try {
    project = await getProject(id, session.user.id);
  } catch {
    throw new Error('Could not load project');
  }
  if (!project) notFound();

  return (
    <div className="p-6 md:p-8 max-w-5xl mx-auto flex flex-col gap-6 font-sans">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-gray-800 pb-4">
        <div className="flex items-center gap-3">
          <Link
            href={`${ROUTES.projects}/${id}/workspace`}
            className="p-2 rounded-lg bg-gray-900 border border-gray-800 text-gray-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <h1 className="text-xl font-bold text-white font-mono">{project.name} — Engineering History</h1>
            <p className="text-xs text-gray-400 mt-0.5">
              Traceable chronological audit trail of all decision records and artifact versions.
            </p>
          </div>
        </div>

        <Link href={`${ROUTES.projects}/${id}/workspace`}>
          <button className="bg-indigo-600 hover:bg-indigo-500 text-white font-mono text-xs font-bold px-4 py-2 rounded flex items-center gap-1.5 shadow">
            <Code2 className="w-3.5 h-3.5" />
            Open Mission Control Workspace
          </button>
        </Link>
      </div>

      {/* History Stage Component */}
      <ProjectHistoryStageView projectId={id} />
    </div>
  );
}
