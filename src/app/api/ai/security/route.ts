import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { toResponse, unauthorizedResponse } from '@/lib/api-response';
import { generateSecurityReportSpec } from '@/packages/agents/roles/security-auditor/security-auditor.service';
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
    const qaRecord = await prisma.qaReportDocument.findFirst({
      where: { projectId: parsed.data.projectId },
      orderBy: { createdAt: 'desc' },
    });
    const feRecord = await prisma.frontendDesignDocument.findFirst({
      where: { projectId: parsed.data.projectId },
      orderBy: { createdAt: 'desc' },
    });
    const beRecord = await prisma.backendDesignDocument.findFirst({
      where: { projectId: parsed.data.projectId },
      orderBy: { createdAt: 'desc' },
    });

    if (qaRecord || feRecord || beRecord) {
      inputData = {
        qaReport: qaRecord?.qualityReport,
        frontendAuth: feRecord?.apiIntegration,
        backendAuth: beRecord?.authentication,
        backendRbac: beRecord?.authorization,
      };
    } else {
      const archRecord = await prisma.architectureDocument.findFirst({
        where: { projectId: parsed.data.projectId },
        orderBy: { createdAt: 'desc' },
      });
      if (archRecord) {
        inputData = {
          architecture: archRecord.architecture,
          apiSpec: archRecord.apiSpec,
        };
      } else {
        return NextResponse.json(
          { success: false, error: { message: 'No QA, Frontend, Backend, or Architecture documents found. Run previous engineering roles first.', code: 'PREREQUISITE_MISSING' } },
          { status: 400 },
        );
      }
    }
  }

  const result = await generateSecurityReportSpec(parsed.data.projectId, inputData);

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
