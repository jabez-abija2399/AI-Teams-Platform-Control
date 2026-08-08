import { prisma } from '@/lib/prisma';
import { requirementBuilderTool, featurePlannerTool, roadmapGeneratorTool } from './ceo.tools';
import { getMemoryManager } from '@/ai/agents/memory/memory.manager';
import { logAIEvent } from '@/ai/monitoring/ai.logger';
import { ceoAnalysisSchema, type CEOAnalysis } from './ceo.types';
import type { ApiResult } from '@/types/common.types';
import {
  resolveStackIntent,
  summarizeIntentForAgents,
} from '@/core/company-orchestration/stack-intent';
import { persistStackConstraints } from '@/core/memory/persist-stack-constraints';
import { pulseGenerationHeartbeat } from '@/core/company-orchestration/generation-status';

const CEO_ROLE_NAME = 'CEO AI';

async function getOrCreateCEOAgentId(): Promise<string> {
  const existing = await prisma.agent.findFirst({ where: { role: 'CEO' } });
  if (existing) return existing.id;
  const created = await prisma.agent.create({
    data: { name: CEO_ROLE_NAME, role: 'CEO', status: 'IDLE', capabilities: [] },
  });
  return created.id;
}

export function buildHeuristicCEOAnalysis(
  userIdea: string,
  revisionFeedback?: string,
): CEOAnalysis {
  const idea = (userIdea || 'Build a web application').trim();
  const feedback = (revisionFeedback || '').trim();
  const intent = resolveStackIntent(idea, feedback);
  const lower = `${idea}\n${feedback}`.toLowerCase();
  const isAuth =
    lower.includes('login') ||
    lower.includes('sign up') ||
    lower.includes('signup') ||
    lower.includes('auth');

  const features =
    intent.staticNoBackend || (intent.htmlCss && isAuth)
      ? [
          { name: 'Login page (HTML/CSS)', description: 'Static login.html' },
          { name: 'Sign up page (HTML/CSS)', description: 'Static signup.html' },
          { name: 'Home page (HTML/CSS)', description: 'Static home.html' },
        ]
      : isAuth
        ? [
            { name: 'Login', description: 'Email/password sign-in' },
            { name: 'Sign up', description: 'Create a new account' },
            { name: 'Protected home', description: 'Landing page after login' },
          ]
        : [
            { name: 'Core flow', description: idea.slice(0, 120) },
            { name: 'Data create/view', description: 'Basic CRUD for primary entities' },
            { name: 'Settings', description: 'Simple account or app settings' },
          ];

  const constraints = [
    ...intent.constraints,
    ...(feedback ? [`Respect user feedback: ${feedback}`] : ['Keep MVP scope tight']),
  ];

  return ceoAnalysisSchema.parse({
    vision: {
      problem: feedback || idea,
      solution: intent.staticNoBackend
        ? `Ship static HTML/CSS pages for: ${idea.slice(0, 120)}`
        : `Ship an MVP that delivers: ${idea.slice(0, 160)}`,
      targetUsers: [lower.includes('team') ? 'Small teams' : 'End users'],
      businessGoal: 'Validate the product with a working MVP',
    },
    requirements: {
      features,
      userStories: features.map((f) => ({
        as: 'a user',
        iWant: f.name.toLowerCase(),
        soThat: f.description,
        priority: 'HIGH',
      })),
      priorities: features.map((f) => f.name),
      constraints,
    },
    plan: {
      phases: [
        {
          name: 'MVP',
          goal: intent.label,
          tasks: features.map((f) => `Implement ${f.name}`),
        },
      ],
      tasks: features.map((f) => f.name),
      estimatedComplexity: isAuth || intent.htmlCss ? 'LOW' : 'MEDIUM',
      qualityScore: {
        completeness: 7,
        clarity: 8,
        feasibility: 8,
        overall: 8,
        verdict: 'APPROVED',
        notes: summarizeIntentForAgents(intent) || 'Lean strategy package for pipeline continuity',
      },
    },
    qualityScore: {
      completeness: 7,
      clarity: 8,
      feasibility: 8,
      overall: 8,
      verdict: 'APPROVED',
      notes: feedback || intent.label,
    },
  });
}

export async function analyzeUserIdea(
  projectId: string,
  userIdea: string,
): Promise<ApiResult<CEOAnalysis>> {
  const agentId = await getOrCreateCEOAgentId();

  await prisma.document.deleteMany({ where: { projectId, type: 'CEO_IN_PROGRESS' } });
  await prisma.document.create({
    data: { projectId, type: 'CEO_IN_PROGRESS', title: 'CEO Analysis In Progress', content: '{}', author: 'CEO AI' },
  });

  await prisma.agent.update({ where: { id: agentId }, data: { status: 'WORKING' } });
  await logAIEvent('CEO_ANALYSIS_STARTED', { projectId }, agentId);

  try {
    await pulseGenerationHeartbeat(projectId, {
      message: 'CEO is shaping product strategy…',
      phase: 'STRATEGY_RUNNING',
      department: 'Executive Strategy',
    });

    const memory = getMemoryManager();
    let analysis: CEOAnalysis;
    let usedHeuristic = false;

    try {
      const priorMemory = await memory.search(agentId, projectId, 5);
      const contextNote = priorMemory.length
        ? `Note prior decisions for this project:\n${priorMemory.map((m) => `- ${m.content}`).join('\n')}`
        : '';

      const ideaWithContext = contextNote ? `${userIdea}\n\n${contextNote}` : userIdea;

      const visionResult = await requirementBuilderTool.execute({
        userIdea: ideaWithContext,
        projectId,
        agentId,
      });
      if (!visionResult.success) throw new Error(visionResult.error || 'Vision builder failed');

      const requirementsResult = await featurePlannerTool.execute({
        vision: visionResult.data,
        projectId,
        agentId,
      });
      if (!requirementsResult.success) throw new Error(requirementsResult.error || 'Feature planner failed');

      const planResult = await roadmapGeneratorTool.execute({
        requirements: requirementsResult.data,
        projectId,
        agentId,
      });
      if (!planResult.success) throw new Error(planResult.error || 'Roadmap generator failed');

      analysis = ceoAnalysisSchema.parse({
        vision: visionResult.data,
        requirements: requirementsResult.data,
        plan: planResult.data,
        qualityScore: planResult.data.qualityScore,
      });
    } catch (aiErr) {
      console.warn('[CEO] AI analysis failed, falling back to heuristic:', aiErr);
      usedHeuristic = true;
      analysis = buildHeuristicCEOAnalysis(userIdea);
    }

    await persistStackConstraints(projectId, userIdea, analysis.requirements.constraints);

    await Promise.all([
      prisma.document.create({ data: { projectId, type: 'VISION', title: 'Product Vision', content: JSON.stringify(analysis.vision) } }),
      prisma.document.create({ data: { projectId, type: 'REQUIREMENTS', title: 'Product Requirements', content: JSON.stringify(analysis.requirements) } }),
      prisma.document.create({ data: { projectId, type: 'PLAN', title: 'Development Plan', content: JSON.stringify(analysis.plan) } }),
      memory.remember({ agentId, content: `Project ${projectId}: ${analysis.vision.problem} → ${analysis.vision.solution}`, type: 'PROJECT', metadata: { projectId } }),
    ]);

    await prisma.document.deleteMany({ where: { projectId, type: 'CEO_IN_PROGRESS' } });
    await prisma.agent.update({ where: { id: agentId }, data: { status: 'IDLE' } });
    await logAIEvent('CEO_ANALYSIS_COMPLETED', { projectId, fallback: usedHeuristic }, agentId);

    return { success: true, data: analysis };
  } catch (err) {
    await prisma.document.deleteMany({ where: { projectId, type: 'CEO_IN_PROGRESS' } });
    await prisma.agent.update({ where: { id: agentId }, data: { status: 'ERROR' } });
    await logAIEvent('CEO_ANALYSIS_FAILED', { projectId, error: String(err) }, agentId);
    return { success: false, error: { message: err instanceof Error ? err.message : 'CEO analysis failed', code: 'AI_ERROR' } };
  }
}

export async function getProductDocuments(projectId: string) {
  return prisma.document.findMany({
    where: { projectId, type: { in: ['VISION', 'REQUIREMENTS', 'PLAN'] } },
    orderBy: { createdAt: 'desc' },
  });
}
