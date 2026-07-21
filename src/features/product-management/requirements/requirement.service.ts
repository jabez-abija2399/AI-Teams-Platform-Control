import { prisma } from '@/lib/prisma';
import { generateStructured } from '@/ai/services/ai.service';
import type { ApiResult } from '@/types/common.types';

interface RequirementData {
  title: string;
  description: string;
  category: string;
  priority: string;
}

interface MaterializedRequirement {
  id: string;
  projectId: string;
  title: string;
  description: string;
  category: string;
  priority: string;
  status: string;
  createdAt: Date;
}

export async function materializeRequirements(
  projectId: string,
  agentId: string,
  visionSummary: string,
): Promise<ApiResult<MaterializedRequirement[]>> {
  const project = await prisma.project.findFirst({ where: { id: projectId } });
  if (!project) {
    return { success: false, error: { message: 'Project not found', code: 'NOT_FOUND' } };
  }

  const result = await generateStructured<{ requirements: RequirementData[] }>(
    {
      messages: [
        {
          role: 'user',
          content: `Analyze this product vision and break it down into discrete, actionable requirements. Each requirement should have a clear title, description, category (FUNCTIONAL, NON_FUNCTIONAL, TECHNICAL, UX), and priority (LOW, MEDIUM, HIGH, URGENT).\n\nVision:\n${visionSummary}`,
        },
      ],
      systemPrompt:
        'You are a senior product manager. Convert product visions into well-structured requirements. Return JSON with a "requirements" array.',
    },
    { projectId },
  );

  if (!result.success) {
    return { success: false, error: result.error };
  }

  const requirementsData = result.data.requirements ?? [];

  const created = await prisma.$transaction(
    requirementsData.map((req) =>
      prisma.requirement.create({
        data: {
          projectId,
          title: req.title,
          description: req.description,
          category: req.category || 'FUNCTIONAL',
          priority: req.priority || 'MEDIUM',
          status: 'IDEA',
        },
      }),
    ),
  );

  return { success: true, data: created };
}

export async function listRequirements(
  projectId: string,
  status?: string,
): Promise<ApiResult<MaterializedRequirement[]>> {
  const project = await prisma.project.findFirst({ where: { id: projectId } });
  if (!project) {
    return { success: false, error: { message: 'Project not found', code: 'NOT_FOUND' } };
  }

  const where: { projectId: string; status?: string } = { projectId };
  if (status) where.status = status;

  const requirements = await prisma.requirement.findMany({
    where,
    orderBy: { createdAt: 'desc' },
  });

  return { success: true, data: requirements };
}

export async function updateRequirementStatus(
  requirementId: string,
  status: string,
): Promise<ApiResult<MaterializedRequirement>> {
  const existing = await prisma.requirement.findFirst({ where: { id: requirementId } });
  if (!existing) {
    return { success: false, error: { message: 'Requirement not found', code: 'NOT_FOUND' } };
  }

  const validStatuses = ['IDEA', 'PLANNED', 'IN_DEVELOPMENT', 'TESTING', 'RELEASED'];
  if (!validStatuses.includes(status)) {
    return {
      success: false,
      error: { message: `Invalid status. Must be one of: ${validStatuses.join(', ')}`, code: 'VALIDATION_ERROR' },
    };
  }

  const updated = await prisma.requirement.update({
    where: { id: requirementId },
    data: { status },
  });

  return { success: true, data: updated };
}
