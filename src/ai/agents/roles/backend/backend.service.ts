import { prisma } from '@/lib/prisma';
import { getMemoryManager } from '@/ai/agents/memory/memory.manager';
import { logAIEvent } from '@/ai/monitoring/ai.logger';
import { aiCall } from '@/ai/agents/core/ai-call';
import { backendConfig } from './backend.config';
import { BACKEND_SYSTEM_PROMPT } from './backend.prompt';
import {
  backendDesignSpecSchema,
  type BackendDesignSpec,
} from './backend.types';
import type { ApiResult } from '@/types/common.types';

const BE_ROLE_NAME = 'Backend Specialist AI';

async function getOrCreateBEAgentId(): Promise<string> {
  const existing = await prisma.agent.findFirst({ where: { role: 'BACKEND' } });
  if (existing) return existing.id;
  const created = await prisma.agent.create({
    data: {
      name: BE_ROLE_NAME,
      role: 'BACKEND',
      status: 'IDLE',
      capabilities: ['BACKEND_DEVELOPMENT', 'CODING', 'SYSTEM_DESIGN', 'CODE_GENERATION'],
    },
  });
  return created.id;
}

export async function generateBackendDesignSpec(
  projectId: string,
  inputData: unknown,
): Promise<ApiResult<BackendDesignSpec>> {
  const agentId = await getOrCreateBEAgentId();

  await prisma.agent.update({ where: { id: agentId }, data: { status: 'WORKING' } });
  await logAIEvent('BACKEND_DESIGN_STARTED', { projectId }, agentId);

  try {
    const prompt = `Input Architecture & Database Design:\n${JSON.stringify(inputData, null, 2)}\n\nGenerate executable Backend Implementation Plan (Folder Structure, REST APIs, Route Definitions, Controllers, Services, Repositories, Validation Rules, Auth, Logging, Rate Limiting, OpenAPI Spec, Background Jobs). Produce JSON matching the exact required deliverable schema.\nRespond ONLY with valid JSON.`;

    const raw = await aiCall<unknown>(
      prompt,
      BACKEND_SYSTEM_PROMPT,
      'BACKEND',
      backendConfig,
      projectId,
      agentId,
    );

    const spec = backendDesignSpecSchema.parse(raw);

    const savedDoc = await prisma.backendDesignDocument.create({
      data: {
        projectId,
        folderStructure: spec.folderStructure as any,
        restApis: spec.restApis as any,
        routeDefinitions: spec.routeDefinitions as any,
        controllers: spec.controllers as any,
        services: spec.services as any,
        repositories: spec.repositories as any,
        validationRules: spec.validationRules as any,
        authentication: spec.authentication as any,
        authorization: spec.authorization as any,
        businessLogic: spec.businessLogic as any,
        errorHandling: spec.errorHandling as any,
        logging: spec.logging as any,
        rateLimiting: spec.rateLimiting as any,
        testingStrategy: spec.testingStrategy as any,
        openApiSpec: spec.openApiSpec,
        backgroundJobs: spec.backgroundJobs as any,
        workerDefinitions: spec.workerDefinitions as any,
        status: spec.status,
      },
    });

    const existingArch = await prisma.architectureDocument.findFirst({
      where: { projectId },
      orderBy: { createdAt: 'desc' },
    });

    if (existingArch) {
      const currentApiSpec = typeof existingArch.apiSpec === 'object' && existingArch.apiSpec ? existingArch.apiSpec : {};
      await prisma.architectureDocument.update({
        where: { id: existingArch.id },
        data: {
          apiSpec: {
            ...currentApiSpec,
            backendPlan: spec as any,
          } as any,
        },
      });
    }

    const memory = getMemoryManager();
    await Promise.all([
      prisma.document.create({
        data: {
          projectId,
          type: 'API_SPECIFICATION',
          title: `Backend Architecture & API Specification`,
          content: JSON.stringify(spec),
          author: BE_ROLE_NAME,
        },
      }),
      memory.remember({
        agentId,
        content: `Project ${projectId}: Generated Backend Implementation Plan with ${spec.restApis.length} APIs and ${spec.services.length} services.`,
        type: 'PROJECT',
        metadata: { projectId, docId: savedDoc.id },
      }),
    ]);

    await prisma.agent.update({ where: { id: agentId }, data: { status: 'IDLE' } });
    await logAIEvent('BACKEND_DESIGN_COMPLETED', { projectId, docId: savedDoc.id }, agentId);

    return { success: true, data: spec };
  } catch (err) {
    await prisma.agent.update({ where: { id: agentId }, data: { status: 'ERROR' } });
    await logAIEvent('BACKEND_DESIGN_FAILED', { projectId, error: String(err) }, agentId);
    return {
      success: false,
      error: {
        message: err instanceof Error ? err.message : 'Backend design generation failed',
        code: 'AI_ERROR',
      },
    };
  }
}
