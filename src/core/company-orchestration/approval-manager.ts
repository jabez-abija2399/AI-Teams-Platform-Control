import { prisma } from '@/lib/prisma';
import { CompanyEventBus } from '@/core/integration/event-bus';
import { recordTimelineEvent } from '@/features/ai-workspace/services/timeline.service';
import type { ApiResult } from '@/types/common.types';
import type { ApprovalGateType, ProjectLifecycleState } from './types';

export class ApprovalManager {
  /**
   * Requests a centralized approval gate.
   * Pauses the pipeline and records a pending approval in ApprovalHistory.
   */
  public static async requestApproval(
    projectId: string,
    approvalType: ApprovalGateType,
    phase: ProjectLifecycleState,
    artifactType?: string,
    artifactId?: string,
    requestedBy: string = 'SYSTEM',
  ): Promise<ApiResult<{ approvalId: string }>> {
    try {
      // Check if there is already a pending approval of this type
      const existing = await prisma.approvalHistory.findFirst({
        where: { projectId, approvalType, status: 'PENDING' },
      });
      if (existing) {
        return { success: true, data: { approvalId: existing.id } };
      }

      const approval = await prisma.approvalHistory.create({
        data: {
          projectId,
          approvalType,
          phase,
          artifactType,
          artifactId,
          status: 'PENDING',
          requestedBy,
        },
      });

      // Update ProjectWorkflowState to reflect waiting approval and paused state
      const state = await prisma.projectWorkflowState.findUnique({ where: { projectId } });
      if (state) {
        const waiting = Array.isArray(state.waitingApprovals) ? (state.waitingApprovals as string[]) : [];
        if (!waiting.includes(approvalType)) {
          waiting.push(approvalType);
        }
        await prisma.projectWorkflowState.update({
          where: { projectId },
          data: {
            currentPhase: 'PAUSED',
            waitingApprovals: waiting as any,
            nextAction: `Awaiting human executive decision for: ${approvalType}`,
          },
        });
      }

      await CompanyEventBus.publish(
        'APPROVAL_REQUESTED',
        projectId,
        { approvalId: approval.id, approvalType, phase, artifactType },
        'ApprovalManager',
      );

      await recordTimelineEvent({
        type: 'workflow.approval_requested',
        message: `⏸️ Pipeline paused: Awaiting ${approvalType}`,
        metadata: { projectId, approvalId: approval.id, approvalType, phase },
      });

      return { success: true, data: { approvalId: approval.id } };
    } catch (err: any) {
      console.error('[ApprovalManager] requestApproval error:', err);
      return {
        success: false,
        error: { message: err?.message || 'Failed to request approval', code: 'APPROVAL_REQUEST_FAILED' },
      };
    }
  }

  /**
   * Resolves a pending approval (APPROVED or REJECTED).
   * If APPROVED, removes the approval from waitingApprovals in ProjectWorkflowState.
   */
  public static async resolveApproval(
    projectId: string,
    approvalType: ApprovalGateType,
    status: 'APPROVED' | 'REJECTED',
    reviewedBy: string = 'Human Executive',
    comments?: string,
  ): Promise<ApiResult<{ approvalId: string; status: string }>> {
    try {
      const pending = await prisma.approvalHistory.findFirst({
        where: { projectId, approvalType, status: 'PENDING' },
      });

      if (!pending) {
        return {
          success: false,
          error: { message: `No pending approval found for ${approvalType}`, code: 'APPROVAL_NOT_FOUND' },
        };
      }

      const updated = await prisma.approvalHistory.update({
        where: { id: pending.id },
        data: {
          status,
          reviewedBy,
          comments,
        },
      });

      // Update ProjectWorkflowState waitingApprovals
      const state = await prisma.projectWorkflowState.findUnique({ where: { projectId } });
      if (state) {
        let waiting = Array.isArray(state.waitingApprovals) ? (state.waitingApprovals as string[]) : [];
        waiting = waiting.filter((a) => a !== approvalType);
        await prisma.projectWorkflowState.update({
          where: { projectId },
          data: {
            waitingApprovals: waiting as any,
          },
        });
      }

      await CompanyEventBus.publish(
        status === 'APPROVED' ? 'APPROVAL_GRANTED' : 'APPROVAL_REJECTED',
        projectId,
        { approvalId: updated.id, approvalType, status, reviewedBy, comments },
        'ApprovalManager',
      );

      await recordTimelineEvent({
        type: status === 'APPROVED' ? 'workflow.approved' : 'workflow.rejected',
        message: status === 'APPROVED' ? `✅ ${approvalType} granted by ${reviewedBy}` : `❌ ${approvalType} rejected by ${reviewedBy}`,
        metadata: { projectId, approvalId: updated.id, approvalType, status, comments },
      });

      return { success: true, data: { approvalId: updated.id, status } };
    } catch (err: any) {
      console.error('[ApprovalManager] resolveApproval error:', err);
      return {
        success: false,
        error: { message: err?.message || 'Failed to resolve approval', code: 'APPROVAL_RESOLVE_FAILED' },
      };
    }
  }

  /**
   * Retrieves all approval histories for a project.
   */
  public static async getApprovalHistory(projectId: string): Promise<ApiResult<any[]>> {
    try {
      const records = await prisma.approvalHistory.findMany({
        where: { projectId },
        orderBy: { createdAt: 'asc' },
      });
      return { success: true, data: records };
    } catch (err: any) {
      return { success: false, error: { message: err?.message || 'Failed to get approval history', code: 'APPROVAL_GET_FAILED' } };
    }
  }
}
