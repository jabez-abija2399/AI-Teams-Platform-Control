import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { toResponse, unauthorizedResponse } from '@/lib/api-response';
import { designArchitecture } from '@/ai/agents/roles/architect/architect.service';
import { z } from 'zod';

const requestSchema = z.object({
  projectId: z.string(),
  requirements: z.object({
    features: z.array(z.object({ name: z.string(), description: z.string() })),
    userStories: z.array(
      z.object({
        as: z.string(),
        iWant: z.string(),
        soThat: z.string(),
        priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']),
      }),
    ),
    priorities: z.array(z.string()),
    constraints: z.array(z.string()),
  }),
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

  const result = await designArchitecture(parsed.data.projectId, parsed.data.requirements);

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
