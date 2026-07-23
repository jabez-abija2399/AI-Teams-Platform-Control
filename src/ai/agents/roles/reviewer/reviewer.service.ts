import { prisma } from '@/lib/prisma';
import { aiCall } from '@/ai/agents/core/ai-call';
import { getMemoryManager } from '@/ai/agents/memory/memory.manager';
import { logAIEvent } from '@/ai/monitoring/ai.logger';
import { reviewResultSchema, type ReviewResult } from './reviewer.types';
import { REVIEWER_SYSTEM_PROMPT } from './reviewer.prompt';
import { reviewerConfig } from './reviewer.config';
import { loadKnowledgeForAgent } from '@/ai/agents/core/knowledge-loader';
import type { ApiResult } from '@/types/common.types';

async function getOrCreateReviewerAgentId(): Promise<string> {
  const existing = await prisma.agent.findFirst({ where: { role: 'REVIEWER' } });
  if (existing) return existing.id;
  const created = await prisma.agent.create({
    data: { name: 'Reviewer AI', role: 'REVIEWER', status: 'IDLE', capabilities: ['ANALYSIS'] },
  });
  return created.id;
}

export async function reviewArtifact(
  projectId: string,
  artifactType: string,
  artifactContent: unknown,
): Promise<ApiResult<ReviewResult>> {
  const agentId = await getOrCreateReviewerAgentId();

  await prisma.agent.update({ where: { id: agentId }, data: { status: 'WORKING' } });
  await logAIEvent('REVIEW_STARTED', { projectId, artifactType }, agentId);

  try {
    const knowledge = loadKnowledgeForAgent('REVIEWER');
    const systemPrompt = `${REVIEWER_SYSTEM_PROMPT}${knowledge}`;

    const parsed = await aiCall<unknown>(
      `Review this ${artifactType} output:\n\n${JSON.stringify(artifactContent, null, 2)}\n\nProduce a reviewResult as JSON with keys: verdict (APPROVED/NEEDS_REVISION/REJECTED), score (1-10), issues (array of {severity, category, description, location?, suggestion}), strengths (array of strings), summary (string). Respond ONLY with valid JSON.`,
      systemPrompt,
      'REVIEWER',
      reviewerConfig,
      projectId,
      agentId,
    );

    const review = reviewResultSchema.parse(parsed);

    const memory = getMemoryManager();
    await Promise.all([
      prisma.document.create({
        data: {
          projectId,
          type: 'REVIEW_RESULT',
          title: `Review: ${artifactType}`,
          content: JSON.stringify(review),
          author: 'Reviewer AI',
        },
      }),
      memory.remember({
        agentId,
        content: `Project ${projectId} review of ${artifactType}: ${review.verdict} (score: ${review.score})`,
        type: 'PROJECT',
        metadata: { projectId },
      }),
    ]);

    await prisma.agent.update({ where: { id: agentId }, data: { status: 'IDLE' } });
    await logAIEvent('REVIEW_COMPLETED', { projectId, artifactType, verdict: review.verdict, score: review.score }, agentId);

    return { success: true, data: review };
  } catch (err) {
    await prisma.agent.update({ where: { id: agentId }, data: { status: 'ERROR' } });
    await logAIEvent('REVIEW_FAILED', { projectId, artifactType, error: String(err) }, agentId);
    return { success: false, error: { message: err instanceof Error ? err.message : 'Review failed', code: 'AI_ERROR' } };
  }
}
