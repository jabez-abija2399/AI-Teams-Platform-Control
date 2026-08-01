import { NextResponse } from 'next/server';
import { getObservabilityService } from '@/core/execution-engine/observability.service';
import { getCollaborationManager } from '@/core/execution-engine/collaboration.manager';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: projectId } = await params;
    const observability = getObservabilityService();
    const collabManager = getCollaborationManager();

    const [dashboard, agents, timeline, collaboration] = await Promise.all([
      observability.getProjectDashboard(projectId),
      observability.getAgentAnalytics(projectId),
      observability.getExecutionTimeline(projectId),
      collabManager.getRecentContext(projectId, 20),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        dashboard,
        agents,
        timeline,
        collaboration,
      },
    });
  } catch (error) {
    console.error('[Observability API] Error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to retrieve observability data' },
      { status: 500 }
    );
  }
}
