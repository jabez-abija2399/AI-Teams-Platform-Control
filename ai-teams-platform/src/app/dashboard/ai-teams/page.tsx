import { PageContainer } from '@/components/layout/page-container';
import { AgentOverview } from '@/features/ai-dashboard/components/agent-overview';
import { WorkflowProgressCard } from '@/features/ai-dashboard/components/workflow-progress';
import { TaskBoard } from '@/features/ai-dashboard/components/task-board';
import { ConversationPanel } from '@/features/ai-dashboard/components/conversation-panel';

export default function AITeamsPage() {
  return (
    <PageContainer>
      <h1 className="text-2xl font-bold">AI Teams</h1>
      <p className="text-muted-foreground text-sm">Monitor AI agents and workflows</p>
      <div className="grid gap-6">
        <AgentOverview />

        <div className="grid gap-6 md:grid-cols-2">
          <WorkflowProgressCard projectId="demo" />
          <TaskBoard projectId="demo" />
        </div>

        <ConversationPanel projectId="demo" />
      </div>
    </PageContainer>
  );
}
