import { redirect } from 'next/navigation';
import { getAuthSession } from '@/lib/session-helper';
import { prisma } from '@/lib/prisma';
import { PageContainer } from '@/components/layout/page-container';
import { AgentOverview } from '@/features/ai-dashboard/components/agent-overview';
import { WorkflowProgressCard } from '@/features/ai-dashboard/components/workflow-progress';
import { TaskBoard } from '@/features/ai-dashboard/components/task-board';
import { ConversationPanel } from '@/features/ai-dashboard/components/conversation-panel';
import { EmptyState } from '@/components/ui/empty-state';
import { Bot } from 'lucide-react';
import Link from 'next/link';
import { buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { ROUTES } from '@/config/constants';

export default async function AITeamsPage() {
  const session = await getAuthSession();
  if (!session?.user?.id) redirect('/login');

  const activeProject = await prisma.project.findFirst({
    where: { ownerId: session.user.id },
    orderBy: { updatedAt: 'desc' },
    select: { id: true, name: true },
  });

  if (!activeProject) {
    return (
      <PageContainer>
        <div>
          <h1 className="font-heading text-3xl font-semibold tracking-tight">AI Teams</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Monitor AI employees and live pipeline activity.
          </p>
        </div>
        <div className="flex flex-col items-center gap-4 py-10">
          <EmptyState
            icon={Bot}
            title="No projects yet"
            description="Create a project to see your AI company assemble and start building."
          />
          <Link href={`${ROUTES.projects}/new`} className={cn(buttonVariants(), 'rounded-xl')}>
            Create project
          </Link>
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-heading text-3xl font-semibold tracking-tight">AI Teams</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Monitoring agents for{' '}
            <span className="font-medium text-foreground">{activeProject.name}</span>
          </p>
        </div>
        <Link
          href={`${ROUTES.projects}/${activeProject.id}/workspace`}
          className={cn(buttonVariants({ variant: 'outline', size: 'sm' }), 'rounded-xl')}
        >
          Open workspace
        </Link>
      </div>
      <div className="grid gap-6">
        <AgentOverview />
        <div className="grid gap-6 md:grid-cols-2">
          <WorkflowProgressCard projectId={activeProject.id} />
          <TaskBoard projectId={activeProject.id} />
        </div>
        <ConversationPanel projectId={activeProject.id} />
      </div>
    </PageContainer>
  );
}
