import { prisma } from '@/lib/prisma';
import { getMemoryManager } from '@/packages/agents/memory/memory.manager';
import { logAIEvent } from '@/ai/monitoring/ai.logger';
import { aiCall } from '@/packages/agents/core/ai-call';
import { businessAnalystConfig } from './business-analyst.config';
import { BUSINESS_ANALYST_SYSTEM_PROMPT } from './business-analyst.prompt';
import {
  softwareRequirementSpecSchema,
  type SoftwareRequirementSpec,
} from './business-analyst.types';
import type { ApiResult } from '@/types/common.types';
import { resolveStackIntent } from '@/core/company-orchestration/stack-intent';

const BA_ROLE_NAME = 'Business Analyst AI';

async function getOrCreateBAAgentId(): Promise<string> {
  const existing = await prisma.agent.findFirst({ where: { role: 'BUSINESS_ANALYST' } });
  if (existing) return existing.id;
  const created = await prisma.agent.create({
    data: {
      name: BA_ROLE_NAME,
      role: 'BUSINESS_ANALYST',
      status: 'IDLE',
      capabilities: ['BUSINESS_ANALYSIS', 'REQUIREMENTS_ANALYSIS', 'DOCUMENTATION'],
    },
  });
  return created.id;
}

function extractFeatures(prd: unknown): string[] {
  if (!prd || typeof prd !== 'object') return ['Core user flow'];
  const obj = prd as Record<string, unknown>;
  const candidates: string[] = [];

  const pushName = (item: unknown) => {
    if (typeof item === 'string' && item.trim()) candidates.push(item.trim());
    else if (item && typeof item === 'object' && 'name' in item) {
      const name = String((item as { name: unknown }).name || '').trim();
      if (name) candidates.push(name);
    } else if (item && typeof item === 'object' && 'title' in item) {
      const title = String((item as { title: unknown }).title || '').trim();
      if (title) candidates.push(title);
    }
  };

  for (const key of ['mvpFeatures', 'features', 'featureSpecs', 'userStories', 'requirements']) {
    const val = obj[key];
    if (Array.isArray(val)) val.slice(0, 8).forEach(pushName);
  }

  if (candidates.length === 0 && typeof obj.vision === 'string') {
    candidates.push(obj.vision.slice(0, 80));
  }

  return candidates.length ? [...new Set(candidates)].slice(0, 6) : ['Core user flow'];
}

/** Lean SRS so Analysis never blocks the pipeline when the LLM is slow/unavailable. */
export function buildHeuristicSoftwareRequirementSpec(
  prd: unknown,
  feedback?: string,
): SoftwareRequirementSpec {
  let features = extractFeatures(prd);
  const f = (feedback || '').toLowerCase();
  const intent = resolveStackIntent(prd, feedback);
  const htmlCss = intent.htmlCss || intent.staticNoBackend;

  if (intent.staticNoBackend || htmlCss) {
    features = [
      'HTML/CSS login page (login.html)',
      'HTML/CSS signup page (signup.html)',
      intent.staticNoBackend
        ? 'HTML/CSS home page (home.html)'
        : 'Protected home page after login',
    ];
  } else if (f.includes('simpler') || f.includes('only') || f.includes('too many')) {
    features = features.slice(0, 3);
  }

  if (f.includes('no social') || f.includes('remove social')) {
    features = features.filter((name) => !/social|google|oauth/i.test(name));
  }

  const productName =
    (prd && typeof prd === 'object' && 'productName' in prd
      ? String((prd as { productName?: string }).productName || '')
      : '') || 'Product';

  const functionalSpecs = features.map((name, idx) => ({
    id: `FS-${String(idx + 1).padStart(3, '0')}`,
    module: name,
    specification: intent.staticNoBackend
      ? `Deliver “${name}” as plain static HTML/CSS — no backend, no Next.js, no React.`
      : htmlCss
        ? `Deliver “${name}” as plain HTML/CSS (no Next.js/React) per user feedback.`
        : `The system shall support “${name}” as defined in the approved requirements.`,
    gherkinCriteria: `Given a user needs ${name}\nWhen they use the product\nThen the feature works as specified`,
  }));

  const spec = softwareRequirementSpecSchema.parse({
    srs: {
      title: `${productName} — Software Requirements`,
      version: 'v1.0.0',
      scope: intent.staticNoBackend
        ? `Static HTML/CSS only for ${productName} (no backend).`
        : htmlCss
        ? `MVP HTML/CSS login scope for ${productName}.`
        : `MVP scope for ${productName} based on the approved PRD.`,
      overview: feedback?.trim()
        ? `Revised per feedback: ${feedback.trim()}`
        : intent.constraints.join(' ') ||
          `Business analysis distilled ${features.length} requirements for implementation.`,
    },
    businessRules: [
      {
        id: 'BR-001',
        category: 'Access',
        rule: 'Users may only access features they are authorized for.',
        enforcement: 'Strict',
        errorCondition: 'Unauthorized access attempt',
      },
    ],
    processFlows: [
      {
        id: 'PF-001',
        name: 'Primary user flow',
        steps: features.slice(0, 4).map((feat, i) => `${i + 1}. ${feat}`),
      },
    ],
    useCases: features.slice(0, 3).map((name, idx) => ({
      id: `UC-${String(idx + 1).padStart(3, '0')}`,
      title: name,
      actor: 'End User',
      preconditions: ['User can reach the application'],
      mainFlow: [`User starts ${name}`, `System completes ${name}`],
      postconditions: [`${name} is completed successfully`],
    })),
    actors: [
      { name: 'End User', role: 'Primary actor', permissions: ['use_mvp'] },
    ],
    traceabilityMatrix: functionalSpecs.map((fs, idx) => ({
      prdStoryId: `US-${String(idx + 1).padStart(3, '0')}`,
      srsSpecId: fs.id,
      testCaseId: `TC-${String(idx + 1).padStart(3, '0')}`,
      coverageStatus: 'Planned',
    })),
    functionalSpecs,
    nonFunctionalSpecs: [
      { category: 'Reliability', metric: 'Uptime', target: '99%' },
      { category: 'Performance', metric: 'Page load', target: '< 3s' },
    ],
    edgeCases: [
      { scenario: 'Invalid input', expectedBehavior: 'Show clear validation errors' },
      { scenario: 'Session expired', expectedBehavior: 'Redirect to login when required' },
    ],
    validationRules: [{ field: 'required fields', rule: 'Must not be empty' }],
    riskAnalysis: [
      {
        risk: intent.staticNoBackend
          ? 'Users expect real auth on static demo pages'
          : htmlCss
            ? 'Insecure form posts without CSRF'
            : 'Scope creep beyond MVP',
        impact: 'Medium',
        mitigation: intent.staticNoBackend
          ? 'Label pages as static demo; add backend only when requested'
          : htmlCss
            ? 'Use server-side sessions and CSRF tokens'
            : 'Keep delivery limited to approved features',
      },
    ],
    dependencyMapping: [
      { source: 'PRD', target: 'SRS', nature: 'derives' },
      { source: 'SRS', target: 'Architecture', nature: 'feeds' },
    ],
    decisionTables: [],
    acceptanceMatrix: functionalSpecs.map((fs) => ({
      requirementId: fs.id,
      verificationMethod: 'Manual + automated tests',
      status: 'Pending',
    })),
    complexityEstimate: {
      overallEffort: features.length <= 4 ? 'LOW' : 'MEDIUM',
      criticalPath: features.slice(0, 3),
    },
    status: 'APPROVED',
  });

  return feedback?.trim()
    ? ({ ...spec, revisionNote: feedback.trim() } as SoftwareRequirementSpec & {
        revisionNote: string;
      })
    : spec;
}

async function persistSpec(
  projectId: string,
  agentId: string,
  spec: SoftwareRequirementSpec,
): Promise<string> {
  const savedSpec = await prisma.businessAnalystSpec.create({
    data: {
      projectId,
      srs: spec.srs as any,
      businessRules: spec.businessRules as any,
      processFlows: spec.processFlows as any,
      useCases: spec.useCases as any,
      actors: spec.actors as any,
      traceabilityMatrix: spec.traceabilityMatrix as any,
      functionalSpecs: spec.functionalSpecs as any,
      nonFunctionalSpecs: spec.nonFunctionalSpecs as any,
      edgeCases: spec.edgeCases as any,
      validationRules: spec.validationRules as any,
      riskAnalysis: spec.riskAnalysis as any,
      dependencyMapping: spec.dependencyMapping as any,
      decisionTables: spec.decisionTables as any,
      acceptanceMatrix: spec.acceptanceMatrix as any,
      complexityEstimate: spec.complexityEstimate as any,
      status: spec.status,
    },
  });

  const memory = getMemoryManager();
  await Promise.all([
    prisma.productDocument.create({
      data: {
        projectId,
        agentId,
        vision: { title: spec.srs.title, scope: spec.srs.scope } as any,
        requirements: spec as any,
        plan: spec.traceabilityMatrix as any,
      },
    }),
    memory.remember({
      agentId,
      content: `Project ${projectId}: Generated Software Requirement Specification (SRS-001) with ${spec.functionalSpecs.length} specs and ${spec.businessRules.length} rules.`,
      type: 'PROJECT',
      metadata: { projectId, srsTitle: spec.srs.title, specId: savedSpec.id },
    }),
  ]);

  return savedSpec.id;
}

export async function generateSoftwareRequirementSpec(
  projectId: string,
  prd: unknown,
  feedback?: string,
): Promise<ApiResult<SoftwareRequirementSpec>> {
  const agentId = await getOrCreateBAAgentId();

  await prisma.agent.update({ where: { id: agentId }, data: { status: 'WORKING' } });
  await logAIEvent('BA_SRS_GENERATION_STARTED', { projectId }, agentId);

  try {
    // Fast path: Analysis must not stall Mission Control waiting on models.
    // When regenerating, always bake feedback into the SRS.
    const spec = buildHeuristicSoftwareRequirementSpec(prd, feedback);
    const specId = await persistSpec(projectId, agentId, spec);

    // Best-effort enrichment only when there is no explicit revision lock
    if (!feedback?.trim()) {
      void (async () => {
        try {
          const prompt = `Approved PRD (summarize into a lean SRS):\n${JSON.stringify(prd, null, 2).slice(0, 6000)}\n\nProduce compact JSON with keys: srs {title,version,scope,overview}, businessRules[], processFlows[], useCases[], actors[], traceabilityMatrix[], functionalSpecs[], nonFunctionalSpecs[], edgeCases[], validationRules[], riskAnalysis[], dependencyMapping[], decisionTables[], acceptanceMatrix[], complexityEstimate {overallEffort,criticalPath}, status "APPROVED". Keep arrays short (max 5 items). Respond ONLY with valid JSON.`;
          const raw = await Promise.race([
            aiCall<unknown>(
              prompt,
              BUSINESS_ANALYST_SYSTEM_PROMPT,
              'BUSINESS_ANALYST',
              businessAnalystConfig,
              projectId,
              agentId,
            ),
            new Promise<never>((_, reject) =>
              setTimeout(() => reject(new Error('BA LLM budget exceeded')), 25_000),
            ),
          ]);
          const parsed = softwareRequirementSpecSchema.safeParse(raw);
          if (parsed.success) {
            await persistSpec(projectId, agentId, parsed.data);
          }
        } catch {
          // Enrichment is optional
        }
      })();
    }

    await prisma.agent.update({ where: { id: agentId }, data: { status: 'IDLE' } });
    await logAIEvent('BA_SRS_GENERATION_COMPLETED', { projectId, specId }, agentId);

    return { success: true, data: spec };
  } catch (err) {
    // Last resort — never block the company pipeline on analysis
    try {
      const fallback = buildHeuristicSoftwareRequirementSpec(prd, feedback);
      const specId = await persistSpec(projectId, agentId, fallback);
      await prisma.agent.update({ where: { id: agentId }, data: { status: 'IDLE' } });
      await logAIEvent(
        'BA_SRS_GENERATION_COMPLETED',
        { projectId, specId, fallback: true },
        agentId,
      );
      return { success: true, data: fallback };
    } catch (fallbackErr) {
      await prisma.agent.update({ where: { id: agentId }, data: { status: 'ERROR' } });
      await logAIEvent('BA_SRS_GENERATION_FAILED', { projectId, error: String(err) }, agentId);
      return {
        success: false,
        error: {
          message:
            fallbackErr instanceof Error
              ? fallbackErr.message
              : err instanceof Error
                ? err.message
                : 'SRS generation failed',
          code: 'AI_ERROR',
        },
      };
    }
  }
}
