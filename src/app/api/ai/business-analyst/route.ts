import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { toResponse, unauthorizedResponse } from '@/lib/api-response';
import { generateSoftwareRequirementSpec } from '@/ai/agents/roles/business-analyst/business-analyst.service';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const requestSchema = z.object({
  projectId: z.string(),
  prd: z.unknown().optional(),
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

  let prd = parsed.data.prd;
  if (!prd) {
    const prdRecord = await prisma.productRequirement.findFirst({
      where: { projectId: parsed.data.projectId },
      orderBy: { createdAt: 'desc' },
    });
    if (prdRecord) {
      prd = {
        prd: prdRecord.prd,
        personas: prdRecord.personas,
        stories: prdRecord.stories,
        acceptanceCriteria: prdRecord.acceptanceCriteria,
        functionalRequirements: [],
        nonFunctionalRequirements: [],
      };
    } else {
      const doc = await prisma.productDocument.findFirst({
        where: { projectId: parsed.data.projectId },
        orderBy: { createdAt: 'desc' },
      });
      if (!doc) {
        return NextResponse.json(
          { success: false, error: { message: 'No PRD found. Run Product Manager AI first.', code: 'PREREQUISITE_MISSING' } },
          { status: 400 },
        );
      }
      prd = doc.requirements;
    }
  }

  const result = await generateSoftwareRequirementSpec(parsed.data.projectId, prd);

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
