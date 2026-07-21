import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { unauthorizedResponse, toResponse } from '@/lib/api-response';
import { listRequirements } from '@/features/product-management/requirements/requirement.service';

export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user?.id) return unauthorizedResponse();

  const { searchParams } = new URL(request.url);
  const projectId = searchParams.get('projectId');
  const status = searchParams.get('status') ?? undefined;

  if (!projectId) {
    return NextResponse.json(
      { success: false, error: { message: 'projectId is required', code: 'VALIDATION_ERROR' } },
      { status: 400 },
    );
  }

  const result = await listRequirements(projectId, status);
  return toResponse(result);
}
