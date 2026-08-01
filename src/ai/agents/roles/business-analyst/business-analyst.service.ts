import { prisma } from '@/lib/prisma';
import { getMemoryManager } from '@/ai/agents/memory/memory.manager';
import { logAIEvent } from '@/ai/monitoring/ai.logger';
import { aiCall } from '@/ai/agents/core/ai-call';
import { businessAnalystConfig } from './business-analyst.config';
import { BUSINESS_ANALYST_SYSTEM_PROMPT } from './business-analyst.prompt';
import {
  softwareRequirementSpecSchema,
  type SoftwareRequirementSpec,
} from './business-analyst.types';
import type { ApiResult } from '@/types/common.types';

const BA_ROLE_NAME = 'Business Analyst AI';

async function getOrCreateBAAgentId(): Promise<string> {
  const existing = await prisma.agent.findFirst({ where: { role: 'BUSINESS_ANALYST' } });
  if (existing) return existing.id;
  const created = await prisma.agent.create({
    data: { name: BA_ROLE_NAME, role: 'BUSINESS_ANALYST', status: 'IDLE', capabilities: ['BUSINESS_ANALYSIS', 'REQUIREMENTS_ANALYSIS', 'DOCUMENTATION'] },
  });
  return created.id;
}

export async function generateSoftwareRequirementSpec(
  projectId: string,
  prd: unknown,
): Promise<ApiResult<SoftwareRequirementSpec>> {
  const agentId = await getOrCreateBAAgentId();

  await prisma.agent.update({ where: { id: agentId }, data: { status: 'WORKING' } });
  await logAIEvent('BA_SRS_GENERATION_STARTED', { projectId }, agentId);

  try {
    const prompt = `Approved PRD:\n${JSON.stringify(prd, null, 2)}\n\nGenerate formal Software Requirement Specifications (SRS-001) and acceptance criteria. Produce JSON with EXACT keys:\n- srs: {title, version, scope, overview}\n- businessRules: array of {id, category, rule, enforcement, errorCondition}\n- processFlows: array of {id, name, steps}\n- useCases: array of {id, title, actor, preconditions, mainFlow, postconditions}\n- actors: array of {name, role, permissions}\n- traceabilityMatrix: array of {prdStoryId, srsSpecId, testCaseId, coverageStatus}\n- functionalSpecs: array of {id, module, specification, gherkinCriteria}\n- nonFunctionalSpecs: array of {category, metric, target}\n- edgeCases: array of {scenario, expectedBehavior}\n- validationRules: array of {field, rule}\n- riskAnalysis: array of {risk, impact, mitigation}\n- dependencyMapping: array of {source, target, nature}\n- decisionTables: array of {name, conditions, actions}\n- acceptanceMatrix: array of {requirementId, verificationMethod, status}\n- complexityEstimate: {overallEffort, criticalPath}\n- status: "APPROVED"\n\nRespond ONLY with valid JSON.`;

    const raw = await aiCall<unknown>(
      prompt,
      BUSINESS_ANALYST_SYSTEM_PROMPT,
      'BUSINESS_ANALYST',
      businessAnalystConfig,
      projectId,
      agentId,
    );

    const spec = softwareRequirementSpecSchema.parse(raw);

    const savedSpec = await prisma.businessAnalystSpec.create({
      data: {
        projectId,
        srs: spec.srs as any,
        businessRules: spec.businessRules as any,
        processFlows: spec.processFlows as any,
        useCases: spec.useCases as any,
        actors: spec.actors as any,
        traceabilityMatrix: spec.traceabilityMatrix as any,
        functionalSpecs: spec.functionalSpecs as any,
        nonFunctionalSpecs: spec.nonFunctionalSpecs as any,
        edgeCases: spec.edgeCases as any,
        validationRules: spec.validationRules as any,
        riskAnalysis: spec.riskAnalysis as any,
        dependencyMapping: spec.dependencyMapping as any,
        decisionTables: spec.decisionTables as any,
        acceptanceMatrix: spec.acceptanceMatrix as any,
        complexityEstimate: spec.complexityEstimate as any,
        status: spec.status,
      },
    });

    const memory = getMemoryManager();
    await Promise.all([
      prisma.productDocument.create({
        data: {
          projectId,
          agentId,
          vision: { title: spec.srs.title, scope: spec.srs.scope } as any,
          requirements: spec as any,
          plan: spec.traceabilityMatrix as any,
        },
      }),
      memory.remember({
        agentId,
        content: `Project ${projectId}: Generated Software Requirement Specification (SRS-001) with ${spec.functionalSpecs.length} specs and ${spec.businessRules.length} rules.`,
        type: 'PROJECT',
        metadata: { projectId, srsTitle: spec.srs.title, specId: savedSpec.id },
      }),
    ]);

    await prisma.agent.update({ where: { id: agentId }, data: { status: 'IDLE' } });
    await logAIEvent('BA_SRS_GENERATION_COMPLETED', { projectId, specId: savedSpec.id }, agentId);

    return { success: true, data: spec };
  } catch (err) {
    await prisma.agent.update({ where: { id: agentId }, data: { status: 'ERROR' } });
    await logAIEvent('BA_SRS_GENERATION_FAILED', { projectId, error: String(err) }, agentId);
    return { success: false, error: { message: err instanceof Error ? err.message : 'SRS generation failed', code: 'AI_ERROR' } };
  }
}
