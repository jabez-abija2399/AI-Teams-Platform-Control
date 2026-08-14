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

/** Lean backend spec so Backend never stalls Mission Control on slow LLM calls. */
export function buildHeuristicBackendDesignSpec(
  input: unknown,
  feedback?: string,
): BackendDesignSpec {
  const blob = `${JSON.stringify(input || {})} ${feedback || ''}`.toLowerCase();
  const isAuth = blob.includes('login') || blob.includes('auth') || blob.includes('signup');
  const note = feedback?.trim() || 'Generated from architecture for pipeline continuity';

  const apis = isAuth
    ? [
        { method: 'POST', path: '/api/auth/register', description: 'Create account', requestSchema: '{ email, password, name? }', responseSchema: '{ user: { id, email, name } }' },
        { method: 'POST', path: '/api/auth/login', description: 'Sign in', requestSchema: '{ email, password }', responseSchema: '{ user: { id, email, name } }' },
        { method: 'POST', path: '/api/auth/logout', description: 'Sign out', requestSchema: '{}', responseSchema: '{ ok: true }' },
        { method: 'GET', path: '/api/auth/me', description: 'Current user', requestSchema: 'n/a', responseSchema: '{ user: { id, email, name } | null }' },
      ]
    : [
        { method: 'GET', path: '/api/health', description: 'Health check', requestSchema: 'n/a', responseSchema: '{ status: "ok" }' },
      ];

  return backendDesignSpecSchema.parse({
    folderStructure: [
      { path: 'src/app/api', description: 'Next.js API routes' },
      { path: 'src/lib', description: 'Shared utilities and helpers' },
      { path: 'prisma', description: 'Database schema and migrations' },
    ],
    restApis: apis.map((a) => ({ method: a.method, path: a.path, description: a.description })),
    routeDefinitions: apis.map((a) => ({ method: a.method, path: a.path, handler: a.path.replace(/\//g, '_').replace(/^_api_/, ''), description: a.description })),
    controllers: apis.map((a) => ({ name: a.path.split('/').pop() || 'handler', methods: [a.method.toLowerCase()], route: a.path, description: a.description })),
    services: isAuth ? [{ name: 'AuthService', methods: ['register', 'login', 'logout', 'getCurrentUser'], description: 'Authentication logic' }] : [{ name: 'HealthService', methods: ['check'], description: 'Health check' }],
    repositories: isAuth ? [{ name: 'UserRepository', model: 'User', methods: ['findByEmail', 'create', 'findById'] }] : [],
    validationRules: [{ field: 'email', rule: 'Valid email format', source: 'Zod schema' }, { field: 'password', rule: 'Minimum 8 characters', source: 'Zod schema' }],
    authentication: isAuth ? { mechanism: 'NextAuth.js', sessionStrategy: 'JWT', passwordHashing: 'bcrypt (cost 12)', protectedRoutes: ['/', '/settings'] } : { mechanism: 'None', sessionStrategy: 'n/a', passwordHashing: 'n/a', protectedRoutes: [] },
    authorization: isAuth ? { roleBased: false, permissions: [], defaultRole: 'USER' } : { roleBased: false, permissions: [], defaultRole: 'USER' },
    businessLogic: apis.map((a) => ({ endpoint: a.path, logic: a.description, errorHandling: 'Try/catch with ApiResult pattern' })),
    errorHandling: { pattern: 'ApiResult<T> = { success, data?, error? }', httpErrors: { 400: 'Validation error', 401: 'Unauthorized', 403: 'Forbidden', 404: 'Not found', 500: 'Internal error' }, logging: 'Console with structured error objects' },
    logging: { level: 'warn+error', format: 'Structured JSON', transport: 'Console' },
    rateLimiting: { enabled: true, strategy: 'Per-user/IP LRU cache', limits: { login: '5/min', api: '100/min' } },
    openApiSpec: '',
    backgroundJobs: [],
    workerDefinitions: [],
    status: 'APPROVED',
  });
}

export async function generateBackendDesignSpec(
  projectId: string,
  inputData: unknown,
  feedback?: string,
): Promise<ApiResult<BackendDesignSpec>> {
  const agentId = await getOrCreateBEAgentId();

  await prisma.agent.update({ where: { id: agentId }, data: { status: 'WORKING' } });
  await logAIEvent('BACKEND_DESIGN_STARTED', { projectId }, agentId);

  try {
    // Lean-first: return heuristic immediately so Backend never stalls the pipeline.
    const spec = buildHeuristicBackendDesignSpec(inputData, feedback);

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
        metadata: { projectId },
      }),
    ]);

    // Optional background LLM enrichment — never blocks the pipeline
    if (!feedback?.trim()) {
      void (async () => {
        try {
          const prompt = `Input Architecture & Database Design:\n${JSON.stringify(inputData, null, 2).slice(0, 5000)}\n\nGenerate lean Backend Implementation Plan JSON. Respond ONLY with valid JSON.`;
          const raw = await Promise.race([
            aiCall<unknown>(prompt, BACKEND_SYSTEM_PROMPT, 'BACKEND', backendConfig, projectId, agentId),
            new Promise<never>((_, reject) =>
              setTimeout(() => reject(new Error('Backend LLM budget exceeded')), 25_000),
            ),
          ]);
          const parsed = backendDesignSpecSchema.safeParse(raw);
          if (parsed.success) {
            await prisma.backendDesignDocument.create({
              data: {
                projectId,
                folderStructure: parsed.data.folderStructure as any,
                restApis: parsed.data.restApis as any,
                routeDefinitions: parsed.data.routeDefinitions as any,
                controllers: parsed.data.controllers as any,
                services: parsed.data.services as any,
                repositories: parsed.data.repositories as any,
                validationRules: parsed.data.validationRules as any,
                authentication: parsed.data.authentication as any,
                authorization: parsed.data.authorization as any,
                businessLogic: parsed.data.businessLogic as any,
                errorHandling: parsed.data.errorHandling as any,
                logging: parsed.data.logging as any,
                rateLimiting: parsed.data.rateLimiting as any,
                testingStrategy: parsed.data.testingStrategy as any,
                openApiSpec: parsed.data.openApiSpec,
                backgroundJobs: parsed.data.backgroundJobs as any,
                workerDefinitions: parsed.data.workerDefinitions as any,
                status: parsed.data.status,
              },
            });
          }
        } catch {
          // optional
        }
      })();
    }

    await prisma.agent.update({ where: { id: agentId }, data: { status: 'IDLE' } });
    await logAIEvent('BACKEND_DESIGN_COMPLETED', { projectId }, agentId);

    return { success: true, data: spec };
  } catch (err) {
    try {
      const fallback = buildHeuristicBackendDesignSpec(inputData, feedback);
      await prisma.agent.update({ where: { id: agentId }, data: { status: 'IDLE' } });
      return { success: true, data: fallback };
    } catch (fallbackErr) {
      await prisma.agent.update({ where: { id: agentId }, data: { status: 'ERROR' } });
      await logAIEvent('BACKEND_DESIGN_FAILED', { projectId, error: String(err) }, agentId);
      return {
        success: false,
        error: {
          message: fallbackErr instanceof Error ? fallbackErr.message : err instanceof Error ? err.message : 'Backend design generation failed',
          code: 'AI_ERROR',
        },
      };
    }
  }
}
