import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { toResponse, unauthorizedResponse } from '@/lib/api-response';
import { generateProductRequirementsSpec } from '@/ai/agents/roles/product-manager/product-manager.service';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const requestSchema = z.object({
  projectId: z.string(),
  vision: z.unknown().optional(),
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

  let vision = parsed.data.vision;
  if (!vision) {
    const proposalRecord = await prisma.productProposal.findFirst({
      where: { projectId: parsed.data.projectId },
      orderBy: { createdAt: 'desc' },
    });
    if (proposalRecord) {
      const propObj = (proposalRecord.proposal && typeof proposalRecord.proposal === 'object' ? proposalRecord.proposal : {}) as Record<string, unknown>;
      vision = {
        title: propObj.name ?? propObj.title ?? 'Product Proposal',
        vision: propObj.vision ?? '',
        targetAudience: propObj.targetAudience ?? '',
        problemStatement: propObj.problemStatement ?? '',
      };
    } else {
      const proj = await prisma.project.findUnique({
        where: { id: parsed.data.projectId },
      });
      if (!proj) {
        return NextResponse.json(
          { success: false, error: { message: 'Project not found', code: 'NOT_FOUND' } },
          { status: 404 },
        );
      }
      vision = {
        title: proj.name,
        vision: proj.description ?? proj.name,
      };
    }
  }

  const result = await generateProductRequirementsSpec(parsed.data.projectId, vision);

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
