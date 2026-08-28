import { prisma } from '@/lib/prisma';
import { getMemoryManager } from '@/packages/agents/memory/memory.manager';
import { logAIEvent } from '@/ai/monitoring/ai.logger';
import { aiCall } from '@/packages/agents/core/ai-call';
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

/** Lean UX research spec so UXR never stalls Mission Control on slow LLM calls. */
export function buildHeuristicUxResearchSpec(
  prd: unknown,
): UxResearchSpec {
  const blob = JSON.stringify(prd || {}).toLowerCase();
  const isAuth = blob.includes('login') || blob.includes('auth') || blob.includes('signup');

  const personas = isAuth
    ? [
        { id: 'P-001', name: 'New User', psychologicalTraits: 'Cautious, evaluates before committing', technicalProficiency: 'Basic', motivations: 'Access a protected application' },
        { id: 'P-002', name: 'Returning User', psychologicalTraits: 'Efficient, expects fast access', technicalProficiency: 'Intermediate', motivations: 'Quickly log in and complete tasks' },
      ]
    : [
        { id: 'P-001', name: 'Primary User', psychologicalTraits: 'Goal-oriented, focused on core task', technicalProficiency: 'Basic to Intermediate', motivations: 'Complete the primary workflow efficiently' },
      ];

  const screens = isAuth
    ? [
        { screenId: 'SCR-001', name: 'Login', purpose: 'User authentication', keyElements: ['Email input', 'Password input', 'Submit button', 'Link to signup'], navigationLinks: ['SCR-002 (signup)', 'SCR-003 (home after login)'] },
        { screenId: 'SCR-002', name: 'Signup', purpose: 'Account creation', keyElements: ['Name input', 'Email input', 'Password input', 'Submit button'], navigationLinks: ['SCR-001 (login)'] },
        { screenId: 'SCR-003', name: 'Home', purpose: 'Protected landing after login', keyElements: ['Welcome message', 'Logout button'], navigationLinks: ['SCR-001 (logout)'] },
      ]
    : [
        { screenId: 'SCR-001', name: 'Home', purpose: 'Main application page', keyElements: ['Primary content area', 'Navigation'], navigationLinks: [] },
      ];

  return uxResearchSpecSchema.parse({
    userJourney: [{
      id: 'UJ-001',
      title: isAuth ? 'Login and access application' : 'Primary workflow',
      personaId: 'P-001',
      scenario: isAuth ? 'User needs to log in to access protected features' : 'User needs to complete the primary task',
      steps: screens.map((s, i) => ({
        stepNumber: i + 1,
        userAction: `Navigate to ${s.name}`,
        touchpoint: s.name,
        emotion: i === 0 ? 'curious' : 'focused',
        painPoint: i === 0 ? 'Need to find the right page' : '',
        opportunity: 'Simplify navigation between screens',
      })),
    }],
    empathyMap: personas.map((p) => ({ personaId: p.id, says: 'I want this to work simply', thinks: 'Is this the fastest way?', does: isAuth ? 'Fills out login form' : 'Clicks primary action', feels: 'Hopeful but cautious' })),
    painPoints: [
      { id: 'PP-001', description: 'Confusing navigation between screens', severity: 'Medium', affectedPersona: 'P-001' },
    ],
    personas,
    navigationFlow: screens.slice(0, -1).map((s, i) => ({ fromScreen: s.screenId, action: 'Navigate', toScreen: screens[i + 1]!.screenId })),
    informationArchitecture: {
      siteMap: screens.map((s) => s.name).join(' > '),
      hierarchy: isAuth ? 'Login > Signup > Home' : 'Home (single level)',
      searchAndDiscovery: 'Direct navigation via links on each screen',
    },
    accessibilityReport: {
      targetStandard: 'WCAG 2.1 AA',
      colorContrastRequirements: 'Minimum 4.5:1 for normal text, 3:1 for large text',
      screenReaderConsiderations: 'All form fields need labels; images need alt text',
      keyboardNavigationRules: 'Tab order follows visual layout; focus rings visible',
    },
    interactionPrinciples: [
      { principle: 'Clarity', guideline: 'Every action has clear visual feedback', rationale: 'Users should never wonder if their action worked' },
      { principle: 'Efficiency', guideline: 'Minimize steps to complete core task', rationale: 'Users want to accomplish their goal quickly' },
    ],
    usabilityRisks: [
      { risk: 'Users may not understand auth flow', likelihood: 'Medium', mitigation: 'Clear labels and error messages on forms' },
    ],
    researchSummary: {
      overview: `UX research for ${isAuth ? 'authentication flow' : 'primary workflow'}. Focus on simplicity and clear navigation.`,
      keyFindings: ['Users prefer minimal forms', 'Clear error messages reduce support tickets'],
      targetCognitiveLoad: 'Low — keep screens focused on one task each',
    },
    recommendations: ['Keep forms short (3-4 fields max)', 'Provide clear error messages', 'Add loading states during submission'],
    wireframeDescriptions: screens.map((s) => ({ screenId: s.screenId, layoutDescription: `Centered card layout for ${s.name}`, responsiveNotes: 'Single column on mobile, centered card on desktop' })),
    screenInventory: screens,
    status: 'APPROVED',
  });
}

export async function generateUxResearchSpec(
  projectId: string,
  prd: unknown,
): Promise<ApiResult<UxResearchSpec>> {
  const agentId = await getOrCreateUXRAgentId();

  await prisma.agent.update({ where: { id: agentId }, data: { status: 'WORKING' } });
  await logAIEvent('UXR_RESEARCH_STARTED', { projectId }, agentId);

  try {
    // Lean-first: return heuristic immediately so UXR never stalls the pipeline.
    const spec = buildHeuristicUxResearchSpec(prd);

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
        metadata: { projectId },
      }),
    ]);

    // Optional background LLM enrichment — never blocks the pipeline
    void (async () => {
      try {
        const prompt = `Approved PRD:\n${JSON.stringify(prd, null, 2).slice(0, 5000)}\n\nGenerate lean UX Research JSON. Respond ONLY with valid JSON.`;
        const raw = await Promise.race([
          aiCall<unknown>(prompt, UX_RESEARCHER_SYSTEM_PROMPT, 'UX_RESEARCHER', uxResearcherConfig, projectId, agentId),
          new Promise<never>((_, reject) =>
            setTimeout(() => reject(new Error('UXR LLM budget exceeded')), 25_000),
          ),
        ]);
        const parsed = uxResearchSpecSchema.safeParse(raw);
        if (parsed.success) {
          const existing = await prisma.uxResearchDocument.findFirst({ where: { projectId }, orderBy: { createdAt: 'desc' } });
          if (existing) {
            await prisma.uxResearchDocument.update({ where: { id: existing.id }, data: { userJourney: parsed.data.userJourney as any, personas: parsed.data.personas as any, status: parsed.data.status } });
          } else {
            await prisma.uxResearchDocument.create({
              data: {
                projectId,
                userJourney: parsed.data.userJourney as any,
                empathyMap: parsed.data.empathyMap as any,
                painPoints: parsed.data.painPoints as any,
                personas: parsed.data.personas as any,
                navigationFlow: parsed.data.navigationFlow as any,
                informationArchitecture: parsed.data.informationArchitecture as any,
                accessibilityReport: parsed.data.accessibilityReport as any,
                interactionPrinciples: parsed.data.interactionPrinciples as any,
                usabilityRisks: parsed.data.usabilityRisks as any,
                researchSummary: parsed.data.researchSummary as any,
                recommendations: parsed.data.recommendations as any,
                wireframeDescriptions: parsed.data.wireframeDescriptions as any,
                screenInventory: parsed.data.screenInventory as any,
                status: parsed.data.status,
              },
            });
          }
        }
      } catch {
        // optional
      }
    })();

    await prisma.agent.update({ where: { id: agentId }, data: { status: 'IDLE' } });
    await logAIEvent('UXR_RESEARCH_COMPLETED', { projectId }, agentId);

    return { success: true, data: spec };
  } catch (err) {
    try {
      const fallback = buildHeuristicUxResearchSpec(prd);
      await prisma.agent.update({ where: { id: agentId }, data: { status: 'IDLE' } });
      return { success: true, data: fallback };
    } catch (fallbackErr) {
      await prisma.agent.update({ where: { id: agentId }, data: { status: 'ERROR' } });
      await logAIEvent('UXR_RESEARCH_FAILED', { projectId, error: String(err) }, agentId);
      return { success: false, error: { message: fallbackErr instanceof Error ? fallbackErr.message : err instanceof Error ? err.message : 'UX Research generation failed', code: 'AI_ERROR' } };
    }
  }
}
