import { auth } from '@/lib/auth';
import { toResponse, unauthorizedResponse } from '@/lib/api-response';
import { listEnvironments, createEnvironment } from '@/features/deployment/services/environment.service';
import type { CreateEnvironmentInput } from '@/features/deployment/schemas/deployment.schema';

interface Params {
  params: Promise<{ id: string }>;
}

export async function GET(_request: Request, { params }: Params) {
  const session = await auth();
  if (!session?.user?.id) return unauthorizedResponse();

  const { id } = await params;
  const result = await listEnvironments(id);
  return toResponse(result);
}

export async function POST(request: Request, { params }: Params) {
  const session = await auth();
  if (!session?.user?.id) return unauthorizedResponse();

  const { id } = await params;
  const body = (await request.json()) as CreateEnvironmentInput;
  const result = await createEnvironment(id, body);
  return toResponse(result, 201);
}
