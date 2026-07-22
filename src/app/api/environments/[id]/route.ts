import { auth } from '@/lib/auth';
import { toResponse, unauthorizedResponse } from '@/lib/api-response';
import {
  getEnvironment,
  updateEnvironment,
  deleteEnvironment,
} from '@/features/deployment/services/environment.service';
import type { UpdateEnvironmentInput } from '@/features/deployment/schemas/deployment.schema';

interface Params {
  params: Promise<{ id: string }>;
}

export async function GET(_request: Request, { params }: Params) {
  const session = await auth();
  if (!session?.user?.id) return unauthorizedResponse();

  const { id } = await params;
  const result = await getEnvironment(id);
  return toResponse(result);
}

export async function PATCH(request: Request, { params }: Params) {
  const session = await auth();
  if (!session?.user?.id) return unauthorizedResponse();

  const { id } = await params;
  const body = (await request.json()) as UpdateEnvironmentInput;
  const result = await updateEnvironment(id, body);
  return toResponse(result);
}

export async function DELETE(_request: Request, { params }: Params) {
  const session = await auth();
  if (!session?.user?.id) return unauthorizedResponse();

  const { id } = await params;
  const result = await deleteEnvironment(id);
  return toResponse(result);
}
