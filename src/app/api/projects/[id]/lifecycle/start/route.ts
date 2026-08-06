import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { toResponse, unauthorizedResponse } from '@/lib/api-response';
import { ProjectLifecycleService } from '@/core/company-orchestration';
import { userHasAiCredential } from '@/features/ai-credentials/ai-credentials.service';
import { prisma } from '@/lib/prisma';

interface Params {
  params: Promise<{ id: string }>;
}

export async function POST(request: Request, { params }: Params) {
  const session = await auth();
  if (!session?.user?.id) return unauthorizedResponse();

  const { id } = await params;

  const project = await prisma.project.findFirst({
    where: { id, ownerId: session.user.id },
    select: { id: true },
  });
  if (!project) {
    return NextResponse.json(
      { success: false, error: { message: 'Project not found', code: 'NOT_FOUND' } },
      { status: 404 },
    );
  }

  const hasKey = await userHasAiCredential(session.user.id);
  if (!hasKey) {
    return NextResponse.json(
      {
        success: false,
        error: {
          message:
            'Add an AI API key in Settings before starting the pipeline. Your AI employees need it to work.',
          code: 'API_KEY_REQUIRED',
        },
      },
      { status: 400 },
    );
  }

  let userIdea: string | undefined;
  try {
    const body = await request.json();
    userIdea = body?.userIdea;
  } catch {
    // Body is optional
  }

  const result = await ProjectLifecycleService.startLifecycle(id, userIdea);
  return toResponse(result);
}
