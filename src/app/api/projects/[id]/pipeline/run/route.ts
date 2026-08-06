import { auth } from '@/lib/auth';
import { toResponse, unauthorizedResponse } from '@/lib/api-response';
import { CompanyPipelineEngine } from '@/core/company-orchestration/company-pipeline.engine';

interface Params {
  params: Promise<{ id: string }>;
}

export async function POST(request: Request, { params }: Params) {
  const session = await auth();
  if (!session?.user?.id) return unauthorizedResponse();

  const { id } = await params;
  await CompanyPipelineEngine.runPipeline(id);
  return toResponse({ success: true, data: { projectId: id, status: 'pipeline_started' } });
}
