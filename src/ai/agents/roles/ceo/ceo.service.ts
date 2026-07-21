import { prisma } from '@/lib/prisma';
import { requirementBuilderTool, featurePlannerTool, roadmapGeneratorTool } from './ceo.tools';
import { getMemoryManager } from '@/ai/agents/memory/memory.manager';
import { logAIEvent } from '@/ai/monitoring/ai.logger';
import { ceoAnalysisSchema, type CEOAnalysis } from './ceo.types';
import type { ApiResult } from '@/types/common.types';

const CEO_ROLE_NAME = 'CEO AI';
const TOOL_DELAY_MS = 1500;

const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function getOrCreateCEOAgentId(): Promise<string> {
  const existing = await prisma.agent.findFirst({ where: { role: 'CEO' } });
  if (existing) return existing.id;
  const created = await prisma.agent.create({
    data: { name: CEO_ROLE_NAME, role: 'CEO', status: 'IDLE', capabilities: [] },
  });
  return created.id;
}

export async function analyzeUserIdea(
  projectId: string,
  userIdea: string,
): Promise<ApiResult<CEOAnalysis>> {
  const agentId = await getOrCreateCEOAgentId();
  await prisma.agent.update({
    where: { id: agentId },
    data: { status: 'WORKING' },
  });
  await logAIEvent('CEO_ANALYSIS_STARTED', { projectId }, agentId);

  try {
    const memory = getMemoryManager();
    const priorMemory = await memory.search(agentId, projectId, 5);
    const contextNote = priorMemory.length
      ? `Note prior decisions for this project:\n${priorMemory.map((m) => `- ${m.content}`).join('\n')}`
      : '';

    const visionResult = await requirementBuilderTool.execute({
      userIdea: contextNote ? `${userIdea}\n\n${contextNote}` : userIdea,
      projectId,
      agentId,
    });
    if (!visionResult.success) throw new Error(visionResult.error);

    await delay(TOOL_DELAY_MS);

    const requirementsResult = await featurePlannerTool.execute({
      vision: visionResult.data,
      projectId,
      agentId,
    });
    if (!requirementsResult.success) throw new Error(requirementsResult.error);

    await delay(TOOL_DELAY_MS);

    const planResult = await roadmapGeneratorTool.execute({
      requirements: requirementsResult.data,
      projectId,
      agentId,
    });
    if (!planResult.success) throw new Error(planResult.error);

    const analysis = ceoAnalysisSchema.parse({
      vision: visionResult.data,
      requirements: requirementsResult.data,
      plan: planResult.data,
    });

    await Promise.all([
      prisma.document.create({
        data: {
          projectId,
          type: 'VISION',
          title: 'Product Vision',
          content: JSON.stringify(analysis.vision),
        },
      }),
      prisma.document.create({
        data: {
          projectId,
          type: 'REQUIREMENTS',
          title: 'Product Requirements',
          content: JSON.stringify(analysis.requirements),
        },
      }),
      prisma.document.create({
        data: {
          projectId,
          type: 'PLAN',
          title: 'Development Plan',
          content: JSON.stringify(analysis.plan),
        },
      }),
      memory.remember({
        agentId,
        content: `Project ${projectId}: ${analysis.vision.problem} → ${analysis.vision.solution}`,
        type: 'PROJECT',
        metadata: { projectId },
      }),
    ]);

    await prisma.agent.update({
      where: { id: agentId },
      data: { status: 'IDLE' },
    });
    await logAIEvent('CEO_ANALYSIS_COMPLETED', { projectId }, agentId);

    return { success: true, data: analysis };
  } catch (err) {
    await prisma.agent.update({
      where: { id: agentId },
      data: { status: 'ERROR' },
    });
    await logAIEvent('CEO_ANALYSIS_FAILED', { projectId, error: String(err) }, agentId);
    return {
      success: false,
      error: {
        message: err instanceof Error ? err.message : 'CEO analysis failed',
        code: 'AI_ERROR',
      },
    };
  }
}

export async function getProductDocuments(projectId: string) {
  return prisma.document.findMany({
    where: { projectId, type: { in: ['VISION', 'REQUIREMENTS', 'PLAN'] } },
    orderBy: { createdAt: 'desc' },
  });
}
