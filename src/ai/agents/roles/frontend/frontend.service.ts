import { prisma } from '@/lib/prisma';
import { getMemoryManager } from '@/ai/agents/memory/memory.manager';
import { logAIEvent } from '@/ai/monitoring/ai.logger';
import { aiCall } from '@/ai/agents/core/ai-call';
import { frontendConfig } from './frontend.config';
import { FRONTEND_SYSTEM_PROMPT } from './frontend.prompt';
import {
  frontendDesignSpecSchema,
  type FrontendDesignSpec,
} from './frontend.types';
import type { ApiResult } from '@/types/common.types';

const FE_ROLE_NAME = 'Frontend Specialist AI';

async function getOrCreateFEAgentId(): Promise<string> {
  const existing = await prisma.agent.findFirst({ where: { role: 'FRONTEND' } });
  if (existing) return existing.id;
  const created = await prisma.agent.create({
    data: {
      name: FE_ROLE_NAME,
      role: 'FRONTEND',
      status: 'IDLE',
      capabilities: ['FRONTEND_DEVELOPMENT', 'CODING', 'UI_DESIGN', 'CODE_GENERATION'],
    },
  });
  return created.id;
}

export async function generateFrontendDesignSpec(
  projectId: string,
  inputData: unknown,
): Promise<ApiResult<FrontendDesignSpec>> {
  const agentId = await getOrCreateFEAgentId();

  await prisma.agent.update({ where: { id: agentId }, data: { status: 'WORKING' } });
  await logAIEvent('FRONTEND_DESIGN_STARTED', { projectId }, agentId);

  try {
    const prompt = `Input Backend & UI/UX Specs:\n${JSON.stringify(inputData, null, 2)}\n\nGenerate comprehensive Frontend Implementation Plan (App Structure, Routing, Layouts, Pages, Components, Hooks, State Management, API Integration, Forms, Validation, Responsive, Performance, Accessibility, SEO). Produce JSON matching the exact required deliverable schema.\nRespond ONLY with valid JSON.`;

    const raw = await aiCall<unknown>(
      prompt,
      FRONTEND_SYSTEM_PROMPT,
      'FRONTEND',
      frontendConfig,
      projectId,
      agentId,
    );

    const spec = frontendDesignSpecSchema.parse(raw);

    const savedDoc = await prisma.frontendDesignDocument.create({
      data: {
        projectId,
        applicationStructure: spec.applicationStructure as any,
        routing: spec.routing as any,
        layouts: spec.layouts as any,
        pages: spec.pages as any,
        components: spec.components as any,
        hooks: spec.hooks as any,
        stateManagement: spec.stateManagement as any,
        apiIntegration: spec.apiIntegration as any,
        forms: spec.forms as any,
        validationRules: spec.validationRules as any,
        responsiveLayouts: spec.responsiveLayouts as any,
        performanceOptimizations: spec.performanceOptimizations as any,
        accessibility: spec.accessibility as any,
        seo: spec.seo as any,
        testingStrategy: spec.testingStrategy as any,
        status: spec.status,
      },
    });

    const existingArch = await prisma.architectureDocument.findFirst({
      where: { projectId },
      orderBy: { createdAt: 'desc' },
    });

    if (existingArch) {
      const currentArch = typeof existingArch.architecture === 'object' && existingArch.architecture ? existingArch.architecture : {};
      await prisma.architectureDocument.update({
        where: { id: existingArch.id },
        data: {
          architecture: {
            ...currentArch,
            frontendPlan: spec as any,
          } as any,
        },
      });
    }

    const memory = getMemoryManager();
    await Promise.all([
      prisma.document.create({
        data: {
          projectId,
          type: 'FRONTEND_SPEC',
          title: `Frontend Architecture & Component Specification`,
          content: JSON.stringify(spec),
          author: FE_ROLE_NAME,
        },
      }),
      memory.remember({
        agentId,
        content: `Project ${projectId}: Generated Frontend Implementation Plan with ${spec.pages.length} pages and ${spec.components.length} components.`,
        type: 'PROJECT',
        metadata: { projectId, docId: savedDoc.id },
      }),
    ]);

    await prisma.agent.update({ where: { id: agentId }, data: { status: 'IDLE' } });
    await logAIEvent('FRONTEND_DESIGN_COMPLETED', { projectId, docId: savedDoc.id }, agentId);

    return { success: true, data: spec };
  } catch (err) {
    await prisma.agent.update({ where: { id: agentId }, data: { status: 'ERROR' } });
    await logAIEvent('FRONTEND_DESIGN_FAILED', { projectId, error: String(err) }, agentId);
    return {
      success: false,
      error: {
        message: err instanceof Error ? err.message : 'Frontend design generation failed',
        code: 'AI_ERROR',
      },
    };
  }
}
