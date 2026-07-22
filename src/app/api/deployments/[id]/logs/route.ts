import { auth } from '@/lib/auth';
import { toResponse, unauthorizedResponse } from '@/lib/api-response';
import { getDeploymentLogs } from '@/features/deployment/services/deployment.service';

interface Params {
  params: Promise<{ id: string }>;
}

export async function GET(_request: Request, { params }: Params) {
  const session = await auth();
  if (!session?.user?.id) return unauthorizedResponse();

  const { id } = await params;
  const result = await getDeploymentLogs(id);
  return toResponse(result);
}
