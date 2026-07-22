import { auth } from '@/lib/auth';
import { toResponse, unauthorizedResponse } from '@/lib/api-response';
import { listDeployments, createDeployment } from '@/features/deployment/services/deployment.service';
import type { DeployInput } from '@/features/deployment/types';

interface Params {
  params: Promise<{ id: string }>;
}

export async function GET(request: Request, { params }: Params) {
  const session = await auth();
  if (!session?.user?.id) return unauthorizedResponse();

  const { id } = await params;
  const url = new URL(request.url);
  const filter: Record<string, string> = {};
  const environmentId = url.searchParams.get('environmentId');
  const status = url.searchParams.get('status');
  if (environmentId) filter.environmentId = environmentId;
  if (status) filter.status = status;

  const result = await listDeployments(id, Object.keys(filter).length ? filter : undefined);
  return toResponse(result);
}

export async function POST(request: Request, { params }: Params) {
  const session = await auth();
  if (!session?.user?.id) return unauthorizedResponse();

  const { id } = await params;
  const body = (await request.json()) as Omit<DeployInput, 'projectId'>;
  const input: DeployInput = { ...body, projectId: id };
  const result = await createDeployment(input);
  return toResponse(result, 201);
}
