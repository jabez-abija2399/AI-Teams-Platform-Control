import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { toResponse, unauthorizedResponse } from '@/lib/api-response';
import { canonicalOrchestrator } from '@/core/canonical-orchestrator/canonical-core-orchestrator';
import { userHasAiCredential } from '@/features/ai-credentials/ai-credentials.service';
import { prisma } from '@/lib/prisma';

interface Params {
  params: Promise<{ id: string }>;
}

export async function POST(request: Request, { params }: Params) {
  const session = await auth();
  if (!session?.user?.id) return unauthorizedResponse();

  const { id } = await params;

  let project = await prisma.project.findFirst({
    where: {
      OR: [
        { id, ownerId: session.user.id },
        { id },
      ],
    },
    select: { id: true, name: true, description: true },
  });

  if (!project) {
    // Ensure user exists in database
    await prisma.user.upsert({
      where: { id: session.user.id },
      create: {
        id: session.user.id,
        email: session.user.email || 'user@aiteams.com',
        name: session.user.name || 'User',
      },
      update: {},
    });

    // Create the project in DB so pipeline & relations have a real DB entity
    project = await prisma.project.create({
      data: {
        id,
        name: 'AI Generated Application',
        slug: `ai-app-${id.slice(-6)}`,
        description: 'Complete AI Project generated in autonomous workspace.',
        ownerId: session.user.id,
        status: 'IN_PROGRESS',
        selectedStackId: 'nextjs-fullstack-v1',
        selectedStackVersion: '1.0.0',
        stackSource: 'PLATFORM_TEMPLATE',
        favorite: true,
      },
      select: { id: true, name: true, description: true },
    });
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

  const result = await canonicalOrchestrator.startMission(id, {
    userIdea: userIdea || project.description || project.name,
    missionTitle: project.name,
  });
  return toResponse(result);
}
