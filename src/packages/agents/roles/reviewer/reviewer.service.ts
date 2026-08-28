import { prisma } from '@/lib/prisma';
import { aiCall } from '@/packages/agents/core/ai-call';
import { getMemoryManager } from '@/packages/agents/memory/memory.manager';
import { getArtifactManager } from '@/packages/agents/artifacts/artifact.manager';
import { logAIEvent } from '@/ai/monitoring/ai.logger';
import { reviewResultSchema, type ReviewResult } from './reviewer.types';
import { REVIEWER_SYSTEM_PROMPT } from './reviewer.prompt';
import { reviewerConfig } from './reviewer.config';
import { loadKnowledgeForAgent } from '@/packages/agents/core/knowledge-loader';
import type { ApiResult } from '@/types/common.types';
import type { AgentRole } from '@/packages/agents/core/agent.types';

async function getOrCreateReviewerAgentId(role: AgentRole = 'REVIEWER'): Promise<string> {
  const existing = await prisma.agent.findFirst({ where: { role } });
  if (existing) return existing.id;
  const created = await prisma.agent.create({
    data: { name: `${role} AI`, role, status: 'IDLE', capabilities: ['ANALYSIS', 'QUALITY_REVIEW'] },
  });
  return created.id;
}

export interface ReviewArtifactOptions {
  authorRole?: string;
  reviewerRole?: AgentRole;
  documentId?: string;
}

export async function reviewArtifact(
  projectId: string,
  artifactType: string,
  artifactContent: unknown,
  options: ReviewArtifactOptions = {},
): Promise<ApiResult<ReviewResult>> {
  const reviewerRole = options.reviewerRole ?? 'REVIEWER';
  const authorRole = options.authorRole ?? 'UNKNOWN';

  // Enforce rule: Reviewer AI cannot approve its own work
  if (authorRole !== 'UNKNOWN' && authorRole === reviewerRole) {
    return {
      success: false,
      error: {
        message: `Security Violation: ${reviewerRole} cannot review or approve its own work (${authorRole}).`,
        code: 'SELF_REVIEW_FORBIDDEN',
      },
    };
  }

  const agentId = await getOrCreateReviewerAgentId(reviewerRole);

  await prisma.agent.update({ where: { id: agentId }, data: { status: 'WORKING' } }).catch(() => {});
  await logAIEvent('REVIEW_STARTED', { projectId, artifactType, reviewerRole, authorRole }, agentId);

  try {
    const knowledge = loadKnowledgeForAgent(reviewerRole);
    const systemPrompt = `${REVIEWER_SYSTEM_PROMPT}\n\n# Role Configuration:\nYou are acting as ${reviewerRole}. Review output created by ${authorRole}.\n# Strict Gate Rules:\n- You cannot approve work created by yourself.\n- Any output scoring below 8/10 MUST receive a verdict of NEEDS_REVISION or REJECTED.${knowledge}`;

    const parsed = await aiCall<unknown>(
      `Review this ${artifactType} output produced by ${authorRole}:\n\n${JSON.stringify(artifactContent, null, 2)}\n\nProduce a reviewResult as JSON with keys: verdict (APPROVED/NEEDS_REVISION/REJECTED), score (1-10), issues (array of {severity, category, description, location?, suggestion}), strengths (array of strings), summary (string). Respond ONLY with valid JSON.`,
      systemPrompt,
      reviewerRole,
      reviewerConfig,
      projectId,
      agentId,
    );

    let review = reviewResultSchema.parse(parsed);

    // Enforce mandatory quality gate: If quality score is < 8/10, step is rejected/sent back
    if (review.score < 8 && review.verdict === 'APPROVED') {
      review = {
        ...review,
        verdict: 'NEEDS_REVISION',
        issues: [
          ...review.issues,
          {
            severity: 'HIGH',
            category: 'Quality Gate',
            description: `Quality score (${review.score}/10) is below the mandatory 8/10 threshold for approval.`,
            suggestion: 'Refine deliverable to address all identified deficiencies and re-submit.',
          },
        ],
      };
    }

    const memory = getMemoryManager();
    const docTitle = `Review: ${artifactType} by ${reviewerRole}`;

    const [reviewDoc] = await Promise.all([
      prisma.document.create({
        data: {
          projectId,
          type: 'REVIEW_RESULT',
          title: docTitle,
          content: JSON.stringify(review),
          author: `${reviewerRole} AI`,
        },
      }),
      memory.remember({
        agentId,
        content: `Project ${projectId} review of ${artifactType} by ${reviewerRole}: verdict=${review.verdict} (score: ${review.score})`,
        type: 'PROJECT',
        metadata: { projectId, authorRole, reviewerRole, score: review.score },
      }),
    ]);

    if (options.documentId) {
      const artifactManager = getArtifactManager();
      await artifactManager.updateReviewerStatus(options.documentId, {
        reviewedBy: `${reviewerRole} AI`,
        verdict: review.verdict,
        score: review.score,
        reviewedAt: new Date(),
        notes: review.summary,
      });
    }

    await prisma.agent.update({ where: { id: agentId }, data: { status: 'IDLE' } }).catch(() => {});
    await logAIEvent('REVIEW_COMPLETED', { projectId, artifactType, verdict: review.verdict, score: review.score, reviewDocId: reviewDoc.id }, agentId);

    return { success: true, data: review };
  } catch (err) {
    await prisma.agent.update({ where: { id: agentId }, data: { status: 'ERROR' } }).catch(() => {});
    await logAIEvent('REVIEW_FAILED', { projectId, artifactType, error: String(err) }, agentId);
    return { success: false, error: { message: err instanceof Error ? err.message : 'Review failed', code: 'AI_ERROR' } };
  }
}
