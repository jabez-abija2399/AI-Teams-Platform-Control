import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { toResponse, unauthorizedResponse } from '@/lib/api-response';
import { designArchitecture } from '@/ai/agents/roles/architect/architect.service';
import { prisma } from '@/lib/prisma';
import { productRequirementSchema } from '@/ai/agents/roles/ceo/ceo.types';
import { z } from 'zod';

const requestSchema = z.object({
  projectId: z.string(),
  requirements: productRequirementSchema.optional(),
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

  let requirements = parsed.data.requirements;
  if (!requirements) {
    const reqDoc = await prisma.document.findFirst({
      where: { projectId: parsed.data.projectId, type: 'REQUIREMENTS' },
      orderBy: { createdAt: 'desc' },
    });
    if (!reqDoc) {
      return NextResponse.json(
        { success: false, error: { message: 'No requirements found. Run CEO AI first.', code: 'PREREQUISITE_MISSING' } },
        { status: 400 },
      );
    }
    try {
      requirements = productRequirementSchema.parse(JSON.parse(reqDoc.content));
    } catch {
      return NextResponse.json(
        { success: false, error: { message: 'Stored requirements are malformed.', code: 'DATA_ERROR' } },
        { status: 500 },
      );
    }
  }

  const result = await designArchitecture(parsed.data.projectId, requirements);

  let tokensUsed = 0;
  try {
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
