import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { toResponse, unauthorizedResponse } from '@/lib/api-response';
import { analyzeUserIdea } from '@/ai/agents/roles/ceo/ceo.service';
import { z } from 'zod';

const requestSchema = z.object({
  projectId: z.string(),
  userIdea: z.string().min(1),
});

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) return unauthorizedResponse();

  const body = await request.json();
  const parsed = requestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { success: false, error: { message: 'Invalid request', code: 'VALIDATION_ERROR' } },
      { status: 400 },
    );
  }

  const result = await analyzeUserIdea(parsed.data.projectId, parsed.data.userIdea);

  let tokensUsed = 0;
  try {
    const { prisma } = await import('@/lib/prisma');
    const latestUsage = await prisma.aIUsageLog.findFirst({
      where: { projectId: parsed.data.projectId },
      orderBy: { createdAt: 'desc' },
    });
    tokensUsed = latestUsage?.totalTokens ?? 0;
  } catch {
    // non-critical
  }

  if (!result.success) return toResponse(result);

  return NextResponse.json({
    success: true,
    data: { ...result.data, _tokensUsed: tokensUsed },
  });
}
