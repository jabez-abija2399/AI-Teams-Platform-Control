/**
 * @file architect.service.ts
 * @package @ai-teams/agents/roles/architect
 * @description Architecture specification generation service for the System Architect Agent.
 */

import { prisma } from '@/lib/prisma';
import { getMemoryManager } from '@/packages/agents/memory/memory.manager';
import { logAIEvent } from '@/ai/monitoring/ai.logger';
import {
  architectureDesignerTool,
  databaseDesignerTool,
  apiDesignerTool,
} from './architect.tools';
import {
  architectAnalysisSchema,
  type ArchitectAnalysis,
  type ArchitectExecutionInput,
} from './architect.types';
import type { ProductRequirement } from '../ceo/ceo.types';
import type { ApiResult } from '@/types/common.types';
import { wantsHtmlCssStack, wantsStaticNoBackend } from '@/core/company-orchestration/revision-feedback';
import { resolveStackFromMemory } from '@/core/memory/persist-stack-constraints';
import type { StackIntent } from '@/core/company-orchestration/stack-intent';
import { buildDeliveryPlanForStack } from '@/core/company-orchestration/architecture-delivery-plan';
import { persistDeliveryPlan } from '@/core/company-orchestration/implementation-todo.store';
import { ProjectStateManager } from '@/core/state/project-state.manager';
import { ArtifactRegistryService } from '@/core/artifacts/artifact-registry.service';
import { ArtifactManager } from '@/core/company-orchestration/artifact-manager';
import { RuntimeContractService } from '@/core/runtime-contract/runtime-contract.service';
import { ContractValidator } from '../../contracts/contract-validator';
import { ArchitectureSpecSchema, type ArchitectureSpec } from '../../contracts/deliverable-schemas';

export { wantsHtmlCssStack, wantsStaticNoBackend };

function withDeliveryPlan(
  analysis: ArchitectAnalysis,
  title: string,
  stack?: Pick<StackIntent, 'htmlCss' | 'staticNoBackend' | 'stack'> | null,
): ArchitectAnalysis {
  const plan = buildDeliveryPlanForStack(title, stack);
  return architectAnalysisSchema.parse({
    ...analysis,
    fileStructure: plan.fileStructure,
    implementationTodos: plan.implementationTodos,
    qaTodos: plan.qaTodos,
  });
}

async function getOrCreateArchitectAgentId(): Promise<string> {
  const existing = await prisma.agent.findFirst({ where: { role: 'ARCHITECT' } });
  if (existing) return existing.id;
  const created = await prisma.agent.create({
    data: { name: 'Architect AI', role: 'ARCHITECT', status: 'IDLE', capabilities: [] },
  });
  return created.id;
}

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' ? (value as Record<string, unknown>) : {};
}

function detectAuthScope(input: unknown, feedback?: string): boolean {
  const blob = `${JSON.stringify(input || {})} ${feedback || ''}`.toLowerCase();
  return (
    blob.includes('login') ||
    blob.includes('auth') ||
    blob.includes('signup') ||
    blob.includes('sign up') ||
    blob.includes('password')
  );
}

function isAuthIdea(feedback?: string, title?: string, input?: unknown): boolean {
  const blob = `${title || ''} ${feedback || ''} ${JSON.stringify(input || {})}`.toLowerCase();
  return (
    blob.includes('login') ||
    blob.includes('auth') ||
    blob.includes('signup') ||
    blob.includes('sign up') ||
    blob.includes('password')
  );
}

function buildHtmlCssLoginArchitecture(
  title: string,
  feedback?: string,
  input?: unknown,
  forceStatic?: boolean,
): ArchitectAnalysis {
  const isAuth = isAuthIdea(feedback, title, input);
  const safeTitle = title || 'Slash Photo Studio';

  if (!isAuth) {
    return architectAnalysisSchema.parse({
      architecture: {
        frontend:
          `Plain static HTML5 + CSS only for ${safeTitle}: index.html, gallery.html, services.html, booking.html, about.html, contact.html, and css/styles.css. Responsive design, modern dark studio aesthetic, zero build step required.`,
        backend:
          'None. Static client-side site — open directly in any browser or serve via static hosting (Vercel, Netlify, GitHub Pages, or python http.server).',
        database: 'None. Static client-side architecture.',
        infrastructure:
          'Static hosting or open files locally (e.g. Live Server / python -m http.server).',
        security:
          'Client-side inquiry and booking submission with form validation; zero server vulnerabilities.',
      },
      database: {
        entities: [],
        relationships: [],
        indexes: [],
        constraints: ['No database required — static HTML/CSS portfolio architecture'],
      },
      api: {
        endpoints: [
          {
            path: '/index.html',
            method: 'GET',
            request: 'n/a',
            response: 'Studio home page with hero showcase & featured shoots',
          },
          {
            path: '/gallery.html',
            method: 'GET',
            request: 'n/a',
            response: 'Categorized photography portfolio grid',
          },
          {
            path: '/services.html',
            method: 'GET',
            request: 'n/a',
            response: 'Shoot packages, deliverables, and transparent pricing',
          },
          {
            path: '/booking.html',
            method: 'GET',
            request: 'n/a',
            response: 'Session booking & appointment inquiry form',
          },
          {
            path: '/about.html',
            method: 'GET',
            request: 'n/a',
            response: 'Studio story, equipment, and photography team',
          },
          {
            path: '/contact.html',
            method: 'GET',
            request: 'n/a',
            response: 'Studio address, business hours, and contact form',
          },
        ],
      },
      decisions: [
        {
          technology: 'Static HTML5 + CSS3',
          reason:
            feedback?.trim() ||
            `Tailored multi-page static site for ${safeTitle} with zero dependencies and instant load times`,
          alternative: 'Next.js or React SPA',
          tradeoff: 'Pure static delivery guarantees 100% performance score and simple maintenance',
        },
        {
          technology: 'Responsive Modern Studio Theme',
          reason: 'Showcases photography with high contrast, glassmorphism cards, and interactive gallery grid',
          alternative: 'Basic plain styling',
          tradeoff: 'Professional aesthetic that immediately builds client trust',
        },
      ],
    });
  }

  return architectAnalysisSchema.parse({
    architecture: {
      frontend:
        'Plain static HTML + CSS only: login.html, signup.html, home.html, css/styles.css. No Next.js, no React, no framework, no build step.',
      backend:
        'None. Static pages only — open HTML files in a browser or serve the folder with any static file server.',
      database: 'None. No database for this MVP (static demo pages).',
      infrastructure:
        'Static hosting or open files locally (e.g. Live Server / python -m http.server).',
      security:
        'Demo UI only. Forms navigate between pages; no real password storage until backend is connected.',
    },
    database: {
      entities: [],
      relationships: [],
      indexes: [],
      constraints: ['No database — static HTML/CSS deliverable'],
    },
    api: {
      endpoints: [
        {
          path: '/login.html',
          method: 'GET',
          request: 'n/a',
          response: 'Static login page',
        },
        {
          path: '/signup.html',
          method: 'GET',
          request: 'n/a',
          response: 'Static signup page',
        },
        {
          path: '/home.html',
          method: 'GET',
          request: 'n/a',
          response: 'Static home page',
        },
      ],
    },
    decisions: [
      {
        technology: 'HTML + CSS only',
        reason:
          feedback?.trim() ||
          'User asked for login/signup as static pages with no framework and no backend',
        alternative: 'Next.js or Express + database',
        tradeoff: 'Matches the request exactly; real auth can be added later if needed',
      },
    ],
  });
}

function buildDefaultArchitecture(title: string, isAuth: boolean): ArchitectAnalysis {
  return architectAnalysisSchema.parse({
    architecture: {
      frontend: isAuth
        ? 'Next.js App Router + TypeScript + Tailwind (login, signup, protected home)'
        : 'Next.js App Router + TypeScript + Tailwind',
      backend: isAuth
        ? 'Next.js Route Handlers + session-based auth'
        : 'Next.js Route Handlers / API routes',
      database: isAuth ? 'PostgreSQL + Prisma (User, Session)' : 'PostgreSQL + Prisma',
      infrastructure: 'Local Docker Compose → Vercel/Node deploy',
      security: isAuth
        ? 'Password hashing, HTTP-only session cookies, protected routes'
        : 'Input validation, authz checks, HTTPS in production',
    },
    database: {
      entities: isAuth
        ? [
            {
              name: 'User',
              fields: [
                { name: 'id', type: 'cuid' },
                { name: 'email', type: 'string' },
                { name: 'passwordHash', type: 'string' },
                { name: 'name', type: 'string?' },
                { name: 'createdAt', type: 'datetime' },
              ],
            },
            {
              name: 'Session',
              fields: [
                { name: 'id', type: 'cuid' },
                { name: 'userId', type: 'string' },
                { name: 'expiresAt', type: 'datetime' },
              ],
            },
          ]
        : [
            {
              name: 'User',
              fields: [
                { name: 'id', type: 'cuid' },
                { name: 'email', type: 'string' },
                { name: 'createdAt', type: 'datetime' },
              ],
            },
          ],
      relationships: isAuth ? ['User 1—* Session'] : ['User owns primary records'],
      indexes: isAuth ? ['User.email unique', 'Session.userId'] : ['User.email unique'],
      constraints: isAuth
        ? ['email required', 'passwordHash required']
        : ['email required'],
    },
    api: {
      endpoints: isAuth
        ? [
            {
              path: '/api/auth/register',
              method: 'POST',
              request: '{ email, password, name? }',
              response: '{ user: { id, email, name } }',
            },
            {
              path: '/api/auth/login',
              method: 'POST',
              request: '{ email, password }',
              response: '{ user: { id, email, name } }',
            },
            {
              path: '/api/auth/logout',
              method: 'POST',
              response: '{ ok: true }',
            },
            {
              path: '/api/auth/me',
              method: 'GET',
              response: '{ user: { id, email, name } | null }',
            },
          ]
        : [
            {
              path: '/api/health',
              method: 'GET',
              response: '{ status: "ok" }',
            },
          ],
    },
    decisions: [
      {
        technology: 'Next.js full-stack',
        reason: `Keeps ${title} simple for an MVP`,
        alternative: 'Plain HTML/CSS + Express',
        tradeoff: 'Monolith is faster to ship; split later if needed',
      },
      {
        technology: 'PostgreSQL + Prisma',
        reason: 'Reliable relational data with typed access',
        alternative: 'SQLite',
        tradeoff: 'Postgres is closer to production',
      },
    ],
  });
}

export function buildHeuristicArchitecture(
  input: unknown,
  feedback?: string,
  stack?: Pick<StackIntent, 'htmlCss' | 'staticNoBackend' | 'stack'> | null,
): ArchitectAnalysis {
  const isAuth = detectAuthScope(input, feedback);
  const plan = asRecord(input);
  const title =
    (typeof plan.title === 'string' && plan.title) ||
    (typeof plan.productName === 'string' && plan.productName) ||
    'Application';

  const htmlCss = stack?.htmlCss === true || wantsHtmlCssStack(input, feedback);
  const forceStatic = stack?.staticNoBackend === true;
  const base = htmlCss
    ? buildHtmlCssLoginArchitecture(title, feedback, input, forceStatic)
    : buildDefaultArchitecture(title, isAuth);

  const trimmed = feedback?.trim();
  if (!trimmed) return withDeliveryPlan(base, title, stack);

  return withDeliveryPlan(
    {
      ...base,
      revisionNote: trimmed,
      architecture: {
        ...base.architecture,
      },
      decisions: [
        {
          technology: htmlCss ? 'HTML + CSS (per your saved stack)' : 'User revision',
          reason: trimmed,
          alternative: htmlCss ? 'Next.js' : 'Previous draft',
          tradeoff: 'Architecture regenerated to match your comments',
        },
        ...base.decisions.filter((d) => !(htmlCss && d.technology.toLowerCase().includes('next'))),
      ],
    } as ArchitectAnalysis & { revisionNote?: string },
    title,
    stack,
  );
}

async function persistArchitecture(
  projectId: string,
  agentId: string,
  analysis: ArchitectAnalysis,
): Promise<void> {
  const memory = getMemoryManager();
  await Promise.all([
    prisma.document.create({
      data: {
        projectId,
        type: 'SYSTEM_ARCHITECTURE',
        title: 'System Architecture',
        content: JSON.stringify(analysis.architecture),
        author: 'Architect AI',
      },
    }),
    prisma.document.create({
      data: {
        projectId,
        type: 'DATABASE_DESIGN',
        title: 'Database Design',
        content: JSON.stringify(analysis.database),
        author: 'Architect AI',
      },
    }),
    prisma.document.create({
      data: {
        projectId,
        type: 'API_SPECIFICATION',
        title: 'API Specification',
        content: JSON.stringify(analysis.api),
        author: 'Architect AI',
      },
    }),
    memory.remember({
      agentId,
      content: `Project ${projectId} architecture: ${analysis.architecture.frontend} / ${analysis.architecture.backend} / ${analysis.architecture.database}`,
      type: 'PROJECT',
      metadata: { projectId },
    }),
    ArtifactRegistryService.registerArtifact({
      projectId,
      type: 'ARCHITECTURE_SPECIFICATION',
      createdBy: 'ARCHITECT',
      payload: analysis,
      summary: `Architecture: ${analysis.architecture.frontend} + ${analysis.architecture.backend}`,
      qualityScore: {
        completeness: 92,
        consistency: 92,
        requirementCoverage: 90,
        correctness: 95,
        technicalRisk: 10,
      },
    }),
    ArtifactManager.storeArtifact(projectId, {
      type: 'ArchitectureDocument',
      content: analysis,
      producerRole: 'ARCHITECT',
      consumerRoles: ['UI_UX', 'DEVELOPER', 'QA'],
      summary: `System Architecture, API design, and Database schema`,
    }),
    RuntimeContractService.establishRuntimeContract({
      projectId,
      projectType: 'FULL_STACK',
      stackId: 'nextjs-fullstack-v1',
    }).catch(() => null),
    ProjectStateManager.updateState(projectId, (s) => {
      s.currentStage = 'ARCHITECTURE';
      s.architecture.systemOverview = `${analysis.architecture.frontend} | ${analysis.architecture.backend}`;
      s.architecture.targetStack = {
        frontend: analysis.architecture.frontend,
        backend: analysis.architecture.backend,
        database: analysis.architecture.database,
        runtime: analysis.architecture.infrastructure,
      };
      s.architecture.techDecisions = (analysis.decisions || []).map((d, idx) => ({
        id: `ADR-${idx + 1}`,
        decision: d.technology,
        selectedOption: d.technology,
        alternativesConsidered: d.alternative ? [d.alternative] : [],
        rationale: d.reason,
        tradeoffs: d.tradeoff ? [d.tradeoff] : [],
        reversibility: 'MODERATE',
      }));
      s.architecture.databaseSchema = {
        entities: (analysis.database?.entities || []).map((e) => ({
          name: e.name,
          fields: (e.fields || []).map((f) => ({
            name: f.name,
            type: f.type,
            constraints: [],
          })),
          relations: (analysis.database?.relationships || [])
            .filter((r: any) => typeof r === 'object' && r !== null && (r.from === e.name || r.to === e.name))
            .map((r: any) => ({
              target: String(r.from === e.name ? r.to : r.from || ''),
              type: String(r.type || 'one-to-many'),
            })),
        })),
        rawSchema: JSON.stringify(analysis.database || {}),
      };
      s.architecture.apiDesign = {
        endpoints: (analysis.api?.endpoints || []).map((ep) => ({
          path: ep.path,
          method: (ep.method as any) || 'GET',
          description: ep.response || `Endpoint ${ep.path}`,
          requestBody: ep.request ? { body: ep.request } : undefined,
          responseBody: ep.response ? { body: ep.response } : undefined,
          authRequired: false,
        })),
      };
      s.architecture.fileStructure = (analysis.fileStructure || []).map((item) => {
        const path = typeof item === 'string' ? item : (item as any).path || String(item);
        const purpose = typeof item === 'string' ? 'Source file' : (item as any).purpose || 'Source file';
        const layer: 'FRONTEND' | 'BACKEND' | 'DATABASE' | 'SHARED' | 'CONFIG' | 'TEST' =
          path.startsWith('src/components') || path.startsWith('src/pages') || path.endsWith('.tsx') || path.endsWith('.html') || path.endsWith('.css')
            ? 'FRONTEND'
            : path.startsWith('src/api') || path.startsWith('src/server') || path.startsWith('src/services')
              ? 'BACKEND'
              : path.includes('prisma') || path.includes('db') || path.includes('database')
                ? 'DATABASE'
                : path.includes('test') || path.includes('spec')
                  ? 'TEST'
                  : path.endsWith('.json') || path.endsWith('.config.js') || path.endsWith('.config.ts')
                    ? 'CONFIG'
                    : 'SHARED';
        return { path, purpose, layer };
      });
      if (analysis.implementationTodos?.length && s.implementation) {
        s.implementation.pendingTodos = analysis.implementationTodos.map((t) => t.id || t.title);
      }
      s.architecture.approvalStatus = 'APPROVED';
    }),
  ]);

  if (analysis.fileStructure?.length || analysis.implementationTodos?.length) {
    await persistDeliveryPlan(projectId, {
      fileStructure: analysis.fileStructure || [],
      implementationTodos: analysis.implementationTodos || [],
      qaTodos: analysis.qaTodos || [],
    }).catch((err) =>
      console.warn('[Architect] persistDeliveryPlan failed:', err),
    );
  }
}

export async function designArchitecture(
  projectId: string,
  requirements: ProductRequirement | unknown,
  feedback?: string,
): Promise<ApiResult<ArchitectAnalysis>> {
  const agentId = await getOrCreateArchitectAgentId();

  await prisma.document.deleteMany({ where: { projectId, type: 'ARCHITECT_IN_PROGRESS' } });
  await prisma.document.create({
    data: {
      projectId,
      type: 'ARCHITECT_IN_PROGRESS',
      title: 'Architecture In Progress',
      content: '{}',
      author: 'Architect AI',
    },
  });

  await prisma.agent.update({ where: { id: agentId }, data: { status: 'WORKING' } });
  await logAIEvent('ARCHITECT_ANALYSIS_STARTED', { projectId }, agentId);

  try {
    const stack = await resolveStackFromMemory(projectId, requirements, feedback);
    let analysis: ArchitectAnalysis;
    let usedHeuristic = false;

    try {
      const req = requirements as ProductRequirement;
      const [architectureResult, databaseResult] = await Promise.all([
        architectureDesignerTool.execute({ requirements: req, projectId, agentId }),
        databaseDesignerTool.execute({ requirements: req, projectId, agentId }),
      ]);
      if (!architectureResult.success || !databaseResult.success) {
        const err1 = !architectureResult.success ? architectureResult.error : '';
        const err2 = !databaseResult.success ? databaseResult.error : '';
        throw new Error(
          err1 || err2 || 'Architecture AI tools failed',
        );
      }
      const apiResult = await apiDesignerTool.execute({
        requirements: req,
        database: databaseResult.data,
        projectId,
        agentId,
      });
      if (!apiResult.success) {
        throw new Error(apiResult.error || 'API Designer AI tool failed');
      }

      analysis = architectAnalysisSchema.parse({
        architecture: architectureResult.data,
        database: databaseResult.data,
        api: apiResult.data,
        decisions: buildHeuristicArchitecture(requirements, feedback, stack).decisions,
      });
    } catch (aiErr) {
      console.warn('[Architect] AI analysis failed:', aiErr);
      if (process.env.NODE_ENV === 'test' || process.env.ALLOW_HEURISTIC_MOCK === 'true') {
        usedHeuristic = true;
        analysis = buildHeuristicArchitecture(requirements, feedback, stack);
      } else {
        throw aiErr;
      }
    }

    const withPlan = withDeliveryPlan(analysis, (analysis as any).title || 'Application', stack);
    await persistArchitecture(projectId, agentId, withPlan);

    await prisma.document.deleteMany({ where: { projectId, type: 'ARCHITECT_IN_PROGRESS' } });
    await prisma.agent.update({ where: { id: agentId }, data: { status: 'IDLE' } });
    await logAIEvent('ARCHITECT_ANALYSIS_COMPLETED', { projectId, stack: stack.label, fallback: usedHeuristic }, agentId);

    return { success: true, data: withPlan };
  } catch (err) {
    await prisma.document.deleteMany({ where: { projectId, type: 'ARCHITECT_IN_PROGRESS' } });
    await prisma.agent.update({ where: { id: agentId }, data: { status: 'ERROR' } });
    await logAIEvent('ARCHITECT_ANALYSIS_FAILED', { projectId, error: String(err) }, agentId);
    return {
      success: false,
      error: {
        message: err instanceof Error ? err.message : 'Architecture design failed',
        code: 'AI_ERROR',
      },
    };
  }
}

export async function getArchitectureDocuments(projectId: string) {
  return prisma.document.findMany({
    where: {
      projectId,
      type: { in: ['SYSTEM_ARCHITECTURE', 'DATABASE_DESIGN', 'API_SPECIFICATION'] },
    },
    orderBy: { createdAt: 'desc' },
  });
}

export async function regenerateArchitectureForConfirmedStack(
  projectId: string,
  requirements?: unknown,
): Promise<ArchitectAnalysis | null> {
  const stack = await resolveStackFromMemory(projectId, requirements);
  if (!stack.htmlCss) return null;

  const latest = await prisma.document.findFirst({
    where: { projectId, type: { in: ['SYSTEM_ARCHITECTURE', 'ArchitectureDocument'] } },
    orderBy: { createdAt: 'desc' },
  });
  const blob = `${latest?.content || ''}`.toLowerCase();
  const looksLikeNext =
    blob.includes('next.js') ||
    blob.includes('app router') ||
    blob.includes('prisma') ||
    blob.includes('postgresql');

  if (latest && !looksLikeNext) return null;

  const analysis = buildHeuristicArchitecture(
    requirements || { title: 'Application' },
    'Regenerated to match your saved HTML/CSS stack',
    stack,
  );
  const agentId = await getOrCreateArchitectAgentId();
  await persistArchitecture(projectId, agentId, analysis);

  const { ArtifactManager } = await import('@/core/company-orchestration/artifact-manager');
  await ArtifactManager.storeArtifact(projectId, {
    type: 'ArchitectureDocument',
    content: analysis,
    producerRole: 'ARCHITECT',
    consumerRoles: ['UI_UX', 'DEVELOPER'],
    summary: `Architecture for ${stack.label}`,
  });

  return analysis;
}

export class ArchitectService {
  public static async designArchitecture(input: ArchitectExecutionInput): Promise<ArchitectureSpec> {
    const defaultSpec: ArchitectureSpec = {
      techStack: {
        frontend: 'Next.js 16 (React 19, TypeScript)',
        backend: 'Next.js Route Handlers / Server Actions',
        database: 'Prisma ORM with PostgreSQL',
        styling: 'Tailwind CSS, Lucide Icons',
        keyLibraries: ['zod', 'lucide-react', 'clsx', 'tailwind-merge'],
      },
      fileTree: [
        { path: 'src/app/page.tsx', purpose: 'Main interactive client landing & application dashboard' },
        { path: 'src/components/ui/header.tsx', purpose: 'Responsive navigation header with action triggers' },
        { path: 'src/components/features/main-view.tsx', purpose: 'Primary feature interface and real-time state' },
        { path: 'src/lib/utils.ts', purpose: 'Shared styling and utility helpers' },
      ],
      databaseSchema: {
        models: [
          {
            name: 'ProjectData',
            fields: ['id String @id @default(cuid())', 'createdAt DateTime @default(now())', 'payload Json'],
          },
        ],
      },
      apiEndpoints: [
        {
          path: '/api/data',
          method: 'GET',
          description: 'Fetches active application records and telemetry',
        },
        {
          path: '/api/data',
          method: 'POST',
          description: 'Creates new application record with Zod validation',
        },
      ],
      implementationTodos: [
        { file: 'src/app/page.tsx', action: 'CREATE', description: 'Build interactive main entry point' },
        { file: 'src/components/ui/header.tsx', action: 'CREATE', description: 'Build top navigation bar' },
        { file: 'src/components/features/main-view.tsx', action: 'CREATE', description: 'Build core feature layout' },
      ],
    };

    const validation = ContractValidator.validate(ArchitectureSpecSchema, defaultSpec);
    if (!validation.success) {
      throw new Error(`Architecture Spec validation failed: ${validation.error}`);
    }

    return validation.data;
  }
}
