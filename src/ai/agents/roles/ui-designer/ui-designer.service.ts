import { prisma } from '@/lib/prisma';
import { getMemoryManager } from '@/ai/agents/memory/memory.manager';
import { logAIEvent } from '@/ai/monitoring/ai.logger';
import { aiCall } from '@/ai/agents/core/ai-call';
import { uiDesignerConfig } from './ui-designer.config';
import { UI_DESIGNER_SYSTEM_PROMPT } from './ui-designer.prompt';
import {
  uiDesignSpecSchema,
  type UiDesignSpec,
} from './ui-designer.types';
import type { ApiResult } from '@/types/common.types';

const UID_ROLE_NAME = 'UI Designer AI';

async function getOrCreateUIDAgentId(): Promise<string> {
  const existing = await prisma.agent.findFirst({ where: { role: 'UI_DESIGNER' } });
  if (existing) return existing.id;
  const created = await prisma.agent.create({
    data: { name: UID_ROLE_NAME, role: 'UI_DESIGNER', status: 'IDLE', capabilities: ['UI_DESIGN', 'UX_RESEARCH', 'FRONTEND_DEVELOPMENT'] },
  });
  return created.id;
}

export async function generateUiDesignSpec(
  projectId: string,
  ujw: unknown,
): Promise<ApiResult<UiDesignSpec>> {
  const agentId = await getOrCreateUIDAgentId();

  await prisma.agent.update({ where: { id: agentId }, data: { status: 'WORKING' } });
  await logAIEvent('UID_DESIGN_STARTED', { projectId }, agentId);

  try {
    const prompt = `UX Research & User Journeys (UJW-001):\n${JSON.stringify(ujw, null, 2)}\n\nGenerate state-of-the-art UI Design Specifications (UDS-001) with rich modern aesthetics (dark mode, glassmorphism, vibrant palettes). Produce JSON with EXACT keys:\n- designTokens: {colors: array of {category, name, value, description}, typography: array of {category, name, value, description}, spacing: array of {category, name, value, description}, borderRadius: array of {category, name, value, description}, shadows: array of {category, name, value, description}, glassmorphism: array of {category, name, value, description}}\n- componentHierarchy: array of {id, name, description, props: array of {name, type, required, defaultValue}, variants, states}\n- responsiveLayouts: array of {breakpoint, layoutType, navigationTransform, gridColumns}\n- visualStyleGuide: {themeName, vibe, primaryPalette, secondaryPalette}\n- microInteractions: array of {trigger, animation, targetComponent}\n- accessibilityVisualTokens: array of {element, token, wcagCompliance}\n- layoutMockups: array of {screenId, screenName, wireframeLayout, visualEnhancements}\n- cssVariablesManifest: string containing :root CSS variable definitions\n- status: "APPROVED"\n\nRespond ONLY with valid JSON.`;

    const raw = await aiCall<unknown>(
      prompt,
      UI_DESIGNER_SYSTEM_PROMPT,
      'UI_DESIGNER',
      uiDesignerConfig,
      projectId,
      agentId,
    );

    const spec = uiDesignSpecSchema.parse(raw);

    const savedDoc = await prisma.uiDesignDocument.create({
      data: {
        projectId,
        designSystem: spec.visualStyleGuide as any,
        colorPalette: spec.designTokens.colors as any,
        typography: spec.designTokens.typography as any,
        spacingRules: spec.designTokens.spacing as any,
        gridSystem: spec.responsiveLayouts as any,
        components: spec.componentHierarchy as any,
        icons: [] as any,
        layoutSpecifications: spec.layoutMockups as any,
        responsiveRules: spec.responsiveLayouts as any,
        animationSpecifications: spec.microInteractions as any,
        pageDesigns: spec.layoutMockups as any,
        componentHierarchy: spec.componentHierarchy as any,
        accessibilityRules: spec.accessibilityVisualTokens as any,
        designTokens: spec.designTokens as any,
        status: spec.status,
      },
    });

    const memory = getMemoryManager();
    await Promise.all([
      prisma.document.create({
        data: {
          projectId,
          type: 'UI_SPEC',
          title: `UI/UX Design Specification (UDS-001)`,
          content: JSON.stringify(spec),
          author: UID_ROLE_NAME,
        },
      }),
      memory.remember({
        agentId,
        content: `Project ${projectId}: Generated UI Design Spec (UDS-001) with ${spec.componentHierarchy.length} components and theme "${spec.visualStyleGuide.themeName}".`,
        type: 'PROJECT',
        metadata: { projectId, docId: savedDoc.id },
      }),
    ]);

    await prisma.agent.update({ where: { id: agentId }, data: { status: 'IDLE' } });
    await logAIEvent('UID_DESIGN_COMPLETED', { projectId, docId: savedDoc.id }, agentId);

    return { success: true, data: spec };
  } catch (err) {
    await prisma.agent.update({ where: { id: agentId }, data: { status: 'ERROR' } });
    await logAIEvent('UID_DESIGN_FAILED', { projectId, error: String(err) }, agentId);
    return { success: false, error: { message: err instanceof Error ? err.message : 'UI Design generation failed', code: 'AI_ERROR' } };
  }
}
