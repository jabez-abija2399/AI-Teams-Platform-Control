import { prisma } from '@/lib/prisma';
import type { ApiResult } from '@/types/common.types';
import type { FeedbackEscalationInput, FeedbackEscalationResult } from './types';

export class ControlledFeedbackEngine {
  /**
   * Submits a structured upward feedback escalation from an agent down the chain to an upstream agent.
   */
  public static async escalateFeedback(
    input: FeedbackEscalationInput,
  ): Promise<ApiResult<FeedbackEscalationResult>> {
    try {
      // Find latest version of target artifact to increment for revision
      const existingArtifactsCount = await prisma.artifactLifecycleRecord.count({
        where: { projectId: input.projectId, artifactType: input.targetArtifactType },
      });
      const newVersion = existingArtifactsCount + 1;

      const record = await prisma.feedbackEscalationRecord.create({
        data: {
          projectId: input.projectId,
          fromAgentRole: input.fromAgentRole,
          toAgentRole: input.toAgentRole,
          issueType: input.issueType,
          description: input.description,
          targetArtifactType: input.targetArtifactType,
          targetVersion: newVersion,
          resolutionStatus: 'OPEN',
        },
      });

      // Record in company decision / memory stream for audit trail
      await prisma.activity.create({
        data: {
          userId: 'SYSTEM',
          action: 'FEEDBACK_ESCALATED',
          metadata: {
            projectId: input.projectId,
            from: input.fromAgentRole,
            to: input.toAgentRole,
            issueType: input.issueType,
            description: input.description,
            targetVersion: newVersion,
          },
        },
      }).catch(() => {});

      return {
        success: true,
        data: {
          id: record.id,
          projectId: record.projectId,
          fromAgentRole: record.fromAgentRole as any,
          toAgentRole: record.toAgentRole as any,
          issueType: record.issueType as any,
          description: record.description,
          targetArtifactType: record.targetArtifactType as any,
          targetVersion: record.targetVersion ?? newVersion,
          resolutionStatus: record.resolutionStatus as any,
          createdAt: record.createdAt,
        },
      };
    } catch (err: any) {
      console.error('[ControlledFeedbackEngine] escalateFeedback error:', err);
      return {
        success: false,
        error: { message: err?.message || 'Failed to escalate feedback', code: 'ESCALATION_FAILED' },
      };
    }
  }

  /**
   * Lists all escalations for a project.
   */
  public static async getEscalations(projectId: string): Promise<ApiResult<FeedbackEscalationResult[]>> {
    try {
      const records = await prisma.feedbackEscalationRecord.findMany({
        where: { projectId },
        orderBy: { createdAt: 'desc' },
      });

      const data: FeedbackEscalationResult[] = records.map((r) => ({
        id: r.id,
        projectId: r.projectId,
        fromAgentRole: r.fromAgentRole as any,
        toAgentRole: r.toAgentRole as any,
        issueType: r.issueType as any,
        description: r.description,
        targetArtifactType: r.targetArtifactType as any,
        targetVersion: r.targetVersion ?? 1,
        resolutionStatus: r.resolutionStatus as any,
        createdAt: r.createdAt,
      }));

      return { success: true, data };
    } catch (err: any) {
      return { success: false, error: { message: err?.message || 'Failed to get escalations', code: 'GET_ESCALATIONS_FAILED' } };
    }
  }

  /**
   * Resolves an open escalation.
   */
  public static async resolveEscalation(
    escalationId: string,
    status: 'RESOLVED' | 'REJECTED',
  ): Promise<ApiResult<void>> {
    try {
      await prisma.feedbackEscalationRecord.update({
        where: { id: escalationId },
        data: { resolutionStatus: status },
      });
      return { success: true, data: undefined };
    } catch (err: any) {
      return { success: false, error: { message: err?.message || 'Failed to resolve escalation', code: 'RESOLVE_FAILED' } };
    }
  }
}
