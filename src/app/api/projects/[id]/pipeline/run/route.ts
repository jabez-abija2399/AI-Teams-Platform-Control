import { auth } from '@/lib/auth';
import { toResponse, unauthorizedResponse } from '@/lib/api-response';
import { CompanyPipelineEngine } from '@/core/company-orchestration/company-pipeline.engine';
import { CoreOrchestratorEngine } from '@/core/orchestrator/orchestrator.engine';
import { prisma } from '@/lib/prisma';

interface Params {
  params: Promise<{ id: string }>;
}

export async function POST(request: Request, { params }: Params) {
  const session = await auth();
  if (!session?.user?.id) return unauthorizedResponse();

  const { id } = await params;
  let body: { mission?: string; engine?: string; autoApprove?: boolean; useCoreOrchestrator?: boolean } = {};
  try {
    body = await request.json();
  } catch {}

  const project = await prisma.project.findUnique({ where: { id } });
  const mission = body?.mission || project?.description || 'Autonomous Software Engineering Mission';

  if (body?.useCoreOrchestrator || body?.engine === 'core') {
    // Run Core Orchestrator
    CoreOrchestratorEngine.executeMission({
      projectId: id,
      mission,
      autoApprove: body?.autoApprove ?? true,
    }).catch((err) => console.error('[PipelineRun] Core orchestrator error:', err));

    return toResponse({ success: true, data: { projectId: id, status: 'core_mission_started' } });
  }

  await CompanyPipelineEngine.runPipeline(id);
  return toResponse({ success: true, data: { projectId: id, status: 'pipeline_started' } });
}
