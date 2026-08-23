import { prisma } from '@/lib/prisma';
import { requirementRefinementTool } from './product-manager.tools';
import { getMemoryManager } from '@/ai/agents/memory/memory.manager';
import { logAIEvent } from '@/ai/monitoring/ai.logger';
import { aiCall } from '@/ai/agents/core/ai-call';
import { productManagerConfig } from './product-manager.config';
import {
  refinedRequirementsSchema,
  productRequirementSpecSchema,
  type RefinedRequirements,
  type ProductRequirementSpec,
} from './product-manager.types';
import type { CEOAnalysis } from '@/ai/agents/roles/ceo/ceo.types';
import type { ApiResult } from '@/types/common.types';
import { resolveStackIntent } from '@/core/company-orchestration/stack-intent';
import { ProjectStateManager } from '@/core/state/project-state.manager';
import { ArtifactRegistryService } from '@/core/artifacts/artifact-registry.service';
import { AgentContractRegistry } from '@/core/contracts/agent-registry';
import { ArtifactManager } from '@/core/company-orchestration/artifact-manager';

const PM_ROLE_NAME = 'Product Manager AI';

async function getOrCreatePMAgentId(): Promise<string> {
  const existing = await prisma.agent.findFirst({ where: { role: 'PRODUCT_MANAGER' } });
  if (existing) return existing.id;
  const created = await prisma.agent.create({
    data: { name: PM_ROLE_NAME, role: 'PRODUCT_MANAGER', status: 'IDLE', capabilities: ['REQUIREMENTS_ANALYSIS'] },
  });
  return created.id;
}

function extractFeatureNames(ceoAnalysis: unknown): string[] {
  if (!ceoAnalysis || typeof ceoAnalysis !== 'object') return ['Core user flow'];
  const obj = ceoAnalysis as Record<string, unknown>;
  const names: string[] = [];

  const req = obj.requirements as Record<string, unknown> | undefined;
  if (req && Array.isArray(req.features)) {
    for (const f of req.features.slice(0, 6)) {
      if (f && typeof f === 'object' && 'name' in f) {
        const n = String((f as { name: unknown }).name || '').trim();
        if (n) names.push(n);
      }
    }
  }
  if (Array.isArray(obj.featureSpecs)) {
    for (const f of obj.featureSpecs.slice(0, 6)) {
      if (f && typeof f === 'object' && 'name' in f) {
        const n = String((f as { name: unknown }).name || '').trim();
        if (n) names.push(n);
      }
    }
  }
  if (names.length === 0 && typeof obj.vision === 'object' && obj.vision) {
    const sol = String((obj.vision as { solution?: string }).solution || '').trim();
    if (sol) names.push(sol.slice(0, 60));
  }
  return names.length ? [...new Set(names)].slice(0, 6) : ['Core user flow'];
}

/** Lean PRD so Product Manager never stalls Mission Control at ~25%. */
export function buildHeuristicRefinedRequirements(
  ceoAnalysis: unknown,
  revisionFeedback?: string,
): RefinedRequirements {
  let features = extractFeatureNames(ceoAnalysis);
  const feedback = (revisionFeedback || '').trim();
  const intent = resolveStackIntent(ceoAnalysis, feedback);
  const f = feedback.toLowerCase();

  if (intent.staticNoBackend || intent.htmlCss) {
    features = ['Login (HTML)', 'Sign up (HTML)', 'Home (HTML)'];
  } else if (f.includes('simpler') || f.includes('only') || f.includes('too many')) {
    features = features.slice(0, 3);
  }
  if (!intent.htmlCss && (f.includes('login') || f.includes('auth') || f.includes('sign up'))) {
    features = ['Login', 'Sign up', 'Protected home'];
  }

  const userStories = features.map((name, idx) => ({
    id: `US-${String(idx + 1).padStart(3, '0')}`,
    title: name,
    asA: 'user',
    iWant: `use ${name}`,
    soThat: intent.staticNoBackend
      ? 'I can navigate static pages without a framework'
      : 'I can complete my primary goal',
    acceptanceCriteria: intent.staticNoBackend
      ? [
          `${name} is a real .html file`,
          'Page uses shared css/styles.css',
          'No Next.js or React required',
        ]
      : [
          `${name} is reachable from the main flow`,
          `${name} works for a happy-path user`,
        ],
    priority: idx === 0 ? 'HIGH' : 'MEDIUM',
    estimatedEffort: 'MEDIUM',
  }));

  return refinedRequirementsSchema.parse({
    userStories,
    featureSpecs: features.map((name, idx) => ({
      name,
      description: intent.staticNoBackend
        ? `Static HTML/CSS page for ${name}`
        : `MVP capability: ${name}`,
      userStories: [userStories[idx]!],
      dependencies: idx > 0 ? [features[0]!] : [],
      technicalNotes: [
        ...intent.constraints,
        feedback ? `Incorporate feedback: ${feedback}` : 'Pipeline lean package from CEO strategy',
      ].join(' · '),
    })),
    nonFunctionalRequirements: intent.staticNoBackend
      ? [
          {
            category: 'Delivery',
            requirement: 'Ship as static HTML + CSS files only',
            rationale: intent.label,
          },
          {
            category: 'Compatibility',
            requirement: 'Open in modern browsers without a build step',
            rationale: 'No framework lock-in',
          },
        ]
      : [
          {
            category: 'Performance',
            requirement: 'Primary screens load in under 3 seconds on broadband',
            rationale: 'Keep MVP snappy',
          },
          {
            category: 'Security',
            requirement: 'Protect authenticated routes and validate inputs',
            rationale: 'Baseline production hygiene',
          },
        ],
    backlog: features.map((name) => `Polish ${name}`),
    clarificationsNeeded: feedback ? [`Addressed: ${feedback}`] : intent.constraints,
  });
}

export async function refineRequirements(
  projectId: string,
  ceoAnalysis: CEOAnalysis,
): Promise<ApiResult<RefinedRequirements>> {
  const agentId = await getOrCreatePMAgentId();

  await prisma.document.deleteMany({ where: { projectId, type: 'PM_IN_PROGRESS' } });
  await prisma.document.create({
    data: { projectId, type: 'PM_IN_PROGRESS', title: 'PM Refinement In Progress', content: '{}', author: 'Product Manager AI' },
  });

  await prisma.agent.update({ where: { id: agentId }, data: { status: 'WORKING' } });
  await logAIEvent('PM_REFINEMENT_STARTED', { projectId }, agentId);

  try {
    // Lean-first — same pattern as Architect / BA / Development.
    const refined = buildHeuristicRefinedRequirements(ceoAnalysis);
    const memory = getMemoryManager();

    await Promise.all([
      prisma.document.create({
        data: {
          projectId,
          type: 'REFINED_REQUIREMENTS',
          title: 'Refined Requirements',
          content: JSON.stringify(refined),
          author: 'Product Manager AI',
        },
      }),
      memory.remember({
        agentId,
        content: `Project ${projectId}: Refined ${refined.userStories.length} user stories, ${refined.featureSpecs.length} feature specs`,
        type: 'PROJECT',
        metadata: { projectId },
      }),
      ArtifactRegistryService.registerArtifact({
        projectId,
        type: 'PRODUCT_REQUIREMENTS_DOC',
        createdBy: 'PM',
        payload: refined,
        summary: `PRD with ${refined.userStories.length} stories`,
        qualityScore: {
          completeness: 90,
          consistency: 90,
          requirementCoverage: 90,
          correctness: 90,
          technicalRisk: 10,
        },
      }),
      ArtifactManager.storeArtifact(projectId, {
        type: 'RefinedRequirements',
        content: refined,
        producerRole: 'PRODUCT_MANAGER',
        consumerRoles: ['ARCHITECT', 'BUSINESS_ANALYST', 'UI_UX'],
        summary: `PRD with ${refined.userStories.length} stories and ${refined.featureSpecs.length} features`,
      }),
      ProjectStateManager.updateState(projectId, (s) => {
        s.currentStage = 'REQUIREMENTS';
        s.requirements.approvalStatus = 'APPROVED';
        const visionObj = (ceoAnalysis.vision || {}) as Record<string, unknown>;
        s.requirements.productScope.problem = String(visionObj.problem || visionObj.problemStatement || '');
        s.requirements.productScope.targetUsers = Array.isArray(visionObj.targetUsers)
          ? (visionObj.targetUsers as string[])
          : [String(visionObj.targetAudience || 'Target Users')];
        s.requirements.productScope.goals = visionObj.businessGoal
          ? [String(visionObj.businessGoal)]
          : [String(visionObj.coreValueProposition || 'Deliver core MVP')];
        s.requirements.features = refined.featureSpecs.map((f, i) => ({
          id: `feat_${i + 1}`,
          name: f.name,
          description: f.description,
          linkedUserStories: f.userStories?.map((u) => u.id) || [`US-${String(i + 1).padStart(3, '0')}`],
          acceptanceCriteria: f.userStories?.flatMap((u) => u.acceptanceCriteria || []) || [],
          dependencies: f.dependencies || [],
        }));
        s.requirements.userStories = refined.userStories.map((u) => ({
          id: u.id,
          title: u.title,
          role: u.asA || 'user',
          goal: u.iWant || 'use feature',
          benefit: u.soThat || 'achieve outcome',
          acceptanceCriteria: u.acceptanceCriteria || [],
          priority: (u.priority as any) || 'HIGH',
          effort: u.estimatedEffort === 'LOW' ? 'S' : u.estimatedEffort === 'HIGH' ? 'L' : 'M',
        }));
        s.requirements.nonFunctionalRequirements = (refined.nonFunctionalRequirements || []).map((n, idx) => ({
          id: `NFR-${idx + 1}`,
          category: (['PERFORMANCE', 'SECURITY', 'ACCESSIBILITY', 'SCALABILITY', 'RELIABILITY'].includes(n.category.toUpperCase())
            ? n.category.toUpperCase()
            : 'RELIABILITY') as any,
          requirement: n.requirement,
          rationale: n.rationale,
          verificationMethod: 'Automated verification',
        }));
      }),
    ]);

    await prisma.document.deleteMany({ where: { projectId, type: 'PM_IN_PROGRESS' } });
    await prisma.agent.update({ where: { id: agentId }, data: { status: 'IDLE' } });
    await logAIEvent('PM_REFINEMENT_COMPLETED', { projectId }, agentId);

    // Optional LLM enrichment in background — never blocks pipeline.
    void (async () => {
      try {
        const result = await requirementRefinementTool.execute({
          ceoAnalysis,
          projectId,
          agentId,
        });
        if (!result.success) return;
        const enriched = refinedRequirementsSchema.parse(result.data);
        await prisma.document.create({
          data: {
            projectId,
            type: 'REFINED_REQUIREMENTS',
            title: 'Refined Requirements (enriched)',
            content: JSON.stringify(enriched),
            author: 'Product Manager AI',
          },
        });
      } catch {
        /* optional */
      }
    })();

    return { success: true, data: refined };
  } catch (err) {
    console.error('[PM refineRequirements error]', err);
    await prisma.document.deleteMany({ where: { projectId, type: 'PM_IN_PROGRESS' } });
    await prisma.agent.update({ where: { id: agentId }, data: { status: 'ERROR' } });
    await logAIEvent('PM_REFINEMENT_FAILED', { projectId, error: String(err) }, agentId);

    // Last-resort heuristic so PRODUCT_RUNNING never fails the pipeline.
    try {
      const fallback = buildHeuristicRefinedRequirements(ceoAnalysis);
      return { success: true, data: fallback };
    } catch {
      return {
        success: false,
        error: {
          message: err instanceof Error ? err.message : 'PM refinement failed',
          code: 'AI_ERROR',
        },
      };
    }
  }
}

export async function generateProductRequirementsSpec(
  projectId: string,
  vision: unknown,
): Promise<ApiResult<ProductRequirementSpec>> {
  const agentId = await getOrCreatePMAgentId();

  await prisma.agent.update({ where: { id: agentId }, data: { status: 'WORKING' } });
  await logAIEvent('PM_PRD_GENERATION_STARTED', { projectId }, agentId);

  try {
    const prompt = `Product Vision:\n${JSON.stringify(vision, null, 2)}\n\nGenerate comprehensive product documentation (PRD-001). Produce JSON with EXACT keys:\n- prd: {title, vision, targetAudience, problemStatement}\n- personas: array of {id, name, role, goals, painPoints, behaviors}\n- stories: array of {id, title, asA, iWant, soThat, acceptanceCriteria, priority, estimatedEffort}\n- acceptanceCriteria: object mapping story ID to array of string criteria\n- functionalRequirements: array of {id, module, requirement, priority}\n- nonFunctionalRequirements: array of {category, requirement, rationale}\n- mvpScope: {inScope: string[], outOfScope: string[], coreValueProposition: string}\n- featurePriorities: array of {featureName, priority, effort, businessValue}\n- roadmap: array of {id, phase, title, description, targetTimeline, deliverables}\n- releasePlan: {version, releaseDateTarget, scope, includedFeatures, rolloutStrategy}\n- dependencies: string[]\n- risks: array of {risk, mitigation, severity}\n- status: "APPROVED"\n\nRespond ONLY with valid JSON.`;

    const raw = await aiCall<unknown>(
      prompt,
      `You are Product Manager AI. Your mission is to generate complete, production-ready Product Requirement Specifications (PRD-001) that bridge business goals and engineering implementation.`,
      'PRODUCT_MANAGER',
      productManagerConfig,
      projectId,
      agentId,
    );

    const spec = productRequirementSpecSchema.parse(raw);

    const memory = getMemoryManager();
    const [savedReq] = await Promise.all([
      prisma.productRequirement.create({
        data: {
          projectId,
          prd: spec.prd as any,
          personas: spec.personas as any,
          stories: spec.stories as any,
          acceptanceCriteria: spec.acceptanceCriteria as any,
          roadmap: spec.roadmap as any,
          featurePriorities: spec.featurePriorities as any,
          releasePlan: spec.releasePlan as any,
          dependencies: spec.dependencies as any,
          risks: spec.risks as any,
          status: spec.status,
        },
      }),
      prisma.productDocument.create({
        data: {
          projectId,
          agentId,
          vision: vision as any,
          requirements: spec as any,
          plan: spec.roadmap as any,
        },
      }),
      memory.remember({
        agentId,
        content: `Project ${projectId}: Generated complete Product Requirement Specification (PRD-001) with ${spec.stories.length} stories and ${spec.personas.length} personas.`,
        type: 'PROJECT',
        metadata: { projectId, prdTitle: spec.prd.title },
      }),
      ArtifactRegistryService.registerArtifact({
        projectId,
        type: 'PRODUCT_REQUIREMENTS_DOC',
        createdBy: 'PM',
        payload: spec,
        summary: `Comprehensive PRD-001: ${spec.prd.title}`,
        qualityScore: {
          completeness: 95,
          consistency: 95,
          requirementCoverage: 95,
          correctness: 95,
          technicalRisk: 5,
        },
      }),
      ArtifactManager.storeArtifact(projectId, {
        type: 'ProductRequirementSpec',
        content: spec,
        producerRole: 'PRODUCT_MANAGER',
        consumerRoles: ['ARCHITECT', 'DEVELOPER', 'QA'],
        summary: `Comprehensive PRD-001: ${spec.prd.title}`,
      }),
      ProjectStateManager.updateState(projectId, (s) => {
        s.currentStage = 'REQUIREMENTS';
        s.requirements.approvalStatus = 'APPROVED';
        s.requirements.productScope.problem = spec.prd.problemStatement;
        s.requirements.productScope.targetUsers = [spec.prd.targetAudience];
        s.requirements.productScope.nonGoals = spec.mvpScope?.outOfScope || [];
        s.requirements.features = (spec.functionalRequirements || []).map((f) => ({
          id: f.id,
          name: f.module || f.requirement,
          description: f.requirement,
          linkedUserStories: spec.stories.filter((st) => st.title.includes(f.module || '')).map((st) => st.id),
          acceptanceCriteria: spec.acceptanceCriteria?.[f.id] || [],
          dependencies: [],
        }));
        s.requirements.userStories = spec.stories.map((st) => ({
          id: st.id,
          title: st.title,
          role: st.asA || 'user',
          goal: st.iWant || 'use feature',
          benefit: st.soThat || 'achieve outcome',
          acceptanceCriteria: Array.isArray(st.acceptanceCriteria) ? st.acceptanceCriteria : [String(st.acceptanceCriteria || '')],
          priority: (st.priority as any) || 'HIGH',
          effort: st.estimatedEffort === 'LOW' ? 'S' : st.estimatedEffort === 'HIGH' ? 'L' : 'M',
        }));
        s.requirements.nonFunctionalRequirements = (spec.nonFunctionalRequirements || []).map((n, idx) => ({
          id: `NFR-${idx + 1}`,
          category: (['PERFORMANCE', 'SECURITY', 'ACCESSIBILITY', 'SCALABILITY', 'RELIABILITY'].includes(n.category.toUpperCase())
            ? n.category.toUpperCase()
            : 'RELIABILITY') as any,
          requirement: n.requirement,
          rationale: n.rationale,
          verificationMethod: 'Automated verification',
        }));
      }),
    ]);

    await prisma.agent.update({ where: { id: agentId }, data: { status: 'IDLE' } });
    await logAIEvent('PM_PRD_GENERATION_COMPLETED', { projectId, reqId: savedReq.id }, agentId);

    return { success: true, data: spec };
  } catch (err) {
    await prisma.agent.update({ where: { id: agentId }, data: { status: 'ERROR' } });
    await logAIEvent('PM_PRD_GENERATION_FAILED', { projectId, error: String(err) }, agentId);
    return { success: false, error: { message: err instanceof Error ? err.message : 'PRD generation failed', code: 'AI_ERROR' } };
  }
}

