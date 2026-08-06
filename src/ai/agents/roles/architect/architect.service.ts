import { prisma } from '@/lib/prisma';
import { getMemoryManager } from '@/ai/agents/memory/memory.manager';
import { logAIEvent } from '@/ai/monitoring/ai.logger';
import {
  architectureDesignerTool,
  databaseDesignerTool,
  apiDesignerTool,
} from './architect.tools';
import {
  architectAnalysisSchema,
  type ArchitectAnalysis,
} from './architect.types';
import type { ProductRequirement } from '@/ai/agents/roles/ceo/ceo.types';
import type { ApiResult } from '@/types/common.types';
import { wantsHtmlCssStack, wantsStaticNoBackend } from '@/core/company-orchestration/revision-feedback';
import { resolveStackFromMemory } from '@/core/memory/persist-stack-constraints';
import type { StackIntent } from '@/core/company-orchestration/stack-intent';
import { buildDeliveryPlanForStack } from '@/core/company-orchestration/architecture-delivery-plan';
import { persistDeliveryPlan } from '@/core/company-orchestration/implementation-todo.store';

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

function buildHtmlCssLoginArchitecture(
  title: string,
  feedback?: string,
  input?: unknown,
  forceStatic?: boolean,
): ArchitectAnalysis {
  const staticOnly =
    forceStatic === true || wantsStaticNoBackend(feedback, title, input);

  if (staticOnly) {
    return architectAnalysisSchema.parse({
      architecture: {
        frontend:
          'Plain static HTML + CSS only: login.html, signup.html, home.html, css/styles.css. No Next.js, no React, no framework, no build step.',
        backend:
          'None. Static pages only — open HTML files in a browser or serve the folder with any static file server. No Express, no PHP, no API.',
        database: 'None. No database for this MVP (static demo pages).',
        infrastructure:
          'Static hosting or open files locally (e.g. Live Server / python -m http.server).',
        security:
          'Demo UI only. Forms navigate between pages; no real password storage or server auth until a backend is requested later.',
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
        {
          technology: 'No backend / no database',
          reason: 'User explicitly does not want a backend for this deliverable',
          alternative: 'Node/Express + users table',
          tradeoff: 'Pages are real HTML/CSS files; auth is navigational demo only',
        },
      ],
    });
  }

  return architectAnalysisSchema.parse({
    architecture: {
      frontend:
        'Plain HTML pages + CSS (login.html, signup.html, home.html). No Next.js, no React, no build step for UI.',
      backend:
        'Small Node.js + Express (or PHP) server for /login, /signup, /logout and serving static HTML/CSS/JS files.',
      database: 'SQLite or PostgreSQL with a simple users table (id, email, password_hash, name).',
      infrastructure: 'Any static host + small Node/PHP process, or local folder open via a tiny server.',
      security:
        'Hash passwords (bcrypt), HTTP-only session cookie, redirect guests away from home.html, validate email/password on server.',
    },
    database: {
      entities: [
        {
          name: 'users',
          fields: [
            { name: 'id', type: 'integer primary key' },
            { name: 'email', type: 'text unique' },
            { name: 'password_hash', type: 'text' },
            { name: 'name', type: 'text nullable' },
            { name: 'created_at', type: 'datetime' },
          ],
        },
        {
          name: 'sessions',
          fields: [
            { name: 'id', type: 'text primary key' },
            { name: 'user_id', type: 'integer' },
            { name: 'expires_at', type: 'datetime' },
          ],
        },
      ],
      relationships: ['users 1—* sessions'],
      indexes: ['unique(users.email)', 'index(sessions.user_id)'],
      constraints: ['email required', 'password_hash required'],
    },
    api: {
      endpoints: [
        {
          path: '/signup',
          method: 'POST',
          request: 'form: email, password, name?',
          response: 'redirect to login.html or set session + home.html',
        },
        {
          path: '/login',
          method: 'POST',
          request: 'form: email, password',
          response: 'set session cookie + redirect home.html',
        },
        {
          path: '/logout',
          method: 'POST',
          response: 'clear session + redirect login.html',
        },
        {
          path: '/home.html',
          method: 'GET',
          response: 'HTML page only if logged in; otherwise redirect login.html',
        },
      ],
    },
    decisions: [
      {
        technology: 'HTML + CSS (+ light JS)',
        reason: feedback?.trim() || `User asked for a simple ${title} without Next.js`,
        alternative: 'Next.js App Router',
        tradeoff: 'Faster to understand for beginners; less framework magic',
      },
      {
        technology: 'Express or PHP form posts',
        reason: 'User asked for a backend with classic HTML forms',
        alternative: 'Next.js Route Handlers',
        tradeoff: 'Simple request/response without React',
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

/** Lean architecture so Architecture never blocks Mission Control on slow LLM calls. */
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

  // Confirmed project stack (create form) wins over text heuristics.
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
  ]);

  // Persist folder tree + implementation/QA todos for Developer & Mission Control
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
    // Honor stack chosen at project create (HTML/CSS · Saved), not only text keywords.
    const stack = await resolveStackFromMemory(projectId, requirements, feedback);
    const analysis = buildHeuristicArchitecture(requirements, feedback, stack);
    await persistArchitecture(projectId, agentId, analysis);

    await prisma.document.deleteMany({ where: { projectId, type: 'ARCHITECT_IN_PROGRESS' } });
    await prisma.agent.update({ where: { id: agentId }, data: { status: 'IDLE' } });
    await logAIEvent('ARCHITECT_ANALYSIS_COMPLETED', { projectId, stack: stack.label }, agentId);

    // Never let LLM overwrite an explicit HTML/CSS / static stack
    const respectUserStack = stack.htmlCss || wantsHtmlCssStack(requirements, feedback);
    if (!respectUserStack) {
      void (async () => {
        try {
          const req = requirements as ProductRequirement;
          const architectureResult = await architectureDesignerTool.execute({
            requirements: req,
            projectId,
            agentId,
          });
          if (!architectureResult.success) return;

          const databaseResult = await databaseDesignerTool.execute({
            requirements: req,
            projectId,
            agentId,
          });
          if (!databaseResult.success) return;

          const apiResult = await apiDesignerTool.execute({
            requirements: req,
            database: databaseResult.data,
            projectId,
            agentId,
          });
          if (!apiResult.success) return;

          const enriched = architectAnalysisSchema.parse({
            architecture: architectureResult.data,
            database: databaseResult.data,
            api: apiResult.data,
            decisions: analysis.decisions,
          });
          await persistArchitecture(projectId, agentId, enriched);
        } catch {
          // Enrichment is optional
        }
      })();
    }

    return { success: true, data: analysis };
  } catch (err) {
    try {
      const stack = await resolveStackFromMemory(projectId, requirements, feedback).catch(
        () => null,
      );
      const fallback = buildHeuristicArchitecture(requirements, feedback, stack);
      await persistArchitecture(projectId, agentId, fallback);
      await prisma.document.deleteMany({ where: { projectId, type: 'ARCHITECT_IN_PROGRESS' } });
      await prisma.agent.update({ where: { id: agentId }, data: { status: 'IDLE' } });
      await logAIEvent('ARCHITECT_ANALYSIS_COMPLETED', { projectId, fallback: true }, agentId);
      return { success: true, data: fallback };
    } catch (fallbackErr) {
      await prisma.document.deleteMany({ where: { projectId, type: 'ARCHITECT_IN_PROGRESS' } });
      await prisma.agent.update({ where: { id: agentId }, data: { status: 'ERROR' } });
      await logAIEvent('ARCHITECT_ANALYSIS_FAILED', { projectId, error: String(err) }, agentId);
      return {
        success: false,
        error: {
          message:
            fallbackErr instanceof Error
              ? fallbackErr.message
              : err instanceof Error
                ? err.message
                : 'Architecture design failed',
          code: 'AI_ERROR',
        },
      };
    }
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

/**
 * If the user confirmed HTML/CSS but Architect already produced a Next.js doc,
 * regenerate once and replace the pending ArchitectureDocument.
 */
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
  // No prior doc, or wrong stack → regenerate for HTML/CSS
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
