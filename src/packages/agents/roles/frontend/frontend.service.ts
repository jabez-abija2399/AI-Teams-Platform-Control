import { prisma } from '@/lib/prisma';
import { getMemoryManager } from '@/packages/agents/memory/memory.manager';
import { logAIEvent } from '@/ai/monitoring/ai.logger';
import { aiCall } from '@/packages/agents/core/ai-call';
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

/** Lean frontend spec so Frontend never stalls Mission Control on slow LLM calls. */
export function buildHeuristicFrontendDesignSpec(
  input: unknown,
  feedback?: string,
): FrontendDesignSpec {
  const blob = `${JSON.stringify(input || {})} ${feedback || ''}`.toLowerCase();
  const isAuth = blob.includes('login') || blob.includes('auth') || blob.includes('signup');
  const simple = blob.includes('simpler') || blob.includes('static') || blob.includes('html');
  const note = feedback?.trim() || 'Generated from architecture for pipeline continuity';

  const pages = isAuth
    ? [
        { id: 'PG-001', name: 'Login', route: '/login', description: 'Email/password login form', components: ['LoginForm'], requiresAuth: false },
        { id: 'PG-002', name: 'Signup', route: '/signup', description: 'Registration form', components: ['SignupForm'], requiresAuth: false },
        { id: 'PG-003', name: 'Home', route: '/', description: 'Protected dashboard after login', components: ['ProtectedHome', 'LogoutButton'], requiresAuth: true },
      ]
    : [
        { id: 'PG-001', name: 'Home', route: '/', description: 'Main application page', components: ['MainView'], requiresAuth: false },
        { id: 'PG-002', name: 'Settings', route: '/settings', description: 'User settings', components: ['SettingsForm'], requiresAuth: true },
      ];

  const components = isAuth
    ? [
        { id: 'CMP-001', name: 'LoginForm', description: 'Email + password fields and submit', props: [], variants: [], states: ['default', 'error', 'loading'] },
        { id: 'CMP-002', name: 'SignupForm', description: 'Name, email, password registration', props: [], variants: [], states: ['default', 'error'] },
        { id: 'CMP-003', name: 'ProtectedHome', description: 'Post-login landing with logout', props: [], variants: [], states: ['default'] },
      ]
    : [
        { id: 'CMP-001', name: 'MainView', description: 'Primary application view', props: [], variants: [], states: ['default', 'loading'] },
      ];

  return frontendDesignSpecSchema.parse({
    applicationStructure: {
      framework: 'Next.js App Router',
      language: 'TypeScript',
      styling: 'Tailwind CSS',
      stateManagement: simple ? 'React hooks' : 'Zustand + React Query',
      folderStructure: 'src/app (routes), src/components, src/hooks, src/lib',
    },
    routing: pages.map((p) => ({ path: p.route, page: p.name, description: p.description, authRequired: p.requiresAuth })),
    layouts: [
      { id: 'LAYOUT-001', name: 'RootLayout', description: 'Global layout with providers and fonts', pages: ['*'] },
    ],
    pages,
    components,
    hooks: [
      { id: 'HK-001', name: 'useAuth', description: 'Authentication state and login/logout actions', returnType: '{ user, login, logout, isLoading }' },
    ],
    stateManagement: { globalState: simple ? 'None (props only)' : 'Zustand store', serverState: 'React Query / SWR', formState: 'React Hook Form' },
    apiIntegration: isAuth
      ? [{ endpoint: '/api/auth/login', method: 'POST', description: 'Email/password login' }, { endpoint: '/api/auth/register', method: 'POST', description: 'Create account' }, { endpoint: '/api/auth/me', method: 'GET', description: 'Current user' }]
      : [{ endpoint: '/api/health', method: 'GET', description: 'Health check' }],
    forms: isAuth ? [{ id: 'FORM-001', name: 'LoginForm', fields: ['email', 'password'], validation: 'Zod schema', submitAction: 'POST /api/auth/login' }] : [],
    validationRules: [{ field: 'email', rule: 'Valid email format', errorMessage: 'Enter a valid email' }],
    responsiveLayouts: [{ breakpoint: 'Mobile (<640px)', layoutType: 'Single column', columns: 1 }, { breakpoint: 'Desktop', layoutType: 'Centered container', columns: 1 }],
    performanceOptimizations: ['Lazy load components', 'Optimize images', 'Minimize bundle size'],
    accessibility: [{ rule: 'Keyboard navigation', implementation: 'Tab order on all interactive elements' }, { rule: 'ARIA labels', implementation: 'Label all form fields' }],
    seo: [{ page: 'Home', title: 'Application', description: note.slice(0, 120) }],
    testingStrategy: { unitTests: 'Vitest + React Testing Library', e2eTests: simple ? 'None (MVP)' : 'Playwright', coverage: '80% target' },
    status: 'APPROVED',
  });
}

export async function generateFrontendDesignSpec(
  projectId: string,
  inputData: unknown,
  feedback?: string,
): Promise<ApiResult<FrontendDesignSpec>> {
  const agentId = await getOrCreateFEAgentId();

  await prisma.agent.update({ where: { id: agentId }, data: { status: 'WORKING' } });
  await logAIEvent('FRONTEND_DESIGN_STARTED', { projectId }, agentId);

  try {
    // Lean-first: return heuristic immediately so Frontend never stalls the pipeline.
    const spec = buildHeuristicFrontendDesignSpec(inputData, feedback);

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
        metadata: { projectId },
      }),
    ]);

    // Optional background LLM enrichment — never blocks the pipeline
    if (!feedback?.trim()) {
      void (async () => {
        try {
          const prompt = `Input Backend & UI/UX Specs:\n${JSON.stringify(inputData, null, 2).slice(0, 5000)}\n\nGenerate lean Frontend Implementation Plan JSON. Respond ONLY with valid JSON.`;
          const raw = await Promise.race([
            aiCall<unknown>(prompt, FRONTEND_SYSTEM_PROMPT, 'FRONTEND', frontendConfig, projectId, agentId),
            new Promise<never>((_, reject) =>
              setTimeout(() => reject(new Error('Frontend LLM budget exceeded')), 25_000),
            ),
          ]);
          const parsed = frontendDesignSpecSchema.safeParse(raw);
          if (parsed.success) {
            await prisma.frontendDesignDocument.create({
              data: {
                projectId,
                applicationStructure: parsed.data.applicationStructure as any,
                routing: parsed.data.routing as any,
                layouts: parsed.data.layouts as any,
                pages: parsed.data.pages as any,
                components: parsed.data.components as any,
                hooks: parsed.data.hooks as any,
                stateManagement: parsed.data.stateManagement as any,
                apiIntegration: parsed.data.apiIntegration as any,
                forms: parsed.data.forms as any,
                validationRules: parsed.data.validationRules as any,
                responsiveLayouts: parsed.data.responsiveLayouts as any,
                performanceOptimizations: parsed.data.performanceOptimizations as any,
                accessibility: parsed.data.accessibility as any,
                seo: parsed.data.seo as any,
                testingStrategy: parsed.data.testingStrategy as any,
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
    await logAIEvent('FRONTEND_DESIGN_COMPLETED', { projectId }, agentId);

    return { success: true, data: spec };
  } catch (err) {
    try {
      const fallback = buildHeuristicFrontendDesignSpec(inputData, feedback);
      await prisma.agent.update({ where: { id: agentId }, data: { status: 'IDLE' } });
      return { success: true, data: fallback };
    } catch (fallbackErr) {
      await prisma.agent.update({ where: { id: agentId }, data: { status: 'ERROR' } });
      await logAIEvent('FRONTEND_DESIGN_FAILED', { projectId, error: String(err) }, agentId);
      return {
        success: false,
        error: {
          message: fallbackErr instanceof Error ? fallbackErr.message : err instanceof Error ? err.message : 'Frontend design generation failed',
          code: 'AI_ERROR',
        },
      };
    }
  }
}
