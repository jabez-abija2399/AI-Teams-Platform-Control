import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { toResponse, unauthorizedResponse } from '@/lib/api-response';
import { generateUiDesignSpec } from '@/packages/agents/roles/ui-designer/ui-designer.service';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const requestSchema = z.object({
  projectId: z.string(),
  ujw: z.unknown().optional(),
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

  let ujw = parsed.data.ujw;
  if (!ujw) {
    const ujwRecord = await prisma.uxResearchDocument.findFirst({
      where: { projectId: parsed.data.projectId },
      orderBy: { createdAt: 'desc' },
    });
    if (ujwRecord) {
      ujw = {
        userJourney: ujwRecord.userJourney,
        empathyMap: ujwRecord.empathyMap,
        painPoints: ujwRecord.painPoints,
        personas: ujwRecord.personas,
        screenInventory: ujwRecord.screenInventory,
      };
    } else {
      const doc = await prisma.document.findFirst({
        where: { projectId: parsed.data.projectId, type: 'USER_JOURNEY' },
        orderBy: { createdAt: 'desc' },
      });
      if (!doc) {
        return NextResponse.json(
          { success: false, error: { message: 'No User Journey found. Run UX Researcher AI first.', code: 'PREREQUISITE_MISSING' } },
          { status: 400 },
        );
      }
      ujw = JSON.parse(doc.content);
    }
  }

  const result = await generateUiDesignSpec(parsed.data.projectId, ujw);

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
