import { prisma } from '@/lib/prisma';
import { getMemoryManager } from '@/ai/agents/memory/memory.manager';
import { logAIEvent } from '@/ai/monitoring/ai.logger';
import { aiCall } from '@/ai/agents/core/ai-call';
import { uxResearcherConfig } from './ux-researcher.config';
import { UX_RESEARCHER_SYSTEM_PROMPT } from './ux-researcher.prompt';
import {
  uxResearchSpecSchema,
  type UxResearchSpec,
} from './ux-researcher.types';
import type { ApiResult } from '@/types/common.types';

const UXR_ROLE_NAME = 'UX Researcher AI';

async function getOrCreateUXRAgentId(): Promise<string> {
  const existing = await prisma.agent.findFirst({ where: { role: 'UX_RESEARCHER' } });
  if (existing) return existing.id;
  const created = await prisma.agent.create({
    data: { name: UXR_ROLE_NAME, role: 'UX_RESEARCHER', status: 'IDLE', capabilities: ['UX_RESEARCH', 'USER_JOURNEY_MAPPING', 'USABILITY_TESTING'] },
  });
  return created.id;
}

export async function generateUxResearchSpec(
  projectId: string,
  prd: unknown,
): Promise<ApiResult<UxResearchSpec>> {
  const agentId = await getOrCreateUXRAgentId();

  await prisma.agent.update({ where: { id: agentId }, data: { status: 'WORKING' } });
  await logAIEvent('UXR_RESEARCH_STARTED', { projectId }, agentId);

  try {
    const prompt = `Approved PRD:\n${JSON.stringify(prd, null, 2)}\n\nGenerate comprehensive UX Research Specification (UJW-001). Produce JSON with EXACT keys:\n- userJourney: array of {id, title, personaId, scenario, steps: array of {stepNumber, userAction, touchpoint, emotion, painPoint, opportunity}}\n- empathyMap: array of {personaId, says, thinks, does, feels}\n- painPoints: array of {id, description, severity, affectedPersona}\n- personas: array of {id, name, psychologicalTraits, technicalProficiency, motivations}\n- navigationFlow: array of {fromScreen, action, toScreen}\n- informationArchitecture: {siteMap, hierarchy, searchAndDiscovery}\n- accessibilityReport: {targetStandard, colorContrastRequirements, screenReaderConsiderations, keyboardNavigationRules}\n- interactionPrinciples: array of {principle, guideline, rationale}\n- usabilityRisks: array of {risk, likelihood, mitigation}\n- researchSummary: {overview, keyFindings, targetCognitiveLoad}\n- recommendations: string[]\n- wireframeDescriptions: array of {screenId, layoutDescription, responsiveNotes}\n- screenInventory: array of {screenId, name, purpose, keyElements, navigationLinks}\n- status: "APPROVED"\n\nRespond ONLY with valid JSON.`;

    const raw = await aiCall<unknown>(
      prompt,
      UX_RESEARCHER_SYSTEM_PROMPT,
      'UX_RESEARCHER',
      uxResearcherConfig,
      projectId,
      agentId,
    );

    const spec = uxResearchSpecSchema.parse(raw);

    const savedDoc = await prisma.uxResearchDocument.create({
      data: {
        projectId,
        userJourney: spec.userJourney as any,
        empathyMap: spec.empathyMap as any,
        painPoints: spec.painPoints as any,
        personas: spec.personas as any,
        navigationFlow: spec.navigationFlow as any,
        informationArchitecture: spec.informationArchitecture as any,
        accessibilityReport: spec.accessibilityReport as any,
        interactionPrinciples: spec.interactionPrinciples as any,
        usabilityRisks: spec.usabilityRisks as any,
        researchSummary: spec.researchSummary as any,
        recommendations: spec.recommendations as any,
        wireframeDescriptions: spec.wireframeDescriptions as any,
        screenInventory: spec.screenInventory as any,
        status: spec.status,
      },
    });

    const memory = getMemoryManager();
    await Promise.all([
      prisma.document.create({
        data: {
          projectId,
          type: 'USER_JOURNEY',
          title: `UX Research & User Journeys (UJW-001)`,
          content: JSON.stringify(spec),
          author: UXR_ROLE_NAME,
        },
      }),
      memory.remember({
        agentId,
        content: `Project ${projectId}: Generated UX Research Spec (UJW-001) with ${spec.userJourney.length} journeys and ${spec.screenInventory.length} screens.`,
        type: 'PROJECT',
        metadata: { projectId, docId: savedDoc.id },
      }),
    ]);

    await prisma.agent.update({ where: { id: agentId }, data: { status: 'IDLE' } });
    await logAIEvent('UXR_RESEARCH_COMPLETED', { projectId, docId: savedDoc.id }, agentId);

    return { success: true, data: spec };
  } catch (err) {
    await prisma.agent.update({ where: { id: agentId }, data: { status: 'ERROR' } });
    await logAIEvent('UXR_RESEARCH_FAILED', { projectId, error: String(err) }, agentId);
    return { success: false, error: { message: err instanceof Error ? err.message : 'UX Research generation failed', code: 'AI_ERROR' } };
  }
}
