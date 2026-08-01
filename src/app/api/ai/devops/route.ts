import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { toResponse, unauthorizedResponse } from '@/lib/api-response';
import { generateDevopsPlanSpec } from '@/ai/agents/roles/devops/devops.service';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const requestSchema = z.object({
  projectId: z.string(),
  input: z.unknown().optional(),
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

  let inputData = parsed.data.input;
  if (!inputData) {
    const secRecord = await prisma.securityReportDocument.findFirst({
      where: { projectId: parsed.data.projectId },
      orderBy: { createdAt: 'desc' },
    });
    const beRecord = await prisma.backendDesignDocument.findFirst({
      where: { projectId: parsed.data.projectId },
      orderBy: { createdAt: 'desc' },
    });

    if (secRecord || beRecord) {
      inputData = {
        securityRemediation: secRecord?.remediationPlan,
        securityInfra: secRecord?.infrastructureReview,
        backendJobs: beRecord?.backgroundJobs,
        backendWorkers: beRecord?.workerDefinitions,
      };
    } else {
      const archRecord = await prisma.architectureDocument.findFirst({
        where: { projectId: parsed.data.projectId },
        orderBy: { createdAt: 'desc' },
      });
      if (archRecord) {
        inputData = {
          architecture: archRecord.architecture,
        };
      } else {
        return NextResponse.json(
          { success: false, error: { message: 'No Security, Backend, or Architecture documents found. Run previous engineering roles first.', code: 'PREREQUISITE_MISSING' } },
          { status: 400 },
        );
      }
    }
  }

  const result = await generateDevopsPlanSpec(parsed.data.projectId, inputData);

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
