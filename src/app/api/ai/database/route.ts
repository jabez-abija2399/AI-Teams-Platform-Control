import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { toResponse, unauthorizedResponse } from '@/lib/api-response';
import { generateDatabaseDesignSpec } from '@/packages/agents/roles/database/database.service';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const requestSchema = z.object({
  projectId: z.string(),
  architecture: z.unknown().optional(),
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

  let archData = parsed.data.architecture;
  if (!archData) {
    const archRecord = await prisma.architectureDocument.findFirst({
      where: { projectId: parsed.data.projectId },
      orderBy: { createdAt: 'desc' },
    });
    if (archRecord) {
      archData = {
        architecture: archRecord.architecture,
        apiSpec: archRecord.apiSpec,
        decisions: archRecord.decisions,
      };
    } else {
      const doc = await prisma.document.findFirst({
        where: { projectId: parsed.data.projectId, type: { in: ['SYSTEM_ARCHITECTURE', 'SRS_SPEC', 'PRD'] } },
        orderBy: { createdAt: 'desc' },
      });
      if (doc) {
        archData = JSON.parse(doc.content);
      } else {
        const prd = await prisma.productRequirement.findFirst({
          where: { projectId: parsed.data.projectId },
          orderBy: { createdAt: 'desc' },
        });
        if (prd) {
          archData = { prd };
        } else {
          return NextResponse.json(
            { success: false, error: { message: 'No Architecture or Product specifications found. Run Architect or Product Manager AI first.', code: 'PREREQUISITE_MISSING' } },
            { status: 400 },
          );
        }
      }
    }
  }

  const result = await generateDatabaseDesignSpec(parsed.data.projectId, archData);

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
