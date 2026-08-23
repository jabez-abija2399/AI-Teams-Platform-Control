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
import {
  wantsSimpler,
  withRevisionMeta,
  wantsHtmlCssStack,
} from '@/core/company-orchestration/revision-feedback';
import { resolveStackIntent } from '@/core/company-orchestration/stack-intent';
import type { ApiResult } from '@/types/common.types';
import { ProjectStateManager } from '@/core/state/project-state.manager';
import { ArtifactRegistryService } from '@/core/artifacts/artifact-registry.service';
import { AgentContractRegistry } from '@/core/contracts/agent-registry';
import { ArtifactManager } from '@/core/company-orchestration/artifact-manager';

const UID_ROLE_NAME = 'UI Designer AI';

async function getOrCreateUIDAgentId(): Promise<string> {
  const existing = await prisma.agent.findFirst({ where: { role: 'UI_DESIGNER' } });
  if (existing) return existing.id;
  const created = await prisma.agent.create({
    data: {
      name: UID_ROLE_NAME,
      role: 'UI_DESIGNER',
      status: 'IDLE',
      capabilities: ['UI_DESIGN', 'UX_RESEARCH', 'FRONTEND_DEVELOPMENT'],
    },
  });
  return created.id;
}

/** Fast design spec that respects HTML/CSS and simplify feedback. */
export function buildHeuristicUiDesignSpec(
  input: unknown,
  feedback?: string,
): UiDesignSpec {
  const intent = resolveStackIntent(input, feedback);
  const htmlCss = intent.htmlCss;
  const simple = wantsSimpler(input, feedback) || htmlCss;

  if (htmlCss) {
    return withRevisionMeta(
      uiDesignSpecSchema.parse({
        designTokens: {
          colors: [
            { category: 'Color', name: 'background', value: '#F2F0EF', description: 'Page background' },
            { category: 'Color', name: 'text', value: '#1a1a1a', description: 'Body text' },
            { category: 'Color', name: 'primary', value: '#245F73', description: 'Buttons / links' },
            { category: 'Color', name: 'accent', value: '#733E24', description: 'Accent' },
            { category: 'Color', name: 'border', value: '#BBBDBC', description: 'Form borders' },
          ],
          typography: [
            { category: 'Type', name: 'body', value: 'system-ui, sans-serif 16px', description: 'Readable body' },
            { category: 'Type', name: 'heading', value: 'system-ui, sans-serif 24px bold', description: 'Page titles' },
          ],
          spacing: [
            { category: 'Space', name: 'form-gap', value: '12px', description: 'Between fields' },
            { category: 'Space', name: 'page-pad', value: '24px', description: 'Page padding' },
          ],
          borderRadius: [
            { category: 'Radius', name: 'input', value: '8px', description: 'Inputs and buttons' },
          ],
          shadows: [],
          glassmorphism: [],
        },
        componentHierarchy: [
          {
            id: 'CMP-001',
            name: 'LoginForm',
            description: 'Email + password fields and submit in login.html',
            props: [],
            variants: [],
            states: ['default', 'error', 'loading'],
          },
          {
            id: 'CMP-002',
            name: 'SignupForm',
            description: 'Name, email, password in signup.html',
            props: [],
            variants: [],
            states: ['default', 'error'],
          },
          {
            id: 'CMP-003',
            name: 'HomeWelcome',
            description: 'Protected home.html greeting + logout',
            props: [],
            variants: [],
            states: ['default'],
          },
        ],
        responsiveLayouts: [
          {
            breakpoint: 'Mobile (<640px)',
            layoutType: 'Centered single column form',
            navigationTransform: 'Top brand only',
            gridColumns: '1',
          },
          {
            breakpoint: 'Desktop',
            layoutType: 'Centered card max-width 420px',
            navigationTransform: 'Top brand only',
            gridColumns: '1',
          },
        ],
        visualStyleGuide: {
          themeName: 'Clean HTML Login',
          vibe: 'Simple, readable, no framework chrome — plain HTML and CSS',
          primaryPalette: 'Teal #245F73 on warm gray #F2F0EF',
          secondaryPalette: 'Brown accent #733E24',
        },
        microInteractions: [
          {
            trigger: 'Focus',
            animation: 'Border color to primary',
            targetComponent: 'Input',
          },
        ],
        accessibilityVisualTokens: [
          {
            element: 'Focus ring',
            token: '2px solid #245F73',
            wcagCompliance: 'WCAG 2.1 AA',
          },
        ],
        layoutMockups: [
          {
            screenId: 'SCR-001',
            screenName: 'login.html',
            wireframeLayout: 'Centered card: logo, email, password, Log in button, link to signup.html',
            visualEnhancements: ['CSS only', 'No React', 'No Next.js'],
          },
          {
            screenId: 'SCR-002',
            screenName: 'signup.html',
            wireframeLayout: 'Centered card: name, email, password, Create account, link to login.html',
            visualEnhancements: ['Matching CSS from styles.css'],
          },
          {
            screenId: 'SCR-003',
            screenName: 'home.html',
            wireframeLayout: 'Welcome message + Logout button; redirect to login.html if not signed in',
            visualEnhancements: ['Same CSS file'],
          },
        ],
        cssVariablesManifest: `:root {
  --color-bg: #F2F0EF;
  --color-text: #1a1a1a;
  --color-primary: #245F73;
  --color-accent: #733E24;
  --color-border: #BBBDBC;
  --radius: 8px;
  --font: system-ui, sans-serif;
}`,
        status: 'APPROVED',
      }),
      feedback,
    ) as UiDesignSpec;
  }

  return withRevisionMeta(
    uiDesignSpecSchema.parse({
      designTokens: {
        colors: [
          { category: 'Color', name: 'background', value: '#F2F0EF', description: 'Page background' },
          { category: 'Color', name: 'primary', value: '#245F73', description: 'Primary actions' },
          { category: 'Color', name: 'accent', value: '#733E24', description: 'Accent' },
        ],
        typography: [
          { category: 'Type', name: 'body', value: 'Manrope / system-ui', description: 'UI body' },
        ],
        spacing: [{ category: 'Space', name: 'md', value: '16px', description: 'Default gap' }],
        borderRadius: [{ category: 'Radius', name: 'lg', value: '12px', description: 'Cards' }],
        shadows: [],
        glassmorphism: simple ? [] : undefined,
      },
      componentHierarchy: [
        { id: 'CMP-001', name: 'LoginForm', description: 'Email/password login', props: [], variants: [], states: ['default'] },
        { id: 'CMP-002', name: 'SignupForm', description: 'Registration form', props: [], variants: [], states: ['default'] },
        { id: 'CMP-003', name: 'ProtectedHome', description: 'Post-login home', props: [], variants: [], states: ['default'] },
      ],
      responsiveLayouts: [
        {
          breakpoint: 'Mobile',
          layoutType: 'Single column',
          navigationTransform: 'Top bar',
          gridColumns: '1',
        },
      ],
      visualStyleGuide: {
        themeName: simple ? 'Clean MVP' : 'Product UI',
        vibe: simple ? 'Clear and minimal' : 'Modern product UI',
        primaryPalette: '#245F73',
        secondaryPalette: '#733E24',
      },
      microInteractions: [],
      accessibilityVisualTokens: [
        { element: 'Focus', token: '2px solid primary', wcagCompliance: 'WCAG 2.1 AA' },
      ],
      layoutMockups: [
        {
          screenId: 'SCR-001',
          screenName: 'Login',
          wireframeLayout: 'Centered auth form',
          visualEnhancements: [],
        },
        {
          screenId: 'SCR-002',
          screenName: 'Signup',
          wireframeLayout: 'Centered signup form',
          visualEnhancements: [],
        },
        {
          screenId: 'SCR-003',
          screenName: 'Home',
          wireframeLayout: 'Welcome + logout',
          visualEnhancements: [],
        },
      ],
      cssVariablesManifest: ':root { --color-primary: #245F73; --color-bg: #F2F0EF; }',
      status: 'APPROVED',
    }),
    feedback,
  ) as UiDesignSpec;
}

async function persistSpec(projectId: string, agentId: string, spec: UiDesignSpec) {
  await prisma.uiDesignDocument.create({
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
        title: 'UI/UX Design Specification (UDS-001)',
        content: JSON.stringify(spec),
        author: UID_ROLE_NAME,
      },
    }),
    memory.remember({
      agentId,
      content: `Project ${projectId}: UI design ${spec.visualStyleGuide.themeName}`,
      type: 'PROJECT',
      metadata: { projectId },
    }),
    ArtifactRegistryService.registerArtifact({
      projectId,
      type: 'UI_DESIGN_SPECIFICATION',
      createdBy: 'DESIGNER',
      payload: spec,
      summary: `UI Design Spec: ${spec.visualStyleGuide.themeName} with ${spec.componentHierarchy.length} components`,
      qualityScore: {
        completeness: 90,
        consistency: 95,
        requirementCoverage: 90,
        correctness: 90,
        technicalRisk: 10,
      },
    }),
    ArtifactManager.storeArtifact(projectId, {
      type: 'UIDesignSpec',
      content: spec,
      producerRole: 'UI_UX',
      consumerRoles: ['DEVELOPER', 'QA'],
      summary: `Design system tokens, component specs, and responsive wireframes`,
    }),
    ProjectStateManager.updateState(projectId, (s) => {
      s.currentStage = 'DESIGN';
      if (!s.design) {
        s.design = {
          version: 1,
          designSystemName: spec.visualStyleGuide.themeName,
          designTokens: { colors: {}, typography: {}, spacing: {}, radii: {} },
          userJourneys: [],
          components: [],
          cssVariablesManifest: '',
        };
      }
      s.design.designSystemName = spec.visualStyleGuide.themeName;
      const colors: Record<string, string> = {};
      for (const c of spec.designTokens.colors || []) {
        colors[c.name] = c.value;
      }
      const typography: Record<string, string> = {};
      for (const t of spec.designTokens.typography || []) {
        typography[t.name] = t.value;
      }
      const spacing: Record<string, string> = {};
      for (const sp of spec.designTokens.spacing || []) {
        spacing[sp.name] = sp.value;
      }
      const radii: Record<string, string> = {};
      for (const r of spec.designTokens.borderRadius || []) {
        radii[r.name] = r.value;
      }
      s.design.designTokens = { colors, typography, spacing, radii };
      s.design.components = (spec.componentHierarchy || []).map((c) => ({
        name: c.name,
        filePath: `src/components/${c.name}.tsx`,
        description: c.description,
        props: (c.props || []).map((p) =>
          typeof p === 'string'
            ? { name: p, type: 'string', required: false }
            : (p as any)
        ),
        stateVariants: {
          loading: c.states?.includes('loading'),
          error: c.states?.includes('error'),
          disabled: c.states?.includes('disabled'),
        },
        responsiveRules: {
          mobile: '100% width',
          desktop: 'auto max-width 1200px',
        },
      }));
      s.design.userJourneys = (spec.layoutMockups || []).map((m, idx) => ({
        id: m.screenId || `UJ-${idx + 1}`,
        title: m.screenName,
        steps: [m.wireframeLayout],
      }));
      s.design.cssVariablesManifest = spec.cssVariablesManifest;
    }),
  ]);
}

export async function generateUiDesignSpec(
  projectId: string,
  ujw: unknown,
  feedback?: string,
): Promise<ApiResult<UiDesignSpec>> {
  const agentId = await getOrCreateUIDAgentId();

  await prisma.agent.update({ where: { id: agentId }, data: { status: 'WORKING' } });
  await logAIEvent('UID_DESIGN_STARTED', { projectId }, agentId);

  try {
    // Always start from a feedback-aware heuristic so regenerate is correct and fast
    const spec = buildHeuristicUiDesignSpec(ujw, feedback);
    await persistSpec(projectId, agentId, spec);

    await prisma.agent.update({ where: { id: agentId }, data: { status: 'IDLE' } });
    await logAIEvent('UID_DESIGN_COMPLETED', { projectId }, agentId);

    // Optional LLM enrichment only when user did not lock stack to HTML/CSS
    if (!wantsHtmlCssStack(ujw, feedback) && !feedback?.trim()) {
      void (async () => {
        try {
          const prompt = `UX input:\n${JSON.stringify(ujw, null, 2).slice(0, 6000)}\n\nGenerate lean UI design JSON. Respond ONLY with valid JSON.`;
          const raw = await Promise.race([
            aiCall<unknown>(
              prompt,
              UI_DESIGNER_SYSTEM_PROMPT,
              'UI_DESIGNER',
              uiDesignerConfig,
              projectId,
              agentId,
            ),
            new Promise<never>((_, reject) =>
              setTimeout(() => reject(new Error('UI LLM budget exceeded')), 25_000),
            ),
          ]);
          const parsed = uiDesignSpecSchema.safeParse(raw);
          if (parsed.success) await persistSpec(projectId, agentId, parsed.data);
        } catch {
          // optional
        }
      })();
    }

    return { success: true, data: spec };
  } catch (err) {
    try {
      const fallback = buildHeuristicUiDesignSpec(ujw, feedback);
      await persistSpec(projectId, agentId, fallback);
      await prisma.agent.update({ where: { id: agentId }, data: { status: 'IDLE' } });
      return { success: true, data: fallback };
    } catch (fallbackErr) {
      await prisma.agent.update({ where: { id: agentId }, data: { status: 'ERROR' } });
      await logAIEvent('UID_DESIGN_FAILED', { projectId, error: String(err) }, agentId);
      return {
        success: false,
        error: {
          message:
            fallbackErr instanceof Error
              ? fallbackErr.message
              : err instanceof Error
                ? err.message
                : 'UI design failed',
          code: 'AI_ERROR',
        },
      };
    }
  }
}
