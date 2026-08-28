import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { toResponse, unauthorizedResponse } from '@/lib/api-response';
import { generateBackendDesignSpec } from '@/packages/agents/roles/backend/backend.service';
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
    const dbRecord = await prisma.databaseDesignDocument.findFirst({
      where: { projectId: parsed.data.projectId },
      orderBy: { createdAt: 'desc' },
    });
    if (dbRecord) {
      inputData = {
        erd: dbRecord.erd,
        prismaSchema: dbRecord.prismaSchema,
        indexes: dbRecord.indexes,
        relations: dbRecord.relations,
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
          databaseDesign: archRecord.databaseDesign,
        };
      } else {
        const prd = await prisma.productRequirement.findFirst({
          where: { projectId: parsed.data.projectId },
          orderBy: { createdAt: 'desc' },
        });
        if (prd) {
          inputData = { prd };
        } else {
          return NextResponse.json(
            { success: false, error: { message: 'No Database Design or Architecture found. Run Database Engineer or Architect AI first.', code: 'PREREQUISITE_MISSING' } },
            { status: 400 },
          );
        }
      }
    }
  }

  const result = await generateBackendDesignSpec(parsed.data.projectId, inputData);

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
