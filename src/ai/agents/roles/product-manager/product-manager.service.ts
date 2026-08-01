import { prisma } from '@/lib/prisma';
import { requirementRefinementTool } from './product-manager.tools';
import { getMemoryManager } from '@/ai/agents/memory/memory.manager';
import { logAIEvent } from '@/ai/monitoring/ai.logger';
import { aiCall } from '@/ai/agents/core/ai-call';
import { productManagerConfig } from './product-manager.config';
import {
  refinedRequirementsSchema,
  productRequirementSpecSchema,
  type RefinedRequirements,
  type ProductRequirementSpec,
} from './product-manager.types';
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

export async function generateProductRequirementsSpec(
  projectId: string,
  vision: unknown,
): Promise<ApiResult<ProductRequirementSpec>> {
  const agentId = await getOrCreatePMAgentId();

  await prisma.agent.update({ where: { id: agentId }, data: { status: 'WORKING' } });
  await logAIEvent('PM_PRD_GENERATION_STARTED', { projectId }, agentId);

  try {
    const prompt = `Product Vision:\n${JSON.stringify(vision, null, 2)}\n\nGenerate comprehensive product documentation (PRD-001). Produce JSON with EXACT keys:\n- prd: {title, vision, targetAudience, problemStatement}\n- personas: array of {id, name, role, goals, painPoints, behaviors}\n- stories: array of {id, title, asA, iWant, soThat, acceptanceCriteria, priority, estimatedEffort}\n- acceptanceCriteria: object mapping story ID to array of string criteria\n- functionalRequirements: array of {id, module, requirement, priority}\n- nonFunctionalRequirements: array of {category, requirement, rationale}\n- mvpScope: {inScope: string[], outOfScope: string[], coreValueProposition: string}\n- featurePriorities: array of {featureName, priority, effort, businessValue}\n- roadmap: array of {id, phase, title, description, targetTimeline, deliverables}\n- releasePlan: {version, releaseDateTarget, scope, includedFeatures, rolloutStrategy}\n- dependencies: string[]\n- risks: array of {risk, mitigation, severity}\n- status: "APPROVED"\n\nRespond ONLY with valid JSON.`;

    const raw = await aiCall<unknown>(
      prompt,
      `You are Product Manager AI. Your mission is to generate complete, production-ready Product Requirement Specifications (PRD-001) that bridge business goals and engineering implementation.`,
      'PRODUCT_MANAGER',
      productManagerConfig,
      projectId,
      agentId,
    );

    const spec = productRequirementSpecSchema.parse(raw);

    const memory = getMemoryManager();
    const [savedReq] = await Promise.all([
      prisma.productRequirement.create({
        data: {
          projectId,
          prd: spec.prd as any,
          personas: spec.personas as any,
          stories: spec.stories as any,
          acceptanceCriteria: spec.acceptanceCriteria as any,
          roadmap: spec.roadmap as any,
          featurePriorities: spec.featurePriorities as any,
          releasePlan: spec.releasePlan as any,
          dependencies: spec.dependencies as any,
          risks: spec.risks as any,
          status: spec.status,
        },
      }),
      prisma.productDocument.create({
        data: {
          projectId,
          agentId,
          vision: vision as any,
          requirements: spec as any,
          plan: spec.roadmap as any,
        },
      }),
      memory.remember({
        agentId,
        content: `Project ${projectId}: Generated complete Product Requirement Specification (PRD-001) with ${spec.stories.length} stories and ${spec.personas.length} personas.`,
        type: 'PROJECT',
        metadata: { projectId, prdTitle: spec.prd.title },
      }),
    ]);

    await prisma.agent.update({ where: { id: agentId }, data: { status: 'IDLE' } });
    await logAIEvent('PM_PRD_GENERATION_COMPLETED', { projectId, reqId: savedReq.id }, agentId);

    return { success: true, data: spec };
  } catch (err) {
    await prisma.agent.update({ where: { id: agentId }, data: { status: 'ERROR' } });
    await logAIEvent('PM_PRD_GENERATION_FAILED', { projectId, error: String(err) }, agentId);
    return { success: false, error: { message: err instanceof Error ? err.message : 'PRD generation failed', code: 'AI_ERROR' } };
  }
}

