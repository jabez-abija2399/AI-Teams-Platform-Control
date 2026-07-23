import { prisma } from '@/lib/prisma';
import { requirementRefinementTool } from './product-manager.tools';
import { getMemoryManager } from '@/ai/agents/memory/memory.manager';
import { logAIEvent } from '@/ai/monitoring/ai.logger';
import { refinedRequirementsSchema, type RefinedRequirements } from './product-manager.types';
import type { CEOAnalysis } from '@/ai/agents/roles/ceo/ceo.types';
import type { ApiResult } from '@/types/common.types';

const PM_ROLE_NAME = 'Product Manager AI';

async function getOrCreatePMAgentId(): Promise<string> {
  const existing = await prisma.agent.findFirst({ where: { role: 'PRODUCT_MANAGER' } });
  if (existing) return existing.id;
  const created = await prisma.agent.create({
    data: { name: PM_ROLE_NAME, role: 'PRODUCT_MANAGER', status: 'IDLE', capabilities: ['REQUIREMENTS_ANALYSIS'] },
  });
  return created.id;
}

export async function refineRequirements(
  projectId: string,
  ceoAnalysis: CEOAnalysis,
): Promise<ApiResult<RefinedRequirements>> {
  const agentId = await getOrCreatePMAgentId();

  await prisma.document.deleteMany({ where: { projectId, type: 'PM_IN_PROGRESS' } });
  await prisma.document.create({
    data: { projectId, type: 'PM_IN_PROGRESS', title: 'PM Refinement In Progress', content: '{}', author: 'Product Manager AI' },
  });

  await prisma.agent.update({ where: { id: agentId }, data: { status: 'WORKING' } });
  await logAIEvent('PM_REFINEMENT_STARTED', { projectId }, agentId);

  try {
    const result = await requirementRefinementTool.execute({ ceoAnalysis, projectId, agentId });
    if (!result.success) throw new Error(result.error);

    const refined = refinedRequirementsSchema.parse(result.data);

    const memory = getMemoryManager();
    await Promise.all([
      prisma.document.create({
        data: {
          projectId,
          type: 'REFINED_REQUIREMENTS',
          title: 'Refined Requirements',
          content: JSON.stringify(refined),
          author: 'Product Manager AI',
        },
      }),
      memory.remember({
        agentId,
        content: `Project ${projectId}: Refined ${refined.userStories.length} user stories, ${refined.featureSpecs.length} feature specs`,
        type: 'PROJECT',
        metadata: { projectId },
      }),
    ]);

    await prisma.document.deleteMany({ where: { projectId, type: 'PM_IN_PROGRESS' } });
    await prisma.agent.update({ where: { id: agentId }, data: { status: 'IDLE' } });
    await logAIEvent('PM_REFINEMENT_COMPLETED', { projectId }, agentId);

    return { success: true, data: refined };
  } catch (err) {
    await prisma.document.deleteMany({ where: { projectId, type: 'PM_IN_PROGRESS' } });
    await prisma.agent.update({ where: { id: agentId }, data: { status: 'ERROR' } });
    await logAIEvent('PM_REFINEMENT_FAILED', { projectId, error: String(err) }, agentId);
    return { success: false, error: { message: err instanceof Error ? err.message : 'PM refinement failed', code: 'AI_ERROR' } };
  }
}
