import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { toResponse, unauthorizedResponse } from '@/lib/api-response';
import { generateFrontendDesignSpec } from '@/packages/agents/roles/frontend/frontend.service';
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
    const beRecord = await prisma.backendDesignDocument.findFirst({
      where: { projectId: parsed.data.projectId },
      orderBy: { createdAt: 'desc' },
    });
    if (beRecord) {
      inputData = {
        restApis: beRecord.restApis,
        routeDefinitions: beRecord.routeDefinitions,
        openApiSpec: beRecord.openApiSpec,
      };
    } else {
      const uiRecord = await prisma.uiDesignDocument.findFirst({
        where: { projectId: parsed.data.projectId },
        orderBy: { createdAt: 'desc' },
      });
      if (uiRecord) {
        inputData = {
          designTokens: uiRecord.designTokens,
          pageDesigns: uiRecord.pageDesigns,
          componentHierarchy: uiRecord.componentHierarchy,
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
            { success: false, error: { message: 'No Backend Design, UI Design, or Architecture found. Run Backend, UI Designer, or Architect AI first.', code: 'PREREQUISITE_MISSING' } },
            { status: 400 },
          );
        }
      }
    }
  }

  const result = await generateFrontendDesignSpec(parsed.data.projectId, inputData);

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
